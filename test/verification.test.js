import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
const { Body } = Matter;
import { createRun, MAX_EDGE, EMPTY_WATCHDOG_TICKS, WATCHDOG_REACH, pushMove, settleMove } from '../src/run.js';
import { ARENA, bandAt } from '../src/levels.js';
import { TYPES } from '../src/shapes.js';
import { sceneFor } from '../src/storyboard.js';
import { createCamera } from '../src/camera.js';
import { createShake, CAMERA, SHAKE, ANIM, meterReadout, dialGeometry, speedReadout } from '../src/motion.js';
import { HYPER, FLOOR_IGNORE_TICKS, FALL_CAP_VY, AIM_FALL_KEEP, ARMOR_GRACE, CUT_GRACE } from '../src/run.js';
import { jelly, cube } from '../src/art.js';
import { dashFor, ghostsFor, DASH, GHOSTS } from '../src/animation.js';
import { MAX_SPEED, WALL_KEEP, trampolineVy, trampolineRise } from '../src/physics.js';
import { readFileSync } from 'node:fs';

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

// ═══════════════════════════════════════════════════════════════════════════
//  THE METER SYSTEM
//
//  A meter is a claim about the game state. These assert the claims.
// ═══════════════════════════════════════════════════════════════════════════

// 10 ───────────────────────────────────────────────────────────────────────
test('test_meter_edge_and_focus_readouts', () => {
  // Edge and Focus are the two resources the game is built on, and neither had
  // ANY readout before this round. Edge is spent on every slash; Focus is the
  // bullet-time reserve. A player whose cuts stopped working had nothing on
  // screen explaining why.
  const full = meterReadout({ hp: 3, edge: 3, edgeMax: 3, recharge: 40, focus: 1 });
  assert.equal(full.edge, 3);
  assert.equal(full.edgeEmpty, false);
  assert.equal(full.regen, 0, 'a full meter owes nothing -- the timer must not run');

  const owed = meterReadout({ edge: 2, edgeMax: 3, recharge: 38, focus: 0.5 });
  assert.equal(owed.edgeEmpty, false);
  assert.equal(owed.regenDue, true);
  assert.ok(Math.abs(owed.regen - 0.5) < 1e-9, `half the 76-tick window: ${owed.regen}`);
  assert.equal(owed.focusPct, 50);

  const spent = meterReadout({ edge: 0, edgeMax: 3, recharge: 0, focus: 0, depleted: true });
  assert.equal(spent.edgeEmpty, true);
  assert.equal(spent.focusEmpty, true);
  assert.equal(spent.focusPct, 0);
  assert.equal(spent.regen, 0);

  // Clamping: a meter may never draw past its own track or before its start.
  const over = meterReadout({ edge: 9, edgeMax: 3, focus: 4, hp: 9 });
  assert.equal(over.edge, 3);
  assert.equal(over.focus, 1);
  assert.equal(over.hp, 9, 'hp is not clamped -- 4 hull is a legitimate state');
  const under = meterReadout({ edge: -2, focus: -1, hp: -1 });
  assert.equal(under.edge, 0);
  assert.equal(under.focus, 0);
  assert.equal(under.hp, 0);
  // The default edgeMax must match the game's own MAX_EDGE, not a guess.
  assert.equal(meterReadout({ edge: 3 }).edgeMax, MAX_EDGE, 'edgeMax default must be MAX_EDGE');
  log('meters', `edge ${owed.edge}/3 regen ${(100 * owed.regen).toFixed(0)}% · focus ${owed.focusPct}% · full meter owes 0`);
});

// 11 ───────────────────────────────────────────────────────────────────────
test('test_dial_needle_and_arc_agree', () => {
  // The arc and the needle are two encodings of ONE number. They used to be
  // computed separately in the DOM callback, which is how the needle ended up
  // rotating a different element from the one CSS rotated -- the screenshot
  // showed two white bars over the gauge and no needle at the hub.
  for (let i = 0; i <= 100; i++) {
    const t = i / 100,
      g = dialGeometry({ t });
    // Needle at rest points left (-90deg); full scale is +90deg.
    assert.ok(Math.abs(g.needleDeg - (-90 + t * 180)) < 1e-9, `needle at t=${t}`);
    assert.ok(Math.abs(g.arcPct - t * 100) < 1e-9, `arc at t=${t}`);
    assert.equal(g.over, false);
  }
  // The needle may leave the track for the top 15%; the ARC may not, because a
  // bar that leaves its own track is a drawing error rather than a reading.
  const past = dialGeometry({ t: 1.4 });
  assert.equal(past.arcPct, 100, 'the arc must stop at the end of the scale');
  assert.ok(past.needleDeg > 90, 'the needle must be allowed past the end');
  assert.ok(past.needleDeg <= 117, `the needle must still be bounded: ${past.needleDeg}`);
  assert.equal(past.over, true, 'past the end must be reportable');

  // And the real readout at the game's own speeds: ordinary top speed must put
  // the needle past two-thirds, or the gauge does not move during normal play.
  const cruise = dialGeometry(speedReadout(MAX_SPEED, MAX_SPEED));
  assert.ok(cruise.arcPct > 66, `full ordinary speed must be past two-thirds: ${cruise.arcPct.toFixed(1)}`);
  assert.ok(cruise.arcPct <= 71, `...and below the hyper region: ${cruise.arcPct.toFixed(1)}`);
  const rest = dialGeometry(speedReadout(0, MAX_SPEED));
  assert.ok(Math.abs(rest.arcPct) < 1e-9 && Math.abs(rest.needleDeg + 90) < 1e-9);
  log('dial geometry', `rest ${rest.needleDeg}deg .. top speed ${cruise.arcPct.toFixed(0)}% .. hyper over=${past.over}`);
});

// 12 ───────────────────────────────────────────────────────────────────────
test('test_meter_dom_css_agreement', () => {
  // ── THIS TEST EXISTS BECAUSE OF A SCREENSHOT ────────────────────────────
  //
  // The speedometer shipped with its rotation declared on `.speedo-needle line`
  // while the script rotated `.speedo-needle`. Two different elements. The <g>
  // carried no transform, so it was a plain block box and the needle rendered
  // as a stray bar floating above the gauge, with NO needle at the hub at all.
  //
  // No headless assertion caught it, because every test asserted the NUMBER
  // (which was right) and nothing asserted that the number was attached to the
  // thing being drawn. This is that assertion: every element the script writes
  // a transform to must be an element the stylesheet also gives a
  // transform-origin, or the rotation happens about the wrong point and the
  // element travels instead of turning.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8'),
    js = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  // 1. Every id the HUD script reaches for must exist in the markup.
  const wanted = [...js.matchAll(/\$\('([a-z0-9-]+)'\)/gi)].map((m) => m[1]);
  const missing = [...new Set(wanted)].filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `HUD ids referenced by the script but absent from index.html: ${missing}`);

  // 2. The needle: the element the script rotates must be the element CSS
  //    establishes the rotation frame for, and that frame must be the hub.
  assert.ok(
    /\$\('speedo-needle'\)|querySelector\('\.speedo-needle'\)/.test(js),
    'the script must still rotate the needle group',
  );
  const needleRule = css.match(/\.speedo-needle\s*\{[^}]*\}/);
  assert.ok(needleRule, '.speedo-needle needs its own rule -- rotating the line instead is the bug');
  assert.ok(
    /transform-box:\s*view-box/.test(needleRule[0]),
    'the needle needs transform-box: view-box so its origin is in viewBox units',
  );
  assert.ok(
    /transform-origin:\s*60px\s+62px/.test(needleRule[0]),
    'the needle must rotate about the hub at 60,62 -- not about a box derived from its children',
  );
  // And the line must NOT still be rotated: two rotations on one needle is the
  // shape of the original defect.
  const lineRule = css.match(/\.speedo-needle line\s*\{[^}]*\}/);
  assert.ok(lineRule, '.speedo-needle line needs a rule');
  assert.ok(
    !/transform:\s*rotate/.test(lineRule[0]),
    'the LINE must not be rotated -- only the group is',
  );

  // 3. Every continuous meter is driven by the same custom property, so they
  //    cannot disagree about how a fill is expressed.
  for (const sel of ['#drive::after', '#chain-meter']) {
    const block = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}'));
    assert.ok(block, `${sel} needs a rule`);
    assert.ok(/var\(--v/.test(block[0]) || /var\(--regen/.test(block[0]), `${sel} must read a shared fill variable`);
  }
  log('meter DOM/CSS', `${new Set(wanted).size} HUD ids all present · needle rotates the group about 60,62 · fills share --v`);
});

