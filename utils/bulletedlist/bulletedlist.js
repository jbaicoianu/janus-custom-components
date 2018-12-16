room.registerElement('bulletedlist', {
  create() {
    this.items = this.getElementsByTagName('listitem');
    this.reset();
  },
  reset() {
    var items = this.items;
    for (var i = 0; i < items.length; i++) {
      //items[i].reset();
      items[i].pos.y = -i * .2;
    }
    this.setStep(-1);
  },
  setStep(n) {
    var items = this.items;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item) {
        if (i <= n) {
          item.layout.snap();
        } else {
          item.layout.unsnap();
        }
      }
    }
  }
});
room.registerElement('listitem', {
  text: '',
  create() {
    this.layout = this.createObject('snaplayout', {
    });
    this.label = this.layout.createObject('text', {
      font_scale: false,
      font_size: .1,
      scale: V(1,1,.2),
      text: this.text,
    });
  },
  activate() {
    this.layout.snap();
  },
  deactivate() {
    this.layout.unsnap();
  },
  reset() {
    this.layout.unsnap(true);
  }
});
