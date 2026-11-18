import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { SPAWN, PAD } from '../src/levels.js';
import {
  createPhysics,
  stepPhysics,
  dragVector,
  setBulletTime,
  launch,
  BASE_GRAVITY,
  SLOW_MIN,
  MAX_SPEED,
  MAX_PULL,
  sweptHit,
  STEP_MS,
  projectilePoint,
} from '../src/physics.js';
import { createClock } from '../src/clock.js';

const close = (a, b, epsilon = 1e-7) => assert.ok(Math.abs(a - b) < epsilon, `${a} ≠ ${b}`);
const ticks = (n, fn) => {
  for (let i = 0; i < n; i++) fn();
};
const lab = (options = {}) =>
  createPhysics({ seed: 1, spawn: { x: 160, y: 240 }, solids: [], ...options });

test('pool-cue vector: dead zone, reversed direction, elastic power and radial cap', () => {
  const origin = { x: 100, y: 100 };
  assert.deepEqual(dragVector(origin, { x: 103, y: 101 }), { x: 0, y: 0, power: 0 });
  // A full pull is still exactly full speed, and still exactly along the pull.
  const full = dragVector(origin, { x: 100 - MAX_PULL, y: 100 });
  close(full.power, 1);
  close(full.x, MAX_SPEED);
  // Half a pull is deliberately a little UNDER half speed (elastic short end),
  // so the useful band of powers is physically larger and a stray thumb
  // movement cannot fire a near-full shot.
  const half = dragVector(origin, { x: 100 - MAX_PULL / 2, y: 100 });
  close(half.y, 0);
  assert.ok(half.power > 0.3 && half.power < 0.5, `half pull = ${half.power}`);
  close(half.x, MAX_SPEED * half.power);
  // Monotonic: more pull is never less speed, and it never exceeds the cap.
  let prev = 0;
  for (let d = 8; d <= MAX_PULL * 2; d += 6) {
    const v = dragVector(origin, { x: 100 - d, y: 100 });
    assert.ok(v.power >= prev - 1e-9, `not monotonic at ${d}px`);
    assert.ok(v.power <= 1);
    prev = v.power;
  }
  const diagonal = dragVector(origin, { x: -1000, y: 1200 });
  close(Math.hypot(diagonal.x, diagonal.y), MAX_SPEED);
  close(diagonal.x, -diagonal.y);
});

test('bullet time eases to a 50% floor, then release restores baseline', () => {
  const w = lab();
  setBulletTime(w, true);
  stepPhysics(w);
  assert.ok(w.engine.timing.timeScale < 1 && w.engine.timing.timeScale > SLOW_MIN);
  ticks(30, () => stepPhysics(w));
  // Half speed, never less. A 0.15 floor made a held aim feel like a
  // different game, which is exactly what the fast build is removing.
  close(w.engine.timing.timeScale, SLOW_MIN);
  assert.equal(SLOW_MIN, 0.5);
  // Gravity still goes fully light while focus is held: at half speed the
  // committed parabola stays readable, and gravity returning on release is
  // what makes the launch feel committed rather than floaty.
  close(w.engine.gravity.scale, BASE_GRAVITY * 0.1);
  // Release does not hard-snap back to real time: the scale eases up, so a
  // shallow panic grace passes through the same interpolation.
  setBulletTime(w, false);
  assert.ok(w.engine.timing.timeScale >= SLOW_MIN && w.engine.timing.timeScale < 1);
  ticks(20, () => stepPhysics(w));
  close(w.engine.timing.timeScale, 1);
  setBulletTime(w, true, true);
  assert.ok(launch(w, { x: 2000, y: -2000 }));
  close(w.player.speed, MAX_SPEED);
  close(w.engine.timing.timeScale, 1);
  close(w.engine.gravity.scale, BASE_GRAVITY);
  assert.equal(launch(w, { x: NaN, y: 4 }), false);
});

test('support normals distinguish floors from ceilings and airborne re-aims', () => {
  const w = createPhysics({ spawn: SPAWN, pad: PAD });
  ticks(8, () => stepPhysics(w));
  assert.equal(w.grounded, true);
  launch(w, { x: 0, y: -20 });
  stepPhysics(w);
  assert.equal(w.grounded, false);
  const roof = lab({ spawn: { x: 160, y: 30 }, solids: [{ x: 80, y: -5, w: 250, h: 5 }] });
  launch(roof, { x: 0, y: -20 });
  stepPhysics(roof);
  assert.equal(roof.grounded, false);
});

test('slab sweep handles thin geometry, parallel paths and initial overlaps', () => {
  const r = { x: 100, y: 30, w: 1, h: 40 };
  assert.deepEqual(sweptHit(0, 40, 200, 0, r), { t: 0.5, nx: -1, ny: 0 });
  assert.deepEqual(sweptHit(200, 40, -198, 0, r), { t: 0.5, nx: 1, ny: 0 });
  assert.equal(sweptHit(0, 8, 200, 0, r), null);
  assert.equal(sweptHit(100.5, 40, 10, 0, r), null);
  assert.deepEqual(sweptHit(100.5, 0, 0, 100, r), { t: 0.3, nx: 0, ny: -1 });
});

for (const [name, platform, spawn, velocity, axis, limit] of [
  ['vertical', { x: 440, y: 0, w: 1, h: 650 }, { x: 240, y: 240 }, { x: 4000, y: 0 }, 'x', 440],
  ['horizontal', { x: 0, y: 410, w: 900, h: 1 }, { x: 350, y: 170 }, { x: 19, y: 4000 }, 'y', 410],
]) {
  test(`rotating, over-speed blade cannot cross a 1px ${name} wall`, () => {
    const w = lab({ solids: [platform], spawn });
    Matter.Body.setVelocity(w.player, velocity);
    Matter.Body.setAngularVelocity(w.player, 0.8);
    let touched = false;
    for (let i = 0; i < 30; i++) {
      stepPhysics(w);
      if (i === 0) assert.ok(w.substeps > 1);
      assert.ok(w.player.speed <= MAX_SPEED + 1e-7);
      const edge = Math.max(...w.player.vertices.map((v) => v[axis]));
      if (edge > limit - 5) touched = true;
      assert.ok(edge < limit + 0.4, `passed wall by ${edge - limit} px`);
    }
    assert.ok(touched, 'test shot really reached the wall');
  });
}

test('ballistic guide follows real free flight within a few logical pixels', () => {
  const w = lab();
  const start = { ...w.player.position },
    v = { x: 14, y: -8 };
  launch(w, v);
  ticks(15, () => stepPhysics(w));
  const point = projectilePoint(start, v, 15);
  close(w.player.position.x, point.x);
  close(w.player.position.y, point.y, 2);
});

test('clock bounds catch-up after stalls and drops old debt on resume', () => {
  const clock = createClock();
  let n = 0;
  clock.frame(0, () => n++);
  clock.frame(5000, () => n++);
  assert.equal(n, 6);
  clock.reset();
  clock.frame(10000, () => n++);
  assert.equal(n, 6);
  close(
    clock.frame(10000 + STEP_MS / 2, () => n++),
    0.5,
  );
});
