room.extendElement('mediaplayer', 'recordplayer', {
  mediatype: 'record',
  placeholderoffset: "-.005 .235 0",
  bodyid: 'gramophone',
  speaker_left: null,
  speaker_right: null,

  createBody() {
    this.sound = this.createObject('sound', {
      pos: V(0,.25,0),
      gain: 2,
      dist: .5
    });
    return this.createObject('object', {
      id: this.bodyid,
      collision_id: 'cube',
      collision_scale: V(.5, .420, .5),
      collision_pos: V(0, .15, 0),
      //col: V(.5,.3,0),
      envmap_id: 'library-interior',
      pos: V(0,0,0),
      scale: this.modelscale,
      cull_face: 'none'
    });
  },
  createPlaceholder() {
    return this.createObject('object', {
      id: 'cylinder',
      //collision_id: 'cylinder',
      scale: V(.35, .005, .35),
      col: V(1, 1, .4, .5),
      pos: this.placeholderoffset,
      visible: false
    });
  },
  attachSound(soundid) {
    this.sound.sound_id = soundid;
    this.sound.play();

    if (room.objects['cassetteplayer'] && room.objects['cassetteplayer'].media) {
      room.objects['cassetteplayer'].stop();
    }
  },
  stop() {
    this.media.stop();
    this.sound.stop();
  }
});

room.extendElement('playablemedia', 'record', {
  mediatype: 'record',
  radius: .2,
  grabpoint: V(0, .05, .15),
  grabrotation: V(-45, 0, 0),

  createThing() {
    return this.createObject('object', {
      id: 'record',
      collision_id: 'record',
      envmap_id: this.envmap_id,
      //pos: V(0,.0005,0)
      pos: this.grabpoint,
      rotation: V(0, 0, 0)
    });
  },
  play(mediaplayer) {
    this.mediaplayer = mediaplayer;
    this.rotate(468);

    if (!this.assetcreated) {
      room.loadNewAsset('sound', {
        id: this.src,
        src: this.src,
        auto_play: true
      });
      this.assetcreated = true;
    }

    mediaplayer.attachSound(this.src);
  },
  stop() {
    this.rotate(0);
  },
  rotate(speed) {
    this.thing.rotate_deg_per_sec = speed;
  },
});

