import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {equipmentSourceContext} from '../src/equipment-source-context.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {ECHO_SCENARIOS, runEchoScenario} from './support/echo-source-scenarios.js';

// Captured before migrating the echo loop. Never regenerate from the adapter
// just to bless a changed outcome. Includes prior diagnostic identities/order.
const baseline = JSON.parse(readFileSync(new URL('./support/echo-source-baseline.json', import.meta.url)));
const isEcho = e => e.sourceKind === 'core-echo' || e.sourceKind === 'upgrade-echo';
function observed(name) {
  const trace = createCombatSourceTrace(4096), snapshot = runEchoScenario(name, trace), sources = trace.entries();
  return {snapshot, sources, hits: sources.filter(e => e.type === 'cut-result' && isEcho(e)),
    births: sources.filter(e => e.type === 'source-created' && isEcho(e))};
}
for (const name of ECHO_SCENARIOS) {
  test(`${name}: original gameplay AND diagnostic history stay exact, observation off/on`, () => {
    const {snapshot, sources} = observed(name);
    assert.deepEqual(runEchoScenario(name), baseline[name].snapshot);
    assert.deepEqual(snapshot, baseline[name].snapshot);
    assert.deepEqual(sources, baseline[name].sources);
  });
}
for (const [prefix, kind] of [['core', 'core-echo'], ['upgrade', 'upgrade-echo']]) {
  test(`${kind}: immutable explicit context is distinct from Prism and the other echo`, () => {
    const context = equipmentSourceContext(kind);
    assert.deepEqual(context, {kind, fromShear: true, secondary: true, swordSource: null});
    assert.equal(equipmentSourceContext(kind), context);
    assert.notEqual(context, equipmentSourceContext('prism-needle'));
    assert.notEqual(context, equipmentSourceContext(kind === 'core-echo' ? 'upgrade-echo' : 'core-echo'));
    assert.ok(Object.isFrozen(context));
    assert.throws(() => {context.secondary = false;}, TypeError);
  });
  test(`${kind}: all target kinds inside strict radius75, exclusion, rewards, no proc recursion`, () => {
    const {snapshot: {final}, hits, births} = observed(`${prefix}/coverage`);
    assert.deepEqual(hits.map(e => [e.targetId, e.outcome]), [['fang', 'kill'], ['plate', 'armor']]);
    assert.ok(hits.every(e => e.sourceKind === kind && !e.originKnown && e.fromShear && e.secondary && !e.swordSource));
    assert.deepEqual(final.echoes[0].hits, ['fang', 'plate']);
    assert.equal(final.echoes[0].sourceId, 'excluded', 'legacy sourceId is target exclusion, not observer source identity');
    assert.deepEqual(final.enemies.map(e => e.id), ['sentinel', 'excluded', 'plate', 'boundary', 'outside']);
    assert.equal(final.enemies.find(e => e.id === 'plate').hp, 5);
    assert.equal(final.state.chain, 3); assert.equal(final.state.edge, 2); assert.equal(final.state.focus, 1);
    assert.ok(final.state.score > 0); assert.equal(final.state.swordCharge, 0); assert.equal(final.state.swordContacts, 0);
    assert.equal(births.length, 1, 'secondary kill at chain3 cannot create another echo or trigger Coil');
    assert.equal(final.echoes.length, 1);
  });
  test(`${kind}: rejected contacts are remembered before cut; later shots do not retry`, () => {
    const {snapshot: {final}, hits} = observed(`${prefix}/rejected-once`);
    assert.equal(hits.length, 1); assert.equal(hits[0].outcome, 'shot-duplicate');
    assert.equal(final.state.shots, 1); assert.equal(final.state.kills, 0);
    assert.deepEqual(final.echoes[0].hits, ['already-hit']);
  });
  test(`${kind}: overlapping sources have independent hit sets but still share current-shot dedup`, () => {
    const {snapshot: {final}, hits} = observed(`${prefix}/overlap`);
    assert.deepEqual(hits.map(e => [e.accepted, e.outcome]), [[true, 'armor'], [false, 'shot-duplicate']]);
    assert.notEqual(hits[0].sourceId, hits[1].sourceId);
    assert.equal(final.enemies.find(e => e.id === 'plate').hp, 5);
    assert.deepEqual(final.echoes.map(e => e.hits), [['plate'], ['plate']]);
    assert.equal(final.state.shots, 1, 'next launch did not refresh either echo hit set');
  });
  test(`${kind}: fractional lifetime keeps final contact before retirement, then cannot hit late entrants`, () => {
    const {snapshot: {checkpoints, final}, hits} = observed(`${prefix}/expiry`);
    assert.equal(checkpoints[0].echoes[0].ticks, .25);
    assert.equal(checkpoints[1].echoes.length, 0);
    assert.deepEqual(hits.map(e => e.targetId), ['terminal']);
    assert.equal(final.echoes.length, 0); assert.ok(final.enemies.some(e => e.id === 'too-late'));
  });
  test(`${kind}: reused public enemy IDs keep legacy exclusion in the hit set`, () => {
    const {snapshot: {final}, hits} = observed(`${prefix}/reused-id`);
    assert.equal(hits.length, 1); assert.equal(final.state.kills, 1);
    assert.ok(final.enemies.some(e => e.id === 'reused'));
  });
}

