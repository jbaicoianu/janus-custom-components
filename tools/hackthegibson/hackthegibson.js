var gamecfg = {
  size: 4,
  spacing: 4,
  offset: V(5,0,5),
  targets: 0,
  firerate: 8,
  bulletstrength: 8,
  bulletspeed: 25,

  clusterhealth: 100,
  playerhealth: 50,

  fixrate: 650,
  fixamount: 20,

  score: {
    cluster_damage: -10,
    cluster_destroy: -100,
    cluster_reboot: 100,
    cluster_fix: 10,

    hacker_damage: 100,
    hacker_destroy: 1000,
  },
  sync: {
    status: 1000,
    gun: 10,
  }
};

/*
 * Multiplayer game state architecture
 * 
 * State for this game is communicated in an ad-hoc manner via manipulating object state.
 * This means there's no one central authority, all changes, physics, etc. are communicated
 * via JanusVR's edit mode and sent along with the player's usual movement data.
 *
 * Rounds: gameplay for this game is broken up into rounds.  Each round lasts a maximum of 5
 *         minutes, and terminates either when this time is up, or when all systems in the
 *         cluster have been down for more than 30 seconds.  
 *
 * Scoring: There are no distinct teams, your score is determined by your actions.  Hackers
 *          compete for the lowest negative score, and admins compete for the highest
 *          positive score.
 *
 *          Example scoring actions: (NOTE - these are subject to change, real scores above)
 *           - shoot gibson: -10 point per hp damage
 *           - destroy gibson: -100 points
 *           - fix gibson: 10 points per hp fixed
 *           - bring gibson online: 100 points
 *           - shoot player: 100 points per hp damage
 *           - kill player: 1000 points
 *
 * Implementation:
 * When a player first joins, we wait to see if there's a game already in process.  This is 
 * determined by waiting a few seconds for a status "heartbeat" from players already in the
 * game.  If 2x heartbeat interval passes without receiving a status update, it's assumed 
 * that we are the first player, (the "host")
 *
 * 
 * var timer,
 *     heartbeat = 1000,
 *     heartbeatID = 'game_status',
 *     lastbeat = 0,
 *     master = false,
 *     status;
 * 
 * room.onLoad = function() {
 *   print('Waiting for players...');
 *   timer = setTimeout(createGame, heartbeat * 2);
 * }
 * room.update = function(dt) {
 *   var now = new Date().getTime();
 * 
 *   if (status) {
 *     if (now - lastbeat > heartbeat) {
 *       if (master) {
 *         status.sync = true;
 *       } else {
 *         print('received heartbeat!', now - lastbeat);
 *       }
 *       lastbeat = now;
 *     }
 *   } else if (room.objects[heartbeatID]) {
 *     status = room.objects[heartbeatID];
 *     print('Found a heartbeat!', status.text);
 *     clearTimeout(timer);
 *   }
 * }
 * function createGame() {
 *   status = room.createObject('Text', {js_id: heartbeatID, text: 'waiting', pos: V(0,-1000,0), visible: false, sync: true});
 *   master = true;
 * }
 *
 */


var cluster,
    hacker,
    remotehackers = {};

// strings to match to identify different object types
var bulletstr, nodestr, colliderstr;

var objpool = {
  bullet: new ObjectPool(10, HackerBullet),
  spark: new ObjectPool(4, HackerSpark, {}),
  plasma: new ObjectPool(1, HackerSound, {id: 'plasma', gain: 0.2}),
  shutdown: new ObjectPool(4, HackerSound, {id: 'shutdown', gain: 1}),
  powerup: new ObjectPool(4, HackerSound, {id: 'powerup', gain: 1}),
  pain: new ObjectPool(4, HackerSound, {id: 'pain', gain: 1}),
  //drone: new ObjectPool(4, HackerSound, {id: 'pulse'})
};

var isJanusWeb = (typeof elation != 'undefined');

