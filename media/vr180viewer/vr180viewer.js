room.require('slider').then(() => {
  room.registerElement('vr180viewer', {
    screen_id: 'screen',
    video_id: '',
    seektime: 150,
    create() {
      this.screen = this.createObject('object', {
        id: this.screen_id,
        //collision_id: this.screen_id,
        scale: V(1,-1,1), // FIXME - model should be inverted before exporting
        video_id: this.video_id,
        lighting: false,
        rotation: V(10,0,0)
      });

      this.seekbar = this.createObject('slider', {
        min: 0,
        max: 100,
        pos: V(0,0,-5),
        rotation: V(90,0,0),
        visible: false
      });

      this.collision_id = this.screen_id;

      this.addControlContext('vr180viewer', {
        'seek_forward_5': {
          defaultbindings: 'keyboard_right,mouse_wheel_up,gamepad_any_axis_0',
          onactivate: (ev) => { this.beginSeek(5 * ev.value); },
          ondeactivate: (ev) => { this.endSeek(); }
        },
        'seek_backward_5': {
          defaultbindings: 'keyboard_left,mouse_wheel_down',
          onactivate: (ev) => { this.beginSeek(-5 * ev.value); },
          ondeactivate: (ev) => { this.endSeek(); }
        },
        'seek_forward_30': {
          defaultbindings: 'keyboard_up',
          onactivate: (ev) => { this.beginSeek(30 * ev.value); },
          ondeactivate: (ev) => { this.endSeek(); }
        },
        'seek_backward_30': {
          defaultbindings: 'keyboard_down',
          onactivate: (ev) => { this.beginSeek(-30 * ev.value); },
          ondeactivate: (ev) => { this.endSeek(); }
        },
      });

      this.activateControlContext('vr180viewer');
    },
    seek(amount) {
      let currtime = this.screen.video.currentTime;
      this.screen.video.currentTime += amount;

      this.seekbar.max = this.screen.video.duration;
      this.seekbar.setValue(this.screen.video.currentTime);

      if (this.seektimer) {
        clearTimeout(this.seektimer);
        this.seektimer = false;
      }

      if (this.seeking) {
        this.seektimer = setTimeout(() => this.seek(amount), this.seektime);
      }
    },
    beginSeek(amount) {
      if (!this.seeking) {
        this.seeking = true;
        this.seek(amount);
      }
      this.seekbar.visible = true;
      if (this.hideseekbar) clearTimeout(this.hideseekbar);
    },
    endSeek() {
      this.seeking = false;
      if (this.seektimer) {
        clearTimeout(this.seektimer);
        this.seektimer = false;

        this.hideseekbar = setTimeout(() => {
          this.seekbar.visible = false;
        }, 2000);
      }
    },
  });
});
