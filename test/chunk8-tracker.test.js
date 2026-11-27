/**
 * CHUNK 8 — THE DEED TRACKER: how a run proves a quest.
 *
 * The tracker is the only thing that turns a simulation event into a number, so
 * these tests are about the places where that mapping has historically lied:
 *
 *   · a counter that never resets (the old airborne streak),
 *   · a counter that counts the wrong thing (shatters, which continuous mode
 *     increments on every sector clear),
 *   · a "goal" that can be farmed by not playing (verified below: an idle run
 *     used to complete all three restraint deeds),
 *   · a stroke counted once per victim instead of once per launch.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeedTracker, RUN_ZERO, totalZero } from '../src/deed-tracker.js';
import { deedMetrics, DEEDS, deedProgress } from '../src/deeds.js';
import { createRun } from '../src/run.js';

const fresh = (profile = {}) => {
  const tracker = createDeedTracker();
  tracker.begin(profile);
  return tracker;
};
const metricsOf = (tracker) => {
  const s = tracker.snapshot();
  return deedMetrics({ run: s.run, total: s.total });
};

/* ══ THE LEDGERS ══════════════════════════════════════════════════════════ */

test('a new run wipes the per-run ledger and keeps the lifetime one', () => {
  const tracker = fresh({ total: { cutsTotal: 120, dashesTotal: 300, paceTotal: 900, seals: 12, bigKillTotal: 40, deepRuns3: 3, deepRuns4: 2 } });
  tracker.event('cut', { kind: 'fang', strokeKills: 1 });
  tracker.event('dash', { power: 1 });
  assert.equal(metricsOf(tracker).kills, 1);
  assert.equal(metricsOf(tracker).cutsTotal, 121, 'the lifetime ledger moved');

  tracker.begin({ total: { cutsTotal: 121, dashesTotal: 301, seals: 12 } });
  const m = metricsOf(tracker);
  assert.equal(m.kills, 0, 'the run starts clean');
  assert.equal(m.cutsTotal, 121, 'the ledger does not');
  assert.equal(m.apex, 0, 'and no state leaks from the last run');
});

test('a missing or corrupt ledger reads as zero, never NaN', () => {
  for (const bad of [undefined, null, {}, { cutsTotal: NaN }, { cutsTotal: -9 }, { cutsTotal: 'lots' }]) {
    const t = fresh({ total: bad });
    const m = metricsOf(t);
    for (const [key, value] of Object.entries(m)) {
      if (key === 'heights' || key === 'marks') continue;
      assert.equal(Number.isFinite(value), true, `${key} is ${value} for ${JSON.stringify(bad)}`);
    }
  }
});

/* ══ CUT ══════════════════════════════════════════════════════════════════ */

test('a cut counts once, and paper and hazards do not count at all', () => {
  const t = fresh();
  t.event('cut', { kind: 'fang' });
  t.event('cut', { kind: 'fang', small: true });   // a fork's child, or paper
  t.event('cut', { kind: 'prism', paper: true });
  t.event('cut', { kind: 'hazard', hazard: true });
  const m = metricsOf(t);
  assert.equal(m.kills, 1, 'only the full-size cut is a kill');
  assert.equal(m.cutsTotal, 1);
});

test('the shear is counted from the release flag, not guessed at from speed', () => {
  const t = fresh();
  t.event('cut', { kind: 'fang', release: true });
  t.event('cut', { kind: 'fang', release: false });
  t.event('cut', { kind: 'fang', release: true });
  assert.equal(metricsOf(t).throughcuts, 2);
});

test('plates are counted per plate, not per enemy', () => {
  const t = fresh();
  t.event('cut', { kind: 'bastion', armorRemoved: 2 });
  t.event('cut', { kind: 'crown', armorRemoved: 1 });
  t.event('cut', { kind: 'fang', armorRemoved: 0 });
  assert.equal(metricsOf(t).armor, 3);
});

