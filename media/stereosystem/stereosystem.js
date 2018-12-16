room.extendElement('mediaplayer', 'cassetteplayer', {
  mediatype: 'cassettetape',
  speaker_left: null,
  speaker_right: null,

  createBody() {
    return this.createObject('object', {
      id: this.bodyid,
      scale: this.modelscale,
      collision_id: 'cube',
      collision_scale: V(.65, .45, .25),
      collision_pos: V(0, -7.25, 0),
      //col: V(.5,.3,0),
      envmap_id: this.envmap_id,
      pos: V(0,0,0)
    });
  },
  createPlaceholder() {
    return this.createObject('object', {
      id: 'cube',
      scale: V(.3,.12,.1),
      pos: V(0,-.40,.13),
      col: V(1,0,0,.5)
    });
  },
  attachSound(soundid) {
    // TODO - we should run this through a stereo split node and play each channel to its respective speaker
    // For now we'll just play out of the left speaker, otherwise it gets echoey
    /*
    if (this.speaker_left && room.objects[this.speaker_left]) {
      room.objects[this.speaker_left].play(soundid);
    }
    if (this.speaker_right && room.objects[this.speaker_right]) {
      //room.objects[this.speaker_right].play(soundid);
    }
    */
    if (!this.sound) {
      this.sound = this.createObject('sound', {
        pos: V(0,0,0),
        gain: .1,
      });
    }
    this.sound.sound_id = soundid;
    this.sound.play();
    /*
    let derp = () => {
      let audio = this.sound.audio;
      console.log('derp', audio, audio.source);
      if (!(audio && audio.source)) {
        setTimeout(derp, 100);
      } else {
        console.log('my audio!', audio);
        let ctx = audio.context;
        let splitter = ctx.createChannelSplitter(2);
        audio.source.disconnect();
        audio.gain.connect(splitter);
        if (this.speaker_left && room.objects[this.speaker_left]) {
          //room.objects[this.speaker_left].connect(splitter, 0);
        }
        if (this.speaker_right && room.objects[this.speaker_right]) {
          //room.objects[this.speaker_right].connect(splitter, 1);
        }
      }
    }
    derp();
    */
    if (room.objects['recordplayer'] && room.objects['recordplayer'].media) {
      room.objects['recordplayer'].stop();
    }
  },
  stop() {
    if (this.speaker_left && room.objects[this.speaker_left]) {
      room.objects[this.speaker_left].stop();
    }
    if (this.speaker_right && room.objects[this.speaker_right]) {
      //room.objects[this.speaker_right].stop();
    }
    this.media.stop();
    this.sound.stop();
  }
});

room.extendElement('playablemedia', 'cassettetape', {
  mediatype: 'cassettetape',
  grabpoint: V(0,.05,.05),

  createThing() {
    return this.createObject('object', {
      id: 'cassette',
      collision_id: 'cube',
      collision_scale: V(.2, .1, .1),
      pos: this.grabpoint,
    });
  },
  play(mediaplayer) {
    this.mediaplayer = mediaplayer;

    if (!this.src) return;

    if (!this.assetcreated) {
      room.loadNewAsset('sound', {
        id: this.src,
        src: this.src,
        auto_play: true,
        gain: .1,
      });
      this.assetcreated = true;
    }

    mediaplayer.attachSound(this.src);
    console.log('play it!');
  }
});

room.registerElement('speaker', {
  bodyid: 'speaker',
  createChildren() {
    this.body = this.createObject('object', {
      id: this.bodyid,
      collision_id: 'cube',
      collision_scale: V(.245,.4,.22),
      collision_pos: V(0,.22,.025)
    });
    this.sound = this.createObject('sound', {
      pos: V(0,.2,0),
      gain: .1,
    });
  },
  connect(source, channel) {
    console.log('connect audio to channel', channel, source, this);
    source.connect(this.sound.audio.panner, channel);
  },
  play(soundid) {
    this.sound.sound_id = soundid;
    this.sound.play();
  },
  stop() {
    this.sound.stop();
  }
});
