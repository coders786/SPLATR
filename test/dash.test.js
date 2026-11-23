import test from 'node:test';
import Matter from 'matter-js';
import assert from 'node:assert/strict';
import {
  octant,
  OCTANT_NAMES,
  DASH,
  dashFor,
  ghostsFor,
  dashBurst,
  splatFor,
  SPLAT,
  GHOSTS,
} from '../src/animation.js';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';
import { installDom, createDisplay } from './support/display.js';

/* ══ THE DASH, ROTATION LOCKED AT ZERO ═════════════════════════════════════ */

/** THE GOLDEN RULE, stated as something a machine can check.
 *
 *  The cube may never rotate. Its rotation is locked at 0 degrees and its outer
 *  edges stay parallel to the screen axes at all times, diagonals included.
 *
 *  The right place to measure that is the TRANSFORM in force when the body is
 *  emitted, not the polygon's corner count. The body is a beveled hexagon by
 *  design, so it has six distinct x values even when perfectly upright; a test
 *  that counted corners would fail on a correct renderer and pass on a
 *  parallelogram. A 2D affine matrix `[a b c d e f]` is rotation-free exactly
 *  when its off-diagonal terms `b` and `c` are zero -- those two numbers ARE the
 *  rotation and the shear, and nothing else.
 */
function bodyMatrix(ctx) {
  const op = ctx.__ops.find(
    (o) =>
      o.kind === 'fill' &&
      o.pts.length === 6 &&
      String(o.paint).toLowerCase() === '#fff8ec',
  );
  return op ? op.m : null;
}

function boot() {
  const run = createRun(19, () => {}, { staged: true });
  if (run.skipOpening) run.skipOpening();
  run.state.phase = 'playing';
  for (let i = 0; i < 30; i++) run.tick();
  Object.assign(run.state, {
    landAge: -1,
    slashAge: -1,
    boom: null,
    hyper: false,
    hyperLevel: 0,
    hyperAge: 999,
    blade: 0,
  });
  return run;
}

const DIRS8 = {
  E: [120, 0],
  SE: [85, 85],
  S: [0, 120],
  SW: [-85, 85],
  W: [-120, 0],
  NW: [-85, -85],
  N: [0, -120],
  NE: [85, -85],
};

/* ── 1. the octant mapping ──────────────────────────────────────────────── */

test('all eight directions are named the way the screen shows them', () => {
  // Screen Y grows DOWNWARD, which is the whole reason this table has to be
  // spelled out: `atan2` in math convention runs counter-clockwise, so the
  // naive index names run backwards on a display. Measured before the fix:
  // N and S, NE and SE, NW and SW were all swapped.
  assert.equal(
    OCTANT_NAMES[octant(0, -1)],
    'N',
    'moving UP the screen is North',
  );
  assert.equal(
    OCTANT_NAMES[octant(0, 1)],
    'S',
    'moving DOWN the screen is South',
  );
  assert.equal(OCTANT_NAMES[octant(1, -1)], 'NE');
  assert.equal(OCTANT_NAMES[octant(1, 1)], 'SE');
  assert.equal(OCTANT_NAMES[octant(-1, 1)], 'SW');
  assert.equal(OCTANT_NAMES[octant(-1, -1)], 'NW');
  assert.equal(OCTANT_NAMES[octant(1, 0)], 'E');
  assert.equal(OCTANT_NAMES[octant(-1, 0)], 'W');
  // Every octant reachable, and no velocity maps outside the table.
  const seen = new Set();
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    seen.add(octant(Math.cos(t) * 40, Math.sin(t) * 40));
  }
  assert.equal(seen.size, 8, 'the eight octants must cover all eight headings');
});

