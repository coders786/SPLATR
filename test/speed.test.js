import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhysics, stepPhysics, boostPlayer, destroyPhysics, MAX_SPEED } from '../src/physics.js';
import Matter from 'matter-js';

const { Body } = Matter;

const world = () =>
  createPhysics({ seed: 1, spawn: { x: 0, y: 0 }, pad: null, arena: null });

test('the speed ceiling is honoured on EVERY tick, not just inside the substep loop', (t) => {
  // THE BUG THIS PINS: `snapshot()` used to call capVelocity() with no ceiling,
  // hard-clamping to MAX_SPEED at the top of every tick. world.playerCeiling was
  // honoured inside the substep loop and then silently undone, so every speed
  // boost all session was erased -- peak speed never once exceeded 42.1 against
  // a stated ceiling of 88, and "reach the wall" measured identically at every
  // launch speed.
  const w = world();
  t.after(() => destroyPhysics(w));
  w.playerCeiling = 280;
  Body.setVelocity(w.player, { x: 0, y: -280 });
  for (let i = 0; i < 5; i++) {
    stepPhysics(w, () => {});
    // Gravity bleeds it, but it must stay far above MAX_SPEED for several ticks.
    assert.ok(
      w.player.speed > MAX_SPEED * 2,
      `tick ${i}: speed ${w.player.speed.toFixed(1)} collapsed to the normal cap`,
    );
  }
});

test('a raised ceiling actually buys a longer climb', (t) => {
  const climb = (ceiling) => {
    const w = world();
    w.playerCeiling = ceiling;
    Body.setVelocity(w.player, { x: 0, y: -ceiling });
    let peak = 0;
    for (let i = 0; i < 2000; i++) {
      stepPhysics(w, () => {});
      peak = Math.min(peak, w.player.position.y);
      if (w.player.velocity.y > 0.5) break;
    }
    destroyPhysics(w);
    return Math.abs(peak);
  };
  const normal = climb(MAX_SPEED);
  const hyper = climb(280);
  assert.ok(hyper > normal * 10, `hyper ${hyper} should dwarf normal ${normal}`);
  // The figure the hyper design depends on: a 78,000px wall must be reachable.
  assert.ok(hyper > 78000, `a 280 ceiling must clear the 78,000px wall, reached ${hyper}`);
});

test('the normal ceiling still clamps, so ordinary play is unchanged', (t) => {
  const w = world();
  t.after(() => destroyPhysics(w));
  Body.setVelocity(w.player, { x: 0, y: -280 });
  stepPhysics(w, () => {});
  assert.ok(w.player.speed <= MAX_SPEED + 0.001, 'without a raised ceiling the cap holds');
});

test('boostPlayer cannot exceed the ceiling it is given', (t) => {
  const w = world();
  t.after(() => destroyPhysics(w));
  Body.setVelocity(w.player, { x: 0, y: -40 });
  boostPlayer(w, 10, 100); // absurd factor, hard ceiling
  assert.ok(w.player.speed <= 100.001, `got ${w.player.speed}`);
  assert.ok(w.player.speed > 40, 'it still gained');
});
