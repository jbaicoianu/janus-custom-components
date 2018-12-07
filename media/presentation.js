room.kweb = function(){
	window.open("http://janusvr.com/web.html", '_blank');
    return;
} 

room.kweb2 = function(){
	window.open("http://www.dgp.toronto.edu/~karan/courses/csc_2524_ar-vr/i3.html", '_blank');
    return;
} 

room.kweb3 = function(){
	window.open("http://yt.janusvr.com", '_blank');
    return;
} 

room.registerElement('presentation', {
  slides: [],
  currentslide: 0,

  create: function() {
    var slides = this.getElementsByTagName('slide');

    window.addEventListener('popstate', (ev) => {
      this.setSlideFromURL();
    });

    this.initSlides(slides);
    this.background = this.createObject('object', {
      id: 'cube',
      collision_id: 'cube',
      col: '#222',
      pos: V(0,1.6,-.5),
      scale: V(5.68889, 3.2, .05),
	  
    });
    this.background.addEventListener('click', (ev) => {
      if (!ev.button || ev.button == 0) {
        this.advance();
        ev.preventDefault();
      } else if (ev.button == 2) {
        this.retreat();
        ev.preventDefault();
      }
    });

    // bind controls for advancing/rewinding
    var controls = this.engine.systems.controls;
    controls.addContext('presentation', {
      'advance': ['keyboard_n,keyboard_period,gamepad_any_button_3', (ev) => { if (ev.value == 1) this.advance() }],
      'retreat': ['keyboard_b,keyboard_comma,gamepad_any_button_4', (ev) => { if (ev.value == 1) this.retreat() }],
    });
    controls.activateContext('presentation');

  },
  initSlides(slides) {
    this.slides = slides;

    for (var i = 0; i < slides.length; i++) {
      slides[i].addEventListener('prev', (ev) => this.prevSlide());
      slides[i].addEventListener('next', (ev) => this.nextSlide());
    }

    this.setCurrentSlide(0);
    // Get things started on our next frame
    setTimeout(() => {
      this.setSlideFromURL()
    }, 0);
  },
  advance() {
    var slide = this.getCurrentSlide();
    if (slide) {
      slide.advance();
    }
    this.updateHistory();
  },
  retreat() {
    var slide = this.getCurrentSlide();
    if (slide) {
      slide.retreat();
    }
    this.updateHistory();
  },
  nextSlide() {
    var newslide = Math.min(this.slides.length-1, this.currentslide + 1);
    this.setCurrentSlide(newslide, 0);
  },
  prevSlide() {
    var newslide = Math.max(0, this.currentslide - 1);
    this.setCurrentSlide(newslide);
  },
  getCurrentSlide() {
    return this.slides[this.currentslide];
  },
  setCurrentSlide(num, stepnum) {
console.log('SET SLIDE', num, stepnum, this.currentslide);
    this.currentslide = num;
    var slide = this.getCurrentSlide();

    if (typeof stepnum != 'undefined') {
      slide.setStep(stepnum);
    }

    for (var i = 0; i < this.slides.length; i++) {
      if (i == num) {
        this.slides[i].show();
        this.appendChild(this.slides[i]);
      } else if (this.slides[i].parent === this) {
        this.removeChild(this.slides[i]);
      }
    }
  },
  setSlideFromURL() {
    var hashargs = elation.url();
    if (hashargs.presentation) {
      var slide = hashargs.presentation.split('.');
      this.setCurrentSlide(parseInt(slide[0]), parseInt(slide[1]));
    } else {
      this.setCurrentSlide(0, 0);
    }
  },
  updateHistory() {
    var slide = this.getCurrentSlide();
    var hashargs = elation.url();
    hashargs['presentation'] = this.currentslide;
    if (slide.current != -1 && !isNaN(slide.current)) {
      hashargs['presentation'] += '.' + slide.current;
    } else {
      hashargs['presentation'] += '.0';
    }
    var url = document.location.origin + document.location.pathname + '#' + elation.utils.encodeURLParams(hashargs);
    history.pushState(null, null, url);
  }
});
room.registerElement('slide', {
  childobjs: [],
  steps: [],
  current: -1,


  create: function() {
    var steps = this.getElementsByTagName('slidestep');
    if (steps.length > 0) {
      this.steps = steps;
    } else {
      this.steps[0] = this.createObject('slidestep');
    }
  },
  addStep: function(step) {
    this.steps.push(step);
  },
  setStep: function(step) {
    if (this.current >= 0) {
      var last = this.steps[this.current];
      last.stopStep();
    }
    this.current = step;
    this.steps[step].startStep();
  },
  advance() {
console.log('advance the slide', this.current, this.steps);
    if (this.current < this.steps.length - 1) {
      this.setStep(this.current + 1);
    } else {
      this.dispatchEvent({type: 'next'});
    }
	player.pos=Vector(0,0,-2.8);
	player.dir=Vector(0,0,1);
  },
  retreat() {
    if (this.current > 0) {
      this.setStep(Math.min(this.current, this.steps.length) - 1);
    } else {
      this.dispatchEvent({type: 'prev'});
    }
	// pos="3.4 0 -5.2" for side screen
	player.pos=Vector(0,0,-2.8);
	player.dir=Vector(0,0,1);
   }
});
room.registerElement('slidestep', {
  onstart: false,
  onstop: false,

  create: function() {
  },
  startStep() {
    setTimeout(() => {
      this.dispatchEvent({type: 'start'});
    }, 0)
  },
  stopStep() {
    setTimeout(() => {
      this.dispatchEvent({type: 'stop'});
    }, 0);
  }
});
room.registerElement('snaplayout', {
  snapped: false,
  snapdir: 'left',
  
  create() {
    var children = this.children;
    this.snapcontainer = this.createObject('object', {
      mass: 1,
    });
    for (var i = 0; i < children.length; i++) {
      this.snapcontainer.appendChild(children[i]);
    }

    this.snappoint = this.localToWorld(V(10,0,0));
    this.snapforce = this.snapcontainer.addForce('spring', { strength: 80, hard: true, anchor: this.snappoint });
    this.frictionforce = this.snapcontainer.addForce('anisotropicfriction', V(8,40,40));
    this.dragforce = this.snapcontainer.addForce('drag', .9);

    if (this.snapped) {
      this.snap(true);
    } else {
      this.unsnap(true);
    }
  },
  snap(instant) {
    this.localToWorld(this.snappoint.set(0,0,0));
    if (instant) {
      this.snapcontainer.pos.set(0,0,0);
    } else if (Math.abs(this.snapcontainer.vel.x) < 1e-2) {
      this.snapcontainer.vel.x = -.01;
    }
  },
  unsnap(instant) {
    this.localToWorld(this.snappoint.set(10,0,0));
    if (instant) {
      this.snapcontainer.pos.set(10,0,0);
    } else if (Math.abs(this.snapcontainer.vel.x) < 1e-2) {
      this.snapcontainer.vel.x = .01;
    }
  }
});
