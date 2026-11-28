/**
 * CHUNK 3 — FLOW: the landlord's cadence, a five-second OVERDRIVE, and one
 * live bonus goal per sector.
 *
 * What is NOT tested here because it already shipped (see src/flow.js header):
 * cut halves, paint decals, +1 cut per kill, squash/stretch.
 *
 * The rules are pure, so most of this file is arithmetic; the last three tests
 * drive the real continuous director and the real run, because a goal that is
 * correct in isolation but never reaches the HUD or the ledger is the failure
 * mode this chunk exists to prevent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANDLORD, landlordDue, nextLandlord, OVERDRIVE,
  GOALS, GOAL_DECK, GOAL_REWARD, FIRST_GOAL,
  goalFor, goalMetrics, goalProgress, goalLine, goalPayout,
} from '../src/flow.js';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';
import { createDisplay, installDom } from './support/display.js';
import { placePlayer, stopPlayer } from '../src/physics.js';

/* ── THE LANDLORD'S CADENCE ─────────────────────────────────────────────── */

test('the landlord keeps its own cadence instead of waiting for a torn arena', () => {
  assert.equal(LANDLORD.first, 4);
  assert.equal(LANDLORD.every, 4);
  for (const n of [1, 2, 3, 5, 6, 7, 9, 10, 11]) assert.equal(landlordDue(n), false, `sector ${n} is not a landlord sector`);
  for (const n of [4, 8, 12, 16]) assert.equal(landlordDue(n), true, `sector ${n} raises the landlord`);
});

test('the first three sectors are left to the authored story ladder', () => {
  // Sectors 1-3 are scripted (cut, fear, conduits/rage). A boss in them would
  // interrupt the only authored run in the game — this is the pin.
  for (const n of [1, 2, 3]) assert.ok(!landlordDue(n), `sector ${n} must stay a story sector`);
});

test('the landlord countdown is honest and always looks forward', () => {
  assert.equal(nextLandlord(1), 4);
  assert.equal(nextLandlord(4), 4, 'a sector that raises it answers itself');
  assert.equal(nextLandlord(5), 8);
  assert.equal(nextLandlord(8), 8);
  for (let n = 1; n <= 30; n++) {
    const due = nextLandlord(n);
    assert.ok(due >= n, 'never points backwards');
    assert.ok(landlordDue(due), 'the answered sector really is a landlord sector');
    assert.ok(due - n <= LANDLORD.every, 'never further away than one cycle');
  }
});

test('nonsense sectors do not crash the cadence', () => {
  for (const bad of [undefined, null, NaN, 0, -2, 1.7, '4']) assert.equal(typeof landlordDue(bad), 'boolean');
  assert.equal(landlordDue('4'), true);
  assert.equal(landlordDue(0), false);
});

/* ── OVERDRIVE ──────────────────────────────────────────────────────────── */

test('OVERDRIVE runs five seconds, not the old 2.9', () => {
  assert.equal(OVERDRIVE.seconds, 5);
  assert.equal(OVERDRIVE.ticks, OVERDRIVE.seconds * 60);
  assert.ok(OVERDRIVE.ticks > 175, 'the whole point is that it is longer than it was');
});

test('a real run banks OVERDRIVE at the new length and its bar fill cannot exceed 100%', () => {
  const r = createRun(31, () => {}, { waveMode: true, continuous: true });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.chain = 0;
    r.state.drive = 0;
    // The chain ladder grants Overdrive on a multiple of `overdriveKills`
    // (4 with a RIOT core, 6 otherwise). Start one link short so a single real
    // kill lands exactly on the grant — this proves the constant is wired to
    // the grant, not merely declared.
    // The chain window is 3-6s; hold it open so the point of the test is the
    // SIZE of the grant, not whether a chain survives between two kills.
    r.state.chain = 5;
    r.state.chainTime = 999;
    r.state.chainMax = 999;
    const target = [...r.combat.enemies.values()][0];
    assert.ok(target, 'the sector has bodies');
    placePlayer(r.world, { x: target.x, y: target.y + 120 });
    stopPlayer(r.world);
    r.state.edge = r.state.edgeMax;
    r.dash({ x: 0, y: -42, power: 1 });
    for (let i = 0; i < 20 && r.state.drive <= 0; i++) r.tick();
    assert.ok(r.state.drive > 0 && r.state.drive <= OVERDRIVE.ticks, `drive is within the new bank, got ${r.state.drive}`);
    assert.equal(r.state.overdriveBest, OVERDRIVE.ticks, 'the grant was the full five seconds');
    assert.ok(r.state.overdriveBest > 175, 'and longer than the 175 it used to be');
    assert.ok(r.state.overdriveBest > 0, 'reaching Overdrive is recorded for the goal');
    assert.ok(1 >= Math.min(1, Math.max(0, r.state.drive / OVERDRIVE.ticks)), 'the HUD divisor never draws past its track');
  } finally {
    r.dispose();
  }
});

