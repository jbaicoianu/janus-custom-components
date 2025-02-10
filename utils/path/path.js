/*
 * From https://gist.github.com/gre/1650294
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
var EasingFunctions;
if (typeof EasingFuncs == 'undefined') {
  EasingFunctions = {
    // no easing, no acceleration
    linear: function (t) { return t },
    // accelerating from zero velocity
    easeInQuad: function (t) { return t*t },
    // decelerating to zero velocity
    easeOutQuad: function (t) { return t*(2-t) },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
    // accelerating from zero velocity 
    easeInCubic: function (t) { return t*t*t },
    // decelerating to zero velocity 
    easeOutCubic: function (t) { return (--t)*t*t+1 },
    // acceleration until halfway, then deceleration 
    easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
    // accelerating from zero velocity 
    easeInQuart: function (t) { return t*t*t*t },
    // decelerating to zero velocity 
    easeOutQuart: function (t) { return 1-(--t)*t*t*t },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
    // accelerating from zero velocity
    easeInQuint: function (t) { return t*t*t*t*t },
    // decelerating to zero velocity
    easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
    // acceleration until halfway, then deceleration 
    easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t },
    // elastic bounce effect at the beginning
    easeInElastic: function (t) { return (.04 - .04 / t) * Math.sin(25 * t) + 1 },
    // elastic bounce effect at the end
    easeOutElastic: function (t) { return .04 * t / (--t) * Math.sin(25 * t) },
    // elastic bounce effect at the beginning and end
    easeInOutElastic: function (t) { return (t -= .5) < 0 ? (.02 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1 },

    easeInSin: function (t) { return 1 + Math.sin(Math.PI / 2 * t - Math.PI / 2); },
    easeOutSin : function (t) { return Math.sin(Math.PI / 2 * t); },
    easeInOutSin: function (t) { return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2; },
  };
}

room.registerElement('path', {
  curvetype: 'line',
  easing: 'linear',
  target: null,
  looktarget: null,
  pathscale: 1.0,
  create() {
    //console.log('new path segment', this, this.children);
    //this.addEventListener('thing_create', (ev) => this.updateCurve());
    this.addEventListener('thing_remove', (ev) => this.updateCurve());
    this.lastgrabpos = V();
  },
  update() {
    if (this.visible && !this.wasvisible) {
      this.updatePathGeometry();
    }
    if (this.grabbed) {
      this.grabbed.pos = player.head.localToWorld(V(0, 0, -this.grabdistance));
      if (!this.lastgrabpos.equals(this.grabbed.pos)) {
        this.grabbed.sync = true;
        this.updateCurve();
      }
    }
    this.wasvisible = this.visible;
  },
  getCurve() {
    let points = this.getElementsByTagName('pathpoint');
    let positions = [];
    points.forEach(p => {
      positions.push(p.getPosition());
      p.addEventListener('pathpoint_move', (ev) => this.updateCurve());
      p.addEventListener('click', (ev) => this.handleClick(ev));
    });

    if (this.curvetype == 'line') {
      // TODO - if more that two points are specified 
      this.curve = new THREE.LineCurve3(positions[0], positions[1]);
    } else if (this.curvetype == 'cubicbezier') {
      this.curve = new THREE.CubicBezierCurve3(positions[0], positions[1], positions[2], positions[3]);
    } else if (this.curvetype == 'quadraticbezier') {
      this.curve = new THREE.QuadraticBezierCurve3(positions[0], positions[1], positions[2]);
    } else if (this.curvetype == 'catmullrom') {
      this.curve = new THREE.CatmullRomCurve3(positions);
    } else {
      console.warn('Unknown curve type:', this.curvetype);
      this.curve = new THREE.LineCurve3();
    }
    this.curve.arcLengthDivisions = 500;
    // Override Curve.getPointAt to apply easing
    let ease = EasingFunctions[this.easing] || EasingFunctions['linear'];
    this.curve.getPointAt = function( u, optionalTarget ) {

      var t = this.getUtoTmapping( u );
      return this.getPoint( ease(t), optionalTarget );

    };
    let superGetLength = this.curve.getLength.bind(this.curve),
        pathscale = this.pathscale;
    this.curve.getLength = function() {
      //console.log('override length!', superGetLength(), pathscale, superGetLength() * pathscale);
      return superGetLength() * pathscale;
    };
    

    return this.curve;
  },
  updateCurve() {
    let points = this.getElementsByTagName('pathpoint');
    if (this.curvetype == 'line') {
      // TODO - if more that two points are specified 
      this.curve.v1.copy(points[0].getPosition());
      this.curve.v2.copy(points[1].getPosition());
    } else if (this.curvetype == 'cubicbezier') {
      this.curve.v0.copy(points[0].getPosition());
      this.curve.v1.copy(points[1].getPosition());
      this.curve.v2.copy(points[2].getPosition());
      this.curve.v3.copy(points[3].getPosition());
    } else if (this.curvetype == 'quadraticbezier') {
      this.curve = new THREE.QuadraticBezierCurve3(positions[0], positions[1], positions[2]);
      this.curve.v0.copy(points[0].getPosition());
      this.curve.v1.copy(points[1].getPosition());
      this.curve.v2.copy(points[2].getPosition());
    } else if (this.curvetype == 'catmullrom') {
      this.curve.points = [];
      points.forEach(p => this.curve.points.push(p.getPosition()))
    } else {
      console.warn('Unknown curve type:', this.curvetype);
    }
    this.curve.needsUpdate = true;
    if (this.changetimer) clearTimeout(this.changetimer);
    this.changetimer = setTimeout(() => {
      this.dispatchEvent({type: 'path_change'});
      this.changetimer = false;
    }, 0);
  },
  handleClick(ev) {
    if (ev.button !== 0) return; // Only handle left mouse button
    if (this.grabbed) {
      this.releasePoint();
    } else {
      let point = ev.target;
      if (ev.shiftKey) {
        // Shift key to add new point after selected one
        // Ctrl+Shift to add new point behind selected one
        let points = this.getElementsByTagName('pathpoint'),
            idx = points.indexOf(point) + (ev.ctrlKey ? 0 : 1);

        // Remove any points after our index, so we can inject the new one
        for (let i = idx; i < points.length; i++) {
          this.removeChild(points[i]);
        }

        let newpos = V(point.pos);
        point = this.createObject('pathpoint', { pos: newpos, sync: true, persist: true });
        this.grabdistance = player.distanceTo(this.localToWorld(newpos));
        //console.log('new pos', newpos, point.pos, this.grabdistance);
        point.addEventListener('pathpoint_move', (ev) => this.updateCurve());
        point.addEventListener('click', (ev) => this.handleClick(ev));
        //console.log('create new point at index ' + idx, point, point.pos);

        // Re-add any points after this one
        for (let i = idx; i < points.length; i++) {
          this.appendChild(points[i]);
        }
        this.updateCurve();
      } else {
        this.grabdistance = player.distanceTo(this.localToWorld(point.pos));
      }
      this.grabPoint(point);
    }
  },
  grabPoint(point) {
    this.grabbed = point;
    //this.grabdistance = player.distanceTo(point);
    if (this.grabbed.marker) {
      this.grabbed.marker.col = V(1,0,0);
    }
  },
  releasePoint() {
    if (this.grabbed.marker) {
      this.grabbed.marker.col = V(1,1,0);
    }
    this.grabbed = false;
  },
  updatePathGeometry() {
    if (!this.visible || !this.curve) return;
    let geom = new THREE.TubeBufferGeometry(this.curve, Math.ceil(this.curve.getLength() * 10), .02, 5, false);
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
});
room.registerElement('pathpoint', {
  create() {
    //console.log('new path point', this);
    this.createMarker();
  },
  createMarker() {
    this.marker = this.createObject('object', {
      id: 'sphere',
      scale: V(.2),
      col: V(1,1,0),
      collision_id: 'sphere',
      collision_trigger: true,
      collidable: false,
      //layers: "10"
    });
    this.lastpos = V();
    this.currpos = V();

    //this.marker.addEventListener('room_edit', (ev) => this.handleThingChange());
    this.marker.addEventListener('mouseover', (ev) => this.handleGazeEnter());
    this.marker.addEventListener('mouseout', (ev) => this.handleGazeLeave());
    //this.marker.addEventListener('click', (ev) => this.dispatchEvent(ev));
  },
  update() {
    // FIXME - should only be doing this if the path is being edited
    if (!this.marker) this.createMarker();
    //let markerpos = this.marker.worldToLocal(this.currpos.set(0,0,0));
    //if (this.created && !this.lastpos.equals(markerpos)) {
    if (this.created && this.marker.pos.length() > 0) {
      this.dispatchEvent({type: 'pathpoint_move'});
/*
      this.pos = this.worldToLocal(this.marker.localToWorld(V()));
      this.marker.pos = V(0,0,0);
*/
      this.pos.add(this.marker.pos);
      this.marker.pos.set(0,0,0);
      //this.lastpos.copy(markerpos);
    }
  },
  getPosition() {
    if (this.marker) {
      return this.parent.worldToLocal(this.marker.localToWorld(V()));
    } else {
      return V(this.pos);
    }
  },
  handleGazeEnter(ev) {
    this.marker.col = V(0,1,0);
  },
  handleGazeLeave(ev) {
    this.marker.col = V(1,1,0);
  }
});
room.registerElement('scrollpath', {
  speed: 5,
  autostart: 0,
  loop: 0,
  currentpos: 0,
  enabled: true,
  running: false,
  target: null,
  scrollselector: '',
  marginTop: 0,
  marginBottom: 0,

  create() {
    this.path = new THREE.CurvePath();

    let paths = this.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
      this.path.add(paths[i].getCurve());
      paths[i].addEventListener('path_change', (ev) => this.updatePathGeometry());
    }
    this.paths = paths;

    if (this.loop) {
      //this.path.autoClose = true;
    }
    this.updatePathGeometry(); 
    if (this.autostart) {
      setTimeout(() => {
        this.startPath();
      }, 100);
    }
    if (!room.urlhash) {
      let scrolltarget = this.getScrollTarget();
      if (scrolltarget) {
        scrolltarget.addEventListener('scroll', (ev) => this.handleScroll(ev));   
        document.addEventListener('focusin', (ev) => this.handleScroll(ev));
      }

      this.setPosition(0);
    }
  },
  update(dt) {
    if (this.running) {
      let now = performance.now();
      let length = this.path.getLength(),
          n = this.currentpos / length;
      let newpos = n + (dt * this.speed) / 1000;
      this.setPosition(newpos);
      this.lasttime = now;

      let scrolltarget = this.getScrollTarget();
      if (scrolltarget && scrolltarget.parentNode) {
        scrolltarget.scrollTop = newpos * (scrolltarget.scrollHeight - scrolltarget.parentNode.offsetHeight);
      }
    }
  },
  setPosition(n) {
    let length = this.path.getLength(),
        curvelengths = this.path.getCurveLengths();

    if (n >= 1) {
      n = 1;
      if (this.loop) {
        this.startPath();
        return;
      } else {
        this.stopPath();
      } 
    }
    let targetpos = this.path.getPoint(n);
    this.currentpos = n * length;

    if (targetpos) {
      let target = this.getTargetObject();
      if (target) {
        target.pos = targetpos;

        target.objects['3d'].matrixWorldNeedsUpdate = true;

        let lookatpos = this.path.getPoint(n + .01);
        let curve = this.getPathAtPosition(n);
        if (curve && curve.looktarget && room.objects[curve.looktarget]) {
          lookatpos = room.objects[curve.looktarget].localToWorld(V(0,0,0));
        }

        if (lookatpos) {
          //target.neck.objects['3d'].lookAt(lookatpos); // FIXME - hack
/*
          let lookdir = targetpos.sub(lookatpos).normalize();
          target.properties.orientation.setFromEuler(new THREE.Euler(0, Math.atan2(lookdir.x, lookdir.z), 0));
          target.head.properties.orientation.setFromEuler(new THREE.Euler(-Math.asin(lookdir.y), 0, 0));
*/
          //target.lookAt(lookatpos);
          target.zdir = targetpos.clone().sub(lookatpos).normalize();
        }
      } else {
        console.warn('WARNING - no path target', this);
        this.stopPath();
      }
    }
    this.refresh();
  },
  getPathAtPosition(n) {
    let curvelengths = this.path.getCurveLengths(),
        pos = curvelengths[curvelengths.length - 1] * n;
    if (pos > curvelengths[0]) {
      for (let i = 0; i < curvelengths.length - 1; i++) {
        if (pos > curvelengths[i] && pos <= curvelengths[i+1]) {
          return this.paths[i+1];
        }
      }
    }
    return this.paths[0];
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
  resumePath() {
    this.running = true;
  },
  stopPath() {
    this.running = false;
  },
  enable() {
    this.enabled = true;
  },
  disable() {
    this.enabled = false;
  },
  updatePathGeometry() {
    if (!this.visible) return;
/*
    this.path.cacheLengths = null;
    let geom = new THREE.TubeBufferGeometry(this.path, Math.ceil(this.path.getLength() * 10), .02, 5, false);
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
*/
    for (let i = 0; i < this.paths.length; i++) {
      this.paths[i].updatePathGeometry();
    }
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
    if (this.enabled && !this.running) {
      // FIXME - HTML is dumb, and there's a different way to get scroll height for scrollable divs vs main window
      let target = this.getScrollTarget();
      let percent = 0;
      if (target === window) {
        percent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      } else {
        let top = Math.max(0, target.scrollTop - this.marginTop),
            height = Math.max(0, target.scrollHeight - target.offsetHeight - this.marginTop + this.marginBottom);
        percent = top / height;
      }
      this.setPosition(percent);
    }
  }
});
