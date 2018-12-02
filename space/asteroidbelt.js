/**
 * <asteroidbelt>
 * A ring of asteroids that orbits within th specified range.
 * TODO - we could use the new instanced scenery component to render full 3d models for asteroids up-close
 */
room.registerElement('asteroidbelt', {
  beltstart: 0,
  beltend: 1,
  count: 100,

  create() {
    this.asteroids = [];
    this.tmpvec = V();

    let celestialbodies = this.parent.getCelestialBodies();
    this.gravforce = this.addForce('gravity', { others: celestialbodies });

    this.particles = this.createObject('particle', {
      count: this.count,
      duration: 0,
      col: V(.6),
      scale: V(.002)
    });

    for (let i = 0; i < this.count; i++) {
      let dist = (Math.random() * (this.beltend - this.beltstart)) + parseFloat(this.beltstart),
          angle = Math.random() * 2 * Math.PI;

      let asteroid = {
        mass: 1e20,
        pos: V(Math.sin(angle) * dist, (Math.random() * 2e10) - 1e10, Math.cos(angle) * dist),
        vel: V(),
        accel: V()
      };
      asteroid.vel.copy(this.gravforce.getOrbitalVelocity(asteroid.pos).multiplyScalar((Math.random() * .2) + 1));
      this.asteroids[i] = asteroid;
    }
  },
  update(dt) {
    let timescale = dt * this.parent.timescale;
    for (let i = 0; i < this.asteroids.length; i++) {
      var asteroid = this.asteroids[i];
      //console.log(this.gravforce.getForceAtPoint(asteroid.pos, asteroid.mass)); 
      asteroid.accel.copy(this.gravforce.getForceAtPoint(asteroid.pos, asteroid.mass)).multiplyScalar(1 / asteroid.mass); 
      asteroid.vel.add(this.tmpvec.copy(asteroid.accel).multiplyScalar(timescale));
      asteroid.pos.add(this.tmpvec.copy(asteroid.vel).multiplyScalar(timescale));
      this.particles.setPoint(i, asteroid.pos, asteroid.vel, asteroid.accel);
    }
  }
/*
  initGravity(objects) {
    for (let i = 0; i < this.count; i++) {
      let force = this.asteroids[i].addForce('gravity', { others: objects });
      this.asteroids[i].vel = force.getOrbitalVelocity(this.asteroids[i].pos);
    }
  }
*/
});

