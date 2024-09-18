room.registerElement('vehicle-car', {
  create() {
    this.mass = 1000;
    this.chassis = this.createObject('object', { id: 'cube', scale: V(1.85, 0.7, 4.5), col: 'red', roughness: .1, metalness: .4, pos: V(0, .35 + .746/2, 0), xcollision_id: 'cube'});

    //this.setCollider('box', {min: this.chassis.scale.clone().multiplyScalar(-.5), max: this.chassis.scale.clone().multiplyScalar(.5), trigger: true});
    this.collision_scale = V(1.85, 0.7, 4.5);
    this.collision_pos = this.chassis.pos;
    this.collision_id = 'cube';
    this.collidable = false;
//console.log('crasher', this.objects.dynamics.collider);
this.addEventListener('collide', ev => { console.log(ev) } );
    
    this.wheels = [
      //this.createObject('vehicle-part-wheel', { pos: V(0, 0, 0), side: 'right'}),

      this.createObject('vehicle-part-wheel', { pos: V(.925, 0, 1.5), side: 'right'}),
      this.createObject('vehicle-part-wheel', { pos: V(-.925, 0, 1.5), side: 'left'}),
      this.createObject('vehicle-part-wheel', { pos: V(.925, 0, -1.5), side: 'right'}),
      this.createObject('vehicle-part-wheel', { pos: V(-.925, 0, -1.5), side: 'left'}),
    ];
    this.seat = this.createObject('player-seat', { pos: V(-.4, .65, 0) });
    this.windshield = this.createObject('object', { id: 'cube', scale: V(1.65, .5, .02), color: '0 .2 1', opacity: .5, renderorder: 10, transparent: true, pos: V(0, 1.3, -.9), rotation: V(15, 0, 0) });

    this.addEventListener('click', ev => this.handleClick(ev));

    this.state = this.addControlContext('vehicle-car', {
      'accelerate': {defaultbindings: 'keyboard_w,gamepad_any_button_14'},
      'reverse': {defaultbindings: 'keyboard_s'},
      'steer_left': { defaultbindings: 'keyboard_a' },
      'steer_right': { defaultbindings: 'keyboard_d,gamepad_any_axis_0' },
      'brake': { defaultbindings: 'keyboard_space,gamepad_any_button_15' },
    });

    this.objects.dynamics.setDamping(.4, .01);
    this.engineforcevec = V();
    this.engineforce = this.addForce('static', { relative: true, force: this.engineforcevec });
    this.lateralforcevec = V();
    this.lateralforce = this.addForce('static', { relative: true, force: this.lateralforcevec });

    this.gravityforce = this.addForce('static', { force: V(0, -9.8 * this.mass, 0) });
console.log('my gravity', this.gravityforce);
  },
  activate() {
    //this.seat.sit();
    //this.activateControlContext('vehicle-car');
    this.pos.x = 0;
    this.vel.x = 0;
    this.engineforce.update(this.engineforcevec.set(0, 0, -4000));
  },
  handleClick(ev) {
    this.activate();
  },
  update: (function() {
    const cross = V(),
          vrel = V(),
          fwd = V(0,0,-1),
          up = V(0,1,0);

    return function(dt) {
      this.objects.dynamics.localToWorldDir(fwd.set(0,0,-1));
      vrel.copy(this.velocity).normalize();
      cross.crossVectors(fwd, vrel);

      let sina = cross.length(),
          cosa = fwd.dot(vrel),
          sideslip = Math.atan2(sina, cosa);
      //this.engineforce.update(this.engineforcevec.set(0, 0, -this.state.accelerate * 1000));
    }
  })(),
});
room.registerElement('vehicle-part-wheel', {
  diameter: .746,
  rimsize: .482,
  width: .225,
  side: 'left',

  suspension_restlength: .4,
  suspension_springtravel: .1,

  suspension_springlength: .5,
  create() {
    this.pivot = this.createObject('object', { pos: V(0, this.diameter / 2, 0)});
    this.rim = this.pivot.createObject('object', { id: 'cylinder', scale: V(this.rimsize, this.width * 1.1, this.rimsize), col: 'silver', rotation: V(0, 0, 90), pos: V(this.width * .05 + (this.side == 'left' ? 0 : this.width), 0, 0)});
    this.tire = this.pivot.createObject('object', { id: 'cylinder', scale: V(this.diameter, this.width, this.diameter), col: 'black', rotation: V(0, 0, 90), pos: V(this.side == 'left' ? 0 : this.width, 0, 0)});
    this.pivot.angular = V(Math.PI, 0, 0);

    this.down = V(0, -1, 0);
    this.suspension_attach = V(0, this.suspension_restlength, 0);
    this.suspension_end = this.pivot.pos;
    this.suspension = this.createObject('linesegments', {positions: [this.suspension_attach, this.suspension_end], col: 'yellow', depth_test: false, renderorder: 20});

    this.suspension_minlength = this.suspension_restlength - this.suspension_springtravel;
    this.suspension_maxlength = this.suspension_restlength + this.suspension_springtravel;

    this.spring = this.parent.addForce('spring', {
      connectionpoint: this.pos.clone().add(V(0, this.suspension_restlength, 0)),
      other: this.objects['dynamics'],
      //otherconnectionpoint: this.pivot.pos,
      strength: 50000,
      //strength: 6,
      restlength: this.suspension_restlength,
    });
console.log('boinger', this.spring);
  },
  update(dt) {
    let wheelRadius = this.diameter / 2;
    let hits = this.raycast(this.down, this.suspension_attach, null, this.suspension_maxlength + wheelRadius);
    for (let i = 0; i < hits.length; i++) {
      let hit = hits[i];
      if (hit.object === this.parent || this.parent.contains(hit.object)) continue;

      //console.log(hit);
      this.suspension_springlength = this.suspension_restlength - hit.distance;
      this.pivot.pos.y = this.suspension_springlength + wheelRadius;
      this.suspension.updateLine();

    this.spring.disabled = false;
      this.spring.restlength = this.suspension_restlength + this.suspension_springlength;
//console.log(this.suspension_springlength);
      
      return;
      
    }
    // no collisions, reset spring
/*
    this.spring.disabled = true;
console.log('disabled');
    this.suspension_springlength = 0;
    this.spring.restlength = this.suspension_restlength;
    this.pivot.pos.y = -this.suspension_springlength + wheelRadius;
*/


  }
});
