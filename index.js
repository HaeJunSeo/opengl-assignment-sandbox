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
    let coord = _.map(location.hash.slice(1).split(','), _.toInteger);

    // coord = [2, 2, 17, 15]; // x dominant (0 < slope <= 1)
    // coord = [17, 15, 2, 2]; // x dominant (-1 <= slope < 0)
    // coord = [10, 10, 20, 30]; // y dominant (1 < slope)
    // coord = [20, 30, 10, 10]; // y dominant (slope < -1)

    // coord = [2, 2, 15, 15]; // slope = 1
    // coord = [15, 15, 2, 2]; // slope = -1

    // coord = [10, 10, 20, 10]; // x dominant (slope = 0+)
    // coord = [20, 10, 10, 10]; // x dominant (slope = 0-)
    // coord = [10, 10, 10, 20]; // y dominant (slope = 0+)
    // coord = [10, 20, 10, 10]; // y dominant (slope = 0-)

    // solve path
    const slope = (coord[3] - coord[1]) / (coord[2] - coord[0]);
    const isXDominant = 0 <= Math.abs(slope) && Math.abs(slope) < 1;

    const diff = isXDominant ? coord[2] - coord[0] : coord[3] - coord[1];
    const dist = Math.abs(diff);
    const sign = [Math.sign(coord[2] - coord[0]), Math.sign(coord[3] - coord[1])]; // Math.sign(diff);

    const dominantWeight = isXDominant? [1, 0] : [0, 1];

    for (let i = 0; i <= dist; i++) {
      // using closed form

      const k = _.round((isXDominant ? Math.abs(slope) : 1 / Math.abs(slope)) * i);

      coords[generate1D([
        coord[0] + (i * dominantWeight[0] + k * !dominantWeight[0]) * sign[0],
        coord[1] + (i * dominantWeight[1] + k * !dominantWeight[1]) * sign[1]
      ])] = 1;
    }

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
});
