var tmpvec = V();

room.registerElement('viewer', {
  create() {
    //this.addEventListener('update', this.updateStuff);
    //this.onupdate = this.updateStuff;
   // this.addEventListener('update', this.updateStuff);

    /*
    this.hand_left = this.createObject('object', {
      id: 'sphere',
      js_id: 'hand_left',
      collision_id: 'sphere',
      collision_trigger: true,
      scale: V(.2, .2, .2),
      col: V(1,0,0,.2),
      visible: false,
      mass: 1
    });
    this.hand_right = this.createObject('object', {
      id: 'sphere',
      js_id: 'hand_right',
      collision_id: 'sphere',
      collision_trigger: true,
      scale: V(.2, .2, .2),
      col: V(1,0,0,.2),
      visible: false,
      mass: 1
    });
    */
    this.hand_left = this.createObject('viewer_hand', {
      hand: 'left'
    });
    this.hand_right = this.createObject('viewer_hand', {
      hand: 'right'
    });
	  console.log('made stuff', this);

    this.hand_left.oncollision = this.handleHandCollision;
    //this.hand_right.oncollision = this.handleHandCollision;
  },
  pickup(obj, hand) {
    console.log('viewer is now holding', obj);
    if (hand) {
      this['holding_' + hand] = obj;
    } else {
      this.holding = obj;
    }
    // Disable collisions for the object while we're holding it, but keep track of what its collider was
    //obj.pickable = false;
    //this.holdingObjectCollider = obj.children[0].collision_id;
    //obj.children[0].collision_id = '';
    if (obj.disableCollider) {
      obj.disableCollider();
    } else {
      obj.collision_id = '';
    }
    room.addEventListener('click', () => this.drop());
    room.addEventListener('mousemove', this.mousemove);
  },
  drop(hand) {
    var dropname = 'holding' + (hand ? '_' + hand : '');
    if (this[dropname]) {
      // Restore collider, and drop the object
      var obj = this[dropname];
      //obj.pickable = true;
      //obj.children[0].collision_id = this.holdingObjectCollider;
      //obj.enableCollider();
      obj.drop();

      /*
      if (player.cursor_object) {
        var cursorobj = room.objects[player.cursor_object];
        var mediaplayer = cursorobj.parent; // FIXME hack!
        if (mediaplayer.mediatype == obj.mediatype) {
          mediaplayer.play(obj);
        }
      }
      */
      let mediaplayers = player.raycast(V(0,0,-1), null, 'mediaplayer'); // FIXME - allocation every frame, could be optimized away
      if (mediaplayers.length > 0) {
        let mediaplayer = mediaplayers[0].object.parent // FIXME - we're actually grabbing the collider, so we assume the parent is our media player. This may not always be the case.
        if (obj && mediaplayer.canPlay(obj)) {
          mediaplayer.play(this.holding);
        }
      }
      this[dropname] = false;
      room.removeEventListener('click', this.drop);
      room.removeEventListener('mousemove', this.mousemove);
    }
  },
  isHolding(type) {
    if (this.holding && this.holding.hasTag(type)) return this.holding;
    //if (this.holding_left && this.holding_left.hasTag(type)) return this.holding_left;
    //if (this.holding_right && this.holding_right.hasTag(type)) return this.holding_right;
    let holding_left = this.hand_left.isHolding(type),
        holding_right = this.hand_right.isHolding(type);
    return holding_left || holding_right;
  },
  mousemove(ev) {
return;
    if (this.holding) {
      tmpvec.copy(ev.data.point);
      let dist = tmpvec.length();
console.log(tmpvec, dist, this.holding.parent);
      this.holding.pos = this.holding.parent.worldToLocal(this.localToWorld(tmpvec.normalize()));
      this.holding.ydir = ev.data.face.normal;
    }
  },
  update() {
    /*
    if (room.objects['light']) {
      var now = new Date().getTime();
      //room.objects['light'].pos = V(Math.sin(now / 1000) * .5, 2, 0);
    }

    var taggedobjects = room.getObjectsByClassName('holdable');
    var grabdist_left_p1 = player.hand0_p0.distanceTo(player.hand0_p1),
        grabdist_left_p2 = player.hand0_p0.distanceTo(player.hand0_p2),
        grabdist_right_p1 = player.hand1_p0.distanceTo(player.hand1_p1),
        grabdist_right_p2 = player.hand1_p0.distanceTo(player.hand1_p2);

    let grabdist_left = Math.min(grabdist_left_p1, grabdist_left_p2),
        grabdist_right = Math.min(grabdist_right_p1, grabdist_right_p2);

    let grabdist = .025;
    let grabbing_left = grabdist_left < grabdist;
    let grabbing_right = grabdist_right < grabdist;

    if (grabbing_left && !this.grabbing_left) {
      this.dispatchEvent({type: 'grabstart', data: {hand: 'left', object: this.holding_left}});
    }
    if (grabbing_right && !this.grabbing_right) {
      this.dispatchEvent({type: 'grabstart', data: {hand: 'right', object: this.holding_right}});
    }
    this.grabbing_left = grabbing_left;
    this.grabbing_right = grabbing_right;

    // TODO - we could give more feedback about pinch state by setting the color to some gradient based on how close the fingertips are
    var leftcol = (this.grabbing_left ? 0x00ff00 : 0xff0000);
    var rightcol = (this.grabbing_right ? 0x00ff00 : 0xff0000);

    if (this.hand_left && player.hand0_pos) {
      if (player.tracker && player.tracker.hands.left) {
        player.tracker.hands.left.fingers[0].fingertip.material.color.setHex(leftcol);
        player.tracker.hands.left.fingers[1].fingertip.material.color.setHex(leftcol);
        player.tracker.hands.left.fingers[2].fingertip.material.color.setHex(leftcol);
      }

      this.hand_left.pos = player.hand0_pos;

      if (this.holding_left && !this.grabbing_left) {
        this.drop('left');
      } else if (this.holding_left && this.grabbing_left) {
        //leftcol.z = 1;
        this.holding_left.pos = this.holding_left.parent.worldToLocal(player.hand0_pos);
        this.holding_left.xdir = player.hand0_xdir;
        this.holding_left.ydir = player.hand0_ydir;
        this.holding_left.zdir = player.hand0_zdir;
      }
    }
    if (this.hand_right && player.hand1_pos) {
      this.hand_right.pos = player.hand1_pos;
      if (this.holding_right && !this.grabbing_right) {
        this.drop('right');
      } else if (this.holding_right && this.grabbing_right) {
        //rightcol.z = 1;
        this.holding_right.pos = this.holding_right.parent.worldToLocal(player.hand1_pos);
        this.holding_right.xdir = player.hand1_xdir;
        this.holding_right.ydir = player.hand1_ydir;
        this.holding_right.zdir = player.hand1_zdir;
      }
    }
    for (var i = 0; i < taggedobjects.length; i++) {
      if (taggedobjects[i].distanceTo(this.hand_left) < taggedobjects[i].radius) {
        if (!this.holding_left && this.grabbing_left) {
          this.pickup(taggedobjects[i], 'left');
        } 
      }
      if (taggedobjects[i].distanceTo(this.hand_right) < taggedobjects[i].radius) {
        //rightcol.z = 1;
        if (!this.holding_right && this.grabbing_right) {
          this.pickup(taggedobjects[i], 'right');
        }
      }
    }
    this.hand_left.col = leftcol;
    this.hand_left.setOpacity(.2);
    this.hand_right.col = rightcol;
    this.hand_right.setOpacity(.2);
    */
    player.head.localToWorld(this.pos.set(0,0,0));
    if (this.holding) {
      let hits = player.raycast();
      if (hits.length > 0) {
        let hit = hits[0];
        tmpvec.copy(hit.point);
        let dist = player.head.distanceTo(tmpvec);
        if (dist < 1.5) {
    //console.log(tmpvec, dist, this.holding.parent);
          this.holding.pos = this.holding.parent.worldToLocal(tmpvec);
          //this.holding.ydir = hit.face.normal;
          this.holding.ydir.set(0,1,0);
          this.holding.zdir = player.localToWorld(V(0,0,1)).sub(player.localToWorld(V(0)));
        } else {
          this.holding.pos = this.holding.parent.worldToLocal(player.head.localToWorld(tmpvec.set(0,-.1,-.2)));
          this.holding.ydir.set(0,1,0);
          this.holding.zdir = player.localToWorld(V(0,0,1)).sub(player.localToWorld(V(0)));
        }
      }
    }
  },
  handleHandCollision(ev) {
    let obj = ev.data;
    if (obj.mediatype) {
      if (this.holding_left && this.holding_left.mediatype == obj.mediatype) {
        console.log('bang', obj);
      }
      if (this.holding_right && this.holding_right.mediatype == obj.mediatype) {
        console.log('bing', obj);
      }
    }
  }
});

