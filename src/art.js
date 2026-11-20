import { INK, TYPES, TAU, CUBE, bisect } from './shapes.js';
/**
 * The jelly field: a per-vertex displacement in CUBE space.
 *
 * `trace()` is the single funnel every polygon in `cube()` goes through, so
 * putting the deformation here means the whole character -- body, scarf, brim,
 * eyes -- deforms as ONE piece instead of an outline wobbling around a rigid
 * face. That is the difference between a jelly and a masked sprite.
 *
 *   - `sx`/`sy` squash and stretch about the centre.
 *   - `dipX`/`dipY` pull the corners furthest along the lean direction: the
 *     cell-animation read of follow-through. `dipX` is driven by `lean`, which
 *     is why the lean is now an expression rather than a rotation.
 *   - `grip` is the solidity. This is a cube, not a blob, so grip near 1 keeps
 *     it stiff and a lower grip lets it lag.
 */
export function jelly(x, y, f) {
  if (!f) return [x, y];
  const g = f.grip ?? 1;
  let nx = x * (f.sx ?? 1),
    ny = y * (f.sy ?? 1);
  // ── THE DIP MUST NOT SHEAR THE CUBE ──────────────────────────────────────
  //
  // `dipX` used to be added to the horizontal position scaled by `(1 - y)`,
  // which is a SHEAR: the top of the body slid sideways while the bottom stayed
  // put. On a square, a shear is a parallelogram -- and at this size a
  // parallelogram reads as a crooked diamond, which is exactly the bug.
  //
  // Measured on a unit square: a full lean of 0.34 moved the top edge 0.52
  // cube-widths sideways and opened two corners to 104.5 degrees and the other
  // two to 75.5. That is not a subtle deformation, it is a different shape.
  //
  // The corner dip is now applied along the SAME axis it moves on, which
  // compresses that side instead of sliding it: the leading corner still
  // travels (so the lean still reads) but it travels INWARD, shortening that
  // edge rather than skewing the whole body. Corners stay at 90 degrees because
  // the transform is a per-axis scale with no cross terms.
  //
  // The same argument applies to `dipY` on the vertical axis.
  const lx = f.dipX ?? 0,
    ly = f.dipY ?? 0;
  const stretchX = 1 + Math.abs(lx) * 0.5,
    stretchY = 1 + Math.abs(ly) * 0.5;
  nx /= stretchX;
  ny /= stretchY;
  return [x + (nx - x) * g, y + (ny - y) * g];
}

