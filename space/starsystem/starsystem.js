/**
 * <starsystem>
 * Represents a collection of celestial bodies hat exert gravity on each other.
 */
room.registerElement('starsystem', {
  starscale: 1,
  planetscale: 1,
  timescale: 1,
  spinscale: 1,

  create() {
    // FIXME - this.getObjectsByTagName() seems to not be implemented, so we'll just assume one star system per room for now
    this.stars = room.getObjectsByTagName('star');
    this.planets = room.getObjectsByTagName('planet');
    this.asteroids = room.getObjectsByTagName('asteroidbelt');

    this.objects.dynamics.timescale = this.timescale;

    let celestialbodies = this.getCelestialBodies();

    for (let i = 0; i < this.planets.length; i++) {
      let body = this.planets[i],
          force = body.addForce('gravity', {others: celestialbodies, timescale: this.timescale});
      body.vel = force.getOrbitalVelocity(body.pos);
    }

    for (let i = 0; i < this.asteroids.length; i++) {
      let belt = this.asteroids[i];
      //belt.initGravity(celestialbodies);
    }
  },
  update() {
    this.objects.dynamics.timescale = this.timescale;
  },
  getCelestialBodies() {
    let celestialbodies = [];
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i];
      celestialbodies.push(star.objects.dynamics);
      star.scale = V(this.starscale);
    }

    for (let i = 0; i < this.planets.length; i++) {
      let planet = this.planets[i];
      celestialbodies.push(planet.objects.dynamics);
      planet.scale = V(this.planetscale);
    }
    return celestialbodies;
  }
});
