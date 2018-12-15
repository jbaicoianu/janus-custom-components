room.registerElement('showcase', {
  url: false,
  thumb_url: false,
  logo_url: false,
  logo_scale: V(1,1,.1),
  logo_offset: V(0),
  screen_scale: V(4.375, 2.5, 1),
  link_url: false,
  link_external: false,
  align: 'top',
  
  createChildren: function() {
/*
      <Image id="janus-logo" pos="-9.95 4.0 6.6" xdir="0 0 -1" ydir="0 1 0" zdir="1 0 0" lighting="false" scale="2 2 1" />
      <Object id="plane" js_id="janus" websurface_id="janus" pos="-9.95 1.7 6.6" xdir="0 0 -1" ydir="0 1 0" zdir="1 0 0" scale="4.375 2.5 1" />
      <Teleporter url="https://web.janusvr.com/" pos="-9.5 0.07973838367625019 6.6" col="#4cb96f" external="true" />
*/
    var alignments = {
      top: V(0, 4, 0),
      left: V(-3.3, this.screen_scale.y / 2, 0),
      right: V(3.3, this.screen_scale.y / 2, 0),
    };

    room.loadNewAsset('websurface', {
      id: this.url,
      src: this.url
    });
    var logoid = this.js_id + '_logo';
console.log('HI', this.id, this.js_id, logoid);

    room.loadNewAsset('image', {
      id: this.logo_url,
      src: this.logo_url,
      hasalpha: true
    });
    this.logo = this.createObject('image', {
      id: this.logo_url,
      js_id: logoid,
      pos: translate(alignments[this.align], this.logo_offset),
      col: V(1,1,1),
      scale: this.logo_scale,
      lighting: false
    }); 
    var screenargs = {
      id: 'plane',
      js_id: this.id + '_screen',
      pos: V(0, this.screen_scale.y / 2, 0),
      scale: this.screen_scale,
      col: V(1,1,1),
      lighting: false
    };
    if (this.thumb_url) {
      screenargs.image_id = this.thumb_url;
      screenargs.collision_id = 'cube';
    } else {
      screenargs.websurface_id = this.url;
    }
    this.screen = this.createObject('object', screenargs);
    this.attachClickHandler();

    this.teleporter = this.createObject('teleporter', {
      js_id: this.id + '_teleporter',
      url: this.link_url || this.url,
      pos: V(0, 0, .5),
      col: this.col,
      external: this.link_external
    }); 

  },
  attachClickHandler: function() {
    this.screen.addEventListener('click', this.activate);
  },
  activate: function() {
    if (!this.active) {
      this.active = true;
      if (this.thumb_url) {
        this.screen.websurface_id = this.link_url || this.url;
        this.screen.collision_id = null;
      }
    }
  }
});
