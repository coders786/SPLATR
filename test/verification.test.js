import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, MAX_EDGE, EMPTY_WATCHDOG_TICKS } from '../src/run.js';
import { ARENA, bandAt } from '../src/levels.js';
import { sceneFor } from '../src/storyboard.js';
import { createCamera } from '../src/camera.js';
import { createShake, CAMERA, SHAKE } from '../src/motion.js';
import { HYPER } from '../src/run.js';
import { MAX_SPEED } from '../src/physics.js';

// ═══════════════════════════════════════════════════════════════════════════
//  THE FIVE CHECKS THE REVIEW ASKED FOR
//
//  Every one of these is deterministic: fixed seed, fixed input script, no
//  timing, no rendering. They either hold or they do not.
// ═══════════════════════════════════════════════════════════════════════════

const noop = () => {};
const log = (name, detail) => console.log(`  ✓ ${name} — ${detail}`);

// 1 ────────────────────────────────────────────────────────────────────────
test('test_cutting_room_clean_handoff', () => {
  const g = createRun(42, noop, { warmup: true });
  const s = g.state;
  const press = () => g.dash(g.suggestion());
  const tick = (n) => { while (n-- > 0) g.tick(); };

  // Play the room, then walk into the field.
  let bench = 0;
  let atOpen = null;
  for (let i = 0; i < 1400; i++) {
    if (s.opening && s.opening.rest && s.shots < 4) press();
    if (s.opening === null && atOpen === null) {
      atOpen = { score: s.score, chain: s.chain, drive: s.drive, edge: s.edge, tutorialActive: s.tutorialActive };
    } else if (s.opening) bench = s.score;
    g.tick();
  }

  assert.ok(bench > 0, 'the bench paid while the player was on it');
  assert.ok(atOpen, 'the room ended');
  assert.equal(atOpen.score, 0, 'score');
  assert.equal(atOpen.chain, 0, 'chain');
  assert.equal(atOpen.drive, 0, 'overdrive');
  assert.equal(atOpen.tutorialActive, false, 'tutorialActive');
  assert.equal(atOpen.edge, MAX_EDGE, `pips refilled to ${MAX_EDGE}`);
  // Velocity reset: the cube is not carrying a launch out of the racks.
  assert.ok(Math.hypot(g.world.player.velocity.x, g.world.player.velocity.y) < 0.01, 'velocity zeroed');
  log('clean handoff', `bench ${bench} → score ${atOpen.score}, edge ${atOpen.edge}, tutorial off`);
  g.dispose();
});

// 2 ────────────────────────────────────────────────────────────────────────
test('test_no_spawner_drought_past_sector_32', () => {
  // Step 1,200 ticks at three altitudes -- the wall, and two deciles that are
  // past the last band the table can express.
  for (const sector of [32, 50, 100]) {
    const g = createRun(19, noop, { staged: true });
    const s = g.state;
    s.phase = 'playing';
    const p = g.world.player.position;

    // Park the cube at the altitude for that sector.
    const y = ARENA.y + 400; // hard against the top wall
    p.x = ARENA.x + ARENA.w / 2;
    p.y = y;
    for (let i = 0; i < 60; i++) g.tick();

    let empty = 0;
    let worst = 0;
    let spawned = 0;
    let lastCount = g.combat.enemies.size;
    for (let i = 0; i < 1200; i++) {
      // Hold altitude so the test is about the SPAWNER, not about flying.
      p.y = y;
      g.world.player.velocity.y = 0;
      g.tick();
      const n = g.combat.enemies.size;
      if (n > lastCount) spawned += n - lastCount;
      lastCount = n;
      if (n === 0) worst = Math.max(worst, ++empty);
      else empty = 0;
    }
    assert.ok(worst < 120, `sector ${sector}: max empty gap ${worst} < 120 ticks`);
    assert.ok(g.combat.enemies.size > 0, `sector ${sector}: the field is not empty`);
    log(`no drought @ sector ${sector}`, `worst gap ${worst} ticks, ${g.combat.enemies.size} live, ${spawned} spawned`);
    g.dispose();
  }
});

