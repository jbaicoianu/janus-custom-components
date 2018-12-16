room.registerElement('book', {
  src: null,
  title: null,
  numpages: 0,
  identifier: null,

  createChildren() {
/*
    this.flipsound = this.createObject('sound', {
      id: "pageflip",
      loop: false,
      auto_play: false
    });
*/
    this.book = this.createObject('object', {
      id: "book-open",
    });
    this.page_left = this.createObject('object', {
      id: "book-page-left",
      collision_id: "book-page-left",
    });
    this.page_right = this.createObject('object', {
      id: "book-page-right",
      collision_id: "book-page-right",
    });
    this.page_left.addEventListener('click', this.previousPage);
    this.page_right.addEventListener('click', this.nextPage);
    if (this.src) {
      this.loadBook(this.src);
    }
  },
  loadBook(url) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', this.processBook);
    xhr.open('GET', this.src);
    xhr.send();
  },
  processBook(data) {

    // FIXME - using an Elation utility function here makes it harder to make this work in the native client
    var xml = elation.utils.parseXML(data.target.responseXML);
    this.pages = {};
    // FIXME - why is the top-level element named 'undefined' here? o_O
    if (xml && xml.undefined && xml.undefined._children.metadata) {
      var xml = xml.undefined._children;
    console.log('got a book', xml);
      this.title = elation.utils.arrayget(xml, 'metadata._children.title._content');
      this.numpages = elation.utils.arrayget(xml, 'metadata._children.imagecount._content');
      this.identifier = elation.utils.arrayget(xml, 'metadata._children.identifier._content');

      this.setPage(0);
    }

  },
  fetchPage(pagenum) {
    var newpage = Math.min(this.numpages-1, pagenum);
    var pageid_left = ('000' + newpage).slice(-4);
    var pageid_right = ('000' + (newpage+1)).slice(-4);
    var pageext = 'jpg';

    var pagebase = 'http://cors.archive.org/cors/' + this.identifier + '/' + this.identifier + '_jp2.zip/' + this.identifier + '_jp2%2F' + this.identifier + '_';

    if (!this.pages[pageid_left]) {
      var pageurl = pagebase + pageid_left + '.' + pageext;
      room.loadNewAsset('image', {
        id: pageurl,
        src: pageurl
      });
      this.pages[pageid_left] = pageurl;
    }
    if (!this.pages[pageid_right]) {
      var pageurl = pagebase + pageid_right + '.' + pageext;
      room.loadNewAsset('image', {
        id: pageurl,
        src: pageurl
      });
      this.pages[pageid_right] = pageurl;
    }
  },
  nextPage() {
    var page = Math.max(Math.min(this.currentpage + 2, this.numpages), 0);
    this.setPage(page);
  },
  previousPage() {
    var page = Math.max(Math.min(this.currentpage - 2, this.numpages), 0);
    this.setPage(page);
  },
  setPage(pagenum) {
    //if (this.parts['page_left']) {
      var newpage = Math.min(this.numpages-1, pagenum),
          pageid_left = ('000' + newpage).slice(-4),
          pageid_right = ('000' + (newpage+1)).slice(-4);

      this.currentpage = pagenum;

      this.fetchPage(pagenum);

console.log('ok do a thing', pagenum);

/*
      this.parts['page_left'].children[0].material.map = this.pages[pageid_left];
      this.parts['page_right'].children[0].material.map = this.pages[pageid_right];
      this.parts['page_left'].children[0].material.specular.setHex(0x060606);
      this.parts['page_right'].children[0].material.specular.setHex(0x060606);
      //this.parts['page_right'].children[0].material.specular = 0;
      console.log(this.parts['page_right'].children[0].material);
*/
      this.page_left.image_id = this.pages[pageid_left];
      this.page_right.image_id = this.pages[pageid_right];
      // Prefetch the next 4 pages (two page flips), to avoid delays
      this.fetchPage(pagenum + 2);
      this.fetchPage(pagenum + 4);
    //} else {
    //  elation.events.add(this, 'resource_load_finish', elation.bind(this, this.setPage, pagenum));
    //}
    //this.refresh();
  }

});
