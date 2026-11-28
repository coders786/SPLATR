import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {combatSourceContext, COMBAT_SOURCE_CONTEXTS, swordContactKind} from '../src/combat-source-context.js';
import {equipmentSourceContext} from '../src/equipment-source-context.js';
import {BOUNDARY_SCENARIOS, runBoundaryScenario, observeBoundaryScenario} from './support/source-boundary-scenarios.js';

// Independent snapshot captured before replacing the remaining boolean callers.
const baseline = JSON.parse(readFileSync(new URL('./support/source-boundary-baseline.json', import.meta.url)));
const hits = (scenario, kind) => observeBoundaryScenario(scenario).sources.filter(e => e.type === 'cut-result' && (!kind || e.sourceKind === kind));

for (const name of BOUNDARY_SCENARIOS) {
  test(`${name}: original outcomes and source histories remain exact, observation off/on`, () => {
    assert.deepEqual(runBoundaryScenario(name), baseline[name].snapshot);
    assert.deepEqual(observeBoundaryScenario(name), baseline[name]);
  });
}

test('legacy routes plus explicit Ember/Void/Reprise/Volt scheduled-secondary routes have frozen exact compatibility semantics', () => {
  const expected = {
    'primary-blade': [false, false, null], 'prism-needle': [true, true, null],
    'core-echo': [true, true, null], 'upgrade-echo': [true, true, null],
    'coil-relay': [true, true, null], 'anchor-floor': [true, true, null],
    'legacy-shear': [true, false, null], 'sword-echo': [true, true, 'attack'],
    'sword-pulse': [true, true, 'attack'], 'unknown-sword': [true, true, 'attack'], 'ember-burn': [true, true, null], 'void-collapse': [true, true, null], 'dash-reprise': [true, true, null], 'volt-conduction': [true, true, null],
  };
  assert.deepEqual(Object.keys(COMBAT_SOURCE_CONTEXTS), Object.keys(expected));
  assert.ok(Object.isFrozen(COMBAT_SOURCE_CONTEXTS));
  for (const [kind, flags] of Object.entries(expected)) {
    const context = combatSourceContext(kind);
    assert.deepEqual(context, {kind, fromShear: flags[0], secondary: flags[1], swordSource: flags[2]});
    assert.ok(Object.isFrozen(context)); assert.equal(combatSourceContext(kind), context);
    assert.equal(equipmentSourceContext(kind), context, 'earlier imports share authority, not a duplicate table');
  }
});

test('unknown keys and coercible objects cannot fall back to primary or inherited contexts', () => {
  for (const kind of [undefined, null, '', 'primary', 'coil', 'echo', 'constructor', '__proto__', 'toString', {}, ['primary-blade'], Symbol('source')]) {
    assert.throws(() => combatSourceContext(kind), RangeError);
  }
});

test('sword classification preserves source objects and explicitly distinguishes unrecognized restored kinds', () => {
  for (const [kind, expected] of [['echo', 'sword-echo'], ['pulse', 'sword-pulse'], ['future', 'unknown-sword'], [undefined, 'unknown-sword']]) {
    const attack = Object.freeze({kind, hits: new Set()});
    assert.equal(swordContactKind(attack), expected);
    assert.equal(attack.kind, kind);
  }
  for (const attack of [null, undefined, false, 'echo']) assert.throws(() => swordContactKind(attack), TypeError);
});

