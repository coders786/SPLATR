import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { createShake, SHAKE, MOTION } from '../src/motion.js';
import { impactFor } from '../src/stroke.js';

test('hitstop freezes physical entities but not elapsed/effect clocks', () => {
  const run = createRun(19, () => {}, { staged: false });
  try {
    run.state.phase = 'playing';
    run.state.invul = 999;
    Matter.Body.setPosition(run.world.player, { x: 0, y: 0 });
    Matter.Body.setVelocity(run.world.player, { x: 20, y: -10 });
    for (const e of run.combat.enemies.values()) run.combat.remove(e);
    const enemy = run.combat.add({
      id: 'freeze',
      kind: 'fang',
      x: 200,
      y: -200,
      home: 'freeze',
      slot: -1,
    });
    run.state.stop = 5;
    run.state.slashAge = 2;
    const before = { ...run.world.player.position },
      foe = { x: enemy.x, y: enemy.y },
      elapsed = run.state.elapsed;
    for (let i = 0; i < 5; i++) run.tick();
    assert.deepEqual(run.world.player.position, before);
    assert.equal(enemy.x, foe.x);
    assert.equal(enemy.y, foe.y);
    assert.equal(run.state.elapsed, elapsed + 5);
    assert.ok(run.state.slashAge > 2, 'effect clock was frozen');
    for (const kind of ['crown', 'bastion'])
      assert.ok(
        impactFor(kind, false, false).stop >= 3 &&
          impactFor(kind, false, false).stop <= 8,
      );
    assert.ok(
      impactFor('fang', false, true).stop >= 3 &&
        impactFor('fang', false, true).stop <= 8,
    );
  } finally {
    run.dispose();
  }
});

test('world shake is trauma squared, bounded strictly below .6 degrees and non-stacking', () => {
  const shake = createShake();
  shake.ask(3, 0);
  assert.ok(
    Math.abs(
      shake.px -
        Math.min(
          SHAKE.maxPx,
          MOTION.shakeBudget,
          shake.trauma ** 2 * SHAKE.maxPx,
        ),
    ) < 1e-9,
  );
  const initial = shake.trauma;
  shake.ask(100, 0);
  assert.equal(shake.trauma, initial);
  for (let i = 0; i < 120; i++) {
    if (i % 7 === 0) shake.ask(100, 0);
    shake.tick(1);
    assert.ok(Math.abs(shake.rollDeg) < 0.6);
    assert.ok(shake.px <= MOTION.shakeBudget);
  }
});
