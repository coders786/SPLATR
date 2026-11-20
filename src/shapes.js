// The field guide, title illustration, collision sensors and fracture effects
// all start with these FLAT outlines. Normalized local coordinates, no camera
// perspective, polygon extrusion, raster sprite sheet or WebGL dependency.
export const TAU = Math.PI * 2;
export const regular = (n, offset = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => [
    Math.cos(offset + (i * TAU) / n),
    Math.sin(offset + (i * TAU) / n),
  ]);
const star = (n, r) =>
  regular(n * 2).map(([x, y], i) => [x * (i % 2 ? r : 1), y * (i % 2 ? r : 1)]);
const cross = [
  [-0.31, -1],
  [0.31, -1],
  [0.31, -0.31],
  [1, -0.31],
  [1, 0.31],
  [0.31, 0.31],
  [0.31, 1],
  [-0.31, 1],
  [-0.31, 0.31],
  [-1, 0.31],
  [-1, -0.31],
  [-0.31, -0.31],
];
export const INK = {
  void: '#100e19',
  black: '#16111e',
  paper: '#fff8ec',
  acid: '#deff52',
  rose: '#ff426b',
  // The non-lethal replacement for a rose hazard mark. Used where something
  // used to shout "danger" and now only reports a condition.
  cool: '#6f8fa3',
  quiet: '#b3a6bd',
};
function species(name, form, color, outline, r, points, ability, counter, extra = {}) {
  return { name, form, color, outline, r, points, ability, counter, hp: 1, ...extra };
}
export const TYPES = {
  fang: species(
    'Fang',
    'Triangle',
    '#ff506e',
    regular(3, 0),
    33,
    100,
    'Locks a bearing, then lunges along the dotted line.',
    'Let it commit. Cut across its path.',
  ),
  pulse: species(
    'Pulse',
    'Circle',
    '#f67f9c',
    regular(32),
    32,
    150,
    'Sends a growing shock ring through the field.',
    'Start a fresh dash as the ring reaches you.',
  ),
  prism: species(
    'Prism',
    'Diamond',
    '#c69aff',
    regular(4),
    37,
    180,
    'Fires a sighted needle. Some form charged beams with another Prism.',
    'Cut into needles. Break either endpoint to cancel a linked beam.',
  ),
  fork: species(
    'Fork',
    'Cross',
    '#ff946e',
    cross,
    31,
    220,
    'Bursts into two smaller Fangs when split.',
    'Save a second slash for the offspring.',
    { concave: true },
  ),
  bastion: species(
    'Bastion',
    'Hexagon',
    '#ff7088',
    regular(6, 0),
    41,
    300,
    'Advances behind two plates. The first slash cracks its shell.',
    'Hit again, or line up two softer shapes to shear both plates.',
    { hp: 2 },
  ),
  rift: species(
    'Rift',
    'Star',
    // ── DANGER RED, NOT PRIZE GOLD ─────────────────────────────────────────
    //
    // This was #ffa47b, a warm peach-gold. In a game where every glowing
    // star-shaped pickup has been a reward for forty years, that colour is an
    // instruction to TOUCH it -- and the Rift marks your position and then
    // blinks onto the mark. The report caught the result precisely: "the orange
    // star flashes and shrinks and grows like a glowing prize... in every video
    // game ever made, a glowing star makes players want to touch it, not run
    // away from it."
    //
    // #e0123a is the same red the Red Line uses for danger, which is the one
    // place this game already asks the player to read colour as hazard. It is
    // the named exception to "red is only for the Red Line" -- the Rift is a
    // hazard, not a pickup.
    '#e0123a',
    star(5, 0.47),
    36,
    260,
    'Marks your position, then blinks onto the mark.',
    'Leave the outline before it closes.',
    { concave: true },
  ),
  well: species(
    'Well',
    'Pentagon',
    // ── WELL IS NOT A PRISM ────────────────────────────────────────────────
    //
    // This was '#b99bff', SEVEN RGB units from Prism's '#c69aff' -- the same
    // lilac in the same family, on two shapes that want opposite reactions. A
    // player cannot treat a friend and a hazard the same colour.
    //
    // Prism keeps '#c69aff'. Well moves to crimson, which is the language this
    // game already uses for the things that hurt you (Crown is '#ff426b'), and
    // gets a jagged hazard border on top so the difference survives colour
    // blindness. The rule about red was about the RED LINE, a red boundary that
    // used to kill you; it was never a ban on danger dressing.
    '#d61b57',
    regular(5),
    36,
    260,
    'Pulls the cube inward inside its field.',
    'Spend a slash to escape or cut the core.',
    { hazard: true },
  ),
  crown: species(
    'Crown',
    'Octagon',
    '#ff426b',
    regular(8, Math.PI / 8),
    67,
    1200,
    'A sector hunter. Fires a radial volley and carries three plates.',
    'Break the plates with separate cuts. Destroy it to repair one hull.',
    { hp: 3 },
  ),
};
export const SPECIES = Object.keys(TYPES);
export const CUBE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
export const mix = (a, b, t) => a + (b - a) * t;
export function pose(e, t) {
  return { x: mix(e.px, e.x, t), y: mix(e.py, e.y, t), angle: mix(e.pa, e.angle, t) };
}
export function bodyPose(body, t) {
  const p = body.plugin.previous;
  return {
    x: mix(p.x, body.position.x, t),
    y: mix(p.y, body.position.y, t),
    angle: mix(p.angle, body.angle, t),
  };
}
// Sutherland–Hodgman against a half-plane. Slice the victim along the actual
// attack direction, so the two flying pieces retain its silhouette and colour.
export function bisect(points, angle) {
  const nx = -Math.sin(angle),
    ny = Math.cos(angle);
  return [-1, 1].map((sign) => {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        da = sign * (nx * a[0] + ny * a[1]),
        db = sign * (nx * b[0] + ny * b[1]);
      if (da >= 0) out.push(a);
      if (da < 0 !== db < 0) {
        const t = da / (da - db);
        out.push([mix(a[0], b[0], t), mix(a[1], b[1], t)]);
      }
    }
    return out;
  });
}