test('the leading and trailing walls are the walls travel is heading for and leaving', () => {
  // Lighting the wrong wall on a diagonal is the single most visible way this
  // animation can lie, so each octant is checked against a literal table.
  const lead = {
    E: [1, 0],
    SE: [1, 1],
    S: [0, 1],
    SW: [-1, 1],
    W: [-1, 0],
    NW: [-1, -1],
    N: [0, -1],
    NE: [1, -1],
  };
  for (const [name, [vx, vy]] of Object.entries(DIRS8)) {
    const d = dashFor(4, vx, vy);
    // `+ 0` normalises -0 to 0. `Math.sign(-0)` and `Math.sign(0)` are both 0
    // but `Object.is(-0, 0)` is false, and `deepEqual` uses it -- so a correct
    // renderer with a -0 sign bit failed this assertion for a whole round.
    const norm = (v) => [v.x + 0, v.y + 0];
    assert.deepEqual(
      norm(d.lead),
      lead[name],
      `${name} lights the wrong leading wall`,
    );
    assert.deepEqual(
      norm(d.trail),
      lead[name].map((n) => -n + 0),
      `${name} trail is wrong`,
    );
  }
});

/* ── 2. the three phases ────────────────────────────────────────────────── */

test('the dash runs anticipation, active and recovery in that order, then ends', () => {
  const seen = [];
  for (let t = 0; t <= DASH.total; t++) {
    const f = dashFor(t, 120, 0);
    assert.ok(
      f,
      `no dash pose at tick ${t} -- the animation must cover its whole life`,
    );
    if (seen.at(-1) !== f.phase) seen.push(f.phase);
  }
  assert.deepEqual(
    seen,
    ['windup', 'active', 'recover'],
    'the three phases must be in order',
  );
  assert.equal(
    dashFor(DASH.total + 1, 120, 0),
    null,
    'the dash must END, not linger',
  );
  assert.equal(dashFor(-1, 120, 0), null, 'no dash before the counter starts');
});

test('anticipation compresses BACKWARD and pulls the core all the way back', () => {
  const a = dashFor(0, 120, 0);
  const b = dashFor(DASH.windup - 1, 120, 0);
  // Dashing right: thinner and taller, and it gets more so as the coil loads.
  assert.ok(
    a.sx < 1 && a.sy > 1,
    'the wind-up must squash along the dash axis, not across it',
  );
  assert.ok(b.sx < a.sx, `the coil must deepen, not relax: ${a.sx} -> ${b.sx}`);
  // The core is pulled AWAY from the direction of travel -- toward the wall it
  // is about to leave. Sign errors here are invisible at rest and obvious in
  // motion, which is exactly the class of bug worth pinning down.
  assert.ok(
    b.core.x < 0,
    `the core must be pulled back against an eastward dash, got ${b.core.x}`,
  );
  // The leading edge is already glowing: the wind-up IS the telegraph.
  assert.ok(
    a.leadGlow > 0.2 && b.leadGlow > a.leadGlow,
    'the leading wall must flash during the wind-up',
  );
});

test('the active dash stretches along travel and slams the core against the front wall', () => {
  const e = dashFor(DASH.windup + 2, 120, 0);
  assert.equal(e.phase, 'active');
  // East: wide and short. The stretch is on X because X is the way it moves.
  assert.ok(e.sx > 1.1, `an eastward dash must widen, got ${e.sx}`);
  assert.ok(e.sy < 0.95, `an eastward dash must thin vertically, got ${e.sy}`);
  // South: the same deformation, swapped onto the other axis.
  const s = dashFor(DASH.windup + 2, 0, 120);
  assert.ok(
    s.sy > 1.1 && s.sx < 0.95,
    'a southward dash must be the transpose of an eastward one',
  );
  // Core pinned FORWARD, into the leading wall, under G-force.
  assert.ok(e.core.x > 0.2, `the core must slam forward, got ${e.core.x}`);
  assert.ok(s.core.y > 0.2, 'and downward on a southward dash');
  // The back of the body dematerialises: the trailing wall breaks into dashes.
  assert.ok(
    e.trailBreak > 0.3,
    `the trailing wall must break apart, got ${e.trailBreak}`,
  );
  assert.ok(e.ghost > 0.9, 'the active phase must leave ghosts');
});

