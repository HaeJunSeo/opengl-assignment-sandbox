define(() => {
  const drawFunctions = { // return draw functions
    /**
     * draw line (DDA line drawing algorithm)
     * 
     */
    solvePath_DDA (coord) {
      const path = [];

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

      // calculate path loop
      for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
        if (isXDominant) {
          path.push([coord[0] + i, coord[1] + Math.round(addSlope)]);
        } else {
          path.push(coord[0] + Math.round(addSlope), coord[1] + i);
        }

        addSlope += slope * diffSign;
      }

      return path;
    },

    /**
     * draw line (Bresenham line drawing algorithm)
     * 
     */
    solvePath_Bresenham_line (coord) {
      const path = [];

      // init constants
      const dx = coord[2] - coord[0], adx = Math.abs(dx), dx2 = adx << 1;
      const dy = coord[3] - coord[1], ady = Math.abs(dy), dy2 = ady << 1;

      const isXDominant = adx > ady;
      const diff = isXDominant ? dx : dy;

      const diffSign = 1 | Math.sign(diff); // OR operator: avoid 'sign is 0' exception
      const slopeSign = 1 | (isXDominant ? Math.sign(dy) : Math.sign(dx));

      // calculate p_i (prev p)
      let prev = isXDominant ? dy2 - adx : dx2 - ady;

      // calculate path loop
      while (true) {
        path.push([coord[0], coord[1]]);

        if (isXDominant) {
          if (coord[0] === coord[2]) {
            break;
          }

          if (prev >= 0) { // calculate p_{i + 1} (new p)
            coord[1] += slopeSign;
            prev -= dx2;
          }

          coord[0] += diffSign;
          prev += dy2; // calculate p_{i + 1} (new p)
        } else {
          if (coord[1] === coord[3]) {
            break;
          }

          if (prev >= 0) {
            coord[0] += slopeSign;
            prev -= dy2;
          }

          coord[1] += diffSign;
          prev += dx2;
        }
      }

      return path;
    },

    /**
     * draw circle (using Bresenham algorithm)
     * 
     */
    solvePath_Bresenham_circle (coord) {
      const path = [];

      // calculate radius
      const dx = Math.abs(coord[0] - coord[2]), dy = Math.abs(coord[1] - coord[3]);
      const rad = _.toSafeInteger(_.min([dx, dy]) / 2);

      // set origin location
      const cx = coord[0] + rad * Math.sign(coord[2] - coord[0]),
        cy = coord[1] + rad * Math.sign(coord[3] - coord[1]);

      // circle plot function
      const plotting = ([x, y]) => {
        path.push([cx + x, cy + y]);
        path.push([cx - x, cy + y]);
        path.push([cx + x, cy - y]);
        path.push([cx - x, cy - y]);

        path.push([cx + y, cy + x]);
        path.push([cx + y, cy - x]);
        path.push([cx - y, cy + x]);
        path.push([cx - y, cy - x]);
      }

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

      console.log(path);

      return path;
    },

    /**
     * draw rectangle (using Bresenham algorithm)
     * 
     */
    solvePath_Bresenham_rectangle (coord) {
      let path = [];

      // calculate coords
      const coords = [
        [coord[0], coord[1], coord[0], coord[3]],
        [coord[0], coord[1], coord[2], coord[1]],
        [coord[0], coord[3], coord[2], coord[3]],
        [coord[2], coord[1], coord[2], coord[3]]
      ];

      for (coord of coords) {
        path = path.concat(drawFunctions.solvePath_Bresenham_line(coord));
      }

      return path;
    },

    /**
     * draw triangle (using Bresenham algorithm)
     * 
     */
    solvePath_Bresenham_triangle (coord) {
      const drawLine = drawFunctions.solvePath_Bresenham_line;

      let path = [];

      // calculate intersection point (ip)
      const ip = coord[0] + _.toSafeInteger((coord[2] - coord[0]) / 2);

      // draw
      path = path.concat(drawLine([coord[0], coord[1], coord[2], coord[1]]));
      path = path.concat(drawLine([coord[0], coord[1], ip, coord[3]]));
      path = path.concat(drawLine([coord[2], coord[1], ip, coord[3]]));

      return path;
    }
  };

  return drawFunctions;
})