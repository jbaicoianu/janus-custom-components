room.extendElement('object', 'streetlight', {
  state: 'off',
  brightness: 10,
  model_id: false,
  light_pos: V(0,0,0),
  model_pos: V(0,0,0),

  create() {
    this.light = this.createObject('light', {
      light_intensity: 0,
      light_shadow: true,
      light_range: 20,
      col: this.col,
      pos: V(.25, 1.2, 0)
    });


    if (this.model_id) {
      this.createObject('object', {
        id: this.model_id,
        pos: V(0, .5, 0),
        col: V(1,1,1),
        scale: V(.5)
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
