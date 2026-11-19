import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readForm,
  gradeOf,
  formLabel,
  FORM_THRESHOLDS,
  GRADE_AT,
  FORMS,
} from '../src/form.js';

// A run state's shape, with sane defaults, so each test states only what matters.
const run = (over = {}) => ({
  throughcuts: 0,
  banks: 0,
  kills: 0,
  shots: 0,
  dashes: 0,
  elapsed: 0,
  hp: 3,
  ...over,
});

test('an empty run is UNFORMED, at grade 0, with no NaN in its axes', () => {
  const r = readForm(run());
  assert.equal(r.key, 'unformed');
  assert.equal(r.grade, 0);
  for (const [k, v] of Object.entries(r.axes))
    assert.ok(Number.isFinite(v), `${k} must be a finite number, got ${v}`);
  assert.equal(formLabel(r), '');
});

test('division by zero never produces NaN or Infinity', () => {
  // No dashes, no elapsed time: every ratio is 0/0. NaN would silently win
  // every comparison downstream and poison the whole read.
  for (const input of [
    run(),
    run({ kills: 5 }),
    run({ kills: 5, dashes: 0, shots: 0, elapsed: 0 }),
    { kills: undefined, dashes: undefined },
    {},
  ]) {
    const r = readForm(input);
    assert.ok(Number.isFinite(r.grade), 'grade must be finite');
    for (const v of Object.values(r.axes)) assert.ok(Number.isFinite(v), 'axis finite');
  }
});

test('yield: a run that converts every launch into kills reads BUTCHER', () => {
  // 120 kills over 100 dashes = 1.2 kills/dash, against a 0.8 threshold.
  const r = readForm(run({ kills: 120, dashes: 100, shots: 100, elapsed: 40000 }));
  assert.equal(r.lead, 'yield');
  assert.equal(r.key, 'yield');
  assert.ok(r.grade >= 1);
  assert.equal(formLabel(r), `BUTCHER ${['', 'I', 'II', 'III'][r.grade]}`);
});

test('weave: throughcut density wins and grades higher as it climbs', () => {
  // weave threshold is 0.016/dash, so 2 throughs over 100 dashes is 1.25x
  // (grade I) and 5 over 100 is 3.1x (grade III). Chosen to straddle the lines
  // rather than both saturating the cap.
  const one = readForm(run({ throughcuts: 2, dashes: 100, kills: 40, elapsed: 1800, hp: 2 }));
  const many = readForm(run({ throughcuts: 5, dashes: 100, kills: 40, elapsed: 1800, hp: 2 }));
  assert.equal(one.key, 'weave');
  assert.equal(many.key, 'weave');
  assert.ok(many.grade > one.grade, `${many.grade} should exceed ${one.grade}`);
});

test('grade boundaries are exactly where GRADE_AT says they are', () => {
  const [g1, g2, g3] = GRADE_AT;
  assert.equal(gradeOf(g1 - 0.001), 0);
  assert.equal(gradeOf(g1), 1);
  assert.equal(gradeOf(g2 - 0.001), 1);
  assert.equal(gradeOf(g2), 2);
  assert.equal(gradeOf(g3), 3);
  assert.equal(gradeOf(999), 3, 'grading caps at III');
  assert.equal(gradeOf(NaN), 0, 'NaN grades 0 rather than 3');
});

test('GHOST requires both conversion and an intact hull', () => {
  // 120 kills in 60s keeps tempo modest (2.0/s, under its 2.4 threshold) so
  // YIELD is unambiguously the leading axis and this test is about the hull
  // gate rather than an accidental tie between two axes.
  // yield 2.0 (over the grade-II line at 1.8), tempo 2.0 (under its 2.4
  // threshold): converting hard and fast but not fast enough to lead on tempo.
  const base = { kills: 160, dashes: 80, elapsed: 80000 };
  assert.equal(readForm(run({ ...base, hp: 3 })).key, 'ghost', 'untouched + converting');
  for (const hp of [2, 1, 0]) {
    const r = readForm(run({ ...base, hp }));
    assert.notEqual(r.key, 'ghost', `hp ${hp} must not read GHOST`);
    assert.equal(r.key, 'yield', 'it still reads its leading axis');
  }
});

test('GHOST cannot be claimed by an unformed run just for being untouched', () => {
  // Idling takes no damage. Being untouched is not an achievement on its own.
  const r = readForm(run({ hp: 3, kills: 1, dashes: 2, elapsed: 30000 }));
  assert.equal(r.key, 'unformed');
});

