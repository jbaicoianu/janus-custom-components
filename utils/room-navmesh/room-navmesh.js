room.registerElement('room-navmesh', {
  navmesh_id: '',
  create() {
    this.navmesh = this.createObject('object', {
      id: this.navmesh_id,
      collision_id: this.navmesh_id,
      visible: false,
      //depth_test: false,
      col: 'yellow',
    });
    this.down = V(0,-1,0);
    this.startpos = V(0,0,0);
    this.nextpos = V(0,0,0);
    this.navmesh.addEventListener('load', ev => {
      //console.log('loaded the nav mesh', this.navmesh_id, this.navmesh, ev);
      this.meshroot = this.navmesh.objects['3d'];
    });

    this.playerforcevec = V();
    this.playerforce = player.addForce('static', this.playerforcevec);
  },
  update(dt) {
    if (player.enabled && this.meshroot && room.contains(player)) {
      player.localToWorld(this.startpos.set(0,1.8,0));
      player.localToWorld(this.nextpos.set(0,1.8,player.vel.length() * dt));
      let hits = room.raycast(this.down, this.startpos, null, null, this.meshroot);
          //nexthits = room.raycast(this.down, this.nextpos, null, null, this.meshroot);;

      if (hits.length > 0) {
        let bonk = hits[0];
        let floorAngle = bonk.face.normal.angleTo(player.vectors.ydir);
        if (bonk.distance < 1.8 + player.fatness && floorAngle < Math.PI/4) {
          player.pos.y = bonk.point.y + player.fatness;
          if (player.vel.y < 0) {
            player.vel.y = 0;
          }
          this.playerforce.update(this.playerforcevec.set(0, 0 * player.mass, 0));
        } else {
          this.playerforce.update(this.playerforcevec.set(0,room.gravity * player.mass,0));
        }
        this.lastbonk = bonk;
      } else {
        this.playerforce.update(this.playerforcevec.set(0,0,0));
        this.lastbonk = false;
      }
    } else {
      this.playerforce.update(this.playerforcevec.set(0,0,0));
    }
//console.log(this.playerforcevec.toArray().map(n => +n.toFixed(3)));
  }
});
