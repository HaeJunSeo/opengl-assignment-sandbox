/**
 * Opengl Assignment sandbox
 * 
 * @author HaeJun Seo
 * @since April 2, 2019
 */

/* set global variables */
let app, coordMsgEl;
let gui;

let coords, changed = false;

require([ // require js (import modules)
  env.cdn['async'],
  env.cdn['pixijs'],
  env.cdn['lodash'],
  env.cdn['datGUI'],

  env.cdn['utils'],
  env.cdn['draws']
], (async, PIXI, _, dat, utils, draws) => {
  async.waterfall([
    init,
    renderInit,
    render,
    setTickers
  ], err => {
    if (err) {
      throw err;
    }

    console.log('Initialized!');

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
    line.lineStyle(1, 0xff0000);
    line.moveTo((coord[0] + 0.5) * env.pixelSize, (env.height - coord[1] - 0.5) * env.pixelSize);
    line.lineTo((coord[2] + 0.5) * env.pixelSize, (env.height - coord[3] - 0.5) * env.pixelSize);
    line.visible = false;

    // add to the GUI panel
    gui.add(env.controller, 'line').onChange(b => line.visible = b);

    // set title
    document.title = `[${coord}]`;

    // solve path
    // utils.performance(draws.solvePath_DDA, coord, coords);
    utils.performance(draws.solvePath_Bresenham, coord, coords);

    cb(null, line);
  }

  function setTickers (line, cb) {
    /* draw pixel */
    const g = new PIXI.Graphics();
    const { pixelSize } = env;

    app.stage.addChild(g); // append stage

    // tools
    const renderDots = _.flowRight(
      _.spread(_.bind(g.drawRect, g)), // draw pixel
      _.curryRight(_.map, 2)(arg => arg * pixelSize) // mapping factor
    );

    const generate2dQuadrant = _.flowRight(
      ([x, y]) => [x, env.height - y], // set quadrant coordinates (origin: [leftmost, bottommost])
      utils.generate2D
    );

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
    coordMsgEl.innerText = `[${coord}]: ${coords[utils.generate1D(coord)]}`;
  }
});