test('a wide stroke is counted ONCE per launch, not once per victim', () => {
  // The run reports a running `strokeKills` for the current launch, so a
  // four-wide stroke arrives as three cuts with strokeKills 2, 3 and 4.
  const t = fresh();
  t.event('cut', { kind: 'fang', strokeKills: 1 });
  t.event('cut', { kind: 'fang', strokeKills: 2 });
  t.event('cut', { kind: 'fang', strokeKills: 3 });
  t.event('cut', { kind: 'fang', strokeKills: 4 });
  const m = metricsOf(t);
  assert.equal(m.doubles, 1, 'one launch, one double');
  assert.equal(m.triples, 1);
  assert.equal(m.quads, 1);
  // A second launch counts again.
  t.event('cut', { kind: 'fang', strokeKills: 2 });
  assert.equal(metricsOf(t).doubles, 2);
});

test('angle and height are read from the run, and both angles can be wide', () => {
  const t = fresh();
  // 0 rad = horizontal, pi/2 = vertical: both are "within 25° of an axis".
  t.event('cut', { kind: 'fang', cut: 0, height: 'top' });
  t.event('cut', { kind: 'fang', cut: Math.PI / 2, height: 'bottom' });
  t.event('cut', { kind: 'fang', cut: Math.PI / 4, height: 'middle' });
  const m = metricsOf(t);
  assert.equal(m.wideCut, 1);
  assert.equal(m.upCut, 1);
  assert.equal(m.highCut, 1);
  assert.equal(m.lowCut, 1);
  assert.equal(m.heights, 3, 'three distinct heights');
});

test('species are tracked, and DISTINCT species is a set', () => {
  const t = fresh();
  for (const kind of ['fang', 'fang', 'prism', 'fork', 'bastion', 'crown']) t.event('cut', { kind });
  const m = metricsOf(t);
  assert.equal(m.fang, 2);
  assert.equal(m.prism, 1);
  assert.equal(m.bigKill, 2, 'bastion and crown are armoured');
  assert.equal(m.marks, 5, 'five distinct species');
});

test('fork halves are counted as halves, not as kills', () => {
  const t = fresh();
  t.event('cut', { kind: 'fang', entityId: 'kid-12', heir: true });
  t.event('cut', { kind: 'fang', entityId: 'kid-13', heir: true });
  const m = metricsOf(t);
  assert.equal(m.heirKill, 2);
  assert.equal(m.kills, 0, 'a half is not a kill');
});

/* ══ MOTION ═══════════════════════════════════════════════════════════════ */

test('a full-pull streak is consecutive, and any weaker launch breaks it', () => {
  const t = fresh();
  for (const power of [0.9, 0.8, 0.75]) t.event('dash', { power });
  assert.equal(metricsOf(t).powerStreak, 3);
  t.event('dash', { power: 0.4 });
  t.event('dash', { power: 0.9 });
  assert.equal(metricsOf(t).powerStreak, 3, 'the streak restarted, it did not grow');
  assert.equal(metricsOf(t).dashes, 5);
  assert.equal(metricsOf(t).dashesTotal, 5);
});

test('the clean-bank chain comes from the recogniser, not from the bank count', () => {
  const t = fresh();
  t.event('bank', {});
  t.event('cleanBank', { chain: 1 });
  t.event('bank', {});
  t.event('cleanBank', { chain: 2 });
  t.event('cleanBank', { chain: 3 });
  const m = metricsOf(t);
  assert.equal(m.banks, 2);
  assert.equal(m.cleanBanks, 3);
  assert.equal(m.bankChain, 3, 'the chain is the recogniser own number');
});

test('a bank loans the next cut for COUPE, and the loan expires', () => {
  const t = fresh();
  t.event('bank', {});
  t.tick({ grounded: true });
  t.event('cut', { kind: 'fang' });
  assert.equal(metricsOf(t).bankCuts, 1, 'a cut right after a bank counts');
  for (let i = 0; i < 40; i++) t.tick({ grounded: true });
  t.event('cut', { kind: 'fang' });
  assert.equal(metricsOf(t).bankCuts, 1, 'a cut a second later does not');
});

/* ══ AIRBORNE — the counter that never used to end ═══════════════════════ */

