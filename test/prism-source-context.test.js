import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentSourceContext} from '../src/equipment-source-context.js';
import {createRun} from '../src/run.js';
import {createCombatSourceTrace} from '../src/combat-source-trace.js';
import {placePlayer, stopPlayer} from '../src/physics.js';
import {SWORD_BUILDS} from '../src/swords.js';

function setup(equipment = {body: 'prism'}, trace = createCombatSourceTrace(1024)) {
  const events = [];
  const r = createRun(123, (type, data) => events.push({type, data}), {
    waveMode: true, equipment, combatSourceTrace: trace,
  });
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.state.phase = 'playing'; r.state.invul = 99999; r.state.wave.entry = 0;
  placePlayer(r.world, {x: -350, y: -100}); stopPlayer(r.world);
  r.combat.add({id: 'sentinel', kind: 'fang', x: 700, y: -900, pinned: true, delay: 99999});
  const add = (id, kind = 'fang', x = -330, y = -100) => r.combat.add({id, kind, x, y, pinned: true, delay: 99999});
  const tick = () => {r.state.stop = 1; r.tick();}; // Controlled legacy callback fixture, not a new freeze mechanic.
  const needle = (fields = {}) => {
    const n = {x: -350, y: -100, vx: 0, vy: 0, ticks: 10, ...fields};
    r.state.equipmentFx.projectiles.push(n); return n;
  };
  return {r, trace, events, add, tick, needle};
}
const hits = trace => trace.entries().filter(e => e.type === 'cut-result' && e.sourceKind === 'prism-needle');
const side = () => ({surface: 'rail', nx: 1, ny: 0, x: -350, y: -100, depth: 10});

test('Prism has one immutable explicit context preserving the legacy contact flags', () => {
  const context = equipmentSourceContext('prism-needle');
  assert.deepEqual(context, {kind: 'prism-needle', fromShear: true, secondary: true, swordSource: null});
  assert.equal(equipmentSourceContext('prism-needle'), context, 'no per-hit policy allocation');
  assert.ok(Object.isFrozen(context));
  assert.throws(() => {context.secondary = false;}, TypeError);
});

test('unknown or unmigrated kinds fail explicitly instead of becoming primary contacts', () => {
  for (const kind of [undefined, null, '', 'primary', 'sword-laser', 'coil-chain', 'Prism', '__proto__', 'constructor', {}, Symbol('needle')]) {
    assert.throws(() => equipmentSourceContext(kind), RangeError);
  }
});

test('an actual needle hit remains secondary while retaining legacy kill, chain and refill rewards', () => {
  const {r, trace, events, add, tick, needle} = setup();
  try {
    add('victim'); r.state.edge = 1; r.state.focus = .25; r.state.chain = 2; r.state.chainTime = 100;
    needle(); tick();
    const [hit] = hits(trace);
    assert.equal(hit.accepted, true); assert.equal(hit.outcome, 'kill');
    assert.equal(hit.fromShear, true); assert.equal(hit.secondary, true); assert.equal(hit.swordSource, false);
    assert.equal(hit.originKnown, false, 'fixture-injected source birth is not invented');
    assert.equal(r.state.kills, 1); assert.equal(r.state.chain, 3);
    assert.equal(r.state.edge, 2); assert.equal(r.state.focus, 1); assert.ok(r.state.score > 0);
    assert.equal(events.filter(e => e.type === 'cut').length, 1);
    assert.equal(events.find(e => e.type === 'cut').data.secondary, true);
    assert.equal(r.state.equipmentFx.projectiles.length, 0);
  } finally {r.dispose();}
});

test('Prism secondary hits still cannot create Coil/core echoes or charge a pulse', () => {
  for (const equipment of [
    {body: 'prism', head: 'coil', core: 'echo'},
    {...SWORD_BUILDS.find(b => b.id === 'eater').parts, body: 'prism'},
  ]) {
    const {r, trace, add, tick, needle} = setup(equipment);
    try {
      add('victim'); add('neighbor', 'fang', -290);
      r.state.chain = 2; r.state.chainTime = 100;
      needle(); tick();
      assert.equal(r.combat.enemies.has('neighbor'), true);
      assert.equal(r.state.equipmentFx.echoes.length, 0);
      assert.equal(r.state.swordCharge, 0); assert.equal(r.state.swordContacts, 0);
      assert.equal(hits(trace).filter(e => e.accepted).length, 1);
      assert.ok(!trace.entries().some(e => e.sourceKind === 'coil-relay' || e.sourceKind === 'core-echo'));
    } finally {r.dispose();}
  }
});

