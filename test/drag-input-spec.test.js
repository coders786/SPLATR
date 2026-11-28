/* ── THE 120ms RELOAD BUFFER & THE MOMENTUM GUARANTEE (CHUNK 2) ────────────
 *
 * Three contracts from the director brief, tested at the real seams:
 *   1. test_drag_pointer_off_canvas_and_camera_pan
 *      A drag that ends OUTSIDE the canvas, while the camera is panning, fires
 *      with the vector measured from screen space — and the aim state is clean.
 *   2. test_drag_reload_buffer
 *      A release made inside the last 120ms before a pip refills is remembered
 *      and fires on the exact tick the pip arrives.
 *   3. test_hyperspeed_steer_preserves_momentum
 *      Holding aim at over-max-speed (a 65px/tick wall-rally) preserves the
 *      stored speed through the hold AND through a 45° redirect on release.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, EDGE_BUFFER_TICKS } from '../src/run.js';
import { placePlayer, setPlayerVelocity, MAX_SPEED } from '../src/physics.js';

const noop = () => {};

/** A staged run with the field cleared: the cube is the only actor. */
function staged(seed = 7) {
  const g = createRun(seed, noop, { staged: true });
  const s = g.state;
  s.phase = 'playing';
  for (let i = 0; i < 20; i++) g.tick();
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  return g;
}

/** Same stub-canvas pattern as test/input.test.js, plus a camera-aware
 *  `point` the test can pan while a drag is in flight. */
function stubRig(run, { camY = 0 } = {}) {
  const previous = globalThis.window;
  globalThis.window = { addEventListener: (k, fn) => on.set(k, fn), removeEventListener() {} };
  const on = new Map(), canvasOn = new Map();
  const canvas = {
    style: {}, clientWidth: 800, clientHeight: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    hasPointerCapture: () => false,
    setPointerCapture() {}, releasePointerCapture() {},
    focus() {},
    addEventListener: (k, fn) => canvasOn.set(k, fn),
    removeEventListener() {},
  };
  let cameraY = camY;
  let captured = null;
  const input = { current: null };
  const shots = [];
  return {
    shots, canvas, canvasOn, on,
    setCamera(y) { cameraY = y; },
    camera() { return cameraY; },
    attach(createInput) {
      input.current = createInput(canvas, {
        get: () => run,
        active: () => true,
        // The world anchor is a camera projection. Panning the camera must
        // move the anchor WITHOUT bending the drag vector, which is measured
        // in screen space.
        point: (x, y) => ({ x, y: y + cameraY }),
        assist: () => false,
        engage() {},
        lock: { once: null, at: -1e9, tick() {} },
        commit(v) { const ok = run.dash(v); if (ok) shots.push(v); return ok; },
      });
      return input.current;
    },
    ev(x, y, type = 'touch') {
      return { isPrimary: true, pointerId: 1, pointerType: type, button: 0, clientX: x, clientY: y, preventDefault() {} };
    },
    restore() { globalThis.window = previous; },
  };
}

test('touch_drag_pointer_off_canvas_and_camera_pan', async () => {
  const { createInput } = await import('../src/input.js');
  // ── A ────────────────────────────────────────────────────────────────────
  const g = staged(11);
  assert.equal(g.dash({ x: 0, y: -1 }), true, 'the harness could not launch');
  const rig = stubRig(g, { camY: 1000 });
  const input = rig.attach(createInput);
  const p = g.world.player.position;
  const before = { x: p.x, y: p.y };

  rig.canvasOn.get('pointerdown')(rig.ev(400, 300));
  assert.equal(g.state.isAiming, true, 'pointerdown on the canvas starts the aim');
  rig.on.get('pointermove')(rig.ev(360, 330));
  rig.setCamera(1200);               // the camera pans 200px mid-drag
  rig.on.get('pointermove')(rig.ev(60, 840)); // pointer leaves the canvas bounds
  rig.on.get('pointerup')(rig.ev(-40, 900));   // released entirely off-canvas

  assert.equal(g.state.isAiming, false, 'releasing off-canvas ends the aim cleanly');
  assert.equal(rig.shots.length, 1, 'the release fires the dash');

  // The drag vector is measured from the press point in SCREEN pixels; the
  // camera pan must appear nowhere in it.
  const v = rig.shots[0];
  const len = Math.hypot(v.x, v.y);
  assert.ok(len > 0);
  // Pressed at (400,300), released at (-40,900): the cube must be flung
  // toward the opposite side of the pull, i.e. up-right, ~(1,-1.5).
  assert.ok(v.x > 0, `expected a rightward launch, got ${v.x}`);
  assert.ok(v.y < 0, `expected an upward launch, got ${v.y}`);
  const want = Math.atan2(-(0 - 600), -(0 - 440)); // 1 : 1.5 up-right, same line
  const got = Math.atan2(v.y, v.x);
  assert.ok(Math.abs(got - Math.atan2(-600, 440)) < 0.08, `aim direction bent by the camera pan: ${got}`);

  // ── B: the same drag with NO camera movement must fire identically ───────
  const g2 = staged(11);
  assert.equal(g2.dash({ x: 0, y: -1 }), true);
  const rig2 = stubRig(g2, { camY: 1000 });
  const input2 = rig2.attach(createInput);
  rig2.canvasOn.get('pointerdown')(rig2.ev(400, 300));
  rig2.on.get('pointermove')(rig2.ev(360, 330));
  rig2.on.get('pointermove')(rig2.ev(60, 840));
  rig2.on.get('pointerup')(rig2.ev(-40, 900));
  const stable = rig2.shots[0];
  assert.ok(Math.abs(stable.x - v.x) < 1e-9 && Math.abs(stable.y - v.y) < 1e-9,
    `camera pan changed the fired vector: (${stable.x},${stable.y}) vs (${v.x},${v.y})`);
  input.dispose?.(); input2.dispose?.(); rig.restore(); rig2.restore();
});