room.onLoad = function() {

  bulletstr = player.userid + '_bullet_';
  nodestr = 'node_';
  colliderstr = 'collider_';

  hacker = new Hacker(player);
  cluster = new Cluster(gamecfg.size, gamecfg.targets);
  cluster.init();
  print('done it', cluster);

  if (isJanusWeb) {
    player._target.movestrength = 150;
    player._target.runstrength = 150;
    hacker.reset();

    //<xObject js_id="wall_6" id="cube" collision_id="cube" collision_scale="1 .1 1" scale="100 10 100" pos="12 -50 12" col="0 1 1" visible="true" />

    room.createObject('Object', {
      id: 'cube',
      js_id: 'wall_6',
      collision_id: 'cube',
      scale: V(100,10,100),
      pos: V(12,-5.05,12),
      col: V(0,1,1),
      visible: false
    });


  } else {
/*
    room.objects['wall_6'].pos = V(999,9999,9999);
    room.removeObject('wall_6');
*/
    room.createObject('Object', {
      id: 'sphere',
      pos: V(0,-1000,0),
      js_id: 'reset_the_game',
      sync: true
    });
  }
}
room.update = function(dt) {
  if (!isJanusWeb) {
    updateTimers();
  } else {
    // FIXME - stupid demo hack!
    if (room.objects['reset_the_game']) {
      document.location.href = document.location.href;
    }
  }
  hacker.update(dt);
  cluster.update(dt);

  var objectids = Object.keys(room.objects);
  for (var i = 0; i < objectids.length; i++) {
    var objectid = objectids[i];
    var obj = room.objects[objectid];
    if (objectid.indexOf(colliderstr) == 0) {
      if (!remotehackers[obj.js_id]) {
        print('new remote hacker!');
        remotehackers[obj.js_id] = new RemoteHacker(obj);
      }
    } else if (objectid.indexOf('_bullet_') != -1) {
      // FIXME - disable collision detection on remote balls
      if (isJanusWeb) {
        if (objectid.indexOf(player.userid) != 0) {
          obj._target.collidable = false;
          obj._target.objects.dynamics.collider = false;
        }
      }
      if (obj.pos.x < -200 || obj.pos.x > 200 || 
          obj.pos.z < -200 || obj.pos.z > 200 || 
          obj.pos.y > 500) {
        obj.vel = V(0,0,0);
        obj.accel = V(0,0,0);
        obj.pos = V(Math.random() * 1000 - 500, Math.random() * -1000, Math.random() * 1000 - 500);
      }
    }
  }
}

room.onCollisionEnter = function(obj1, obj2) {
  var bullet = false,
      other = false;
  if (obj1.js_id.indexOf(bulletstr) == 0) {
    var bulletobj = hacker.bullets[obj1.js_id];
    if (bulletobj) {
      bulletobj.handleCollision({data: {other: obj2, collision: {point: obj1.pos, normal: V(0,1,0)}}});
    }
  } else if (hacker.hand_left && obj1.js_id == hacker.hand_left.js_id) {
    if (obj2.js_id.indexOf(nodestr) == 0) {
      var node = cluster.nodes[obj2.js_id];
      hacker.fix(node, obj1.pos);
    }
  }
  //debugger;
}
room.onCollisionExit = function(obj1, obj2) {
  //debugger;
  if (hacker.hand_left && obj1.js_id == hacker.hand_left.js_id) {
    if (obj2.js_id.indexOf(nodestr) == 0) {
      //var node = cluster.nodes[obj2.js_id];
      hacker.stopfixing();
    }
  }
}
room.onTriggerDown = function(ev) {
  debugger;
}

function Cluster(size, numtargets) {
  this.size = size;
  this.numtargets = numtargets;
  this.nodes = {};
  this.targets = {};
}
Cluster.prototype.init = function() {
  if (room._target) {
    room._target.engine.client.view.pickingactive = true;
  }

  for (var i = 0; i < this.size * this.size; i++) {
    var x = i % this.size,
        z = Math.floor(i / this.size);
    
    var node = new ClusterNode(i, x, z);
    this.nodes[node.js_id] = node;
  }

  for (var i = 0; i < this.numtargets; i++) {
    var target = new HackerTarget(i);
    target.resetTarget();
    this.targets[target.js_id] = target;
  }
}
Cluster.prototype.update = function(dt) {
  for (var k in this.nodes) {
    this.nodes[k].update(dt);
  }
}

function ClusterNode(id, x, z) {
  this.id = id;
  this.js_id = 'node_' + id;
  this.js_id_indicator = 'indicator_' + id;
  this.health = gamecfg.clusterhealth;
  this.alive = true;

/*
  this.drone = room.createObject('Sound', {
    pos: this.object.pos,
    id: 'pulse',
    loop: true
  });
*/

  if (room.objects[this.js_id_indicator]) {
    this.indicator = room.objects[this.js_id_indicator];
  } else {
    this.indicator = room.createObject('Object', {
      id: 'cube',
      col: V(0, 1, 0),
      scale: V(.5, 4, .5),
      pos: translate(V(x * gamecfg.spacing, 2, z * gamecfg.spacing), gamecfg.offset),
      js_id: this.js_id_indicator,
      visible: true,
      sync: true
    });
  }
  if (room.objects[this.js_id]) {
    this.object = room.objects[this.js_id];
  } else {
    this.object = room.createObject('Object', {
      id: 'cluster_node',
      js_id: this.js_id,
      collision_static: true,
      collision_trigger: true,
      collision_id: 'cube',
      collision_scale: V(1.5, 5.2, 1.5),
      collision_pos: V(0,2,0),
      col: V(0, 1, 0),
      pos: translate(V(x * gamecfg.spacing, 0, z * gamecfg.spacing), gamecfg.offset),
      visible: true,
      locked: true,
      sync: true
    });

    if (!isJanusWeb) {
      // FIXME - janusweb doesn't respect collision_pos yet
      //this.object.collision_scale = V(1.5,5.2,1.5);
    }
  }

}