test('nearest eligible living Fang wins, with stable ID ties independent of insertion order', () => {
  for (const reverse of [false, true]) {
    const {r, trace, add, tick, needle} = setup();
    try {
      const candidates = [['alpha', 'fang', -330], ['beta', 'fang', -370]];
      for (const args of reverse ? [...candidates].reverse() : candidates) add(...args);
      add('closer-armor', 'bastion', -349);
      const dead = add('closer-dead', 'fang', -351); dead.hp = 0;
      needle(); tick();
      assert.equal(hits(trace)[0].targetId, 'alpha');
      assert.equal(r.combat.enemies.has('beta'), true);
      assert.equal(r.combat.enemies.has('closer-armor'), true);
    } finally {r.dispose();}
  }
});

for (const [distance, expectedHits] of [[28, 1], [28.0001, 0]]) {
  test(`legacy endpoint contact radius ${distance} stays ${expectedHits ? 'inside' : 'outside'}`, () => {
    const {r, trace, add, tick, needle} = setup();
    try {
      add('edge', 'fang', -350, -100 - distance); needle(); tick();
      assert.equal(hits(trace).length, expectedHits);
    } finally {r.dispose();}
  });
}

test('a miss preserves velocity integration, fractional dt, age and source object shape', () => {
  const {r, trace, tick, needle} = setup();
  try {
    r.world.engine.timing.timeScale = .5;
    const n = needle({vx: 2, vy: -9, ticks: 10}); tick();
    assert.deepEqual(n, {x: -349, y: -104.5, vx: 2, vy: -9, ticks: 9.5});
    assert.equal(r.state.equipmentFx.projectiles[0], n);
    assert.equal(hits(trace).length, 0);
  } finally {r.dispose();}
});

test('expiration still queries its final endpoint before retirement; this adapter does not retune lifetime ordering', () => {
  const {r, trace, add, tick, needle} = setup();
  try {
    add('terminal', 'fang', -330); needle({ticks: .25}); tick();
    assert.equal(hits(trace)[0].accepted, true);
    assert.equal(r.state.equipmentFx.projectiles.length, 0);
  } finally {r.dispose();}
});

test('two needles retain shared-shot dedup and consumption on an already-hit survivor', () => {
  const {r, trace, add, tick, needle} = setup();
  try {
    const e = add('plate-fang'); e.hp = 3;
    needle(); needle(); tick();
    assert.equal(e.hp, 2); assert.equal(r.state.kills, 0);
    assert.deepEqual(hits(trace).map(h => [h.accepted, h.outcome]), [[true, 'armor'], [false, 'shot-duplicate']]);
    assert.equal(r.state.equipmentFx.projectiles.length, 0, 'a rejected hit still consumes the legacy needle');
    assert.notEqual(hits(trace)[0].sourceId, hits(trace)[1].sourceId);
  } finally {r.dispose();}
});

test('a rejected nearest target does not cause a new retry/retargeting rule', () => {
  const {r, trace, add, tick, needle} = setup();
  try {
    const e = add('nearest', 'fang', -345); e.lastSlash = r.state.shots;
    add('other', 'fang', -325); needle(); tick();
    assert.equal(hits(trace)[0].outcome, 'shot-duplicate');
    assert.equal(r.combat.enemies.has('other'), true);
    assert.equal(r.state.equipmentFx.projectiles.length, 0);
  } finally {r.dispose();}
});

test('qualified wall creation retains exactly two upward needles and 45-tick cooldown', () => {
  const {r, trace, tick} = setup();
  try {
    r.world.struck = side(); tick();
    assert.equal(r.state.equipmentFx.projectiles.length, 2);
    assert.deepEqual(r.state.equipmentFx.projectiles.map(n => [n.vx, n.vy]), [[-2, -9], [2, -9]]);
    for (let i = 0; i < 44; i++) {r.world.struck = side(); tick();}
    assert.equal(trace.entries().filter(e => e.type === 'source-created' && e.sourceKind === 'prism-needle').length, 2);
    r.world.struck = side(); tick();
    const births = trace.entries().filter(e => e.type === 'source-created' && e.sourceKind === 'prism-needle');
    assert.equal(births.length, 4);
    assert.ok(births.every(e => e.originKnown));
  } finally {r.dispose();}
});

test('floor contact and a repeated identical wall callback do not create extra needles', () => {
  const {r, trace, tick} = setup();
  try {
    r.world.struck = {...side(), nx: 0, ny: 1}; tick();
    assert.equal(r.state.equipmentFx.projectiles.length, 0);
    const contact = side(); r.world.struck = contact; tick();
    for (let i = 0; i < 46; i++) {r.world.struck = contact; tick();}
    assert.equal(trace.entries().filter(e => e.type === 'source-created' && e.sourceKind === 'prism-needle').length, 2);
  } finally {r.dispose();}
});

test('slow-world repeated banks retain the existing eight-projectile cap without retuning admission', () => {
  const {r, tick} = setup();
  try {
    r.world.engine.timing.timeScale = .1;
    for (let i = 0; i < 182; i++) {r.world.struck = side(); tick(); assert.ok(r.state.equipmentFx.projectiles.length <= 8);}
    assert.equal(r.state.equipmentFx.projectiles.length, 8);
  } finally {r.dispose();}
});
