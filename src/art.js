import { INK, TYPES, TAU, CUBE, bisect } from './shapes.js';
export function trace(c, p) {
  c.moveTo(...p[0]);
  for (let i = 1; i < p.length; i++) c.lineTo(...p[i]);
  c.closePath();
}
export function poly(c, color, p, edge = null, width = 0.07) {
  c.fillStyle = color;
  c.beginPath();
  trace(c, p);
  c.fill();
  if (edge) {
    c.lineWidth = width;
    c.strokeStyle = edge;
    c.stroke();
  }
}
export function line(c, color, width, ...coords) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) c.lineTo(coords[i], coords[i + 1]);
  c.stroke();
}
export function arc(c, color, width, x, y, r, a = 0, b = TAU) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.arc(x, y, r, a, b);
  c.stroke();
}
export function disk(c, color, x, y, r) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}
const K = INK.black,
  W = INK.paper,
  L = INK.acid;
// One screen-printed character, from the enormous title frame down to a
// thumb-sized combatant. Scarf tails and eye cuts identify the direction.
export function cube(c, x, y, r, angle = 0, flutter = 0, face = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r * face, r);
  c.lineJoin = 'miter';
  const wave = Math.sin(flutter * 0.09) * 0.13;
  poly(
    c,
    L,
    [
      [-0.79, -0.63],
      [-1.18, -0.83],
      [-1.66, -0.71 + wave],
      [-2.18, -0.93 + wave],
      [-1.72, -0.39 + wave],
      [-1.33, -0.33],
      [-0.82, -0.42],
    ],
    K,
    0.07,
  );
  poly(
    c,
    '#aabe39',
    [
      [-0.86, -0.5],
      [-1.26, -0.29],
      [-1.68, 0.04 - wave],
      [-1.97, 0.1 - wave],
      [-1.75, 0.3 - wave],
      [-1.32, 0.17],
      [-0.79, -0.2],
    ],
    K,
    0.06,
  );
  poly(
    c,
    W,
    [
      [-1, -1],
      [0.9, -1],
      [1, -0.9],
      [1, 1],
      [-0.93, 1],
      [-1, 0.91],
    ],
    K,
    0.105,
  );
  poly(c, L, [
    [-0.97, -0.79],
    [0.98, -0.69],
    [0.98, -0.5],
    [-0.97, -0.52],
  ]);
  poly(c, K, [
    [-1, -0.53],
    [1, -0.42],
    [1, 0.15],
    [0.59, 0.28],
    [-0.83, 0.09],
    [-1, -0.03],
  ]);
  poly(c, L, [
    [-0.56, -0.31],
    [0.1, -0.12],
    [0.05, 0.03],
    [-0.54, -0.05],
  ]);
  poly(c, L, [
    [0.36, -0.1],
    [0.86, -0.29],
    [0.79, 0.03],
    [0.38, 0.055],
  ]);
  poly(c, K, [
    [-0.91, 0.63],
    [-0.52, 0.7],
    [-0.66, 0.81],
    [-0.91, 0.77],
  ]);
  line(c, K, 0.055, 0.44, 0.54, 0.75, 0.52);
  c.restore();
}
// Tangential marks echo a class's ability instead of giving every polygon a
// generic face: scope, oscillator, split seam, plate, blink star, or vortex.
export function foe(c, kind, x, y, r, angle = 0, opts = {}) {
  const t = TYPES[kind],
    col = opts.flash ? W : t.color,
    time = opts.time || 0;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r, r);
  c.lineJoin = 'round';
  if (opts.paper) {
    // A folded pennant has no eye. Live triangles do. The crease and print
    // carry across both scraps when the player cuts one off the rail.
    poly(c, '#ffaf82', t.outline, K, 0.1);
    poly(c, '#ee795f', [
      [1, 0],
      [-0.5, 0.866],
      [-0.15, 0.12],
    ]);
    poly(c, '#ffe4bc', [
      [-0.5, -0.86],
      [-0.5, -0.53],
      [0.74, -0.02],
    ]);
    for (let i = 0; i < 3; i++)
      line(
        c,
        '#924b49',
        0.043,
        -0.31 + i * 0.27,
        -0.21 + i * 0.068,
        -0.16 + i * 0.27,
        -0.17 + i * 0.068,
      );
    disk(c, K, -0.33, 0.12, 0.092);
    disk(c, '#f4cf94', -0.346, 0.09, 0.035);
    c.restore();
    return;
  }
  poly(c, col, t.outline, K, 0.115);
  switch (kind) {
    case 'fang':
      poly(c, K, [
        [-0.43, -0.56],
        [0.71, -0.02],
        [-0.38, 0.26],
        [-0.13, 0.018],
      ]);
      poly(c, W, [
        [-0.23, -0.31],
        [0.22, -0.06],
        [-0.24, -0.09],
      ]);
      line(c, K, 0.065, -0.34, 0.49, -0.18, 0.42);
      break;
    case 'pulse':
      disk(c, K, 0, 0, 0.68);
      arc(c, col, 0.075, 0, 0, 0.46, -2.78, 1.65);
      disk(c, col, 0, 0, 0.185);
      for (let i = 0; i < 3; i++) {
        c.rotate(TAU / 3);
        line(c, K, 0.095, 0, -0.96, 0, -0.77);
      }
      break;
    case 'prism':
      poly(c, K, [
        [0, -0.79],
        [0.5, 0],
        [0, 0.63],
        [-0.52, 0],
      ]);
      poly(c, col, [
        [0, -0.4],
        [0.21, 0],
        [0, 0.32],
        [-0.22, 0],
      ]);
      line(c, K, 0.07, -0.35, 0.5, -0.05, 0.8);
      break;
    case 'fork':
      poly(c, K, [
        [-0.24, -0.59],
        [0.04, -0.27],
        [-0.1, -0.02],
        [0.23, 0.24],
        [0.06, 0.7],
        [-0.05, 0.29],
        [-0.31, 0.1],
        [-0.1, -0.24],
      ]);
      line(c, K, 0.105, -0.81, -0.12, -0.49, -0.12);
      line(c, K, 0.105, 0.49, 0.12, 0.81, 0.12);
      break;
    case 'bastion':
    case 'crown': {
      const plates = opts.hp ?? t.hp;
      poly(c, K, [
        [-0.8, -0.21],
        [-0.36, -0.45],
        [0.27, -0.31],
        [0.72, -0.49],
        [0.82, -0.08],
        [0.34, 0.2],
        [-0.27, 0.29],
        [-0.74, 0.12],
      ]);
      poly(c, W, [
        [-0.6, -0.16],
        [-0.11, -0.055],
        [-0.16, 0.07],
        [-0.44, 0.04],
      ]);
      poly(c, W, [
        [0.12, -0.1],
        [0.58, -0.28],
        [0.49, -0.04],
        [0.18, 0.04],
      ]);
      if (plates > 1) {
        line(c, K, 0.085, -0.55, 0.37, 0.09, 0.47, 0.58, 0.28);
        line(c, K, 0.075, -0.36, 0.56, 0.12, 0.65, 0.42, 0.52);
        poly(c, K, [
          [-0.43, -0.59],
          [-0.34, -0.73],
          [0.42, -0.62],
          [0.26, -0.51],
        ]);
      }
      if (plates < t.hp) {
        // The fault remembers which way the blade ACTUALLY crossed the shell.
        c.save();
        c.beginPath();
        trace(c, t.outline);
        c.clip();
        c.rotate(opts.fault ?? -1.42);
        poly(c, K, [
          [-1.2, -0.08],
          [-0.46, -0.07],
          [-0.24, 0.045],
          [0.02, -0.06],
          [0.28, 0.03],
          [1.2, -0.14],
          [0.32, 0.13],
          [0.05, 0.05],
          [-0.28, 0.19],
          [-0.52, 0.04],
          [-1.2, 0.12],
        ]);
        // A pale broken lip carries the crack across the dark visor as
        // well as the pink shell. Still visible at phone scale, without FX.
        line(c, '#ffdfba', .073, -1,.12,-.52,.045,-.28,.19,.05,.05,.32,.13,.93,-.09);
        line(c,K,.066,.36,.12,.49,.33,.66,.38);
        c.restore();
      }
      if (kind === 'crown') {
        poly(
          c,
          W,
          [
            [-0.46, -0.91],
            [-0.35, -0.7],
            [0.34, -0.7],
            [0.48, -0.91],
            [0.18, -0.82],
            [0, -1.05],
            [-0.15, -0.81],
          ],
          K,
          0.055,
        );
        for (let i = 0; i < 3; i++) {
          const a = (i * TAU) / 3 - 0.95;
          arc(c, i < plates ? col : '#664252', 0.067, 0, 0, 1.16, a, a + 1.3);
        }
      }
      break;
    }
    case 'rift':
      c.scale(0.49, 0.49);
      poly(c, K, t.outline);
      disk(c, col, 0, 0, 0.2);
      break;
    case 'well':
      c.rotate(time * 0.013);
      for (let i = 0; i < 3; i++) {
        c.rotate(TAU / 3);
        c.fillStyle = K;
        c.beginPath();
        c.moveTo(0, -0.72);
        c.quadraticCurveTo(0.72, -0.35, 0.28, 0.24);
        c.quadraticCurveTo(0.42, -0.18, 0, -0.72);
        c.fill();
      }
      disk(c, K, 0, 0, 0.25);
      break;
  }
  c.restore();
}
export function blade(c, x, y, angle, r, strength = 1, reach = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(r, r);
  c.globalAlpha *= strength;
  const stretch = (2.88 * reach - 0.69) / (2.88 - 0.69);
  c.translate(0.69 * (1 - stretch), 0);
  c.scale(stretch, reach > 1 ? 1.52 : 1);
  poly(
    c,
    L,
    [
      [0.69, 0.23],
      [1.04, 0.1],
      [2.88, -0.15],
      [2.38, 0.16],
      [1.12, 0.33],
      [0.8, 0.42],
    ],
    K,
    0.065,
  );
  line(c, W, 0.055, 1.11, 0.16, 2.55, -0.08);
  line(c, K, 0.12, 0.99, -0.04, 1.12, 0.49);
  if (reach > 1)
    poly(c, W, [
      [1.04, 0.12],
      [1.23, -0.06],
      [2.88, -0.15],
      [2.1, -0.015],
    ]);
  c.restore();
}
// A torn screen-print: preserve the pre-hit face/plates on both offcuts and
// expose a narrow paper edge exactly on the clipping plane. Shared by a live
// strike, the cover illustration and the score slip.
export function cutHalf(c, kind, path, cutLocal, side, opts = {}) {
  c.save();
  c.beginPath();
  trace(c, path);
  c.clip();
  if (kind === 'cube') cube(c, 0, 0, 1, 0, 0, opts.face);
  else foe(c, kind, 0, 0, 1, 0, opts);
  c.rotate(cutLocal);
  c.fillStyle = opts.torn ? L : W;
  const lip = opts.torn ? 0.115 : 0.072;
  c.fillRect(-1.5, side < 0 ? -lip : 0, 3, lip);
  c.restore();
}
export function cutFigure(c, kind, x, y, r, angle, cut, gap, opts = {}) {
  const local = cut - angle,
    paths = bisect(kind === 'cube' ? CUBE : TYPES[kind].outline, local);
  paths.forEach((path, i) => {
    const side = i ? 1 : -1;
    c.save();
    c.translate(x - Math.sin(cut) * side * gap, y + Math.cos(cut) * side * gap);
    c.rotate(angle + side * (opts.twist || 0));
    c.scale(r, r);
    cutHalf(c, kind, path, local, side, opts);
    c.restore();
  });
}
// One knife impression, with two nibs and a knocked-out spine. In play its
// width and length come from the forward damage query, never a radial burst.
export function shearInk(c, x, y, angle, len, width) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(len, width);
  poly(c, L, [
    [0, -0.16],
    [0.21, -0.48],
    [0.6, -0.34],
    [0.55, -0.19],
    [1, -0.07],
    [0.82, 0.07],
    [0.91, 0.13],
    [0.3, 0.4],
    [0.1, 0.49],
    [0.15, 0.22],
    [0, 0.27],
  ]);
  poly(c, W, [
    [0.02, 0.11],
    [0.24, -0.09],
    [0.76, -0.13],
    [0.38, 0.075],
    [0.45, 0.11],
    [0.1, 0.22],
  ]);
  poly(c, L, [
    [0.16, 0.68],
    [0.54, 0.35],
    [0.36, 0.6],
  ]);
  c.restore();
}
// One registration nick on the first live target, two on the second. Marks
// stay outside their silhouettes, and only appear while sighting a real pair.
export function nick(c, x, y, r, angle, count, scale) {
  // Keep the tally off the dotted flight path, and give each notch a readable
  // display-pixel width even on a portrait phone. Both sit on the upper lip.
  c.save();
  c.translate(x, y);
  c.rotate(Math.cos(angle) < 0 ? angle + Math.PI : angle);
  c.translate(0, -r);
  c.scale(1 / scale, 1 / scale);
  for (let i = 0; i < count; i++) {
    const u = (i - (count - 1) * 0.5) * 7;
    poly(
      c,
      L,
      [
        [u - 3, -2],
        [u, -11],
        [u + 5, -11],
        [u + 1, -2],
      ],
      K,
      1.2,
    );
  }
  c.restore();
}
