room.registerElement('cubemap-probe', {
  resolution: 1024,
  create() {
    // Skip initialization on Quest / Quest 2 headsets
    if (navigator.userAgent.match(/OculusBrowser/)) {
      return;
    }

    var options = {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter
    };

    let rendertarget = new THREE.WebGLCubeRenderTarget( this.resolution, options );
    rendertarget.mapping = THREE.CubeReflectionMapping;
    let cubeCamera = new THREE.CubeCamera( room.near_dist, room.far_dist, rendertarget );

    this.objects['3d'].add(cubeCamera);
    //this.placeholder = this.createObject('object', { id: 'cube', col: 'steelblue', scale: V(.5), roughness: 0, metalness: 1, }); 

    this.cubeCamera = cubeCamera;
    this.cubeRenderTarget = rendertarget;

    this.updateTexture();

//setInterval(() => { this.updateTexture() }, 10000);

    let scene = this.engine.systems.world.scene['world-3d'];
    scene.background = this.cubeRenderTarget.texture;
    for (let k in room.objects) {
      if (room.objects[k].updateSkybox) {
        room.objects[k].updateSkybox();
      }
    }

  },
  updateTexture() {
    let renderer = this.engine.systems.render.renderer,
        scene = this.engine.systems.world.scene['world-3d'];

    this.cubeCamera.update(renderer, scene);
    //console.log('UPDATE CUBECAM');
    //if (!this.envmapUpdated) {
/*

      this.placeholder.traverseObjects(n => {
        //console.log(n);
        if (n instanceof THREE.Mesh) {
          n.material.envMap = this.cubeRenderTarget.texture;
          this.envmapUpdated = true;
        }
      });
    //}
*/
  },
  update(dt) {
    if (this.cubeCamera && dt <= 1/30) {
      this.updateTexture();
    }
  },
});
