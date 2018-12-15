room.registerElement('teleporter', {
  target: false,
  url: false,
  external: false,
  width: 1,
  length: 1,
  height: 2,
  flicker: 10,
  fudgefactor: 1.2,
  cooldown: 1000,
  cooling: false,

  create: function() {

/*
    this.light = room.createObject('Light', {
      col: this.col,
      pos: V(0,.5,0),
      light_intensity: .4,
      light_range: 10,
      light_shadow: false
    }, this);
*/

    this.particles = this.createObject('Particle', {
      col: this.col,
      pos: V(-.5,.1,-.5),
      scale: V(.05),
      //vel: V(-.5,0,-.5),
      particle_vel: V(-.4,0,-.4),
      rand_vel: V(.8,2,.8),
      rand_col: V(1,.5,.5),
      rand_pos: V(1,0,1),
      accel: V(0,-1,0),
      rand_accel: V(0,2,0),
      rate: 50,
      count: 50,
      duration: 1,
      loop: true
    });
    this.particles.particle_vel = V(-.4, 0, -.4); // FIXME - particle velocity isn't being set on spawn
    this.base = this.createObject('Object', {
      id: 'cube',
      col: this.col,
      scale: V(this.length,.2,this.width),
      collision_id: 'cube',
      collision_scale: V(1,.5,1),
      collision_trigger: true,
      oncollision: this.handleCollision
    });

    this.sound = this.createObject('Sound', { id: 'teleport' });
  },
  activate: function() {
    if (!this.cooling) {
      this.cooling = true;
      if (this.target && room.objects[this.target]) {
        player.pos = room.objects[this.target].pos;
        this.sound.play();
      } else if (this.url) {
        var url = this.url;
        player.pos.y = 1000;
        this.sound.pos = player.pos;
        this.sound.play();
        if (this.external) {
          if (this.target) {
            window.open(this.url, this.target);
          } else {
            setTimeout(function() {
              document.location.href = url;
            }, 100);
          }
        } else {
          janus.load(url);
        }
      }
      setTimeout(this.cooldownFinish, this.cooldown);
    }
  },
  cooldownFinish: function() {
    this.cooling = false;
  },
  handleCollision: function(ev) {
    // FIXME - player collisions are currently disabled
    console.log('boing!', this.target);
  },
  update: function() {
    // FIXME - vextor proxies are all kinds of broken
    var pos = this.worldToLocal(player.head_pos.clone());
    if ((pos.y >= 0 && pos.y <= this.height) && (Math.abs(pos.x) < this.length / 2 * this.fudgefactor && Math.abs(pos.z) < this.width / 2 * this.fudgefactor)) {
      this.activate();
    }
    if (this.light) {
      var smooth = .95;
      var min = 2,
          max = 6;
      var intensity = min + (max - min) * Math.random();
      
      this.light.light_intensity = (this.light.light_intensity * smooth) + (intensity * (1 - smooth));
      //this.light.light_intensity = (this.light.light_intensity * smooth) + (5 * Math.random() * (1 - smooth));
      //this.light.light_intensity = (this.light.light_intensity) * (Math.random() * .2 - .1);
    }
  }
});

room.extendElement('teleporter', 'teleportpad', {
  target: false,
  url: false,
  external: false,
  width: 1,
  length: 1,
  height: 2,
  flicker: 10,
  fudgefactor: 1.2,
  cooldown: 1000,
  cooling: false,

  create: function() {

/*
    this.light = room.createObject('Light', {
      col: this.col,
      pos: V(0,.5,0),
      light_intensity: .4,
      light_range: 10,
      light_shadow: false
    }, this);
*/

    this.particles = this.createObject('Particle', {
      emitter_id: 'torus',
      col: this.col,
      pos: V(0,.1,0),
      //scale: V(.3),
      //vel: V(-.5,0,-.5),
      particle_vel: V(0,0,0),
      rand_vel: V(0,2,0),
      rand_col: V(1,.5,.5),
      rand_pos: V(0,0,0),
      accel: V(0,-1,0),
      rand_accel: V(0,1.6,0),
      rate: 1,
      count: 2,
      duration: 1.5,
      loop: true
    });
    this.particles.particle_vel = V(0, 0, 0); // FIXME - particle velocity isn't being set on spawn
    this.base = this.createObject('Object', {
      id: 'cylinder',
      col: this.col,
      scale: V(this.length,.2,this.width),
      collision_id: 'cube',
      collision_scale: V(1,1.8,1),
      collision_trigger: true,
      oncollision: this.handleCollision
    });

    this.sound = this.createObject('Sound', { id: 'teleport' });
  },
  activate: function() {
    if (!this.cooling) {
      this.cooling = true;
      if (this.target && room.objects[this.target]) {
        player.pos = room.objects[this.target].pos;
        this.sound.play();
      } else if (this.url) {
        var url = this.url;
        player.pos.y = 1000;
        this.sound.pos = player.pos;
        this.sound.play();
        if (this.external) {
          if (this.target) {
            window.open(this.url, this.target);
          } else {
            setTimeout(function() {
              document.location.href = url;
            }, 100);
          }
        } else {
          janus.load(url);
        }
      }
      setTimeout(this.cooldownFinish, this.cooldown);
    }
  },
  cooldownFinish: function() {
    this.cooling = false;
  },
  handleCollision: function(ev) {
    // FIXME - player collisions are currently disabled
    console.log('boing!', this.target);
  },
  update: function() {
    // FIXME - vextor proxies are all kinds of broken
    var pos = this.worldToLocal(player.head_pos.clone());
    if ((pos.y >= 0 && pos.y <= this.height) && (Math.abs(pos.x) < this.length / 2 * this.fudgefactor && Math.abs(pos.z) < this.width / 2 * this.fudgefactor)) {
      this.activate();
    }
    if (this.light) {
      var smooth = .95;
      var min = 2,
          max = 6;
      var intensity = min + (max - min) * Math.random();
      
      this.light.light_intensity = (this.light.light_intensity * smooth) + (intensity * (1 - smooth));
      //this.light.light_intensity = (this.light.light_intensity * smooth) + (5 * Math.random() * (1 - smooth));
      //this.light.light_intensity = (this.light.light_intensity) * (Math.random() * .2 - .1);
    }
  }
});
