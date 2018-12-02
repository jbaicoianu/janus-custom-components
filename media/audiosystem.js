/**
 * AudioNode
 * An audio node represents a configurable node in the audio graph.  It defines 
 * a number of inputs, performs some processing on that data, and then sends
 * the result through its output nodes.  This is the base class for all other
 * nodes.
 */

room.registerElement('AudioNode', {
  inputs: {},
  outputs: {},

  create() {
    this.node = this.createObject('object', {
      id: 'cube',
      col: V(0,1,0),
      scale: V(.5, .5, .05),
      pos: V(0, .25, 0)
    });
    this.initIO();
    this.updateLayout();
  }

  connect(node, outputname) {
  },
  initIO() {
  },
  updateLayout() {
    var i = 0,
        height = .1,
        offset = .4;

    for (var k in this.inputs) {
      this.inputs[k].properties.position.y = (i * -height) + offset;
      i++;
    }
    i = 0;
    for (var k in this.outputs) {
      this.outputs[k].properties.position.y = (i * -height) + offset;
      i++;
    }
  }
  defineInput(name, type) {
    if (!this.inputs[name]) {
      this.inputs[name] = this.createObject('AudioNodeInput', {
        connectorname: name,
        node: this,
        pos: V(-.275,.2,0)
      });
    }
    return this.inputs[name];
  },
  defineOutput(name, type, value) {
    if (!this.outputs[name]) {
      this.outputs[name] = this.createObject('AudioNodeOutput', {
        connectorname: name,
        node: this,
        value: value,
        pos: V(.275,.2,0)
      });
    }
    return this.outputs[name];
  }
  createLabel(text) {
    var label = this.createObject('text', {
      text: text,
      col: V(1,1,1),
      pos: 0, .45, .055)
    });
  }
  show() {
    this.visible = true;
  }
  hide() {
    this.visible = false;
    this.position.y = -9999;
  }
});


/**
 * NodeConnector 
 * Represents an input or output socket for a node
 */
room.registerElement('AudioNodeConnector', {
  connectortype: 'unspecified',
  connectorname: null,
  node: null,
  value: null,

  create() {
    this.obj = this.createObject('object', {
      id: 'cube',
      scale: V(.05),
      col: V(.8,0,0)
    });
    this.addEventListener('mouseover', (ev) => this.handleMouseOver(ev));
    this.addEventListener('mouseout', (ev) => this.handleMouseOut(ev));
    this.addEventListener('mousedown', (ev) => this.handleMouseDown(ev));
    this.addEventListener('mouseup', (ev) => this.handleMouseUp(ev));
    this.addEventListener('click', (ev) => this.handleClick(ev));
    this.updateColor();
  },
  getValue() {
    if (typeof this.value == 'function') {
      return this.value();
    }
    return this.value;
  },
  updateColor(skipother) {
    var color = 0x990000;
    if (this.cable) {
      if (this.cable.start && this.cable.end) {
        color = 0x00ff00;
        if (!skipother) {
          if (this.cable.start === this) this.cable.end.updateColor(true);
          if (this.cable.end === this) this.cable.start.updateColor(true);
        }
      } else {
        color = 0xffff00;
      }
    }
    this.material.color.setHex(color);
  },
  handleMouseOver(ev) {
    var cable = audioState.activeAudioCable;
    if (cable) {
      if (cable.start.connectortype != this.connectortype) {
        cable.end = this;
      }
    }
    this.updateColor();
  },
  handleMouseOut(ev) {
    this.material.color.setHex(0x990000);
    var cable = audioState.activeAudioCable;
    if (cable) {
      cable.end = false;
    }
    this.updateColor();
  },
  handleMouseDown(ev) {
    var cable = audioState.activeAudioCable;
    this.material.color.setHex(0x990000);
    if (cable) {
      if (cable.start.connectortype != this.connectortype) {
        this.cable = cable;
        cable.end = this;
        audioState.activeAudioCable = false;
        elation.events.fire({type: 'connect', element: this.cable.start, data: this.cable.end});
        elation.events.fire({type: 'connect', element: this.cable.end, data: this.cable.start});
        cable.attached = true;
      }
    } else {
      this.cable = audioState.activeAudioCable = this.spawn('ReactiveAudioCable', null, {start: this}, true);
      this.material.color.setHex(0x00ff00);
    }
    this.updateColor();
  },
  handleClick(ev) {
  },
});

/**
 * NodeInput 
 * Represents an node Input socket
 */
room.extendElement('AudioNodeConnector', 'AudioNodeInput', {
  connectortype: 'input'
});

/* NodeOutput */
room.extendElement('AudioNodeConnector', 'AudioNodeOutput', {
  connectortype: 'output'
});