test('the airborne streak RESETS on touchdown', () => {
  // `airKills` is the BEST airborne streak of the run, so a reset is only
  // observable through it: after landing, a shorter second streak must not add
  // to the first, and a longer one must replace it rather than extend it.
  const t = fresh();
  for (let i = 0; i < 4; i++) { t.tick({ grounded: false }); t.event('cut', { kind: 'fang' }); }
  assert.equal(metricsOf(t).airKills, 4, 'four cuts in the air');

  t.tick({ grounded: true });
  for (let i = 0; i < 2; i++) { t.tick({ grounded: false }); t.event('cut', { kind: 'fang' }); }
  assert.equal(metricsOf(t).airKills, 4, 'a shorter second streak did not extend the first');

  t.tick({ grounded: true });
  for (let i = 0; i < 6; i++) { t.tick({ grounded: false }); t.event('cut', { kind: 'fang' }); }
  assert.equal(metricsOf(t).airKills, 6, 'a longer one replaced it, from the ground up');
  assert.ok(metricsOf(t).airTicks >= 12, 'the height record survives');
});

/* ══ HYPER ═══════════════════════════════════════════════════════════════ */

test('Hyper time and peak speed only move while Hyper is live', () => {
  const t = fresh();
  for (let i = 0; i < 10; i++) t.tick({ grounded: false, hyping: true, speed: 320 + i });
  const inside = metricsOf(t);
  assert.equal(inside.hyperTicks, 10);
  assert.equal(inside.hyperPeak, 329);
  for (let i = 0; i < 10; i++) t.tick({ grounded: false, hyping: false, speed: 900 });
  assert.equal(metricsOf(t).hyperTicks, 0, 'time inside Hyper ends when Hyper does');
  assert.equal(metricsOf(t).hyperPeak, 329, 'the record does not');
});

test('APEX requires a cut AT speed, not merely being fast', () => {
  const fast = fresh();
  for (let i = 0; i < 10; i++) fast.tick({ grounded: false, hyping: true, speed: 600 });
  assert.equal(metricsOf(fast).hyperApexKills, 0, 'speed alone is not the deed');
  fast.event('cut', { kind: 'fang', speed: 500 });
  assert.equal(metricsOf(fast).hyperApexKills, 1);
});

/* ══ PACE AND THE RESTRAINT DEEDS ════════════════════════════════════════ */

test('pace is read from the director and accumulates lifetime ticks', () => {
  const t = fresh();
  const pace = { target: 18, speed: 20, best: 40 };
  for (let i = 0; i < 5; i++) t.tick({ grounded: false, pace });
  const m = metricsOf(t);
  assert.equal(m.paceTicks, 40, 'the longest at-target streak');
  assert.equal(m.paceTotal, 5, 'and the lifetime total');
  // Below target, and holding, both stop it.
  for (let i = 0; i < 5; i++) t.tick({ grounded: false, pace: { target: 18, speed: 10, best: 40 } });
  for (let i = 0; i < 5; i++) t.tick({ grounded: false, pace, holding: true });
  assert.equal(metricsOf(t).paceTotal, 5);
});

test('an IDLE run completes none of the restraint deeds', () => {
  // The regression this exists for: the first version counted every tick
  // without a kill, so putting the controller down for 3000 ticks completed all
  // three "don\'t cut" deeds. Restraint means moving at speed without cutting.
  const idle = fresh();
  for (let i = 0; i < 3000; i++) idle.tick({ grounded: true, speed: 0 });
  const none = DEEDS.filter((d) => deedProgress(d, metricsOf(idle)).done);
  assert.deepEqual(none.map((d) => d.id), [], 'nothing is earned by standing still');

  // The same time, moving, does earn them.
  const moving = fresh();
  for (let i = 0; i < 3000; i++) moving.tick({ grounded: false, speed: 40 });
  const earned = DEEDS.filter((d) => deedProgress(d, metricsOf(moving)).done).map((d) => d.id);
  assert.ok(earned.includes('rhythm-silence'), 'moving without cutting is the deed');
});

test('the quiet clock resets on a kill', () => {
  const t = fresh();
  for (let i = 0; i < 100; i++) t.tick({ grounded: false, speed: 40 });
  assert.ok(metricsOf(t).quietTicks >= 100);
  t.event('cut', { kind: 'fang' });
  t.tick({ grounded: false, speed: 40 });
  assert.ok(metricsOf(t).quietTicks >= 100, 'the record stands');
  assert.ok(metricsOf(t).quietTicks < 200, 'and a kill did not extend it');
});

