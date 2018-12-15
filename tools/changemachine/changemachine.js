//<ChangeMachine fwd="0 0 1" id="change-machine-high" lighting="true" pos="-1.5071823596954 0.065061643719673 2.5123152732849" up="0 1 0" xcollision_id="change-machine-high_collider" envmap_id="envmap-interior"/>

room.registerElement('changemachine', {
  rate: 0.00006, // TODO - rate should be read-only, and reflect current BTC exchange rate
  attached: true,

  onpaymentbegin: null,
  onpaymentreceive: null,
  onpaymentprogress: null,
  onpaymentconfirm: null,

  createChildren: function() {
    this.machine = this.createObject('object', {
      id: "change-machine-high",
      collision_id: "cube",
      collision_scale: V(.9,1.4,.4),
      collision_pos: V(0,.75,.2),
      envmap_id: "envmap-interior"
    });
    this.machine.addEventListener('click', this.showPopup);

/*
    this.qrcode = new QRCode(document.createElement('div'), {
        text: 'hello what',
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });
*/
  },
  showPopup: function() {
    if (!this.slider) {
      this.slider = this.createObject('slider', {
        min: 0,
        max: 1000,
        value: 1,
        pos: V(-.1, 0.75, 0.55),
        xdir: V(1,0,0),
        ydir: V(0,0,-1),
        zdir: V(0,-1,0),
        width: .125,
        length: .55,
        height: .1,
        onchange: this.updatePopup
      });
      //this.slider.addEventListener('change', this.updatePopup);
      this.button = this.createObject('pushbutton', {
        pos: V(.32, 0.75, 0.55),
        xdir: V(1,0,0),
        ydir: V(0,0,-1),
        zdir: V(0,-1,0),
        width: .125,
        length: .125,
        height: .1,
        col: V(0,.75,0),
        onactivate: this.submit
      });
    }
    if (!this.popup) {
      this.popup = this.createObject('paragraph', {
        text: this.getPopupText(),
        css: '.wrapper { text-align: center; font-size: 1em; background: rgba(0,0,0,.8); border: 2px solid orange; border-radius: 10px; padding: 1em; color: white; } h1 { font-size: 1.5em; margin: 0; color: orange; } .amount { } .hash { display: block; color: orange; } .payments { font-size: .8em; } .unconfirmed { background: rgba(255,255,0,.2); } .confirmed { background: rgba(0,255,0,.2); } .qrcode { width: 192px; height: 192px; display: block; margin: 0 auto; } p { margin: 0; }',
        lighting: false,
        back_alpha: 0,
        pos: V(0, 1, 0.5),
        scale: V(.4),
      });
    }
    this.popup.visible = true;
    //room.addEventListener('update', this.update);
    room.update = this.update;
  },
  getPopupText: function() {
    var tokens = this.tokens,
        total = this.getTotal();
    return '<div class="wrapper"><h1>Change Machine</h1><p><strong>' + tokens + '</strong> token' + (tokens != 1 ? 's' : '') + ' for <strong>' + total + '</strong> BTC</p></div>';
  },
  getTotal: function() {
    var total = +(this.tokens * this.rate).toFixed(8);
    return total;
  },
  updatePopup: function() {
    var newtokens = Math.floor(this.slider.value);
    if (this.tokens != newtokens) {
console.log('changed!', newtokens);
      this.tokens = newtokens;
      this.popup.text = this.getPopupText();
    }
  },
  update: function() {
    this.popup.pos = player.localToWorld(V(0,1.2,-2));
    this.popup.zdir = V(-player.dir.x, 0, -player.dir.z);
  },
  startSession: function() {
    var session = new WebSocket('wss://btc.metacade.com/session');
  },
  submit: function() {
    //alert('its happening');
    this.popup.text = '<div class="wrapper"><h1>Change Machine</h1><p>Please wait...</p></div>';
    this.state = 'connecting'; 
    var session = new WebSocket('wss://btc.metacade.com/session');
    session.addEventListener('message', this.onMessage);
    session.addEventListener('open', function() {
      this.state = 'connected';
      session.send(JSON.stringify({cmd: 'invoice', amount: this.getTotal()}));
    }.bind(this));
    this.dispatchEvent({type: 'paymentbegin', data: this.getTotal()});
  },
  update: function() {
    if (this.popup) {
      var dist = this.distanceTo(player);
      if (dist > 2 && this.attached) {
        this.attached = false;
        this.removeChild(this.popup);
        player.appendChild(this.popup);
        this.originalpos = V(this.popup.pos);
        this.popup.pos = V(1,1.2,-2);
      } else if (dist < 2 && !this.attached) {
        this.attached = true;
        player.removeChild(this.popup);
        this.appendChild(this.popup);
        this.popup.pos = this.originalpos;
      }
    }
  },
  onMessage: function(msg) {
    var json = JSON.parse(msg.data);
    var text = '<div class="wrapper"><h1>Change Machine</h1>';
    //var img = this.qrcode._el.childNodes[1];
    var bitcoinurl = (json.invoice ? 'bitcoin:' + json.invoice.hash + '?amount=' + json.invoice.amount : false);

    if (this.qrcodeurl != bitcoinurl) {
      this.qrcodeurl = bitcoinurl;
/*
      this.qrcode.clear();
      this.qrcode.makeCode("WHAT THE FUCK");
*/
      var qr = new QRious({
        value: bitcoinurl,
        size: 192
      });
/*
      img.addEventListener('load', function() {
console.log('done it!', img.src);
        this.onMessage({data: JSON.stringify({type: 'invoice', invoice: json.invoice})});
      }.bind(this));
console.log('image!', img.src);
*/
      this.qrcode = qr.toDataURL();
    }
    var qrcodetext = '';
    if (this.qrcode) {
      qrcodetext = '<img class="qrcode" src="' + this.qrcode + '" />';
    }
    if (json.type == 'invoice') {
      this.state = 'waiting';
      var invoice = json.invoice;
      text += '<p>Awaiting payment of <strong class="amount">' + invoice.amount + '</strong> BTC</p>' + qrcodetext + '<strong class="hash">' + invoice.hash + '</strong></p>';
      console.log('bitcoin url:', bitcoinurl);
    } else if (json.type == 'update') {
      var total = 0;
      var required = 2;
      var history = json.history;
      var invoice = json.invoice;
      var totalRequired = 0,
          totalConfirmed = 0;
      if (history.items.length == 0) {
        this.state = 'waiting';
        text += '<p>Awaiting payment of <strong class="amount">' + invoice.amount + '</strong> BTC</p>' + qrcodetext + '<strong class="hash">' + invoice.hash + '</strong></p>';
      } else {
        var paymenttext = '<p>Transactions:<table class="payments"><tr><th>Amount</th><th>Confirmations</th></tr>';
        for (var i = 0; i < history.items.length; i++) {
          var item = history.items[i];
          totalRequired += required;
          totalConfirmed += item.confirmations;
          total += item.satoshis;
          paymenttext += '<tr class="' + (item.confirmations >= required ? 'confirmed' : 'unconfirmed') + '"><td>' + (+(item.satoshis / 1e8).toFixed(8)) + '</td><td>' + item.confirmations + '</td></tr>';
        }
        paymenttext += '</table></p>';

        text += '<p>Payment of <strong class="amount">' + invoice.amount + '</strong> BTC received<strong class="hash">Awaiting confirmation (' + totalConfirmed + ' / ' + totalRequired + ')</strong></p>';
        text += paymenttext;
        if (this.state == 'waiting') {
          this.state = 'confirming';
          this.dispatchEvent({type: 'paymentreceive', data: json.invoice});
        }
        if (totalConfirmed != this.confirmations) {
          this.dispatchEvent({type: 'paymentprogress', data: json.invoice});
          this.confirmations = totalConfirmed;
        }
      }
      
      //this.popup.text = '<div class="wrapper"><h1>Change Machine</h1><p>Received <strong>' + (+(total / 1e8).toFixed(8)) + '</strong> BTC!</p></div>';
    } else if (json.type == 'complete') {
      text += '<p>Payment accepted!</p>';
      this.state = 'confirmed';
      this.dispatchEvent({type: 'paymentconfirm', data: "cool"});
    }
    text += '</div>';
    this.popup.text = text;
  }
});