ClusterNode.prototype.damage = function(amount, position, normal) {
  if (this.alive) {
    var oldhealth = Math.round((this.indicator.scale.y / 4) * 100);
    this.health = Math.max(0, Math.min(100, oldhealth - amount));
    this.updateStatus(true);

    var spark = objpool.spark.get({pos: position, col: V(.7,.7,1), rand_col: V(0,.4,0)});

    hacker.addScore((oldhealth - this.health) * gamecfg.score.cluster_damage);
    if (this.health == 0) {
      hacker.addScore(gamecfg.score.cluster_destroy);
    }
  }
}
ClusterNode.prototype.update = function(dt) {
  if (this.object) {
    var col = this.object.col;
    if (col.x == 1 && col.y == 0 && col.z == 0) {
      if (this.indicator.pos.y != -999999) {
        this.indicator.pos.y = -999999;
        this.shutdown = objpool.shutdown.get({pos: V(this.object.pos.x, this.object.pos.y, this.object.pos.z)});
        this.object.pos.y = -4;
        this.alive = false;
        this.indicator.sync = true;
        this.object.sync = true;
      }
    } 
  }
  var indicatedhealth = Math.round((this.indicator.scale.y / 4) * 100);
  if (indicatedhealth != this.health) {
    if (indicatedhealth > this.health) {
      objpool.powerup.get({pos: translate(this.object.pos, V(0,1.5,0))});
    } else {
      objpool.spark.get({pos: translate(this.object.pos, V(0,1.5,0)), col: V(.7,.7,1), rand_col: V(0,.4,0)});
    }

    this.health = indicatedhealth;
    this.alive = this.health > 0;
  }
}
ClusterNode.prototype.updateStatus = function(sync) {
  this.object.pos.y = (this.health <= 0 ? -4 : 0);
  this.indicator.pos.y = (this.health <= 0 ? -99999 : 2);
  this.alive = this.health > 0;;
  this.object.col = V(0,1,0);

  if (this.health == 0) {
    this.object.col = V(1,0,0);
    this.indicator.col = V(1,0,0);
  } else if (this.health > 50) {
    this.object.col = V((100 - this.health) / 50, 1, 0); 
    this.indicator.col = V((100 - this.health) / 50, 1, 0); 
  } else if (this.health <= 50) {
    this.object.col = V(1, this.health / 50, 0);
    this.indicator.col = V(1, this.health / 50, 0);
  }
  scale = this.indicator.scale;
  this.indicator.scale = V(scale.x, this.health / 100 * 4, scale.z)

  if (sync) {
    this.object.sync = true;
    this.indicator.sync = true;
  }
}
ClusterNode.prototype.fix = function(amount, pos) {
  var oldhealth = this.health;
  this.health = Math.max(0, Math.min(100, this.health + amount));

  var actual = this.health - oldhealth;
  if (actual > 0) {
    if (oldhealth == 0) {
      hacker.addScore(gamecfg.score.cluster_reboot);
    }
    objpool.powerup.get({pos: translate(this.object.pos, V(0,1.5,0))});
    hacker.addScore(gamecfg.score.cluster_fix * (this.health - oldhealth));
    this.updateStatus(true);
  }
}

function HackerTarget(id) {
  this.id = id;
  this.js_id = 'target_' + this.id;

  this.object = room.createObject('Object', {
    id: 'cube',
    js_id: this.js_id,
    collision_id: 'cube',
    scale: V(1, 1, .01),
    col: V(0, 1, 1),
  });
}

