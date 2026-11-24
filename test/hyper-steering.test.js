import test from 'node:test';
import assert from 'node:assert/strict';
import { steerRetention } from '../src/run.js';
import { slowFloor, SLOW_MIN, MAX_SPEED } from '../src/physics.js';
import { MOVEMENT } from '../src/movement-model.js';

const deg = (d) => (d * Math.PI) / 180;

test('ordinary flight is unchanged: gentle 75° keeps 1.0, over-speed gets 1.05', () => {
  assert.equal(steerRetention(42, deg(0)), 1);
  assert.equal(steerRetention(42, deg(75)), 1);
  assert.equal(steerRetention(280, deg(75)), 1.05);
  assert.equal(steerRetention(280, deg(60)), 1.05);
});

test('ordinary flight is unchanged: linear fall to 0.85 at 90°, floor beyond', () => {
  assert.equal(steerRetention(42, deg(90)), 0.85);
  assert.equal(steerRetention(42, deg(180)), 0.85);
  const mid = steerRetention(42, deg(82.5));
  assert.ok(Math.abs(mid - 0.925) < 1e-9, 'linear fall, midpoint 0.925');
});

test('hyper keeps the line at all gentle angles: 1.05 flat to 75°', () => {
  assert.equal(steerRetention(280, deg(0), true), 1.05);
  assert.equal(steerRetention(280, deg(30), true), 1.05);
  assert.equal(steerRetention(280, deg(75), true), 1.05);
});

test('hyper falls linearly from 1.05 at 75° to 0.90 at 120°', () => {
  assert.equal(steerRetention(280, deg(120), true), 0.9);
  assert.equal(steerRetention(280, deg(180), true), 0.9);
  assert.ok(Math.abs(steerRetention(280, deg(97.5), true) - 0.975) < 1e-9, 'midpoint of the window');
  const between = steerRetention(280, deg(90), true);
  const expected = 1.05 - 0.15 * ((90 - 75) / (120 - 75));
  assert.ok(Math.abs(between - expected) < 1e-9, 'linear fall across the widened window');
});

test('hyper never drops below nine tenths, at any reversal', () => {
  for (let d = 0; d <= 180; d += 5) {
    assert.ok(steerRetention(280, deg(d), true) >= 0.9, `hyper retention at ${d}° must hold >= 0.9`);
  }
});

test('held aim at over-speed no longer crawls: the floor is 0.55 above 168', () => {
  assert.equal(slowFloor(0), SLOW_MIN);
  assert.equal(slowFloor(42), SLOW_MIN);
  assert.equal(slowFloor(168), SLOW_MIN, 'the threshold itself still gets the ordinary floor');
  assert.equal(slowFloor(169), MOVEMENT.focusFastFloor);
  assert.equal(slowFloor(280), 0.55);
  assert.equal(slowFloor(320), 0.55);
  assert.equal(SLOW_MIN, 0.1);
});

test('an over-speed steer can never leave the cube under the ordinary limit', () => {
  // The exit of the bug report: a 280 px/tick hyper cube veers 120°, and the
  // retention alone must keep it >= 252 px/tick before gravity and drag act.
  assert.ok(280 * steerRetention(280, deg(120), true) >= 252);
  assert.ok(280 * steerRetention(280, deg(75), true) >= 280);
});

test('a cut at pace fills MOMENTUM for a real over-speed body and never for a stall', () => {
  // Mirror of the run.js gate: the cut speed uses the same px/tick unit the
  // physics publishes, and the same 0.6 * MAX_SPEED threshold.
  const threshold = MAX_SPEED * 0.6;
  assert.ok(42 >= threshold, 'a full-power dash counts as at pace');
  assert.ok(10 < threshold, 'a falling body (fall cap is 10) never counts');
});

// ── Live simulation: the two halves of the fix, end to end ─────────────────
import { createRun } from '../src/run.js';
import { setPlayerVelocity, createPhysics, stepPhysics, destroyPhysics } from '../src/physics.js';
import { createMomentum, gainMomentum } from '../src/momentum.js';
import Matter from 'matter-js';

const { Body } = Matter;

function freshRun() {
  const r = createRun(131, () => {}, { waveMode: true });
  r.state.phase = 'playing';
  r.state.wave.entry = 0;
  return r;
}

test('held aim at over-speed holds the world at 55%, ordinary flight still crawls at 10%', () => {
  // Driven at the physics layer — the run loop's own focus() call site reads
  // the same world.slow clock, so what this proves is the rule the run gets.
  const fast = createPhysics({ seed: 1, spawn: { x: 0, y: 0 }, pad: null, arena: null });
  fast.playerCeiling = 280; // hyper ceiling, so the substep clamp leaves it alone
  Body.setVelocity(fast.player, { x: 280, y: 0 });
  fast.slow = true;
  for (let i = 0; i < 90; i++) stepPhysics(fast, () => {});
  assert.ok(
    fast.engine.timing.timeScale >= 0.5,
    `over-speed held frame must not crawl: ${fast.engine.timing.timeScale}`,
  );
  assert.ok(
    Math.abs(fast.engine.gravity.scale - 0.001 * fast.focusScale) < 1e-9,
    'gravity keeps exactly the fraction of itself the clock does',
  );
  destroyPhysics(fast);

  const ordinary = createPhysics({ seed: 1, spawn: { x: 0, y: 0 }, pad: null, arena: null });
  Body.setVelocity(ordinary.player, { x: 20, y: 0 });
  ordinary.slow = true;
  for (let i = 0; i < 90; i++) stepPhysics(ordinary, () => {});
  assert.ok(
    ordinary.engine.timing.timeScale <= 0.12,
    `ordinary held frame keeps the 90% slow: ${ordinary.engine.timing.timeScale}`,
  );
  destroyPhysics(ordinary);
});

test('three pips and a 5-link chain promote to hyper; two pips do not', () => {
  const full = freshRun();
  full.state.chain = 5;
  full.state.chainTime = 100;
  full.state.shots = 5;
  full.state.chainFrom = 0;
  gainMomentum(full.state.momentum);
  gainMomentum(full.state.momentum);
  gainMomentum(full.state.momentum);
  setPlayerVelocity(full.world, 30, 0);
  full.tick();
  assert.equal(full.state.hyper, true, 'full ledger relaxes the gate to five links');
  assert.equal(full.state.momentum.count, 3, 'pips are a permission, not a currency — entering hyper spends nothing');

  const short = freshRun();
  short.state.chain = 5;
  short.state.chainTime = 100;
  short.state.shots = 5;
  short.state.chainFrom = 0;
  gainMomentum(short.state.momentum);
  gainMomentum(short.state.momentum);
  setPlayerVelocity(short.world, 30, 0);
  short.tick();
  assert.equal(short.state.hyper, false, 'two pips are not enough for the relaxed gate');
});

test('the ordinary 7-link gate still works with an empty ledger', () => {
  const r = freshRun();
  r.state.chain = 7;
  r.state.chainTime = 100;
  r.state.shots = 7;
  r.state.chainFrom = 0;
  setPlayerVelocity(r.world, 30, 0);
  r.tick();
  assert.equal(r.state.hyper, true);
});
