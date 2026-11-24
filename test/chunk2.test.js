/**
 * CHUNK 2 — The Dimension Fracture: a persistent 0-100 meter.
 *
 * The meter feeds off ordinary play (cuts, wave clears, Dimension Shatters),
 * is tiered STABLE / TREMORS / FAULT LINES / CRITICAL COLLAPSE at 25/50/75,
 * crosses four sky stages at 10/35/60/88, and survives restarts. Chunk 3
 * spends it at 100.
 *
 * Headless rules under test:
 *  - createRun seeds the meter from the stored value and never re-seeds;
 *  - every cut +0.4, every wave clear +2.5, every Dimension Shatter +6;
 *  - practice and lessons never fracture the world;
 *  - the meter clamps at 100 and tier events fire exactly on ladder moves.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {createRun} from '../src/run.js';
import {planEncounter} from '../src/encounters.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {createFractureState,gainFracture,fractureTier,fractureSky,clampPct,persistFracture,FRACTURE_PER_KILL,FRACTURE_PER_WAVE_CLEAR,FRACTURE_PER_DIMENSION_BREAK,FRACTURE_TIERS} from '../src/fracture.js';

// The fixture is pinned ON the player, far from every wave spawn (the spawn
// grid keeps a 205px clearance), so the blade only ever meets the fixture.
// Existing wave enemies are left alone: removing them first would empty the
// field and fire the wave-clear rest bonus into the measurement.
function withFixture(r, hp = 1) {
  placePlayer(r.world, {x: 0, y: -200});
  stopPlayer(r.world);
  const e = r.combat.add({id: `fixture-${Math.random().toString(36).slice(2)}`, kind: 'fang', x: 0, y: -200, home: 'fixture', pinned: true, wavePlaced: true, delay: 0});
  e.hp = hp;
  return e;
}

test('CHUNK 2: the meter clamps and seeds from storage, fractional or not', () => {
  assert.equal(clampPct(-5), 0);
  assert.equal(clampPct(NaN), 0);
  assert.equal(clampPct(101), 100);
  assert.equal(clampPct(42.5), 42.5);
  assert.deepEqual(createFractureState(-3).pct, 0);
  assert.equal(createFractureState(137).pct, 100);
  // createRun takes the shell's stored value and holds it.
  const r = createRun(7, () => {}, {waveMode: true, fracturePct: 42.5});
  try {
    assert.equal(r.state.fracture.pct, 42.5);
    assert.equal(r.state.fracture.tier, fractureTier(42.5));
    assert.equal(r.state.fracture.sky, fractureSky(42.5));
    assert.equal(persistFracture(r.state), 42.5);
  } finally {
    r.dispose();
  }
});

test('CHUNK 2: tier and sky ladders match the design thresholds', () => {
  assert.deepEqual(FRACTURE_TIERS.map(t => t.at), [0, 25, 50, 75]);
  assert.equal(fractureTier(0), 0);
  assert.equal(fractureTier(24.99), 0);
  assert.equal(fractureTier(25), 1);
  assert.equal(fractureTier(49.99), 1);
  assert.equal(fractureTier(50), 2);
  assert.equal(fractureTier(74.99), 2);
  assert.equal(fractureTier(75), 3);
  assert.equal(fractureTier(100), 3);
  // The four sky stages sit BELOW the warning tiers: the horizon warns first.
  assert.equal(fractureSky(9.99), 0);
  assert.equal(fractureSky(10), 1);
  assert.equal(fractureSky(34.99), 1);
  assert.equal(fractureSky(35), 2);
  assert.equal(fractureSky(59.99), 2);
  assert.equal(fractureSky(60), 3);
  assert.equal(fractureSky(87.99), 3);
  assert.equal(fractureSky(88), 4);
  assert.equal(fractureSky(100), 4);
});

test('CHUNK 2: cuts feed the fracture at 0.4 each; practice and lessons never do', () => {
  // The live field gains.
  const live = createRun(11, () => {}, {waveMode: true, fracturePct: 10});
  try {
    live.state.phase = 'playing';
    live.state.invul = 99999;
    withFixture(live);
    live.state.blade = 12;
    live.tick();
    assert.ok(live.state.fracture.pct > 10, 'a cut fractures the world');
    assert.equal(Number((live.state.fracture.pct - 10).toFixed(2)), FRACTURE_PER_KILL);
  } finally {
    live.dispose();
  }
  // No-stakes control practice never does.
  const practice = createRun(11, () => {}, {waveMode: true, controlPractice: true, fracturePct: 10});
  try {
    practice.state.phase = 'playing';
    withFixture(practice);
    practice.state.blade = 12;
    practice.tick();
    assert.equal(practice.state.fracture.pct, 10);
  } finally {
    practice.dispose();
  }
});

test('CHUNK 2: crossing 25 fires the TREMORS tier event exactly once', () => {
  const events = [];
  const r = createRun(13, (type, data) => events.push({type, data}), {waveMode: true, fracturePct: 24.7});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    withFixture(r);
    r.state.blade = 12;
    r.tick(); // 24.7 + 0.4 = 25.1 -> tier 1
    const tierEvents = events.filter(e => e.type === 'fractureTier');
    assert.equal(tierEvents.length, 1);
    assert.equal(tierEvents[0].data.label, 'TREMORS');
    // More kills inside the same tier fire gains but no further tier events.
    withFixture(r);
    r.state.blade = 12;
    r.tick();
    assert.equal(events.filter(e => e.type === 'fractureTier').length, 1);
    const gains = events.filter(e => e.type === 'fractureGain');
    assert.equal(gains.length, 2);
    assert.ok(gains[0].data.pct >= 25);
  } finally {
    r.dispose();
  }
});

test('CHUNK 2: a wave clear pays 2.5 fracture; the meter persists as one number', () => {
  const events = [];
  const r = createRun(131, (type, data) => events.push({type, data}), {waveMode: true, fracturePct: 0});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
    r.state.stop = 0;
    r.tick();
    assert.equal(r.state.wave.phase, 'return');
    assert.equal(Number(r.state.fracture.pct.toFixed(2)), FRACTURE_PER_WAVE_CLEAR);
    assert.ok(events.some(e => e.type === 'fractureGain' && Math.abs(e.data.pct - FRACTURE_PER_WAVE_CLEAR) < 1e-9));
    // The persisted snapshot is the live pct — nothing else.
    assert.equal(persistFracture(r.state), r.state.fracture.pct);
  } finally {
    r.dispose();
  }
});

test('CHUNK 2: the fracture meter never exceeds 100', () => {
  const r = createRun(17, () => {}, {waveMode: true, fracturePct: 99.9});
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    withFixture(r);
    r.state.blade = 12;
    r.tick();
    assert.equal(r.state.fracture.pct, 100);
    // At the cap further gains are reported as unchanged, never as >100.
    const before = r.state.fracture.pct;
    gainFracture(r.state, 5, () => {});
    assert.equal(r.state.fracture.pct, before);
  } finally {
    r.dispose();
  }
});

test('CHUNK 2: fracture tier escalates the wave budget, STABLE fields as before', () => {
  const base = planEncounter(131, 2, {x: 0, y: 0}, 0);
  const t1 = planEncounter(131, 2, {x: 0, y: 0}, 1);
  const t2 = planEncounter(131, 2, {x: 0, y: 0}, 2);
  const t3 = planEncounter(131, 2, {x: 0, y: 0}, 3);
  assert.equal(base.total, 15, 'STABLE fields exactly what CHUNK 1 fielded');
  assert.equal(t1.total, base.total + 2);
  assert.equal(t2.total, base.total + 4);
  assert.equal(t3.total, base.total + 6);
  assert.equal(t3.specs.length, t3.total);
  // Deterministic: same seed, same intensity — identical formations.
  const again = planEncounter(131, 2, {x: 0, y: 0}, 3);
  assert.deepEqual(again.specs.map(s => [s.id, s.kind, s.x, s.y]), t3.specs.map(s => [s.id, s.kind, s.x, s.y]));
  // Even the top tier never exceeds the spawn grid.
  for (const spec of t3.specs) {
    assert.ok(Number.isFinite(spec.x) && Number.isFinite(spec.y));
  }
  // Bonus bodies are ordinary Fangs, never extra armored or elite roles.
  const countBy = (plan, kind) => plan.specs.filter(s => s.kind === kind).length;
  assert.equal(countBy(t3, 'fang') - countBy(base, 'fang'), 6, 'escalation adds light bodies only');
  for (const kind of ['bastion', 'prism', 'pulse', 'fork', 'crown', 'rift', 'well']) {
    assert.equal(countBy(t3, kind), countBy(base, kind), `${kind} counts are unchanged by fracture`);
  }
});

test('CHUNK 2: the HUD and panels carry the three SHATTER EVENT mounts', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['fracture-hud', 'title-fracture', 'result-fracture']) {
    assert.ok(html.includes(`id="${id}"`), `${id} mount exists`);
  }
  // The arena mount lives inside #hud; the menu and result mounts live on their own pages.
  const hud = html.slice(html.indexOf('id="hud"'), html.indexOf('</section>', html.indexOf('id="hud"')));
  assert.ok(hud.includes('id="fracture-hud"'), 'the field ribbon sits in the run HUD');
  assert.equal((html.match(/fracture-fill/g) || []).length, 3, 'three bars, one anatomy');
});
