/**
 * global utils
 */

define([
  env.cdn['lodash']
], (_) => {
  const functions = {
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
      let ret = null;
      const s = window.performance.now();

      ret = cb(...args);

      console.log(`⏱ ${cb.name} >> ${window.performance.now() - s}ms`);

      return ret;
    },

    /**
     * Vector to Matrix
     * 
     * @param v vector or matrix
     */
    vec2Mat (v) {
      if (!_.isArray(v[0])) {
        v = [v];
      }

      return v;
    },

    /**
     * dot product
     * 
     * @param m1 vector or matrix
     * @param m2 vector or matrix
     * @return {[[...Number]]} 
     */
    dot (m1, m2) {
      m1 = functions.vec2Mat(m1);
      m2 = functions.transpose(functions.vec2Mat(m2));

      if (m1[0].length !== m2[0].length) {
        throw new Error('invalid operand');
      }

      return _.reduce(m1, (r, v1) =>
        r.concat([_.reduce(m2, (r, v2) =>
          r.concat([_.reduce(v1, (r, val, ind) =>
            r + val * v2[ind], 0)]), [])]), []);
    },

    /**
     * transpose of a matrix
     * 
     * @param {[[...Number]]} mat matrix
     */
    transpose (mat) {
      mat = functions.vec2Mat(mat);      
      const len = mat[0].length;

      return _.reduce(_.flatten(mat), (r, el, ind) => {
        r[ind % len].push(el);
        return r;
      }, _.map(_.range(len), () => []));
    }
  };

  return functions;
});
