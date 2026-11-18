import test from 'node:test';
import assert from 'node:assert/strict';
import { IMPACT, elongate, spring, contactSquash, squashed, wave, velocityWeight } from '../src/impact.js';
import { MAX_SPEED, createPhysics, stepPhysics } from '../src/physics.js';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { SPAWN } from '../src/levels.js';

test('a slow cube is untouched; terminal speed pulls it along its travel without growing it', () => {
  const still = elongate(0);
  assert.deepEqual(still, { along: 1, across: 1 }, 'a resting cube is a cube');
  assert.equal(velocityWeight(IMPACT.stretchFrom), 0, 'the threshold has no snap');
  const fast = elongate(MAX_SPEED);
  assert.ok(fast.along > 1.3, 'terminal speed is visibly elongated');
  assert.ok(fast.across < 1, 'and thinner across, so it reads as speed not size');
  // Volume is roughly preserved: the cube is pulled, not inflated.
  const gain = fast.along * fast.across;
  assert.ok(gain > 0.95 && gain < 1.15, `volume drifts only slightly (${gain.toFixed(2)})`);
  // Monotonic: faster is always longer.
  let prev = 0;
  for (let s = 0; s <= MAX_SPEED; s += 1) {
    const along = elongate(s).along;
    assert.ok(along >= prev - 1e-9, 'stretch never goes backwards as speed rises');
    prev = along;
  }
});

test('the springback is damped: it overshoots once and settles inside its window', () => {
  assert.equal(spring(-1), 0, 'no pose before the contact');
  assert.ok(spring(0) > 0.95, 'the contact frame is the extreme');
  assert.equal(spring(IMPACT.springTicks), 0, 'spent by the end of the window');
  const signs = [];
  for (let a = 0; a < IMPACT.springTicks; a++) signs.push(Math.sign(spring(a)));
  assert.ok(signs.includes(1) && signs.includes(-1), 'it rings the other way exactly once');
  let flips = 0;
  for (let i = 1; i < signs.length; i++) if (signs[i] && signs[i - 1] && signs[i] !== signs[i - 1]) flips++;
  assert.ok(flips <= 2, `at most one overshoot each way, saw ${flips} flips`);
  // Amplitude must fall overall. The first rebound legitimately rises from the
  // zero crossing, so compare peak-to-peak, not sample-to-sample.
  const peaks = [];
  for (let a = 1; a < IMPACT.springTicks - 1; a++)
    if (Math.abs(spring(a)) >= Math.abs(spring(a - 1)) && Math.abs(spring(a)) >= Math.abs(spring(a + 1)))
      peaks.push(Math.abs(spring(a)));
  for (let i = 1; i < peaks.length; i++)
    assert.ok(peaks[i] < peaks[i - 1] + 1e-9, `each swing is smaller than the last (${peaks.map((p) => p.toFixed(2))})`);
});

test('a contact compresses along its normal and swells along the tangent', () => {
  const q = squashed(MAX_SPEED, 0, 1, 0);
  assert.ok(q, 'a real contact returns a pose');
  assert.ok(Math.abs(q.axis - Math.PI / 2) < 1e-9, 'the squash axis is the normal');
  assert.ok(q.along < 0.75, 'it is genuinely compressed along the normal');
  assert.ok(q.across > 1.2, 'and expanded along the tangent');
  assert.equal(squashed(MAX_SPEED, 0, 1, IMPACT.springTicks), null, 'no pose once settled');
  // A glancing contact at low speed must barely deform.
  const soft = squashed(4, 1, 0, 0);
  assert.ok(soft.along > 0.83 && soft.along < 1, 'a slow touch is a small bend');
  assert.ok(contactSquash(MAX_SPEED) > contactSquash(4), 'harder is deeper');
});

test('the shockwave expands, fades, and is gone inside a quarter second', () => {
  assert.equal(wave(-1), null);
  assert.equal(wave(IMPACT.waveTicks), null);
  let prevR = 0,
    prevA = 2;
  for (let a = 0; a < IMPACT.waveTicks; a++) {
    const w = wave(a);
    assert.ok(w, `a ring exists at ${a}`);
    assert.ok(w.r >= prevR, 'it only expands');
    assert.ok(w.alpha <= prevA + 1e-9, 'it only fades');
    prevR = w.r;
    prevA = w.alpha;
  }
  assert.ok(wave(0).r < wave(IMPACT.waveTicks - 1).r * 0.3, 'the sweep is most of its life');
});

test('physics reports a real contact with a normal and a closing speed, and slow ones are ignored', () => {
  const w = createPhysics({ spawn: SPAWN, solids: [{ x: -200, y: 200, w: 400, h: 40 }] });
  w.grounded = false;
  w.launched = true;
  w.player.position.y = 150;
  w.player.velocity = { x: 0, y: 26 };
  let found = null;
  for (let i = 0; i < 40 && !found; i++) {
    stepPhysics(w);
    if (w.contact) found = w.contact;
  }
  assert.ok(found, 'a deck landing is recorded');
  assert.deepEqual([found.nx, found.ny], [0, -1], 'the normal points back at the cube');
  assert.ok(found.depth > 10, 'a fast landing has a real closing speed');
  assert.ok(Number.isFinite(found.x) && Number.isFinite(found.y), 'the ring has a point to sit on');

  // A cube resting on the same deck must not keep spamming contacts.
  const rest = createPhysics({ spawn: SPAWN, solids: [{ x: -200, y: 200, w: 400, h: 40 }] });
  rest.player.position.y = 150;
  stepPhysics(rest);
  const first = rest.contact;
  rest.contact = null;
  for (let i = 0; i < 20; i++) stepPhysics(rest);
  assert.equal(rest.contact, null, 'sitting still is not an impact');
  assert.ok(first, 'the arrival itself was one');
});

test('a real launch records a contact and ages it out instead of holding the pose forever', () => {
  const g = createRun(42),
    s = g.state;
  try {
    // Drive the cube DOWN into the pad: a real Matter contact with a real
    // normal, rather than a deck placed by hand in the test.
    g.dash({ x: 6, y: 26, power: 1 });
    let saw = null;
    for (let i = 0; i < 40 && !saw; i++) {
      g.tick();
      if (s.impact) saw = { ...s.impact };
    }
    assert.ok(saw, 'the landing is a contact');
    assert.ok(Math.hypot(saw.nx, saw.ny) > 0.9, 'the normal is a unit vector');
    assert.ok(saw.depth > 3, 'a landing is not a whiff');
    assert.ok(Number.isFinite(saw.x) && Number.isFinite(saw.y), 'the ring has a point to sit on');
    for (let i = 0; i < IMPACT.springTicks + 2; i++) g.tick();
    assert.equal(s.impact, null, 'the pose never stays squashed');
  } finally {
    g.dispose();
  }
});