test('recovery brakes, overshoots and settles back to exactly 1:1', () => {
  const start = DASH.windup + DASH.active;
  const settled = dashFor(DASH.total, 120, 0);
  assert.equal(dashFor(start + 4, 120, 0).phase, 'recover');
  // The overshoot is the point: the back catches up and goes PAST rest, then
  // comes back from the other side. Sampling the whole phase is the only way to
  // assert that -- a single tick could sit at exactly 1:1 and prove nothing.
  let below = false,
    above = false;
  for (let t = start; t <= DASH.total; t++) {
    const sx = dashFor(t, 120, 0).sx;
    if (sx < 0.995) below = true;
    if (sx > 1.005) above = true;
  }
  assert.ok(
    above && below,
    `recovery must cross rest, not glide into it (above=${above} below=${below})`,
  );
  assert.ok(
    settled && Math.abs(settled.sx - 1) < 0.02,
    `the body must return to 1:1, got ${settled.sx}`,
  );
  assert.ok(Math.abs(settled.sy - 1) < 0.02, 'and on both axes');
  assert.ok(settled.core.x < 0.05, 'the core must re-centre');
});

test('the recovery never moves the body faster than the eye can follow', () => {
  // A settle that jumps is a pop, not a spring. This was measured as 0.293 in
  // one tick on the first attempt and read as a marionette string being pulled.
  const start = DASH.windup + DASH.active;
  let worst = 0;
  let prev = dashFor(start, 120, 0);
  for (let t = start + 1; t <= DASH.total; t++) {
    const f = dashFor(t, 120, 0);
    worst = Math.max(worst, Math.abs(f.sx - prev.sx), Math.abs(f.sy - prev.sy));
    prev = f;
  }
  assert.ok(
    worst < 0.16,
    `the recovery pops: worst single-tick step ${worst.toFixed(3)}`,
  );
});

test('a diagonal does NOT stretch along one screen axis', () => {
  // The first version stretched X and thinned Y for every direction, so a
  // south-east dash came out WIDE AND SHORT -- the silhouette of an EASTWARD
  // dash. A cube that looks like it is moving east while its trail goes
  // south-east is worse than no deformation at all.
  for (const name of ['SE', 'SW', 'NE', 'NW']) {
    const d = dashFor(DASH.windup + 2, ...DIRS8[name]);
    assert.ok(
      Math.abs(d.sx - d.sy) < 1e-9,
      `${name} must deform uniformly, got sx=${d.sx.toFixed(3)} sy=${d.sy.toFixed(3)}`,
    );
    assert.ok(
      d.sx > 1.02,
      `${name} should still read as pushing outward, got ${d.sx}`,
    );
  }
  // And the cardinal cases must still be anisotropic -- this is not a case of
  // "just make everything uniform".
  const e = dashFor(DASH.windup + 2, 120, 0);
  assert.ok(
    Math.abs(e.sx - e.sy) > 0.2,
    'a cardinal dash must still stretch one axis',
  );
});

/* ── 3. ghosts, particles, splat ────────────────────────────────────────── */

test('ghost trails are three silhouettes BEHIND the body, spaced far enough to read', () => {
  const d = dashFor(DASH.windup + 2, 120, 0);
  const g = ghostsFor(d);
  assert.equal(g.length, GHOSTS.count);
  assert.ok(g.length >= 3 && g.length <= 4, 'the brief asks for 3-4 ghosts');
  // Each one behind the last, all behind the body itself. Measured against the
  // body's own half-width: at R=23 and along=1.38 the body reaches 32px, so a
  // ghost at anything under 1.0 local units is drawn INSIDE the cube and reads
  // as a stripe rather than an echo.
  for (const gh of g) {
    assert.ok(
      Math.hypot(gh.x, gh.y) >= 1,
      `ghost at ${Math.hypot(gh.x, gh.y).toFixed(2)} is inside the body`,
    );
    assert.ok(gh.x < 0, 'an eastward dash must leave its ghosts to the west');
  }
  // Fading: nearer ghosts are stronger.
  assert.ok(
    g[0].alpha > g[1].alpha && g[1].alpha > g[2].alpha,
    'the trail must fade with age',
  );
  assert.ok(
    g[0].alpha < 0.5,
    'a ghost must be an after-image, not a second solid body',
  );
  // No ghosts before the body is moving, or once the dash is over.
  assert.equal(
    ghostsFor(dashFor(0, 120, 0)).length,
    0,
    'no ghosts during the wind-up',
  );
  assert.equal(ghostsFor(null).length, 0);
});

