// Controlled real-run contacts for the remaining compatibility boundary.
// Fixtures exercise the real resolver/queues, not a second damage model.
import {createRun} from '../../src/run.js';
import {createCombatTrace} from '../../src/combat-trace.js';
import {createCombatSourceTrace} from '../../src/combat-source-trace.js';
import {placePlayer, stopPlayer} from '../../src/physics.js';
import {swordAttack, SWORD_STYLES} from '../../src/swords.js';

export const BOUNDARY_SCENARIOS = Object.freeze([
  'coil-kill-order', 'coil-armor', 'coil-rejected', 'coil-radius', 'coil-outside', 'coil-tie',
  'anchor-radius', 'anchor-dedup', 'shear-multi-armor', 'shear-coil',
  'sword-echo', 'sword-pulse', 'sword-unknown', 'sword-not-due', 'coil-exception',
]);
const scalar = v => v === null || ['number', 'string', 'boolean'].includes(typeof v);
export function runBoundaryScenario(name, combatSourceTrace = null, makeRun = createRun) {
  if (!BOUNDARY_SCENARIOS.includes(name)) throw new RangeError(name);
  const events = [], legacy = createCombatTrace(4096), checkpoints = [], failure = new Error('fixture relay consumer');
  const r = makeRun(123, (type, data = {}) => {
    events.push({type, ...Object.fromEntries(Object.entries(data).filter(([, v]) => scalar(v)))});
    if (name === 'coil-exception' && type === 'armor' && data.entityId === 'relay') throw failure;
  }, {waveMode: true, equipment: name.startsWith('anchor') ? {tail: 'anchor'} :
    name.startsWith('coil') || name === 'shear-coil' ? {head: 'coil'} : {}, combatSourceTrace, combatTrace: legacy});
  const {state: s, world, combat} = r;
  const add = (id, kind = 'fang', x = -275, y = -100) => combat.add({id, kind, x, y, pinned: true, delay: 999999});
  const hit = e => {s.stop = 1; combat.contacts.add(e); r.tick();};
  function snapshot() {
    return {
      state: Object.fromEntries(['hp', 'edge', 'focus', 'score', 'chain', 'kills', 'shots', 'blade', 'drive',
        'swordCharge', 'swordContacts', 'throughcuts', 'floorKicks', 'floorIgnore'].map(k => [k, s[k] ?? null])),
      world: {clock: world.clock, position: {...world.player.position}, velocity: {...world.player.velocity}},
      enemies: [...combat.enemies.values()].map(e => ({id: e.id, kind: e.kind, hp: e.hp, lastSlash: e.lastSlash ?? null})),
      stroke: s.stroke ? {contacts: s.stroke.contacts, primaries: s.stroke.primaries, kills: s.stroke.kills,
        released: s.stroke.released, points: s.stroke.points} : null,
      swordFx: s.swordFx.map(a => ({kind: a.kind, fired: a.fired, delay: a.delay, life: a.life, hits: [...a.hits]})),
      equipmentFx: {echoes: s.equipmentFx.echoes.length, projectiles: s.equipmentFx.projectiles.length, bursts: s.equipmentFx.bursts.length},
    };
  }
  let threw = false;
  try {
    for (const e of [...combat.enemies.values()]) combat.remove(e);
    s.phase = 'playing'; s.invul = 999999; s.wave.entry = 0;
    placePlayer(world, {x: -350, y: -100}); stopPlayer(world);
    add('sentinel', 'fang', 700, -900);
    if (name.startsWith('coil')) {
      const parent = add('parent', name === 'coil-kill-order' ? 'fang' : 'bastion'); parent.hp = name === 'coil-kill-order' ? 1 : 6;
      const relay = add('relay', name === 'coil-armor' || name === 'coil-exception' ? 'bastion' : 'fang',
        name === 'coil-radius' ? -115 : name === 'coil-outside' ? -114.999 : -180);
      if (relay.kind === 'bastion') relay.hp = 6;
      if (name === 'coil-tie') {relay.x = -275; relay.y = -260; add('alpha', 'fang', -275, 60);}
      r.dash({x: 24, y: 0, power: 24 / 42});
      if (name === 'coil-rejected') {relay.lastSlash = s.shots; add('other', 'fang', -150);}
      try {hit(parent);} catch (error) {if (error !== failure) throw error; threw = true;}
    } else if (name.startsWith('anchor')) {
      add('left-edge', 'fang', -520); add('right-edge', 'fang', -180);
      add('outside', 'fang', -350, -270.001); add('not-fang', 'bastion', -500, -100);
      if (name === 'anchor-dedup') combat.enemies.get('left-edge').lastSlash = s.shots;
      s.stop = 1; world.floorKick = {vy: -22, rescue: true}; r.tick(); checkpoints.push(snapshot());
      s.stop = 1; world.floorKick = {vy: -22, rescue: true}; r.tick();
    } else if (name.startsWith('shear')) {
      r.dash({x: 24, y: 0, power: 24 / 42}); hit(add('first'));
      const second = add('second', 'fang', -230);
      const a = add('wave-a', 'bastion', -30), b = add('wave-b', 'bastion', 70); a.hp = b.hp = 8;
      hit(second); checkpoints.push(snapshot());
      hit(second); // Absent actor in a later batch must not produce another wave.
    } else {
      const kind = name === 'sword-pulse' ? 'pulse' : name === 'sword-unknown' ? 'restored-legacy' : 'echo';
      const a = add('plate', 'bastion', -400, -350); a.hp = 8; a.lastSlash = s.shots;
      add('lane-second', 'fang', -360, -350); add('lane-cap-excluded', 'fang', -320, -350);
      const attack = () => Object.assign(swordAttack({...SWORD_STYLES.echo, targetCap: 2}, {x: -500, y: -350}, 0, 7, kind),
        {delay: name === 'sword-not-due' ? 3 : 1});
      s.swordFx.push(attack()); if (name !== 'sword-not-due') s.swordFx.push(attack());
      for (let i = 0; i < (name === 'sword-not-due' ? 8 : 3); i++) {
        s.stop = 0; r.tick(); if (i === 4 || i === 5) checkpoints.push(snapshot());
      }
    }
    return {checkpoints, final: snapshot(), threw, events, legacyTrace: legacy.entries()};
  } finally {r.dispose();}
}

// Shared browser/Node runner; keeping observation separate lets callers assert
// on/off equality without putting diagnostic fields into gameplay snapshots.
export function observeBoundaryScenario(name, makeRun) {
  const trace = createCombatSourceTrace(4096), snapshot = runBoundaryScenario(name, trace, makeRun);
  return {snapshot, sources: trace.entries()};
}
