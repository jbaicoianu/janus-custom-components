room.registerElement('speechtext', {
  create() {

    this.labels = {
      ready: 'Click the box and start speaking',
      starting: 'Starting...',
      listening: 'Listening for audio...',
      recording: 'Audio detected, keep speaking!',
      processing: 'Server is thinking...',
      finished: 'Done!',
    };

    this.button = this.createObject('object', { id: 'cube', col: 'red', collision_id: 'cube', opacity: 1 });
    this.label = this.createObject('text', { pos: V(0, -1, .5), col: 'black', collision_trigger: true, text: this.labels.ready, font_scale: false, font_size: .5  });
  },
  numberToColorHsl(i) {
    // as the function expects a value between 0 and 1, and red = 0° and green = 120°
    // we convert the input to the appropriate hue value
    var hue = i * 1.2 / 360;
    // we convert hsl to rgb (saturation 100%, lightness 50%)
    var rgb = this.hslToRgb(hue, 1, .5);
    // we format to css value and return
console.log(rgb);
    return V(rgb[0], rgb[1], rgb[2]).multiplyScalar(1/255);
  },
  hslToRgb(h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          var hue2rgb = function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  },
  onclick(ev) {
    if (ev.button == 0) {
      this.startRecognition();
    }
  },
  onmouseover(ev) {
    let col = this.button.col;
    if (col.r == 1 && col.g == 0 && col.b == 0) {
      this.button.col = V(1,.5,.5);
    }
  },
  onmouseout(ev) {
    let col = this.button.col;
    if (col.r == 1 && col.g == 0.5 && col.b == 0.5) {
      this.button.col = V(1,0,0);
    }
  },
  startRecognition() {
    this.label.text = this.labels.starting;
    this.button.col = 'yellow';

    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = this.recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    // Begin and end
    recognition.onstart = (ev) => this.handleRecognitionStart(ev);
    recognition.onend = (ev) => this.handleRecognitionEnd(ev);

    // Audio device open and close
    recognition.onaudiostart = (ev) => this.handleRecognitionAudioStart(ev);
    recognition.onaudioend = (ev) => this.handleRecognitionAudioEnd(ev);

    // Speech detected and capturing
    recognition.onspeechstart = (ev) => this.handleRecognitionSpeechStart(ev);
    recognition.onspeechend = (ev) => this.handleRecognitionSpeechEnd(ev);

    // Speech decoded by service
    recognition.onresult = (ev) => this.handleRecognitionResult(ev);

    this.recognition.start();
  },
  stopRecognition() {
    this.label.text = this.labels.ready;
    this.button.col = V(1, 0, 0);
    this.recognition.stop();
  },
  reset() {
    this.label.text = this.labels.ready;
    this.stopRecognition();
  },
  handleRecognitionResult(ev) {
    if (ev.results) {
      let result = ev.results[ev.results.length - 1];
console.log('do it!', ev.results, result, V(1, result[0].confidence, 0));
        
      //room.createObject('textblock', {
      if (!this.objectpool) {
        this.objectpool = room.createObject('objectpool', { objecttype: 'textblock', max: 30 });
      }

      let obj = this.objectpool.grab({
        pos: this.localToWorld(V(0, 1, 0)),
        vel: V(Math.random() * 2 - 1, 5, Math.random() * 2 - 1),
        acceleration: V(0, -9.8, 0),
        col: this.numberToColorHsl(result[0].confidence * 100), // 360, 50%, 50%)',//V(1, ev.results[0][0].confidence, 0),
        text: result[0].transcript,
        mass: 1,
        sync: true
      });
      console.log(obj);
    }
  },
  handleRecognitionStart(ev) {
    console.log(ev);
    this.button.col = 'yellow';
  },
  handleRecognitionAudioStart(ev) {
    console.log(ev);
    if (this.oldrecognition) {
      this.oldrecognition.stop();
      this.oldrecognition = false;
    }
    this.label.text = this.labels.listening;
  },
  handleRecognitionAudioEnd(ev) {
    console.log(ev);
  },
  handleRecognitionSpeechStart(ev) {
    console.log(ev);
    this.button.col = 'orange';
    this.label.text = this.labels.recording;
  },
  handleRecognitionSpeechEnd(ev) {
    console.log(ev);
    this.button.col = 'purple';
    this.label.text = this.labels.processing;
  },
  handleRecognitionEnd(ev) {
    console.log(ev);
    this.button.col = 'green';
    this.label.text = this.labels.finished;
    setTimeout(() => { this.reset(); this.startRecognition(); }, 2000);
  }
});
room.registerElement('textblock', {
  text: '',
  col: V(1,0,0),
  create() {
    this.collision_id = 'sphere';
    this.textobj = this.createObject('text', { text: this.text, col: this.col, collision_trigger: true, font_scale: false });

    setTimeout(() => this.dispatchEvent({type: 'release'}), 15000);
  },
  update() {
    if (this.text != this.textobj.text) {
      this.textobj.text = this.text;
      this.textobj.col = this.col;
    }
  }
});
