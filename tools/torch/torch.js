room.registerElement('torch', {
  intensity: 6,
  flickerrate: 50,
  flickerstrength: 3,
  offset: V(.3, 1.6, -.2),

  create() {
    this.torch = this.createObject('object', {
      id: 'cube',
      pos: V(0, .075, 0),
      scale: V(.02, .15, .02),
      col: 'tan',
      shadow_cast: false,

    });
    this.light = this.createObject('light', {
      pos: V(0, .4, 0),
      col: '#ff9900',
      light_intensity: this.intensity,
      light_shadow: true,
      light_range: 30,
    });
    this.sparks = this.createObject('particle', {
      pos: V(-.01, .15, -.01),
      col: V(1,.6,0),
      scale: V(.005),
      vel: V(-.02, 0, -.02),
      rand_pos: V(.02, 0, .02),
      rand_vel: V(.04, .04, .04),
      rand_col: V(1,1,0),
      accel: V(0, .4, 0),
      rand_accel: V(0, .1, 0),
      count: 25,
      rate: .002,
      duration: .5,
      opacity: .4,
      loop: true,
      lighting: false,
    });

    this.lightoffset = V();
    this.lightintensity = this.intensity;
    this.flicker();
  },
  flicker() {
    if (Math.random() < .8) {
      this.lightintensity = this.intensity + ((Math.random() * this.flickerstrength) - (this.flickerstrength / 2));
    }

    var flickerscale = .2;
    this.lightoffset.x = flickerscale * (Math.random() - .5);
    this.lightoffset.y = flickerscale * (Math.random() - .5) + .135;
    this.lightoffset.z = flickerscale * (Math.random() - .5);

    setTimeout(() => this.flicker(), this.flickerrate);
  },
  pickup() {
    this.holding = true;

    // FIXME - when we have proper head/hand attachment support, we'd just attach this to the player's body or hands, but for now we'll do that in the update loop
    //player.appendChild(this);
  },
  drop() {
    this.holding = false;
  },
  update(dt) {
    //if (this.holding) {
      if (player.hand1_active) {
        this.pos = translate(player.hand1_pos, scalarMultiply(player.hand1_ydir, .02));
        this.xdir = player.hand1_ydir;
        this.ydir = scalarMultiply(player.hand1_xdir, -1);
        this.zdir = player.hand1_zdir;
      } else {
        this.pos = player.localToWorld(V(this.offset));
      }
    //}
      var diff = V(this.lightoffset).sub(this.light.pos);
      if (diff.length() > 0) {
        this.light.pos = translate(this.light.pos, scalarMultiply(diff, .05));
      }
      if (this.light.light_intensity != this.lightintensity) {
        this.light.light_intensity += (this.lightintensity - this.light.light_intensity) * .05;
      }

    //this.sparks.emitter_pos = this.localToWorld(V(-.01, .095, -.01));
  }
});
