define([
  env.cdn['utils']
], (utils) => {
  return {
    /**
     * draw path (DDA line drawing algorithm)
     * 
     * @param coord input coord
     */
    solvePath_DDA (coord, coords) {
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

      // drawing path loop
      for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
        if (isXDominant) {
          coords[utils.generate1D([
            coord[0] + i,
            coord[1] + Math.round(addSlope)
          ])] = 1;
        } else {
          coords[utils.generate1D([
            coord[0] + Math.round(addSlope),
            coord[1] + i
          ])] = 1;
        }

        addSlope += slope * diffSign;
      }
    },

    /**
     * draw path (Bresenham line drawing algorithm)
     * 
     * @param coord input coord
     */
    solvePath_Bresenham (coord, coords) {
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
      for (let i = 0; i * diffSign <= diff * diffSign; i += diffSign) {
        coords[utils.generate1D([ // draw
          coord[0] + i * isXDominant,
          coord[1] + i * !isXDominant
        ])] = 1;

        if (isXDominant) {
          if (prev >= 0) { // calculate p_{i + 1} (new p)
            coord[1] += slopeSign;
            prev -= dx2;
          }

          prev += dy2; // calculate p_{i + 1} (new p)
        } else {
          if (prev >= 0) {
            coord[0] += slopeSign;
            prev -= dy2;
          }

          prev += dx2;
        }
      }
    }
  }
})