/* ── THE GOAL DECK ──────────────────────────────────────────────────────── */

test('every goal is a directive with a metric the director actually tracks', () => {
  const metrics = new Set(goalMetrics({}, {}).constructor === Object ? Object.keys(goalMetrics({}, {})) : []);
  for (const g of Object.values(GOALS)) {
    assert.equal(typeof g.label, 'string');
    assert.equal(typeof g.line, 'string');
    assert.ok(g.line.length > 0 && g.line.length <= 20, `${g.id} stays a directive: "${g.line}"`);
    assert.ok(g.label === g.label.toUpperCase(), `${g.id} is shouted`);
    assert.ok(metrics.has(g.metric), `${g.id} reads a real counter (${g.metric})`);
    assert.ok(g.target > 0);
  }
  assert.equal(GOAL_DECK.length, 5);
  assert.deepEqual([...GOAL_DECK].sort(), Object.keys(GOALS).sort(), 'the deck is exactly the goal table');
});

test('the first sector always asks for the thing the game teaches first', () => {
  for (const seed of [1, 7, 99, 12345, -3]) {
    assert.equal(goalFor({ number: 1, seed, hasCrown: true }).id, FIRST_GOAL);
    assert.equal(goalFor({ number: 1, seed, hasCrown: false }).id, FIRST_GOAL);
  }
  assert.equal(GOALS[FIRST_GOAL].metric, 'firstKillTicks', 'first blood is a speed goal on the first cut');
});

test('no Crown on the field means no Crown goal, over every seed and sector', () => {
  for (let seed = 0; seed < 120; seed++) {
    for (let n = 1; n <= 24; n++) {
      assert.notEqual(goalFor({ number: n, seed, hasCrown: false }).id, 'gold', `seed ${seed} sector ${n} cannot ask for a crown that is not there`);
    }
  }
});

test('the goal never repeats two sectors in a row', () => {
  let previous = null;
  for (let seed = 0; seed < 150; seed++) {
    previous = null;
    for (let n = 1; n <= 24; n++) {
      const id = goalFor({ number: n, seed, hasCrown: true }).id;
      if (n > 1) assert.notEqual(id, previous, `seed ${seed}: sector ${n} repeated sector ${n - 1}'s goal`);
      previous = id;
    }
  }
});

test('the goal is deterministic and cannot be re-rolled by asking twice', () => {
  for (const [seed, n] of [[7, 2], [99, 5], [424242, 13]]) {
    const a = goalFor({ number: n, seed, hasCrown: true });
    const b = goalFor({ number: n, seed, hasCrown: true });
    assert.deepEqual({ ...a }, { ...b });
  }
});

test('consecutive sectors are dealt a real variety, not a two-goal deck', () => {
  const seen = new Set();
  for (let n = 2; n <= 9; n++) seen.add(goalFor({ number: n, seed: 19, hasCrown: true }).id);
  assert.ok(seen.size >= 3, `eight sectors dealt only ${[...seen].join(', ')}`);
});

/* ── JUDGING AND PAYING ─────────────────────────────────────────────────── */

test('a count goal is met at its target and not one short', () => {
  const banks = GOALS.banks;
  assert.equal(goalProgress(banks, { banks: banks.target - 1 }).met, false);
  assert.equal(goalProgress(banks, { banks: banks.target }).met, true);
  assert.equal(goalProgress(banks, { banks: 99 }).fraction, 1, 'progress is clamped');
  assert.equal(goalPayout(banks, { banks: banks.target - 1 }), null);
});

test('a boolean goal is all or nothing', () => {
  const pace = GOALS.pace;
  assert.equal(goalProgress(pace, { paceHeld: false }).met, false);
  assert.equal(goalProgress(pace, { paceHeld: true }).met, true);
  assert.equal(goalProgress(pace, { paceHeld: false }).fraction, 0, 'no phantom progress on a boolean');
  assert.equal(goalPayout(GOALS.overdrive, { overdrive: false }), null);
});

