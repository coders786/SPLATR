// Controlled real-run contact/activation fixtures. Not a simulated renderer or
// replacement damage model: all damage/rewards flow through createRun itself.
import {createRun} from '../../src/run.js';
import {createCombatTrace} from '../../src/combat-trace.js';
import {placePlayer, stopPlayer} from '../../src/physics.js';
import {SWORD_BUILDS} from '../../src/swords.js';
import {upgradeById} from '../../src/upgrades.js';

export const SOURCE_SCENARIOS = Object.freeze([
  'primary-armor', 'primary-kill', 'coil', 'core-echo', 'upgrade-echo',
  'sword-echo', 'sword-pulse', 'prism', 'anchor', 'shear',
]);
const scalar = value => value === null || ['number', 'string', 'boolean'].includes(typeof value);
export function runSourceScenario(name, combatSourceTrace = null, makeRun = createRun) {
  if (!SOURCE_SCENARIOS.includes(name)) throw new RangeError(name);
  const equipment = name === 'coil' ? {head: 'coil'} : name === 'core-echo' ? {core: 'echo'} :
    name === 'prism' ? {body: 'prism'} : name === 'anchor' ? {tail: 'anchor'} :
    name === 'sword-echo' ? SWORD_BUILDS.find(b => b.id === 'wraith').parts :
    name === 'sword-pulse' ? SWORD_BUILDS.find(b => b.id === 'storm').parts : {};
  const events = [], legacyTrace = createCombatTrace(4096);
  const r = makeRun(123, (type, data = {}) => {
    events.push({type, ...Object.fromEntries(Object.entries(data).filter(([, v]) => scalar(v)))});
  }, {waveMode: true, equipment, combatSourceTrace, combatTrace: legacyTrace});
  try {
    for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
    r.state.phase = 'playing'; r.state.invul = 99999; r.state.wave.entry = 0;
    placePlayer(r.world, {x: -350, y: -100}); stopPlayer(r.world);
    const add = (id, kind, x, y = -100) => r.combat.add({id, kind, x, y, pinned: true, delay: 999999});
    add('sentinel', 'fang', 700, -900);
    const hit = e => {r.state.stop = 1; r.combat.contacts.add(e); r.tick();};
    if (name === 'prism') {
      add('needle-victim', 'fang', -390, -280);
      r.state.stop = 1;
      r.world.struck = {surface: 'rail', nx: 1, ny: 0, x: -350, y: -100, depth: 10};
      r.tick();
      for (let i = 0; i < 25; i++) {r.state.stop = 1; r.tick();}
    } else if (name === 'anchor') {
      add('floor-victim', 'fang', -230);
      r.state.stop = 1; r.world.floorKick = {vy: -22, rescue: true}; r.tick();
    } else if (name === 'sword-echo' || name === 'sword-pulse') {
      const e = add('armored', 'bastion', -175); e.hp = 8;
      if (name === 'sword-pulse') r.state.swordCharge = r.state.sword.chargeMax;
      r.dash({x: 24, y: 0, power: 24 / 42});
      for (let i = 0; i < 50; i++) {r.state.stop = 0; r.tick();}
    } else {
      if (name === 'core-echo') {r.state.chain = 2; r.state.chainTime = 100; add('echo-victim', 'fang', -465);}
      if (name === 'upgrade-echo') {r.state.shots = 2; r.state.upgrades.push(upgradeById('ghostlash')); add('echo-victim', 'fang', -465);}
      if (name === 'coil') add('relay-victim', 'fang', -180);
      const target = add('primary-victim', name === 'primary-armor' || name === 'coil' ? 'bastion' : 'fang', -275);
      r.dash({x: 24, y: 0, power: 24 / 42}); hit(target);
      if (name === 'primary-armor') hit(target); // Existing shot dedup, not a second damage unit.
      if (name === 'shear') {
        const second = add('second-direct', 'fang', -230);
        add('shear-victim', 'fang', -30); hit(second);
      }
    }
    const keys = ['phase', 'hp', 'hpMax', 'edge', 'edgeMax', 'focus', 'score', 'chain', 'chainTime', 'kills', 'shots', 'blade', 'drive', 'swordCharge', 'swordContacts', 'kineticStage', 'throughcuts', 'floorKicks'];
    return {
      state: Object.fromEntries(keys.map(k => [k, r.state[k] ?? null])),
      world: {clock: r.world.clock, position: {...r.world.player.position}, velocity: {...r.world.player.velocity}},
      enemies: [...r.combat.enemies.values()].map(e => ({id: e.id, hp: e.hp, x: e.x, y: e.y, mode: e.mode})).sort((a, b) => a.id.localeCompare(b.id)),
      fx: {needles: r.state.equipmentFx.projectiles.length, echoes: r.state.equipmentFx.echoes.length, swords: r.state.swordFx.length},
      events, legacyTrace: legacyTrace.entries(),
    };
  } finally {r.dispose();}
}
