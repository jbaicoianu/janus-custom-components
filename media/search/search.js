/* TODO - needs fixing before event:
 * - VR roomscale alignment is way off
 * - Leap Motion alignment is off in roomscale
 * - Grabbing needs fixing
 * - Crate bounds are incorrect unless at +90 degree angle (negative is flipped, otherwise it's skewed)
 * - Filter out incorrect item types (mp4 for audio, etc)
 * - Using cursor_object based method of detecting active player.  Use object.raycast() instead
 */

room.registerElement('archivecollection', {
  keyboardoffset: V(0, 1.5, -.35),
  collectionname: null,
  itemtype: null,
  count: 20,

  create() {
    // FIXME - hack to enable leap motion for this demo, and hide tracked controllers
    janus.engine.systems.controls.settings.leapmotion.enabled = true;
    player.tracker.controllers.forEach(n => { console.log(n);n.model.parent.remove(n.model); })
    console.log('new archive search');
    /*
    this.keyboard = this.createObject('keyboard', {
      ydir: V(0, .845, .535)
    });
    this._target.remove(this.keyboard._target);
    this.input = this.keyboard.createObject('keyboard_input', {
      pos: V(0, .25, -.1),
      size: .04,
      width: 10
    });
    this.input.addEventListener('focus', (ev) => this.handleInputFocus(ev));
    this.input.addEventListener('blur', (ev) => this.handleInputBlur(ev));
    this.input.addEventListener('change', (ev) => this.handleInputChange(ev));
    this.input.addEventListener('accept', (ev) => this.handleInputAccept(ev));
    */

    //this.input.focus();

    this.collection = elation.elements.create('collection-jsonapi', {
      append: this,
      host: 'https://p.janusvr.com/',
      endpoint: 'https://archive.org/advancedsearch.php',
      apiargs: {
        'q': 'collection:' + this.collectionname,
        'output': 'json',
        'rows': this.count,
        'sort[]': 'downloads',
      },
      datatransform: {
        items: (d) => {
          return d.response.docs;
        }
      }
    });
    //console.log('my collection', this.collection);

    this.list = this.createObject('archivecontainer', {
      collection: this.collection,
      itemtype: this.itemtype,
      pos: V(0, 0, 0),
      count: this.count
    });
      this.rotation = V(0, 0, 0);
    setTimeout((ev) => {
      this.rotation = V(0, -45, 0);
    }, 2000);

    //elation.events.add(this.collection, 'collection_load', (ev) => console.log('loaded!', ev))
    this.collection.load();

    /*
    setTimeout(() => {
      player.appendChild(this.keyboard);
    }, 10000);
    */
  },
  handleInputFocus(ev) {
    this.keyboard.setActiveElement(this.input);
  },
  handleInputBlur(ev) {
    this.keyboard.setActiveElement(null);
  },
  handleInputChange(ev) {
    console.log('input changed', ev.data);
    //https://archive.org/details/hiphopmixtapes?output=json&sort=-downloads&page=5&scroll=1
  },
  handleInputAccept(ev) {
    console.log('input accepted', ev.data);
  },
  update() {
    if (this.keyboard) {
      this.keyboard.pos = player.localToWorld(this.keyboardoffset.clone());
      this.keyboard.zdir = player.dir;
      let visible = this.keyboard.parent;
      if (this.keyboard.parent && !this.keyboard.activeelement) {
        this._target.remove(this.keyboard._target);
      } else if (!this.keyboard.parent && this.keyboard.activeelement) {
        this._target.add(this.keyboard._target);
      }
    }
  },
});
room.registerElement('keyboard_input', {
  size: .2,
  width: 64,
  value: '',
  selectionStart: 0,
  selectionEnd: 0,
  focused: false,

  create() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 2048;
    this.canvas.height = 128;

    this.addEventListener('keypress', (ev) => this.handleKeypress(ev));

    room.loadNewAsset('image', {
      id: this.name + '_texture',
      canvas: this.canvas
    });
    this.inputbox = this.createObject('object', {
      id: 'plane',
      collision_id: 'cube',
      col: V(1, 1, 1),
      scale: V(this.size * this.width, this.size, .1),
      image_id: this.name + '_texture'
    });
    let ctx = this.canvas.getContext('2d');
    let scale = this.canvas.width / (this.size * this.width) / 2048;
    ctx.scale(scale, 1);
    this.updateCanvas();
    this.caretblink = false;
    setInterval(() => {
      this.caretblink = !this.caretblink;
      this.updateCanvas();
    }, 500);
    this.addEventListener('click', (ev) => this.focus());
  },
  handleKeypress(ev) {
    let oldvalue = this.value;
    if (ev.data == 'BKSP') {
      this.value = this.value.substr(0, this.selectionStart - 1) + this.value.substr(this.selectionEnd, this.value.length);
      this.selectionStart = this.selectionEnd = this.value.length;
    } else if (ev.data == 'SPACE') {
      this.value += ' ';
      this.selectionStart = this.selectionEnd = this.value.length;
    } else if (ev.data == 'ENTER') {
      this.dispatchEvent({type: 'accept', data: this.value});
    } else {
      this.value += ev.data;
      this.selectionStart = this.selectionEnd = this.value.length;
    }
    if (this.value != oldvalue) {
      this.updateCanvas();
      this.dispatchEvent({type: 'change', data: this.value});
    }
  },
  updateCanvas() {
    let ctx = this.canvas.getContext('2d');
    ctx.fillStyle = (this.focused ? '#ffffff' : '#cccccc');
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '128px sans-serif';
    ctx.fillText(this.value, 0, 100);

    let precaret = ctx.measureText(this.value.substr(0, this.selectionStart));
    if (this.caretblink) {
      ctx.fillRect(precaret.width, 0, 2, 128);
    }

    elation.events.fire({element: this.canvas, type: 'update'});
    this._target.refresh();
  },
  focus() {
    this.focused = true;
    this.dispatchEvent({type: 'focus'});
  },
  blur() {
    this.focused = false;
    this.dispatchEvent({type: 'blur'});
  }
});
room.registerElement('keyboard', {
  size: .04,
  create() {
    this.keys = {};

    let keys = '1234567890-+B\n qwertyuiop[]\\\n  asdfghjkl;\'E\n   zxcvbnm,./U\n       S';
    let row = 0,
        col = 0,
        fontscale = .6,
        margin = 1.1,
        offset = .2;
    /*
    this.createObject('object', {
      id: 'sphere',
      cull_face: 'none',
      scale: V(4,4,4),
      col: V(0,0,1)
    });
    */
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let keyargs = false;

      if (key == '\n') {
        row += 1;
        col = 0;
      } else if (key == ' ') {
        col += .5;
      } else if (key == 'B') {
        keyargs = {
          key: 'BKSP'
        };
      } else if (key == 'E') {
        keyargs = {
          key: 'ENTER',
          width: 3
        };
      } else if (key == 'S') {
        keyargs = {
          key: 'SPACE',
          width: 5
        };
      } else {
        keyargs = {
          key: key,
          width: 1
        };
      }
      if (keyargs) {

        let width = keyargs.width || 1;
        let x = (col + width/2) * this.size * margin - offset,
            y = -row * this.size * margin,
            lat = (x * 100) * Math.PI / 180,
            lon = (y * 100) * Math.PI / 180,
            radius = .5;
        keyargs.pos = V(x, y, 0);
        keyargs.size = this.size;
        this.keys[key] = this.createObject('keyboard_key', keyargs);
        this.keys[key].addEventListener('press', (ev) => this.handleKeyPress(ev));
        col += this.keys[key].width;
      }
    }
  },
  handleKeyPress(ev) {
    console.log('a key was pressed', ev.data, ev);
    if (this.activeelement) {
      this.activeelement.dispatchEvent({type: 'keypress', data: ev.data});
    }
    this.dispatchEvent({type: 'keypress', data: ev.data});
  },
  setActiveElement(element) {
    if (this.activeelement) {
      // cleanup necessary?
    }
    this.activeelement = element;
  }
});
room.registerElement('keyboard_key', {
  key: false,
  size: .1,
  width: 1,

  create() {
    this.keycap = this.createObject('object', {
      id: 'cube',
      scale: V(this.size * this.width, this.size, this.size / 4),
      collision_id: 'cube',
      collision_scale: V(this.size * this.width, this.size, this.size)
    });
    let keylabel = this.createObject('text', {
      text: this.key,
      text_scale: false,
      scale: V(this.size * .8),
      col: 'black',
      pos: V(0, -((this.size * .8) / 2), this.size / 8),
      collidable: false,
      pickable: false,
      collision_scale: V(0),
      collision_id: ''
    });
    this.keycap.addEventListener('mousedown', (ev) => this.handleMousedown(ev));
    this.keycap.addEventListener('mouseup', (ev) => this.handleMouseup(ev));
    this.keycap.addEventListener('mouseover', (ev) => this.handleMouseover(ev));
    this.keycap.addEventListener('mouseout', (ev) => this.handleMouseout(ev));
    this.keycap.addEventListener('touchstart', (ev) => this.handleTouchstart(ev));
    this.keycap.addEventListener('touchmove', (ev) => this.handleTouchmove(ev));
    this.keycap.addEventListener('touchend', (ev) => this.handleTouchend(ev));
    this.keycap.addEventListener('click', (ev) => this.handleClick(ev));
  },
  handleTouchstart(ev) {
    console.log('cancel touch event');
    this.touching = true;
    ev.stopPropagation();
    ev.preventDefault();
  },
  handleTouchmove(ev) {
    if (this.touching) {
      ev.stopPropagation();
      console.log('move');
      ev.preventDefault();
    }
  },
  handleTouchend(ev) {
    this.touching = false;
    ev.stopPropagation();
    ev.preventDefault();
    this.keycap.pos.z = 0;
  },
  handleMousedown(ev) {
    this.keycap.pos.z = -.01;
  },
  handleMouseup(ev) {
    this.keycap.pos.z = 0;
  },
  handleMouseover(ev) {
  },
  handleMouseout(ev) {
    this.scale = V(1);
  },
  handleClick(ev) {
    console.log(this.key);
    this.dispatchEvent({type: 'press', data: this.key});
  },
  update() {
    let bbox = this.keycap.getBoundingBox();
    if (player.hand0_active) {
      let fingerpos = player.hand0_p1;
    //console.log(bbox.min, bbox.max, player.hand0_pos);
      if (!room.objects['bleh']) {
        room.createObject('object', {
          id: 'sphere',
          scale: V(.02),
          col: 'red',
          js_id: 'bleh',
          collision_id: 'sphere'
        });
      }
      room.objects['bleh'].pos = fingerpos
      if (bbox.containsPoint(fingerpos)) {
        console.log('EEEEE forefinger', this.key);
      }
      /*
      if (bbox.containsPoint(player.hand0_p0)) {
        console.log('EEEEE thumb', this.key);
      }
      if (bbox.containsPoint(player.hand0_p2)) {
        console.log('EEEEE middle', this.key);
      }
      if (bbox.containsPoint(player.hand0_p3)) {
        console.log('EEEEE ring', this.key);
      }
      if (bbox.containsPoint(player.hand0_p4)) {
        console.log('EEEEE pinkie', this.key);
      }
    }
    if (player.hand1_active) {
      if (bbox.containsPoint(player.hand1_p0)) {
        console.log('RRRRR thumb', this.key);
      }
      if (bbox.containsPoint(player.hand1_p1)) {
        console.log('RRRRR forefinger', this.key);
      }
      if (bbox.containsPoint(player.hand1_p2)) {
        console.log('RRRRR middle', this.key);
      }
      if (bbox.containsPoint(player.hand1_p3)) {
        console.log('RRRRR ring', this.key);
      }
      if (bbox.containsPoint(player.hand1_p4)) {
        console.log('RRRRR pinkie', this.key);
      }
      */
    }
  }
});
room.registerElement('archivecontainer', {
  collection: null,
  count: 30,
  padding: .04,
  useable: 1,
  itemtype: 'archive_media',

  create() {
    this.addClass('grabbable');
    if (this.collection) {
      //console.log('new record collection', this.collection);
      this.collection.load();
      elation.events.add(this.collection, 'collection_load', (ev) => this.handleCollectionLoad(ev));
      elation.events.add(this.collection, 'collection_clear', (ev) => this.handleCollectionClear(ev));
      elation.events.add(this.collection, 'collection_add', (ev) => this.handleCollectionAdd(ev));
      elation.events.add(this.collection, 'collection_remove', (ev) => this.handleCollectionRemove(ev));
    }
    this.box = this.createObject('object', {
      id: 'crate',
      col: 'white',
      scale: V(.03),
    });
    this.boxcollider = this.createObject('object', {
      collision_id: 'cube',
      collision_scale: V(.2, .4, .4),
      collision_pos: V(0, .2, 0),
    });
    this.boxcollider.addEventListener('mouseover', (ev) => this.handleMouseOver(ev));
    this.boxcollider.addEventListener('mousemove', (ev) => this.handleMouseMove(ev));
    this.boxcollider.addEventListener('mouseout', (ev) => this.handleMouseOut(ev));
    this.boxcollider.addEventListener('click', (ev) => this.handleClick(ev));
    this.addEventListener('grabstart', (ev) => this.handleGrabStart(ev));
    this.addEventListener('grabhover', (ev) => this.handleGrabHover(ev));
    //this.boxcollider.addClass('grabbable');

    this.addEventListener('click', this.handleClick);
    this.spawnpos = V(this.pos);
  },
  createItems() {
    let bbox = this.getContainerBounds();
        items = this.collection.items,
        count = this.collection.items.length;
    this.placeholders = [];
    for (var i = 0; i < count; i++) {
      let placeholder = this.createObject(this.itemtype, {
        identifier: items[i].identifier,
        pos: this.worldToLocal(V(0, .05, (((bbox.max.z - bbox.min.z) / count) * i + bbox.min.z))),
      });
      this.placeholders[i] = placeholder;
    }
    // FIXME - bad hack to keep things fresh during load
    setInterval(() => {
      this.applyMovementCurve();
    }, 1000);
  },
  getContainerBounds() {
    if (!this.bounds || isNaN(this.bounds.min.x)) {
      this.updateBoundingBox();
    }
    return this.bounds;
  },
  updateBoundingBox() {
    // FIXME - this is messed up when the object is at certain angles
    let bbox = this.box.getBoundingBox();
    this.worldToLocal(bbox.min);
    this.worldToLocal(bbox.max);

    bbox.max.z += this.padding;
    bbox.min.z -= this.padding;
    this.bounds = bbox;
  },
  update() {
    /*
    let bbox = this.getContainerBounds();

    if (player.hand0_active || player.hand1_active) {
      this.active = true;
      let fingerpos_left = this.worldToLocal(V(player.hand0_p2));
      let fingerpos_right = this.worldToLocal(V(player.hand1_p2));
      let offset = .0;
      //console.log('hand', percent, fingerpos_left, bbox);
      if (fingerpos_left.x > bbox.min.x && fingerpos_left.x < bbox.max.x && fingerpos_left.y < bbox.max.y + .2) {
        let percent = (fingerpos_left.z - bbox.min.z - offset) / (bbox.max.z - bbox.min.z);
        this.dongle.pos = fingerpos_left;
        this.setActiveAmount(percent);
      }
      if (fingerpos_right.x > bbox.min.x && fingerpos_right.x < bbox.max.x && fingerpos_right.y < bbox.max.y + .2) {
        let percent = (fingerpos_right.z - bbox.min.z - offset) / (bbox.max.z - bbox.min.z);
        this.dongle.pos = fingerpos_right;
        this.setActiveAmount(percent);
      }
    }
    this.applyMovementCurve();
    */
  },
  reset() {
    this.active = false;
    this.applyMovementCurve();
  },
  setActiveAmount(amount) {
    this.amount = amount;
    this.applyMovementCurve();
  },
  applyMovementCurve() {
    // TODO - bezier curve!
    if (!this.placeholders) return;
    let active = Math.floor(this.amount * this.count);

    let bbox = this.getContainerBounds(),
        items = this.collection.items,
        count = this.collection.items.length;

    let width = bbox.max.x - bbox.min.x,
        height = bbox.max.y - bbox.min.y,
        depth = bbox.max.z - bbox.min.z,
        collision_scale = this.boxcollider.collision_scale;

    if (!collision_scale || (collision_scale.x != width || collision_scale.y != height || collision_scale.z != depth)) {
      this.boxcollider.collision_scale = V(width, height, depth);
      //this.boxcollider.collision_pos = V(bbox.max).add(bbox.min).multiplyScalar(.5);
      //console.log('new colpos!', this.boxcollider.collision_pos, bbox);
    }

    //console.log('active:', active, this.amount);
    //this.worldToLocal(bbox.min);
    //this.worldToLocal(bbox.max);
    for (var i = 0; i < this.placeholders.length; i++) {
      let dist = i - active;
      let height = .1;
      if (this.active) {
        height += Math.min(1.5, Math.max(0, 1 / dist)) * .175/2; 
      }
      let p = this.placeholders[i];
      p.pos.x = 0;
      p.pos.y = height;
      p.pos.z = (((bbox.max.z - bbox.min.z) / count) * i + bbox.min.z);
    }
  },
  handleCollectionLoad(ev) {
    this.reset();
    this.createItems();
  },
  handleCollectionClear(ev) {
  },
  handleCollectionAdd(ev) {
  },
  handleCollectionRemove(ev) {
  },
  handleMouseOver(ev) {
  },
  handleMouseMove(ev) {
    if (player.hand0_active || player.hand1_active) {
      return;
    }
    this.active = true;
    let point = this.worldToLocal(ev.data.point),
        bbox = this.getContainerBounds();

    let percent = (point.z - bbox.min.z) / (bbox.max.z - bbox.min.z);
    //console.log('mouse', percent, point, bbox);
    this.setActiveAmount(percent);
  },
  handleMouseOut(ev) {
    //this.reset();
  },
  handleClick(ev) {
    if (ev.button == 0) {
      let active = Math.floor(this.amount * this.count),
          container = this.placeholders[active];
console.log('clicked it', active, record);
        /*
      if (room.objects['viewer'].holding != record) {
        console.log('pick it up');
        room.objects['viewer'].pickup(record);
        ev.stopPropagation();
        ev.preventDefault();
      }
        */
      let viewer = room.objects['viewer'];
      let holding = viewer.isHolding(this.placeholders[0].mediatype);
      if (holding) {
        viewer.drop();
        holding.reset();
      } else {
        let media = container.unbox();
        setTimeout(() => {
          room.objects['viewer'].pickup(media);
        }, 100);
      }
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  handleGrabStart(ev) {
    console.log('grabbed!', ev);
    let active = Math.floor(this.amount * this.count),
        container = this.placeholders[active];
    if (container) {
      let media = container.unbox();
      console.log('got the media');
      let hand = ev.data.hand;
      //hand.appendChild(media);
      hand.pickup(media);
    }
  },
  handleGrabHover(ev) {
    this.active = true;
    let point = this.worldToLocal(ev.data.hit.point),
        bbox = this.getContainerBounds();

    let percent = (point.z - bbox.min.z) / (bbox.max.z - bbox.min.z);
    //console.log('mouse', percent, point, bbox);
    this.setActiveAmount(percent);
  }
});
room.registerElement('archive_media', {
  identifier: null,
  mediatype: false,
  requiretype: ['VBR MP3', 'h.264'],

  create() {
    this.thing = this.createThing();
    if (this.identifier) {
      this.addClass('holdable');
      fetch('https://p.janusvr.com/https://archive.org/details/' + this.identifier + '?output=json')
        .then(r => r.json())
        .then(j => this.updateInfo(j));
    }
    if (this.mediatype) {
      this.addTag(this.mediatype);
    }
  },
  createThing() {
    /*
    return this.createObject('object', {
      id: 'record',
      collision_id: 'record',
      envmap_id: this.envmap_id,
      pos: V(0,.0005,0)
    });
    */
    this.spawnpos = V(this.pos);
    return this.createObject('object', {
      id: 'cube',
      scale: V(.175, .175, .002),
      col: 'white',
      //collision_id: 'cube'
    });
  },
  updateInfo(data) {
    this.data = data;
    // TODO - we could generate custom labels using a canvas, with text labels, etc. baked in
    room.loadNewAsset('image', {
      id: this.name + '_cover',
      src: data.misc.image,
      maxsize: 512
    });
    this.thing.image_id = this.name + '_cover';
    let mp3s = [];
    for (let k in data.files) {
      let f = data.files[k];
      //if (f.format == 'VBR MP3' || f.format == 'h.264') {
      if (this.requiretype.indexOf(f.format) != -1) {
        mp3s.push('https://' + data.server + data.dir + k);
      }
    }
    //console.log('found mp3s:', mp3s, data);
    if (mp3s.length > 0 && mp3s[0]) {
      this.src = mp3s[0];
      //console.log('record loaded data', mp3s, this.data);
      if (this.media) {
        this.media.src = this.src;
      }
    } else {
      console.log('WARNING - media identifier did not have required media types', this, data);
      this.die();
    }
  },
  unbox() {
    if (this.mediatype) {
      if (!this.media) {
        this.media = room.createObject(this.mediatype, {
          pos: this.localToWorld(V(0,0,0)),
          src: this.src
        });
        this.media.addEventListener('reset', (ev) => this.handleReset());
      } else {
        this.media.scale = V(1,1,1);
        this.media.visible = true;
      }
    }
    console.log('my media!', this.media, this.mediatype);
    return this.media;
  },
  handleReset() {
    console.log('got a reset');
    //this.media.die();
    this.media.visible = false;
    this.media.scale = V(.001);
    //this.media.pos = V(0,0,0)
  }
});
room.extendElement('archive_media', 'archive_record', {
  mediatype: 'record',
  requiretype: ['VBR MP3'],

  pickup() {
    this.getViewer().pickup(this);
    this.disableCollider();
  },
  drop() {
    this.enableCollider();
  },
  reset() {
    console.log('I was told to reset', this);
    //this.stop();
    //this.die();
  },
  disableCollider() {
    if (this.thing.collision_id) {
      console.log('disable collider', this);
      this.originalcollider = this.thing.collision_id;
      this.thing.collision_id = '';
    }
  },
  enableCollider() {
    if (this.thing.collision_id != this.originalcollider) {
      console.log('enable collider', this);
      this.thing.collision_id = this.originalcollider;
    }
  },
});
room.extendElement('archive_media', 'archive_cassette', {
  mediatype: 'cassettetape',
  requiretype: ['VBR MP3'],

  pickup() {
    this.getViewer().pickup(this);
    this.disableCollider();
  },
  drop() {
    this.enableCollider();
  },
  disableCollider() {
    if (this.thing.collision_id) {
      console.log('disable collider', this);
      this.originalcollider = this.thing.collision_id;
      this.thing.collision_id = '';
    }
  },
  enableCollider() {
    if (this.thing.collision_id != this.originalcollider) {
      console.log('enable collider', this);
      this.thing.collision_id = this.originalcollider;
    }
  },
});
room.extendElement('archive_media', 'archive_film', {
  mediatype: 'projectorfilm',
  requiretype: ['h.264'],

  pickup() {
    this.getViewer().pickup(this);
    this.disableCollider();
  },
  drop() {
    this.enableCollider();
  },
  disableCollider() {
    if (this.thing.collision_id) {
      console.log('disable collider', this);
      this.originalcollider = this.thing.collision_id;
      this.thing.collision_id = '';
    }
  },
  enableCollider() {
    if (this.thing.collision_id != this.originalcollider) {
      console.log('enable collider', this);
      this.thing.collision_id = this.originalcollider;
    }
  },
});
