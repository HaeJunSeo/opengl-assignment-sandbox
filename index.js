/**
 * Opengl Assignment sandbox
 * 
 * @author HaeJun Seo
 * @since March 26, 2019
 */

/* set global environment variables */
const env = {
  width: 150, height: 100,
  pixelSize: 5
};

let app, msgEl;
let coords, changed = false;

require([ // require js (import modules)
  'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js', // straight-forward function
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.6/pixi.min.js', // WebGL
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js' // functional programming
], (async, PIXI, _) => {
  async.waterfall([
    init,
    renderInit,
    render,
    setTickers
  ], err => {
    if (err) {
      throw err;
    }

    console.log('Initialized');

    window.addEventListener('hashchange', () => location.reload());
    app.view.addEventListener('pointermove', mouseMove);
  });

  function init (cb) {
    // disable antialias
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    app = new PIXI.Application({ // create canvas element
      width: env.width * env.pixelSize, height: env.height * env.pixelSize,
      backgroundColor: 0xffffff
    });

    document.body.appendChild(app.view); // append to the DOM

    cb();
  }

  function renderInit (cb) {
    /* draw grid */
    const g = new PIXI.Graphics();
    const { width, height, pixelSize } = env;

    g.lineStyle(1, 0x000000);

    // draw vartical line
    for (let i = 1; i < width; i++) {
      g.moveTo(i * pixelSize, 0);
      g.lineTo(i * pixelSize, height * pixelSize);
    }

    // draw horizontal line
    for (let i = 1; i < height; i++) {
      g.moveTo(0, i * pixelSize);
      g.lineTo(width * pixelSize, i * pixelSize);
    }

    // append stage
    app.stage.addChild(g);

    /* init coords array */
    coords = new Proxy(_.fill(Array(width * height), 0), {
      set (...args) {
        changed = true;
        return Reflect.set(...args);
      }
    });

    /* init msg element */
    msgEl = document.createElement('p');
    document.body.appendChild(msgEl);

    cb();
  }

  function render (cb) {
    // init input coord ([x1, y1, x2, y2])
    const hash = window.location.hash;
    // let coord = (hash === '') ? [10, 12, 4, 26] : _.map(hash.slice(1).split(','), _.toInteger);

    let coord = [10, 30, 19, 14];

    // solve path
    performance(solvePath_DDA, coord, coords);

    // solvePath_Bresenham(coord, coords);

    cb();
  }

  function setTickers (cb) {
    const g = new PIXI.Graphics();
    const { pixelSize } = env;

    app.stage.addChild(g); // append stage

    const renderDots = _.flowRight(
      _.spread(_.bind(g.drawRect, g)),
      _.curryRight(_.map, 2)(arg => arg * pixelSize)
    );
    const generate2dQuadrant = _.flowRight(setQuadrant, generate2D);

    app.ticker.add(() => { // callback called each frame
      if (changed === true) { // caching
        changed = false;

        g.clear();
        g.beginFill(0x000000);

        _.forEach(coords, (coord, ind) => {
          if (coord !== 0) {
            renderDots([
              ...generate2dQuadrant(ind), // generate quadrant coords (using 1d coord)
              1, 1
            ]);
          }
        });
      }
    });

    cb();
  }

  /* events */
  function mouseMove ({ offsetX, offsetY }) {
    const coord = _.map([offsetX / env.pixelSize, env.height - offsetY / env.pixelSize], _.toInteger);
    msgEl.innerText = `[${coord}]: ${coords[generate1D(coord)]}`;
  }

  /* tools */

  /**
   * 1D -> 2D
   * 
   * @param {Number} ind 
   */
  function generate2D (ind) {
    return [ind % env.width, _.parseInt(ind / env.width) + 1];
  }

  /**
   * 2D -> 1D
   * 
   * @param {[Number, Number]} param0 
   */
  function generate1D ([x, y]) {
    return x + y * env.width;
  }

  /**
   * Set quadrant coordinates (origin = [leftmost, bottommost])
   * 
   * @param {[Number, Number]} param0 
   */
  function setQuadrant ([x, y]) {
    return [x, env.height - y];
  }

  /**
   * calculuate run-time
   * 
   * @param cb target function
   * @param args arguments
   */
  function performance (cb, ...args) {
    const s = window.performance.now();
    cb(...args);
    console.log(`>> ${window.performance.now() - s}ms`);
  }

  /**
   * Solve path (DDA line drawing algorithm)
   * 
   * @param coord input coord
   * @param coords coords array
   */
  function solvePath_DDA (coord, coords) {
    // init constants
    const dx = coord[2] - coord[0], avDx = Math.abs(dx);
    const dy = coord[3] - coord[1], avDy = Math.abs(dy);

    const isXDominant = avDx >= avDy;

    let slope = dy / dx;
    let diff, addSlope = 0, sign;

    if (isXDominant) {
      diff = dx;
    } else {
      diff = dy;
      slope = 1 / slope; // reciprocal num.
    }

    sign = Math.sign(diff);

    for (let i = 0; Math.abs(i) <= Math.abs(diff); i += sign) {
      if (isXDominant) {
        coords[generate1D([
          coord[0] + i,
          coord[1] + Math.round(addSlope)
        ])] = 1;
      } else {
        coords[generate1D([
          coord[0] + Math.round(addSlope),
          coord[1] + i
        ])] = 1;
      }

      addSlope += Math.abs(slope);
    }
  }

  /**
   * Solve path (Bresenham line drawing algorithm)
   * 
   * @param coord input coord
   * @param coords coords array
   */
  function solvePath_Bresenham (coord, coords) {
    // define constants
    /*
    const dx = coord[2] - coord[0], dx2 = dx * 2;
    const dy = coord[3] - coord[1], dy2 = dy * 2;

    const isXDominant = solveIsXDominant(coord);
    const dist = solveDistance(coord);

    let prev = dy2 - dx;

    for (let i = 1; i <= dist; i++) {
      coords[generate1D([
        coord[0] + i,
        coord[1] + i
      ])] = 1;
    }
    */
  }
});