test('the ghost trail is the same length in all eight directions', () => {
  // `lead` is a SIGN PAIR, so on a diagonal it is sqrt(2) long. Used raw, the
  // diagonal ghosts sat 1.41x too far out and detached from the body.
  const lens = Object.keys(DIRS8).map((k) => {
    const g = ghostsFor(dashFor(DASH.windup + 2, ...DIRS8[k]));
    return Math.hypot(g[1].x, g[1].y);
  });
  const spread = Math.max(...lens) - Math.min(...lens);
  assert.ok(
    spread < 1e-9,
    `trail length varies by direction: ${lens.map((n) => n.toFixed(3))}`,
  );
});

test('launch dust is thrown off the trailing wall and braking sparks off the leading one', () => {
  const d = dashFor(DASH.windup, 120, 0);
  const dust = dashBurst(d, 'launch');
  const sparks = dashBurst(d, 'brake');
  assert.ok(dust.length >= 4, 'a launch needs a burst, not a single speck');
  assert.ok(sparks.length >= 4, 'braking needs a burst');
  // An eastward dash: dust goes WEST (behind), sparks go EAST (where the body
  // stopped). Opposite signs are the whole distinction between the two events.
  const dustMean = dust.reduce((n, p) => n + p.dx, 0) / dust.length;
  const sparkMean = sparks.reduce((n, p) => n + p.dx, 0) / sparks.length;
  assert.ok(
    dustMean < -0.2,
    `launch dust must be thrown backward, mean ${dustMean.toFixed(2)}`,
  );
  assert.ok(
    sparkMean > 0.2,
    `braking sparks must fly forward, mean ${sparkMean.toFixed(2)}`,
  );
  // Sparks are faster than dust -- that is what makes a brake snap.
  assert.ok(sparks[0].speed > dust[0].speed, 'sparks must outrun dust');
  // And the fan is symmetric about the axis, so the burst is not lopsided.
  const fans = dust.reduce((n, p) => n + p.dy, 0);
  assert.ok(Math.abs(fans) < 1e-9, `the fan must be symmetric, got ${fans}`);
});

test('the wall splat flattens against the wall, then dazes back to square', () => {
  // Hitting the FLOOR (normal points up, away from the wall): the body flattens
  // vertically and spreads horizontally, like a pancake on a ceiling.
  const hit = splatFor(0, { x: 0, y: -1 });
  assert.equal(hit.phase, 'pancake');
  assert.ok(
    hit.sy < 0.5,
    `the body must flatten against the floor, got ${hit.sy}`,
  );
  assert.ok(hit.sx > 1.2, `and bulge along it, got ${hit.sx}`);
  // A side wall does the transpose.
  const wall = splatFor(0, { x: -1, y: 0 });
  assert.ok(
    wall.sx < 0.5 && wall.sy > 1.2,
    'a side hit must flatten horizontally',
  );
  // The core is pressed INTO the wall, not left floating in the middle.
  assert.ok(wall.core.x > 0.3, 'the core must be pressed into the wall it hit');
  // It recovers, and it ends: no splat can outlive its own timeline.
  const daze = splatFor(SPLAT.total - 1, { x: 0, y: -1 });
  assert.equal(daze.phase, 'daze');
  assert.ok(daze.daze < 0.1, 'the daze must be over by the end');
  assert.ok(
    Math.abs(daze.sy - 1) < 0.1,
    `the body must come back square, got ${daze.sy}`,
  );
  assert.equal(splatFor(SPLAT.total, { x: 0, y: -1 }), null);
  // A normal of zero is not a contact, and must not produce a deformed body.
  assert.equal(splatFor(0, { x: 0, y: 0 }), null);
  assert.equal(splatFor(0, null), null);
});

