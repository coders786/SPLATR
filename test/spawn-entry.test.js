import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import Matter from 'matter-js';

test('camera pan, zoom and first entry never drag or delete existing enemies', () => {
  const a = createRun(19, () => {}, { staged: false }),
    b = createRun(19, () => {}, { staged: false });
  try {
    for (const run of [a, b]) {
      for (const e of run.combat.enemies.values()) run.combat.remove(e);
      Matter.Body.setPosition(run.world.player, { x: 0, y: 0 });
      for (const [i, kind] of [
        'fang',
        'prism',
        'crown',
        'rift',
        'bastion',
      ].entries())
        run.combat.add({
          id: `camera-${i}`,
          kind,
          x: 400 + i * 90,
          y: -200 - i * 120,
          home: 'fixture',
          slot: -1,
        });
    }
    for (let t = 0; t < 400; t++) {
      a.world.viewport = { x: -500, y: -400, w: 1000, h: 800, scale: 1 };
      b.world.viewport = {
        x: t % 2 ? 350 : -8000,
        y: t % 3 ? -2000 : 10000,
        w: t % 2 ? 300 : 2000,
        h: 900,
        scale: t % 2 ? 0.4 : 2,
      };
      a.combat.move(1, 3);
      b.combat.move(1, 3);
      const snapshot = (run) =>
        [...run.combat.enemies.values()].map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          vx: e.vx,
          vy: e.vy,
          mode: e.mode,
          tx: e.tx,
          ty: e.ty,
        }));
      assert.deepEqual(
        snapshot(b),
        snapshot(a),
        `camera changed world simulation at tick ${t}`,
      );
      assert.equal(b.combat.enemies.size, 5, 'pan culled live enemies');
    }
  } finally {
    a.dispose();
    b.dispose();
  }
});
