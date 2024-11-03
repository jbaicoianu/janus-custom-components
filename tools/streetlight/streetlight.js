room.extendElement('object', 'streetlight', {
  state: 'off',
  brightness: 10,
  model_id: false,
  light_pos: V(0, 1.2, .25),
  model_pos: V(0,0,0),
  light_cone_angle: .25,
  light_rotation: V(90,0,0),
  light_shadow: false,

  create() {
    this.light = this.createObject('light', {
      light_intensity: 0,
      light_shadow: this.light_shadow,
      light_range: 20,
      col: this.col,
      pos: this.light_pos,
      light_cone_angle: this.light_cone_angle,
      rotation: this.light_rotation,
    });


    if (this.model_id) {
      this.createObject('object', {
        id: this.model_id,
        pos: V(0, .5, 0),
        col: V(1,1,1),
        collision_id: 'cylinder',
        collision_scale: V(.1, 4, .1),
        collision_pos: V(0,2,0)
      });
    }
    this.setState(this.state);
  },
  setState(state) {
    this.state = state;
    this.light.light_intensity = (state == 'on' ? this.brightness : 0);
  },
  toggleLight() {
    var newstate = (this.state == 'on' ? 'off' : 'on');
    this.setState(newstate);
  },
  setBrightness(brightness) {
    this.brightness = brightness;
    this.light.light_intensity = brightness;
  },
  on() {
    this.setState('on');
  },
  off() {
    this.setState('off');
  },
});
