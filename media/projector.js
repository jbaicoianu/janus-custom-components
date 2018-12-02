room.extendElement('mediaplayer', 'projector', {
  screen: null,
  mediatype: 'projectorfilm',

  createBody() {
    this.reel = this.createObject('projectorfilm', {
      pos: V(-.01794, .49, -.38),
      envmap_id: this.envmap_id,
      rotation: V(0, 90, 0)
    });
    this.sound = this.createObject('sound', {
      pos: V(0,.25,0),
      gain: .15
    });
    this.addEventListener('click', this.handleClick);

    return this.createObject('object', {
      id: 'projector',
      collision_id: 'cube',
      scale: V(1, 1, 1),
      collision_scale: V(.3,.4,.5),
      collision_pos: V(.05,.25,0),
      col: V(1, 1, 1),
      pos: V(0, .25, 0),
      envmap_id: this.envmap_id
    });
  },
  createPlaceholder() {
    return this.createObject('object', {
      id: 'cylinder',
      //collision_id: 'cylinder',
      scale: V(.35, .045, .35),
      col: V(1, 1, .4, .5),
      xdir: V(0, -1, 0),
      ydir: V(1, 0, 0),
      zdir: V(0, 0, 1),
      pos: V(-.01794, .85, .28),
      visible: false
    });
  },
  attachSound(soundid) {
    this.sound.sound_id = soundid;
    this.sound.play();
  },
  stop() {
    this.media.stop();
    this.sound.stop();
  },
  play(media) {
    if (this.media) {
      this.media.reset();
    }
    media.pos = media.parent.worldToLocal(this.localToWorld(V(this.placeholder.pos)));
    /*
    media.xdir = this.placeholder.ydir;
    media.ydir = scalarMultiply(this.placeholder.xdir, -1);
    media.zdir = this.placeholder.zdir;
    */
    media.xdir = this.placeholder.xdir;
    media.ydir = this.placeholder.ydir;
    media.zdir = this.placeholder.zdir;

    this.media = media;
    var screen = room.objects[this.screen];
    screen.setVideo(media.getVideo());

    this.sound.sound_id = 'projector_start';
    this.sound.play();

    setTimeout(() => {
      this.sound.loop = true;
      this.sound.sound_id = 'projector_loop';
      this.sound.play();
    }, 1000);

    this.reel.rotate(120);
    this.media.rotate(40); // FIXME - why does this one rotate at a different speed?
    this.media.play();
  },
  stop() {
    this.sound.loop = false;
    this.sound.sound_id = 'projector_stop';
    this.sound.play();
    if (this.media) {
      this.media.stop();
      this.media.rotate(0);
    }
    var screen = room.objects[this.screen];
    screen.setVideo(null);
    this.reel.rotate(0);
  }

/*
    this.lightcone = this.createObject('object', {
      id: 'pyramid', 
      col: V(1,1,0,.1),
      scale: V(1,2,.75),
      pos: V(0,0,.5),
      ydir: V(0,0,-1),
      zdir: V(0,-1,0),
    });
*/


});
room.extendElement('playablemedia', 'projectorfilm', {
  mediatype: 'projectorfilm',
  radius: .2,
  grabpoint: V(0,.15,0),

  createThing() {
    var createargs = {
      id: 'filmreel',
      scale: V(1, 1, 1),
      col: V(1, 1, 1),
      //xdir: V(0, 1, 0),
      //ydir: V(-1, 0, 0),
      //zdir: V(0, 0, 1),
      rotation: V(0, -90, 0),
      rotate_axis: "1 0 0",
      pos: this.grabpoint,
    };
    if (this.src != null) {
      createargs.collision_id = 'filmreel';
    }

    return this.createObject('object', createargs);
  },
  play(mediaplayer) {
    //this.mediaplayer = mediaplayer;
    this.rotate(60);
    room.seekVideo(this.src, 0);
    room.playVideo(this.src);

    //mediaplayer.attachSound(this.src);
  },
  getVideo() {
    if (!this.assetcreated) {
      room.loadNewAsset('video', {
        id: this.src,
        src: this.src,
        auto_play: true,
        lighting: false
      });
      this.assetcreated = true;
    }

    return this.src;
  },
  stop() {
    this.rotate(0);
    room.stopVideo(this.src);
  },
  rotate(speed) {
    this.thing.rotate_deg_per_sec = speed;
  },
});

room.registerElement('projectorscreen', {
  createChildren() {
    this.holder = this.createObject('object', {
      pos: V(0, .75, 0),
      zdir: V(0, 0, -1)
    });
    this.screen = this.holder.createObject('object', {
      id: 'cube',
      collision_id: 'plane',
      image_id: 'white',
      col: V(1, 1, 1),
      scale: V(2, 1.5, .002),
      lighting: false
    });
  },
  setVideo(video) {
    this.screen.video_id = video;
    if (video) {
      this.screen.image_id = '';
    } else {
      this.screen.image_id = 'white';
    }
  }
});
