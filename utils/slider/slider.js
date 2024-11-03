room.registerElement('slider', {
  clicking: false,
  value: 1,
  min: 0,
  max: 1,
  length: 1,
  width: .25,
  height: .2,
  showbase: true,
  track_id: 'cube',
  track_scale: V(.9, .25, .2),
  track_rotation: V(0),
  track_col: '.02 .02 .02',
  handle_id: 'cube',
  handle_scale: V(.25, .25, .75),

  onbegin:  false,
  onchange: false,
  onend:    false,

  create: function() {
    this.base = this.createObject('Object', {
      id: (this.showbase ? 'cube' : null),
      collision_id: (this.showbase ? 'cube' : null),
      col: V(.6,.6,.6),
      scale: V(this.length,this.height/2,this.width),
      pos: V(0,this.height/4,0)
    });
/*
    this.track = this.createObject('Object', {
      id: 'cube',
      collision_id: 'cube',
      col: V(.02,.02,.02),
      scale: V(this.length * .9, this.height / 4, this.width / 5),
      pos: V(0, this.base.pos.y + this.height / 4,0)
    });
*/
    this.track = this.createObject('Object', {
      id: this.track_id,
      collision_id: this.track_id,
      col: this.track_col,
      rotation: this.track_rotation,
      scale: V(this.length * this.track_scale.x, this.height * this.track_scale.y, this.width * this.track_scale.z),
      collision_scale: V(1, 5, 1),
      pos: V(0, this.base.pos.y + this.height / 4,0)
    });
    this.handle = this.createObject('Object', {
      id: 'sphere',
      collision_id: 'sphere',
      col: this.col.clone(),
      scale: V(this.width * this.handle_scale.x, this.height * this.handle_scale.y, this.width * this.handle_scale.z),
      pos: V(0,this.base.pos.y,0)
    });
    this.sounds = {
      clickin:  this.createObject('Sound', { id: 'pushbutton-click-in', }),
      clickon:  this.createObject('Sound', { id: 'pushbutton-click-on', }),
      clickoff: this.createObject('Sound', { id: 'pushbutton-click-off', }),
    };

    this.handle.addEventListener('mousedown', this.onMouseDown);
    this.track.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('wheel', this.onMouseWheel);
    // FIXME - bind these in mousedown, for maximum efficiency
    room.addEventListener('mouseup', this.onMouseUp);
    room.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchend', this.onMouseUp);
    window.addEventListener('touchmove', this.onMouseMove);
    this.handle.addEventListener('click', this.onClick);

    this.setValue(this.value);
  },
  setValue: function(value, skipchange) {
    if (!this.base) return;
    let max = this.max,
        min = this.min;
    var realvalue = Math.min(max, Math.max(min, value));
    var percent = realvalue / (max - min);
    var pos = (percent - .5) * this.length * this.track_scale.x;

    let handle = this.handle;

    handle.pos.set(pos, this.base.pos.y + this.height * 3 / 8 , 0);
    handle.sync = true;

    this.value = realvalue;

    /*
    if (this.onchange && !skipchange) {
      this.executeCallback(this.onchange);
    }
    */
    if (!skipchange) {
      this.dispatchEvent({type: 'change', data: realvalue});
    }
  },
  updateValueFromCursorPos: function(ev) {
    //var sliderpos = this.parent.localToWorld(this.pos.clone());
    var sliderpos = this.localToWorld(V(0));
    let hasInputSource = ev && ev.inputSourceObject;
    var inputpos = (hasInputSource ? ev.inputSourceObject.pointer.localToWorld(V(0)) : player.head_pos),
        intersectpos = ev.data.point || player.cursor_pos; //(hasInputSource ? ev.data.point : player.cursor_pos);
//console.log(ev.data.point);
    var dist = inputpos.distanceTo(sliderpos);
    // Cast a ray from my head to the cursor position
    var dir = V(intersectpos.x - inputpos.x, intersectpos.y - inputpos.y, intersectpos.z - inputpos.z);

    // Then project the ray into the same plane as the slider I'm manipulating
    var pos = translate(inputpos, scalarMultiply(normalized(dir), dist));
    this.worldToLocal(pos);

    // The slider position is now determined based on the x position (left/right) in the slider's own coordinate system, and the length of the slider
    var foo = pos.x / (this.length * this.track_scale.x) + .5;

    this.setValue(foo * (this.max - this.min));
  },
  onMouseDown: function(ev) {
    this.clicking = ev.inputSourceObject || true;
    this.dispatchEvent({type: 'begin'});
    this.updateValueFromCursorPos(ev);
    this.sounds.clickin.play();
    //if (this.onbegin) this.executeCallback(this.onbegin);
    ev.preventDefault();
    ev.stopPropagation();
  },
  onMouseMove: function(ev) {
    if (this.clicking === true || this.clicking === ev.inputSourceObject) {
//console.log('my hit', ev.data);
      this.updateValueFromCursorPos(ev);
      ev.stopPropagation();
    }
  },
  onMouseUp: function(ev) {
    if (this.clicking) {
      this.clicking = false;
      this.sounds.clickoff.play();
      //if (this.onend) this.executeCallback(this.onend);
      this.updateValueFromCursorPos(ev);
      this.dispatchEvent({type: 'end'});
      ev.stopPropagation();
    }
  },
  onMouseWheel: function(ev) {
    let movescale = (this.max - this.min) / (ev.shiftKey ? 100 : 25);
    this.setValue(this.value + (ev.deltaY < 0 ? movescale : -movescale));
  },
  onClick: function(ev) {
  }
  
});

