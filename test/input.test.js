import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

/* ── THE BUFFERED SHOT ──────────────────────────────────────────────────────
 *
 * A dash is refused for reasons the player cannot see -- blade recovery, a
 * hitstop, an edge that has not come back. Before this, a refused shot was
 * simply gone: the player pressed, nothing happened, and their thumb had moved
 * on by the time the game would have taken it.
 */

/** createInput binds a handful of window-level listeners; give it a no-op
 *  window so the module can be exercised without a browser. */
function stubWindow() {
  const prev = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  return () => {
    globalThis.window = prev;
  };
}

/** A canvas stand-in that records the listeners createInput installs. */
function stubCanvas() {
  const on = new Map();
  return {
    style: {},
    hasPointerCapture: () => false,
    releasePointerCapture() {},
    setPointerCapture() {},
    addEventListener: (k, fn) => on.set(k, fn),
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  };
}

function rig(accept) {
  const restore = stubWindow();
  const canvas = stubCanvas(),
    committed = [];
  const input = createInput(canvas, {
    get: () => null,
    active: () => true,
    point: () => ({ x: 0, y: 0 }),
    assist: () => ({ corridor: 1 }),
    engage() {},
    lock: { once: null, at: -1e9, tick() {} },
    commit(v) {
      if (!accept()) return false;
      committed.push(v);
      return true;
    },
  });
  return { input, committed, restore };
}

test('a refused shot is remembered and fires the moment it becomes legal', () => {
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  input.fire({ x: 3, y: -9, power: 0.5 });
  assert.equal(committed.length, 0, 'refused while the game will not take it');
  ok = true;
  input.retry();
  assert.equal(committed.length, 1, 'the same shot fires once the game accepts it');
  assert.deepEqual(committed[0], { x: 3, y: -9, power: 0.5 });
  input.retry();
  assert.equal(committed.length, 1, 'and it fires exactly once');
  restore();
});

test('a buffered shot expires instead of firing late', () => {
  // The window is human reaction time, not a queue. A shot that lands half a
  // second after the player asked for it is aimed at a field that has moved.
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  const realNow = performance.now;
  try {
    let t = 1000;
    performance.now = () => t;
    input.fire({ x: 0, y: -10, power: 0.5 });
    t += 400; // well past the 140ms window
    ok = true;
    input.retry();
    assert.equal(committed.length, 0, 'a stale shot is dropped, not fired late');
    input.retry();
    assert.equal(committed.length, 0, 'and it never comes back');
  } finally {
    performance.now = realNow;
    restore();
  }
});

test('reset drops a buffered shot so it cannot leak into the next run', () => {
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  input.fire({ x: 1, y: -1, power: 0.4 });
  input.reset();
  ok = true;
  input.retry();
  assert.equal(committed.length, 0, 'a new run must not inherit the last run\'s aim');
  restore();
});

test('an accepted shot leaves nothing buffered', () => {
  const { input, committed, restore } = rig(() => true);
  input.fire({ x: 2, y: -8, power: 0.6 });
  assert.equal(committed.length, 1);
  input.retry();
  assert.equal(committed.length, 1, 'retry has nothing to do');
  restore();
});