elation.component.add('engine.things.ReactiveAudioCable', {
  audiocontrols: false,
  postinit: function() {
    elation.engine.things.ReactiveAudioCable.extendclass.postinit.call(this);

    if (!this.audiocontrols) {
console.log('INIT AUDIOCONTROLS');
      this.audiocontrols = {
        'null': false,
        'gain': room._target.spawn('ReactiveAudioGainNode', null, {visible: false}),
        'stereosplitter': room._target.spawn('ReactiveAudioStereoSplitterNode', null, {visible: false}),
        'surroundsplitter': room._target.spawn('ReactiveAudioSurroundSplitterNode', null, {visible: false}),
        'lowpass': room._target.spawn('ReactiveAudioLowpassFilterNode', null, {visible: false}),
        'bandpass': room._target.spawn('ReactiveAudioBandpassFilterNode', null, {visible: false}),
        'highpass': room._target.spawn('ReactiveAudioHighpassFilterNode', null, {visible: false}),
        'spectrum': room._target.spawn('ReactiveAudioSpectrumViewerNode', null, {visible: false}),
        'output': room._target.spawn('ReactiveAudioOutputNode', null, {visible: false}),
        'positionaloutput': room._target.spawn('ReactiveAudioPositionalOutputNode', null, {visible: false}),
        'material': room._target.spawn('ReactiveAudioMaterialNode', null, {visible: false}),
        'light': room._target.spawn('ReactiveAudioLightNode', null, {visible: false}),
        'color': room._target.spawn('ReactiveAudioColorNode', null, {visible: false}),
      };
    }
    this.defineProperties({
      start: { type: 'object' },
      end: { type: 'object' },
    });

    this.startpos = new THREE.Vector3();
    this.endpos = new THREE.Vector3();

    elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.update));
    elation.events.add(this, 'mouseover', elation.bind(this, this.handleMouseOver));
    elation.events.add(this, 'mouseout', elation.bind(this, this.handleMouseOut));
    elation.events.add(this, 'click', elation.bind(this, this.handleClick));

    this.controllist = Object.keys(this.audiocontrols);
    this.activecontrol = 0;
    this.activeinput = 0;
    this.attached = false;

    this.controlstate = this.engine.systems.controls.addContext('audiocable', {
      'control_next': ['keyboard_e', elation.bind(this, this.showNextControl)],
      'control_prev': ['keyboard_q', elation.bind(this, this.showPrevControl)],
      'input_next': ['keyboard_r', elation.bind(this, this.selectNextInput)],
      'input_prev': ['keyboard_f', elation.bind(this, this.selectPrevInput)],
      'cancel': ['keyboard_esc', elation.bind(this, this.cancel)],
    });
  },
  createObject3D: function() {
    var obj = new THREE.Mesh(new THREE.CubeGeometry(.01, .01, 1), new THREE.MeshPhongMaterial({color: 0x333333}));
    obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,.5));
    this.material = obj.material;
    return obj;
  },
  update: function() {
    if (this.start) {
      this.start.objects.dynamics.localToWorldPos(this.startpos.set(0,0,0));
    } else {
      this.startpos.copy(player.view_dir).multiplyScalar(1.5).add(player.pos).add(V(0,1.6,0));
    }

    if (this.end) {
      this.end.localToWorld(this.endpos.set(0,0,0));
    } else {
      this.endpos.copy(player.view_dir).multiplyScalar(1.5).add(player.pos).add(V(0,1.6,0));
    }

    if (this.attached) {
      if (this.controlsActive) {
        this.engine.systems.controls.deactivateContext('audiocable', this);
        this.controlsActive = false;
      }
    } else {
      if (!this.controlsActive) {
        this.engine.systems.controls.activateContext('audiocable', this);
        this.controlsActive = true;
      }
    }

    var diff = new THREE.Vector3();
    diff.subVectors(this.endpos, this.startpos);
    var len = diff.length();
    this.scale.z = len;
    this.properties.position.copy(this.startpos);
    diff.normalize();

    //this.zdir = diff;
    this.objects['3d'].lookAt(this.endpos);

    if (this.activecontrol) {
      var control = this.audiocontrols[this.controllist[this.activecontrol]];
      control.properties.position.copy(this.endpos);

      var inputname = Object.keys(control.inputs)[this.activeinput],
          input = control.inputs[inputname];
      if (input) {
        control.properties.position.sub(input.position);
      } else {
        console.log('dur?', control, inputname, input);
      }
    }
  },
  attach: function(which, connector, temp) {
  },
  cut: function() {
    elation.events.fire({type: 'disconnect', element: this.start});
    elation.events.fire({type: 'disconnect', element: this.end});
    this.die();
  },
  handleMouseOver: function(ev) {
    if (this.start && this.end) {
      this.material.color.setHex(0x990000);
    }
  },
  handleMouseOut: function(ev) {
    if (this.start && this.end) {
      this.material.color.setHex(0x000000);
    }
  },
  handleClick: function(ev) {
    if (this.start && this.end) {
      this.cut();
    }
  },
  getActiveControl: function() {
    return this.audiocontrols[this.controllist[this.activecontrol]];
  },
  setActiveControl: function(controlid) {
    if (this.activecontrol) {
      var currentcontrol = this.getActiveControl();
      if (currentcontrol) currentcontrol.hide();
    }
    var controlname = this.controllist[controlid];
    this.activecontrol = controlid;
    this.activeinput = 0;

    var newcontrol = this.getActiveControl();
    if (newcontrol) newcontrol.show();
  },
  showNextControl: function(ev) {
    if (ev.value == 1) {
      var controlid = (this.activecontrol + 1) % this.controllist.length;
      console.log('next guy', controlid, this.controllist[controlid]);
      this.setActiveControl(controlid);
    }
  },
  showPrevControl: function(ev) {
    if (ev.value == 1) {
      var controlid = (this.activecontrol + this.controllist.length - 1) % this.controllist.length;
      console.log('prev guy', controlid, this.controllist[controlid]);
      this.setActiveControl(controlid);
    }
  },
  selectNextInput: function(ev) {
    if (ev.value == 1) {
      var control = this.getActiveControl();
      if (control) {
        var numinputs = Object.keys(control.inputs).length;
        this.activeinput = (this.activeinput + numinputs - 1) % numinputs;
      }
    }
  },
  selectPrevInput: function(ev) {
    if (ev.value == 1) {
      var control = this.getActiveControl();
      if (control) {
        var numinputs = Object.keys(control.inputs).length;
        this.activeinput = (this.activeinput + 1) % numinputs;
      }
    }
  },
  cancel: function(ev) {
    audioState.activeAudioCable = false;
    this.setActiveControl(0);
    this.cut();
  },

}, elation.engine.things.janusbase);

