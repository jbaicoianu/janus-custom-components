room.registerElement('fireworklauncher', {
  muzzlespeed: 72,
  random: .5,
  fusetime: 5000,
  whistle: false,
  streak: false,
  minsize: 1,
  maxsize: 16,

  create: function() {
    this.createObject('Object', {
      id: 'pipe',
      scale: V(.2,.4,.2),
      col: V(.4)
    });
    this.sound = this.createObject('Sound', {
      id: 'fireworks-firing'
    });
  },
  fire: function(num, speed, fusetime) {
    if (!num) num = 1;
    this.sound.stop();
    this.sound.seek(0);
    this.sound.play();

    if (!speed) speed = this.muzzlespeed;
    if (!fusetime) fusetime = this.fusetime;

    for (var i = 0; i < num; i++) {
      var worldpos = this.localToWorld(V(0,0,0));
      var firedir = this.localToWorld(normalized(V(Math.random() * this.random - this.random/2, 1, Math.random() * this.random - this.random/2)));
      var size = Math.ceil(Math.random() * 16);
      var vel = scalarMultiply(V(firedir.x - worldpos.x, firedir.y - worldpos.y, firedir.z - worldpos.z), speed);
      var col = new THREE.Color().setHSL(Math.random(), 1, .5);
      var firework = room.objects['fireworks'].grab({
        pos: worldpos,
        mass: 1,
        size: this.minsize + Math.floor(Math.random() * (this.maxsize - this.minsize)),
        vel: vel,
        col: col,
        fusetime: fusetime,
        whistle: this.whistle,
        streak: this.streak
      });
      if (firework) {
        setTimeout(firework.enable, 10);
      }
    }
  }
});
room.registerElement('firework', {
  fusetime: 12000,
  fadetime: 2000,
  size: 2,
  whistle: false,
  streak: false,

  create: function() {
    this.trail = room.createObject('particle', {
      col: V(.75,.75,.75),
      accel: V(0,-9.8,0),
      rate: 1,
      count: 30,
      duration: .5,
      rand_col: V(1,1,0),
      scale: V(1.5),
      image_id: 'spark',
      loop: true
    });
    this.gravity = this.addForce('gravity', V(0,0,0));
    this.addEventListener('update', this.update);
  },
  enable: function() {
    if (this.explodetimer) {
      clearTimeout(this.explodetimer);
    }
    this.explodetimer = setTimeout(this.explode, this.fusetime + (Math.random() * this.fusetime) / 20);
    this.gravity.update(V(0,-9.8,0));
    if (this.streak) {
      var randscale = 6;
      this.trail.particle_vel = V(Math.random() * -randscale, 0, Math.random() * -randscale);
      this.trail.rand_vel = V(randscale, 0, randscale);
      this.trail.play();
      this.trail.visible = true;
    } else {
      this.trail.visible = false;
    }
    if (this.whistle) {
      var soundid = 'fireworks-whistling-0' + Math.ceil(Math.random() * 3);

      if (!this.sound) {
        this.sound = this.createObject('Sound', {
          id: soundid,
          gain: this.size * 10
        });
      } else {
        this.sound.stop();
        this.sound.gain = this.size * 10;
        this.sound.seek(0);
      }
      this.sound.play();
    }
  },
  disable: function() {
    if (this.explodetimer) {
      clearTimeout(this.explodetimer);
    }
    this.gravity.update(V(0,0,0));
    if (this.whistle) {
      this.sound.stop();
    }
    //this.removeEventListener('update', this.fade);
    this.pos = V(0,-99999,0);
  },
  update: function(ev) {
    var worldpos = this.localToWorld(V(0));
    if (this.streak) {
      this.trail.emitter_pos = worldpos;
      this.fade(ev);
    }
  },
  explode: function() {
    var worldpos = this.localToWorld(V(0,0,0));
    var explosion = room.objects['explosions'].grab({
      pos: worldpos,
      fadetime: this.fadetime,
      size: this.size,
      col: this.col,
      particle_vel: this.vel
    });
    this.explodetimer = false;
    setTimeout(explosion.explode, 10);
    this.disable();
    room.objects['fireworks'].release(this);
  },
  fade: function(ev) {
    var dt = ev.data;
    if (!this.explodetimer) {
      if (this.trail && this.trail.opacity > 0) {
        var amount = dt;
        this.trail.opacity -= amount;
      }
    } else {
      this.trail.opacity = (this.streak ? 1 : 0);
    }
  }
});
room.registerElement('explosion', {
  size: 2,
  fadetime: 3000,
  particle_vel: V(0),

  enable: function() {
  },
  disable: function() {
    if (this.soundtimer) {
      clearTimeout(this.soundtimer);
    }
    this.removeEventListener('update', this.fade);
    this.pos = V(0,-99999,0);
  },
  explode: function() {
    var worldpos = this.localToWorld(V(0,0,0));
    this.throwsparks(worldpos);

    // Delay sound to simulate speed of sound
    var distance = this.distanceTo(player);
    this.soundtimer = setTimeout(this.playsound, (distance / 340.29) * 1000);
    //this.sparks.particle_vel = translate(this.particle_vel, V(-1 * this.size));
    this.addEventListener('update', this.fade);
  },
  throwsparks: function(worldpos) {
    var velscale = .5;
    var particle_vel = translate(this.particle_vel, V(-(velscale / 2) * this.size));
    var rand_vel = V(velscale * this.size);
    if (!this.sparks) {
      this.sparks = room.createObject('Particle', {
        pos: worldpos,
        col: this.col,
        particle_vel: particle_vel,
        rand_vel: rand_vel,
        accel: V(0,-9.8,0),
        scale: V(2),
        rate: 5000,
        count: this.size * 2,
        image_id: 'spark',
        duration: this.fadetime / 1000,
      });
      this.sparks.particle_vel = particle_vel;
      this.sparks.rand_vel = rand_vel;
    } else {
      this.sparks.pos = worldpos;
      this.sparks.col = this.col;
      this.sparks.particle_vel = particle_vel;
      this.sparks.rand_vel = rand_vel;
      this.sparks.count = this.size * 2;
      this.sparks.play();
    }
    this.sparks.opacity = 1;
  },
  playsound: function() {
    var worldpos = this.localToWorld(V(0,0,0));
    var soundid = 'fireworks-exploding-0' + Math.ceil(Math.random() * 4);
    if (!this.sound) {
      this.sound = room.createObject('Sound', {
        id: soundid,
        pos: worldpos,
        gain: this.size
      });
    } else {
      this.sound.stop();
      this.sound.pos = worldpos;
      this.sound.gain = this.size;
      this.sound.seek(0);
    }
    this.sound.play();
  },
  fade: function(ev) {
    var dt = ev.data;
    if (this.sparks && this.sparks.opacity > 0) {
      var amount = (1000 / this.fadetime ) * dt;
      this.sparks.opacity -= amount;
    } else {
      this.disable();
      room.objects['explosions'].release(this);
    }
  }
});

