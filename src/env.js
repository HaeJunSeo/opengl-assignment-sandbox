const env = {
  cdn: {
    'async': 'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js', // straight-forward function
    'pixijs': 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.6/pixi.min.js', // WebGL
    'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js', // functional programming
    'datGUI': 'https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.6/dat.gui.min.js', // GUI

    'utils': './src/utils.js'
  },

  width: 40, height: 40,
  pixelSize: 10,

  controller: {
    antialias: true,
    grid: true,
    line: false
  }
};
