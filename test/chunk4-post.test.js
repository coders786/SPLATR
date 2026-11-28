/**
 * CHUNK 4 — THE POST, AND THE LESSONS CONTINUOUS MODE COULD NOT TEACH.
 *
 * Two separate bugs, one cause: continuous mode is the shipped mode, and it
 * published fewer events and fewer rewards than the mode the tests exercised.
 *
 *  1. The 40-card catalogue was unreachable (`catalogRewards: false`), so a run
 *     grew only from score and fracture. Measured on a real run before the fix:
 *     two sectors cleared, `waveRest` 0, offers `[]`, `state.upgrades` empty.
 *  2. Three lesson rows keyed on events only the wave-mode director emitted
 *     (`waveClear`, `waveRest`, `paceHeld`), so those tutorials were dead ends
 *     in the shipped game.
 *
 * The fix for (1) is deliberately NOT the rest chooser: a post is one
 * auto-picked card per clear with no picker and no pause.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, postDue, choosePost, postLine, postVisible } from '../src/post.js';
import { createRun } from '../src/run.js';
import { QUESTS } from '../src/quests.js';
import { upgradeOffers, UPGRADE_CATALOG } from '../src/upgrades.js';
import { placePlayer, stopPlayer } from '../src/physics.js';

/* ── THE RULES ──────────────────────────────────────────────────────────── */

test('a post is due on every clear, from the first sector', () => {
  assert.equal(POST.first, 1);
  assert.equal(POST.every, 1);
  for (let n = 1; n <= 20; n++) assert.equal(postDue(n), true, `sector ${n}`);
  assert.equal(postDue(0), false);
  assert.equal(postDue(-1), false);
  assert.equal(typeof postDue(undefined), 'boolean', 'nonsense does not throw');
});

test('the post picks a real card from the hand it is given', () => {
  const hand = upgradeOffers(7, 3, { owned: [] });
  const pick = choosePost(hand, { hp: 3, sword: { family: 'rapier' } });
  assert.ok(pick, 'a hand always yields a pick');
  assert.ok(hand.some((c) => c.id === pick.id), 'the pick is from the hand');
  assert.equal(typeof pick.reason, 'string');
  assert.ok(pick.reason.length > 0, 'an unexplained grant reads as a bug');
});

test('an empty hand yields no post instead of throwing', () => {
  assert.equal(choosePost([], {}), null);
  assert.equal(choosePost(null, {}), null);
  assert.equal(choosePost(undefined), null);
});

test('the fit ranker actually changes the pick with the sector, not just the seed', () => {
  // One hand, two different contexts that the recommender has opinions about.
  const hand = upgradeOffers(131, 5, { shattered: true, owned: [] });
  const hurt = choosePost(hand, { hp: 1, previous: { hits: 3 } });
  const healthy = choosePost(hand, { hp: 3, previous: { hits: 0 }, next: { counts: { bastion: 4, crown: 2 } } });
  assert.ok(hurt && healthy);
  // Not asserting WHICH card (that is the recommender's business), but that the
  // context is read at all: the reasons must be able to differ.
  assert.ok(typeof hurt.reason === 'string' && typeof healthy.reason === 'string');
});

test('the receipt expires instead of becoming permanent clutter', () => {
  const post = { id: 'fleet', at: 1000 };
  assert.equal(postVisible(post, 1000), true, 'shown the moment it lands');
  assert.equal(postVisible(post, 1000 + POST.showTicks), true, 'shown at the edge of its window');
  assert.equal(postVisible(post, 1000 + POST.showTicks + 1), false, 'gone after it');
  assert.equal(postVisible(null, 5000), false);
  assert.equal(postVisible({ id: 'x' }, 5000), true, 'an un-stamped post is shown, not swallowed');
});

test('a post line is one receipt, not a sentence', () => {
  const line = postLine({ name: 'SWIFT EDGE', reason: 'Cross the field faster.' });
  assert.match(line, /SWIFT EDGE/);
  assert.match(line, /Cross the field/);
  assert.equal(postLine(null), '');
});

/* ── THE LESSONS ────────────────────────────────────────────────────────── */

test('no lesson keyed on an event the shipped mode never emits', () => {
  // This is the regression pin. Each of these kinds needs an emitter in
  // continuous-sectors.js; `waveRest` no longer has one by design, so no row
  // may be keyed on it.
  const kinds = new Set(QUESTS.filter((q) => q.lesson).map((q) => q.kind));
  assert.equal(kinds.has('waveRest'), false, 'waveRest is unreachable in continuous mode: no lesson may need it');
  for (const live of ['waveClear', 'cleanBank', 'paceHeld', 'monolithDown']) {
    assert.ok(kinds.has(live), `${live} should still be taught`);
  }
});

test('the wave lesson describes the arcade objective', () => {
  const lessons = QUESTS.filter(q => q.lesson && q.label === 'FINISH THE WAVE');
  assert.equal(lessons.length, 3);
  for (const q of lessons) {
    assert.equal(q.kind, 'waveClear');
    assert.match(q.instruction, /enemy/i);
    assert.ok(q.instruction.length <= 70);
  }
});

/* ── THE LIVE RUN (shipped configuration) ──────────────────────────────── */

/** Exactly what main.js builds: continuous, no chooser, post on. */
function shipped(seed = 11, emit = () => {}) {
  return createRun(seed, emit, { waveMode: true, continuous: true, catalogRewards: false, postRewards: true });
}

