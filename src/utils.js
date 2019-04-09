define([
  env.cdn['lodash']
], (_) => {
  return {
    /**
     * 1D -> 2D
     * 
     * @param {Number} ind 
     */
    generate2D (ind) {
      return [ind % env.width, _.parseInt(ind / env.width) + 1];
    },

    /**
     * 2D -> 1D
     * 
     * @param {[Number, Number]} param0 
     */
    generate1D ([x, y]) {
      return x + y * env.width;
    },

    /**
     * calculuate run-time
     * 
     * @param cb target function
     * @param args arguments
     */
    performance (cb, ...args) {
      const s = window.performance.now();
      cb(...args);

      console.log(`⏱ performance >> ${window.performance.now() - s}ms`);
    }
  }
});