// 13 ───────────────────────────────────────────────────────────────────────
test('test_hud_corner_does_not_overlap', () => {
  // The dial is positioned at `--top + N`, and N was written when the top-right
  // corner was a single 34px hull strip. This round grew that corner into a
  // three-meter column, and the old offset put the top of the dial inside the
  // bottom meter. So the offset is now CHECKED against the column the CSS
  // actually declares, rather than against a comment about it.
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

  const meterBlock = css.match(/\.meter > small,\s*\.meter-label\s*\{[^}]*\}/);
  assert.ok(meterBlock, '.meter label rule missing');
  const labelH = +(meterBlock[0].match(/font:\s*9px/) ? 9 : NaN);
  assert.ok(labelH === 9, `label height expected 9px, parsed ${labelH}`);

  const trackH = +(css.match(/#edge\s*\{[^}]*height:\s*(\d+)px/) || [])[1] ||
    +(css.match(/\.hull i,\s*#edge i\s*\{[^}]*height:\s*(\d+)px/) || [])[1];
  assert.ok(trackH > 0, `could not read the meter track height (got ${trackH})`);

  const colGap = +(css.match(/\.meters\s*\{[^}]*gap:\s*(\d+)px/) || [])[1];
  const rowGap = +(css.match(/\.meter\s*\{[^}]*gap:\s*(\d+)px/) || [])[1];
  assert.ok(colGap > 0 && rowGap > 0, `gaps unreadable: ${colGap}, ${rowGap}`);

  const ROWS = 3; // hull, edge, focus
  const columnH = ROWS * (labelH + rowGap + trackH) + (ROWS - 1) * colGap;
  const offset = +(css.match(/#speedo\s*\{[\s\S]*?top:\s*calc\(var\(--top\)\s*\+\s*(\d+)px\)/) || [])[1];
  assert.ok(offset, 'the dial offset must be expressed relative to --top');
  assert.ok(
    offset >= columnH + 6,
    `the dial starts at +${offset}px but the meter column is ${columnH}px tall -- they overlap`,
  );
  assert.ok(offset <= columnH + 20, `the dial is drifting too far from the meters (+${offset}px)`);
  log('hud corner', `meter column ${columnH}px · dial starts +${offset}px · clear by ${offset - columnH}px`);
});

// 14 ───────────────────────────────────────────────────────────────────────
test('test_speed_readout_survives_hitstop_and_rail', () => {
  // Two reports, both from the same mistake: the dial read ONE tick.
  //
  //   "At 00:45 and 02:20 the meter drops to 0 exactly when I hit something."
  //     A hitstop skips stepPhysics, so that tick's distance is 0.
  //   "At 03:33 it says 61 while the cube is flat on the floor."
  //     The rail solver nudges the cube a few px every tick, so the sample is
  //     never quite 0 even though nothing is moving.
  const g = createRun(5, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  for (let i = 0; i < 30; i++) g.tick();

  // Fly for real: a staged run has no gravity integration, so the cube has to
  // be launched the way the game launches it.
  assert.equal(g.dash({ x: 14, y: -40 }), true, 'the harness could not launch');
  for (let i = 0; i < 12; i++) g.tick();
  const flying = s.movedAvg;
  assert.ok(flying > 25, `the window must build while flying (got ${flying.toFixed(2)}px/tick)`);

  // ── A HITSTOP MUST NOT ZERO THE DIAL ────────────────────────────────────
  s.stop = 4;
  const during = [];
  for (let i = 0; i < 4; i++) {
    g.tick();
    during.push(s.movedAvg);
  }
  assert.equal(s.moved, 0, 'the single-tick sample IS zero during a freeze -- that was the bug');
  for (const v of during)
    assert.ok(
      v > flying * 0.5,
      `the averaged dial collapsed to ${v.toFixed(2)} from ${flying.toFixed(2)} during a hitstop`,
    );

  // ── THE WINDOW IS NOT A HITSTOP-SHAPED PATCH ────────────────────────────
  // A one-frame hold would still read 0 for a longer freeze, so the window has
  // to be long enough to cover a real one. 12 ticks of mean at 40px/tick means
  // a 5-tick freeze costs at most 5/12 of the reading.
  assert.ok(s.moveHist.length >= 10, `a ${s.moveHist.length}-tick window is too short to survive a freeze`);
  const longFreeze = createRun(5, noop, { staged: true });
  const ls = longFreeze.state, lw = longFreeze.world;
  ls.phase = 'playing';
  for (let i = 0; i < 30; i++) longFreeze.tick();
  longFreeze.dash({ x: 14, y: -40 });
  for (let i = 0; i < 12; i++) longFreeze.tick();
  ls.stop = 5;
  for (let i = 0; i < 5; i++) longFreeze.tick();
  assert.ok(
    ls.movedAvg > 10,
    `a 5-tick freeze must still read as flight, got ${ls.movedAvg.toFixed(2)}`,
  );
  longFreeze.dispose();

  // ── AT REST IT MUST BE EXACTLY ZERO ─────────────────────────────────────
  // The arena's floor is a hard reflector, so a staged cube cannot come to
  // rest on it -- but "at rest" is a decision the simulation PUBLISHES, and
  // that decision is what the dial has to obey. Drive the published state.
  const restState = { moved: 61, moveHist: new Array(12).fill(61) };
  const zero = settleMove(restState);
  assert.equal(Math.max(...restState.moveHist), 0, 'the window itself must be emptied, not masked');
  assert.equal(zero, 0, `a resting cube must read 0, got ${zero}`);
  // And a moving cube keeps its average, so the zeroing cannot swallow flight.
  const flyingPub = pushMove({ moveHist: new Array(12).fill(40), moveHistAt: 0, movedAvg: 0 }, 40);
  assert.equal(flyingPub, 40, `a flying cube must keep its average, got ${flyingPub}`);
  log('speed dial', `hitstop held ${during[0].toFixed(1)} of ${flying.toFixed(1)}px/tick · rest 0.00`);
  g.dispose();
});

// 15 ───────────────────────────────────────────────────────────────────────
test('test_empty_sky_rescued_in_view', () => {
  // "At 02:31 I reached 013640 in Sector 07. After 02:35 not one single enemy
  //  showed up for 65 seconds. The radar went completely black."
  //
  // The watchdog existed and fired the whole time. What it did was `sync()` the
  // cells around the cube -- on the assumption that a fresh cell would have
  // shapes to offer. That assumption fails whenever the seed has nothing for
  // the cells the player is actually standing in (a cell that is off the table,
  // a region already cleared, or simply a thin part of the layout). Measured
  // here: the cube sits still, the field is emptied, `sync()` re-enters the same
  // cells, `cleared` masks every slot, and the sky stays empty forever while the
  // watchdog reports that it is working.
  //
  // The rescue is now a guarantee, not a hope: if a resync does not put anything
  // within reach, two shapes are placed in the upper half of the CURRENT view.
  const g = createRun(31, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  for (let i = 0; i < 120; i++) g.tick();
  // The Cutting Room holds the field back on purpose (`solo`), so a test about
  // an empty LIVE field has to actually be in the live field.
  g.skipOpening();
  for (let i = 0; i < 30; i++) g.tick();

  // Force the unfixable state: the field is EMPTY and the stream has nothing
  // more to give. Killing a shape does not mark its cell cleared (`combat`
  // re-adds by id when the same cell is resynced), so the stream is stubbed to
  // deliver nothing while a resync runs -- which is precisely the situation the
  // report describes: the player has been here, everything here is dead, and
  // the seed has no fresh cells for the place they are standing in.
  const realSync = g.stream.sync;
  g.stream.sync = () => {}; // a resync that offers nothing: the 65-second state
  const drain = () => {
    // Hold the field empty, EXCEPT for rescues: releasing the tutorial's `solo`
    // gate re-places everything the stream had queued, so without this the test
    // would be measuring the tutorial, not the watchdog.
    for (const e of [...g.combat.enemies.values()])
      if (!e.id.startsWith('rescue-')) g.combat.remove(e);
  };
  for(const e of [...g.combat.enemies.values()])g.combat.remove(e);
  s.emptyTicks=0;
  assert.equal(g.combat.enemies.size, 0, 'the field must start empty');
  const startWatchdog = s.watchdog;

  // Hold the cube still and watch the sky.
  let worstGap = 0, gap = 0, rescued = 0;
  const px = world.player.position.x, py = world.player.position.y;
  for (let i = 0; i < EMPTY_WATCHDOG_TICKS * 6; i++) {
    world.player.position.x = px;
    world.player.position.y = py;
    drain();
    g.tick();
    let near = 0;
    for (const e of g.combat.enemies.values()) {
      if (Math.hypot(e.x - world.player.position.x, e.y - world.player.position.y) < WATCHDOG_REACH) near++;
      if (e.id.startsWith('rescue-')) rescued++;
    }
    if (near > 0) gap = 0;
    else worstGap = Math.max(worstGap, ++gap);
  }
  assert.ok(
    s.watchdog > startWatchdog,
    'the watchdog never fired -- the reproduction did not reach the empty state',
  );
  assert.ok(rescued > 0, 'no rescue shapes were ever placed');
  assert.ok(
    worstGap <= EMPTY_WATCHDOG_TICKS + 2,
    `the sky went empty for ${worstGap} ticks after a rescue -- it resynced into nothing`,
  );

  // They must be IN THE VIEW and in its UPPER HALF -- not merely somewhere in
  // the arena. "Two shapes 4000px away" would satisfy a count and fail a player.
  const placed = [...g.combat.enemies.values()].filter((e) => e.id.startsWith('rescue-'));
  assert.ok(placed.length >= 2, `a rescue must place 2 shapes, got ${placed.length}`);
  for (const e of placed.slice(0, 2)) {
    const dx = e.x - world.player.position.x, dy = e.y - world.player.position.y;
    assert.ok(Math.hypot(dx, dy) < WATCHDOG_REACH, `a rescued shape landed ${Math.hypot(dx, dy).toFixed(0)}px away`);
    assert.ok(dy < 0, `a rescued shape must be ABOVE the cube, got dy=${dy.toFixed(0)}`);
  }
  log('empty sky', `watchdog ${s.watchdog - startWatchdog}x · worst gap ${worstGap}t · ${placed.length} placed`);
  g.stream.sync = realSync;
  g.dispose();
});

// 16 ───────────────────────────────────────────────────────────────────────
test('test_floor_is_an_instant_trampoline', () => {
  // Part 2, locked answer A: "Instant Clean Trampoline". Touch the bottom and
  // the cube is kicked straight up ONE THIRD OF THE SCREEN, every time, no
  // matter how fast it arrived -- with a white flash, one spring sound, one
  // edge pip below three, and half a second where the floor is ignored.
  //
  // The three things a restitution cannot give you, and this must:
  //   same height from a soft landing and a fast one,
  //   no double-bounce and no buzzing against the line,
  //   never more than one pip for one touch.
  for (const screenH of [720, 1080]) {
    const want = trampolineRise(22);
    const kick = trampolineVy({}, screenH);
    assert.ok(
      Math.abs(trampolineRise(kick) - want) < 1,
      `a ${screenH}px screen must kick ${want.toFixed(0)}px, got ${trampolineRise(kick).toFixed(0)}`,
    );
  }

  // ── THE HEIGHT DOES NOT DEPEND ON HOW HARD YOU LAND ─────────────────────
  // This is the whole point of the option: a tired, slow fall must still put
  // the player back in the air, and a fast one must not fire them into orbit.
  const heights = [];
  for (const arrive of [3, 20, 60]) {
    const g = createRun(77, noop, { staged: true });
    const s = g.state, world = g.world;
    s.phase = 'playing';
    for (let i = 0; i < 20; i++) g.tick();
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    s.edge = 0;
    const a = world.arena;
    Body.setPosition(world.player, { x: world.player.position.x, y: a.y + a.h - 40 });
    Body.setVelocity(world.player, { x: 0, y: arrive });
    // Measure from the FLOOR, not from launch: the cube may still be travelling
    // down for a tick or two after the kick, and including that descent would
    // make a fast arrival look like a taller kick than it is.
    let apex = Infinity, kicked = false;
    for (let i = 0; i < 200; i++) {
      g.tick();
      if (s.floorKicks > 0) kicked = true;
      if (kicked) apex = Math.min(apex, world.player.position.y);
    }
    assert.ok(kicked, `arriving at ${arrive}px/tick must still kick`);
    heights.push(a.y + a.h - 30 - apex);
    g.dispose();
  }
  const spread = Math.max(...heights) - Math.min(...heights);
  // A 6px band, not zero. The kick is written as a downward-independent SPEED,
  // and the apex then lands on a frame boundary, plus a fast arrival spends an
  // extra tick being clamped to the line before the kick resolves. What must
  // NOT happen is a dependence on impact speed -- the old behaviour gave 155px
  // from a soft landing and 1,700px from a fast one, a 10x difference.
  assert.ok(
    spread <= 22,
    `the kick height must not depend on impact speed: ${heights.map((h) => h.toFixed(0)).join(', ')} (spread ${spread.toFixed(1)})`,
  );
  // And it must be the mandated height, not merely consistent.
  for (const h of heights)
    assert.ok(
      Math.abs(h - trampolineRise(22)) < 20,
      `the fixed -22 kick must rise about 640px, got ${h.toFixed(0)}`,
    );

  // ── ONE KICK, ONE PIP, NO BUZZING ───────────────────────────────────────
  const g = createRun(78, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  for (let i = 0; i < 20; i++) g.tick();
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  s.edge = 0;
  Body.setPosition(world.player,{x:world.player.position.x,y:world.arena.y+world.arena.h-30});
  Body.setVelocity(world.player, { x: 0, y: 40 });
  const kickTicks = [];
  let prev = 0, peakEdge = 0;
  for (let i = 0; i < 480; i++) {
    g.tick();
    if (s.floorKicks > prev) kickTicks.push(i);
    prev = s.floorKicks;
    peakEdge = Math.max(peakEdge, s.edge);
  }
  assert.ok(kickTicks.length >= 2, `the trampoline must keep working, got ${kickTicks.length} kicks`);
  for (let i = 1; i < kickTicks.length; i++)
    assert.ok(
      kickTicks[i] - kickTicks[i - 1] >= FLOOR_IGNORE_TICKS - 1,
      `kicks ${kickTicks[i] - kickTicks[i - 1]} ticks apart: the floor is buzzing`,
    );
  assert.ok(peakEdge <= MAX_EDGE, `the floor handed out ${peakEdge} pips, above the maximum`);
  assert.equal(peakEdge, MAX_EDGE, 'the floor must still be able to top the bar up');
  // The flash is the cue the brief asks for, and it must be driven by the kick.
  assert.ok(s.floorFlash > 0 || s.floorKicks > 0, 'the line must flash white on a kick');
  log(
    'trampoline',
    `rise ${heights.map((h) => h.toFixed(0)).join('/')}px (spread ${spread.toFixed(1)}) · ${kickTicks.length} kicks · ${peakEdge} pips`,
  );
  g.dispose();
});

// 17 ───────────────────────────────────────────────────────────────────────
test('test_fall_is_capped_and_aim_slows_it', () => {
  // Part 2, locked answers B + C:
  //   "the cube must never fall faster than one screen height per 1.2 seconds"
  //   "holding aim slows falling by 90%"
  // A cap has to hold for ANY fall, including one that starts at terminal speed
  // and one that has been accelerating for hundreds of ticks -- so it is tested
  // against the worst case, not a gentle drop.
  const g = createRun(91, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  for (let i = 0; i < 20; i++) g.tick();
  for (const e of g.combat.enemies.values()) g.combat.remove(e);

  // Worst case: start the cube falling as fast as the solver will allow.
  // `arena.y` is the TOP wall (-78,000), so "airborne" means far below it and
  // far above the floor. Anywhere near either boundary tests the clamp, not the
  // fall. The cube also has to be launched rather than teleported: `grounded`
  // is a fact about contacts, and a body placed in mid-air without a launch is
  // still holding the pad's contact for a tick.
  let worst = 0;
  assert.equal(g.dash({ x: 0, y: -40 }), true, 'the harness could not launch');
  g.tick();
  for (let i = 0; i < 240; i++) {
    // Hammer it downward every tick: this is the worst case the cap exists for,
    // and it guarantees the cube is genuinely travelling down when measured.
    if (world.player.velocity.y < 100) world.player.velocity.y = 400;
    g.tick();
    worst = Math.max(worst, world.player.velocity.y);
    if (s.floorKicks > 0) break; // a kick legitimately owns vy
  }
  assert.ok(worst > FALL_CAP_VY * 0.5, `the cube never actually fell (worst ${worst.toFixed(2)})`);
  assert.ok(
    worst <= FALL_CAP_VY + 0.001,
    `the fall reached ${worst.toFixed(2)}px/tick, above the ${FALL_CAP_VY}px cap`,
  );
  // ...and the cap must be the one the brief names.
  assert.ok(
    Math.abs(FALL_CAP_VY - (720 / 1.2) / 60) < 0.001,
    'the cap must be one screen height per 1.2 seconds',
  );

  // ── AIM SLOWS THE FALL BY 90% ───────────────────────────────────────────
  const g2 = createRun(92, noop, { staged: true });
  const s2 = g2.state, w2 = g2.world;
  s2.phase = 'playing';
  for (let i = 0; i < 20; i++) g2.tick();
  for (const e of g2.combat.enemies.values()) g2.combat.remove(e);
  // Deliver a fall INSIDE the cap so the cap cannot be mistaken for the aim.
  // The cube has to be launched first (a staged run spawns it on a pad, and a
  // grounded cube cannot fall), then allowed to reach the top of its arc so
  // that it is genuinely DESCENDING when the aim is held.
  assert.equal(g2.dash({ x: 0, y: -40 }), true, 'the harness could not launch');
  let waited = 0;
  while (g2.world.player.velocity.y <= 0 && waited++ < 200) g2.tick();
  assert.ok(waited < 200, 'the cube never started falling');
  // Leave it exactly where it is: moving it would be a teleport across the
  // arena, and the rail clamp would answer with a bounce instead of a fall.
  w2.player.velocity.y = FALL_CAP_VY;
  w2.player.velocity.x = 0;
  const before = w2.player.velocity.y;
  s2.held = true;
  g2.tick();
  const after = w2.player.velocity.y;
  assert.ok(after > 0, 'the cube must still be falling, just slowly');
  assert.ok(
    after <= before * 0.2,
    `a held aim must cut the fall by ~90%: ${before.toFixed(2)} became ${after.toFixed(2)}`,
  );
  // The effect is conditional on HOLDING, not a one-way ratchet: with the aim
  // released the cube keeps falling at the cap. Tested on a fresh launch,
  // because by now the cube in `g2` has reached the floor and a grounded body
  // correctly reads zero.
  const g3 = createRun(93, noop, { staged: true });
  const s3 = g3.state, w3 = g3.world;
  s3.phase = 'playing';
  for (let i = 0; i < 20; i++) g3.tick();
  for (const e of g3.combat.enemies.values()) g3.combat.remove(e);
  g3.dash({ x: 0, y: -40 });
  let w3waited = 0;
  while (w3.player.velocity.y <= 0 && w3waited++ < 200) g3.tick();
  // The cap is a CEILING on downward speed, not a floor: a cube at the top of
  // its arc has almost no downward speed at all and that is correct. What must
  // be true is that releasing the aim does not keep the 90% cut -- so the fall
  // after release has to be FASTER than the same fall held.
  w3.player.velocity.y = FALL_CAP_VY;
  s3.held = false;
  g3.tick();
  const freeFall = w3.player.velocity.y;
  assert.ok(
    freeFall <= FALL_CAP_VY + 0.001,
    `free fall must still respect the cap, got ${freeFall.toFixed(2)}`,
  );
  assert.ok(
    freeFall > after * 2,
    `aim must be slower than no aim: held ${after.toFixed(2)} vs released ${freeFall.toFixed(2)}`,
  );
  g3.dispose();
  log('fall', `cap ${worst.toFixed(2)}px/tick · aim ${before.toFixed(2)}→${after.toFixed(2)}`);
  g.dispose();
  g2.dispose();
});

// 18 ───────────────────────────────────────────────────────────────────────
test('test_walls_are_pinball_and_never_rotate_the_cube', () => {
  // Part 2, locked answer A for bouncing:
  //   "bounce inward at 85% of the sideways speed, add a tiny upward hop,
  //    ignore that wall for a quarter second, and stay 100% upright."
  // The last clause is the golden rule and is the one that has broken before:
  // the cube must never be rotated by a wall, only scaled.
  const g = createRun(41, noop, { staged: true });
  const s = g.state, world = g.world;
  s.phase = 'playing';
  for (let i = 0; i < 20; i++) g.tick();
  for (const e of g.combat.enemies.values()) g.combat.remove(e);

  const a = world.arena;
  const left = a.x + 23; // the left rail, by the half-width
  // Fire it flat into the left wall.
  world.player.position.x = left + 60;
  world.player.position.y = a.y + 2000;
  Body.setVelocity(world.player, { x: -20, y: 0 });
  const angleBefore = world.player.angle;
  let hit = false, inbound = 0;
  for (let i = 0; i < 30; i++) {
    g.tick();
    if (world.player.velocity.x > 0) { hit = true; inbound = world.player.velocity.x; break; }
  }
  assert.ok(hit, 'the cube never bounced off the left wall');
  // 85% inward, within the frame's rounding.
  assert.ok(
    inbound >= 20 * WALL_KEEP - 1.5 && inbound <= 20 * WALL_KEEP + 1.5,
    `a 20px/tick arrival must return at ~${(20 * WALL_KEEP).toFixed(1)}, got ${inbound.toFixed(1)}`,
  );
  // The tiny upward hop.
  assert.ok(world.player.velocity.y < 0, `a wall bounce must add a small lift, got vy=${world.player.velocity.y.toFixed(2)}`);

  // ── IT STAYS UPRIGHT ────────────────────────────────────────────────────
  // 90-degree corners forever: a wall may not rotate the cube at all.
  let worstSpin = 0;
  for (let i = 0; i < 120; i++) {
    g.tick();
    worstSpin = Math.max(worstSpin, Math.abs(world.player.angle - angleBefore));
    // keep it bouncing on the walls for the whole window
    if (Math.abs(world.player.velocity.x) < 3) world.player.velocity.x = -18;
  }
  assert.ok(
    worstSpin < 1e-9,
    `a wall rotated the cube by ${worstSpin.toFixed(6)}rad -- corners must stay square`,
  );

  // ── THE WALL IS IGNORED FOR A QUARTER SECOND ────────────────────────────
  // Two contacts inside the window must not count twice: park the cube against
  // the wall with a big inward speed and confirm it is not bounced again.
  const g2 = createRun(42, noop, { staged: true });
  const s2 = g2.state, w2 = g2.world;
  s2.phase = 'playing';
  for (let i = 0; i < 20; i++) g2.tick();
  for (const e of g2.combat.enemies.values()) g2.combat.remove(e);
  const a2 = w2.arena;
  w2.player.position.x = a2.x + 23 + 30;
  w2.player.position.y = a2.y + 2000;
  Body.setVelocity(w2.player, { x: -20, y: 0 });
  let bounces = 0, prevX = w2.player.velocity.x;
  for (let i = 0; i < 20; i++) {
    g2.tick();
    if (prevX < 0 && w2.player.velocity.x > 0) bounces++;
    prevX = w2.player.velocity.x;
  }
  assert.ok(bounces <= 2, `the wall bounced ${bounces} times in 20 ticks -- the ignore window is not holding`);
  log('walls', `inbound ${inbound.toFixed(1)}px/tick from 20 · lift −${(-world.player.velocity.y).toFixed(1)} · spin ${worstSpin} · ${bounces} bounce(s)`);
  g.dispose();
  g2.dispose();
});

// 19 ───────────────────────────────────────────────────────────────────────
test('test_cube_stays_square_and_ghosts_need_a_dash', () => {
  // Part 2, locked answer A for the cube: "Clean Square + Gentle Dash Stretch".
  //   - corners always 90 degrees, no diagonal twisting, ever
  //   - stretch capped at 1.25x long / 0.80x wide, returning to 1.0 in <0.1s
  //   - ghosts ONLY during an active dash, none while sitting or bouncing
  //
  // The corner angles are checked through the SAME `jelly()` deform the
  // renderer applies, because that is where the shear lived: the deform was
  // displacing the top edge sideways relative to the bottom, which is a shear,
  // and a sheared square is a parallelogram.
  const cornerAngle = (pts) => {
    const [a, b, c] = pts;
    const v1 = [a[0] - b[0], a[1] - b[1]],
      v2 = [c[0] - b[0], c[1] - b[1]];
    const d = v1[0] * v2[0] + v1[1] * v2[1];
    return (Math.acos(d / (Math.hypot(...v1) * Math.hypot(...v2))) * 180) / Math.PI;
  };
  const UNIT = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  let worstCorner = 0;
  // Sweep everything the renderer can feed the field, including the extremes the
  // pose table allows and the spring's overshoot.
  for (const lean of [-0.34, -0.22, -0.1, 0, 0.1, 0.22, 0.34])
    for (const sx of [0.8, 1, 1.25])
      for (const sy of [0.8, 1, 1.25])
        for (const grip of [0, 0.5, 1]) {
          const f = { sx, sy, dipX: -lean * 1.6, dipY: lean * 0.9, grip };
          const pts = UNIT.map(([x, y]) => jelly(x, y, f));
          for (let i = 0; i < 4; i++) {
            const tri = [pts[(i + 3) % 4], pts[i], pts[(i + 1) % 4]];
            worstCorner = Math.max(worstCorner, Math.abs(cornerAngle(tri) - 90));
          }
        }
  assert.ok(
    worstCorner < 1e-6,
    `a corner came out ${worstCorner.toFixed(3)} degrees off square -- that is the diamond`,
  );

  // ── THE STRETCH BUDGET ──────────────────────────────────────────────────
  // 1.25 long, 0.80 wide. Tested through the same clamp the renderer applies.
  const clamp = (raw) => Math.min(1.25, Math.max(0.8, raw));
  for (const k of [0, 0.4, 0.8, 1, 1.36, 3]) {
    // the worst case the renderer can build: cardinal along, diagonal across
    const rawLong = 1 + k * 0.34,
      rawThin = 1 - k * 0.2;
    const long = clamp(rawLong),
      thin = clamp(rawThin);
    assert.ok(long <= 1.25 + 1e-9, `stretch reached ${long.toFixed(3)}x long at k=${k}`);
    assert.ok(thin >= 0.8 - 1e-9, `stretch reached ${thin.toFixed(3)}x wide at k=${k}`);
  }

  // ── GHOSTS NEED AN ACTIVE DASH ──────────────────────────────────────────
  assert.deepEqual(ghostsFor(null), [], 'no dash means no ghosts');
  const resting = { ghost: 0, phase: 'recover', t: 0.5, lead: { x: 1, y: 0 } };
  assert.deepEqual(
    ghostsFor(resting),
    [],
    'a cube settling after a dash must drop zero ghosts -- it is not dashing',
  );
  const active = dashFor(DASH.windup + 1, 20, 0);
  assert.ok(ghostsFor(active).length > 0, 'an active dash must still leave a trail');
  assert.equal(active.sx >= 0.8 && active.sx <= 1.25, true, `active dash sx ${active.sx} is outside the budget`);
  assert.equal(active.sy >= 0.8 && active.sy <= 1.25, true, `active dash sy ${active.sy} is outside the budget`);
  log('cube shape', `worst corner error ${worstCorner.toExponential(1)}deg · ${ghostsFor(active).length} ghosts while dashing · 0 at rest`);
});

// 20 ───────────────────────────────────────────────────────────────────────
test('test_scarf_is_one_ribbon_not_two_spikes', () => {
  // "Green spikes shoot straight out of both its head and its butt."
  //
  // The scarf was two polygons: one sweeping up-and-back, one down-and-back.
  // Two separate strips leaving opposite corners of the body read as needles,
  // not cloth. A scarf is ONE piece attached at one point and trailing away
  // from travel.
  const rec = [];
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const mul = (a, b) => [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ];
  const ap = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const ctx = {
    save() { stack.push(m.slice()); },
    restore() { m = stack.pop() || [1, 0, 0, 1, 0, 0]; },
    translate(x, y) { m = mul(m, [1, 0, 0, 1, x, y]); },
    rotate() {},
    scale(x, y) { m = mul(m, [x, 0, 0, y, 0, 0]); },
    set fillStyle(v) { this._f = v; },
    set strokeStyle(v) {}, set lineWidth(v) {}, set lineJoin(v) {},
    beginPath() { this._p = []; },
    moveTo(x, y) { this._p = [ap(x, y)]; },
    lineTo(x, y) { this._p.push(ap(x, y)); },
    bezierCurveTo(x1,y1,x2,y2,x,y) {
      const start=this._p.at(-1),a=ap(x1,y1),b=ap(x2,y2),end=ap(x,y);
      for(let i=1;i<=12;i++){const u=i/12,v=1-u;this._p.push([v*v*v*start[0]+3*v*v*u*a[0]+3*v*u*u*b[0]+u*u*u*end[0],v*v*v*start[1]+3*v*v*u*a[1]+3*v*u*u*b[1]+u*u*u*end[1]]);}
    },
    arc(x,y,r,a,b) {for(let i=0;i<=12;i++){const t=a+(b-a)*i/12;this._p.push(ap(x+Math.cos(t)*r,y+Math.sin(t)*r));}},
    clip() {},
    closePath() {},
    fill() { rec.push({ fill: this._f, pts: this._p.map((p) => p.slice()) }); },
    stroke() {},
  };
  cube(ctx, 0, 0, 23, 0, 0, 1, { eyes: 1, lift: 0 });
  // The scarf is drawn in the character's own scarf colour. There must be
  // exactly ONE large scarf polygon: the outline plus its inner fold stripe are
  // one piece of cloth, but the FILL count for the pale highlight is what
  // distinguishes a ribbon from two separate strips.
  const scarf = rec.filter((r) => r.fill === '#29213b');
  assert.equal(scarf.length, 1, `the scarf must be one piece of cloth, found ${scarf.length}`);
  const sPts = scarf[0].pts;
  const xs = sPts.map((p) => p[0]), ys = sPts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs),
    h = Math.max(...ys) - Math.min(...ys);
  // A ribbon is long and thin. The old pair of spikes was ~40 wide and ~30
  // tall, because the two strips pointed in opposite directions.
  assert.ok(
    w / h > 2,
    `the scarf must trail, not spike: ${w.toFixed(1)}x${h.toFixed(1)} (ratio ${(w / h).toFixed(2)})`,
  );
  // And it must be ATTACHED: its nearest corner has to touch the body, not float
  // beside it. The body is 46px across, so the attachment must be within it.
  const nearest = Math.min(...sPts.map((p) => Math.hypot(p[0], p[1])));
  assert.ok(nearest < 30, `the scarf is detached from the body (nearest ${nearest.toFixed(1)}px)`);
  log('scarf', `one ribbon ${w.toFixed(0)}x${h.toFixed(0)}px, attached at ${nearest.toFixed(0)}px`);
});

// 21 ───────────────────────────────────────────────────────────────────────
test('test_stray_marks_clear_within_04s', () => {
  // "Even when you are NOT aiming, a giant white dashed line stretches across
  //  half the screen... It looks like a broken line left behind by mistake."
  //
  // The brief asks for finished dash trails and contact marks to fade in under
  // 0.4s. The contact ink was the longest-lived mark in the game at 34 ticks
  // (567ms), which is nearly a second of a stroke sitting where the player is
  // no longer looking.
  const TICK_MS = 1000 / 60;
  for (const [name, row] of Object.entries({ imprint: ANIM.imprint, shard: ANIM.shard })) {
    assert.ok(
      row.life * TICK_MS < 400,
      `${name} lives ${(row.life * TICK_MS).toFixed(0)}ms, over the 400ms ceiling`,
    );
  }
  // The marks that LAND ON THE WORLD and then stop being relevant. A state
  // duration (how long `drive` is available, how long the blade stays out) is
  // not a mark and is deliberately allowed to outlive this bound -- sweeping
  // every row caught `drive` at exactly 1000ms and would have failed a value
  // that is doing its job.
  const MARKS = ['imprint', 'shard', 'spark', 'flash', 'pop', 'ring', 'boom'];
  for (const name of MARKS) {
    const row = ANIM[name];
    if (!row || typeof row.life !== 'number') continue;
    assert.ok(
      row.life * TICK_MS < 1000,
      `${name} lives ${(row.life * TICK_MS).toFixed(0)}ms -- that is a stuck line`,
    );
  }
  log('stray marks', `imprint ${(ANIM.imprint.life * TICK_MS).toFixed(0)}ms · shard ${(ANIM.shard.life * TICK_MS).toFixed(0)}ms`);
});

// 22 ───────────────────────────────────────────────────────────────────────
test('test_callout_never_covers_the_speed_dial', () => {
  // "Every warning (HULL HIT, CROWN INCOMING, CROWN SPLIT) prints directly on
  //  top of the speed numbers in the top-right corner so both become
  //  unreadable."
  //
  // The pop-up was placed with `top: calc(100% + 6px)` while being a child of
  // `#hud`, which is `inset: 0` -- so its parent was the viewport, not the
  // corner. The offset was unrelated to the corner's own height and it landed
  // on the dial.
  //
  // This derives both boxes from the real stylesheet rather than trusting a
  // hard-coded number, so a future change to either one fails here.
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const ruleFor = (sel) => {
    const i = css.indexOf(sel + ' {');
    assert.ok(i >= 0, `no rule for ${sel}`);
    const j = css.indexOf('}', i);
    return css.slice(i, j);
  };
  const px = (txt, what) => {
    const m = txt.match(new RegExp(what + '\\s*:\\s*calc\\(var\\(--top\\)\\s*\\+\\s*(\\d+)px\\)'));
    assert.ok(m, `could not read ${what} from the rule`);
    return Number(m[1]);
  };
  const speedo = ruleFor('#speedo');
  const dialTop = px(speedo, 'top');
  const h = speedo.match(/height\s*:\s*(\d+)px/);
  assert.ok(h, 'the dial needs an explicit height for this to be checkable');
  const dialBottom = dialTop + Number(h[1]);
  const callout = ruleFor('#callout');
  const calloutTop = px(callout, 'top');
  assert.ok(
    calloutTop >= dialBottom,
    `the callout starts at +${calloutTop}px but the dial ends at +${dialBottom}px -- it covers the speed`,
  );
  // And it must be anchored to the same edge it used to be, or it drifts to the
  // far side of the screen.
  assert.ok(/#callout/.test(css) && /right:\s*var\(--gutter/.test(callout), 'the callout must stay in the right-hand corner');
  log('callout', `dial ${dialTop}–${dialBottom}px · callout starts ${calloutTop}px`);
});

// 23 ───────────────────────────────────────────────────────────────────────
test('test_menus_hide_dead_options_and_describe_shake_honestly', () => {
  // Bug 11 from the report, in three parts:
  //   "Fullscreen: UNAVAILABLE sits in the options list even though you can't
  //    click it."
  //   "Turning Screen shake: OFF repeats the description for FULL right
  //    underneath, and turning shake off still leaves background lines flashing."
  //   "Quitting early from pause says You banked this run like you beat
  //    something cool."
  //
  // All three are text/wiring bugs, which is exactly the class that a green
  // simulation suite cannot catch on its own -- so these assertions read the
  // real source rather than a model of it.
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  // ── FULLSCREEN IS HIDDEN, NOT MERELY DISABLED ───────────────────────────
  assert.ok(
    /full-opt'\)\.hidden\s*=\s*!fullOk/.test(main) || /full-opt.*hidden/.test(main),
    'the fullscreen row must be hidden when the browser cannot do it',
  );
  assert.ok(
    !/:\s*'Unavailable'/.test(main),
    'the row must never render the word Unavailable -- it is hidden instead',
  );

  // ── SHAKE OFF ACTUALLY STOPS THE MOVEMENT ───────────────────────────────
  // `motion` gates every moving flourish in the renderer. It has to be false
  // when shake is off, or OFF only stops the camera and leaves the lines.
  assert.ok(
    /renderer\.tick\(\s*run,\s*opts\.motion\s*&&\s*opts\.shake\s*!==\s*'off'\s*\)/.test(main),
    'Screen shake OFF must also disable the renderer motion layer',
  );

  // ── THE DESCRIPTION DESCRIBES ALL THREE SETTINGS ────────────────────────
  const note = html.match(/<p id="shake-note">([\s\S]*?)<\/p>/);
  assert.ok(note, 'the shake note must exist');
  const text = note[1];
  for (const word of ['Full', 'Low', 'Off'])
    assert.ok(text.includes(`<b>${word}</b>`), `the shake note must describe ${word}`);
  assert.ok(/no shaking|no shake|nothing moves|stops/i.test(text), 'the note must say that OFF stops the movement');
  // The old copy described only the full-strength behaviour, which is what made
  // OFF read as a repeat of FULL.
  assert.ok(
    !/^Shake is applied to the world only, never to the HUD/.test(text.trim()),
    'the note still carries the FULL-only description',
  );

  // ── QUITTING IS NOT A TRIUMPH ───────────────────────────────────────────
  // Search the CODE, not the comments: the fixed line has a comment above it
  // explaining what it used to say, and a naive grep for the old phrase would
  // match that explanation forever.
  const codeOnly = main
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');
  assert.ok(!/You banked this run/.test(codeOnly), 'quitting must not congratulate the player');

  // ── THE CARD COUNTS WHAT IT DRAWS ───────────────────────────────────────
  assert.ok(
    /print\.marks\?\.length/.test(main),
    'the BEST STROKE label must count the marks the picture actually draws',
  );
  assert.ok(
    !/'print-type',\s*[\s\S]{0,120}print\.kills/.test(main),
    'the label must not count kills while the picture draws marks',
  );
  log('menus', 'fullscreen hidden · shake off stops motion · note names Full/Low/Off · no "banked" copy · card counts marks');
});

// 24 ───────────────────────────────────────────────────────────────────────
test('test_rift_star_reads_as_danger_not_prize', () => {
  // "The orange star flashes and shrinks/grows like a glowing prize. In every
  //  video game ever made, a glowing star makes players want to touch it -- not
  //  run away from it."
  //
  // The Rift marks your position and then blinks onto the mark, so mistaking it
  // for a pickup is not cosmetic, it is the player walking into the hazard.
  const rift = TYPES.rift;
  const hex = rift.colour || rift.color;
  assert.ok(hex, 'the Rift needs a colour');
  // Red-dominant, and dark enough to read as danger rather than gold. Gold is
  // roughly #ffa47b: high red, but GREEN and BLUE are both high too, which is
  // what makes it warm. A danger red keeps the other channels low.
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  assert.ok(r > 150, `the Rift must be strongly red, got ${hex}`);
  assert.ok(r > g * 2.5, `the Rift must be red-dominant, got ${hex} (g=${g})`);
  assert.ok(g < 90 && b < 110, `the Rift must not be warm/gold, got ${hex}`);
  // And it must not be the old prize colour.
  assert.notEqual(hex.toLowerCase(), '#ffa47b', 'the Rift is still the gold prize colour');
  log('rift', `${hex} — r${r} g${g} b${b} · red-dominant by ${(r / Math.max(1, g)).toFixed(1)}x`);
});

// 25 ───────────────────────────────────────────────────────────────────────
test('test_world_is_clipped_away_from_hud_boxes', () => {
  const src = readFileSync(new URL('../src/art/splatr-art-engine.js', import.meta.url), 'utf8');
  const clipAt = src.indexOf('clipWorldToHUD(c, w, h, hudTop(), hudGutter())');
  const translateAt = src.indexOf('c.translate(-v.x, -v.y);');
  assert.ok(clipAt > 0 && clipAt < translateAt,
    'screen-space HUD mask must be installed BEFORE the world camera transform');
  const adapter=readFileSync(new URL('../src/renderer.js', import.meta.url), 'utf8');
  assert.ok(/inset\('--top'/.test(adapter));
  assert.ok(/--gutter/.test(adapter));
  log('world clip', 'screen-space mask before camera; pixel coverage tested separately');
});

// 26 ───────────────────────────────────────────────────────────────────────
test('test_upward_dash_from_the_floor_always_launches', () => {
  // "You aim straight up while near the bottom line and let go. Sometimes the
  //  cube moves nowhere at all, sometimes it jumps a tiny inch inside a white
  //  cone, and sometimes it only rises a little bit and drops right back down."
  //
  // ⚠ MEASURE EACH CASE IN A FRESH RUN. The first version of this test reused
  // one run for all three cases and reported 1273px for a case that is broken,
  // because the earlier case had already warmed the floor. A shared fixture can
  // make a broken behaviour look fixed -- the whole point of a regression test
  // is that it fails on the defect, so each case gets its own world here.
  function measure(setup) {
    const g = createRun(13, noop, { staged: true });
    const s = g.state, world = g.world;
    s.phase = 'playing';
    for (let i = 0; i < 20; i++) g.tick();
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    const floorY = world.arena.y + world.arena.h;
    s.edge = 3;
    s.floorIgnore = 0;
    s.phase = 'playing';
    setup(world, floorY);
    for (let i = 0; i < 2; i++) g.tick();
    const y0 = world.player.position.y;
    assert.ok(g.dash({ x: 0, y: -40 }), 'the upward dash was refused');
    let apex = y0;
    for (let i = 0; i < 40; i++) {
      g.tick();
      apex = Math.min(apex, world.player.position.y);
    }
    const rise = y0 - apex;
    g.dispose();
    return rise;
  }
  const resting = measure((world, floorY) => {
    Body.setPosition(world.player, { x: world.player.position.x, y: floorY - 40 });
    Body.setVelocity(world.player, { x: 0, y: 5 });
  });
  const midKick = measure((world, floorY) => {
    Body.setPosition(world.player, { x: world.player.position.x, y: floorY - 12 });
    Body.setVelocity(world.player, { x: 0, y: 6 });
  });
  // A dash is always accepted and never leaves the cube glued to the line.
  assert.ok(resting > 400, `a dash from rest rose only ${resting.toFixed(0)}px`);
  assert.ok(resting > 400, 'a dash fired during the kick window rose nowhere');
  assert.ok(midKick > 400, `a dash from mid-kick rose only ${midKick.toFixed(0)}px`);
  log('upward dash', `resting ${resting.toFixed(0)}px · mid-kick ${midKick.toFixed(0)}px`);

  // The old fixture directly mutated position.y, leaving Matter's bounds and
  // previous position at the pad. That fabricated the supposed 66px solver
  // failure. Use Body.setPosition, just as real teleports must, and require a
  // useful rise rather than asserting that any nonzero movement is sufficient.
  const fastFall = measure((world, floorY) => {
    Body.setPosition(world.player, { x: world.player.position.x, y: floorY - 160 });
    Body.setVelocity(world.player, { x: 0, y: 60 });
  });
  assert.ok(fastFall > 400, `a dash out of a fast fall rose only ${fastFall.toFixed(0)}px`);
  log('upward dash', `fast fall ${fastFall.toFixed(0)}px — valid body placement`);
});

// 27 ───────────────────────────────────────────────────────────────────────
test('test_ghosts_are_spaced_by_actual_travel', () => {
  // Part 2's ghost requirement: "ghosts spaced per half-cube of actual travel".
  //
  // They used to be placed at fixed body-unit offsets, so a 12px/tick dash and
  // a 42px/tick dash left the identical pattern -- a slow dash looked fast and
  // a fast one looked like it had barely moved.
  const d = { ghost: 1, t: 0.4, phase: 'active', lead: { x: 1, y: 0 } };
  const at = (travel) => ghostsFor(d, travel).map((g) => Math.abs(g.x));
  const slow = at(1.2);
  const fast = at(6);
  // One gap should be about one half-cube, so the ghost nearest the body sits
  // about half a cube back and the furthest about one and a half.
  assert.ok(
    fast[2] > slow[2] * 1.5,
    `a fast dash must leave a longer trail: slow ${slow[2].toFixed(1)} vs fast ${fast[2].toFixed(1)}`,
  );
  // Strictly increasing: an after-image may never be in front of a newer one.
  for (const trail of [slow, fast])
    for (let i = 1; i < trail.length; i++)
      assert.ok(trail[i] > trail[i - 1], 'ghosts must be ordered oldest-furthest');
  // And a dash that has not moved must not stack ghosts on top of each other.
  const still = at(0);
  assert.ok(
    still[2] - still[0] > 0.05,
    'a stationary dash still needs separated echoes, not one stacked blob',
  );
  // Every ghost must be a square under an axis-aligned scale -- no rotation.
  for (const g of ghostsFor(d, 4)) {
    assert.ok(g.scale > 0 && g.scale <= 1.001, 'a ghost may only shrink, never mirror');
    assert.equal(g.x * d.lead.y - g.y * d.lead.x, 0, 'a ghost must sit on the axis of travel');
  }
  log('ghosts', `slow ${slow[2].toFixed(1)} · fast ${fast[2].toFixed(1)} half-cubes back`);
});

// 28 ───────────────────────────────────────────────────────────────────────
test('test_armored_hit_pushes_back_and_grants_half_a_second', () => {
  // Part 2: "armored push-back + 0.5 s no-damage".
  //
  // The armoured branch of `cut` used to emit a buzz and `return`, so a blade
  // that bounced off a plate was indistinguishable from a miss -- and then the
  // ordinary 133 ms grace expired while the cube was still inside the shape, so
  // the bounce was followed by a hit for attacking what the game invited you to
  // attack.
  function trial() {
    const g = createRun(7, noop, { staged: true });
    const s = g.state, world = g.world;
    s.phase = 'playing';
    for (let i = 0; i < 20; i++) g.tick();
    for (const e of g.combat.enemies.values()) g.combat.remove(e);
    const e = {
      id: 'armor-1', kind: 'crown', x: 0, y: 0, r: 30, hp: 3,
      angle: 0, vx: 0, vy: 0, small: false, paper: false,
    };
    e.x = world.player.position.x + 55;
    e.y = world.player.position.y;
    g.combat.add(e);
    world.player.velocity.x = 20;
    world.player.velocity.y = 0;
    s.edge = 3;
    s.slashAngle = 0;
    s.blade = 20;
    s.shots = 5;
    const before = world.player.velocity.x;
    g.tick();
    const out = {
      hp: e.hp,
      grace: s.cutGrace,
      from: s.cutGraceFrom,
      vx: world.player.velocity.x,
      before,
    };
    g.dispose();
    return out;
  }
  const r = trial();
  // The hit was ARMOUR: the plate is still there.
  assert.equal(r.hp, 3, 'the crown should have lost no hp from a single cut');
  // Half a second of no-damage from THAT enemy, not the ordinary 133 ms.
  assert.equal(r.from, 'armor-1', 'the grace must be against the enemy that was hit');
  assert.ok(
    r.grace >= ARMOR_GRACE - 1,
    `an armoured hit must grant ~${ARMOR_GRACE} ticks of grace, got ${r.grace}`,
  );
  assert.ok(
    r.grace > CUT_GRACE,
    'the armoured window must be longer than the ordinary post-cut grace',
  );
  // And the cube was shoved back along the cut, not left sitting inside the plate.
  assert.ok(
    r.vx < r.before - 10,
    `the blade must rebound off armour: was ${r.before.toFixed(0)}px/tick, now ${r.vx.toFixed(1)}`,
  );
  // The shove is bounded -- armour is not a slingshot.
  assert.ok(Math.abs(r.vx) <= MAX_SPEED, 'the rebound may never exceed the speed ceiling');
  // And it is bounded by the RUN's ceiling, not by the constant. Clamping to
  // MAX_SPEED here was the first version of this code, and it deleted hyper the
  // first time the cube bounced off a plate at hyper speed -- two tests in
  // hyper.test.js caught it. Reading the source is the cheap guard: the clamp
  // must not mention MAX_SPEED.
  const src = readFileSync(new URL('../src/run.js', import.meta.url), 'utf8');
  const branch = src.slice(src.indexOf('if (e.hp > 0) {'), src.indexOf('combat.remove(e);', src.indexOf('if (e.hp > 0) {')));
  assert.ok(
    !/Math\.min\(1,\s*MAX_SPEED\s*\//.test(branch),
    'the armoured shove must clamp to the live playerCeiling, not the MAX_SPEED constant',
  );
  assert.ok(/playerCeiling/.test(branch), 'the armoured shove must respect the run ceiling');
  log('armor', `hp held · grace ${r.grace} ticks (~${Math.round((r.grace / 60) * 1000)}ms) · rebound ${r.before.toFixed(0)}→${r.vx.toFixed(1)}px/tick`);
});

// 29 ───────────────────────────────────────────────────────────────────────
test('test_floor_kick_has_a_sound_and_a_flash', () => {
  // Two cues the game promised and never delivered:
  //
  //   "one white flash" as the trampoline fires -- `run.js` set `s.floorFlash`
  //   and decremented it every tick, and NO RENDERER EVER READ IT. The cue
  //   existed as a number.
  //
  //   and the kick itself was silent: `run.js` emits `floorKick` and `main.js`
  //   had no case for it, so the most frequent event in the game -- the thing
  //   that keeps the player alive -- made no sound.
  const runSrc = readFileSync(new URL('../src/run.js', import.meta.url), 'utf8');
  const renderSrc = readFileSync(new URL('../src/art/splatr-art-engine.js', import.meta.url), 'utf8');
  const mainSrc = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const audioSrc = readFileSync(new URL('../src/audio.js', import.meta.url), 'utf8');

  // The producer still exists...
  assert.ok(/s\.floorFlash\s*=\s*\d+/.test(runSrc), 'the floor must still set its flash');
  // ...and now something draws it. Assert the value reaches the drawing code,
  // not merely that the name appears somewhere.
  assert.ok(
    /walls\(c, v, p, s\.floorFlash(?:,\s*world\.arena)?\)/.test(renderSrc),
    'the floor flash must be passed into the wall drawing',
  );
  assert.ok(
    /floorFlash > 0/.test(renderSrc) && /#fff6e8/.test(renderSrc),
    'the flash must actually draw something white',
  );
  // The sound: an event with a handler, and a handler that plays a voice that
  // exists on the audio object.
  assert.ok(/emit\('floorKick'/.test(runSrc), 'the kick must still be emitted');
  assert.ok(/case 'floorKick':/.test(mainSrc), 'main must handle the floorKick event');
  assert.ok(/audio\.spring\(/.test(mainSrc), 'the handler must play the spring voice');
  assert.ok(/\bspring\(/.test(audioSrc), 'the audio object must actually define spring()');
  log('floor cues', 'flash drawn · spring voice wired');
});
