room.registerElement('sprite-sheet', {
  image_id: '',
  framesx: 1,
  framesy: 1,
  framestart: 1,
  frameend: -1,
  framerate: 15,

  create() {
    this.sprite = this.createObject('object', {
      id: 'plane',
      image_id: this.image_id,
      texture_repeat: [1 / this.framesx, 1 / this.framesy],
      cull_face: 'none',
    });
    if (this.frameend == -1) {
      this.frameend = this.framesx * this.framesy;
    }
    this.currentframe = this.framestart;
    this.lastframetime = performance.now();
  },
  update(dt) {
    let now = performance.now();
    if (now - this.lastframetime >= 1000 / this.framerate) {
      this.currentframe = this.currentframe + 1;
      if (this.currentframe > this.frameend) {
        this.currentframe = this.framestart;
      }

      let x = this.currentframe % this.framesx,
          y = Math.floor(this.currentframe / this.framesx);

      this.sprite.texture_offset.set(x / this.framesx, 1 - y / this.framesy);

      this.lastframetime = now;
    }
  },
});
