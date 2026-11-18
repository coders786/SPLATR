import { arc, cube, cutFigure, foe, line, poly, shearInk, trace } from './art.js';
import { INK, TAU, TYPES } from './shapes.js';

// Freeze one tactical instant per entry. A universal specimen reticle made a
// harmless Fork look like a charging Pulse. Dashes are intent, solid marks
// are actions, acid is the player: the same key as the live field.
export function drawSpecimen(canvas, k) {
  const c = canvas.getContext('2d'),
    col = TYPES[k].color;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(156, 83);
  function ray(x, y, angle, len) {
    c.save();
    c.setLineDash([5, 6]);
    line(c, col, 2, x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    c.restore();
  }
  if (k === 'fang') {
    ray(-46, 7, -0.1, 176);
    foe(c, k, -66, 10, 43, -0.1);
    shearInk(c, 26, 55, -1.24, 108, 9);
    cube(c, 43, 4, 16, -0.26);
  } else if (k === 'pulse') {
    arc(c, col, 4, -30, 5, 60);
    foe(c, k, -30, 5, 32);
    shearInk(c, 8, 2, -0.16, 76, 9);
    cube(c, 50, -5, 14, -0.12);
  } else if (k === 'prism') {
    foe(c, k, -72, 8, 34, 0);
    ray(-37, 6, -0.1, 143);
    cutFigure(c, k, 73, -6, 33, 0, -1.18, 7);
    shearInk(c, 59, 29, -1.18, 80, 8);
  } else if (k === 'fork') {
    cutFigure(c, k, -53, 0, 43, 0.12, 0.06, 7);
    ray(-8, -6, -0.38, 67);
    ray(-8, 6, 0.38, 67);
    foe(c, 'fang', 77, -36, 22, 2.7);
    foe(c, 'fang', 77, 36, 22, -2.7);
  } else if (k === 'bastion') {
    cutFigure(c, 'fang', -99, 8, 24, 3, 0, 5);
    cutFigure(c, 'prism', -36, 5, 27, 0, 0, 6);
    cutFigure(c, k, 59, 2, 46, 0, -0.04, 8, { torn: true });
    shearInk(c, -39, 4, -0.04, 165, 10);
  } else if (k === 'rift') {
    ray(-56, 16, -0.2, 143);
    foe(c, k, -66, 18, 38, 0.16);
    c.save();
    c.translate(65, -9);
    c.scale(47, 47);
    c.strokeStyle = col;
    c.lineWidth = 0.04;
    c.beginPath();
    trace(c, TYPES.rift.outline);
    c.stroke();
    c.restore();
    cube(c, 88, -38, 13, -0.3);
  } else if (k === 'well') {
    for (let j = 0; j < 3; j++) {
      const a = (j * TAU) / 3 + 0.28;
      arc(c, col, 2, -13, 3, 65, a, a + 0.73);
      c.save();
      c.translate(-13, 3);
      c.rotate(a + 0.36);
      poly(c, col, [
        [37, 0],
        [47, -4],
        [44, 0],
        [47, 4],
      ]);
      c.restore();
    }
    foe(c, k, -13, 3, 30);
    shearInk(c, 45, 9, -0.3, 65, 9);
    cube(c, 84, -3, 14, 0.15);
  } else {
    for (let j = 0; j < 10; j++) {
      const a = (j * TAU) / 10 - 0.15;
      ray(44 * Math.cos(a), 44 * Math.sin(a), a, 32);
    }
    foe(c, 'crown', 0, 0, 39);
  }
  c.restore();
}
