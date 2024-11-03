room.registerElement('snaplayout', {
  snapped: false,
  snapdir: 'left',
  
  create() {
    var children = this.children;
    this.snapcontainer = this.createObject('object', {
      mass: 1,
    });
    for (var i = 0; i < children.length; i++) {
      this.snapcontainer.appendChild(children[i]);
    }

    this.snappoint = this.localToWorld(V(10,0,0));
    this.snapforce = this.snapcontainer.addForce('spring', { strength: 80, hard: true, anchor: this.snappoint });
    this.frictionforce = this.snapcontainer.addForce('anisotropicfriction', V(8,40,40));
    this.dragforce = this.snapcontainer.addForce('drag', .9);

    if (this.snapped) {
      this.snap(true);
    } else {
      this.unsnap(true);
    }
  },
  snap(instant) {
console.log('snap!', this.snapcontainer.pos, this.snapcontainer.vel);
    if (isNaN(this.snapcontainer.pos.x) || isNaN(this.snapcontainer.pos.y) || isNaN(this.snapcontainer.pos.z)) {
      this.snapcontainer.pos.set(10, 0, 0);
      this.snappoint.copy(this.snapcontainer.pos);
      this.snapcontainer.vel.set(0, 0, 0);
      this.snapcontainer.accel.set(0, 0, 0);
console.log('fix snap!', this.snapcontainer.pos, this.snapcontainer.vel);
    }
    this.localToWorld(this.snappoint.set(0,0,0));
    if (instant) {
      this.snapcontainer.pos.set(0,0,0);
    } else if (Math.abs(this.snapcontainer.vel.x) < 1e-2) {
      this.snapcontainer.vel.x = -.01;
    }
  },
  unsnap(instant) {
    this.localToWorld(this.snappoint.set(10,0,0));
    if (instant) {
      this.snapcontainer.pos.set(10,0,0);
    } else if (Math.abs(this.snapcontainer.vel.x) < 1e-2) {
      this.snapcontainer.vel.x = .01;
    }
  }
});
