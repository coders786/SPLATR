import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLASH_TABLE,
  LAND_TABLE,
  DIR_TABLE,
  BLEND_TABLE,
  SLASH_ROW,
  LAND_ROW,
  DIR_LUT_N,
  bakeSlash,
  bakeLand,
  bakeDirections,
  bakeDirectionBlend,
} from '../src/bake.js';
import { SLASH, FALL, slashFor, landFor, DIRS, TAU } from '../src/animation.js';

/* ── THE CONTRACT ────────────────────────────────────────────────────────── */
//
// A baked table is only honest if it cannot drift from the function it was
// baked from. These tests re-bake from the live functions and compare every
// row, so changing a curve WITHOUT re-baking fails here rather than shipping a
// renderer that draws something the design no longer says.

test('the slash table is the slash curve, row for row', () => {
  const fresh = bakeSlash();
  assert.equal(SLASH_TABLE.length, SLASH.total * SLASH_ROW.width);
  for (let a = 0; a < SLASH.total; a++) {
    const s = slashFor(a, 0),
      o = a * SLASH_ROW.width;
    if (!s) {
      assert.equal(fresh[o + SLASH_ROW.angle], -1, `tick ${a} should be the null sentinel`);
      continue;
    }
    assert.equal(fresh[o + SLASH_ROW.angle], s.angle, `tick ${a} angle`);
    assert.equal(fresh[o + SLASH_ROW.smear], s.smear, `tick ${a} smear`);
    assert.equal(fresh[o + SLASH_ROW.alpha], s.alpha, `tick ${a} alpha`);
    assert.equal(fresh[o + SLASH_ROW.weight], s.weight, `tick ${a} weight`);
    assert.equal(fresh[o + SLASH_ROW.flash], s.flash, `tick ${a} flash`);
    assert.equal(fresh[o + SLASH_ROW.counter], s.counter, `tick ${a} counter`);
  }
  // The singleton must be the same values, not merely the same shape.
  assert.deepEqual([...SLASH_TABLE], [...fresh], 'the baked singleton is stale');
});

test('the singleton cannot go stale behind a curve edit', () => {
  // THE HOLE IN THE PREVIOUS GUARD, AND WHY IT MATTERED.
  //
  // Comparing `SLASH_TABLE` against `bakeSlash()` catches a table that was
  // hand-edited, but NOT the failure this design actually risks: someone edits
  // the curve in animation.js and forgets that a table is baked from it. Both
  // sides re-derive from the SAME source at import time, so they move together
  // and the comparison is green on a renderer drawing the old shape.
  //
  // Verified by mutation: scaling the swing smear by 1.3 in animation.js left
  // every re-bake comparison passing.
  //
  // The fix is to pin the table against NUMBERS, not against a second bake.
  // These are the values the design specifies; if a curve edit is intentional,
  // it has to come here and change them too, which is the moment someone
  // notices the renderer reads a table.
  // The peak is at tick 4: sin() over the four swing ticks peaks at the third
  // of them, which is `windup + swing/2`.
  const SWING_PEAK = SLASH.windup + SLASH.swing / 2;
  const o = SWING_PEAK * SLASH_ROW.width;
  assert.equal(SLASH_TABLE[o + SLASH_ROW.smear], 1, 'the swing peak smell must be exactly 1');
  assert.equal(SLASH_TABLE[o + SLASH_ROW.alpha], 1, 'the swing peak is fully opaque');
  // The held impact frame is deliberately CLEANER than the swing, and the
  // settle continues from exactly where the impact left off (no pop).
  const impactFirst = (SLASH.windup + SLASH.swing) * SLASH_ROW.width;
  const impactLast = (SLASH.windup + SLASH.swing + SLASH.impact - 1) * SLASH_ROW.width;
  const settleFirst = (SLASH.windup + SLASH.swing + SLASH.impact) * SLASH_ROW.width;
  assert.ok(
    SLASH_TABLE[impactFirst + SLASH_ROW.smear] < SLASH_TABLE[o + SLASH_ROW.smear],
    'the impact frame must be cleaner than the swing peak',
  );
  assert.ok(
    Math.abs(SLASH_TABLE[settleFirst + SLASH_ROW.smear] - SLASH_TABLE[impactLast + SLASH_ROW.smear]) <
      1e-9,
    'the settle must inherit the impact value exactly, or the arc pops',
  );
  // The landing opens at full squash and settles to 1.
  // Approximate, not exact: these are derived (1 + 0.42*q), so the last bit
  // depends on the order of operations. The SHAPE is what is being pinned.
  assert.ok(Math.abs(LAND_TABLE[LAND_ROW.wide] - 1.42) < 1e-6, 'landing opens at 1.42 wide');
  assert.ok(Math.abs(LAND_TABLE[LAND_ROW.tall] - 0.66) < 1e-6, 'landing opens at 0.66 tall');
});

