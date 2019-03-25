const env = {
  width: 150, height: 100,
  pixelSize: 5
};

let app;

require([
  'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.6/pixi.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js'
], (async, PIXI, _) => {
  async.waterfall([
    init,
    renderGrid,
    render
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

  function renderGrid (cb) {
    //
    cb();
  }

  function render (cb) {
    cb();
  }
});
