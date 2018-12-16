/**
 * <planet>
 * It's a planet.  It spins as it orbits, foreever, or at least until its star explodes.
 */
room.registerElement('planet', {
  radius: 1,
  mass: 1,
  daylength: 24,

  create() {
    this.body = this.createObject('object', {
      id: 'sphere',
      js_id: this.js_id + '_body',
      col: this.col,
      image_id: this.image_id,
      scale: V(this.radius),
      rotate_deg_per_sec: 360 / (this.daylength * 60 * 60) * this.parent.spinscale
    });

    this.addEventListener('click', (ev) => this.handleClick(ev));

    this.collision_trigger = true;
    this.collision_id = 'sphere';
    //this.collision_scale = V(this.radius)
  },

  handleClick(ev) {
    console.log('bling!', this.js_id);
    //this.appendChild(player);
  }
});

