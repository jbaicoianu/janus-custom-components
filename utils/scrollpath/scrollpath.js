room.registerElement('scrollpath', {
  speed: 5,
  autostart: 1,
  loop: 0,
  currentpos: 0,
  running: false,
  target: null,
  scrollselector: null,

  create() {
    console.log('new scrollpath', this, this.children);
    this.path = new THREE.CurvePath();

    let paths = this.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
      this.path.add(paths[i].getCurve());
      paths[i].addEventListener('path_change', (ev) => this.updatePathGeometry());
    }

    if (this.autostart) {
      setTimeout(() => {
        this.startPath();
      }, 100);
    }
    if (this.loop) {
      //this.path.autoClose = true;
    }
console.log('huh?', this.scrollselector);
    if (this.scrollselector) {
      var scrollElement = (this.scrollselector == 'document' ? document : document.querySelector(this.scrollselector));
console.log('SJHDJSHD', scrollElement);
      scrollElement.addEventListener('scroll', (ev) => this.handleScroll(scrollElement))
    }

    this.updatePathGeometry(); 
  },
  update(dt) {
    if (this.running) {
      let length = this.path.getLength(),
          n = this.currentpos / length;

      if (n >= 1) {
        n = 1;
        if (this.loop) {
          this.startPath();
        } else {
          this.stopPath();
        } 
      }
      let targetpos = this.path.getPoint(n);
      this.currentpos += this.speed * dt;

      if (targetpos) {
        let target = this.getTargetObject();
        if (target) {
          target.pos = targetpos;
        } else {
          console.warn('WARNING - no path target', this);
          this.stopPath();
        }
      }
    }
  },
  handleScroll(el) {
console.log('scroll<F12>e');
  },
  getTargetObject() {
    if (this.target) {
      if (room.objects[this.target]) {
        return room.objects[this.target];
      } else if (this.target == 'player') {
        return player;
      }
    }
    return null;
  },
  getPoint(n) {
    // n is a float from 0..1 representing progress along the path
    return this.path.getPoint(n);
  },
  startPath() {
    this.currentpos = 0;
    this.running = true;
  },
  stopPath() {
    this.running = false;
  },
  updatePathGeometry() {
    this.path.cacheLengths = null;
    if (this.children.length > 0) {
      let geom = new THREE.TubeGeometry(this.path, Math.ceil(this.path.getLength() * 5), .02, 5, false);
      if (!this.pathobj) {
        let mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({color: 0x009900, emissive: 0x006600, transparent: true, opacity: .4}));
        this.pathobj = this.createObject('object', {
          object: mesh,
          collidable: false,
          pickable: false
        });
      } else {
        this.pathobj.objects['3d'].geometry = geom;
      }
    }
  }
});
