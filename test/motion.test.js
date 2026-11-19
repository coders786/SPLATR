import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTION,
  speedRamp,
  stretchFor,
  leanFor,
  dampedTarget,
  createShake,
  speedReadout,
  enemyIsSharp,
} from '../src/motion.js';
import { MAX_SPEED } from '../src/physics.js';
import { createCamera } from '../src/camera.js';

// --- the guarantee that matters most ---------------------------------------
test('enemies are never blurred, at any speed', () => {
  // This is the one property the whole motion system exists to protect: a
  // blurred enemy is a missed tell, and a missed tell is a lost run.
  assert.equal(MOTION.enemyBlur, 0);
  assert.equal(enemyIsSharp(true), true);
  assert.equal(enemyIsSharp(false), true);
});

test('the player stretches and blurs with speed, monotonically and capped', () => {
  let prevBlur = -1;
  for (let s = 0; s <= MAX_SPEED * 1.5; s += 1) {
    const e = stretchFor(s);
    assert.ok(e.blur >= prevBlur, `blur fell at speed ${s}`);
    assert.ok(e.blur <= MOTION.blurMax + 1e-9, `blur over cap at ${s}`);
    // The ceiling rose with the "more juice at higher speed" pass: the cube
    // now reaches 1.52 along at REDLINE instead of 1.34, so the last stretch
    // of speed is visible rather than a rounded-off constant. `across` narrows
    // further to match, but must never reach 0 (a zero-width cube cannot be
    // aimed).
    assert.ok(e.along >= 1 && e.along <= 1.55, `along out of range at ${s}`);
    assert.ok(e.across > 0.7 && e.across <= 1, `across out of range at ${s}`);
    prevBlur = e.blur;
  }
  // A resting cube is completely still: no stretch, no smear.
  const still = stretchFor(0);
  assert.equal(still.blur, 0);
  assert.equal(still.along, 1);
  assert.equal(still.across, 1);
  assert.equal(speedRamp(0), 0);
  assert.equal(speedRamp(MAX_SPEED), 1);
});

// --- camera calm ----------------------------------------------------------
test('the camera ignores motion inside its dead zone and leans only when committed', () => {
  // Inside the dead zone the ideal target is returned unchanged apart from the
  // dead-zone subtraction, so a jittery thumb cannot drag the world.
  const view = 1000;
  const still = dampedTarget({ x: 5, y: 5 }, { x: 0, y: 0 }, view, view);
  assert.equal(still.x, 0, 'a 5px wobble must not move the camera');
  assert.equal(still.y, 0);
  // Well outside it, the camera does follow.
  const far = dampedTarget({ x: 900, y: 0 }, { x: 0, y: 0 }, view, view);
  assert.ok(far.x > 700, 'a real move is followed');
  // Lean is exactly zero below the committed threshold.
  assert.deepEqual(leanFor(0, 0), { x: 0, y: 0 });
  assert.deepEqual(leanFor(MAX_SPEED * MOTION.leanFrom * 0.5, 0), { x: 0, y: 0 });
  const hard = leanFor(MAX_SPEED, 0);
  assert.ok(hard.x > 0 && hard.x <= MOTION.leanMax + 1e-9, `lean ${hard.x}`);
});

test('the camera comes to rest and does not creep', () => {
  // Calm is not the follow rate: a loose follow lets the cube outrun the lens
  // and costs visible targets (measured: 30 kills -> 22 at follow 0.062).
  // What must be true is that a stationary cube gives a stationary camera.
  assert.ok(MOTION.follow <= 0.2, 'follow must not be a snap');
  const cam = createCamera();
  cam.resize(880, 710);
  cam.reset({ x: 0, y: 0 }, 1);
  const p = { x: 0, y: 0 };
  // Hold a still cube: the camera must come to rest, not creep.
  for (let i = 0; i < 400; i++) cam.tick(p, { x: 0, y: 0 }, false, true, null, 0);
  const a = cam.view(1);
  for (let i = 0; i < 60; i++) cam.tick(p, { x: 0, y: 0 }, false, true, null, 0);
  const b = cam.view(1);
  assert.ok(Math.abs(a.x - b.x) < 0.6 && Math.abs(a.y - b.y) < 0.6, 'camera drifts at rest');
});

// --- shake budget ---------------------------------------------------------
test('shake is capped by a regenerating budget, so it can never vibrate forever', () => {
  const sh = createShake();
  // Ask for far more than the budget, many times in a row.
  for (let i = 0; i < 40; i++) sh.ask(50, 0);
  assert.ok(sh.amount <= MOTION.shakeBudget + 1e-9, `amount ${sh.amount}`);
  // It decays back to rest.
  for (let i = 0; i < 200; i++) sh.tick(1);
  assert.equal(sh.amount, 0);
  // And a spent bank grants nothing until it regenerates.
  const spent = createShake();
  spent.ask(50, 0);
  const before = spent.amount;
  spent.tick(1);
  const after = spent.amount;
  assert.ok(after < before, 'shake must decay');
  assert.ok(spent.ask(0.0001, 0) === 0, 'a drained bank grants no new shake');
});

test('a high refresh rate cannot buy more shake than a low one', () => {
  // Two frames at dt=0.5 must leave the same amount as one frame at dt=1.
  const a = createShake(),
    b = createShake();
  a.ask(2, 0);
  b.ask(2, 0);
  a.tick(0.5);
  a.tick(0.5);
  b.tick(1);
  assert.ok(Math.abs(a.amount - b.amount) < 1e-9, `${a.amount} vs ${b.amount}`);
});

// --- speedometer ----------------------------------------------------------
test('the speedometer is monotonic, in range and names a band', () => {
  let prev = -1;
  for (let s = 0; s <= MAX_SPEED; s += 0.5) {
    const r = speedReadout(s);
    assert.ok(r.kmh >= prev, 'readout must not go backwards');
    assert.ok(r.kmh >= 0 && r.kmh <= 100, `kmh ${r.kmh}`);
    assert.ok(['DRIFT', 'CRUISE', 'SURGE', 'EDGE'].includes(r.band));
    prev = r.kmh;
  }
  assert.equal(speedReadout(0).kmh, 0);
  assert.equal(speedReadout(0).band, 'DRIFT');
  assert.equal(speedReadout(MAX_SPEED).kmh, 100);
  assert.equal(speedReadout(MAX_SPEED).band, 'EDGE');
});
