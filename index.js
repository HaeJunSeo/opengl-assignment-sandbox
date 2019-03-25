const env = {
  width: 150, height: 100,
  pixelSize: 5
};

let app, coords, changed = false;

require([
  'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.6/pixi.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js'
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
  });

  function init (cb) {
    // disable antialias
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    app = new PIXI.Application({
      width: env.width * env.pixelSize, height: env.height * env.pixelSize,
      backgroundColor: 0xffffff
    });

    document.body.appendChild(app.view);

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

    cb();
  }

  function render (cb) {
    coords[generate1D([0, 0])] = 1;

    cb();
  }

  function setTickers (cb) {
    const g = new PIXI.Graphics();
    const { pixelSize } = env;

    app.stage.addChild(g); // append stage

    app.ticker.add(() => { // callback called each frame
      if (changed === true) { // caching
        changed = false;

        g.clear();
        g.beginFill(0x000000);

        _.forEach(coords, (coord, ind) => {
          if (coord !== 0) {
            _.flowRight( // render dots
              _.spread(_.bind(g.drawRect, g)),
              _.curryRight(_.map, 2)(arg => arg * pixelSize)
            )([
              ..._.flowRight( // generate 2d coords
                setQuadrant,
                generate2D
              )(ind),
              1, 1
            ]);
          }
        });
      }
    });

    cb();
  }

  /* tools */

  function generate2D (ind) {
    // 1d -> 2d
    return [ind % env.width, _.parseInt(ind / env.width) + 1];
  }

  function generate1D ([x, y]) {
    // 2d -> 1d
    return x + y * env.width;
  }

  function setQuadrant ([x, y]) {
    return [x, env.height - y];
  }
});
