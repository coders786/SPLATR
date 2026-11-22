import * as arenaModule from '../src/levels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';
import { installDom, createDisplay } from './support/display.js';

test('eligible three-Fang clusters never exchange a hull hit for a cut, in every contact order', () => {
  for (const order of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    const run = createRun(19, () => {}, { staged: false });
    try {
      run.state.phase = 'playing';
      run.state.invul = 0;
      for (const e of run.combat.enemies.values()) run.combat.remove(e);
      Matter.Body.setPosition(run.world.player, { x: 0, y: 0 });
      run.dash({ x: 30, y: -10, power: 1 });
      run.state.stop = 1;
      const enemies = [0, 1, 2].map((i) =>
        run.combat.add({
          id: `cluster-${i}`,
          kind: 'fang',
          x: 180 + i * 60,
          y: -100,
          home: 'cluster',
          slot: -1,
        }),
      );
      for (const i of order) run.combat.contacts.add(enemies[i]);
      const hp = run.state.hp;
      run.tick();
      assert.equal(run.state.hp, hp);
      assert.equal(run.state.kills, 3);
    } finally {
      run.dispose();
    }
  }
});

test('ghost sampling is fixed-update only and drift clears all dash traces', () => {
  const dom = installDom(),
    { canvas, ctx } = createDisplay(960, 720),
    renderer = createRenderer(canvas),
    run = createRun(19, () => {}, { staged: false });
  try {
    run.state.phase = 'playing';
    run.state.moved = 42;
    run.world.grounded = false;
    Matter.Body.setVelocity(run.world.player, { x: 42, y: 0 });
    run.world.engine.timing.timeScale = 0.1;
    for (let age = 0; age < 7; age++) {
      run.state.slashAge = age;
      renderer.tick(run, true);
    }
    const before = renderer.effectState();
    assert.ok(before.ghosts > 0);
    for (let i = 0; i < 30; i++) {
      ctx.__reset();
      renderer.draw(run, 1, null, true);
    }
    assert.deepEqual(
      renderer.effectState(),
      before,
      'draw emitted or aged a ghost',
    );
    run.state.slashAge = 30;
    for (let t = 0; t < 25; t++) renderer.tick(run, true);
    assert.equal(renderer.effectState().ghosts, 0);
    assert.equal(renderer.effectState().trail, 0);
  } finally {
    renderer.dispose();
    run.dispose();
    dom.uninstall();
  }
});

test('real connected cuts cannot bypass the final player body envelope', () => {
  const dom = installDom(),
    { canvas, ctx } = createDisplay(960, 720),
    renderer = createRenderer(canvas);
  const run = createRun(19, (type, data) => renderer.event(type, data, true), {
    staged: false,
  });
  try {
    run.state.phase = 'playing';
    run.state.invul = 0;
    for (const e of run.combat.enemies.values()) run.combat.remove(e);
    Matter.Body.setPosition(run.world.player, { x: 0, y: 0 });
    run.dash({ x: 0, y: -42, power: 1 });
    run.state.stop = 1;
    const enemy = run.combat.add({
      id: 'envelope',
      kind: 'fang',
      x: 180,
      y: -100,
      home: 'fixture',
      slot: -1,
    });
    run.combat.contacts.add(enemy);
    run.tick();
    assert.equal(run.state.kills, 1);
    assert.equal(run.state.landAge, 0);
    renderer.tick(run, true);
    ctx.__reset();
    renderer.draw(run, 1, null, true);
    const body = ctx.__ops.find(
      (o) =>
        o.kind === 'fill' &&
        o.pts.length === 6 &&
        String(o.paint).toLowerCase() === '#fff8ec' &&
        o.alpha >= 0.6,
    );
    assert.ok(body, 'opaque player missing');
    const scale = renderer.questView().scale;
    // Body transform includes its nominal radius (PLAYER_SIZE/2 = 23).
    const { PLAYER_SIZE } = arenaModule;
    assert.ok(Math.abs(body.m[0]) / ((scale * PLAYER_SIZE) / 2) <= 1.250001);
    assert.ok(Math.abs(body.m[3]) / ((scale * PLAYER_SIZE) / 2) <= 1.250001);
  } finally {
    renderer.dispose();
    run.dispose();
    dom.uninstall();
  }
});
