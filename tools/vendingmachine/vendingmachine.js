var holding = false;

room.registerElement('vendingmachine', {
  coinbank: [],
  slots: {
    "A": {
      id: 'cube',
      price: 0.75,
      scale: .15
    },
    "B": {
      id: 'sphere',
      price: 0.50,
      scale: .15
    },
    "C": {
      id: 'pipe',
      price: 1.00,
      scale: .15
    },
    "D": {
      id: 'toilet',
      price: 0.10,
      scale: 1/180
    }
  },
  create() {
    // TODO - find 3d model
    this.machine = this.createObject('object', {
      id: 'machine',
      collision_id: 'machine-collider',
      xcollision_scale: V(1.75, 3, .75),
      pos: V(0, 0, .3825)
    });
    this.displayscreen = this.createObject('displayscreen', {
      pos: V(0.55, 1.75, .74)
    });
    this.dispenser = this.createObject('dispenser', {
      pos: V(0, .6, .72)
    });
    this.keypad = this.createObject('keypad', {
      pos: V(0.485, 1.6, .73)
    });
    this.coinslot = this.createObject('coinslot', {
      pos: V(0.55, 1.7, .73)
    });
    this.keypad.addEventListener('keypadpress', (ev) => this.handleKeypadPress(ev));
    this.coinslot.addEventListener('added', (ev) => this.handleCoinAdded(ev));

    this.machine.addEventListener('mouseover', (ev) => this.handleMouseOver(ev));
    this.machine.addEventListener('mouseout', (ev) => this.handleMouseOut(ev));

    var i = 0;
    for (var k in this.slots) {
      var slot = this.slots[k];

      var item = this.getItem(k, false);
      item.pos = V(-.4 + ((i % 2) / 3), 2 - Math.floor(i / 2) / 3, .35);
      i++;
    }
  },
  getBalance() {
    var balance = 0;
    for (var i = 0; i < this.coinbank.length; i++) {
      balance += this.coinbank[i].value;
    }
    return balance;
  },
  updateBalance() {
    var balance = this.getBalance();
    console.log('Balance is', balance);
    this.displayscreen.setText(0, '$' + balance.toFixed(2));
    return balance;
  },
  getItem(slot, collidable) {
    var item = this.slots[slot];
    var obj = this.createObject('object', {
      id: item.id,
      scale: V(item.scale || 1),
      mass: 1
    });
    if (collidable) {
      obj.collision_id = 'sphere';
      obj.addForce('gravity', V(0,-9.8,0));
      obj.addForce('friction', .8);
    }
    return obj;
  },
  handleKeypadPress(ev) {
    console.log('boop', ev);

    var balance = this.getBalance(),
        item = this.slots[ev.data];

    if (item && balance >= item.price) {
      var obj = this.getItem(ev.data, true);
      obj.pos = translate(V(this.dispenser.pos), V(0,0,.2));
      obj.vel = V(Math.random() * 2 - 1, 5, Math.random() + .5);
      obj.objects.dynamics.restitution = .5;
      this.displayscreen.setText(1, 'Successfully purchased!');
      this.coinbank = [];
      setTimeout(() => this.displayscreen.setText(1, ''), 2500);
    } else {
      this.displayscreen.setText(1, 'Not enough money for purchase');
      setTimeout(() => this.displayscreen.setText(1, ''), 2500);
    }
    this.updateBalance();
  },
  handleCoinAdded(ev) {
    if (holding) {
      if (this.coinbank.indexOf(holding) == -1) {
        this.coinbank.push(holding);
      }
      this.appendChild(holding);
      holding.pos = V(0,0,0);
      holding = false;
      this.coinslot.hideHighlight();
    }

    this.updateBalance();
  },
  handleMouseOver(ev) {
    if (holding) {
      this.coinslot.showHighlight();
    }
  },
  handleMouseOut(ev) {
    this.coinslot.hideHighlight();
  },
});

room.registerElement('displayscreen', {
  rows: 2,
  font: 'mono',
  text: [
    'hello and welcome',
    'grab some change and pick something! ======>'
  ],

  create() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 64;

    this.updateScreen();

    // Register our canvas with the engine
    room.loadNewAsset('image', {
      id: this.js_id + '_displayscreen',
      canvas: this.canvas
    });
    // Create an object which uses our canvas as a texture
    this.screen = this.createObject('object', {
      id: 'plane',
      image_id: this.js_id + '_displayscreen',
      scale: V(.2, this.rows * .015, 1)
    });
  },
  updateScreen() {
    var ctx = this.canvas.getContext('2d');
    var fontsize = this.canvas.height / this.rows;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#0f0';
    ctx.font = fontsize + 'px ' + this.font;
    for (var i = 0; i < this.rows; i++) {
      var line = this.text[i] || '';
      ctx.fillText(line, 6, (i + 1) * fontsize - 6);
    }
    // Notify the engine that this canvas has changed
    elation.events.fire({target: this.canvas, type: 'update'});
  },
  setText(i, txt) {
    this.text[i] = txt;
    this.updateScreen();
  }
});

