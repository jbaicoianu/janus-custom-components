// Shader used to outline the seleced object.  Based on http://jsfiddle.net/psyrendust/ga13okzz/
var SelectedObjectShader = {
        vertex_shader: [
            "uniform float offset;",
            "void main() {",
                "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
                "gl_Position = projectionMatrix * pos;",
            "}"
        ].join("\n"),

        fragment_shader: [
            "uniform vec3 color;",
            "uniform float opacity;",
            "void main(){",
                "gl_FragColor = vec4( color, opacity );",
            "}"
        ].join("\n")
};

// TODO - these templates aren't used yet, but this is an example of how we might use them to define different item types
var templates = {
  'cabinet': `
    <text pos="0 1.85 0.65">{msfdata.title}</text>
    <object id="{cabinet_id}">
      <part name="{screen_part_name}" image_id="{msfdata.screen}" />
      <part name="{marquee_part_name}" image_id="{msfdata.marquee}" />
      <part name="{controlpanel_part_name}" image_id="{msfdata.marquee}" />
    </object>
    <paragraph visible="false">
     <![CDATA[
      <div style="border: 1px solid #0f0; border-radius: 5px; background: rgba(0,0,0,.75); color: white; padding: .5em; width: 20em;">
        <h1 style="margin: 0 0 .5em 0">{msfdata.title}</h1>
        {msfdata.desription}
      </div>
     ]]>
    </paragraph> 
  `
};

room.registerElement('aacabinet', {
  msf: '',
  msfurl: '',

  cabinet_id: '',
  marquee_part_name: '',
  screen_part_name: '',
  controlpanel_part_name: '',

  create() {
    if (this.cabinet_id) {
      this.selectedMesh = this.createObject('object', { id: this.cabinet_id, wireframe: true, col: 'green', opacity: .5, cull_face: 'none', visible: false });
      this.cabinet = this.createObject('object', { id: this.cabinet_id });
    }

    if (this.msfurl) {
      // Load the MSF file from a url, if specified
      fetch(this.msfurl).then(r => r.json).then(j => this.parseMSF(j));
    } else if (this.msf) {
      // If the JSON was specified in the markup, load it up
      this.parseMSF(this.msf);
    }

    this.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    this.addEventListener('click', ev => this.handleClick(ev));
  },
  parseMSF(msfdata) {
    this.msfdata = JSON.parse(msfdata);
    console.log('got the msf json', msfdata, this);
    if (this.cabinet.assetloadeed) {
      this.applyMSFMaterials();
    } else {
      this.cabinet.addEventListener('load', ev => this.applyMSFMaterials());
    }
  },
  setImageForPart(part, image_id) {
      //room.loadNewAsset('image', { id: image_id, src: image_id }); // Define asset for image
      part.image_id = image_id; // Apply image to part
      part.lighting = false; // Disable lighting for a backlit effect
      //part.rotation.x = 90; // FIXME - part rotation hack

      // NOTE - if you want to override the material entirely, you can access the THREE.Mesh object as part.objects['3d'], eg:
      // part.objects['3d'].material = new THREE.MeshBasicMaterial({color: 0xff0000});
    
  },
  applyMSFMaterials() {
    let parts = this.cabinet.parts;

    console.log('apply to parts', this.msfdata, parts.screen);
    if (this.msfdata.screen && this.screen_part_name && parts[this.screen_part_name]) {
      let screen_id = this.js_id + '_screen',
          screen = parts[this.screen_part_name];
      this.setImageForPart(parts[this.screen_part_name], this.msfdata.screen);
    }

    if (this.msfdata.marquee && this.marquee_part_name && parts[this.marquee_part_name]) {
      this.setImageForPart(parts[this.marquee_part_name], this.msfdata.marquee);
      if (parts[this.controlpanel_part_name]) {
        this.setImageForPart(parts[this.controlpanel_part_name], this.msfdata.marquee);
      }
    }

    if (this.msfdata.title) {
      this.titleobj = this.createObject('text', {
        col: V(1,1,1),
        pos: V(0, 1.85, .65),
        text: this.msfdata.title
      });
    }
    if (this.msfdata.description) {
      this.descriptionobj = this.createObject('paragraph', {
        col: V(1,1,0),
        pos: V(.75, 1, .75),
        scale: V(.5),
        text: '<div style="border: 1px solid #0f0; border-radius: 5px; background: rgba(0,0,0,.75); color: white; padding: .5em; width: 20em;"><h1 style="margin: 0 0 .5em 0">' + this.msfdata.title + '</h1>' +  this.msfdata.description + '</div>',
        rotation: V(0, -20, 0),
        visible: false,
        back_alpha: 0,
        collision_trigger: true
      });
    }

    // Set bounding box for the whole arcade cabinet
    let bbox = this.cabinet.getBoundingBox(true);
    this.collision_scale = V().subVectors(bbox.max, bbox.min).multiply(this.scale);
    this.collision_pos = V().addVectors(bbox.max, bbox.min).multiplyScalar(.5);
    this.collision_id = 'cube';


    // Set up the selector object's shader material
    this.selectoruniforms = {
      offset: { type: "f", value: .00375 },
      color: { value: new THREE.Color(0x00ff00) },
      opacity: { value: .5 }
    };
    
    this.selectedMesh.objects['3d'].traverse(n => {
      if (n.material) {
        n.material = new THREE.ShaderMaterial({
          uniforms: this.selectoruniforms,
          vertexShader: SelectedObjectShader.vertex_shader,
          fragmentShader: SelectedObjectShader.fragment_shader
        });
        n.material.transparent = true;
        n.material.depthWrite = false;
        n.material.side = THREE.BackSide;
      }
    });

    
  },
  update() {
    if (this.selectoruniforms) {
      //this.selectoruniforms.color.value.r = Math.sin(new Date().getTime() / 350) / 4 + .25;
      this.selectoruniforms.opacity.value = Math.sin(new Date().getTime() / 350) / 10 + .35
    }
  },
  handleMouseOver(ev) {
    this.selectedMesh.visible = true;
    if (this.descriptionobj) {
      this.descriptionobj.visible = true;
    }
    if (this.titleobj) {
      this.titleobj.col = V(0,1,0);
    }
  },
  handleMouseOut(ev) {
    this.selectedMesh.visible = false;
    if (this.descriptionobj) {
      this.descriptionobj.visible = false;
    }
    if (this.titleobj) {
      this.titleobj.col = V(1,1,1);
    }
  },
  handleClick(ev) {
    console.log('click!');
  },
});
