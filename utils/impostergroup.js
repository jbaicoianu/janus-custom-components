const Angles = {
  front: 0,
  frontleft: 45,
  left: 90,
  backleft: 135,
  back: 180,
  backright: 225,
  right: 270,
  frontright: 315
};
room.registerElement('imposter', {
  distance: 10,
  texturesizex: 512,
  texturesizey: 512,
  snapangle: 15,
  currentangle: 0,

  create() {
    this.sprites = {};
    this.faking = false;
    this.angle = 'front';
    this.rendertarget = new THREE.WebGLRenderTarget(this.texturesizex, this.texturesizey);
    this.scenertt = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera();

    this.sprite = this.createObject('object', {
      id: 'plane',
      cull_face: 'none',
      pos: V(0, 2, 0),
      lighting: false,
      col: 'green',
      billboard: 'y'
    });
  },
  update() {
    let angle = this.getAngleTo(player);
/*
    if (!this.faking && this.distanceTo(player) > this.distance) {
      this.generateImposter();
      this.faking = true;
    }    
*/
    if (this.angle != angle) {
      this.setAngle(angle);
    }
  },
  generateSprite(angle) {
    let bbox = this.getBoundingBox(true),
        size = new THREE.Vector3().subVectors(bbox.max, bbox.min);
    let renderer = this.engine.systems.render.renderer;
    let rendertarget = this.sprites[angle] || new THREE.WebGLRenderTarget(1024, 1024, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });

    let oldparent = this.objects['3d'].parent;
    this.scenertt.add(this.objects['3d']);

    this.plane = new THREE.PlaneBufferGeometry(1024, 1024);
    this.mesh = new THREE.Mesh(this.plane, new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide}));
    this.mesh.position.z = -100;
    this.scenertt.add(this.mesh);

    this.scenertt.background = new THREE.Color(0x0000ff);

    //this.camera.rotation.y = angle * THREE.Math.DEG2RAD;
    //this.camera.position.set(Math.sin(angle), 0, Math.cos(angle));
/*
    this.camera.left = -500
    this.camera.right = 500
    this.camera.top =  500
    this.camera.bottom = -500
    this.camera.near = -1000;
    this.camera.far = 1000;
    this.scenertt.add(this.camera);
    this.camera.updateProjectionMatrix();
*/
    let camerartt = new THREE.OrthographicCamera(-2, 2, 2, -2, -1024, 1024);
    this.scenertt.add(camerartt);
    renderer.render(this.scenertt, camerartt, rendertarget);
console.log('generated the guy', rendertarget, this.scenertt, this.camera);
    oldparent.add(this.objects['3d']);
//setTimeout(() => this.generateSprite(angle), 100);
    return rendertarget;
  },
  getAngleTo(object) {
    let dir = this.worldToLocal(object.localToWorld(V(0))).normalize();
    let angle = Math.atan2(dir.x, dir.z) * 180 / Math.PI;

    let snapangle = Math.floor((angle % 360 + this.snapangle / 2) / this.snapangle) * this.snapangle;
    if (snapangle == -180) snapangle = 180;
    return snapangle;
  },
  setAngle(angle) {
console.log('new angle', angle, this.sprites[angle]);
    let sprite_image_id = this.js_id + '_sprite_' + angle;
    if (!this.sprites[angle]) {
      this.sprites[angle] = this.generateSprite(angle);
      room.loadNewAsset('image', {
        id: sprite_image_id,
        texture: this.sprites[angle].texture,
        //tex_linear: false,
        hasalpha: false
      });
    } else {
      //this.sprites[angle] = this.generateSprite(angle);
    }
    this.sprite.image_id = sprite_image_id;
    this.angle = angle;
  }
});
