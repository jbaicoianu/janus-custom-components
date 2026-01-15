room.registerElement('fpscounter', {
  create() {
    this.frametimes = [];
    this.numframes = 128;
    this.averagecount = 20;
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;

    room.loadNewAsset('image', {
      id: this.js_id + '_canvas',
      canvas: canvas,
      hasalpha: true
    });
    this.display = this.createObject('object', {
      id: 'plane',
      image_id: this.js_id + '_canvas',
      lighting: false,
      scale: V(1,.5,1)
    });
    this.canvas = canvas;
    this.ctx = ctx;
    this.framecounter = 0;
  },
  update(dt) {
    this.recordFrametime(dt);
    if (this.framecounter++ % 30 == 0) {
      let fps = this.getAverageFPS();
      let canvas = this.canvas,
          ctx = this.ctx;
      if (!this.pixeldata) this.pixeldata = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      canvas.width = canvas.width;
      let width = canvas.width,
          height = canvas.height;
      let frametimes = this.frametimes,
          pixeldata = this.pixeldata,
          data = pixeldata.data;
      for (let i = 0; i < frametimes.length; i++) {
        let ffps = 1 / frametimes[i];
  /*
        ctx.fillStyle = 'rgba(255,0,0,.4)';
        ctx.fillRect(i, height - ffps, 1, ffps);
        ctx.fillStyle = 'red';
        ctx.fillRect(i, height - ffps, 1, 1);
  */
        let x = i,
            y = height - Math.round(ffps);

        for (let yy = 0; yy < height; yy++) {
          let offset = ((width * yy) + x) * 4;
          data[offset] = 255;
          data[offset+1] = 0;
          data[offset+2] = 0;
          data[offset+3] = (yy > y ? 64 : (yy == y ? 255 : 0));
        }
      }
      ctx.putImageData(pixeldata, 0, 0);
      ctx.font = '32px sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(fps + 'fps', 0, height - 4);
      ctx.fillStyle = '1px solid black';
      ctx.strokeText(fps + 'fps', 0, height - 4);
      elation.events.fire({type: 'asset_update', element: canvas});
      this.refresh();
    }
  },
  recordFrametime(time) {
    let frametimes = this.frametimes;
    if (frametimes.length < this.numframes) {
      frametimes.push(time);
    } else {
      let count = this.numframes - 1;
      for (let i = 0; i < count; i++) {
        frametimes[i] = frametimes[i + 1];
      }
      frametimes[count] = time;
    }
  },
  getAverageFPS() {
    let len = this.frametimes.length,
        count = Math.min(this.averagecount, len),
        frametimes = this.frametimes;
        
    let fps = 0;
    for (let i = 0; i < count; i++) {
      fps += 1 / frametimes[len - i - 1];
    }
    return Math.round(fps / count);
  }
});
