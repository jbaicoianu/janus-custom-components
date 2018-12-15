let sphere = new THREE.Sphere(),
    scale = V(1);

room.registerElement('forest', {
  bounds: null,
  density: .02,
  maxvisible: 1000,
  count: 50000,

  create() {
    this.points = this.generateRandomPoints();
    this.treetypes = [
      {
        "seed":152,
        "segments":8,
        "levels":5,
        "vMultiplier":1.16,
        "twigScale":0.39,
        "initalBranchLength":0.49,
        "lengthFalloffFactor":0.85,
        "lengthFalloffPower":0.99,
        "clumpMax":0.454,
        "clumpMin":0.454,
        "branchFactor":3.2,
        "dropAmount":0.09,
        "growAmount":0.235,
        "sweepAmount":0.051,
        "maxRadius":0.105,
        "climbRate":0.322,
        "trunkKink":0,
        "treeSteps":5,
        "taperRate":0.964,
        "radiusFalloffRate":0.73,
        "twistRate":1.5,
        "trunkLength":2.25,
        "trunkMaterial":"TrunkType1",
        "twigMaterial":"BranchType2"
      },
/*
      {
        "segments":10,
        "levels":5,
        "vMultiplier":2.36,
        "twigScale":0.39,
        "initalBranchLength":0.49,
        "lengthFalloffFactor":0.85,
        "lengthFalloffPower":0.99,
        "clumpMax":0.454,
        "clumpMin":0.404,
        "branchFactor":2.45,
        "dropAmount":-0.1,
        "growAmount":0.235,
        "sweepAmount":0.01,
        "maxRadius":0.166,
        "climbRate":1,
        "trunkKink":0,
        "treeSteps":7,
        "taperRate":0.849,
        "radiusFalloffRate":0.8,
        "twistRate":2.23,
        "trunkLength":1.65,
        "trunkMaterial":"TrunkType2",
        "twigMaterial":"BranchType4"
      }
*/
    ];
    this.trees = [];
    this.treeinstances = [];
console.log('got points', this.points, this.pointsbytype);
    for (let i = 0; i < this.treetypes.length; i++) {
      this.trees[i] = this.createObject('tree', this.treetypes[i]);
console.log('new tree', this.trees[i]);
setTimeout(() => {
      this.treeinstances[i] = this.createObject('instancedobject', {
        object: this.trees[i].objects['3d'],
        //instances: this.pointsbytype[i]
      });
console.log('new treeinstance', this.treeinstances[i]);
setTimeout(() => this.blah = true, 2000);
}, 10000);
    }
  },
  update() {
    if (this.blah && this.points) {
      let frustum = player.viewfrustum;
      let playerpos = this.worldToLocal(player.localToWorld(V()));
      let distSq = function(pos) {
        let x = pos.x - playerpos.x,
            y = pos.y - playerpos.y,
            z = pos.z - playerpos.z;
        return x*x + y*y + z*z;
      }
      // TODO - instead of sorting points every frame and then doing sphere checks, we should use an octree with a frustum check
      this.points.sort((p1, p2) => distSq(p1.pos) - distSq(p2.pos));
      let visible = 0;
      for (let i = 0; i < this.points.length && visible < this.maxvisible; i++) {
        let point = this.points[i];
        this.localToWorld(sphere.center.copy(point.pos));
        sphere.radius = point.scale;
        if (frustum.intersectsSphere(sphere)) {
          scale.set(point.scale, point.scale, point.scale);
          //let obj = this.grab({ id: point.type, pos: point.pos, scale: scale});
          this.treeinstances[0].getInstance(visible++).pos.copy(point.pos);
        }
        //point.obj.visible = false;
      }
      this.treeinstances[0].updateInstances(this.treeinstances[0].instances);
    }
  },
  getTerrain() {
    let obj = this;
    while (obj.parent) {
      obj = obj.parent;
      if (obj.tag == 'TERRAIN') {
        return obj;
      }
    }
    return null;
  },
  generateRandomPoints() {
    let points = [],
        pointsbytype = {},
        terrain = this.getTerrain();
    let count = this.count;

    this.terrain = terrain;
    if (!terrain.generated) {
      terrain.addEventListener('generate', (ev) => this.points = this.generateRandomPoints());
      return;
    }
    let bounds = (terrain ? terrain.getBoundingBox() : { min: V(-500, -50, -500), max: V(500, 50, 500) });
    for (let i = 0; i < count; i++) {
      //let type = this.types[Math.floor(Math.random() * this.types.length)],
      let type = Math.floor(Math.random() * this.treetypes.length),
          pos = V(Math.random() * (bounds.max.x - bounds.min.x) + bounds.min.x, Math.random() * (bounds.max.y - bounds.min.y) + bounds.min.y, Math.random() * (bounds.max.z - bounds.min.z) + bounds.min.z);
      if (terrain) {
//console.log('get the height', Math.round(pos.x), pos.y, Math.round(pos.z))
        pos.y = terrain.getHeightForWorldCoords(pos);
      }
      let point = {
        type: type,
        pos: pos,
        scale: Math.random() * 10,
      };
      points.push(point);

      // FIXME - hack
      if (!pointsbytype[type]) pointsbytype[type] = [];
      pointsbytype[type].push(point);
    }
    this.pointsbytype = pointsbytype;
    return points;
  }
});