test('a dash into a wall is interrupted, and touching a wall is not', () => {
  // ── DRIVEN THROUGH THE REAL CHANNEL ─────────────────────────────────────
  //
  // This test used to plant `world.contact` and call `tick()`. That worked only
  // because `contact` was a field that never cleared -- the sticky bug. It is
  // now the debounce MEMORY, and the per-tick EVENT is `world.struck`, which
  // `stepPhysics` clears at the top of every step by design.
  //
  // So fabricating the field cannot work any more, and fabricating it is the
  // weaker test anyway. This throws the cube at the real arena floor with a
  // live dash and asserts the arrival it actually produces.
  const run = boot();
  const { Body } = Matter,
    a = run.world.arena,
    p = run.world.player;
  p.position.x = 0;
  p.position.y = a.y + a.h - 120;
  run.state.slashAge = 3; // mid-dash: this is an interrupted dash, not a walk
  run.state.splat = null;
  run.world.struck = null;
  Body.setVelocity(p, { x: 0, y: 120 });
  let splatted = false;
  for (let i = 0; i < 20 && !splatted; i++) {
    run.tick();
    splatted = !!run.state.splat;
  }
  assert.ok(splatted, 'a dash into a rail must splat');
  // The splat expires on its own and clears itself; nothing has to remember.
  for (let i = 0; i < SPLAT.total + 2; i++) run.tick();
  assert.equal(run.state.splat, null, 'the splat must clear itself');
  // And a rail touch OUTSIDE the dash window is just a wall, not a splat.
  const walker = boot();
  walker.state.slashAge = -1;
  walker.state.splat = null;
  walker.world.player.position.x = 0;
  walker.world.player.position.y = a.y + a.h - 120;
  Matter.Body.setVelocity(walker.world.player, { x: 0, y: 120 });
  for (let i = 0; i < 20; i++) walker.tick();
  assert.equal(walker.state.splat, null, 'touching a wall is not a splat');
  walker.dispose();
  run.dispose();
});

/* ── 4. THE GOLDEN RULE, measured on the glass ──────────────────────────── */

test('the drawn body is never rotated: 8 directions, every dash tick', () => {
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const failures = [];
  for (const [name, [vx, vy]] of Object.entries(DIRS8)) {
    for (const age of [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20]) {
      const run = boot();
      run.world.player.velocity.x = vx;
      run.world.player.velocity.y = vy;
      run.state.slashAge = age;
      ctx.__reset();
      renderer.draw(run, 1, null, true, 'mouse');
      const m = bodyMatrix(ctx);
      if (!m) {
        failures.push(`${name}@${age}: body not drawn`);
      } else if (Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6) {
        failures.push(
          `${name}@${age}: b=${m[1].toFixed(4)} c=${m[2].toFixed(4)}`,
        );
      }
      run.dispose();
    }
  }
  assert.deepEqual(
    failures.slice(0, 5),
    [],
    `the cube rotated: ${failures.slice(0, 5).join('; ')}`,
  );
});

test('the drawn body stays axis-aligned through impacts, swings, splats and hyper', () => {
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const failures = [];
  const cases = [
    ['impact', { impact: { speed: 90, nx: 0, ny: -1 }, impactAge: 1 }],
    ['blade', { blade: 6, slashAngle: 0.8, swingStart: 0 }],
    ['blade+dash', { blade: 6, slashAngle: 0.8, swingStart: 0, slashAge: 4 }],
    ['hyper', { hyper: true, hyperLevel: 1, hyperAge: 40 }],
    ['splat', { splat: { age: 1, nx: 0, ny: 1 } }],
    ['daze', { splat: { age: 8, nx: -1, ny: 0 } }],
  ];
  for (const [name, [vx, vy]] of Object.entries(DIRS8)) {
    for (const [tag, extra] of cases) {
      const run = boot();
      // `splat` is the only state a test may write directly: it is a plain
      // description of a contact, not a simulation result.
      run.world.player.velocity.x = vx;
      run.world.player.velocity.y = vy;
      run.state.slashAge = -1;
      run.state.splat = null;
      Object.assign(run.state, extra);
      ctx.__reset();
      renderer.draw(run, 1, null, true, 'mouse');
      const m = bodyMatrix(ctx);
      if (!m || Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6) {
        failures.push(
          `${name}/${tag}: ${m ? `b=${m[1].toFixed(4)} c=${m[2].toFixed(4)}` : 'not drawn'}`,
        );
      }
      run.dispose();
    }
  }
  assert.deepEqual(failures, [], `the cube rotated: ${failures.join('; ')}`);
});

