/**
 * <star>
 * It's a star.  Enough said.
 */
room.registerElement('star', {
  radius: 1,
  mass: 1,
  intensity: 10,

  create() {
    this.body = this.createObject('object', {
      id: 'sphere',
      col: this.col,
      collision_id: 'sphere',
      collision_trigger: true,
      scale: V(this.radius),
      lighting: false,
      cull_face: 'none'
    });
    this.light = this.createObject('light', {
      light_intensity: this.intensity,
      light_range: 1e5 // FIXME - scale based on starsystem scale
    });
  }
});

