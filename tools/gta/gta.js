var game;

room.onLoad = function() {
  game = new GTA();
}
room.update = function(dt) {
  if (game) {
    var ms = dt / 1000;
    game.update(ms);
  }
}
room.onKeyDown = function(ev) {
  game.onKeyDown(ev);
}

/* GTA */
function GTA() {
  this.player = new GTAPlayer();
  this.cars = [];
  this.pedestrians = [];

  this.cars[0] = new GTACar(V(0,0,0), V(1,0,0), V(9,0,0));
}
GTA.prototype.update = function(dt) {
  var ms = dt / 1000;
  this.player.update(ms);
  for (var i = 0; i < this.cars.length; i++) {
    this.cars[i].update();
  }
  for (var i = 0; i < this.pedestrians.length; i++) {
    this.pedestrians[i].update();
  }
}
GTA.prototype.onKeyDown = function(ev) {
  console.log('key!', ev);
  this.player.onKeyDown(ev);
}


/* GTAPlayer */
function GTAPlayer() {
  this.object = room.createObject('Object', {});

  this.fartsounds = [
    room.createObject('Sound', {
      id: 'PlayerSoundEffect1',
      js_id: 'player_fart'
    }),
    room.createObject('Sound', {
      id: 'PlayerSoundEffect2',
      js_id: 'player_burp'
    })
  ];
  this.object.appendChild(this.fartsounds[0]);
  this.object.appendChild(this.fartsounds[1]);
}
GTAPlayer.prototype.update = function(dt) {
  this.object.pos = player.pos;
}
GTAPlayer.prototype.onKeyDown = function(ev) {
  console.log(ev);
  if (ev.keyCode == 'F') {
    this.fart();
  }
}
GTAPlayer.prototype.fart = function() {
  var sound = this.fartsounds[Math.floor(this.fartsounds.length * Math.random())];
  room.playSound(sound.js_id);
}

/* GTACar */
function GTACar(pos, zdir, col) {
  this.object = room.createObject('Object', {
    id: 'cube', 
    scale: V(2, 1.5, 4), 
    pos: pos,
    zdir: zdir,
    col: col
  });
  if (zdir) {
    var ydir = V(0,1,0),
        xdir = cross(zdir, ydir);
    this.object.xdir = xdir;
    this.object.ydir = ydir;
    this.object.zdir = zdir;
  }
}
GTACar.prototype.update = function(dt) {
}

/* GTAPedestrian */
function GTAPedestrian() {
}
GTAPedestrian.prototype.update = function(dt) {
}

if (false) {
  room.defineObject('GTACar', {
    /* Default car properties.  These should all be configurable */
    properties: {
      torque: 1,
      mass: 1000,
      drag: .5,
      friction: .25,
      frontalarea: 2.5,
      steermax: Math.PI/4,
      wheelbase: 1.5,
      wheelradius: .254,
      wheelwidth: .215,
      currentgear: 1,
      gears: [0, 2.66, 1.78, 1.30, 1.0, 0.74, 0.50],
      geardifferential: 3.42,
    },
    
    constructor: function() {
       
    },
    functions: {
      createGeometry: function() {
        this.car_body = this.createObject('Object', {
          id: 'cube',
          scale: V(1.5, 1.5, 3),
          col: V(.5,0,0)
        });
        var wheelparams = {
          id: 'cylinder',
          scale: V(this.wheelradius, this.wheelwidth, this.wheelradius)
        };

        this.wheels = [
          this.createObject('Object', wheelparams),
          this.createObject('Object', wheelparams),
          this.createObject('Object', wheelparams),
          this.createObject('Object', wheelparams)
        };
      },
      update: function(dt) {
      },
      steer: function(dir) {
      },
      accelerate: function(amount) {
      },
      brake: function(amount) {
      },
      shiftUp: function() {
      }, 
      shiftDown: function() {
      }, 
    }
  }, 'Object');
}
