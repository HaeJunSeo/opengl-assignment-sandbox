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
let buffer, bufferChanged = false;

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
      drawFunctionName: 'solvePath_Bresenham_line',
      drawFunctions: {
        'line': 'solvePath_Bresenham_line',
        'circle': 'solvePath_Bresenham_circle',
        'rectangle': 'solvePath_Bresenham_rectangle',
        'triangle': 'solvePath_Bresenham_triangle'
      },

      // clear buffer
      clear () {
        // re-init buffer array
        buffer = new Proxy(_.fill(Array(env.width * env.height), 0), {
          set (...args) {
            bufferChanged = true;
            return Reflect.set(...args);
          }
        });

        bufferChanged = true;
      },

      // transformation
      target: null,
      translation: {
        x: 0, y: 0
      },
      scaling: {
        x: 0, y: 0
      },
      rotation: 0 // theta
    };

    const getTransformMatrix = () => (({
      translation: { x: tx, y: ty },
      scaling: { x: sx, y: sy },
      rotation: t
    }) => [
      [1, 0, 0],
      [0, 1, 0],
      [tx, ty, 1]
    ])(controller);
    
    const conv3D = _.flowRight(
      _.partial(_.forEach, _, data => data.push(1)),
      _.partial(_.chunk, _, 2)
    );

    const changeCB = () => {
      // clear buffer
      controller.clear();

      _.flowRight(
        appendToBuffer,
        draws[controller.drawFunctionName],
        _.flatten,
        _.partial(_.map, _, _.initial),
        _.partial(utils.dot, _, getTransformMatrix()),
        conv3D
      )(coords);
    };

    const transformFolder = gui.addFolder('transformation');
    transformFolder.add(controller.translation, 'x', -100, 100, 1).onChange(changeCB).name('translation x');
    transformFolder.add(controller.translation, 'y', -100, 100, 1).onChange(changeCB).name('translation y');
    transformFolder.add(controller.scaling, 'x', -100, 100, 1).onChange(changeCB).name('scaling x');
    transformFolder.add(controller.scaling, 'y', -100, 100, 1).onChange(changeCB).name('scaling y');
    transformFolder.add(controller, 'rotation', -100, 100, 1).onChange(changeCB).name('rotation theta');

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

    /* init buffer array */

    buffer = new Proxy(_.fill(Array(width * height), 0), {
      set (...args) {
        bufferChanged = true;
        return Reflect.set(...args);
      }
    });

    /* init msg elements */

    msgEl = document.createElement('p');
    msgEl.innerText = `[0, 0]: ${buffer[utils.generate1D([0, 0])]}`;
    document.body.appendChild(msgEl);

    /* init draw function and darw-guide */

    // add draw actions
    gui.add(controller, 'drawFunctionName', controller.drawFunctions)
      .onChange(name => controller.drawFunction = draws[name])
      .name('draw');

    gui.add(controller, 'clear').name('clear');

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
      _.partial(_.map, _, arg => arg * pixelSize) // mapping factor
    );

    const generate2dQuadrant = _.flowRight(
      inverseHeight,
      utils.generate2D
    );

    app.ticker.add(() => { // callback called each frame
      if (bufferChanged === true) { // caching
        bufferChanged = false;

        g.clear();

        _.forEach(buffer, (intensity, ind) => {
          if (intensity !== 0) {
            g.beginFill(0xffffff - 0x111111 * _.toSafeInteger(intensity * 15));

            renderDots([
              ...generate2dQuadrant(ind), // generate quadrant buffer (using 1d quadrant coords)
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

  /**
   * append to buffer
   * 
   * @param {[[Number, Number]]} coords coordinates
   */
  function appendToBuffer (coords) {
    _.forEach(coords, coord => {
      buffer[utils.generate1D(coord)] = 1;
    });
  }

  /* event handlers */

  function mouseMove ({ offsetX, offsetY }) {
    const o2c = offsetToCoord([offsetX, offsetY]);
    msgEl.innerText = `[${o2c}]: ${buffer[utils.generate1D(o2c)]}`;

    if (isDragging === true) {
      // render draw guide
      guide.clear();
      guide.lineStyle(2, 0xff0000);

      const o2c = offsetToCoord([offsetX, offsetY]);
  
      coords[2] = o2c[0];
      coords[3] = o2c[1];

      _.flowRight(
        ([x1, y1, x2, y2]) => guide.drawRect(x1, y1, x2 - x1, y2 - y1),
        _.partial(_.map, _, c => c * env.pixelSize),
        _.flatten,
        _.partial(_.map, _, inverseHeight), // for webgl library (pixi js)
        _.partial(_.chunk, _, 2)
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
  
      // draw shape
      appendToBuffer(utils.performance(controller.drawFunction, _.cloneDeep(coords)));

      // re-init
      _.forEach(gui.__folders['transformation'].__controllers, c => c.setValue(0));
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
