room.registerElement('instancedobject', {
  model_id: '',
  object: null,
  instances: [],
  create() {
    if (this.instances.length == 0) {
      this.instances = this.getElementsByTagName('instance');
    }
    if (this.object) {
      this.processObject(this.object);
    } else if (this.model_id) {
      let modelasset = this.getAsset('model', this.model_id);
      if (modelasset) {
        modelasset.load();
        elation.events.add(modelasset, 'asset_load', () => this.processAsset(modelasset));
      }
    }
  },
  processAsset(modelasset) {
    console.log('got the model asset', modelasset);
    let model = modelasset.getInstance();
    this.processObject(model);
  },
  processObject(model) {
    let meshes = [];
    console.log('here is the model', model);
    model.traverse((n) => {
      if (n instanceof THREE.Mesh) {
        meshes.push(n);
      }
    });
    let instances = this.instances;
    console.log('instances', instances);
    console.log('got meshes', meshes);
    let matrixWorldInverse = new THREE.Matrix4();
    this.objectparts = [];
    meshes.forEach((m) => {
      this.objectparts.push(this.createObject('instancedobjectpart', {
        mesh: m
      }));
    });

setTimeout(() => {
    this.updateInstances(instances);
}, 100);
  },
  updateInstances(instances) {
    for (let i = 0; i < this.objectparts.length; i++) {
      this.objectparts[i].updateInstances(instances);
    }
    this.refresh();
  },
  getInstance(n) {
    if (!this.instances[n]) {
      this.instances[n] = { //this.createObject('instance');
        pos: new THREE.Vector3()
      };
    }
    return this.instances[n];
  },
  createInstance() {
  }
});
room.registerElement('instancedobjectpart', {
  mesh: null,
  create() {
    let instancedgeo = new THREE.InstancedBufferGeometry();
    let geo = this.mesh.geometry;
    instancedgeo.index = geo.index;

    this.offsetpos = V().applyMatrix4(this.mesh.matrixWorld);

    for (let attr in geo.attributes) {
      instancedgeo.attributes[attr] = geo.attributes[attr];
    }

    let material = this.mesh.material.clone(); //new THREE.MeshStandardMaterial({color: 0xff0000});
    material.onBeforeCompile = function ( shader ) {
      shader.vertexShader = 'attribute vec3 offset;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          'vec3 transformed = vec3( position + offset );',
        ].join( '\n' )
      );
    };

    let mesh = new THREE.Mesh(instancedgeo, material);

    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: material.map,
      alphaTest: 0.5
    });
    mesh.customDepthMaterial.onBeforeCompile = function ( shader ) {
      shader.vertexShader = 'attribute vec3 offset;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          'vec3 transformed = vec3( position + offset );',
        ].join( '\n' )
      );
    };

    mesh.customDistanceMaterial = new THREE.MeshDistanceMaterial({
      //depthPacking: THREE.RGBADepthPacking,
      map: material.map || null,
      alphaTest: 0.5
    });
    mesh.customDistanceMaterial.onBeforeCompile = function ( shader ) {
      shader.vertexShader = 'attribute vec3 offset;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          'vec3 transformed = vec3( position + offset );',
        ].join( '\n' )
      );
    };
    this.objects['3d'].add(mesh);
    this.instancedgeo = instancedgeo;
    this.instancedgeo.boundingSphere = new THREE.Sphere(V(0,0,0), 10000);
  },
  updateInstances(instances) {
    let arraylength = instances.length * 3,
        offsetattr = this.instancedgeo.attributes.offset;
    let offsets = (offsetattr && offsetattr.array.length == arraylength ? offsetattr.array : new Float32Array(instances.length * 3));

    let maxsize = 0;
    for (let i = 0; i < instances.length; i++) {
      let idx = i * 3;
      offsets[idx] = (this.offsetpos.x + instances[i].pos.x);
      offsets[idx + 1] = (this.offsetpos.y + instances[i].pos.y);
      offsets[idx + 2] = (this.offsetpos.z + instances[i].pos.z);

      maxsize = Math.max(maxsize, offsets[idx], offsets[idx+1], offsets[idx+2]);
    }

    this.instancedgeo.boundingSphere = new THREE.Sphere(V(0,0,0), maxsize);

    if (!this.instancedgeo.attributes.offset || arraylength != this.instancedgeo.attributes.offset.count) {
      this.instancedgeo.attributes.offset = new THREE.InstancedBufferAttribute(offsets, 3);
    } else {
      //this.instancedgeo.attributes.offset.array = offsets;
      this.instancedgeo.attributes.offset.needsUpdate = true;
    }
  }
});
room.registerElement('instance', {
  index: 0,

  create() {
    //this.createObject('object', {id: this.parent.model_id});
  },
});
