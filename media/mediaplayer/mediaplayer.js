/**
 * Generic classes for handling drag-drop media playback
 */

room.registerElement('mediaplayer', {
  mediatype: null,
  bodyid: null,
  modelscale: "1 1 1",
  placeholdercolor_unselected: "1 1 .4 .5",
  placeholdercolor_selected: ".4 1 .4 .5",

  create() {
    this.body = this.createBody();
    //this.body.addClass('mediaplayer');
    this.addClass('mediaplayer');
    this.placeholder = this.createPlaceholder();
    this.addEventListener('click', this.handleClick);
    this.addEventListener('grabmove', this.handleGrabMove);
  },
  createBody() {
    return this.createObject('object', {
      id: 'cube',
      collision_id: 'cube',
      scale: V(1,.5,1),
      pos: V(0,.25,0)
    });
  },
  createPlaceholder() {
    return this.createObject('object', {
      id: 'cube',
      scale: V(.75,.075,.75),
      col: V(1,0,0,.5),
      pos: V(0,.525,0)
    });
  },
  showPlaceholder(selected) {
    this.placeholder.visible = true;
    this.placeholder.setOpacity(.3);
    this.placeholder.col = (selected ? this.placeholdercolor_selected : this.placeholdercolor_unselected);
    //console.log('show placeholder', selected, this.placeholder.col, this);
  },
  hidePlaceholder() {
    this.placeholder.visible = false;
    //console.log('hide placeholder', this);
  },
  update() {
    var viewer = room.objects['viewer'];
    if (viewer && this.placeholder) {
      var media = viewer.isHolding(this.mediatype);
      if (media) {
        // If we're holding the media we thought we were playing, it means the user took the media out of the player
        if (media == this.media) {
          this.stop();
          this.media = false;
        }

        if (!this.placeholder.visible) {
          this.showPlaceholder();
        }
        if (this.media) {
          //this.media.disableCollider();
        }
        
        /*
        if (player.cursor_object) {
          var obj = room.objects[player.cursor_object];
          if (obj && (obj === this.body || obj === this.placeholder)) {
            this.placeholder.col = V(.4, 1, .4, .5);
          } else {
            this.placeholder.col = V(1, 1, .4, .5);
          }
        }
        */
        /*
        let mediaplayers = player.raycast(V(0, 0, -1), null, 'mediaplayer'); // FIXME - allocation every frame, could be optimized away
        this.placeholder.col = this.placeholdercolor_unselected;
        if (mediaplayers.length > 0) {
          let mediaplayer = mediaplayers[0];
          if (mediaplayer === this.body) {
            this.placeholder.col = this.placeholdercolor_selected;
          }
        }
        */
      } else if (this.placeholder.visible) {
        this.hidePlaceholder();
        if (this.media) {
          this.media.enableCollider();
        }
      }
    }
  },
  handleClick(ev) {
    this.drop();
    ev.stopPropagation();
  },
  handleGrabMove(ev) {
    let point = this.worldToLocal(ev.data.hit.point);
    console.log('got grabmove', ev.data, point);
  },
  drop() {
    var viewer = room.objects['viewer'];
    if (viewer) {
      var media = viewer.isHolding(this.mediatype);
    console.log('its a drop', media, this.media);
      if (media && media != this.media) {
        viewer.drop();
        this.hidePlaceholder();
        //this.play(media);
      }
    }
  },
  canPlay(media) {
    if (elation.utils.isString(media)) {
      return media == this.mediatype;
    } else if (media.mediatype) {
      return media.mediatype == this.mediatype;
    }
    return false;
  },
  play(media) {
    // Reset any existing media before starting the new one
    console.log('play were called', media);
    if (this.media && this.media !== media) {
      this.media.reset();
    }

    media.pos = media.parent.worldToLocal(this.localToWorld(V(this.placeholder.pos)));
    media.xdir = this.placeholder.xdir;
    media.ydir = this.placeholder.ydir;
    media.zdir = this.placeholder.zdir;

    this.media = media;

    media.play(this);
  },
  stop() {
    if (this.media) {
      this.media.stop();
    }
  }
});
room.registerElement('playablemedia', {
  mediatype: null,
  src: null,
  radius: .1,
  grabpoint: V(.2,0,0),
  grabrotation: V(0,0,0),

  create() {
    this.thing = this.createThing();
    this.addClass('grabbable');
    if (this.src) {
      this.addClass('holdable');
    }
    if (this.mediatype) {
      this.addTag(this.mediatype);
    }
    this.addEventListener('click', this.handleClick);
    this.addEventListener('grabstart', this.handleGrabStart);
    this.addEventListener('grabend', this.handleGrabEnd);
    this.spawnpos = V(this.pos);
  },
  getViewer() {
    return room.objects['viewer'];
  },
  pickup() {
    this.getViewer().pickup(this);
		console.log('set position!', this.grabpoint, this.grabrotation);
    //this.disableCollider();
  },
  drop() {
    this.enableCollider();
		this.thing.pos = V(0, 0, 0);
		this.thing.rotation = V(0, 0, 0);
    //this.reset();
  },
  disableCollider() {
    if (this.thing.collision_id) {
      console.log('disable collider', this);
      this.originalcollider = this.thing.collision_id;
      this.thing.collision_id = '';
    }
  },
  enableCollider() {
    if (this.originalcollider && this.thing.collision_id != this.originalcollider) {
      console.log('enable collider', this.thing.collision_id, this.originalcollider, this);
      this.thing.collision_id = this.originalcollider;
    }
  },
  reset() {
    let worldpos = this.localToWorld(V(0,0,0));
		if (room.objects['explosionfactory']) {
			let explosion = room.objects['explosionfactory'].grab({
				count: 100,
				duration: 5,
				rate: 1000,
				particle_vel: V(-2, 0, -2),
				particle_accel: V(0, -9.8, 0),
				rand_vel: V(4, 4, 4),
				col: V(1, .5, 0),
				particle_scale: V(.0075),
				pos: worldpos,
			});
			explosion.particle_scale.set(.0075, .0075, .0075);
			explosion.start();
			setTimeout(() => { room.objects['explosionfactory'].release(explosion); }, 5000);
		}
    this.stop();
    this.pos = this.spawnpos;
    this.enableCollider();
    this.dispatchEvent({type: 'reset'});
  },
  play(player) {
    console.log('FIXME - playablemedia.play() stub called');
  },
  stop() {
    console.log('FIXME - playablemedia.stop() stub called');
  },
  handleClick(ev) {
    this.pickup();
    ev.stopPropagation();
  },
  handleGrabStart(ev) {
    console.log('grabstart', this.grabpoint, this.grabrotation);
    //this.thing.pos = V(0, 0, 0);
    //this.thing.rotation = V(0, 0, 0);
  },
  handleGrabEnd(ev) {
    console.log('grabend', this.grabpoint, this.grabrotation);
    //this.thing.pos = V(this.grabpoint);
    //this.thing.rotation = V(this.grabrotation);
  },
});