HackerTarget.prototype.resetTarget = function() {
  var x = Math.floor(Math.random() * gamecfg.size),
      z = Math.floor(Math.random() * gamecfg.size),
      side = Math.floor(Math.random() * 4);

  this.node = cluster.nodes[z * gamecfg.size + x];

  var angle = side * Math.PI/2;
  var pos = this.object.pos;

  var sina = Math.sin(angle),
      cosa = Math.cos(angle);

  // FIXME - I know I could do this with sin/cos values from above but it's late and I'm tired
  if (side == 0) {
    this.object.col = V(1, 0, 0);
    this.object.xdir = V(1, 0, 0);
    this.object.zdir = V(0, 0, 1);
  } else if (side == 1) {
    this.object.col = V(1, 1, 0);
    this.object.zdir = V(1,0,0);
    this.object.xdir = V(0, 0 ,-1);
  } else if (side == 2) {
    this.object.col = V(1, 0, 1);
    this.object.xdir = V(-1, 0, 0);
    this.object.zdir = V(0, 0 -1);
  } else if (side == 3) {
    this.object.col = V(0, 1, 1);
    this.object.xdir = V(0, 0, 1);
    this.object.zdir = V(-1, 0, 0);
  }

  this.object.pos = V(x * gamecfg.spacing + (.8 * this.object.zdir.x), 2, z * gamecfg.spacing + (.8 * this.object.zdir.z));
}