/* ══ DEPTH ═══════════════════════════════════════════════════════════════ */

test('a seal counts, a flawless seal counts separately, and a hit voids it', () => {
  const t = fresh();
  t.event('sector', { band: 2 });
  t.event('sector', { band: 3 });
  assert.equal(metricsOf(t).seals, 2);
  assert.equal(metricsOf(t).flawless, 2, 'both were untouched');
  t.event('break', { cause: 'fang' });
  t.event('sector', { band: 4 });
  assert.equal(metricsOf(t).seals, 3);
  assert.equal(metricsOf(t).flawless, 2, 'the hit cost the flawless seal');
});

test('a clean climb is worth nothing the moment a hit lands', () => {
  const t = fresh();
  t.tick({ grounded: false, band: 5 });
  assert.equal(metricsOf(t).runClean, 5);
  t.event('break', {});
  assert.equal(metricsOf(t).runClean, 0);
});

test('depth runs are counted per RUN, not per tick', () => {
  const t = fresh();
  for (let i = 0; i < 500; i++) t.tick({ grounded: false, band: 4 });
  assert.equal(metricsOf(t).deepRuns3, 0, 'a run is banked when it ends');
  const settled = t.settle();
  assert.equal(settled.total.deepRuns3, 1, 'one deep run is one deep run');
  assert.equal(settled.total.deepRuns4, 1);
});

test('the sector number never goes backwards, and entering counts', () => {
  const t = fresh();
  t.tick({ band: 3 });
  t.tick({ band: 2 });
  t.tick({ band: 5 });
  const m = metricsOf(t);
  assert.equal(m.sector, 5);
  assert.equal(m.sectorsEntered, 3, '1, then 3, then 5');
});

test('APEX is a claim about the WHOLE run, so it can be lost', () => {
  const t = fresh();
  for (let i = 0; i < 5; i++) t.event('sector', { band: i + 2 });
  t.tick({ band: 7 });
  assert.equal(metricsOf(t).apex, 1, 'seven sectors, five flawless seals');
  t.event('break', {});
  assert.equal(metricsOf(t).apex, 0, 'a hit at sector seven voids it');
});

/* ══ AGAINST A REAL RUN ══════════════════════════════════════════════════ */

test('a real shipped run feeds the tracker without throwing, and moves real counters', () => {
  const tracker = fresh({ total: {} });
  const events = [];
  const r = createRun(11, (type, data) => {
    events.push(type);
    tracker.event(type, { ...(data || {}), kind: data?.kind });
  }, { waveMode: true, continuous: true, catalogRewards: false, postRewards: true });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    for (let i = 0; i < 600; i++) {
      r.tick();
      tracker.step({
        grounded: !!r.world.grounded,
        hyping: !!r.state.hyper,
        speed: Number.isFinite(r.state.moved) ? r.state.moved : undefined,
        pace: r.state.wave?.pace,
        band: r.state.band,
        holding: !!r.state.held,
      });
    }
    const m = metricsOf(tracker);
    for (const [key, value] of Object.entries(m)) {
      assert.equal(Number.isFinite(value), true, `${key} is ${value}`);
      assert.ok(value >= 0, `${key} is negative`);
    }
    assert.ok(m.sector >= 1, 'the sector is at least the first one');
    assert.ok(events.length > 0, 'the run emitted events at all');
  } finally {
    r.dispose();
  }
});

test('the tracker exposes which metric a deed reads, for a board that will not move', () => {
  const t = fresh();
  assert.ok(t.metricOf('cut-firstblood').includes('cut'));
  assert.equal(t.metricOf('not-a-deed'), null);
  // And RUN_ZERO / totalZero are the shapes the tracker promises.
  assert.ok(Object.keys(RUN_ZERO).length > 40);
  assert.deepEqual(Object.keys(totalZero()), ['cutsTotal', 'dashesTotal', 'paceTotal', 'seals', 'bigKillTotal', 'deepRuns3', 'deepRuns4', 'monolithsTotal']);
});
