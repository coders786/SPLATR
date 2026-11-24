/**
 * CHUNK 6C — THE REWARD.
 *
 * The reward slice keeps the existing wave-mode cadence, expands the hand to
 * the forty-card catalogue, and leaves continuous mode chooser-free.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { placePlayer, stopPlayer } from '../src/physics.js';
import {
  UPGRADE_CATALOG,
  UPGRADE_TRACKS,
  UPGRADE_TIERS,
  upgradeOffers,
  upgradePresentation,
  parseUpgradeCost,
} from '../src/upgrades.js';

function clearWave(run) {
  for (const enemy of [...run.combat.enemies.values()]) run.combat.remove(enemy);
  run.state.stop = 0;
  run.tick();
}
function landRest(run) {
  const q = run.state.wave.platform;
  placePlayer(run.world, { x: q.x + q.w / 2, y: q.y - 23 });
  stopPlayer(run.world);
  for (let i = 0; i < 30 && run.state.wave.phase !== 'choose'; i++) {
    run.state.stop = 0;
    run.tick();
  }
}

test('CHUNK 6C: the catalogue is exactly five tracks of eight, with unique ids and parseable trade-offs', () => {
  assert.equal(UPGRADE_CATALOG.length, 40);
  assert.equal(new Set(UPGRADE_CATALOG.map(x => x.id)).size, 40);
  assert.deepEqual(new Set(UPGRADE_CATALOG.map(x => x.track)), new Set(UPGRADE_TRACKS));
  for (const track of UPGRADE_TRACKS) assert.equal(UPGRADE_CATALOG.filter(x => x.track === track).length, 8, track);
  for (const card of UPGRADE_CATALOG) {
    assert.ok(UPGRADE_TIERS[card.tier], `${card.id} tier`);
    assert.ok(card.comparisons.length, `${card.id} has a before/after bar`);
    assert.equal(parseUpgradeCost(card.cost).text, card.cost || '—');
    for (const bar of card.comparisons) {
      assert.ok(Number.isFinite(bar.before));
      assert.ok(Number.isFinite(bar.after));
      assert.ok(Number.isFinite(bar.min) && Number.isFinite(bar.max) && bar.max > bar.min);
      assert.ok(bar.unit);
    }
  }
});

test('CHUNK 6C: D cards are absent before the first Shatter and can enter the post-Shatter pool', () => {
  for (let seed = 0; seed < 40; seed++) {
    for (let wave = 1; wave <= 10; wave++) {
      assert.equal(upgradeOffers(seed, wave).some(x => x.tier === 'D'), false);
    }
  }
  let found = false;
  for (let seed = 0; seed < 200 && !found; seed++) {
    for (let wave = 1; wave <= 10 && !found; wave++) found = upgradeOffers(seed, wave, { shattered: true }).some(x => x.tier === 'D');
  }
  assert.equal(found, true, 'the gated pool is not a dead pool');
  const owned = upgradeOffers(7, 1, { shattered: true }).map(x => x.id);
  assert.equal(upgradeOffers(7, 1, { shattered: true, owned }).some(x => owned.includes(x.id)), false);
});

test('CHUNK 6C: presentation derives honest bars from the same numbers the card applies', () => {
  const fleet = UPGRADE_CATALOG.find(x => x.id === 'fleet');
  const copy = upgradePresentation(fleet, { speed: 45 });
  assert.equal(copy.comparisons[0].before, 45);
  assert.ok(Math.abs(copy.comparisons[0].after - 45 * (48 / 42)) < 1e-9);
  assert.match(copy.stat, /45 px\/tick/);
  assert.match(copy.stat, /→/);
  assert.equal(upgradePresentation('not-a-card'), null);
  assert.equal(parseUpgradeCost('SHORT BLADE').lane, 'handling');
  assert.equal(parseUpgradeCost('').text, '—');
});

test('CHUNK 6C: the catalogue owns one persistent card per rest, and continuous mode deals after its landing beat', () => {
  const run = createRun(131, () => {}, { waveMode: true, catalogRewards: true });
  try {
    run.state.phase = 'playing';
    run.state.invul = 99999;
    clearWave(run);
    landRest(run);
    assert.equal(run.state.wave.phase, 'choose');
    const card = run.state.wave.offers.find(x => x.fields);
    assert.ok(card, 'the 6C deck is dealt in wave mode');
    assert.equal(run.chooseWaveBuff(card.id), true);
    assert.deepEqual(run.state.upgrades.map(x => x.id), [card.id]);
    assert.equal(run.state.waveBuff.id, card.id);
    assert.equal(run.chooseWaveBuff(card.id), false, 'a deal cannot be picked twice');
    clearWave(run);
    assert.equal(run.state.waveBuff, null, 'the compatibility slot expires at the deck');
    assert.deepEqual(run.state.upgrades.map(x => x.id), [card.id], 'the run-owned card survives the deck');
    landRest(run);
    assert.equal(run.state.wave.phase, 'choose');
    assert.equal(run.state.wave.offers.some(x => x.id === card.id), false, 'owned cards are not dealt again');
  } finally { run.dispose(); }

  const continuous = createRun(131, () => {}, { waveMode: true, continuous: true, catalogRewards: true });
  try {
    continuous.state.phase = 'playing';
    assert.notEqual(continuous.state.wave.phase, 'choose');
    continuous.state.narrative.rest = { sector: 1, age: 0, ticks: 30 };
    continuous.state.wave.entry = 30;
    for (let i = 0; i < 31; i++) { continuous.state.stop = 0; continuous.tick(); }
    assert.equal(continuous.state.wave.phase, 'choose', 'continuous mode opens the sector rest deal');
    assert.equal(continuous.state.wave.offers.length, 3);
    const card = continuous.state.wave.offers[0];
    assert.equal(continuous.chooseWaveBuff(card.id), true);
    assert.equal(continuous.state.wave.phase, 'combat');
    assert.deepEqual(continuous.state.upgrades.map(x => x.id), [card.id]);
  } finally { continuous.dispose(); }

  const ordinary = createRun(131, () => {}, { waveMode: true, continuous: true });
  try {
    ordinary.state.phase = 'playing';
    ordinary.state.narrative.rest = { sector: 1, age: 0, ticks: 30 };
    ordinary.state.wave.entry = 30;
    for (let i = 0; i < 31; i++) { ordinary.state.stop = 0; ordinary.tick(); }
    assert.notEqual(ordinary.state.wave.phase, 'choose', 'normal continuous play stays on the 6B path');
    assert.equal(ordinary.state.wave.offers.length, 0);
    assert.equal(ordinary.chooseWaveBuff('fleet'), false, 'the catalog remains opt-in');
  } finally { ordinary.dispose(); }
});