function Hacker() {
  this.score = 0;
  this.health = 100;

  this.gun = room.objects[player.userid + '_cannon'] || room.createObject('Object', {
    id: 'cannon',
    js_id: player.userid + '_cannon',
    col: V(.8,.8,1),
    scale: V(1,1,1),
    pos: V(0,-.3,-0.25),
    sync: true
  });
  this.bullets = {};
  this.collider = room.createObject('Object', {
    id: 'shield',
    js_id: colliderstr + player.userid,
    col: V(1,1,1),
    scale: V(1, 1.2, 1),
    collision_id: 'sphere',
    collision_static: true,
    collision_trigger: false,
    visible: true,
    sync: true
  });
  this.collider.collision_trigger = true;
  this.healthindicator = room.createObject('Object', {
    id: 'sphere',
    js_id: 'health_' + player.userid,
    col: V(1,0,0),
    pos: V(Math.random() * -100,0,100),
    scale: V(10,10,10),
    sync: true
  });

  if (isJanusWeb) {
    // FIXME - janusweb's player collider is a bit weird, we're using a sphere centered at the player's pos.
    //         this actually means the player is standing "inside of" a ball at their feet, and they're 
    //         actually slightly above the floor.  We need real capsule/mesh collision detection to fix this.
    player.pos.y = 0.5;
    player._target.head.add(this.gun._target);
    this.realplayer = player._target;
    this.realplayer.setCollider('sphere', {radius: .05, xoffset: V(0,.5,0)});

    this.lateralforce = this.realplayer.objects.dynamics.addForce('static', new THREE.Vector3());
    this.forwardforce = this.realplayer.objects.dynamics.addForce('static', {force: new THREE.Vector3(), absolute: true});
    var controls = this.realplayer.engine.systems.controls;

    controls.addContext('hackers', {
      'fire': ['keyboard_space,mouse_button_0,gamepad_any_button_0', bind(this, this.handleFireButton)]
    });
    controls.activateContext('hackers');
  } else {
    var self = this;
    room.onMouseDown = function(ev) {
      self.handleFireButton({value: 1});
    }
    room.onMouseUp = function(ev) {
      self.handleFireButton({value: 0});
    }
  }

  this.scorelabel = room.createObject('Text', {
    js_id: 'score_' + player.userid,
    text: this.score,
    pos: translate(player.pos, V(0,20,0)),
    scale: V(20,20,20),
    xdir: V(1,0,0),
    ydir: V(0,0,1),
    zdir: V(0,-1,0),
    sync: false
  });


  this.firetimer = false;
  this.lastfire = 0;

  this.laststatus = 0;
  this.lastgunsync = 0;
}
Hacker.prototype.fire = function() {
  var now = getTimestamp();
      sincelastfire = now - this.lastfire;
  var firerate = 1000 / gamecfg.firerate;
  if (this.firing) {
    var nextfire = Math.max(0, firerate - sincelastfire);
    this.firetimer = setTimeout(bind(this, this.fire), nextfire);
  }

  if (sincelastfire < firerate || this.health <= 0) {
    return;
  }
  this.lastfire = now;
  //console.log('pew!');
  //navigator.vibrate(50);

  if (player.hand1_active) {
    var firepos = player.hand1_pos;
    var firedir = scalarMultiply(player.hand1_zdir, -1);
  } else {
    var firepos = translate(translate(player.pos, V(0,1.2,0)), scalarMultiply(player.view_dir, .6));
    var firedir = player.view_dir;
  }
  var sound = objpool.plasma.get({
    pos: firepos,
    gain: .1
  });
  var bullet = objpool.bullet.get({
    pos: firepos,
    vel: translate(player.vel, scalarMultiply(firedir, gamecfg.bulletspeed)),
  });
  this.bullets[bullet.js_id] = bullet;
}
Hacker.prototype.attack = function() {
  this.firing = true;
  this.fire();
}
Hacker.prototype.stop = function() {
  //console.log('stop pew!');
  this.firing = false;
  if (this.firetimer) {
    clearTimeout(this.firetimer);
    this.firetimer = false;
  }
}
Hacker.prototype.handleFireButton = function(ev) {
  if (ev.value ) {
    this.attack();
  } else {
    this.stop();
  }
}
Hacker.prototype.update = (function() {
  var headpos = V(),
      worldUp = V(0, 1, 0),
      up = V(),
      right = V(),
      forward = V(),
      euler = V(),
      worldRight = V(),
      worldForward = V();
  if (isJanusWeb) {
    var quat = new THREE.Quaternion();
    euler = new THREE.Euler();
  }

  return function(dt) {
    if (this.health <= 0) return;

    this.collider.pos = (isJanusWeb ? translate(player.pos, V(0,1.5,0)) : player.head_pos);
    this.collider.col = V(this.health / 100, 0, 0);
    this.collider.vel = V(0,0,0);
    //this.collider.zdir = player.view_dir;
    this.collider.accel = V(0,0,0);
    this.collider.sync = true;

    var newhealth = this.healthindicator.col.x * 100;
    if (newhealth != this.health) {
      objpool.spark.get({pos: this.collider.pos, col: V(1,0,0), rand_col: V(0,1,0)});
      this.health = newhealth;
      if (this.health <= 0) {
        this.reset();
      }
    }

    if (isJanusWeb) {
      var matrix = this.realplayer.head.objects['3d'].matrixWorld;
      matrix.extractBasis(right, up, forward);

      // tilt forwards/backwards
      worldForward.crossVectors(forward, worldUp).cross(worldUp);
      var forwardangle = Math.acos(up.dot(worldForward)) - Math.PI/2;
      //this.realplayer.objects.dynamics.localToWorldDir(this.forwardforce.force.set(0, 0, 0 + Math.sin(forwardangle) * 200));//.cross(up).cross(up);

      // rotation left/right
      worldRight.crossVectors(right, worldUp).cross(worldUp);
      var lateralangle = Math.acos(up.dot(worldRight)) - Math.PI/2;
      quat.setFromEuler(euler.set(0, -4 * lateralangle * dt/1000, 0));
      //this.realplayer.properties.orientation.multiply(quat);

      quat.setFromRotationMatrix(matrix);
      //this.realplayer.properties.orientation.slerp(quat, .1); 
    } else {
      if (player.hand1_active) {
        var headpos = player.head_pos,
            handpos = player.hand1_pos;
        
        if (distance(headpos, handpos) > .1) {
          this.gun.pos = player.hand1_pos;
          this.gun.xdir = player.hand1_xdir;
          this.gun.ydir = player.hand1_ydir;
          this.gun.zdir = player.hand1_zdir;
          this.gun.visible = true;
        } else {
          this.gun.visible = false;
        }

        if (!this.hand_right) {
          this.hand_right = room.createObject('Object', {
            id: 'sphere', 
            js_id: 'hand_right',
            col: V(1,0,0), 
            scale: V(.2,.2,.2),
            collision_id: 'sphere',
            collision_trigger: true,
            sync: false
          });
        }
        this.hand_right.pos = player.hand1_pos;
        //this.hand_right.sync = true;
      } 
      if (player.hand0_active) {
        if (!player.hand1_active) {
          this.gun.pos = player.hand1_pos;
          this.gun.xdir = player.hand1_xdir;
          this.gun.ydir = player.hand1_ydir;
          this.gun.zdir = player.hand1_zdir;
        }

        if (!this.hand_left) {
          this.hand_left = room.createObject('Object', {
            js_id: player.userid + 'hand_left',
            id: 'keyboard', 
            scale: V(1,1,1),
            //id: 'cube',
            //scale: V(.75,.25,.1),
            col: V(.7,.7,.7), 
            collision_id: 'cube',
            collision_scale: V(.75,.25,.1),
            collision_static: true,
            collision_trigger: true,
            sync: false
          });
        }
        var headpos = player.head_pos,
            handpos = player.hand0_pos;
        if (distance(headpos, handpos) > .1) {
          this.hand_left.pos = player.hand0_pos;
          this.hand_left.xdir = player.hand0_xdir;
          this.hand_left.ydir = player.hand0_ydir;
          this.hand_left.zdir = player.hand0_zdir;
          this.hand_left.sync = true;
          this.visible = true;
        } else {
          this.visible = false;
        }
      } 

      if (!player.hand0_active && !player.hand1_active) {
        this.gun.ydir = V(0,1,0);
        this.gun.zdir = normalized(scalarMultiply(player.view_dir, -1));
        this.gun.xdir = normalized(cross(this.gun.ydir, this.gun.zdir));
        this.gun.ydir = normalized(cross(this.gun.zdir, this.gun.xdir));
        this.gun.pos = translate(translate(translate(player.head_pos, V(0,-.2,0)), player.eye_pos), scalarMultiply(this.gun.zdir, .1));
        //this.gun.pos = translate(player.head_pos, scalarMultiply(this.gun.zdir, .2)),
      }
    }

    var now = getTimestamp();
    if (now - this.lastgunsync > gamecfg.sync.gun) {
      this.gun.sync = true;
      this.lastgunsync = now;
    }
    if (now - this.laststatus > gamecfg.sync.status) {
      if (this.healthindicator) {
        this.healthindicator.col = V(this.health / 100, 0, now);
        //print('sync!', this.healthindicator.col);
      }
      this.laststatus = now;
    }
  };
})();