test('real core/Ghost births retain distinct kinds and parent/shot3 provenance at shot4 contact', () => {
  const {snapshot: {checkpoints, final}, hits, births} = observed('real-birth-late-shot');
  assert.equal(births.length, 2);
  assert.deepEqual(births.map(e => e.sourceKind), ['core-echo', 'upgrade-echo']);
  assert.equal(births[0].parentSourceId, births[1].parentSourceId);
  assert.ok(births.every(e => e.originKnown && e.sourceShotId === 3 && e.parentSourceId));
  assert.deepEqual(checkpoints[0].echoes.map(e => [e.x, e.y, e.ticks, e.sourceId]),
    [[-415, -100, 29, 'direct-0'], [-422, -100, 29, 'direct-0']]);
  assert.deepEqual(hits.map(e => [e.sourceKind, e.accepted, e.outcome]),
    [['core-echo', true, 'armor'], ['upgrade-echo', false, 'shot-duplicate']]);
  assert.ok(hits.every(e => e.sourceShotId === 3 && e.shotId === 4 && e.originKnown));
  assert.equal(final.enemies.find(e => e.id === 'late-plate').hp, 7);
});

test('core follows chain cadence; Ghost Lash requires eligible shot and only creates once per shot', () => {
  const {snapshot: {checkpoints}, births} = observed('real-cadence');
  assert.deepEqual(births.map(e => [e.sourceKind, e.sourceShotId]),
    [['core-echo', 1], ['core-echo', 3], ['upgrade-echo', 3], ['core-echo', 3]]);
  assert.deepEqual(checkpoints.map(s => s.state.lastSlashEchoShot), [-1, 3, 3]);
});

test('combined echo cap still truncates oldest in core-then-upgrade creation order', () => {
  const {snapshot: {checkpoints, final}, births} = observed('real-cap');
  assert.equal(births.length, 8);
  assert.ok(checkpoints.every(s => s.echoes.length <= 3));
  assert.deepEqual(final.echoes.map(e => [e.sourceId, e.upgradeEcho]),
    [['direct-2', true], ['direct-3', false], ['direct-3', true]]);
});

test('wave return clears both echo types; choose ticks cannot progress or resurrect them', () => {
  const {snapshot: {checkpoints, final}, hits} = observed('wave-cleanup');
  assert.equal(checkpoints[0].wavePhase, 'return'); assert.deepEqual(checkpoints[0].echoes, []);
  assert.equal(final.wavePhase, 'choose'); assert.deepEqual(final.echoes, []);
  assert.equal(final.state.elapsed, checkpoints[0].state.elapsed); assert.deepEqual(hits, []);
});
