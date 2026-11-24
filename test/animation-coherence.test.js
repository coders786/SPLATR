import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { placePlayer } from '../src/physics.js';
import { createRenderer } from '../src/renderer.js';
import { DASH } from '../src/animation.js';
import { VISUAL_EVENT_MAP } from '../src/art/splatr-art-engine.js';
import { createDisplay, installDom } from './support/display.js';

function setupRenderer() {
  const dom = installDom();
  const display = createDisplay(880, 710);
  const renderer = createRenderer(display.canvas);
  const run = createRun(19, () => {}, { staged: true });
  run.skipOpening();
  run.state.phase = 'playing';
  for (let i = 0; i < 30; i++) run.tick();
  // Keep this a renderer fixture, not an enemy-selection test. The production
  // dash contract is local to the player, so remove the staged foe and its HUD
  // arrow before comparing frames.
  for (const enemy of [...run.combat.enemies.values()]) run.combat.remove(enemy);
  Object.assign(run.state, {
    landAge: -1,
    slashAge: -1,
    boom: null,
    hyper: false,
    hyperLevel: 0,
    hyperAge: 999,
    blade: 0,
  });
  return { ...display, dom, renderer, run };
}

function beginEastDash(run) {
  assert.equal(run.dash({ x: 42, y: 0, power: 1 }), true, 'the real launch was refused');
  run.world.grounded = false;
  run.state.slashAge = DASH.windup + 2;
  assert.equal(run.state.launchAngle, 0, 'the test launch must commit EAST');
}

function localFrame(ctx) {
  const body = ctx.__ops.find(
    (op) => op.kind === 'fill' && op.paint === '#fff8ec' && op.pts.length === 6,
  );
  assert.ok(body, 'the recording canvas must contain the player body');
  const xs = body.pts.map(([x]) => x);
  const ys = body.pts.map(([, y]) => y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // Ignore the minimap/HUD. What remains is the player-local event stack: the
  // wake, body pose, dust, and any contradictory dash ornament.
  return ctx.__ops
    .filter((op) => op.pts.some(([x, y]) => Math.hypot(x - cx, y - cy) < 240))
    .map(({ kind, paint, alpha, pts, m }) => ({ kind, paint, alpha, pts, m }));
}

function renderLocal(fixture, velocity) {
  const { ctx } = fixture;
  Matter.Body.setVelocity(fixture.run.world.player, velocity);
  ctx.__reset();
  fixture.renderer.draw(fixture.run, 1, null, true, 'mouse');
  return localFrame(ctx);
}

test('a real dash keeps its launch bearing when live velocity changes', () => {
  const fixture = setupRenderer();
  try {
    beginEastDash(fixture.run);
    const east = renderLocal(fixture, { x: 42, y: 0 });
    const north = renderLocal(fixture, { x: 0, y: 42 });
    assert.equal(fixture.run.state.launchAngle, 0, 'rendering must not rewrite the launch snapshot');
    assert.deepEqual(
      north,
      east,
      'mutating velocity after launch must not rotate the wake or dash deformation',
    );
  } finally {
    fixture.renderer.dispose();
    fixture.run.dispose();
    fixture.dom.uninstall();
  }
});

test('the recording canvas contains one dash owner, not contradictory motion layers', () => {
  const fixture = setupRenderer();
  try {
    beginEastDash(fixture.run);
    // A post-launch downward velocity is the adversarial case: it used to
    // resurrect fall cels, a speed wedge, and airborne smear copies over the
    // already committed wake.
    Matter.Body.setVelocity(fixture.run.world.player, { x: 0, y: 42 });
    fixture.ctx.__reset();
    fixture.renderer.draw(fixture.run, 1, null, true, 'mouse');
    const local = localFrame(fixture.ctx);
    const cubeSmearCels = local.filter(
      (op) => op.kind === 'fill' && op.paint === '#fff8e8' && op.alpha > 0 && op.alpha < 0.6,
    );
    const genericWedges = local.filter(
      (op) =>
        op.kind === 'fill' &&
        op.pts.length === 3 &&
        ['#d8f19c', '#deff52'].includes(String(op.paint).toLowerCase()),
    );
    const fallStreaks = local.filter(
      (op) => op.kind === 'stroke' && String(op.paint).toLowerCase() === '#c0b8cc',
    );
    assert.equal(cubeSmearCels.length, 0, 'three displaced body cels must not stack on the wake');
    assert.equal(genericWedges.length, 0, 'the generic dash wedge must not stack on the elemental wake');
    assert.equal(fallStreaks.length, 0, 'airborne fall streaks must yield to the dash owner');
    assert.ok(
      local.some((op) => op.kind === 'fill' && op.paint === '#181321'),
      'the elemental wake must still reach the recording canvas',
    );
  } finally {
    fixture.renderer.dispose();
    fixture.run.dispose();
    fixture.dom.uninstall();
  }
});

test('one real bank emits one field disturbance and marks its local records', () => {
  const dom = installDom();
  const run = createRun(41, () => {}, { waveMode: true });
  try {
    run.state.invul = 99999;
    run.state.wave.entry = 0;
    placePlayer(run.world, { x: 1450, y: -450 });
    assert.equal(run.dash({ x: 42, y: 0, power: 1 }), true);
    for (let i = 0; i < 4; i++) run.tick();
    assert.equal(run.state.dimension.impulses.filter((item) => item.kind === 'bank').length, 1);
    assert.equal(run.state.impact.source, 'bank');
    assert.equal(run.state.boom.source, 'bank');
  } finally {
    run.dispose();
    dom.uninstall();
  }
});

test('the visual event map is immutable and names the dash owner', () => {
  assert.equal(Object.isFrozen(VISUAL_EVENT_MAP), true);
  assert.equal(Object.isFrozen(VISUAL_EVENT_MAP.dash), true);
  assert.equal(VISUAL_EVENT_MAP.dash.primary, 'elemental-wake');
  assert.ok(VISUAL_EVENT_MAP.dash.suppressed.includes('cube-smear'));
  assert.ok(VISUAL_EVENT_MAP.dash.suppressed.includes('generic-speed-wedge'));
});