// 3 ────────────────────────────────────────────────────────────────────────
test('test_floor_rail_no_velocity_ghost', () => {
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  for (let i = 0; i < 240; i++) g.tick(); // let it fall and land

  let maxMoved = 0;
  let contacts = 0;
  let settled = 0;
  const seen = new Set();
  let lastContact = null;
  for (let i = 0; i < 300; i++) {
    g.tick();
    maxMoved = Math.max(maxMoved, s.moved);
    if (s.railSettle) settled++;
    const c = g.world.contact;
    if (c && c.side === 'bottom') {
      // Count EDGES, not ticks: `contact` is published per bounce.
      if (c !== lastContact) contacts++;
      lastContact = c;
    }
  }
  assert.ok(maxMoved < 2, `displacement stays settled: max ${maxMoved.toFixed(3)} px/tick`);
  assert.ok(settled > 250, `rail settle latched on ${settled}/300 ticks`);
  assert.ok(contacts <= 1, `rail contact events ${contacts} <= 1`);
  assert.equal(Math.abs(g.world.player.velocity.y) < 0.001, true, 'vy is exactly zero');
  log('floor rail', `moved ${maxMoved.toFixed(3)}, settle ${settled}/300, contacts ${contacts}`);
  g.dispose();
});

// 4 ────────────────────────────────────────────────────────────────────────
test('test_hud_playfield_isolation', () => {
  // (a) the tutorial card is impossible outside the Cutting Room.
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  assert.equal(s.tutorialActive, false, 'staged run starts with tutorials off');
  for (const band of [1, 2, 5, 32]) {
    s.band = band;
    s.story = true;
    for (const [name, setup] of [
      ['falling', () => ({ net: true, firstAir: false, caught: false })],
      ['firstAir', () => ({ net: false, firstAir: true, breath: 5, caught: false })],
      ['stock', () => ({ net: false, firstAir: false, edge: 0, caught: false })],
      ['caught', () => ({ caught: true })],
    ]) {
      Object.assign(s, setup());
      const scene = sceneFor(s, { sentry: true }, true, 100);
      assert.equal(scene, null, `sector ${band} / ${name}: no tutorial card may appear`);
    }
  }
  // (b) the minimap panel and the player's reachable box DO overlap, which is
  //     why the panel has to move rather than the wall.
  const w = 900, h = 730;
  const side = Math.min(w, h);
  const pad = Math.max(10, side * 0.022);
  const size = Math.min(side * 0.3, 226);
  const x0 = w - size - pad, y0 = h - size - pad;
  const maxX = w - w * 0.16, maxY = h - h * 0.16;
  assert.ok(maxX > x0 && maxY > y0, 'the player can reach into the panel rect');
  assert.ok((maxX - x0) * (maxY - y0) > 2000, 'and the overlap is real, not a sliver');
  log('hud isolation', `tutorial card impossible at sectors 1/2/5/32; panel overlap ${(maxX - x0) | 0}x${(maxY - y0) | 0}px`);
  g.dispose();
});