room.registerElement('keypad', {
  create() {
    var letters = ['A', 'B', 'C', 'D'];

    var buttons = {};
    for (var i = 0; i < letters.length; i++) {
      var letter = letters[i];
      buttons[letter] = this.createObject('keypadbutton', {
        label: letter,
        pos: V((i % 2) / 10, -Math.floor(i / 2) / 14, 0)
      });
      buttons[letter].addEventListener('activate', (ev) => this.handleButtonActivate(ev));
    }
  },
  handleButtonActivate(ev) {
    this.dispatchEvent({type: 'keypadpress', data: ev.data});
  }
});

room.registerElement('keypadbutton', {
  label: '',
  create() {
    this.buttonpos = this.localToWorld(V(0,0,0));
    this.pressed = false;
    this.button = this.createObject('object', {
      id: 'cube',
      collision_id: 'cube',
      collision_trigger: 'true',
      scale: V(.075, .05, .025),
      pos: V(0,0,0),
      col: V(0,1,0),
      mass: 1
    });
    // Bind a reference to the mouseup function so we can unbind it later
    // This way we can attach the mouseup handler to the window, which is more reliable than trying to catch mouseup on this object, which may move
    // FIXME - this should be done at a lower level
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.button.addEventListener('mousedown', (ev) => this.handleMouseDown(ev));
    this.updateButtonPosition();
  },
  updateButtonPosition() {
    if (this.pressed) {
      this.button.pos.z = 0;
    } else {
      this.button.pos.z = 0.0125;
    }
  },
  handleMouseDown(ev) {
    ev.stopPropagation();
    this.pressed = true;
    this.updateButtonPosition();
    this.dispatchEvent({type: 'activate', data: this.label});
    window.addEventListener('mouseup', this.handleMouseUp);
  },
  handleMouseUp(ev) {
    this.pressed = false;
    this.updateButtonPosition();
    window.removeEventListener('mouseup', this.handleMouseUp);
  }
});

room.registerElement('coin', {
  value: 0.25,
  create() {
    this.obj = this.createObject('object', {
      id: 'cylinder',
      collision_id: 'cylinder',
      collision_trigger: true,
      scale: V(.02, .00350, .02),
      pos: V(0,.00175,0),
      col: V(.2)
    });

/*
    this.obj = this.createObject('object', {
      id: 'coin',
      collision_id: 'sphere',
      collision_trigger: true,
      collision_scale: V(200),
      scale: V(.002),
      pos: V(0,.00175,0),
      col: V(1)
    });

o
*/
    this.obj.addEventListener('click', (ev) => this.handleClick(ev));
  },
  handleClick(ev) {
    this.pickup();
  },
  pickup() {
    if (!holding) {
      console.log('grab it', this);
      holding = this;
      this.pos = player.worldToLocal(this.localToWorld(V()));
      //player.appendChild(this);
    }
  },
  update() {
    if (holding === this) {
      //this.pos = this.worldToLocal(V(player.cursor_pos));
      this.pos = V(player.cursor_pos);
      this.obj.collision_id = '';
      this.obj.rotation.z = 90;
    } else {
      if (this.obj.collision_id != 'cylinder') {
        this.obj.collision_id = 'cylinder';
        this.obj.rotation.z = 0;
      }
    }
  }
});
room.registerElement('coinslot', {
  create() {
    this.obj = this.createObject('object', {
      id: 'cube',
      collision_id: 'cube',
      collision_trigger: true,
      scale: V(.02, .04, .05),
      pos: V(0,0,0),
      col: V(.4)
    });
    this.slot = this.createObject('object', {
      id: 'cube',
      scale: V(.0075, .03, .05),
      pos: V(0,0,.002),
      col: V(0)
    });
    this.highlight = this.createObject('object', {
      id: 'cube',
      scale: V(.025, .045, .055),
      pos: V(0,0,0),
      col: V(1,1,0),
      opacity: .2,
      visible: false
    });

    this.obj.addEventListener('mouseover', (ev) => this.activateHighlight());
    this.obj.addEventListener('mouseout', (ev) => this.deactivateHighlight());
    this.obj.addEventListener('click', (ev) => this.handleClick(ev));
  },
  showHighlight() {
    this.highlight.visible = true;;
  },
  hideHighlight() {
    this.highlight.visible = false;
  },
  activateHighlight() {
    if (holding) {
      this.showHighlight();
      this.highlight.col = V(0,1,0);
    }
  },
  deactivateHighlight() {
    this.highlight.col = V(1,1,0);
  },
  handleClick(ev) {
    if (holding) {
      this.dispatchEvent({type: 'added', data: holding});
    }
  }
});

room.registerElement('dispenser', {
  create() {
    this.flap = this.createObject('object', {
      id: 'cube',
      col: V(.2),
      scale: V(.8, .2, .05)
    });
  }
});