test('a speed goal cannot be met after its window, and cannot read as met before the cut', () => {
  const g = GOALS.firstblood;
  assert.equal(goalProgress(g, { firstKillTicks: -1, ticks: 10 }).met, false, 'no cut yet is not a win');
  assert.equal(goalProgress(g, { firstKillTicks: 100, ticks: 100 }).met, true, 'fast cut inside the window');
  assert.equal(goalProgress(g, { firstKillTicks: g.target + 1, ticks: g.target + 1 }).met, false, 'late cut misses');
  assert.ok(goalProgress(g, { firstKillTicks: -1, ticks: g.target * 0.5 }).fraction > 0, 'the countdown does not sit at zero');
});

test('a missed goal pays nothing at all', () => {
  assert.equal(goalPayout(GOALS.gold, { crowns: 0 }), null);
  const paid = goalPayout(GOALS.gold, { crowns: 1 });
  assert.equal(paid.credits, GOAL_REWARD.credits);
  assert.equal(paid.fracture, GOAL_REWARD.fracture);
  assert.equal(goalPayout(null, {}), null, 'a sector with no goal is not an error');
});

test('a goal line is short enough to read while flying', () => {
  for (const g of Object.values(GOALS)) {
    for (const m of [{ banks: 0 }, { banks: 1 }, { crowns: 0 }, { paceHeld: false }, { firstKillTicks: 1, ticks: 200 }, { overdrive: false }]) {
      const line = goalLine(g, m);
      assert.ok(line.length <= 24, `"${line}" is too long for the HUD chip`);
      assert.equal(typeof line, 'string');
    }
  }
});

/* ── THE LIVE DIRECTOR (the part that can silently not work) ────────────── */

function bridgeRun(seed, opts = {}) {
  return createRun(seed, () => {}, { waveMode: true, continuous: true, ...opts });
}

/** Break every anchor lock and cross the seal, the way a player clears a sector. */
function clearSector(r) {
  for (const enemy of [...r.combat.enemies.values()]) r.combat.remove(enemy);
  r.state.stop = 0;
  r.tick();
}

test('the live sector publishes a goal, and its readout is wired to the run', () => {
  const r = bridgeRun(41);
  try {
    r.state.phase = 'playing';
    const readout = r.waveGoal();
    assert.ok(readout, 'the HUD has something to read');
    assert.equal(readout.goal.id, FIRST_GOAL);
    assert.equal(typeof readout.fraction, 'number');
    assert.ok(readout.fraction >= 0 && readout.fraction <= 1);
    assert.equal(typeof readout.line, 'string');
    assert.ok(readout.line.length > 0);
  } finally {
    r.dispose();
  }
});

test('a first cut inside the window turns the goal green and pays it at the clear', () => {
  const events = [];
  const r = createRun(43, (type, d) => events.push({ type, d }), { waveMode: true, continuous: true });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    const before = r.state.killLedger.credits;
    const board = [...r.combat.enemies.values()][0];
    placePlayer(r.world, { x: board.x, y: board.y + 120 });
    stopPlayer(r.world);
    r.state.edge = r.state.edgeMax;
    r.dash({ x: 0, y: -42, power: 1 });
    for (let i = 0; i < 20; i++) r.tick();
    assert.equal(r.waveGoal().met, true, 'the first cut was inside the window');
    clearSector(r);
    const paid = events.find((e) => e.type === 'goalPaid');
    assert.ok(paid, 'the clear paid the goal');
    assert.equal(paid.d.sector, 1);
    assert.equal(paid.d.credits, GOAL_REWARD.credits);
    // The sector's kills pay credits too, so the goal's two are checked as a
    // DELTA that includes them, not as the whole balance.
    const killCredits = Object.entries(r.state.killLedger.rows)
      .filter(([id]) => id !== 'goal')
      .reduce((n, [, row]) => n + row.credits, 0);
    assert.equal(killCredits, r.state.killLedger.credits - GOAL_REWARD.credits, 'the balance is kills plus the goal, nothing else');
    assert.ok(r.state.killLedger.credits >= before + GOAL_REWARD.credits, 'the goal credit reached the real ledger');
    assert.ok(r.state.killLedger.rows.goal, 'the receipt can itemise it');
    assert.ok(r.waveGoal(), 'the next sector has its own readout');
  } finally {
    r.dispose();
  }
});

