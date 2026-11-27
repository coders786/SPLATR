import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {createRun} from '../src/run.js';
import {placePlayer, stopPlayer} from '../src/physics.js';
import {SWORD_BUILDS} from '../src/swords.js';
import {SOURCE_SCENARIOS, runSourceScenario} from './support/combat-source-scenarios.js';

// Recorded with the pre-S2a resolver, not calculated by the observer under test.
const baseline = JSON.parse(readFileSync(new URL('./support/combat-source-baseline.json', import.meta.url), 'utf8'));
const shellBaseline=JSON.parse(readFileSync(new URL('./support/armor-shell-source-baseline.json',import.meta.url),'utf8'));
const results = trace => trace.entries().filter(e => e.type === 'cut-result');
const expectedKinds = {
  'primary-armor': 'primary-blade', 'primary-kill': 'primary-blade', coil: 'coil-relay',
  'core-echo': 'core-echo', 'upgrade-echo': 'upgrade-echo', 'sword-echo': 'sword-echo',
  'sword-pulse': 'sword-pulse', prism: 'prism-needle', anchor: 'anchor-floor', shear: 'legacy-shear',
};

for (const name of SOURCE_SCENARIOS) {
  test(`${name}: recorder off/on preserve ${name==='sword-pulse'?'explicit Chamfer replacement expectations':'original outcomes'}`, () => {
    const trace = createCombatSourceTrace(4096);
    const expected=name==='sword-pulse'?shellBaseline[name]:baseline[name];
    assert.deepEqual(runSourceScenario(name), expected);
    assert.deepEqual(runSourceScenario(name, trace), expected);
    const hits = results(trace);
    assert.ok(hits.some(e => e.accepted && e.sourceKind === expectedKinds[name]), name);
    const births = new Map(trace.entries().filter(e => e.type === 'source-created').map(e => [e.sourceId, e]));
    for (const e of hits) {
      assert.ok(births.has(e.sourceId));
      assert.equal(e.scope, 'target-only');
      assert.equal(e.targetHpBefore - e.targetHpAfter > 0, e.accepted);
      assert.ok(Object.isFrozen(e));
      assert.ok(Object.values(e).every(v => v === null || ['string', 'number', 'boolean'].includes(typeof v)), 'no mutable actor/source references in history');
    }
    assert.equal(trace.entries().at(-1).type, 'source-trace-ended');
  });
}

test('recursive Coil outcome has a parent contact/source without changing legacy secondary rewards', () => {
  const trace = createCombatSourceTrace(128);
  const snapshot = runSourceScenario('coil', trace);
  const parent = results(trace).find(e => e.sourceKind === 'primary-blade');
  const child = results(trace).find(e => e.sourceKind === 'coil-relay');
  assert.equal(child.parentSourceId, parent.sourceId);
  assert.equal(child.parentEventId, parent.eventId);
  assert.equal(child.secondary, true);
  assert.equal(child.fromShear, true, 'retain the current boolean call semantics');
  assert.ok(child.sequence < parent.sequence, 'nested child resolves before outer result');
  assert.equal(snapshot.state.kills, 1);
  assert.equal(snapshot.state.chain, baseline.coil.state.chain, 'S2a must not silently fix/restrict legacy secondary chain grants');
});

test('shot dedup is observed as rejection, not replaced by a new source ledger', () => {
  const trace = createCombatSourceTrace(128);
  runSourceScenario('primary-armor', trace);
  const hits = results(trace);
  assert.equal(hits.length, 2);
  assert.equal(hits[0].sourceId, hits[1].sourceId);
  assert.equal(hits[0].accepted, true);
  assert.equal(hits[1].accepted, false);
  assert.equal(hits[1].outcome, 'shot-duplicate');
  assert.equal(hits[1].targetHpBefore, hits[1].targetHpAfter);
});

test('diagnostics are deterministic across separately owned recorders', () => {
  const a = createCombatSourceTrace(4096), b = createCombatSourceTrace(4096);
  runSourceScenario('core-echo', a); runSourceScenario('core-echo', b);
  assert.deepEqual(a.entries(), b.entries());
  assert.equal(a.json(), b.json());
});

test('source identity captures originating shot, preserves object shape and survives history wrap', () => {
  const trace = createCombatSourceTrace(3), observer = trace.startRun();
  const sourceObject = Object.freeze({shot: 4, kind: 'echo'});
  const parent = observer.primary(4, 10, 5, true);
  observer.tag(sourceObject, 'sword-echo', 4, 10, 5, parent.sourceId);
  for (let i = 0; i < 12; i++) observer.create('anchor-floor', 5, 20 + i, 10 + i);
  const source = observer.get(sourceObject, 'unknown-sword', 99, 100, 100);
  assert.equal(source.sourceKind, 'sword-echo');
  assert.equal(source.sourceShotId, 4);
  assert.equal(source.parentSourceId, parent.sourceId);
  assert.equal(source.originKnown, true);
  assert.deepEqual(sourceObject, {shot: 4, kind: 'echo'});
  assert.equal(trace.entries().length, 3);
  assert.throws(() => createCombatSourceTrace(0), RangeError);
});

