room.registerElement('layout', {
  offset: V(1,0,0),
  spacing: 1,

  createChildren: function() {
    var children = this.children;
    console.log('children!', children);
    var i = 0;
    for (var k in children) {
      children[k].pos = scalarMultiply(this.offset, i++ * this.spacing);        
    }
  },
});
room.extendElement('layout', 'horizontallayout', {
  spacing: 1,
  offset: V(1,0,0),
  // FIXME - need proxy inheritance so we don't need to duplicate this function
  createChildren: function() {
    var children = this.children;
    console.log('children!', children);
    var i = 0;
    for (var k in children) {
      children[k].pos = scalarMultiply(this.offset, i++ * this.spacing);        
    }
  },
});
room.extendElement('layout', 'verticallayout', {
  offset: V(0,1,0),
  spacing: 1,
  // FIXME - need proxy inheritance so we don't need to duplicate this function
  create: function() {
    var children = this.children;
    console.log('children!', children);
    var i = 0;
    for (var k in children) {
      children[k].pos = scalarMultiply(this.offset, i++ * this.spacing);        
    }
  },
});
room.extendElement('layout', 'circularlayout', {
  radius: 1,

  createChildren: function() {
    var spacing = -2 * Math.PI / this.children.length;

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      child.pos = V(this.radius * Math.sin(spacing * i), 0, this.radius * Math.cos(spacing * i));
      child.zdir = scalarMultiply(normalized(child.pos), -1);
      child.xdir = cross(V(0,1,0), child.zdir);
    }

  }
});