test('a ratio with a tiny denominator is not mastery: the sample gate holds', () => {
  // The bug this exists for: 2 kills off the first dash reads yield 2.0, which
  // is triple the threshold, and the live readout stamped GHOST grade III two
  // seconds into a run. A form must be demonstrated, not inferred from noise.
  const early = readForm(run({ kills: 2, dashes: 1, elapsedTicks: 120, hp: 3 }));
  assert.equal(early.key, 'unformed', 'two events is not evidence of a form');
  assert.equal(early.grade, 0);
  // Same absurd ratio, but now with enough dashes behind it to be a fact.
  const late = readForm(run({ kills: 6, dashes: 3, elapsedTicks: 400, hp: 3 }));
  assert.notEqual(late.key, 'unformed', 'three dashes and six seconds is enough to read');
});

test('GHOST cannot be claimed early even with an untouched hull', () => {
  // "Untouched" is trivially true at the start of every run, and trivially true
  // of a run that did nothing. Both must fail the sample gate.
  assert.equal(readForm(run({ kills: 1, dashes: 1, elapsedTicks: 60, hp: 3 })).key, 'unformed');
  assert.equal(readForm(run({ kills: 0, dashes: 0, elapsedTicks: 3000, hp: 3 })).key, 'unformed');
});

test('every axis participates: each can lead when it dominates', () => {
  // elapsed is in TICKS (60/s). Each fixture is built so its target axis is
  // unambiguously the highest and the others stay under grade I.
  const leads = {
    weave: readForm(run({ throughcuts: 6, dashes: 100, kills: 40, elapsed: 1800, hp: 2 })),
    bank: readForm(run({ banks: 400, dashes: 100, kills: 40, elapsed: 1800, hp: 2 })),
    tempo: readForm(run({ kills: 200, dashes: 300, elapsed: 1200, hp: 2 })),
    yield: readForm(run({ kills: 150, dashes: 100, elapsed: 3600, hp: 2 })),
  };
  for (const [k, r] of Object.entries(leads))
    assert.equal(r.key, k, `${k} should lead its own scenario, got ${r.key}`);
});

test('elapsed is a TICK count, not milliseconds', () => {
  // run.js does `s.elapsed++` per tick. Reading it as ms inflated tempo ~30x
  // and made GHOST fire on all 20 seeds of the first separation trial.
  const at = (ticks) => readForm(run({ kills: 60, dashes: 60, elapsed: ticks })).axes.tempo;
  // 60 kills / 30s = 2.0 kills/s, against the tempo threshold => 2.0/threshold.
  // Derived rather than hardcoded, so a threshold re-derivation cannot silently
  // invalidate the unit check this test exists to make.
  const expected = 2.0 / FORM_THRESHOLDS.tempo;
  assert.ok(Math.abs(at(1800) - expected) < 0.01, `1800 ticks is 30s, expected ${expected}, got ${at(1800)}`);
  assert.ok(Math.abs(at(3600) - expected / 2) < 0.01, 'doubling the ticks halves tempo');
  assert.equal(at(0), 0, 'no ticks, no tempo');
  // An explicit `elapsedTicks` wins over the ambiguous `elapsed` name.
  // Note: readForm directly, not through run(), because run() sets elapsed:0
  // and the point here is which of two EXPLICIT values wins.
  const explicit = readForm({ kills: 60, dashes: 60, elapsedTicks: 1800, elapsed: 1 });
  assert.ok(Math.abs(explicit.axes.tempo - 2.0 / FORM_THRESHOLDS.tempo) < 0.01, 'elapsedTicks takes precedence');
});

test('shapes are tolerated: a Fork counts as a launch if shots is missing', () => {
  // `dashes` is not a field the run actually keeps; shots is. The reader must
  // work against the live state object either way.
  const r = readForm({ kills: 100, shots: 100, elapsed: 40000, hp: 3 });
  assert.ok(Number.isFinite(r.axes.yield));
  assert.ok(r.axes.yield > 0);
});

test('the reader is pure: it does not mutate its input', () => {
  const input = Object.freeze(run({ kills: 90, dashes: 120, elapsed: 36000, hp: 3 }));
  const before = JSON.stringify(input);
  readForm(input);
  assert.equal(JSON.stringify(input), before);
});

test('live labels are present-continuous, debrief labels are the noun', () => {
  const r = readForm(run({ throughcuts: 20, dashes: 100, kills: 40, elapsed: 30000, hp: 2 }));
  assert.equal(formLabel(r, { live: true }), 'WEAVING');
  assert.match(formLabel(r), /^WEAVER (I|II|III)$/);
});

test('thresholds are frozen so a caller cannot quietly retune the ladder', () => {
  assert.ok(Object.isFrozen(FORM_THRESHOLDS));
  assert.ok(Object.isFrozen(FORMS));
  assert.ok(Object.isFrozen(GRADE_AT));
});
