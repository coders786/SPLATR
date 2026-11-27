// Integration simulation: actual physics/queries/streamed enemies. This is
// deterministic correctness coverage, not native input, balance or FPS evidence.
import {createRun} from '../../src/run.js';
import {createCombatTrace} from '../../src/combat-trace.js';
import {createCombatSourceTrace} from '../../src/combat-source-trace.js';

const scalar = v => v === null || ['number', 'string', 'boolean'].includes(typeof v);
export function runCombatSourceSimulation(seed, equipment, observed = false, makeRun = createRun) {
  const trace = observed ? createCombatSourceTrace(4096) : null, legacy = createCombatTrace(4096), events = [], checkpoints = [];
  const r = makeRun(seed, (type, data = {}) => events.push({type,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => scalar(v)))}), {
    staged: false, equipment, combatSourceTrace: trace, combatTrace: legacy,
  });
  function snapshot() {
    const s = r.state;
    return {state: Object.fromEntries(['phase', 'hp', 'edge', 'focus', 'score', 'chain', 'kills', 'shots',
      'blade', 'drive', 'throughcuts', 'swordCharge', 'swordContacts'].map(k => [k, s[k] ?? null])),
    world: {clock: r.world.clock, position: {...r.world.player.position}, velocity: {...r.world.player.velocity}},
    enemies: [...r.combat.enemies.values()].map(e => ({id: e.id, hp: e.hp, x: e.x, y: e.y, mode: e.mode})),
    pending: [s.swordFx.length, s.equipmentFx.echoes.length, s.equipmentFx.projectiles.length]};
  }
  try {
    // Keep the route alive for the whole simulation; ammo/aim/target selection
    // and all source scheduling otherwise use their normal implementation.
    r.state.invul = 999999;
    for (let tick = 0; tick < 360; tick++) {
      if (tick % 30 === 0) r.dash(r.suggestion());
      r.tick(); if (tick % 60 === 59) checkpoints.push(snapshot());
    }
    return {gameplay: {checkpoints, events, legacy: legacy.entries()}, sources: trace?.entries() ?? null};
  } finally {r.dispose();}
}