Hacker.prototype.addScore = function(score) {
  this.score = Math.round(this.score + score);
/*
  this.scorelabel.text = this.score;
  this.scorelabel.col = (this.score < 0 ? V(1,0,0) : V(0,1,0));
  this.scorelabel.sync = true;
*/
}
Hacker.prototype.fix = function(node, pos) {
  if (this.health <= 0 || node.health >= 100) return;

  var soundid = player.userid + '_typing';
  if (!this.fixsound) {
    this.fixsound = room.createObject('Sound', {
      id: 'typing',
      js_id: soundid,
      loop: true,
      visible: false
    });
  }
  this.fixsound.pos = pos;
  room.seekSound(soundid, 0);
  room.playSound(soundid);

  this.fixtimer = setTimeout(bind(this, function() {
    node.fix(gamecfg.fixamount, pos);
    if (node.health < 100) {
      this.fix(node);
    } else {
      room.stopSound(soundid);
    }
  }), gamecfg.fixrate);
}
Hacker.prototype.stopfixing = function() {
  var soundid = player.userid + '_typing';
  if (this.fixtimer) {
    clearTimeout(this.fixtimer);
    room.stopSound(soundid);
  }
}
Hacker.prototype.attack = function() {
  this.firing = true;
  this.fire();
}
Hacker.prototype.stop = function() {
  //console.log('stop pew!');
  this.firing = false;
  if (this.firetimer) {
    clearTimeout(this.firetimer);
    this.firetimer = false;
  }
}
Hacker.prototype.reset = function() {
  //console.log("I'm dead!");
  player.pos = V(Math.random() * 18, 99999, Math.random() * 18);
  this.collider.pos = player.pos;
  this.collider.sync = true;

  setTimeout(bind(this, function() {
    player.pos = V(Math.random() * 18, 0.2, Math.random() * 18);
    this.health = 100;
    this.healthindicator.col = V(1,0,0);
    this.healthindicator.sync = true;
  }), 1000);
}

