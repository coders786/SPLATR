import Matter from 'matter-js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhysics,
  launch,
  stepPhysics,
  destroyPhysics,
} from '../src/physics.js';
import { predictAim, magnetize } from '../src/aim.js';
import { createInput } from '../src/input.js';

test('post-magnetize preview and actual launch agree through 30 free-flight ticks', () => {
  const prev = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  let worst = 0;
  try {
    for (const shot of [
      { x: 14, y: -8, power: 0.5 },
      { x: 40, y: -10, power: 1 },
      { x: 0, y: -42, power: 1 },
      { x: 30, y: 29, power: 1 },
    ]) {
      const world = createPhysics({
        seed: 1,
        spawn: { x: 0, y: 0 },
        solids: [],
      });
      const combat = {
        enemies: new Map([
          ['target', { id: 'target', x: 360, y: -200, r: 30, kind: 'fang' }],
        ]),
      };
      const run = {
        focus() {},
        world,
        combat,
        state: { line: -Infinity },
        assist: () => ({ corridor: 26 }),
      };
      const final = magnetize(world.player.position, shot, combat, {
        focus: true,
        corridor: 26,
      });
      const preview = predictAim(run, final, { magnetic: false });
      const input = createInput(
        {
          style: {},
          addEventListener() {},
          removeEventListener() {},
          hasPointerCapture() {
            return false;
          },
        },
        {
          get: () => run,
          active: () => true,
          assist: () => true,
          engage() {},
          point() {
            return { x: 0, y: 0 };
          },
          lock: { once: null, tick() {} },
          commit: (v) => launch(world, v),
        },
      );
      input.fire(final);
      assert.ok(
        Math.hypot(
          world.player.velocity.x - preview.velocity.x,
          world.player.velocity.y - preview.velocity.y,
        ) < 1e-9,
      );
      for (let tick = 1; tick <= 30; tick++) {
        stepPhysics(world);
        if (tick % 2 === 0) {
          const p = preview.path[tick / 2 - 1];
          worst = Math.max(
            worst,
            Math.hypot(
              world.player.position.x - p.x,
              world.player.position.y - p.y,
            ),
          );
        }
      }
      destroyPhysics(world);
    }
    assert.ok(worst < 1e-6, `preview drift ${worst}`);
    console.log(
      `QA post-magnetize launch: 4 vectors × 30 ticks; worst free-flight error=${worst.toExponential(3)}px`,
    );
  } finally {
    globalThis.window = prev;
  }
});

test('limited ordinary-flight preview agrees with physical post-tick speed limits', () => {
  const world = createPhysics({ seed: 1, spawn: { x: 0, y: 0 }, solids: [] });
  try {
    const shot = { x: 0, y: 42, power: 1 };
    const run = {
      world,
      combat: { enemies: new Map() },
      state: { phase: 'playing', floorIgnore: 0 },
    };
    const preview = predictAim(run, shot, { magnetic: false });
    launch(world, shot);
    let worst = 0;
    for (let tick = 1; tick <= 30; tick++) {
      stepPhysics(world);
      // Same normalized-velocity API used by run.js; direct property writes do
      // not update Matter's positionPrev and are not physical speed limits.
      Matter.Body.setVelocity(world.player, {
        x: world.player.velocity.x,
        y: Math.max(-26, Math.min(10, world.player.velocity.y)),
      });
      if (tick % 2 === 0) {
        const p = preview.path[tick / 2 - 1];
        worst = Math.max(
          worst,
          Math.hypot(
            world.player.position.x - p.x,
            world.player.position.y - p.y,
          ),
        );
      }
    }
    assert.ok(worst < 1e-6, `limited path drift ${worst}`);
  } finally {
    destroyPhysics(world);
  }
});
