require([
  'https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js'
], (async, _) => {
  async.waterfall([
    init
  ], err => {
    if (err) {
      throw err;
    }

    console.log('Initialized');
  });

  function init (cb) {
    //
    cb();
  }
});