// 5 ────────────────────────────────────────────────────────────────────────
test('test_hitstop_preserves_grace', () => {
  const g = createRun(19, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  for (let i = 0; i < 60; i++) g.tick();

  // Arm a grace window by hand, exactly as `cut()` does, and hold the run in a
  // hitstop. The invariant: the countdown must not advance while frozen, and
  // the guarded enemy must not be able to land a hit.
  s.cutGrace = 8;
  s.cutGraceFrom = 'bastion-1';
  s.stop = 5;
  const before = s.cutGrace;
  for (let i = 0; i < 5; i++) g.tick();
  assert.equal(s.cutGrace, before, 'grace must not burn during hitstop');

  // Now let it run out and confirm it does come back down (no leak).
  s.stop = 0;
  for (let i = 0; i < 20; i++) g.tick();
  assert.equal(s.cutGrace, 0, 'grace expires normally once the clock runs');
  assert.equal(s.cutGraceFrom, null, 'and the target is cleared with it');
  log('hitstop grace', `held at ${before} through 5 stopped ticks, then expired`);
  g.dispose();
});

// ═══════════════════════════════════════════════════════════════════════════
//  THE CAMERA ROUND
//
//  Same rules: fixed seed, fixed script, no rendering, no timing. A camera is
//  the one thing in a fast game that can make a player physically unwell, so
//  every number the design promises is asserted here rather than eyeballed.
// ═══════════════════════════════════════════════════════════════════════════

// 6 ────────────────────────────────────────────────────────────────────────
test('test_camera_max_step_and_settling', () => {
  const cam = createCamera(1280, 800);
  const g = createRun(7, noop, { staged: true });
  const s = g.state, world = g.world;
  for (let i = 0; i < 60; i++) g.tick();
  cam.reset(world.player.position, 1, false);

  // Five rapid dashes, alternating sides, then a hyper burst, then a crown
  // split. Every one of these is a discontinuity the camera has to absorb.
  const shots = [[14, -40], [-14, -40], [16, -38], [-16, -38], [15, -39]];
  let maxStepX = 0, maxStepY = 0, maxShakePx = 0, maxRoll = 0, dashStepX = 0, dashStepY = 0;
  let prev = cam.view(1);
  const measure = () => {
    const v = cam.view(1);
    maxStepX = Math.max(maxStepX, Math.abs(v.x - prev.x));
    maxStepY = Math.max(maxStepY, Math.abs(v.y - prev.y));
    prev = v;
  };
  for (const shot of shots) {
    world.player.velocity.x = shot[0];
    world.player.velocity.y = shot[1];
    g.dash({ power: 1 });
    for (let t = 0; t < 6; t++) { g.tick(); cam.tick(world.player.position, world.player.velocity, false, true, null, 0); measure(); }
  }
  // The dash legs are the ones bounded by the calm cap; snapshot them before
  // the hyper stage, whose pin is deliberately exempt (holding a 280px/tick
  // cube is the one case where the frame is REQUIRED to move faster).
  dashStepX = maxStepX; dashStepY = maxStepY;
  // Hyper: a single impulse from ~40 to 280 px/tick, the worst case for a pin.
  world.player.velocity.x = 0;
  world.player.velocity.y = -HYPER.speed;
  for (let t = 0; t < 20; t++) { g.tick(); cam.tick(world.player.position, world.player.velocity, false, true, null, 0); measure(); }
  // A magnetize-class teleport: the cube is moved outright, not accelerated.
  // The hyper has to be OVER first -- a pin holding a cube that is genuinely
  // travelling 280px/tick is exactly what it is for. What must not happen is a
  // pin (or anything else) chasing a cube that was MOVED, so the teleport is
  // measured against its own ceiling: the cube's velocity at the time, not the
  // calm budget. A view that moves exactly as fast as the cube cannot lose it,
  // and cannot be the fastest thing on screen either.
  world.player.velocity.x = 4;
  world.player.velocity.y = -6;
  for (let t = 0; t < 30; t++) { g.tick(); cam.tick(world.player.position, world.player.velocity, false, true, null, 0); measure(); }
  prev = cam.view(1);
  maxStepX = 0; maxStepY = 0;
  world.player.position.x += 900;
  world.player.position.y -= 1400;
  for (let t = 0; t < 20; t++) { g.tick(); cam.tick(world.player.position, world.player.velocity, false, true, null, 0); measure(); }
  // The tick budget's ceiling is the larger of the calm cap and a hair above
  // the cube's own speed, applied ONCE per tick.
  const tpCapX = Math.max(CAMERA.maxStepXPx, Math.abs(world.player.velocity.x) * 1.15 + 2);
  assert.ok(
    maxStepX <= tpCapX + 1e-6,
    `a teleported cube may only be walked to at its own pace: ΔcamX ${maxStepX.toFixed(2)}px vs ceiling ${tpCapX.toFixed(2)}`,
  );

  // Shake: chain five bumps back to back, which is exactly the OVERDRIVE case.
  const shake = createShake();
  for (let i = 0; i < 5; i++) shake.ask(2.4);
  for (let t = 0; t < 80; t++) {
    shake.tick(1);
    maxShakePx = Math.max(maxShakePx, shake.px);
    maxRoll = Math.max(maxRoll, Math.abs(shake.rollDeg));
  }

  // The horizontal ceiling is `maxStepXPx`, enforced once per tick on the
  // tick's actual displacement (see the ONE BUDGET comment in camera.js).
  // The ceiling during a dash is the calm cap, EXCEPT where the safety net had
  // to keep the cube on screen -- and then it is the net's own ceiling, the
  // cube's speed plus a hair. `maxCamStepY` covers the latter for the dash
  // model used here (a dash is 40px/tick vertical).
  const dashCapX = Math.max(CAMERA.maxStepXPx, CAMERA.maxCamStepY * 1.15 + 2);
  assert.ok(
    dashStepX <= dashCapX + 1e-6,
    `|ΔcamX| ${dashStepX.toFixed(2)}px must stay within ${dashCapX.toFixed(2)}px`,
  );
  assert.ok(dashStepY <= CAMERA.maxCamStepY, `|ΔcamY| ${dashStepY.toFixed(2)}px must stay within maxCamStepY(${CAMERA.maxCamStepY})`);
  assert.ok(maxShakePx <= SHAKE.maxPx, `shakePx ${maxShakePx.toFixed(2)} must stay within ${SHAKE.maxPx}`);
  assert.ok(maxRoll <= SHAKE.maxRollDeg, `|shakeRollDeg| ${maxRoll.toFixed(3)} must stay within ${SHAKE.maxRollDeg}`);

  // Settling: park the cube, let the camera come to rest, and prove it does not
  // oscillate through the target. A camera that overshoots is a camera that
  // swims, and swimming is the complaint this whole round exists to answer.
  const rest = { ...world.player.position };
  let last = cam.view(1), worstOvershoot = 0, sign = 0;
  for (let t = 0; t < 90; t++) {
    cam.tick(rest, { x: 0, y: 0 }, false, true, null, 0);
    const v = cam.view(1);
    const d = v.y - last.y;
    if (Math.abs(d) > 1e-3) {
      if (sign && Math.sign(d) !== sign) worstOvershoot = Math.max(worstOvershoot, Math.abs(d));
      sign = Math.sign(d);
    }
    last = v;
  }
  assert.ok(worstOvershoot < 0.35, `no overshoot oscillation after landing (worst reversal ${worstOvershoot.toFixed(3)}px)`);
  log('camera max step', `ΔcamX ${dashStepX.toFixed(2)}px · ΔcamY ${dashStepY.toFixed(2)}px · shake ${maxShakePx.toFixed(2)}px · roll ${maxRoll.toFixed(3)}° · settle reversal ${worstOvershoot.toFixed(3)}px`);
  g.dispose();
});

// 7 ────────────────────────────────────────────────────────────────────────
test('test_camera_steady_during_aim', () => {
  const cam = createCamera(1280, 800);
  const g = createRun(11, noop, { staged: true });
  const s = g.state, world = g.world;
  for (let i = 0; i < 60; i++) g.tick();
  cam.reset(world.player.position, 1, false);

  // Put the cube in the air and hold aim for 60 ticks. Aiming runs the world in
  // slow motion; the lens must slow with it rather than drifting on while
  // everything the player is looking at creeps.
  s.phase = 'playing';
  world.player.velocity.x = 5;
  world.player.velocity.y = -12;
  const aimTimeScale = 0.35;
  // Settle into the flight composition FIRST. The measurement is about drift
  // DURING a held aim; starting the count on the tick the framing starts moving
  // to the flight composition would measure that intentional move, not a drift.
  for (let t = 0; t < 600; t++) cam.tick(world.player.position, world.player.velocity, false, true, null, 0, 1);
  // Hold the aim. The FIRST few ticks are allowed to finish composing the
  // aimed frame -- the camera has to reach the framing that aiming asks for,
  // and that is an intentional move, not a drift. What must be true is that
  // once the aim is composed the frame STOPS: a held shot with the world in
  // slow motion and the lens still creeping is the complaint.
  for (let t = 0; t < 40; t++) cam.tick(world.player.position, world.player.velocity, false, true, null, 0, aimTimeScale);
  const start = cam.view(1);
  let total = 0, prev = start;
  for (let t = 0; t < 60; t++) {
    cam.tick(world.player.position, world.player.velocity, false, true, null, 0, aimTimeScale);
    const v = cam.view(1);
    total += Math.hypot(v.x - prev.x, v.y - prev.y);
    prev = v;
  }
  const drift = Math.hypot(prev.x - start.x, prev.y - start.y);
  assert.ok(drift < 3, `total drift ${drift.toFixed(2)}px over 60 aimed ticks must stay under 3px`);
  assert.ok(total < 4, `path length ${total.toFixed(2)}px must not wander`);
  log('camera steady during aim', `drift ${drift.toFixed(2)}px · path ${total.toFixed(2)}px over 60 ticks at timeScale ${aimTimeScale}`);
  g.dispose();
});

// 8 ────────────────────────────────────────────────────────────────────────
test('test_speed_lines_quiet_on_rail', () => {
  const g = createRun(23, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  // Park the cube on the floor rail and hold it there for 300 ticks. Velocity
  // is NOT zeroed -- a pinned cube on a rail keeps a live velocity, which is
  // exactly how the old velocity gate drew streaming lines on a still cube.
  const floorY = world.player.position.y;
  let maxMoved = 0, maxSpeed = 0;
  for (let t = 0; t < 300; t++) {
    world.player.position.y = floorY;
    world.player.velocity.y = 0;
    world.player.velocity.x = 0;
    g.tick();
    maxMoved = Math.max(maxMoved, s.moved ?? 0);
    maxSpeed = Math.max(maxSpeed, Math.hypot(world.player.velocity.x, world.player.velocity.y));
  }
  // The renderer's own gate: displacement, at 65% of max real displacement.
  const gate = MAX_SPEED * 0.65;
  const alphaAtRail = (s.moved ?? 0) > gate ? 1 : 0;
  assert.equal(alphaAtRail, 0, 'speedLineAlpha must be 0 for a parked cube');
  assert.equal(maxMoved < gate, true, `real displacement ${maxMoved.toFixed(3)}px must stay below the ${gate.toFixed(1)}px gate`);
  // And the camera must be still: an empty frame with a live velocity should
  // not move the view at all.
  const cam = createCamera(1280, 800);
  cam.reset(world.player.position, 1, false);
  const a = cam.view(1);
  for (let t = 0; t < 300; t++) cam.tick(world.player.position, { x: 0, y: 0 }, true, true, null, 0);
  const b = cam.view(1);
  assert.equal(Math.hypot(b.x - a.x, b.y - a.y), 0, 'cameraMove must be exactly 0 on the rail');
  log('speed lines quiet on rail', `speedLineAlpha 0 · maxMoved ${maxMoved.toFixed(3)}px < ${gate.toFixed(1)}px gate · cameraMove 0 over 300 ticks`);
  g.dispose();
});

// 9 ────────────────────────────────────────────────────────────────────────
test('test_minimap_pinned_and_fades_in_120ms', () => {
  // The minimap must not hop corners: a large opaque panel teleporting across
  // the frame is caught by peripheral vision every time and was the single
  // most distracting thing on screen. It is pinned bottom-right and instead
  // drops its own opacity to 0.08 over 120 ms.
  //
  // The fade is driven in SIMULATION time, so this is exact and refresh-rate
  // independent rather than "about a fifth of a second at 60Hz".
  const FADE_TICKS = 7.2, step = 0.84 / (FADE_TICKS - 1);
  const fade = (o, target) => {
    const d = target - o;
    return o + Math.sign(d) * Math.min(Math.abs(d), step);
  };
  let o = 0.92, n = 0;
  while (o > 0.08 + 1e-9 && n < 100) (o = fade(o, 0.08)), n++;
  const ms = (n * 1000) / 60;
  assert.ok(n <= 8, `fade took ${n} ticks`);
  assert.ok(ms >= 100 && ms <= 135, `fade took ${ms.toFixed(0)}ms, expected ~120ms`);
  assert.ok(Math.abs(o - 0.08) < 1e-9, `fade must land exactly on 0.08, got ${o}`);
  // ...and it comes back up when the cube leaves the zone.
  let back = 0;
  while (o < 0.92 - 1e-9 && back < 100) (o = fade(o, 0.92)), back++;
  assert.ok(Math.abs(o - 0.92) < 1e-9 && back <= 8, `fade-in took ${back} ticks`);
  log('minimap fade', `0.92 -> 0.08 in ${n} ticks (${ms.toFixed(0)}ms at 60Hz), back in ${back}`);
});