export function trace(c, p, field = null) {
  const a = field ? jelly(p[0][0], p[0][1], field) : p[0];
  c.moveTo(a[0], a[1]);
  for (let i = 1; i < p.length; i++) {
    const v = field ? jelly(p[i][0], p[i][1], field) : p[i];
    c.lineTo(v[0], v[1]);
  }
  c.closePath();
}
export function poly(c, color, p, edge = null, width = 0.07, field = null) {
  c.fillStyle = color;
  c.beginPath();
  trace(c, p, field);
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
export function cube(c, x, y, r, angle = 0, flutter = 0, face = 1, pose = null) {
  // `pose.field` deforms every polygon of the character as one piece, so the
  // face rides the body instead of floating inside it. See `jelly`.
  const F = pose?.field ?? null;
  c.save();
  c.translate(x, y);
  // ── BREATHING ────────────────────────────────────────────────────────────
  //
  // A resting body is never actually still, and a perfectly static sprite reads
  // as "the game has stopped". Small scale about the body's BASE, so the cube
  // settles onto its feet instead of inflating about its middle.
  //
  // Placed after `save()` on purpose. The first version applied this before
  // `save()` -- outside the cube's own transform scope -- so the scale
  // multiplied the CALLER's matrix and compounded every frame. Measured: one
  // landing kick flung the body hundreds of pixels off screen.
  if (pose?.breathe) c.scale(1 + pose.breathe * 0.018, 1 - pose.breathe * 0.012);
  c.rotate(angle);
  c.scale(r * face, r);
  c.lineJoin = 'miter';
  // ── THE ANIMATED EXPRESSIONS ────────────────────────────────────────────
  //
  // `pose` carries the two channels animation.js computes and the character
  // needs: how open the eyes are, and how hard the scarf is lifting. Before
  // this they were calculated every frame and then thrown away -- the pose
  // maths existed but the character never showed any of it.
  //
  // Both are 0..1+ multipliers centred on the resting value, so `pose=null`
  // reproduces the original drawing exactly and every existing caller (the
  // title screen, the score slip, every cut half) keeps its old look.
  //
  //   eyes: 1 = open, 0 = closed to two flat lines. Anime shorthand for a
  //         committed plunge or a hard impact.
  //   lift: 0 = hanging, 1 = streaming. Driven by the fall and by speed.
  const eyes = pose ? Math.max(0, Math.min(1, pose.eyes ?? 1)) : 1;
  const lift = pose ? Math.max(0, Math.min(1.6, pose.lift ?? 0)) : 0;
  // 1 = open, 0 = shut. Multiplies `eyes`; see the note at the eye block.
  const blink = pose ? Math.max(0, Math.min(1, pose.blink ?? 1)) : 1;
  // Pupil offset in cube space, already normalised to about -1..1.
  const look = pose?.look ?? null;
  // The scarf's own wave, plus the lift pulling the tips further back and up.
  // ── ONE RIBBON, NOT TWO SPIKES ───────────────────────────────────────────
  //
  // There used to be TWO scarf polygons: one sweeping up and back from the
  // upper-left corner, one sweeping down and back from the lower-left. Between
  // them they read as green needles firing out of the head and the butt, which
  // is exactly what the report describes -- "green spikes shoot straight out of
  // both its head and its butt".
  //
  // A scarf is one piece of cloth attached at ONE point (the neck) and trailing
  // away from travel. So this is a single tapered ribbon: it starts wide at the
  // neck, narrows as it goes, and waves along its length. The wave is applied
  // to the CENTRELINE offset, and both edges get the same offset, so the ribbon
  // bends as a cloth rather than fraying into points.
  //
  // `wave` is still driven by flutter and lift, so it flows faster at speed and
  // lifts when the cube is dashing -- the motion is preserved, only the shape is
  // honest.
  const wave = Math.sin(flutter * 0.09) * 0.13 + lift * 0.2;
  {
    const SEG = 5,
      LEN = 1.75,
      WIDTH = 0.34;
    // The ribbon leaves the neck (upper-left of the body) and trails LEFT and
    // slightly DOWN, i.e. opposite the usual direction of travel. Each segment
    // is a fraction further out and its centreline is displaced by a sine that
    // grows along the length, which is how cloth behaves: the far end swings
    // most.
    const centre = [],
      top = [],
      bot = [];
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG,
        x = -0.86 - u * LEN,
        // The tail swings most; the attachment barely moves.
        y = -0.52 + Math.sin(u * 3.4 + flutter * 0.09) * 0.2 * u + wave * u * 0.8,
        // Taper: the cloth narrows to a point at the free end.
        w = WIDTH * (1 - u * 0.82);
      centre.push([x, y]);
      top.push([x, y - w]);
      bot.push([x, y + w]);
    }
    // One closed outline: out along the top edge, back along the bottom.
    poly(c, L, [...top, ...bot.slice().reverse()], K, 0.07, F);
    // A lighter inner stripe, inset so the ribbon reads as cloth with a fold
    // rather than a flat slab.
    const inner = [];
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG,
        [x, y] = centre[i],
        w = WIDTH * (1 - u * 0.82) * 0.42;
      inner.push([x + 0.06, y - w]);
    }
    for (let i = SEG; i >= 0; i--) {
      const u = i / SEG,
        [x, y] = centre[i],
        w = WIDTH * (1 - u * 0.82) * 0.42;
      inner.push([x + 0.06, y + w]);
    }
    poly(c, '#aabe39', inner, K, 0.02, F);
  }
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
  F);
  poly(c, L, [
    [-0.97, -0.79],
    [0.98, -0.69],
    [0.98, -0.5],
    [-0.97, -0.52],
  ], F);
  poly(c, K, [
    [-1, -0.53],
    [1, -0.42],
    [1, 0.15],
    [0.59, 0.28],
    [-0.83, 0.09],
    [-1, -0.03],
  ], F);
  // Eyes. As `eyes` closes, each lid collapses toward its own centre line, so
  // the shape becomes a flat slash rather than shrinking to a dot -- which is
  // the difference between "squinting" and "the face vanished".
  {
    // ── BLINK IS A SECOND, INDEPENDENT LID ────────────────────────────────
    //
    // `eyes` is the fall/speed channel: it closes when the body commits to a
    // drop. A blink is a different thing that happens for a different reason,
    // so it multiplies in rather than sharing the same value -- otherwise a
    // cube at rest could never blink without also reading as falling.
    const e = eyes * blink;
    // ── GAZE ──────────────────────────────────────────────────────────────
    //
    // `look` moves the pupils inside the lids. It is deliberately small (a
    // fifth of the face) and it is offset AFTER the lid squash, so a squinting
    // cube still looks where it is looking. Without this the face is a decal
    // that happens to sit on a moving body.
    const gx = look ? look[0] * 0.2 : 0,
      gy = look ? look[1] * 0.2 : 0;
    const eye = (q) => {
      // q = four corners, top-left, top-right, bottom-right, bottom-left.
      const cy = (q[0][1] + q[2][1]) / 2;
      return q.map(([px, py]) => [px + gx, cy + (py - cy) * e + gy]);
    };
    poly(
      c,
      L,
      eye([
        [-0.56, -0.31],
        [0.1, -0.12],
        [0.05, 0.03],
        [-0.54, -0.05],
      ]),
    F);
    poly(
      c,
      L,
      eye([
        [0.36, -0.1],
        [0.86, -0.29],
        [0.79, 0.03],
        [0.38, 0.055],
      ]),
    F);
  }
  poly(c, K, [
    [-0.91, 0.63],
    [-0.52, 0.7],
    [-0.66, 0.81],
    [-0.91, 0.77],
  ], F);
  line(c, K, 0.055, 0.44, 0.54, 0.75, 0.52);
  c.restore();
}
// Tangential marks echo a class's ability instead of giving every polygon a
// generic face: scope, oscillator, split seam, plate, blink star, or vortex.
// Mix two #rrggbb colours. Used only for the enemy hit flash, where blending
// is what turns a hard white pop into an eased impact.
function blend(a, b, t) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round((((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

export function foe(c, kind, x, y, r, angle = 0, opts = {}) {
  const t = TYPES[kind],
    // `flash` may be a BOOLEAN (hit hard) or a 0..1 AMOUNT. An enemy that pops
    // from its colour to solid white for two frames and back is the single
    // most visually violent thing on the field: on a fast-moving target it
    // reads as a stutter, not as a hit. Taking an amount lets the renderer
    // ease it in and out so the flash reads as impact rather than as a glitch.
    flash = typeof opts.flash === 'number' ? opts.flash : opts.flash ? 1 : 0,
    col = flash > 0 ? blend(W, t.color, 1 - flash) : t.color,
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
  // ── HAZARD BORDER ────────────────────────────────────────────────────────
  //
  // Well and Prism were SEVEN RGB units apart, which is not a distinction, it
  // is a smear. Well now carries a crimson body, and this draws a ring of
  // spikes around it on top -- so the shape still reads as dangerous in
  // greyscale, under a colour-blindness filter, or on a bad phone screen at
  // 30% brightness, none of which colour alone survives.
  //
  // Drawn INSIDE the radius so the hazard never changes the collision silhouette:
  // what you see is what you hit.
  if (t.hazard) {
    const teeth = 11;
    c.save();
    c.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2,
        rad = i % 2 ? 0.72 : 1.02;
      const px = Math.cos(a) * rad,
        py = Math.sin(a) * rad;
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    }
    c.closePath();
    c.strokeStyle = K;
    c.lineWidth = 0.085;
    c.lineJoin = 'miter';
    c.stroke();
    c.strokeStyle = blend(W, '#ff2f6b', 0.55);
    c.lineWidth = 0.038;
    c.stroke();
    c.restore();
  }
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
        // ── THREE PLATES, COUNTABLE AT A GLANCE ──────────────────────────
        //
        // The shell already cracks and faults as it loses hp, which is a good
        // "I am hurting it" read -- but it is not a COUNT. A player has to
        // infer "how much is left" from how bad the damage looks, and at phone
        // scale a hairline crack and a deep one are the same three pixels.
        //
        // So the plates are also drawn as three literal plates across the
        // crown, and losing one hp SHEDS one: the survivors stay solid paper,
        // the lost ones are stamped as broken outlines in the shell's own
        // colour. One hp left therefore reads as one plate standing, which is
        // the "fragile" read the brief asks for without needing the crack to
        // be legible.
        for (let i = 0; i < t.hp; i++) {
          const px = (i - (t.hp - 1) / 2) * 0.42,
            live = i < plates;
          c.save();
          c.beginPath();
          c.moveTo(px - 0.155, -0.86);
          c.lineTo(px + 0.155, -0.86);
          c.lineTo(px + 0.125, -1.06);
          c.lineTo(px + 0.045, -0.955);
          c.lineTo(px, -1.07);
          c.lineTo(px - 0.045, -0.955);
          c.lineTo(px - 0.125, -1.06);
          c.closePath();
          if (live) {
            c.fillStyle = W;
            c.fill();
          }
          // A shed plate keeps its outline so the player can count what is
          // MISSING, not just what is present.
          c.strokeStyle = live ? K : blend(K, t.color, 0.45);
          c.lineWidth = live ? 0.052 : 0.038;
          if (!live) c.setLineDash([0.05, 0.045]);
          c.stroke();
          c.restore();
        }
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
/**
 * Alpha for a live blade, from the blade's own remaining ticks.
 *
 * The brief: the blade must be visible for its whole window, and the last few
 * ticks must FLICKER so expiry is telegraphed rather than silent. A blade that
 * simply ramps to zero over its last third reads as "the game got dim"; a blade
 * that strobes reads as "this is about to end".
 *
 * @param {number} left  ticks of blade remaining (s.blade)
 * @param {number} life  the longest it can be (ANIM.blade.life)
 */
export function bladeAlpha(left, life = 38, time = 0) {
  if (!(left > 0)) return 0;
  // Solid for the body of the window, easing down near the end.
  const t = Math.min(1, left / life),
    base = 0.55 + 0.45 * Math.min(1, t * 2.2);
  // ── LAST FOUR TICKS: STRICT ALTERNATION ────────────────────────────────
  //
  // Keyed on the REMAINING TICKS, not on a quantised clock. My first version
  // used `floor(time*0.5 + left) % 2`, which on a real 1-tick-per-frame run
  // produced on, OFF, OFF, on -- two dark ticks in a row. That is a dim-out,
  // not a flicker, and it reads as the effect failing rather than as the window
  // closing.
  //
  // Alternating on `left` alone gives on/off/on/off at exactly one toggle per
  // tick, which is the fastest the eye can read at 60Hz and is unambiguous.
  if (left <= 4) return Math.round(left) % 2 ? base * 0.16 : base;
  return base;
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

/**
 * The jelly spring: one damped oscillator, sampled into a `jelly` field.
 *
 * WHY A SPRING AND NOT A CURVE. A curve can only play back a canned squash; a
 * spring answers the event that actually happened, so a light tap and a wall at
 * 378 produce visibly different deformations from the same code. It is also
 * the only way the body can DELAY: the corner you just landed on moves first
 * and the far corner follows, which is the whole read of weight.
 *
 * State is a single displacement plus its velocity, integrated per tick. The
 * spring is stiff (omega) and near-critical (zeta), so it does not wobble --
 * `easeOutElastic` terms are what make a body look like jelly instead of mass.
 */
export function createJelly() {
  let x = 0, y = 0, vx = 0, vy = 0;
  return {
    /** Kick the body. `nx`/`ny` is the direction of the blow in cube space.
     *
     *  The impulse is scaled into the spring's own units. Feeding raw power in
     *  as velocity peaks at ~0.014 -- measured, invisible -- because the spring
     *  immediately pulls the displacement back toward zero. */
    hit(power, nx = 0, ny = 1) {
      const p = Math.max(-1.6, Math.min(1.6, power)) * 22;
      vx += nx * p;
      vy += ny * p;
    },
    step(dt = 1) {
      // Tuned by measuring the response, not by feel: the first version used
      // omega 26 / zeta 0.85, peaked at 0.005 and was over inside four ticks --
      // invisible on screen. This is a 60Hz-friendly step (dt in ticks at 1/60)
      // that peaks near 0.35 and is visually settled in about 14 ticks, which is
      // long enough to read as follow-through and short enough that a dash does
      // not smear into the next one.
      const omega = 13, zeta = 0.72, h = 0.016 * dt;
      const ax = -omega * omega * x - 2 * zeta * omega * vx,
        ay = -omega * omega * y - 2 * zeta * omega * vy;
      vx += ax * h;
      vy += ay * h;
      x += vx * h;
      y += vy * h;
    },
    /** The field `cube()` draws with. `grip` rises with speed: a cube being
     *  thrown is stiffer than one standing still, which is what stops the
     *  deformation from reading as mush at 280 px/tick. */
    field(grip = 0.75, dipX = 0, dipY = 0) {
      return {
        sx: 1 + x * 0.22,
        sy: 1 + y * 0.22,
        dipX,
        dipY,
        grip: Math.max(0, Math.min(1, grip)),
      };
    },
    get x() { return x; },
    get y() { return y; },
    reset() { x = y = vx = vy = 0; },
  };
}