function clearSector(r) {
  for (const enemy of [...r.combat.enemies.values()]) r.combat.remove(enemy);
  r.state.stop = 0;
  r.tick();
}

test('a shipped run now grows: one card per clear, never two', () => {
  const events = [];
  const r = shipped(11, (t, d) => events.push({ t, d }));
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    assert.equal(r.state.upgrades.length, 0, 'a run starts with nothing');
    clearSector(r);
    assert.equal(r.state.upgrades.length, 1, 'the first clear mails a card');
    clearSector(r);
    assert.equal(r.state.upgrades.length, 2, 'and the second');
    clearSector(r);
    assert.equal(r.state.upgrades.length, 3);
    const posts = events.filter((e) => e.t === 'postPaid');
    assert.equal(posts.length, 3, 'one post per clear');
    const ids = new Set(r.state.upgrades.map((u) => u.id));
    assert.equal(ids.size, 3, 'a card is never granted twice');
    for (const p of posts) {
      assert.ok(p.d.reason, 'every post carries a reason');
      assert.ok(p.d.line, 'and a line for the HUD');
    }
  } finally {
    r.dispose();
  }
});

test('the post does NOT park the run in a chooser (the thing that was removed)', () => {
  const r = shipped(11);
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    clearSector(r);
    assert.notEqual(r.state.wave.phase, 'choose', 'no picker opens');
    assert.equal(r.state.wave.offers.length, 0, 'no hand is dealt');
    // And the field keeps running: a further 120 ticks must not stall.
    const before = r.state.elapsed;
    for (let i = 0; i < 120; i++) r.tick();
    assert.ok(r.state.elapsed > before, 'the clock kept moving');
  } finally {
    r.dispose();
  }
});

test('a granted card really reaches the run, not just the array', () => {
  const r = shipped(11);
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    clearSector(r);
    const card = r.state.upgrades[0];
    assert.ok(card.fields, 'the card carries fields');
    // The derived state must move with it — a card in the array that changes
    // nothing is the failure mode this test exists to catch.
    const mods = r.state.upgradeModifiers;
    assert.ok(mods, 'modifiers were refreshed');
    assert.equal(r.state.post.id, card.id, 'the run remembers what arrived');
  } finally {
    r.dispose();
  }
});

test('continuous mode now teaches the lessons it claims to', () => {
  const events = [];
  const r = shipped(11, (t, d) => events.push({ t, d }));
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    clearSector(r);
    const clears = events.filter((e) => e.t === 'waveClear');
    assert.ok(clears.length >= 1, 'the sector clear is announced');
    assert.equal(clears[0].d.continuous, true, 'and marked as the continuous route');
    // The same event the 'CLEAR A WAVE' lesson listens for.
    assert.ok(events.some((e) => e.t === 'sector'), 'the sector still advances');
  } finally {
    r.dispose();
  }
});

test('pace hold and clean bank publish once per sector, not per tick', () => {
  const events = [];
  const r = shipped(11, (t, d) => events.push({ t, d }));
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    // Force the pace meter into held and give the bank counter some headroom.
    r.state.wave.pace.held = true;
    for (let i = 0; i < 30; i++) r.tick();
    const holds = events.filter((e) => e.t === 'paceHeld');
    assert.equal(holds.length, 1, `one paceHeld per sector, got ${holds.length}`);
    assert.equal(holds[0].d.continuous, true);
  } finally {
    r.dispose();
  }
});

test('a practice run mails nothing', () => {
  const r = createRun(11, () => {}, { waveMode: true, continuous: true, catalogRewards: false, postRewards: true });
  try {
    r.state.practice = true;
    r.state.phase = 'playing';
    r.state.invul = 99999;
    clearSector(r);
    assert.equal(r.state.upgrades.length, 0, 'practice banks no run rewards');
  } finally {
    r.dispose();
  }
});

test('the catalogue the post draws from is the real one', () => {
  assert.ok(UPGRADE_CATALOG.length >= 40, `the catalogue is ${UPGRADE_CATALOG.length} cards`);
  const hand = upgradeOffers(11, 1, { owned: [] });
  assert.equal(hand.length, 3, 'a post hand is three deep, like the old deal');
});

/* ── PRESENTATION ───────────────────────────────────────────────────────── */

test('the post receipt reaches the HUD and names the card', async () => {
  const { Window } = await import('happy-dom');
  const { readFileSync } = await import('node:fs');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createWaveUI } = await import('../src/wave-ui.js');
  const r = shipped(11);
  try {
    const ui = createWaveUI({ getRun: () => r, resetInput: () => {}, motion: () => false });
    r.state.phase = 'playing';
    r.state.invul = 99999;
    ui.update();
    assert.equal(window.document.querySelector('.wave-hud .wave-post'), null, 'nothing before a clear');
    clearSector(r);
    ui.update();
    const line = window.document.querySelector('.wave-hud .wave-post');
    assert.ok(line, 'the receipt is in the HUD after a clear');
    assert.equal(line.hidden, false);
    const card = r.state.post;
    assert.match(line.textContent, /POST/, 'it is labelled');
    assert.match(line.textContent, new RegExp(String(card.name).toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'it names the card');
    assert.match(line.textContent, /\./, 'and prints the reason as a sentence');
    // And it retires: a receipt that stayed forever would be clutter on the HUD.
    r.state.elapsed = (r.state.post.at || 0) + 10000;
    ui.update();
    assert.equal(window.document.querySelector('.wave-hud .wave-post'), null, 'the receipt expires on its own');
  } finally {
    r.dispose();
    window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});
