/**
 * Opengl Assignment sandbox
 * 
 * @author HaeJun Seo
 * @since April 2, 2019
 */

/* set global environment variables */
const env = {
  width: 100, height: 100,
  pixelSize: 5,

  controller: {
    antialias: true,
    grid: true,
    line: false
  }
};

let app, coordMsgEl, performanceMsgEl;
let gui;

let coords, changed = false;

require([ // require js (import modules)
  'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js', // straight-forward function
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.6/pixi.min.js', // WebGL
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js', // functional programming
  'https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.6/dat.gui.min.js' // GUI
], (async, PIXI, _, dat) => {
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
    /* webgl module init */

    // disable antialias
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    // skip init message
    PIXI.utils.skipHello();

    app = new PIXI.Application({ // create canvas element
      width: env.width * env.pixelSize, height: env.height * env.pixelSize,
      backgroundColor: 0xffffff
    });

    document.body.appendChild(app.view); // append to the DOM

    /* GUI module init */
    gui = new dat.GUI();

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

    // add to the GUI panel
    gui.add(env.controller, 'grid').onChange(b => g.visible = b);

    /* init coords array */
    coords = new Proxy(_.fill(Array(width * height), 0), {
      set (...args) {
        changed = true;
        return Reflect.set(...args);
      }
    });

    /* init msg elements */
    performanceMsgEl = document.createElement('p');
    document.body.appendChild(performanceMsgEl);

    coordMsgEl = document.createElement('p');
    document.body.appendChild(coordMsgEl);

    cb();
  }

  function render (cb) {
    // init input coord ([x1, y1, x2, y2])
    const hash = window.location.hash;
    let coord = (hash === '') ? [10, 12, 4, 26] : _.map(hash.slice(1).split(','), _.toInteger);

    // draw line
    const line = new PIXI.Graphics();
    line.lineStyle(2, 0xff0000);
    line.moveTo((coord[0] + 0.5) * env.pixelSize, (env.height - coord[1] - 0.5) * env.pixelSize);
    line.lineTo((coord[2] + 0.5) * env.pixelSize, (env.height - coord[3] - 0.5) * env.pixelSize);
    line.visible = false;

    // add to the GUI panel
    gui.add(env.controller, 'line').onChange(b => line.visible = b);

    // set title
    document.title = `[${coord}]`;

    // solve path
    // performance(solvePath_DDA, coord);
    // performance(solvePath_Bresenham, coord);
    solvePath_BresenhamWithAntialias(coord);

    cb(null, line);
  }

  function setTickers (line, cb) {
    /* draw pixel */
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

        _.forEach(coords, (coord, ind) => {
          if (coord !== 0) {
            g.beginFill(0xffffff - 0x111111 * _.toSafeInteger(coord * 15));

            renderDots([
              ...generate2dQuadrant(ind), // generate quadrant coords (using 1d coord)
              1, 1
            ]);
          }
        });
      }
    });

    // add
    app.stage.addChild(line);

    cb();
  }

  /* events */
  function mouseMove ({ offsetX, offsetY }) {
    const coord = _.map([offsetX / env.pixelSize, env.height - offsetY / env.pixelSize], _.toInteger);
    coordMsgEl.innerText = `[${coord}]: ${coords[generate1D(coord)]}`;
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

    performanceMsgEl.innerText = `>> ${window.performance.now() - s}ms`;
  }

  /**
   * draw path (DDA line drawing algorithm)
   * 
   * @param coord input coord
   */
  function solvePath_DDA (coord) {
    // init constants
    const dx = coord[2] - coord[0], adx = Math.abs(dx);
    const dy = coord[3] - coord[1], ady = Math.abs(dy);

    const isXDominant = adx >= ady;

    let slope = dy / dx, addSlope = 0;
    let diff;

    if (isXDominant) {
      diff = dx;
    } else {
      diff = dy;
      slope = 1 / slope; // reciprocal num.
    }

    let diffSign = 1 | Math.sign(diff);

    // drawing path loop
    for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
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

      addSlope += slope * diffSign;
    }
  }

  /**
   * draw path (Bresenham line drawing algorithm)
   * 
   * @param coord input coord
   */
  function solvePath_Bresenham (coord) {
    // init constants
    const dx = coord[2] - coord[0], adx = Math.abs(dx), dx2 = adx << 1;
    const dy = coord[3] - coord[1], ady = Math.abs(dy), dy2 = ady << 1;

    const isXDominant = adx > ady;
    const diff = isXDominant ? dx : dy;

    const diffSign = 1 | Math.sign(diff); // OR operator: avoid 'sign is 0' exception
    const slopeSign = 1 | (isXDominant ? Math.sign(dy) : Math.sign(dx));

    // calculate p_i (prev p)
    let prev = isXDominant ? dy2 - adx : dx2 - ady;

    // drawing path loop
    for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
      coords[generate1D([ // draw
        coord[0] + i * isXDominant,
        coord[1] + i * !isXDominant
      ])] = 1;

      if (isXDominant) {
        if (prev >= 0) { // calculate p_{i + 1} (new p)
          coord[1] += slopeSign;
          prev -= dx2;
        }

        prev += dy2; // calculate p_{i + 1} (new p)
      } else {
        if (prev >= 0) {
          coord[0] += slopeSign;
          prev -= dy2;
        }

        prev += dx2;
      }
    }
  }

  function solvePath_BresenhamWithAntialias (coord) {
    const dx = Math.abs(coord[0] - coord[2]), sx = coord[0] < coord[2] ? 1 : -1;
    const dy = Math.abs(coord[1] - coord[3]), sy = coord[1] < coord[3] ? 1 : -1;

    let err = dx - dy, e2, x2;
    let ed = dx + dy == 0 ? 1 : Math.sqrt(dx * dx + dy * dy);

    while (true) {
      coords[generate1D([
        coord[0],
        coord[1]
      ])] = 1 - Math.abs(err - dx + dy) / ed;

      e2 = err;
      x2 = coord[0];

      if (2 * e2 >= -dx) {
        if (coord[0] === coord[2]) {
          break;
        }

        if (e2 + dy < ed) {
          coords[generate1D([
            coord[0],
            coord[1] + sy
          ])] = 1 - (e2 + dy) / ed;
        }

        err -= dy;
        coord[0] += sx;
      }

      if (2 * e2 <= dy) {
        if (coord[1] === coord[3]) {
          break;
        }

        if (dx - e2 < ed) {
          coords[generate1D([
            x2 + sx,
            coord[1]
          ])] = 1 - (dx - e2) / ed;
        }

        err += dx;
        coord[1] += sy;
      }
    }
  }
});
