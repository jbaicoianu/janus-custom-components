room.extendElement('object', 'videoscreen', {
  createChildren() {
    var asset = this.getAsset('video', this.video_id);
    if (asset) {
      this.video = asset.getInstance().image;
      this.video.addEventListener('playing', this.videoStartedPlaying);
    }
    this.samplercanvas = document.createElement('canvas');
    this.samplercanvas.width = this.samplercanvas.height = 1;
    this.addEventListener('update', this.onVideoFrame);

    elation.html.css(this.samplercanvas, {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1000
    });
    document.body.appendChild(this.samplercanvas);
  },
  videoStartedPlaying(ev) {
    if (!this.samplerlight) {
      this.samplerlight = this.createObject('light', {
        light_intensity: 1,
        col: V(0,0,0)
      });
      this.samplerlastupdate = performance.now();
      if (!this.samplerlights) {
        this.samplerlights = [];
        this.lightholder = this.createObject('object', {pos: this.light_pos, id: 'sphere', col: V(1,0,0)});
        for (var x = 0; x < 1; x++) {
          for (var y = 0; y < 1; y++) {
            this.samplerlights.push(this.lightholder.createObject('light', {
              light_intensity: 10 * this.scale.x,
              light_range: (5 * this.scale.x),
              id: 'sphere',
              pos: V((x * 1) - .5,(y * 1) - .5,1),
              col: V(0,0,0),
              light_shadow: false
            }));
            this.lightholder.createObject('object', {
              id: 'sphere',
              pos: V((x * 1) - .5,(y * 1) - .5,1),
              col: V(1,1,0),
            });
/*
var lightsize = [this.scale.x * 2, this.scale.y * 2];
            var light = new THREE.RectAreaLight(0xff0000, 30 * lightsize[0] * lightsize[1], lightsize[0], lightsize[1]);
var helper = new THREE.RectAreaLightHelper(light, 0x00ff00);
this.recthelp = helper;
this.localToWorld(light.position.set(0,0,.05));
light.quaternion.copy(this.orientation);
            //this.objects['3d'].parent.parent.add(light);
            this.objects['3d'].parent.parent.add(light);
            this.objects['3d'].parent.parent.add(helper);
            this.samplerlights.push(light);
*/
          }
        }
      }
    }
    if (!this.audionodes) {
      //this.initSound();
    }
  },
  onVideoFrame(ev) {
    var video = this.video;
    var now = performance.now();
    var diff = now - this.samplerlastupdate;
    var ctime = video.currentTime;
//console.log(diff, (ctime - this.samplerlasttime) * 1000, q);
    if ( this.isPlaying() && video.readyState >= video.HAVE_CURRENT_DATA && ctime !== this.samplerlasttime) {
      var ctx = this.samplercanvas.getContext('2d');
      ctx.drawImage(this.video, 0, 0, 1, 1);
      var imgdata = ctx.getImageData(0, 0, 1, 1);
var smooth = .2;
      if (this.samplerlights) {
        for (var i = 0; i < this.samplerlights.length; i++) {
          var idx = i * 4;
          var col = this.samplerlights[i].color;
          //col.setRGB((col.r * (1 - smooth)) + (imgdata.data[idx]/255 * smooth), (col.g * (1-smooth)) + (imgdata.data[idx+1]/255 * smooth), (col.b * (1-smooth)) + (imgdata.data[idx+2]/255 * smooth)).multiplyScalar(20);
          this.samplerlights[i].col = V((col.r * (1 - smooth)) + (imgdata.data[idx]/255 * smooth), (col.g * (1-smooth)) + (imgdata.data[idx+1]/255 * smooth), (col.b * (1-smooth)) + (imgdata.data[idx+2]/255 * smooth));
        }
    
        //console.log('frame', this.samplerlights, imgdata.data);
      } 
      this.samplerlasttime = video.currentTime;
//this.recthelp.update();
    }
    this.samplerlastupdate = now;
  }
});