function HackerBullet() {
  var num = Math.floor(Math.random() * 1000000);
  this.js_id = player.userid + '_bullet_' + num;
  this.object = room.createObject('Object', {
    id: 'sphere',
    //image_id: 'plasmaball',
    scale: V(.1,.1,.1),
    js_id: this.js_id,
    collision_id: 'sphere',
    collision_scale: V(.3, .3, .3),
    collision_static: false,
    collision_trigger: true,
    col: V(1,1,1),
    sync: true
  });
  this.bounces = 3;
  this.strength = gamecfg.bulletstrength;
  if (isJanusWeb) {
    this.object._target.mass = 1;
    elation.events.add(this.object._target, 'collide', bind(this, this.handleCollision));
  }
}
HackerBullet.prototype.handleCollision = function(ev) { 
  var other = ev.data.other,
      collision = ev.data.collision;

  if (other && other.js_id) {
    if (cluster.nodes[other.js_id]) {
      var node = cluster.nodes[other.js_id];
      node.damage(this.strength, collision.point, collision.normal);
      this.bounces = 0;
    } else if (cluster.targets[other.js_id]) {
      //console.log('pow!', other);
      this.bounces--;
    } else if (other.js_id.indexOf(colliderstr) == 0) {
      if (other.js_id != hacker.collider.js_id) {
        var remotehacker = remotehackers[other.js_id];
        if (remotehacker) {
          remotehacker.damage(this.strength, collision.point);
        }
        this.bounces = 0;
      }
    } else {
      //console.log('hit something', other, this.bounces);
      this.bounces--;
    }
    if (this.bounces <= 0) {
      objpool.bullet.release(this);
    }
  }
}
HackerBullet.prototype.set = function(args) {
  this.reset();
  for (var k in args) {
    this.object[k] = args[k];
  }
}
HackerBullet.prototype.reset = function() {
  this.bounces = 3;
  if (isJanusWeb) {
    //room._target.add(this.object._target);
    //this.object._target.properties.angular.set(Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25);
    this.object._target.properties.angular.set(0,0,0);
  }
  this.object.sync = true;
}
HackerBullet.prototype.show = function() {
  //room.addObject(this.object);
  if (isJanusWeb) {
    //this.object.mass = 1;
    this.object._target.objects.dynamics.forces[0].force.set(0,room.gravity,0);
  }

  this.bounces = 3;
}
HackerBullet.prototype.hide = function() {
  //room.removeObject(this.object);
  this.object.pos = V(Math.random() * -9999, -9999, Math.random() * -9999);
  this.object.vel = V(0,0,0);
  if (isJanusWeb) {
    this.object._target.properties.velocity.set(0,0,0);
    this.object._target.properties.acceleration.set(0,0,0);
    this.object._target.properties.angular.set(0,0,0);
    setTimeout(elation.bind(this, function() {
      this.object._target.properties.velocity.set(0,0,0);
      this.object._target.properties.acceleration.set(0,0,0);
      this.object._target.properties.angular.set(0,0,0);
      //this.object.mass = 0;
      this.object._target.objects.dynamics.forces[0].force.set(0,0,0);
    }), 10);
  }
  this.object.sync = true;
  //room.removeObject(this.object);
  this.bounces = 3;
}

function HackerSound(args) {
  this.js_id = args.id + '_' + Math.floor(Math.random() * 100000);
  this.sound = room.createObject('Sound', {id: args.id, js_id: this.js_id, visible: false});
}
HackerSound.prototype.set = function(args) {
  this.reset();
  for (var k in args) {
    this.sound[k] = args[k];
  }
}
HackerSound.prototype.reset = function() {
  if (isJanusWeb) {
    if (!this.sound._target.playing) {
      this.sound._target.play();
    } else {
      this.sound._target.stop();
      this.sound._target.seek(0);
      this.sound._target.play();
    }
  } else {
    room.playSound(this.js_id);
  }
}
HackerSound.prototype.show = function() {
  //room.addObject(this.object);
}
HackerSound.prototype.hide = function() {
  //room.removeObject(this.object);
  this.sound.stop();
}

function HackerSpark(args) {
  this.js_id = 'spark_' + Math.floor(Math.random() * 100000);
  this.sound = room.createObject('Sound', {id: 'spark', js_id: this.js_id, visible: false});
  this.particle = this.createParticle();
  if (isJanusWeb) { 
    // FIXME - setting vel above doesn't seem to work, so we override it manually
    this.particle._target.properties.particle_vel.set(-2.5,0,-2.5); 
    this.particle._target.properties.rand_vel.set(5,5,5); 
  } else {
    this.particle.vel = V(-2.5,0,-2.5); 
  }
}
HackerSpark.prototype.createParticle = function() {
  return room.createObject('Particle', { 
    col: V(.8,.8,1), 
    scale: V(.02,.02,.02),
    //vel: V(-5,0,-5), 
    rand_vel: V(5,5,5), 
    rand_scale: V(.05,.05,.05), 
    duration: 2, 
    count: 10, 
    rate: 100,
    lighting: false,
    accel: V(0, -9.8, 0),
    image_id: 'particle24',
    loop: false,
    blend_src: "src_alpha",
    blend_dest: "one"
  });
}
HackerSpark.prototype.set = function(args) {
  this.reset();
  for (var k in args) {
    this.sound[k] = args[k];
    this.particle[k] = args[k];
  }
}
HackerSpark.prototype.reset = function() {
  // Set the particle system's count value to a new value each time, so that native JanusVR will restart the loop
  var newcount = Math.floor(8 + (Math.random() - .5) * 8);
  this.particle.count = (this.particle.count != newcount ? newcount : newcount + 1);
  if (isJanusWeb) {
    if (!this.sound._target.playing) {
      this.sound._target.play();
    } else {
      this.sound._target.stop();
      this.sound._target.seek(0.01);
      this.sound._target.play();
    }
    this.particle._target.start();
  } else {
    room.stopSound(this.js_id);
    room.seekSound(this.js_id, 0);
    room.playSound(this.js_id);
    // FIXME - how do we restart particles in native?
  }
}
HackerSpark.prototype.show = function() {
  //room.addObject(this.object);
}
HackerSpark.prototype.hide = function() {
  //room.removeObject(this.object);
  this.sound.pos.y = -9999;
  this.sound.vel = V(0,0,0);
  if (isJanusWeb) {
    this.sound.stop();
  } else {
    room.stopSound(this.sound.js_id);
  }
}