test('test_drag_reload_buffer', async () => {
  const { createInput } = await import('../src/input.js');
  const g = staged(13);
  // Empty pips, one tick 95% of the way through the 1.0s recharge.
  g.state.edge = 0;
  g.state.recharge = 57; // MOVEMENT.recharge === 60, so 3 ticks remain
  const before = g.state.shots;
  const rig = stubRig(g);
  const input = rig.attach(createInput);
  rig.canvasOn.get('pointerdown')(rig.ev(400, 300));
  rig.on.get('pointermove')(rig.ev(240, 300)); // 160px pull: full power
  rig.on.get('pointerup')(rig.ev(240, 300));

  assert.notEqual(g.state.edgeBuffer, null,
    'a release in the final 7 ticks of a recharge is remembered, not refused');
  assert.equal(g.state.shots, before, 'nothing launched before the pip exists');
  assert.equal(g.state.edge, 0, 'no pip invented out of thin air');

  for (let i = 0; i < 5; i++) g.tick(); // tick 3 completes the recharge

  assert.equal(g.state.edgeBuffer, null, 'the buffer is consumed on the completion tick');
  assert.equal(g.state.shots, before + 1, 'the buffered dash fired on the pip tick');
  const v = g.world.player.velocity;
  assert.ok(Math.hypot(v.x, v.y) > 30, `the buffered dash actually launched: (${v.x}, ${v.y})`);
  assert.ok(v.x > 30 && Math.abs(v.y) < 10, `expected the aimed rightward launch, got (${v.x}, ${v.y})`);
  assert.equal(g.state.isAiming, false);
  input.dispose?.(); rig.restore();
});

test('test_hyperspeed_steer_preserves_momentum', async () => {
  const { createInput } = await import('../src/input.js');
  const g = staged(17);
  const s = g.state, world = g.world;
  // Build 65px/tick — over MAX_SPEED (42) and on the wrong side of it, i.e. a
  // genuine rally speed, not a launch.
  // Airborne, clear of the pad and every rail: the pin keeps the cube there
  // for the 25 held ticks (position only — velocity is never touched).
  const hold = { x: world.player.position.x, y: world.player.position.y - 180 };
  assert.equal(g.dash({ x: 0, y: -1 }), true, 'the harness could not launch'); // airborne: aim is legal
  placePlayer(world, hold);
  setPlayerVelocity(world, 65, 0);
  world.playerCeiling = 120; // a wall-rally would have ratcheted the ceiling this high
  g.state.ceiling = world.playerCeiling;

  const rig = stubRig(g);
  const input = rig.attach(createInput);
  // Aim up-right 45°: pull DOWN-left from the press point.
  rig.canvasOn.get('pointerdown')(rig.ev(400, 300));
  assert.equal(s.isAiming, true);
  rig.on.get('pointermove')(rig.ev(244, 456)); // ~(-156,+156) → aim (0.707,-0.707)
  // 25 ticks held — pinned in place so the wall rally cannot scatter it;
  // velocity is never touched by the pin.
  for (let i = 0; i < 25; i++) { placePlayer(world, hold); g.tick(); }

  const heldSpeed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
  assert.ok(heldSpeed >= MAX_SPEED, `the aim hold must not drain stored speed (got ${heldSpeed})`);

  rig.on.get('pointerup')(rig.ev(244, 456));
  assert.equal(s.isAiming, false, 'release clears the aim');
  for (let i = 0; i < 3; i++) { placePlayer(world, hold); g.tick(); }

  const speed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
  assert.ok(speed >= 63, `hyper-speed steer must preserve momentum (got ${speed})`);
  assert.ok(world.player.velocity.y < 0, 'the redirect launched the cube upward');
  assert.equal(rig.shots.length, 1);
  input.dispose?.(); rig.restore();
});
