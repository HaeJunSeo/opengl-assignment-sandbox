/**
 * Opengl Assignment sandbox
 * 
 * @author HaeJun Seo
 * @since April 2, 2019
 */

/* set global variables */
let app, coordMsgEl;
let gui;

let coords = [0, 0, 0, 0], isDragging = false, drawFunction, guide;

let memory, memoryChanged = false;

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
    setTickers
  ], err => {
    if (err) {
      throw err;
    }

    console.log('Initialized!');

    // add events

    _.forEach([
      ['pointermove', mouseMove],
      ['pointerdown', mouseDown],
      ['pointerup', mouseUp]
    ], _.spread(_.bind(app.view.addEventListener, app.view)));
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

    /* init memory array */
    memory = new Proxy(_.fill(Array(width * height), 0), {
      set (...args) {
        memoryChanged = true;
        return Reflect.set(...args);
      }
    });

    /* init msg elements */

    coordMsgEl = document.createElement('p');
    coordMsgEl.innerText = `[0, 0]: ${memory[utils.generate1D([0, 0])]}`;
    document.body.appendChild(coordMsgEl);

    /* init draw function and guide */

    drawFunction = draws.solvePath_Bresenham_line;

    guide = new PIXI.Graphics(); // draw guide
    app.stage.addChild(guide);

    cb();
  }

  function setTickers (cb) {
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
      toQuadrantCoords,
      utils.generate2D
    );

    app.ticker.add(() => { // callback called each frame
      if (memoryChanged === true) { // caching
        memoryChanged = false;

        g.clear();

        _.forEach(memory, (intensity, ind) => {
          if (intensity !== 0) {
            g.beginFill(0xffffff - 0x111111 * _.toSafeInteger(intensity * 15));

            renderDots([
              ...generate2dQuadrant(ind), // generate quadrant memory (using 1d quadrant coords)
              1, 1
            ]);
          }
        });
      }
    });

    cb();
  }

  /* tools */

  /**
   * convert mouse offset to coord functor
   * 
   * @param {[Number, Number]} offset
   */
  function offsetToCoord ([offsetX, offsetY]) {
    return _.map([offsetX / env.pixelSize, env.height - offsetY / env.pixelSize], _.toInteger);
  }

  /**
   * convert coordinates to quadrant coordinates (origin: [leftmost, bottommost])
   * 
   * @param {[Number, Number]} coords
   */
  function toQuadrantCoords ([x, y]) {
    return [x, env.height - y];
  }

  /* event handlers */

  function mouseMove ({ offsetX, offsetY }) {
    const o2c = offsetToCoord([offsetX, offsetY]);
    coordMsgEl.innerText = `[${o2c}]: ${memory[utils.generate1D(o2c)]}`;

    if (isDragging === true) {
      guide.clear();
      guide.lineStyle(2, 0xff0000);

      const o2c = offsetToCoord([offsetX, offsetY]);
  
      coords[2] = o2c[0];
      coords[3] = o2c[1];

      // guide.moveTo(toQuadrantCoords)

      guide.moveTo(coords[0] * env.pixelSize, (env.height - coords[1]) * env.pixelSize);
      guide.lineTo(coords[2] * env.pixelSize, (env.height - coords[3]) * env.pixelSize);
    }
  }

  function mouseDown ({ offsetX, offsetY}) {
    const o2c = offsetToCoord([offsetX, offsetY]);

    coords[0] = o2c[0];
    coords[1] = o2c[1];

    isDragging = true;
  }

  function mouseUp ({ offsetX, offsetY }) {
    const o2c = offsetToCoord([offsetX, offsetY]);
    
    isDragging = false;
    
    guide.clear();

    coords[2] = o2c[0];
    coords[3] = o2c[1];

    drawFunction(coords, memory);
  }
});
