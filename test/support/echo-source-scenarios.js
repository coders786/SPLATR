// Real-run echo lifecycle fixtures. Controlled contacts/stop isolate ordering;
// they do not replace the damage resolver or claim native physics traversal.
import {createRun} from '../../src/run.js';
import {createCombatTrace} from '../../src/combat-trace.js';
import {placePlayer, stopPlayer} from '../../src/physics.js';
import {upgradeById} from '../../src/upgrades.js';

const kinds = ['core', 'upgrade'];
const cases = ['coverage', 'rejected-once', 'overlap', 'expiry', 'reused-id'];
export const ECHO_SCENARIOS = Object.freeze([
  ...kinds.flatMap(kind => cases.map(name => `${kind}/${name}`)),
  'real-birth-late-shot', 'real-cap', 'real-cadence', 'wave-cleanup',
]);
const scalar = v => v === null || ['number', 'string', 'boolean'].includes(typeof v);
export function runEchoScenario(name, combatSourceTrace = null, makeRun = createRun) {
  if (!ECHO_SCENARIOS.includes(name)) throw new RangeError(name);
  const events = [], legacy = createCombatTrace(4096), checkpoints = [];
  const r = makeRun(123, (type, data = {}) => events.push({type,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => scalar(v)))}), {
    waveMode: true, equipment: {core: 'echo', head: 'coil'}, combatSourceTrace, combatTrace: legacy,
  });
  const {state: s, combat, world} = r;
  const add = (id, kind = 'fang', x = -500, y = -350) => combat.add({id, kind, x, y, pinned: true, delay: 999999});
  const tick = () => {s.stop = 1; r.tick();};
  const echo = (fields = {}) => {
    const e = {x: -500, y: -350, ticks: 30, hits: new Set(), sourceId: 'excluded',
      ...(name.startsWith('upgrade/') ? {upgradeEcho: true} : {}), ...fields};
    s.equipmentFx.echoes.push(e); return e;
  };
  function snapshot() {
    const keys = ['phase', 'elapsed', 'hp', 'edge', 'focus', 'score', 'chain', 'chainTime', 'kills', 'shots',
      'blade', 'drive', 'swordCharge', 'swordContacts', 'lastSlashEchoShot'];
    return {
      state: Object.fromEntries(keys.map(k => [k, s[k] ?? null])), wavePhase: s.wave.phase,
      world: {clock: world.clock, position: {...world.player.position}, velocity: {...world.player.velocity}},
      enemies: [...combat.enemies.values()].map(e => ({id: e.id, hp: e.hp, lastSlash: e.lastSlash ?? null,
        x: e.x, y: e.y})),
      echoes: s.equipmentFx.echoes.map(e => ({x: e.x, y: e.y, ticks: e.ticks,
        hits: [...e.hits], sourceId: e.sourceId ?? null, upgradeEcho: !!e.upgradeEcho})),
      bursts: s.equipmentFx.bursts.length,
    };
  }
  try {
    for (const e of [...combat.enemies.values()]) combat.remove(e);
    s.phase = 'playing'; s.invul = 999999; s.wave.entry = 0;
    placePlayer(world, {x: -350, y: -100}); stopPlayer(world);
    add('sentinel', 'fang', 700, -900);
    s.upgrades.push(upgradeById('ghostlash'));
    s.edge = 1; s.focus = .25; s.chain = 2; s.chainTime = 100;
    const scenario = name.split('/')[1];
    if (scenario === 'coverage') {
      add('excluded'); add('fang'); const plate = add('plate', 'bastion', -490); plate.hp = 6;
      add('boundary', 'fang', -575); add('outside', 'fang', -576);
      echo(); tick(); checkpoints.push(snapshot()); tick();
    } else if (scenario === 'rejected-once') {
      const e = add('already-hit'); e.lastSlash = s.shots;
      echo(); tick(); checkpoints.push(snapshot());
      r.dash({x: 24, y: 0, power: 24 / 42}); tick();
    } else if (scenario === 'overlap') {
      const e = add('plate', 'bastion'); e.hp = 6;
      echo(); echo(); tick(); checkpoints.push(snapshot());
      r.dash({x: 24, y: 0, power: 24 / 42}); tick();
    } else if (scenario === 'expiry') {
      world.engine.timing.timeScale = .5;
      echo({ticks: .75}); tick(); checkpoints.push(snapshot());
      add('terminal'); tick(); checkpoints.push(snapshot()); add('too-late'); tick();
    } else if (scenario === 'reused-id') {
      echo(); add('reused'); tick(); checkpoints.push(snapshot());
      const e = add('reused'); r.dash({x: 24, y: 0, power: 24 / 42}); tick();
      if (!combat.enemies.has(e.id)) throw new Error('legacy hit-set ID semantics changed');
    } else if (name === 'real-birth-late-shot' || name === 'real-cap') {
      const count = name === 'real-cap' ? 4 : 1;
      for (let i = 0; i < count; i++) {
        s.shots = i * 3 + 2; s.chain = 2; s.chainTime = 100;
        r.dash({x: 24, y: 0, power: 24 / 42});
        const victim = add(`direct-${i}`, 'fang', -275, -100);
        combat.contacts.add(victim); tick(); checkpoints.push(snapshot());
      }
      if (name === 'real-birth-late-shot') {
        const origin = s.equipmentFx.echoes[0];
        const victim = add('late-plate', 'bastion', origin.x, origin.y); victim.hp = 8;
        r.dash({x: -24, y: 0, power: 24 / 42});
        s.blade = 0; // Isolate delayed contact from the new shot's live blade.
        tick();
      }
    } else if (name === 'real-cadence') {
      for (const [i, shotBefore] of [[0, 0], [1, 2], [2, null]]) {
        s.chain = 2; s.chainTime = 100;
        if (shotBefore !== null) {s.shots = shotBefore; r.dash({x: 24, y: 0, power: 24 / 42});}
        combat.contacts.add(add(`cadence-${i}`, 'fang', -275, -100)); tick(); checkpoints.push(snapshot());
      }
    } else if (name === 'wave-cleanup') {
      echo(); echo({upgradeEcho: true});
      for (const e of [...combat.enemies.values()]) combat.remove(e);
      tick(); checkpoints.push(snapshot());
      s.wave.phase = 'choose'; tick(); tick();
    }
    return {checkpoints, final: snapshot(), events, legacyTrace: legacy.entries()};
  } finally {r.dispose();}
}
