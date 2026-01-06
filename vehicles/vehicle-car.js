room.registerElement('vehicle-car', {
  enginestrength: 16000,
  wheelbase: 3.0,
  track: 1.65,
  maxsteer: 30,
  model_id: '',
  model_rotation: V(),
  seat_pos: V(-.4, .65, 0),
  owner: '',

  // Steering
  steeringResponse: 10,      // rad/s (how quickly wheels reach target steer angle)

  // Tire model
  mu: 1.05,
  maxSlipAngle: 0.6,         // rad clamp
  // Cornering stiffness PER WHEEL (not per axle anymore)
  // Start lower than your axle values (which were per axle).
  frontCornerStiffness: 10000,
  rearCornerStiffness: 15000,

  create() {
    this.mass = 1000;

    if (this.model_id) {
      this.chassis = this.createObject('object', {
        id: this.model_id,
        rotation: this.model_rotation,
        //pos: V(0, .35 + .746/2, 0),
        //xcollision_id: 'cube'
      });
    } else {
      this.chassis = this.createObject('object', {
        id: 'cube',
        scale: V(1.85, 0.7, 4.5),
        col: 'red',
        roughness: .1,
        metalness: .4,
        pos: V(0, .35 + .746/2, 0),
        xcollision_id: 'cube'
      });
      this.windshield = this.createObject('object', {
        id: 'cube',
        scale: V(1.65, .5, .02),
        color: '0 .2 1',
        opacity: .5,
        renderorder: 10,
        transparent: true,
        pos: V(0, 1.3, -.9),
        rotation: V(15, 0, 0)
      });
    }

    this.collision_scale = V(1.85, 0.7, 4.5);
    this.collision_pos = this.chassis.pos;
    this.collision_id = 'cube';
    this.collidable = false;

    this.addEventListener('collide', ev => { console.log(ev) });

    // Wheels:
    // 0,1 = front (z = -wheelbase/2)
    // 2,3 = rear  (z = +wheelbase/2)
    this.wheels = [
      this.createObject('vehicle-part-wheel', { pos: V(this.track / 2, 0, -this.wheelbase / 2), side: 'right', axle: 'front' }),
      this.createObject('vehicle-part-wheel', { pos: V(-this.track / 2, 0, -this.wheelbase / 2), side: 'left',  axle: 'front' }),
      this.createObject('vehicle-part-wheel', { pos: V(this.track / 2, 0,  this.wheelbase / 2), side: 'right', axle: 'rear' }),
      this.createObject('vehicle-part-wheel', { pos: V(-this.track / 2, 0,  this.wheelbase / 2), side: 'left',  axle: 'rear' }),
    ];

    // Give wheels tire params (so wheel update is self-contained)
    for (const w of this.wheels) {
      w.mu = this.mu;
      w.maxSlipAngle = this.maxSlipAngle;
      w.cornerStiffness = (w.axle === 'front') ? this.frontCornerStiffness : this.rearCornerStiffness;
    }

    this.seat = this.createObject('player-seat', { pos: this.seat_pos });

    this.addEventListener('click', ev => this.handleClick(ev));

    this.state = this.addControlContext('vehicle-car', {
      accelerate:  { defaultbindings: 'keyboard_w,gamepad_any_button_14' },
      reverse:     { defaultbindings: 'keyboard_s' },
      steer_left:  { defaultbindings: 'keyboard_a' },
      steer_right: { defaultbindings: 'keyboard_d,gamepad_any_axis_0' },
      brake:       { defaultbindings: 'keyboard_space,gamepad_any_button_15' },
      enter:       { defaultbindings: 'keyboard_enter,gamepad_any_button_2', onactivate: ev => {
        if (this.driving) {
          this.deactivate();
        } else if (this.distanceTo(player) < 2) {
          this.activate();
        }
      } },
    });

    this.objects.dynamics.setDamping(.4, .01);

    // Engine force (still applied at COM; you can later distribute to driven wheels)
    this.engineforcevec = V();
    this.engineforce = this.addForce('static', { relative: true, force: this.engineforcevec });

    this.gravityforce = this.addForce('static', { force: V(0, -9.8 * this.mass, 0) });

    this.steerAngle = 0;

    this.driving = false;
    player.addEventListener('player_enable', ev => {
      if (this.driving) {
        console.log('ghaskdfjh', ev);
        this.activateControlContext('vehicle-car');
      }
    });
  },

  activate() {
    this.seat.sit();
    this.activateControlContext('vehicle-car');
    this.pos.x = 0;
    this.vel.x = 0;
    this.driving = true;;
  },
  deactivate() {
    this.driving = false;
    this.deactivateControlContext('vehicle-car');
    this.seat.stand();
    player.pos = this.localToWorld(V(-1, 0, 0));
  },

  handleClick() {
    this.activate();
  },

  update: (function() {
    return function(dt) {
      // Throttle (simple)
      const throttle = (-this.state.accelerate + this.state.reverse);
      this.engineforce.update(this.engineforcevec.set(0, 0, throttle * this.enginestrength));

      // Steering input -> smoothed steerAngle
      const steerInput = (this.state.steer_right || 0) - (this.state.steer_left || 0);
      const maxSteer = this.maxsteer * Math.PI / 180;
      const targetSteer = steerInput * maxSteer;

      const maxStep = this.steeringResponse * dt;
      const err = targetSteer - this.steerAngle;
      this.steerAngle += Math.max(-maxStep, Math.min(maxStep, err));

      // Tell front wheels their steering angle and update visuals
      const steerDeg = this.steerAngle * 180 / Math.PI;
      this.wheels[0].setSteerAngle(this.steerAngle, -steerDeg);
      this.wheels[1].setSteerAngle(this.steerAngle, -steerDeg);

      // Rear wheels have zero steer
      this.wheels[2].setSteerAngle(0, 0);
      this.wheels[3].setSteerAngle(0, 0);

      // Brake can be implemented later as longitudinal tire force;
      // for now you can keep it as extra damping if desired.
      if (this.driving) {
        this.sync = true;
    console.log('sync', this.js_id, this.pos);
      }
    };
  })(),
});


