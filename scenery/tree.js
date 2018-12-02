/**
 * <tree>
 * Requires proctree.js https://github.com/supereggbert/proctree.js/
 * Tree parameters can be generated at http://snappytree.com
 */
room.registerElement('tree', {
  'trunkMaterial': 'tree_trunk1',
  'twigMaterial': 'tree_leaves1',
  'seed': Math.random() * 100000,
  'segments': 6,
  'levels': 5,

  'vMultiplier': 2.36,
  'twigScale': 0.39,
  'initialBranchLength': 0.49,
  'lengthFalloffFactor': 0.85,
  'lengthFalloffPower': 0.99,

  'clumpMax': 0.454,
  'clumpMin': 0.404,
  'branchFactor': 2.45,
  'dropAmount': -0.1,
  'growAmount': 0.235,
  'sweepAmount': 0.01,
  'maxRadius': 0.139,
  'climbRate': 0.371,
  'trunkKink': 0.093,
  'treeSteps': 5,
  'taperRate': 0.947,
  'radiusFalloffRate': 0.73,
  'twistRate': 3.02,
  'trunkLength': 2.4,
  'json': '',

  create() {
    if (this.json) {
      let treedata = JSON.parse(this.json);
      for (let k in treedata) {
        this[k] = treedata[k];
      }
    }
    this.createTree();
  },
  createTree() {
    if (typeof Tree == 'undefined') {
      let retryTimer = setInterval(() => {
        if (typeof Tree != 'undefined') {
          clearInterval(retryTimer);
          this.createTree();
        }
      });
      return;
    }
    var seed = this.seed;
    if (!seed) seed = Math.floor(10000 * Math.random());

    var myTree = new Tree({
      "seed": seed,
      "segments": this.segments,
      "levels": this.levels,
      "vMultiplier": this.vMultiplier,
      "twigScale": this.twigScale,
      "initalBranchLength": this.initialBranchLength,
      "lengthFalloffFactor": this.lengthFalloffFactor,
      "lengthFalloffPower": this.lengthFalloffPower,
      "clumpMax": this.clumpMax,
      "clumpMin": this.clumpMin,
      "branchFactor": this.branchFactor,
      "dropAmount": this.dropAmount,
      "growAmount": this.growAmount,
      "sweepAmount": this.sweepAmount,
      "maxRadius": this.maxRadius,
      "climbRate": this.climbRate,
      "trunkKink": this.trunkKink,
      "treeSteps": this.treeSteps,
      "taperRate": this.taperRate,
      "radiusFalloffRate": this.radiusFalloffRate,
      "twistRate": this.twistRate,
      "trunkLength": this.trunkLength
    });
    this.createTreeGeometry('trunk', myTree.verts, myTree.faces, myTree.normals, myTree.UV);
    this.createTreeGeometry('twig', myTree.vertsTwig, myTree.facesTwig, myTree.normalsTwig, myTree.uvsTwig);

/*
    var trunkmesh = new THREE.Mesh(trunkgeo, elation.engine.materials.get(this.textures.trunk));

    trunkmesh.castShadow = true;
    trunkmesh.receiveShadow = true;

    var twigmesh = new THREE.Mesh(twiggeo, elation.engine.materials.get(this.textures.leaves));
    trunkmesh.add(twigmesh);
    twigmesh.castShadow = true;
    twigmesh.receiveShadow = true;

    return trunkmesh;
*/
  },
  createTreeGeometry(type, verts, faces, normals, uvs) {
/*
    var geo = new THREE.BufferGeometry();

    //var position = new Float32Array(faces.length * 3 * 3);
    //var normal = new Float32Array(faces.length * 3 * 3);
    //var uv = new Float32Array(faces.length * 3 * 2);
    var position = new THREE.Float32BufferAttribute(faces.length * 3, 3);
    var normal = new THREE.Float32BufferAttribute(faces.length * 3, 3);
    var uv = new THREE.Float32BufferAttribute(faces.length * 3, 2);
*/
    let position = [],
        normal = [],
        uv = [];

    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      for (var j = 0; j < f.length; j++) {
        var o = (i * 3 + j) * 3;
//console.log((i * 3 + j) * 3, (i * 3 + j) * 3 + 1, (i * 3 + j) * 3 + 2);
        var v = verts[f[j]];
        var n = normals[f[j]];
        var u = uvs[f[j]];
        for (var k = 0; k < v.length; k++) {
          position[o + k] = v[k];
          normal[o + k] = n[k];
        }

        // uvs
        var o = (i * 3 + j) * 2;
        for (var k = 0; k < u.length; k++) {
          uv[o + k] = u[k];
        }
      }
    }
/*
    geo.addAttribute('position', position);
    geo.addAttribute('normal', normal);
    geo.addAttribute('uv', uv);
*/
    room.loadNewAsset('object', {
      id: 'proctree01-' + this.js_id + type,
      mesh_verts: position,
      mesh_normals: normal,
      mesh_uvs: uv
    });
    let textureName = type + 'Material';
    this.createObject('object', {
      id: 'proctree01-' + this.js_id + type,
      image_id: this[textureName],
      //normalmap_id: this[textureName] + 'Normal',
      blend_src: 'one_minus_alpha',
      depth_write: (type == 'trunk'),
      cull_face: 'none'
    });
  }
});