test('the ghosts the renderer draws are axis-aligned too', () => {
  // A rotated after-image would imply the body had rotated even if it had not,
  // so the ghosts get the same invariant as the body. They are flat fills of the
  // body's own six-point bevel, emitted in paper.
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = boot();
  run.world.player.velocity.x = 120;
  run.world.player.velocity.y = 0;
  run.state.slashAge = DASH.windup + 2;
  ctx.__reset();
  renderer.draw(run, 1, null, true, 'mouse');
  const ghosts = ctx.__ops.filter(
    (o) =>
      o.kind === 'fill' &&
      o.pts.length === 6 &&
      String(o.paint).toLowerCase() === '#fff8ec' &&
      o.alpha < 0.6,
  );
  assert.ok(
    ghosts.length >= 3,
    `expected at least 3 ghost fills, found ${ghosts.length}`,
  );
  for (const g of ghosts) {
    assert.ok(
      Math.abs(g.m[1]) < 1e-6 && Math.abs(g.m[2]) < 1e-6,
      `a ghost is rotated: b=${g.m[1].toFixed(4)} c=${g.m[2].toFixed(4)}`,
    );
  }
  run.dispose();
});

/* ── 5. the shape actually REACHES the glass ─────────────────────────────── */

/**
 * A deformation that is computed but never drawn passes every test that only
 * reads the pose. This round shipped exactly that: the wall splat was wired
 * with the wrong normal field, `splatFor` correctly refused to splat, and the
 * body still came out as a plain 54x50 square. Nothing noticed, because no test
 * asserted SIZE at the glass.
 *
 * These read the body's own bounding box from the recorded frame.
 */
