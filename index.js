/**
 * Opengl Assignment sandbox
 * 
 * @author HaeJun Seo
 * @since April 2, 2019
 */

/* set global variables */
let app, msgEl;
let gui, controller;

let coords = [0, 0, 0, 0], isDragging = false, guide;

let memory, memoryChanged = false, originMemory;

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
      ['pointerup', mouseUp],
      ['pointerout', mouseOut]
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

    controller = {
      grid: true,

      drawFunction: draws['solvePath_Bresenham_line'],
      drawFunctionName: 'line',
      drawFunctions: {
        'line': 'solvePath_Bresenham_line',
        'circle': 'solvePath_Bresenham_circle',
        'rectangle': 'solvePath_Bresenham_rectangle'
      },

      clear () {
        // re-init memory array
        memory = new Proxy(_.fill(Array(env.width * env.height), 0), {
          set (...args) {
            memoryChanged = true;
            return Reflect.set(...args);
          }
        });

        memoryChanged = true;
      }
    };

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
    gui.add(controller, 'grid').onChange(b => g.visible = b);

    /* init memory array */

    memory = new Proxy(_.fill(Array(width * height), 0), {
      set (...args) {
        memoryChanged = true;
        return Reflect.set(...args);
      }
    });

    /* init msg elements */

    msgEl = document.createElement('p');
    msgEl.innerText = `[0, 0]: ${memory[utils.generate1D([0, 0])]}`;
    document.body.appendChild(msgEl);

    /* init draw function and darw-guide */

    // add draw actions
    gui.add(controller, 'drawFunctionName', controller.drawFunctions)
      .onChange(name => controller.drawFunction = draws[name])
      .name('draw');

    gui.add(controller, 'clear');

    // darw-guide
    guide = new PIXI.Graphics();
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
      inverseHeight,
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
   * it's a functor that convert mouse offset field to coordinates field
   * 
   * @param {[Number, Number]} offset
   */
  function offsetToCoord ([offsetX, offsetY]) {
    return _.map([offsetX / env.pixelSize, env.height - offsetY / env.pixelSize], _.toInteger);
  }

  /**
   * inverse height
   * 
   * @param {[Number, Number]} coords
   */
  function inverseHeight ([x, y]) {
    return [x, env.height - y];
  }

  /* event handlers */

  function mouseMove ({ offsetX, offsetY }) {
    const o2c = offsetToCoord([offsetX, offsetY]);
    msgEl.innerText = `[${o2c}]: ${memory[utils.generate1D(o2c)]}`;

    if (isDragging === true) {
      // render draw guide
      guide.clear();
      guide.lineStyle(2, 0xff0000);

      const o2c = offsetToCoord([offsetX, offsetY]);
  
      coords[2] = o2c[0];
      coords[3] = o2c[1];

      _.flowRight(
        ([x1, y1, x2, y2]) => guide.drawRect(x1, y1, x2 - x1, y2 - y1),
        _.curryRight(_.map, 2)(c => c * env.pixelSize),
        _.flatten,
        _.curryRight(_.map, 2)(inverseHeight), // for pixijs
        _.curryRight(_.chunk, 2)(2)
      )(coords);
    }
  }

  function mouseDown ({ offsetX, offsetY}) {
    // set x1, y1
    const o2c = offsetToCoord([offsetX, offsetY]);

    coords[0] = o2c[0];
    coords[1] = o2c[1];

    isDragging = true;
  }

  function mouseUp ({ offsetX, offsetY }) {
    // set x2, y2
    if (isDragging === true) {
      const o2c = offsetToCoord([offsetX, offsetY]);
      
      isDragging = false;
      
      guide.clear(); // clear draw guide
  
      coords[2] = o2c[0];
      coords[3] = o2c[1];
  
      utils.performance(controller.drawFunction, coords, memory);
    }
  }

  function mouseOut () {
    // abort
    if (isDragging === true) {
      guide.clear();
      isDragging = false;
  
      console.warn('mouse is out');
    }
  }
});
