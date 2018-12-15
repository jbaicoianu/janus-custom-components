room.registerElement('objectfader', {
  time: 1000,
  autostart: false,
  transitioning: false,

  fade: function() {
    this.starttime = performance.now();
    this.transitioning = true;
  },
  stopfade: function() {
    this.transitioning = false;
    this.opacity = 0;
  },
  reset: function() {
    this.opacity = 1;
    this.transitioning = false;
  },
  update: function() {
    if (this.transitioning) {
      let t = Math.max(0, Math.min(1, (performance.now() - this.starttime) / this.time));
console.log('fade it', t);
      this.opacity = 1 - t;
      this.refresh();

      if (t == 1) {
        this.stopfade();
      }
    }
  }
});