room.registerElement('viewer_hand', {
  hand: 'left',
  grabsize: 0.025,
  grabbing: false,
  grabamount: 0,
  holding: false,

  create() {
    this.debug = this.createObject('object', {
      id: 'sphere',
      js_id: 'hand_' + this.hand,
      //collision_id: 'sphere',
      //collision_trigger: true,
      scale: V(.2, .2, .2),
      col: V(1,0,1,.2),
      visible: false,
      mass: 1
    });
    this.laser = this.createObject('object', {
      pos: V(0, 0, 0)
    });
    this.laserbeam = this.laser.createObject('object', {
      id: 'cylinder',
      scale: V(.0005, 1, .0005),
      col: V(1, 1, 1, .2),
      rotation: V(30, 0, 0),
      lighting: false
    });

    this.palm = {
      matrix: new THREE.Matrix4(),
      xdir: V(1,0,0),
      ydir: V(0,1,0),
      zdir: V(0,0,1),
      up: V(0,1,0),
      vel: V(0,0,0),
      dropvel: V(0,0,0),
      lastpos: V()
    };
  },
  update(dt) {
    let handid = this.getHandID();
    
    if (!player[handid + '_active']) {
      this.laser.visible = false;
    } else {
      this.laser.visible = true;
      let grabdist_p1 = player[handid + '_p0'].distanceTo(player[handid + '_p1']),
          grabdist_p2 = player[handid + '_p0'].distanceTo(player[handid + '_p2']),
          grabdist = Math.min(grabdist_p1, grabdist_p2);

      this.updatePalmRotation();
      this.updateRaycast();

      if (grabdist <= this.grabsize && !this.grabbing) {
        this.startGrabbing();
      } else if (grabdist > this.grabsize && this.grabbing) {
        this.stopGrabbing();
      }
      this.setGrabAmount((Math.max(0.01, Math.min(2, grabdist / this.grabsize)) - 1));
      let finger = player.tracker.hands[this.hand].fingers[1],
          pointdir = V(finger.joints[4].position).sub(finger.joints[3].position).normalize();

      this.laser.xdir = this.palm.xdir;
      this.laser.ydir = this.palm.ydir;
      this.laser.zdir = this.palm.zdir;

      /*
      let mediaplayers = this.laserbeam.raycast(V(0,1,0), null, 'mediaplayer'); // FIXME - allocation every frame, could be optimized away
      if (mediaplayers.length > 0) {
        let mediaplayer = mediaplayers[0].object.parent // FIXME - we're actually grabbing the collider, so we assume the parent is our media player. This may not always be the case.
        this.laserbeam.col = 'green';
        if (this.holding && mediaplayer.canPlay(this.holding)) {
          mediaplayer.showPlaceholder(true);
        }
      } else {
        this.laserbeam.col = 'red';
      }
      // TODO - fire event on transitions

      let grabbable = this.laserbeam.raycast(V(0,1,0), null, 'grabbable'); // FIXME - allocation every frame, could be optimized away
      if (grabbable.length > 0) {
        this.laserbeam.col = 'green';
      }
      */

      let lasercolor = 'red';
      if (this.raycasthits.length > 0) {
        for (let i = 0; i < this.raycasthits.length; i++) {
          let hit = this.raycasthits[i];
          let mediaplayer = hit.object.getParentByClassName('mediaplayer');
          if (mediaplayer) {
            //console.log('hit a player!', mediaplayer);
            lasercolor = 'blue';
            if (this.holding && mediaplayer.canPlay(this.holding)) {
              mediaplayer.showPlaceholder(true);
            }
          }

          let grabbable = (hit.object.hasClass('grabbable') ? hit.object : hit.object.getParentByClassName('grabbable'));
          if (grabbable) {
            lasercolor = 'green';
            if (this.grabbing) {
              grabbable.dispatchEvent({type: 'grabmove', data: {hand: this, object: hit.object, hit: hit }});
            } else {
              grabbable.dispatchEvent({type: 'grabhover', data: {hand: this, object: hit.object, hit: hit }});
            }
          }
        }
      }
      this.laserbeam.col = lasercolor;

      this.pos = player[handid + '_pos'];

      if (!this.palm.lastpos) {
        //this.palm.lastpos = V(this.pos);
      }
      this.palm.vel.subVectors(this.pos, this.palm.lastpos).multiplyScalar(1 / dt);
      this.palm.lastpos.copy(this.pos);

      if (this.holding) {
        //leftcol.z = 1;
        this.holding.pos = this.holding.parent.worldToLocal(V(player[handid + '_pos']));
        this.holding.xdir = this.palm.xdir;
        this.holding.ydir = this.palm.ydir;
        this.holding.zdir = this.palm.zdir;
      }
    }
  },
  updatePalmRotation() {
    let palmrot = this.palm.matrix;
    palmrot.extractRotation(player.tracker.hands[this.hand].palm.matrixWorld);
    this.palm.xdir.set(1,0,0).applyMatrix4(palmrot);
    this.palm.ydir.set(0,1,0).applyMatrix4(palmrot);
    this.palm.zdir.set(0,0,1).applyMatrix4(palmrot);
  },
  updateRaycast() {
    this.raycasthits = this.laserbeam.raycast(this.palm.up);
  },
  getHandID() {
    return (this.hand == 'left' ? 'hand0' : 'hand1');
  },
  startGrabbing() {
    if (!this.grabbing) {
      console.log('grab!');
      this.grabbing = true;
      if (!this.grabtimer) {
        this.grabtimer = setTimeout(() => { if (!this.holding) this.grab(); }, 100);
      }
      if (this.droptimer) {
        clearTimeout(this.droptimer);
        this.droptimer = false;
      }
    }
  },
  grab() {
    console.log('real grab');
    let handid = this.getHandID(),
        thumbpos = V(player[handid + '_p0']),
        fingerpos = V(player[handid + '_p1']);

    if (false) {
    // Cast a ray between thumb and forefinger to determine which object, if any, we are attempting to grab
    let dir = V(fingerpos).sub(thumbpos).normalize();
    let hits = room.raycast(dir, thumbpos, 'grabbable');

    if (hits.length > 0) {
      for (let i = 0; i < hits.length; i++) {
        let hit = hits[i];

        // TODO - we should have some distance handling here, and only actually allow grabs of objects which are within our grabsize
        // A sphere collider that scales to the distance between finger and thumb could also be more reliable than a raycast

        /*
        if (hit.distance > this.grabsize) {
          console.log('hit was too too far away', hit.distance);
          break;
        } else {
          hit.object.dispatchEvent({type: 'grabstart', data: {hand: this, hit: hit }});
        }
        */

        // Instead, we just pick the first collision and go with it.  Works for our simple world, for now.
        hit.object.dispatchEvent({type: 'grabstart', data: {hand: this, object: hit.object, hit: hit }});
        break;
      }
    }
    } else {
      if (this.raycasthits.length > 0) {
        for (let i = 0; i < this.raycasthits.length; i++) {
          let hit = this.raycasthits[i];

          let grabbable = (hit.object.hasClass('grabbable') ? hit.object : hit.object.getParentByClassName('grabbable'));
          if (grabbable) {
            console.log('grabbable!', grabbable);
            grabbable.dispatchEvent({type: 'grabstart', data: {hand: this, object: hit.object, hit: hit }});
            break;
          }
        }
      }
    }


    if (this.droptimer) {
      clearTimeout(this.droptimer);
    }
    this.dispatchEvent({type: 'grabstart', data: {hand: this.hand, object: this.holding}});
    this.grabbing = true;
  },
  stopGrabbing() {
    console.log('no more grab!');
    this.grabbing = false;

    if (this.grabtimer) {
      clearTimeout(this.grabtimer);
      this.grabtimer = false;
    }
    this.palm.dropvel.copy(this.palm.vel);
    if (!this.droptimer) {
      // Delaying the drop lets us debounce grab/drop events
      this.droptimer = setTimeout(() => this.drop(), 20);
    }
  },
  setGrabAmount(amount) {
    let color = (this.grabbing ? 0x00ff00 : 0xff0000);
    if (player.tracker && player.tracker.hands.left) {
      player.tracker.hands[this.hand].fingers[0].fingertip.material.color.setHex(color);
      player.tracker.hands[this.hand].fingers[1].fingertip.material.color.setHex(color);
      player.tracker.hands[this.hand].fingers[2].fingertip.material.color.setHex(color);

      player.tracker.hands[this.hand].fingers[0].fingertip.material.opacity = .6;
      player.tracker.hands[this.hand].fingers[1].fingertip.material.opacity = .6;
      player.tracker.hands[this.hand].fingers[2].fingertip.material.opacity = .6;
    }
  },
  pickup(obj) {
    if (obj && !this.holding) {
      this.holding = obj;

      this.updateMediaplayerPlaceholders();
      obj.dispatchEvent({type: 'grabstart', data: {hand: this.hand, object: this.holding}});
    }
  },
  drop() {
    console.log('actual drop', this.holding);
    if (this.holding) {
      let handid = this.getHandID();
      /*
      let mediaplayers = room.raycast(this.palm.zdir, player[handid + '_pos'], 'mediaplayer');
      console.log('my mediaplayers?', mediaplayers);
      if (mediaplayers.length > 0) {
        let mediaplayer = mediaplayers[0].object.parent;
        console.log('play media on player', this.holding, mediaplayer);
        mediaplayer.play(this.holding);
      } else {
        this.holding.reset();
      }
      */
      let handled = false;
      if (this.raycasthits.length > 0) {
        for (let i = 0; i < this.raycasthits.length; i++) {
          let hit = this.raycasthits[i];
          let mediaplayer = hit.object.getParentByClassName('mediaplayer');
          if (mediaplayer && mediaplayer.canPlay(this.holding)) {
            mediaplayer.play(this.holding);
            handled = true;
            break;
          }
        }
      }
      if (!handled) {
        // TODO - impart velocity, then reset on a timeout for extra fun
        room.appendChild(this.holding);
        this.holding.accel = V(0, -4.9, 0); // half gravity for more fun
        this.holding.vel = V(this.palm.dropvel).multiplyScalar(2); // 2x velocity, also more fun
        let obj = this.holding;
        setTimeout(() => obj.reset(), 750);;
      }
      this.dispatchEvent({type: 'grabend', data: {hand: this.hand, object: this.holding}});
      this.holding.dispatchEvent({type: 'grabend', data: {hand: this.hand, object: this.holding}});

      this.holding = false;
    }
  },
  isHolding(type) {
    if (this.holding && this.holding.hasTag(type)) return this.holding;
  },
  updateMediaplayerPlaceholders() {
    if (this.holding) {
      let players = room.getObjectsByClassName('mediaplayer');
      for (let i = 0; i < players.length; i++) {
        let mediaplayer = players[i];
        if (mediaplayer.canPlay(this.holding)) {
          mediaplayer.showPlaceholder(false);
        }
      }
    }
  }
});
