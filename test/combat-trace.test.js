import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatTrace } from '../src/combat-trace.js';
import { createRun } from '../src/run.js';

test('combat trace is bounded, ordered, immutable and exportable as local JSON', () => {
  const trace = createCombatTrace(3);
  for (let i = 0; i < 7; i++) trace.record({ type: 'contact', tick: i });
  assert.deepEqual(
    trace.entries().map((e) => e.sequence),
    [4, 5, 6],
  );
  assert.ok(Object.isFrozen(trace.entries()[0]));
  assert.equal(JSON.parse(trace.json()).events.length, 3);
  trace.clear();
  assert.equal(trace.entries().length, 0);
  assert.throws(() => createCombatTrace(0), RangeError);
});
test('opt-in run diagnostics distinguish real damage from protected damage attempts', () => {
  const trace = createCombatTrace(),
    run = createRun(19, () => {}, { staged: false, combatTrace: trace });
  try {
    run.state.phase = 'playing';
    run.state.invul = 0;
    assert.equal(run.hurt('fixture Fang'), true);
    assert.equal(run.hurt('fixture Fang'), false);
    const events = trace.entries();
    assert.equal(events[0].type, 'damage');
    assert.equal(events[0].hpBefore - events[0].hpAfter, 1);
    assert.equal(events[1].type, 'damage-blocked');
    assert.equal(events[1].reason, 'invulnerability');
    assert.ok(Number.isInteger(events[0].shotId));
  } finally {
    run.dispose();
  }
});