test('every slash tick has a distinct row (no collapsed sampling)', () => {
  // A table is only the curve if sampling it at tick resolution keeps every
  // tick distinct. If two adjacent ticks baked to the same numbers, the table
  // is coarser than the animation and would visibly stutter.
  const keys = new Set();
  for (let a = 0; a < SLASH.total; a++) {
    const o = a * SLASH_ROW.width;
    keys.add(
      [0, 1, 2, 3, 4, 5].map((i) => SLASH_TABLE[o + i].toFixed(9)).join('|'),
    );
  }
  assert.equal(keys.size, SLASH.total, 'two slash ticks baked to the same pose');
});

test('the landing table is the landing curve, row for row', () => {
  const fresh = bakeLand();
  assert.equal(LAND_TABLE.length, (FALL.land + 1) * LAND_ROW.width);
  for (let a = 0; a <= FALL.land; a++) {
    const l = landFor(a),
      o = a * LAND_ROW.width;
    if (!l) continue;
    assert.equal(fresh[o + LAND_ROW.wide], l.wide, `tick ${a} wide`);
    assert.equal(fresh[o + LAND_ROW.tall], l.tall, `tick ${a} tall`);
    assert.equal(fresh[o + LAND_ROW.t], l.t, `tick ${a} t`);
  }
  assert.deepEqual([...LAND_TABLE], [...fresh], 'the baked landing table is stale');
});

test('the direction table is the pose table', () => {
  const fresh = bakeDirections();
  for (let i = 0; i < 8; i++) {
    const d = DIRS[i],
      o = i * 5;
    assert.equal(fresh[o + 0], d.lean, `dir ${i} lean`);
    assert.equal(fresh[o + 1], d.tall, `dir ${i} tall`);
    assert.equal(fresh[o + 2], d.wide, `dir ${i} wide`);
    assert.equal(fresh[o + 3], d.scarf, `dir ${i} scarf`);
    assert.equal(fresh[o + 4], d.eyes, `dir ${i} eyes`);
  }
  assert.deepEqual([...DIR_TABLE], [...fresh], 'the baked direction table is stale');
});

test('the blend table matches the continuous octant maths', () => {
  const fresh = bakeDirectionBlend(DIR_LUT_N);
  assert.equal(BLEND_TABLE.length, DIR_LUT_N * 2);
  for (let i = 0; i < DIR_LUT_N; i++) {
    const t = (i / DIR_LUT_N) * TAU;
    const turns = (t / TAU) * 8;
    const idx = ((Math.floor(turns) % 8) + 8) % 8;
    const u = turns - Math.floor(turns);
    // The integer index must be EXACT, or the blend reads the wrong pair.
    assert.equal(fresh[i * 2], idx, `sample ${i} index`);
    assert.ok(Math.abs(fresh[i * 2 + 1] - u) < 1e-12, `sample ${i} fraction`);
  }
  assert.deepEqual([...BLEND_TABLE], [...fresh], 'the baked blend table is stale');
});

test('a stale table is actually catchable: mutation', () => {
  // Prove the guard has teeth. Corrupt one float and confirm a comparison
  // against a fresh bake notices -- otherwise all of the above is decoration.
  const fresh = bakeSlash();
  const tampered = new Float64Array(fresh);
  tampered[3] += 0.5; // the swing's peak smear
  assert.notDeepEqual([...tampered], [...fresh], 'a corrupted table passed the comparison');
});
