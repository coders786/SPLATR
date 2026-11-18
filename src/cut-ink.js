import { poly, line, disk } from './art.js';
import { INK } from './shapes.js';

// What remains attached to the rack should still be there after the hit.
export function rackInk(c, pegs, live) {
  const a = pegs[0],
    b = pegs.at(-1),
    angle = pegs.length > 1 ? Math.atan2(b.y - a.y, b.x - a.x) : -0.12;
  const rot = Math.cos(angle) < 0 ? angle + Math.PI : angle,
    ca = Math.cos(rot),
    sa = Math.sin(rot);
  const xs = pegs.map((p) => (p.x - a.x) * ca + (p.y - a.y) * sa);
  const l = Math.min(...xs) - 50,
    r = Math.max(...xs) + 50,
    y = -Math.max(...pegs.map((p) => p.r)) - 21;
  c.save();
  if (pegs.every((p) => !live.has(p.id))) c.globalAlpha = 0.43;
  c.translate(a.x, a.y);
  c.rotate(rot);
  poly(
    c,
    '#61554c',
    [
      [l, y - 7],
      [r, y - 7],
      [r - 6, y + 4],
      [l + 9, y + 6],
    ],
    '#202e30',
    2,
  );
  line(c, '#93836c', 1.7, l + 9, y - 5, r - 9, y - 5);
  for (const [i, x] of xs.entries()) {
    const p = pegs[i],
      held = live.has(p.id),
      py = (p.y - a.y) * ca - (p.x - a.x) * sa;
    const bot = held ? py - p.r * (pegs.length === 1 ? 0.68 : 0.36) : y + 16;
    poly(c, held ? '#bf9a73' : '#988067', [
      [x - 8, y],
      [x + 8, y],
      [x + 7, bot - 4],
      [x + 2, bot],
      [x - 2, bot - 5],
      [x - 7, bot - 1],
    ]);
    disk(c, '#24312e', x, y, 2.7);
  }
  c.restore();
}
// The brush bows behind the physical blade; the brightest, straight edge is
// its true direction. No fake range boost, even when the swing is drawn wide.
export function drawSweep(c, p, angle, r, side, f) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(angle);
  c.scale(r, r * side);
  c.fillStyle = INK.acid;
  c.globalAlpha = 0.65 * f;
  c.beginPath();
  c.moveTo(0.78, 0.19);
  c.quadraticCurveTo(1.96, -0.03, 2.85, -0.13);
  c.quadraticCurveTo(2.62, 1.15 * f, 1.85, 1.45 * f);
  c.quadraticCurveTo(2.05, 0.8 * f, 0.78, 0.19);
  c.fill();
  c.restore();
}
export function contactInk(c, m, alpha, motion) {
  c.save();
  c.translate(m.x, m.y);
  c.rotate(m.cut);
  c.globalAlpha = alpha;
  const r = m.r;
  if (m.type === 'armor') {
    // A plate ricochets off the wound; a living hexagon stays underneath.
    const f = motion ? 1 - m.life / 16 : 0.25;
    c.translate(r * (0.35 + f), -r * (0.76 + f));
    c.rotate(-0.54 - f * 0.7);
    poly(
      c,
      '#ffc4aa',
      [
        [-r * 0.4, 0],
        [r * 0.32, -4],
        [r * 0.2, 4],
        [-r * 0.29, 7],
      ],
      INK.black,
      1.4,
    );
  } else {
    c.scale(r, r);
    c.fillStyle = INK.paper;
    c.beginPath();
    c.moveTo(-1.48, 0.15);
    c.quadraticCurveTo(-0.24, -0.15, 1.45, -0.11);
    c.lineTo(0.73, -0.02);
    c.lineTo(1.12, -0.012);
    c.quadraticCurveTo(-0.42, 0.02, -1.48, 0.15);
    c.fill();
  }
  c.restore();
}
