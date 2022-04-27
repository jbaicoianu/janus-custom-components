room.registerElement('sprite-button', {
  name: '',
  image_id: '',
  states: 1,

  create() {
    this.plane = this.createObject('object', {
      id: 'plane',
      image_id: this.image_id,
      texture_repeat: [1, 1 / this.states],
      texture_offset: [0, 1 / this.states],
      collision_id: 'plane',
      cull_face: 'none',
      lighting: false,
    });
    this.plane.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.plane.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    this.plane.addEventListener('mousedown', ev => this.handleMouseDown(ev));
    this.plane.addEventListener('mouseup', ev => this.handleMouseUp(ev));
    this.plane.addEventListener('click', ev => this.handleClick(ev));

    this.plane.addEventListener('load', ev => this.handleLoad());
  },
  updateAspectRatio() {
    if (this.plane.textureasset && this.plane.textureasset._texture) {
      let image = this.plane.textureasset._texture.image;
      this.aspectratio = image.height / image.width / this.states;
      this.plane.scale.y = this.aspectratio;
    }
  },
  xupdate() {
    if (typeof this.aspectratio == 'undefined') {
      this.updateAspectRatio();
    }
  },
  handleLoad() {
    if (!(this.plane.textureasset && this.plane.textureasset._texture)) {
      this.plane.assignTextures();
    }
    this.updateAspectRatio();
  },
  handleClick(ev) {
//console.log('bonk', this);
  },
  handleMouseOver(ev) {
    this.plane.texture_offset = V(0, 0);
//console.log('over', this.plane.texture_offset, this.states);
  },
  handleMouseOut(ev) {
    this.plane.texture_offset = V(0, 1 / this.states);
//console.log('out', this.plane.texture_offset, this.states);
  },
  handleMouseDown(ev) {
    this.plane.pos.z = -.05;
  },
  handleMouseUp(ev) {
    this.plane.pos.z = 0;
    this.handleMouseOut(ev);
  },
});