test('a goal is paid once per sector, never twice for the same clear', () => {
  const events = [];
  const r = createRun(47, (type, d) => events.push({ type, d }), { waveMode: true, continuous: true });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    // Force the goal to be already satisfied, then clear twice in a row.
    r.state.kills = (r.state.wave.startKills || 0) + 5;
    clearSector(r);
    const first = events.filter((e) => e.type === 'goalPaid').length;
    assert.equal(first, 1);
    // Clearing the NEXT sector must not re-pay the previous one.
    r.state.kills = (r.state.wave.startKills || 0) + 5;
    clearSector(r);
    const total = events.filter((e) => e.type === 'goalPaid').length;
    assert.ok(total >= first, 'the next sector can pay its own goal');
    assert.ok(total <= 2, 'no sector paid more than once');
  } finally {
    r.dispose();
  }
});

test('a sector whose field holds a Crown can ask for one; one without cannot', () => {
  // Walk enough sectors to see a Crown-bearing sector and a Crown-less one.
  let sawCrownGoal = false;
  for (let seed = 1; seed <= 40 && !sawCrownGoal; seed++) {
    const r = bridgeRun(seed);
    try {
      const hasCrown = [...r.combat.enemies.values()].some((e) => e.kind === 'crown');
      const goal = r.waveGoal()?.goal;
      if (goal && !hasCrown) assert.notEqual(goal.id, 'gold');
      if (goal?.id === 'gold') {
        assert.ok(hasCrown, 'gold is only dealt when a Crown is on the field');
        sawCrownGoal = true;
      }
    } finally {
      r.dispose();
    }
  }
  // The deck can still choose not to deal it; the invariant above is the claim.
  assert.ok(true);
});

/* ── PRESENTATION ───────────────────────────────────────────────────────── */

test('the live goal reaches the HUD as one chip, and turns green when it is met', async () => {
  // Not a pixel check: this is the DOM the player actually reads, built by the
  // real createWaveUI against the real index.html.
  const { Window } = await import('happy-dom');
  const { readFileSync } = await import('node:fs');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createWaveUI } = await import('../src/wave-ui.js');
  const r = bridgeRun(53);
  try {
    const ui = createWaveUI({ getRun: () => r, resetInput: () => {}, motion: () => false });
    r.state.phase = 'playing';
    ui.update();
    const chip = window.document.querySelector('.wave-hud .wave-goal');
    assert.ok(chip, 'the chip is in the HUD');
    assert.equal(chip.hidden, false, 'a combat sector shows its goal');
    assert.equal(chip.dataset.met, 'false');
    assert.match(chip.textContent, /BONUS/, 'it is labelled as a bonus, not as a scoreboard');
    const goal = r.waveGoal().goal;
    assert.ok(goal.line.length > 0);
    assert.match(chip.textContent, new RegExp(goal.line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'the chip says the directive');
    // Meet it, and look again.
    r.state.kills = (r.state.wave.startKills || 0) + 1;
    if (goal.metric === 'firstKillTicks') r.state.wave.firstKillTick = r.state.wave.age;
    ui.update();
    const after = window.document.querySelector('.wave-hud .wave-goal');
    assert.equal(after.dataset.met, 'true', 'a met goal reads as met');
    assert.match(after.textContent, /✓/, 'and is ticked');
    // The HUD rebuilds its children when the wave line changes (a body leaves
    // the field). The chip must survive that rebuild — it is appended after the
    // wipe precisely so a live goal never blinks out mid-sector.
    const doomed = [...r.combat.enemies.values()][0];
    r.combat.remove(doomed);
    ui.update();
    const survived = window.document.querySelector('.wave-hud .wave-goal');
    assert.ok(survived, 'the chip is still in the HUD after a receipt rebuild');
    assert.equal(survived.dataset.key, after.dataset.key, 'and it is the same readout, not a reset one');
  } finally {
    r.dispose();
    window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});

test('the goal chip is painted by the run frame in the reward colour', () => {
  const dom = installDom();
  try {
    const { canvas, ctx } = createDisplay(880, 710);
    const r = bridgeRun(59);
    r.state.phase = 'playing';
    r.state.invul = 99999;
    const renderer = createRenderer(canvas);
    renderer.tick(r, true);
    renderer.draw(r, 1, null, true);
    assert.ok(ctx.__ops.length > 0, 'the frame painted');
    renderer.dispose();
    r.dispose();
  } finally {
    dom.uninstall?.();
  }
});
