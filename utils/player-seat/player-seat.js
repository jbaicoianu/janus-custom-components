room.registerElement('player-seat', {
  occupant: '',
  seatheight: 0.45,

  sitstart_anim: 'stand_to_sit',
  sit_anim: 'sit',
  sitend_anim: 'sit_to_stand',

  seatcolor: new THREE.Color('#00aa00'),
  seatcolor_hover: new THREE.Color('lime'),
  seatcolor_seated: new THREE.Color('white'),
  seatcolor_occupied: new THREE.Color('red'),

  onsit: new CustomEvent('sit'),
  onstand: new CustomEvent('stand'),

  create() {
    this.seated = false;
    this.occupant = '';

    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 256;
    let lineWidth = 16;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(lineWidth / 2, lineWidth / 2, canvas.width - lineWidth, canvas.height - lineWidth, lineWidth * 2);
    ctx.stroke();

    this.loadNewAsset('image', { id: 'seat-indicator', canvas: canvas });
    this.indicator = this.createObject('object', {
      id: 'plane',
      scale: V(.5, .5, 1),
      rotation: V(90, 0, 0),
      emissive: this.seatcolor.clone(), // FIXME - if we don't clone here, we use the same color object for all seat objects and that's bad. This should happen in janusbase somewhere
      //wireframe: true,
      image_id: 'seat-indicator',
      collision_id: 'cube',
      collision_scale: V(1, 1, .01),
      collidable: false,
      pickable: true,
      opacity: .9,
      renderorder: 10,
      pos: V(0, this.seatheight, 0),
      cull_face: 'none',
    });
    this.indicator.addEventListener('click', ev => this.handleClick(ev));
    this.indicator.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.indicator.addEventListener('mouseout', ev => this.handleMouseOut(ev));

    this.wasoccupied = false
    this.addControlContext('player_seated', {
      'noop': {defaultbindings: 'keyboard_w,keyboard_a,keyboard_s,keyboard_d,keyboard_space'}
    });
    player.addEventListener('sit', ev => this.handlePlayerSit(ev));
    player.addEventListener('stand', ev => this.handlePlayerStand(ev));
  },
  update() {
    if (this.seated) {
      player.pos = this.localToWorld(V(0,0,-.25)); 
      //player.dir = this.localToWorld(V(0,0,-1)).sub(player.pos);
      player.turnTo(this.localToWorld(V(0,0,-1)));
      this.sync = true;
    }
    if (this.occupant && !this.wasoccupied) {
      this.indicator.emissive = (this.seated ? this.seatcolor_seated : this.seatcolor_occupied);
      this.wasoccupied = true;
    } else if (!this.occupant && this.wasoccupied) {
      this.wasoccupied = false;
      this.indicator.emissive = (this.seated ? this.seatcolor_seated : this.seatcolor);
    }
    if (this.occupant && this.occupant != player.getNetworkUsername() && !(this.occupant in room.players)) {
      // Seat is occupied by a user that is no longer in the room
      this.occupant = '';
      this.sync = true;
      this.indicator.emissive = this.seatcolor;
    }
  },
  handleClick(ev) {
    if (!this.seated && !this.occupant) {
      this.sit();
    } else if (this.seated && this.occupant) {
      this.stand();
    }
  },
  sit() {
    if (!this.seated && !this.occupant) {
      if (player.hasAnimation(this.sit_anim)) {
        if (player.hasAnimation(this.sitstart_anim)) {
          player.setAnimationSequence([this.sitstart_anim, this.sit_anim]);
        } else {
          player.defaultanimation = this.sit_anim;
        }
      }
      this.seated = true;
      this.occupant = player.getNetworkUsername();
      this.activateControlContext('player_seated');
      player.turnhead = true;
      player.pos = this.localToWorld(V(0,0,0)); 
      player.neck.position.y = 1;
      this.sync = true;
      this.indicator.emissive = this.seatcolor_seated;
      this.dispatchEvent({type: 'sit'});
      player.dispatchEvent({type: 'sit', data: this});
    }
  },
  stand() {
    if (this.seated) {
      if (player.hasAnimation(this.sitend_anim) && player.hasAnimation('idle')) {
        player.setAnimationSequence(['sit_to_stand', 'idle']);
      } else {
        player.defaultanimation = 'idle';
      }
      this.seated = false;
      this.deactivateControlContext('player_seated');
      player.neck.position.y = 1.45;
      player.turnhead = false;

      this.occupant = '';
      this.sync = true;
      this.indicator.emissive = this.seatcolor;
      this.dispatchEvent({type: 'stand'});
      player.dispatchEvent({type: 'stand', data: this});
    }
  },
  handlePlayerSit(ev) {
    if (this.seated && this.occupant == player.getNetworkUsername() && ev.data !== this) {
      // We sat in another seat while already seated
      this.occupant = '';
      this.sync = true;
      this.indicator.emissive = this.seatcolor;
      this.seated = false;
      this.deactivateControlContext('player_seated');
      this.dispatchEvent({type: 'stand'});
    }
  },
  handlePlayerStand(ev) {
  },
  handleMouseOver(ev) {
    if (!this.seated && !this.occupant) {
      this.indicator.emissive = this.seatcolor_hover;
    }
  },
  handleMouseOut(ev) {
    if (!this.seated && !this.occupant) {
      this.indicator.emissive = this.seatcolor;
    }
  },
});