test('unknown source origin and reused target IDs remain explicit', () => {
  const trace = createCombatSourceTrace(128), observer = trace.startRun();
  const object = Object.freeze({});
  const source = observer.get(object, 'core-echo', 7, 30, 20);
  assert.equal(source.originKnown, false);
  assert.equal(source.parentSourceId, null);
  const a = observer.begin(source, {id: 'reused', hp: 2, kind: 'fang'}, 30, 20, 7, true, true, false);
  a.accepted = true; observer.finish(a, 1, true);
  const b = observer.begin(source, {id: 'reused', hp: 2, kind: 'fang'}, 31, 21, 7, true, true, false);
  b.accepted = true; observer.finish(b, 0, false);
  assert.notEqual(a.targetKey, b.targetKey, 'generation keyed by object identity, not public enemy ID');
});

test('clear and multiple runs cannot collide IDs; disposal is idempotent and releases observation', () => {
  const trace = createCombatSourceTrace(32), a = trace.startRun();
  const first = a.primary(1, 1, 1, true);
  trace.clear();
  const b = trace.startRun(), second = b.primary(1, 1, 1, true);
  assert.notEqual(first.sourceId, second.sourceId);
  a.dispose(); a.dispose();
  const count = trace.entries().length;
  assert.equal(a.primary(2, 2, 2), null);
  assert.equal(a.create('primary-blade', 2, 2, 2), null);
  a.tag({}, 'core-echo', 2, 2, 2);
  assert.equal(a.get({}, 'core-echo', 2, 2, 2), null);
  assert.equal(trace.entries().length, count);
  b.dispose();
});

function setup(trace, emit = () => {}, equipment = {}) {
  const r = createRun(123, emit, {waveMode: true, combatSourceTrace: trace, equipment});
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.state.phase = 'playing'; r.state.invul = 99999; r.state.wave.entry = 0;
  placePlayer(r.world, {x: -350, y: -100}); stopPlayer(r.world);
  r.combat.add({id: 'sentinel', kind: 'fang', x: 700, y: -900, pinned: true, delay: 99999});
  return r;
}

test('a real delayed sword contact retains launch shot after a later legal launch', () => {
  const trace = createCombatSourceTrace(128), parts = SWORD_BUILDS.find(b => b.id === 'wraith').parts;
  const r = setup(trace, undefined, parts);
  try {
    const e = r.combat.add({id: 'plate', kind: 'bastion', x: -175, y: -100, pinned: true, delay: 99999}); e.hp = 8;
    assert.equal(r.dash({x: 24, y: 0, power: 24 / 42}), true);
    assert.equal(r.dash({x: -24, y: 0, power: 24 / 42}), true);
    for (let i = 0; i < 65; i++) {r.state.stop = 0; r.tick();}
    const replay = results(trace).find(e => e.accepted && e.sourceKind === 'sword-echo' && e.sourceShotId === 1);
    assert.ok(replay);
    assert.equal(replay.shotId, 2);
    assert.equal(replay.originKnown, true);
  } finally {r.dispose();}
});

test('the observer never swallows an exception from the existing gameplay/emission path', () => {
  const trace = createCombatSourceTrace(128), failure = new Error('fixture consumer error');
  const r = setup(trace, type => {if (type === 'armor') throw failure;});
  try {
    const e = r.combat.add({id: 'plate', kind: 'bastion', x: -275, y: -100, pinned: true, delay: 99999});
    r.dash({x: 24, y: 0, power: 24 / 42}); r.state.stop = 1; r.combat.contacts.add(e);
    assert.throws(() => r.tick(), e => e === failure);
    assert.equal(results(trace).at(-1).outcome, 'exception');
    assert.equal(results(trace).at(-1).accepted, true);
  } finally {r.dispose();}
});

test('recorder module has no gameplay/RNG/browser/persistence dependencies', () => {
  const source = readFileSync(new URL('../src/combat-source-trace.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Math\.random|Date\.now|performance\.|localStorage|sessionStorage|fetch\(|document\.|window\.|setTimeout|\.setVelocity\(/);
  assert.deepEqual([...source.matchAll(/^import .* from '([^']+)'/gm)].map(m => m[1]), ['./combat-trace.js']);
});
