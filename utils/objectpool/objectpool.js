room.registerElement('objectpool', {
  objectpool: [],
  free: [],
  pending: [],
  max: 10,
  preallocate: false,
  objecttype: 'object',
  parentobj: null,
  //objectargs: {},

  create: function() {
    // FIXME - I thought I fixed the problem with object properties acting like static member properties
    this.objectpool = [];
    this.free = [];
    this.pending = [];
    //this.objectargs = {};

    if (this.preallocate) {
      for (let i = 0; i < this.max; i++) {
        let obj = this.allocate();
        this.release(obj);
      }
    }
  },

  grab: function(args={}) {
    var obj = false;
    if (this.free.length > 0) {
      if (args.id) {
        // If an id was specified, let's try to find a free object which already has this id, so we can reuse it more efficiently
        for (let i = 0; i < this.free.length; i++) {
          if (this.free[i].id == args.id) {
            obj = this.free[i];
            break;
          }
        }
      }
      if (!obj) obj = this.free.shift();
    } else if (this.objectpool.length < this.max) {
      obj = this.allocate();
    } else if (this.pending.length > 0) {
      obj = this.pending.shift();
    }

    if (obj && args) {
      for (var k in args) {
        if (obj[k] != args[k]) {
          obj[k] = args[k];
        }
      }
    }

    if (obj) {
      this.pending.push(obj);
    }
    return obj;
  },
  release: function(obj) {
    this.free.push(obj);
    var idx = this.pending.indexOf(obj);
    if (idx != -1) {
      this.pending.splice(idx, 1);
    }
  },
  allocate: function() {
    let args = {};
    for (let k in this.objectargs) {
      args[k] = (this.objectargs[k].clone ? this.objectargs[k].clone() : this.objectargs[k]);
    }
//console.log('ALLOCATE', args, this);
    let parent = (this.parentobj || room);
    var obj = parent.createObject(this.objecttype, args);
    // FIXME - if we don't allocate a color here, it messes up obj.defaultcolor
    obj.col = V(1, 0, 1);
    this.objectpool.push(obj);
    return obj;
  },
  find: function(params) {
    let compare = (item) => {
      for (let k in params) {
        if (item[k] !== params[k]) return false;
      }
      return true;
    }
    for (let i = 0; i < this.pending.length; i++) {
      if (compare(this.pending[i])) return this.pending[i];
    }
    for (let i = 0; i < this.free.length; i++) {
      if (compare(this.free[i])) return this.free[i];
    }
    return undefined;
  }
});

