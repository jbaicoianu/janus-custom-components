room.registerElement('pagescroll', {
  target: 'player',
  scrolltarget: null,
  scrollselector: '',

  create() {
    let scrolltarget = this.getScrollTarget();
    scrolltarget.addEventListener('scroll', (ev) => this.handleScroll(ev));   
    this.placeholder = this.createObject('object', { id: 'cube', col: 'red'});
  },
  getScrollTarget() {
    if (!this.scrolltarget && this.scrollselector) {
      this.scrolltarget = document.querySelector(this.scrollselector);
    }
    if (this.scrolltarget) {
      return this.scrolltarget;
    }
    // No scroll target or selector specified, use the window
    return window;
  },
  handleScroll(ev) {
    // FIXME - HTML is dumb, and there's a different way to get scroll height for scrollable divs vs main window
    let toppercent = window.scrollY / document.body.scrollHeight;
    let adjusted = ((window.innerHeight * toppercent) + window.scrollY) / document.body.scrollHeight
    console.log('we scrolled', adjusted, toppercent, ev, this);
    player.pos.y = (100 - 100 * adjusted);
    this.refresh();
  }
});