function bodyBox(ctx) {
  const op = ctx.__ops.find(
    (o) =>
      o.kind === 'fill' &&
      o.pts.length === 6 &&
      String(o.paint).toLowerCase() === '#fff8ec',
  );
  if (!op) return null;
  const xs = op.pts.map((q) => q[0]),
    ys = op.pts.map((q) => q[1]);
  return {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

test('the dash deformations are MOVING THE PIXELS, not just the pose', () => {
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const shot = (vx, vy, age, splat = null) => {
    const run = boot();
    run.world.player.velocity.x = vx;
    run.world.player.velocity.y = vy;
    run.state.slashAge = age;
    run.state.splat = splat;
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    const b = bodyBox(ctx);
    run.dispose();
    return b;
  };
  const rest = shot(0, 0, -1);
  assert.ok(rest && rest.w > 30, 'the rest body must be on screen');

  // EAST: wider and shorter than rest.
  const e = shot(120, 0, DASH.windup + 2);
  assert.ok(
    e.w > rest.w * 1.1,
    `an eastward dash did not widen: ${rest.w.toFixed(1)} -> ${e.w.toFixed(1)}`,
  );
  assert.ok(
    e.h < rest.h * 0.95,
    `an eastward dash did not thin: ${rest.h.toFixed(1)} -> ${e.h.toFixed(1)}`,
  );

  // SOUTH: the transpose. If the axis mapping is wrong these are the same
  // numbers as the east case, which is the bug that shipped once already.
  const s = shot(0, 120, DASH.windup + 2);
  assert.ok(
    s.h > rest.h * 1.1,
    `a southward dash did not heighten: ${rest.h.toFixed(1)} -> ${s.h.toFixed(1)}`,
  );
  assert.ok(
    s.w < rest.w * 0.95,
    `a southward dash did not narrow: ${rest.w.toFixed(1)} -> ${s.w.toFixed(1)}`,
  );

  // WIND-UP: the opposite of the dash, on the same axis. Thinner, taller.
  const w = shot(120, 0, DASH.windup - 1);
  assert.ok(
    w.w < rest.w,
    `the wind-up must squish backward: ${rest.w.toFixed(1)} -> ${w.w.toFixed(1)}`,
  );
  assert.ok(
    w.h > rest.h,
    `and grow taller: ${rest.h.toFixed(1)} -> ${w.h.toFixed(1)}`,
  );

  // SPLAT against the floor: flat, and wide.
  const flat = shot(0, 0, -1, { age: 1, nx: 0, ny: 1 });
  assert.ok(
    flat.h < rest.h * 0.55,
    `the wall splat never reached the glass: ${rest.h.toFixed(1)} -> ${flat.h.toFixed(1)} (this is what the wrong normal field looked like)`,
  );
  assert.ok(
    flat.w > rest.w * 1.2,
    `and it must spread along the wall: ${rest.w.toFixed(1)} -> ${flat.w.toFixed(1)}`,
  );
});

test('the ghost after-images are drawn, behind the body, and fade out', () => {
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = boot();
  run.world.player.velocity.x = 120;
  run.world.player.velocity.y = 0;
  run.state.slashAge = DASH.windup + 2;
  ctx.__reset();
  renderer.draw(run, 1, null, true, 'mouse');
  const body = bodyBox(ctx);
  const ghosts = ctx.__ops.filter(
    (o) =>
      o.kind === 'fill' &&
      o.pts.length === 6 &&
      String(o.paint).toLowerCase() === '#fff8ec' &&
      o.alpha < 0.6,
  );
  assert.ok(
    ghosts.length >= 3,
    `the ghosts were not drawn at all (found ${ghosts.length})`,
  );
  // The body's centre, measured this frame. Ghosts of an EASTWARD dash must all
  // sit to the WEST of it -- drawn behind, never in front.
  const bodyOp = ctx.__ops.find(
    (o) =>
      o.kind === 'fill' &&
      o.pts.length === 6 &&
      String(o.paint).toLowerCase() === '#fff8ec' &&
      o.alpha >= 0.6,
  );
  const bx =
    (Math.min(...bodyOp.pts.map((q) => q[0])) +
      Math.max(...bodyOp.pts.map((q) => q[0]))) /
    2;
  assert.ok(body, 'the body must be on screen');
  for (const g of ghosts) {
    const xs = g.pts.map((q) => q[0]);
    const gx = (Math.min(...xs) + Math.max(...xs)) / 2;
    assert.ok(
      gx < bx,
      `a ghost is in FRONT of the body: ${gx.toFixed(1)} vs ${bx.toFixed(1)}`,
    );
  }
  run.dispose();
});

test('the launch and the brake both throw particles onto the glass', () => {
  // `dashBurst` returning the right vectors proves the CHOREOGRAPHY, not that
  // anything was drawn. This counts the small rects actually emitted around the
  // cube, which is the only evidence the player has.
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = boot();
  const body = run.world.player;
  const s = run.state;
  const count = (age) => {
    s.slashAge = age;
    renderer.tick(run, true);
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    const b = ctx.__ops.find(
      (o) =>
        o.kind === 'fill' &&
        o.pts.length === 6 &&
        String(o.paint).toLowerCase() === '#fff8ec',
    );
    const bx =
      (Math.min(...b.pts.map((q) => q[0])) +
        Math.max(...b.pts.map((q) => q[0]))) /
      2;
    const by =
      (Math.min(...b.pts.map((q) => q[1])) +
        Math.max(...b.pts.map((q) => q[1]))) /
      2;
    return ctx.__ops
      .filter((o) => o.kind === 'rect' && o.pts.length === 2)
      .filter((o) => {
        const P = o.pts;
        const w = Math.abs(P[1][0] - P[0][0]),
          h = Math.abs(P[1][1] - P[0][1]);
        const cx = (P[0][0] + P[1][0]) / 2,
          cy = (P[0][1] + P[1][1]) / 2;
        return (
          w < 60 &&
          h < 60 &&
          w > 0.5 &&
          h > 0.5 &&
          Math.hypot(cx - bx, cy - by) < 120
        );
      }).length;
  };
  body.velocity.x = 0;
  body.velocity.y = 0;
  const rest = count(-1);
  body.velocity.x = 120;
  const windup = count(1);
  assert.equal(
    windup,
    rest,
    'the wind-up is a coil: it must not throw debris yet',
  );
  const launch = count(DASH.windup);
  assert.ok(launch > rest + 3, `no dust on launch: ${rest} -> ${launch} rects`);
  const brake = count(DASH.windup + DASH.active);
  assert.ok(
    brake > rest + 6,
    `no sparks on braking: ${rest} -> ${brake} rects`,
  );
  run.dispose();
});

test('drawn airborne cube stays within 1.25x and is square within five recovery ticks', () => {
  installDom();
  const { canvas, ctx } = createDisplay(1560, 866);
  const renderer = createRenderer(canvas);
  const run = boot();
  const sample = (age, vx, vy, hyper = false) => {
    Object.assign(run.state, {
      slashAge: age,
      landAge: -1,
      impact: null,
      splat: null,
      hyper,
      hyperLevel: hyper ? 3 : 0,
    });
    run.world.player.velocity.x = vx;
    run.world.player.velocity.y = vy;
    ctx.__reset();
    renderer.draw(run, 1, null, true, 'mouse');
    const op = ctx.__ops.find(
      (o) =>
        o.kind === 'fill' &&
        o.pts.length === 6 &&
        String(o.paint).toLowerCase() === '#fff8ec' &&
        o.alpha >= 0.6,
    );
    assert.ok(op, 'opaque player body must be drawn');
    const xs = op.pts.map((p) => p[0]),
      ys = op.pts.map((p) => p[1]);
    return {
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  };
  try {
    const rest = sample(-1, 0, 0);
    for (const [vx, vy] of [
      [120, 0],
      [0, 120],
      [85, 85],
      [280, 0],
      [198, -198],
    ]) {
      for (let age = 0; age <= 20; age++) {
        const box = sample(age, vx, vy, true);
        assert.ok(
          box.w / rest.w <= 1.251 && box.h / rest.h <= 1.251,
          `compounded body exceeded cap: age=${age} size=${box.w / rest.w},${box.h / rest.h}`,
        );
        if (age >= 12) {
          assert.ok(
            Math.abs(box.w / rest.w - 1) < 0.001 &&
              Math.abs(box.h / rest.h - 1) < 0.001,
            `body did not reset at age=${age}`,
          );
        }
      }
    }
  } finally {
    run.dispose();
    renderer.dispose();
  }
});

test('dash deformation and core remain continuous across phase transitions',()=>{
 for(let direction=0;direction<8;direction++){
  const a=direction*Math.PI/4,vx=42*Math.cos(a),vy=42*Math.sin(a);
  for(const boundary of [DASH.windup,DASH.windup+DASH.active]){
   const before=dashFor(boundary-1e-7,vx,vy),after=dashFor(boundary,vx,vy);
   for(const key of ['sx','sy','leadGlow','trailBreak'])assert.ok(Math.abs(before[key]-after[key])<1e-4,`${key} pops at ${boundary}`);
   for(const axis of ['x','y'])assert.ok(Math.abs(before.core[axis]-after.core[axis])<1e-4,`core.${axis} pops at ${boundary}`);
  }
 }
});

test('dash particles do not age or move when a frame is drawn repeatedly without a tick',()=>{
 installDom();const {canvas,ctx}=createDisplay(1560,866),renderer=createRenderer(canvas),run=boot();
 run.world.player.velocity.x=120;run.world.player.velocity.y=0;run.state.slashAge=DASH.windup;
 renderer.tick(run,true);
 const frame=()=>{ctx.__reset();renderer.draw(run,1,null,true,'mouse');return ctx.__ops.filter(o=>o.kind==='rect'&&(o.paint==='#deff52'||o.paint==='#fff8ec')&&o.pts.length===2).map(o=>({paint:o.paint,alpha:o.alpha,pts:o.pts}));};
 try{const first=frame(),second=frame();assert.ok(first.length>3);assert.deepEqual(second,first);}finally{renderer.dispose();run.dispose();}
});

test('draw interpolates the dash pose between simulation ticks without rotating the body',()=>{
 installDom();const {canvas,ctx}=createDisplay(1560,866),renderer=createRenderer(canvas),run=boot();
 run.world.player.velocity.x=42;run.world.player.velocity.y=0;run.state.slashAge=3;
 const sample=alpha=>{ctx.__reset();renderer.draw(run,alpha,null,true,'mouse');return bodyMatrix(ctx);};
 try{
  const start=sample(0),mid=sample(.5),end=sample(1);
  assert.ok(start&&mid&&end);assert.ok(Math.abs(start[0]-end[0])>.01,'scale must progress within a tick');
  assert.ok(mid[0]>Math.min(start[0],end[0])&&mid[0]<Math.max(start[0],end[0]),'intermediate frame must lie between endpoints');
  for(const m of [start,mid,end]){assert.ok(Math.abs(m[1])<1e-9);assert.ok(Math.abs(m[2])<1e-9);}
 }finally{renderer.dispose();run.dispose();}
});