room.registerElement('vehicle-part-wheel', {
  diameter: .746,
  rimsize: .482,
  width: .225,
  side: 'left',
  axle: 'front', // 'front' or 'rear'

  // Suspension
  suspension_restlength: .4,
  suspension_springtravel: .1,
  raycast_offset: 1,

  // Tire params (filled by parent)
  mu: 1.0,
  cornerStiffness: 45000, // N/rad
  maxSlipAngle: 0.6,

  create() {
    // Visuals
    this.pivot = this.createObject('object', { pos: V(0, this.diameter / 2, 0) });
    this.rim = this.pivot.createObject('object', {
      id: 'cylinder',
      scale: V(this.rimsize, this.width * 1.1, this.rimsize),
      col: 'silver',
      rotation: V(0, 0, 90),
      pos: V(this.width * .05 + (this.side == 'left' ? 0 : this.width), 0, 0)
    });
    this.tire = this.pivot.createObject('object', {
      id: 'cylinder',
      scale: V(this.diameter, this.width, this.diameter),
      col: 'black',
      rotation: V(0, 0, 90),
      pos: V(this.side == 'left' ? 0 : this.width, 0, 0)
    });
    this.pivot.angular = V(Math.PI, 0, 0);

    // Contact + suspension debug
    this.down = V(0, -1, 0);
    this.suspension_attach = V(0, this.suspension_restlength, 0);
    this.suspension_raycast_origin = V(0, this.suspension_restlength + this.raycast_offset, 0);
    this.suspension_end = this.pivot.pos;
    this.suspension = this.createObject('linesegments', {
      positions: [this.suspension_attach, this.suspension_end],
      col: 'yellow',
      depth_test: false,
      renderorder: 20
    });

    this.suspension_minlength = this.suspension_restlength - this.suspension_springtravel;
    this.suspension_maxlength = this.suspension_restlength + this.suspension_springtravel;

    // Suspension spring (parent space)
    this.springStrength = 50000;
    this.spring = this.parent.addForce('spring', {
      connectionpoint: this.pos.clone().add(V(0, this.suspension_restlength, 0)),
      other: this.objects['dynamics'],
      strength: this.springStrength,
      restlength: this.suspension_restlength,
    });

    // Tire lateral force: one per wheel, applied at wheel attach point
    this.tireForceVec = V();
    this.tireForce = this.parent.addForce('static', {
      relative: true,
      force: this.tireForceVec,
      point: this.pos.clone()
    });

    // State
    this.grounded = false;
    this.groundNormal = V(0,1,0);
    this.steerAngle = 0;
    this.Fy = 0; // optional relaxation later

    // Scratch vectors to avoid allocations
    this._fwd = V();
    this._right = V();
    this._up = V(0,1,0);
    this._wheelFwd = V();
    this._wheelRight = V();
    this._rWorld = V();
    this._v = V();
    this._vPoint = V();
    this._tmp = V();
  },

  setSteerAngle(rad, visualDeg) {
    this.steerAngle = rad;
    // Visual wheel steering:
    this.rotation.y = visualDeg;
  },

  update(dt) {
    const wheelRadius = this.diameter / 2;

    // --- Ground contact via raycast ---
    this.grounded = false;

    const hits = this.raycast(this.down, this.suspension_raycast_origin, null, this.suspension_maxlength + wheelRadius + this.raycast_offset);
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      if (hit.object === this.parent || this.parent.contains(hit.object)) continue;

      // If ray hit is within wheel radius of suspension end, we’re touching ground.
      // Your existing logic uses hit.distance; keep it.
      if (hit.distance <= this.raycast_offset + wheelRadius) {
        this.grounded = true;
        if (hit.normal) this.groundNormal.copy(hit.normal).normalize();

        this.suspension_springlength = this.suspension_restlength - (hit.distance - this.raycast_offset);
        this.pivot.pos.y = this.suspension_springlength + wheelRadius;
        this.suspension.updateLine();

        this.spring.disabled = false;
        this.spring.restlength = this.suspension_restlength + this.suspension_springlength;
      }

      break;
    }

    if (!this.grounded) {
      // Airborne: disable spring + tire force
      this.spring.disabled = true;
      this.tireForce.update(this.tireForceVec.set(0,0,0));
      return;
    }

    // --- Tire lateral force (per wheel) ---
    // We’ll compute slip at this wheel contact point.
    const dyn = this.parent.objects.dynamics;

    // World chassis directions
    dyn.localToWorldDir(this._fwd.set(0,0,-1));
    dyn.localToWorldDir(this._right.set(1,0,0));
    // Up in world: use ground normal so forces stay on the surface plane
    const n = this.groundNormal || this._up;

    // Wheel heading in world (steer only on front)
    const cosS = Math.cos(this.steerAngle), sinS = Math.sin(this.steerAngle);
    this._wheelFwd.copy(this._fwd).multiplyScalar(cosS).add(this._tmp.copy(this._right).multiplyScalar(sinS));

    // wheelRight = n x wheelFwd (guarantees on-plane lateral dir)
    this._wheelRight.crossVectors(n, this._wheelFwd).normalize();
    // re-orthonormalize wheelFwd onto plane too
    this._wheelFwd.crossVectors(this._wheelRight, n).normalize();

    // Velocity at wheel point: v + w x r
    const omega = dyn.angularVelocity || this.parent.angularVelocity || V(0,0,0);
    this._v.copy(this.parent.velocity);

    // r (local) -> world dir
    this._rWorld.copy(this.pos);
    dyn.localToWorldDir(this._rWorld);

    this._vPoint.copy(this._v).add(this._tmp.crossVectors(omega, this._rWorld));

    // Components in wheel frame
    const vLong = this._vPoint.dot(this._wheelFwd);
    const vLat  = this._vPoint.dot(this._wheelRight);

    // If not rolling, don’t generate meaningful lateral force (prevents pivot-in-place)
    const vLongAbs = Math.abs(vLong);
    const rollStart = 1.5, rollFull = 6.0; // tweak or expose
    const t = Math.max(0, Math.min(1, (vLongAbs - rollStart) / (rollFull - rollStart)));
    const rollGrip = t * t * (3 - 2 * t); // smoothstep

    // Slip angle
    const eps = 1e-3;
    let alpha = Math.atan2(vLat, Math.max(eps, vLongAbs));
    alpha = Math.max(-this.maxSlipAngle, Math.min(this.maxSlipAngle, alpha));

    // Estimate normal load from suspension compression (simple proxy)
    // compression = how much shorter than rest
    const compression = Math.max(0, this.suspension_restlength - this.suspension_springlength);
    let Fz = compression * this.springStrength;   // N (rough)
    if (!isFinite(Fz) || Fz < 0) Fz = 0;

    // Linear tire: Fy = -C * alpha
    let Fy = -this.cornerStiffness * alpha;

    // Friction clamp: |Fy| <= mu * Fz
    const FyMax = this.mu * Fz;
    if (Fy >  FyMax) Fy =  FyMax;
    if (Fy < -FyMax) Fy = -FyMax;

    // Low-speed rolling gate
    Fy *= rollGrip;

    // Apply in parent LOCAL space (+X right)
    // Our Fy is along wheelRight (world). Project onto chassis right (world) then apply to local X.
    const Fy_local = Fy * this._wheelRight.dot(this._right);

    this.tireForce.update(this.tireForceVec.set(Fy_local, 0, 0));
  }
});

room.registerElement('vehicle-spawner', {
  vehicle: false,
  vehicleconfig: '',

  create() {
    this.text = this.createObject('text', { text: 'Click to Drive', pos: V(0, 1, 0), font_scale: false, });
    this.button = this.createObject('pushbutton', { onactivate: ev => this.handleClick(ev), col: 'red', });
  },
  handleClick(ev) {
console.log('ahhjj');
    if (!this.vehicle) {
      let username = player.getNetworkUsername();
      let vehiclecfg = {
        owner: username,
        js_id: 'vehicle-' + username,
        sync: true,
        rotation: this.rotation,
        pos: this.localToWorld(V(-2, 0, 0)),
      };
      if (this.vehicleconfig) {
        let json = JSON.parse(this.vehicleconfig);
        elation.utils.merge(json, vehiclecfg);
      }

      this.vehicle = room.createObject('vehicle-car', vehiclecfg);
console.log('go vehicle', vehiclecfg, this.vehicleconfig, this.vehicle.js_id, this.vehicle);
    }
  }
});
