// Cells have immutable addresses, independent RNG streams and variable
// encounter grammars. Travelling left first cannot change the field on the right.
export const PLAYER_SIZE = 46,
  CELL_W = 1600,
  CELL_H = 1240,
  BAND = CELL_H * 2;
export const SPAWN = { x: 0, y: 0 },
  PAD = { x: -102, y: PLAYER_SIZE / 2, w: 204, h: 25 };
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function randomSource(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function hash(seed, x, y) {
  let h = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return (h ^ (h >>> 15)) >>> 0;
}
export function freshSeed(last) {
  const a = new Uint32Array(1);
  try {
    globalThis.crypto.getRandomValues(a);
  } catch {
    a[0] = (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  }
  return a[0] === last ? (a[0] + 1) >>> 0 : a[0];
}
export const bandAt = (y) => 1 + Math.floor(Math.max(0, -y) / BAND);
const DISTRICTS = [
  'Undercut',
  'Static Bloom',
  'Dead Channel',
  'Razor Belt',
  'Black Circuit',
  'Aftershock',
];
// A seeded permutation of five biomes: neighbours never alias to the same
// biome, but addresses and later enemy layouts are not a repeated five-room loop.
export const districtIndex = (seed, band) =>
  band === 1 ? 0 : 1 + (((hash(seed, 0, 5) % 5) + (band - 2) * (1 + (hash(seed, 0, 7) % 4))) % 5);
export const district = (seed, band) => DISTRICTS[districtIndex(seed, band)];
// Leave a clear lane BETWEEN formations, including across cell seams.
// The long diagonal is a single stroke opportunity, not a cluster of foes.
const FORMS = [
  [[-.19,.29],[-.06,-.028],[.09,-.30]],
  [[-.26,.24],[-.20,-.08],[.30,-.27],[.22,.065]],
  [[-.30,0],[0,-.29],[.30,0],[0,.29]],
  [[-.29,-.24],[-.29,.24],[.29,-.24],[.29,.24]],
  [[-.31,.18],[-.13,-.265],[.10,.055],[.32,-.24]],
];
const MARGIN=225;
// Safe first cut, not a fixed first level. The lane, orientation and immediate
// follow-up change with the run, with a one-plate target in easy reach.
export const openingFacing = (seed) => (hash(seed, 71, -4) & 1 ? 1 : -1);
// First two are the cut line; a two-plate Bastion sits just behind them.
// The other flank is a real escape route, not a mandatory tutorial gate.
const OPEN = [
  ['fang', 'prism', 88, -144, 'fork', 'pulse'],
  ['pulse', 'fang', 78, -156, 'prism', 'fork'],
  ['fang', 'pulse', 97, -138, 'fork', 'prism'],
  ['prism', 'pulse', 93, -153, 'fang', 'fork'],
];
export function cellAt(p) {
  return { cx: Math.floor(p.x / CELL_W + 0.5), cy: Math.max(0, Math.floor(-p.y / CELL_H)) };
}
export function makeCell(seed, cx, cy, staged = false) {
  const rng = randomSource(hash(seed, cx, cy)),
    band = 1 + Math.floor(cy / 2),
    id = `${cx}:${cy}`;
  const at = (kind, x, y, i) => ({
    kind,
    x,
    y,
    id: `${id}/${i}`,
    home: id,
    slot: i,
    phase: rng() * 6.28,
    gentle: staged && cy <= 1,
    delay: band === 1 ? 33 + rng() * 45 : 8 + rng() * 36,
  });
  if (cx === 0 && cy === 0) {
    const [near, next, u, v, flank, high] = OPEN[hash(seed, 51, -1) % OPEN.length],
      flip = openingFacing(seed),
      x = (u + (rng() - 0.5) * 26) * flip,
      y = v + (rng() - 0.5) * 24,
      length=Math.hypot(x,y),
      // The second body follows the arc, not a line drawn through the centres.
      leg=453+rng()*9,
      bx=x+x/length*leg, by=y+y/length*leg+46,
      tangent=Math.atan2(by-y+27,bx-x), reach=401+rng()*10;
    const spawns = staged
      ? [
          // The first *live* triangle holds a line towards the player. It is
          // already telling when the room opens, not a moving tutorial caption.
          { ...at('fang', x+flip*55, y-86, 0), sentry: true, size: 1.24 },
          at('fang', -flip*118, -672-rng()*26, 1),
          at('fang', flip*183,-1030-rng()*25,2),
        ]
      : [
          at(near, x, y, 0),
          at(next, bx, by, 1),
          at('bastion', bx + Math.cos(tangent) * reach, by + Math.sin(tangent) * reach, 2),
          at(flank, -flip * (342 + rng() * 25), -420 - rng() * 33, 3),
          at(high, -flip*(178+rng()*34), -953-rng()*30, 4),
        ];
    return { id, cx, cy, pattern: 'first cut', spawns };
  }
  const pattern = Math.floor(rng() * FORMS.length),
    flip = rng() < 0.5 ? -1 : 1,
    scatter=pattern<=1?16:48,
    ox = (rng() - 0.5) * 75,
    oy = (rng() - 0.5) * 78;
  const pools =
    band === 1
      ? ['fang', 'fang', 'pulse', 'prism', 'fork', 'bastion']
      : ['fang', 'pulse', 'prism', 'fork', 'bastion', 'rift', 'well'];
  const theme = districtIndex(seed, band);
  if (band > 1)
    pools.push(
      ...[
        [],
        ['pulse', 'fork'],
        ['prism', 'rift'],
        ['fang', 'fang'],
        ['well', 'prism'],
        ['bastion', 'fork'],
      ][theme],
    );
  const spawns = FORMS[pattern].map(([u, v], i) =>
    at(
      pools[Math.floor(rng() * pools.length)],
      cx*CELL_W+clamp(ox+u*CELL_W*flip+(rng()-.5)*scatter,-CELL_W/2+MARGIN,CELL_W/2-MARGIN),
      -cy*CELL_H+clamp((v-.5)*CELL_H+oy+(rng()-.5)*scatter,-CELL_H+MARGIN,-MARGIN),
      i,
    ),
  );
  // Even the cells beside/above the pad obey the lesson order. Filtering
  // the five targets in the centre alone still put shooters on a tall screen.
  if (staged && cy < 8) {
    const first = [null, null, 'pulse', 'prism', null, 'fork', 'well', 'rift'];
    const familiar = ['fang', 'fang', 'bastion', ...first.slice(0, cy).filter(Boolean)];
    if (cy <= 2) spawns.length = 3;
    spawns.forEach((e, i) => {
      e.kind = i === 0 ? 'fang' : familiar[Math.floor(rng() * familiar.length)];
    });
    if (first[cy]) spawns[1].kind = first[cy];
    return { id, cx, cy, pattern, spawns, link: null };
  }
  // Put complementary threats in specific slots; don't merely scatter a bag
  // of identical enemies. Unassigned flankers keep the district's weighting.
  if (pattern === 0) {
    spawns[0].kind = band%2?'fang':'pulse';
    spawns[1].kind='prism';
    spawns[2].kind='bastion';
  }
  if (pattern === 1) {
    spawns[0].kind = spawns[3].kind = 'fang';
    spawns[1].kind = band === 1 ? 'pulse' : 'rift';
  }
  if (pattern === 2) {
    spawns[1].kind = 'prism';
    spawns[3].kind = 'pulse';
  }
  if (pattern === 3) spawns[3].kind = 'bastion';
  if (pattern === 4) {
    spawns[1].kind = 'fork';
    spawns[3].kind = band === 1 ? 'pulse' : 'well';
  }
  let link = null;
  if (band >= 2 && (pattern === 3 || ((theme === 2 || theme === 4) && rng() < 0.34))) {
    spawns[0].kind = spawns[2].kind = 'prism';
    link = { a: spawns[0].id, b: spawns[2].id, period: 238 + Math.floor(rng() * 43) };
  }
  return { id, cx, cy, pattern, spawns, link };
}
/** Live neighbourhood is at most 3×3 cells. Remember defeated primaries with
 * a bit mask until the lethal tide makes that row permanently unreachable. */
export function createStream(seed, enter, leave, staged = false) {
  const live = new Map(),
    cleared = new Map();
  function sync(p, line) {
    const { cx, cy } = cellAt(p),
      wanted = new Set();
    for (let y = Math.max(0, cy - 1); y <= cy + 1; y++)
      for (let x = cx - 1; x <= cx + 1; x++) {
        if (-(y + 1) * CELL_H > line + 80) continue;
        const k = `${x}:${y}`;
        wanted.add(k);
        if (live.has(k)) continue;
        const cell = makeCell(seed, x, y, staged);
        live.set(k, cell);
        const mask = cleared.get(k)?.mask || 0;
        for (const spec of cell.spawns) if (!(mask & (1 << spec.slot))) enter(spec);
      }
    for (const k of live.keys())
      if (!wanted.has(k)) {
        leave(k);
        live.delete(k);
      }
    for (const [k, rec] of cleared) if (-(rec.cy + 1) * CELL_H > line + 80) cleared.delete(k);
  }
  function mark(e) {
    if (e.slot < 0 || !live.has(e.home)) return;
    const rec = cleared.get(e.home) || { cy: live.get(e.home).cy, mask: 0 };
    rec.mask |= 1 << e.slot;
    cleared.set(e.home, rec);
  }
  return { sync, mark, live, cleared };
}
