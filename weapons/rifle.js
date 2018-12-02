room.registerElement('rifle', {
  muzzleoffset: V(0,0,.2),
  muzzledir: V(0,0,-1),

  create() {
  },
  fire() {
    var hits = this.raycast(this.muzzledir, this.muzzleoffset);
  }
});