test('every live damage call names its route; the legacy resolver is entered only by the adapter', () => {
  const run = readFileSync(new URL('../src/run.js', import.meta.url), 'utf8');
  const code = run.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const callers = [...code.matchAll(/(?<!function )\bcut\(([^;\n]+)/g)].map(m => m[1]);
  assert.equal(callers.length, 11, 'primary, needle, shared echo, relay, shear, floor, sword, scheduled burn, Void collapse, Dash reprise, Volt conduction');
  for (const caller of callers) assert.match(caller, /^[^,]+,(?:'[^']+'|echo\.upgradeEcho\?|swordContactKind\()/);
  assert.doesNotMatch(code, /cutEquipmentSource|cut\(\w+,\s*(?:true|false)\b|cut\(\w+\)/);
  assert.equal([...code.matchAll(/\bresolveCut\(/g)].length, 3, 'definition plus observed/unobserved dispatch only');
});

test('Coil child resolves before parent on both kill and armor paths, with exact parent links', () => {
  for (const name of ['coil-kill-order', 'coil-armor']) {
    const [child, parent] = hits(name);
    assert.equal(child.sourceKind, 'coil-relay'); assert.equal(parent.sourceKind, 'primary-blade');
    assert.equal(child.parentSourceId, parent.sourceId); assert.equal(child.parentEventId, parent.eventId);
    assert.ok(child.sequence < parent.sequence); assert.equal(child.secondary, true);
    assert.equal(child.outcome, name === 'coil-kill-order' ? 'kill' : 'armor');
  }
  assert.equal(runBoundaryScenario('coil-kill-order').final.state.kills, 2, 'one removal per actor');
});

test('Coil retains inclusive radius160, ID ties and rejected-nearest behavior without retry', () => {
  assert.equal(hits('coil-radius', 'coil-relay').length, 1);
  assert.equal(hits('coil-outside', 'coil-relay').length, 0);
  assert.equal(hits('coil-tie', 'coil-relay')[0].targetId, 'alpha');
  const rejected = hits('coil-rejected', 'coil-relay');
  assert.equal(rejected.length, 1); assert.equal(rejected[0].outcome, 'shot-duplicate');
  assert.equal(runBoundaryScenario('coil-rejected').final.enemies.find(e => e.id === 'other').hp, 1);
});

test('Anchor uses one source across a Fang-only inclusive170 snapshot; repeat floor callback stays ignored', () => {
  const result = observeBoundaryScenario('anchor-radius');
  const contacts = result.sources.filter(e => e.type === 'cut-result');
  assert.deepEqual(contacts.map(e => e.targetId), ['left-edge', 'right-edge']);
  assert.equal(contacts[0].sourceId, contacts[1].sourceId);
  assert.ok(contacts.every(e => e.sourceKind === 'anchor-floor' && e.secondary && e.fromShear));
  assert.equal(result.snapshot.final.state.floorKicks, 1);
  assert.equal(result.snapshot.final.enemies.find(e => e.id === 'not-fang').hp, 2);
  assert.equal(result.snapshot.final.enemies.find(e => e.id === 'outside').hp, 1);
  assert.deepEqual(hits('anchor-dedup').map(e => e.outcome), ['shot-duplicate', 'kill']);
});

test('shear keeps two-damage nonsecondary behavior, one source per wave and no second release', () => {
  const result = observeBoundaryScenario('shear-multi-armor');
  const wave = result.sources.filter(e => e.type === 'cut-result' && e.sourceKind === 'legacy-shear');
  assert.equal(wave.length, 2); assert.equal(wave[0].sourceId, wave[1].sourceId);
  assert.ok(wave.every(e => e.fromShear && !e.secondary && e.targetHpBefore - e.targetHpAfter === 2));
  assert.equal(result.snapshot.final.state.throughcuts, 1); assert.equal(result.snapshot.final.stroke.contacts, 2);
});

test('shear→Coil recursion preserves grandparentage and later same-shot rejection', () => {
  const contacts = hits('shear-coil'), relay = contacts.find(e => e.sourceKind === 'coil-relay');
  const wave = contacts.find(e => e.sourceKind === 'legacy-shear' && e.targetId === 'wave-a');
  assert.equal(relay.parentSourceId, wave.sourceId); assert.equal(relay.parentEventId, wave.eventId);
  assert.ok(relay.sequence < wave.sequence);
  assert.equal(contacts.find(e => e.sourceKind === 'legacy-shear' && e.targetId === 'wave-b').outcome, 'shot-duplicate');
});

for (const kind of ['sword-echo', 'sword-pulse', 'unknown-sword']) {
  test(`${kind}: actual attack objects preserve primary-shot bypass, separate source hits and per-attack target cap`, () => {
    const contacts = hits(kind === 'unknown-sword' ? 'sword-unknown' : kind, kind);
    assert.equal(contacts.length, 4); assert.ok(contacts.every(e => e.accepted && e.swordSource && e.secondary && e.fromShear));
    const plate = contacts.filter(e => e.targetId === 'plate');
    assert.equal(plate.length, 2); assert.notEqual(plate[0].sourceId, plate[1].sourceId);
    assert.ok(plate.every(e => e.targetHpBefore - e.targetHpAfter === 1));
    assert.ok(contacts.every(e => !e.originKnown), 'injected attacks do not invent launch provenance');
    const count = new Map(); for (const e of contacts) count.set(e.sourceId, (count.get(e.sourceId) || 0) + 1);
    assert.deepEqual([...count.values()], [2, 2]);
  });
}

test('delayed sword fires once when due, retains fractional pace-scaled aging and cannot charge itself', () => {
  const {checkpoints, final} = runBoundaryScenario('sword-not-due');
  const contacts = hits('sword-not-due');
  assert.equal(contacts.length, 2); assert.ok(contacts.every(e => e.tick === 3 && e.worldClock === 3));
  assert.equal(checkpoints[0].swordFx[0].fired, true);
  assert.ok(checkpoints[0].swordFx[0].life < 14 && !Number.isInteger(checkpoints[0].swordFx[0].life));
  assert.equal(checkpoints[1].swordFx[0].fired, true);
  assert.equal(final.state.swordCharge, 0); assert.equal(final.state.swordContacts, 0);
});

test('a recursive emission exception propagates without rerunning either resolver', () => {
  const result = observeBoundaryScenario('coil-exception'), contacts = result.sources.filter(e => e.type === 'cut-result');
  assert.equal(result.snapshot.threw, true); assert.equal(contacts.length, 2);
  assert.ok(contacts.every(e => e.accepted && e.outcome === 'exception' && e.targetHpBefore - e.targetHpAfter === 1));
  assert.equal(result.snapshot.final.state.kills, 0);
});
