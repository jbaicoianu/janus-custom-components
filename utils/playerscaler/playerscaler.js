room.registerElement('playerscaler', {
  playerscale: 1,

  scaleTo: function(scale, time) {
    this.prevscale = this.playerscale;
    this.playerscale = scale;
    this.scalestart = performance.now();
    this.scaleend = this.scalestart + time;
  },
  update: function() {
    var now = performance.now();
    if (now > this.scalestart && now < this.scaleend) {
      var t = (now - this.scalestart) / (this.scaleend - this.scalestart);

      // at t = 0, scale = this.prevscale
      // at t = 1, scale = this.playerscale

      var newscale = (this.prevscale + (this.playerscale - this.prevscale) * t);
console.log(this.prevscale, this.playerscale, t, newscale);
      player.scale = V(newscale, newscale, newscale);
    }
  }
});
