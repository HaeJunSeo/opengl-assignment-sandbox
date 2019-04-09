define([
  env.cdn['utils']
], (utils) => {
  /* tools */

  const draw = (memory, x, y) => memory[utils.generate1D([x, y])] = 1;
  const drawToMemory = memory => _.curry(draw, 3)(memory);
  
  const swapInd = (arr, a, b) => {
    let tmp = arr[a];
    arr[a] = arr[b];
    arr[b] = tmp;
    return arr;
  };
  const correct = xs => [_.min(xs), _.max(xs)];

  const swapInd12 = _.curryRight(swapInd, 3)(1, 2);
  const correctedCoord = _.flowRight(
    swapInd12,
    _.flatten,
    _.curryRight(_.map, 2)(correct),
    _.curryRight(_.chunk, 2)(2),
    swapInd12
  );

  return { // return draw functions
    /**
     * draw line (DDA line drawing algorithm)
     * 
     */
    solvePath_DDA (coord, memory) {
      // init constants
      const dx = coord[2] - coord[0], adx = Math.abs(dx);
      const dy = coord[3] - coord[1], ady = Math.abs(dy);

      const isXDominant = adx >= ady;

      let slope = dy / dx, addSlope = 0;
      let diff;

      if (isXDominant) {
        diff = dx;
      } else {
        diff = dy;
        slope = 1 / slope; // reciprocal num.
      }

      let diffSign = 1 | Math.sign(diff);

      const drawing = drawToMemory(memory);

      // drawing path loop
      for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
        if (isXDominant) {
          drawing(coord[0] + i, coord[1] + Math.round(addSlope));
        } else {
          drawing(coord[0] + Math.round(addSlope), coord[1] + i);
        }

        addSlope += slope * diffSign;
      }
    },

    /**
     * draw line (Bresenham line drawing algorithm)
     * 
     */
    solvePath_Bresenham_line (coord, memory) {
      // init constants
      const dx = coord[2] - coord[0], adx = Math.abs(dx), dx2 = adx << 1;
      const dy = coord[3] - coord[1], ady = Math.abs(dy), dy2 = ady << 1;

      const isXDominant = adx > ady;
      const diff = isXDominant ? dx : dy;

      const diffSign = 1 | Math.sign(diff); // OR operator: avoid 'sign is 0' exception
      const slopeSign = 1 | (isXDominant ? Math.sign(dy) : Math.sign(dx));

      // calculate p_i (prev p)
      let prev = isXDominant ? dy2 - adx : dx2 - ady;

      // drawing path loop
      while (coord[0] !== coord[2] && coord[1] !== coord[3]) {
        draw(memory, coord[0], coord[1]);

        if (isXDominant) {
          if (prev >= 0) { // calculate p_{i + 1} (new p)
            coord[1] += slopeSign;
            prev -= dx2;
          }

          coord[0] += diffSign;
          prev += dy2; // calculate p_{i + 1} (new p)
        } else {
          if (prev >= 0) {
            coord[0] += slopeSign;
            prev -= dy2;
          }

          coord[1] += diffSign;
          prev += dx2;
        }
      }
    },

    /**
     * draw circle (using Bresenham algorithm)
     * 
     */
    solvePath_Bresenham_circle (coord, memory) {
      // init
      // coord = correctedCoord(coord);

      const drawing = drawToMemory(memory);

      // circle plot function
      const plotting = ([x, y]) => {
        drawing(coord[0] + x, coord[1] + y);
        drawing(coord[0] - x, coord[1] + y);
        drawing(coord[0] + x, coord[1] - y);
        drawing(coord[0] - x, coord[1] - y);

        drawing(coord[0] + y, coord[1] + x);
        drawing(coord[0] + y, coord[1] - x);
        drawing(coord[0] - y, coord[1] + x);
        drawing(coord[0] - y, coord[1] - x);
      }

      // calculate radius
      const dx = Math.abs(coord[0] - coord[2]), dy = Math.abs(coord[1] - coord[3]);
      const rad = _.toSafeInteger(_.min([dx, dy]) / 2);

      // set origin location
      coord[0] += rad;
      coord[1] += rad;

      // calculate p_0
      let prev = 5 / 4 - rad;

      // calculate path
      for (let x = 0, y = rad; x <= y; x++) {
        plotting([x, y]);

        if (prev < 0) {
          prev += 2 * x + 1;
        } else {
          y--;
          prev += 2 * (x - y) + 1;
        }
      }
    }
  }
})