function ObjectPool(size, type, args) {
  this.size = size;
  this.type = type;
  this.args = args;

  this.objects = [];
  this.unused = [];
  this.objectid = -1;
}
ObjectPool.prototype.create = function() {
  //var obj = room.createObject(this.type, this.args);
  var obj = new this.type(this.args);
  return obj;
}
ObjectPool.prototype.get = function(objargs) {
  this.objectid = (this.objectid + 1) % this.size;
  var obj = this.objects[this.objectid];
  if (!obj) {
    obj = this.objects[this.objectid] = this.create();
  }
  if (objargs) {
    obj.set(objargs);
  }
  obj.show();
  return obj;
}
ObjectPool.prototype.release = function(obj) {
  this.unused.push(obj);
  obj.hide();
}

function RemoteHacker(collider) {
  this.collider = collider;
  this.js_id = collider.js_id;
  this.userid = collider.js_id.substr('collider_'.length);
  this.healthindicator = room.objects['health_' + this.userid];
    
  if (!this.healthindicator) {
    this.healthindicator = room.createObject('Object', {
      id: 'sphere',
      js_id: 'health_' + this.userid,
      col: V(1,0,0),
      pos: V(Math.random() * -100,0,100),
      scale: V(10,10,10),
      sync: true
    });
  }
}
RemoteHacker.prototype.damage = function(amount) {
  //console.log('hurt him!', this.healthindicator, this.healthindicator.col.x);
  if (this.healthindicator) {
    var oldhealth = this.healthindicator.col.x * 100,
        newhealth = Math.max(0, Math.min(100, oldhealth - amount));

    hacker.addScore((oldhealth - newhealth) * gamecfg.score.hacker_damage);
    if (newhealth == 0) {
      hacker.addScore((oldhealth - newhealth) * gamecfg.score.hacker_destroy);
    }
    this.healthindicator.col = V(newhealth / 100, 0, 0);
    this.healthindicator.sync = true;
    objpool.spark.get({pos: this.collider.pos, col: V(1,0,0), rand_col: V(0,1,0)});
  }
}

/* Native client compatibility functions */

function getTimestamp() {
  if (isJanusWeb) {
    return performance.now();
  }
  return new Date().getTime();
}

if (typeof setTimeout != 'function') {
  var globalTimers = {},
      globalTimerID = 1;

  setTimeout = function(fn, delay) {
    var now = getTimestamp(),
        id = globalTimerID++;
    globalTimers[id] = {fn: fn, delay: delay, time: now, args: Array.prototype.splice.call(arguments, 2), repeat: false};
    return id;
  }
  setInterval = function(fn, delay) {
    var now = getTimestamp(),
        id = globalTimerID++;
    globalTimers[id] = {fn: fn, delay: delay, time: now, args: Array.prototype.splice.call(arguments, 2), repeat: true};
    return id;
  }
  clearTimeout = function(id) {
    delete globalTimers[id];
  }
  updateTimers = function() {
    var now = getTimestamp();
    var keys = Object.keys(globalTimers);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i],
          timer = globalTimers[id];
      if (timer.time + timer.delay <= now) {
        timer.fn.apply(null, timer.args);
        if (timer.repeat) {
          timer.time = now;
        } else {
          clearTimeout(id);
        }
      }
    }
  }
}

function bind(ctx, fn) {
  if (typeof fn == 'function') {
    var fnargs = Array.prototype.splice.call(arguments, 2);
    fnargs.unshift(ctx);
    return (typeof fn.bind == 'function' ?
        Function.prototype.bind.apply(fn, fnargs) : // modern browsers have fn.bind() built-in
        function() { fn.apply(ctx, arguments); }    // older browsers just need a closure to carry the context through
      );
  } else if (typeof ctx == 'function') {
    return ctx;
  }
}
