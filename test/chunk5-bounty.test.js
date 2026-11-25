/**
 * CHUNK 5 — THE BOUNTY BOARD.
 *
 * The complaint was that the quest system was "the worst I have ever seen":
 * three grey boxes, a goal number, and the word ACTIVE. The diagnosis was that
 * the board asked for work and HID THE PAY — the entire prize row lived inside
 * `<details><summary>Optional rewards</summary>`, under a switch already
 * labelled GUIDED QUESTS ON, and a lesson paid 3 credits against a 100-credit
 * hat.
 *
 * These tests pin the three things that changed, in order of how badly they
 * were broken:
 *   1. the reward is ON the board (not behind a disclosure);
 *   2. every contract says what it pays, and the ladder is affordable;
 *   3. something outlives a single run (the streak).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANES, boardSummary, streakHolds, LESSON_POINTS, PARTS, POINTS, QUESTS, loadProfile } from '../src/quests.js';

/* ── THE RULES ──────────────────────────────────────────────────────────── */

test('the three lanes are promises, not a taxonomy', () => {
  assert.equal(LANES.length, 3);
  assert.deepEqual(LANES.map((l) => l.id), ['SMASH', 'STYLE', 'CLIMB']);
  for (const lane of LANES) {
    // "AIM & TARGETS" told a new player nothing. A lane has to survive being
    // read by someone who has never played this game.
    assert.ok(lane.promise.length > 0 && lane.promise.length <= 22, `${lane.id} promise: "${lane.promise}"`);
    assert.doesNotMatch(lane.name, /&/, 'no taxonomy conjunctions');
    assert.ok(lane.detail.length > 20, 'each lane explains itself');
  }
  // The promises must be three different things to do, not three rewordings.
  assert.equal(new Set(LANES.map((l) => l.promise)).size, 3);
});

test('every lane promise is a verb phrase a player can act on', () => {
  for (const lane of LANES) {
    assert.match(lane.promise, /^[A-Z][a-z]+ /, `"${lane.promise}" should read as an instruction`);
  }
});

test('a board summary states both the progress and the money', () => {
  const rows = [{ points: 30, done: true }, { points: 30, done: false }, { points: 30, done: false }];
  const s = boardSummary({ rows });
  assert.equal(s.points, 90);
  assert.equal(s.done, 1);
  assert.equal(s.total, 3);
  assert.equal(s.complete, false);
  assert.match(s.line, /1\/3/);
  assert.match(s.line, /90/);
});

test('a cleared board says so, and repeats a doubled all-hard bonus', () => {
  const rows = [{ points: 60, done: true }, { points: 60, done: true }, { points: 60, done: true }];
  const s = boardSummary({ rows, bonus: true, streak: 4 });
  assert.equal(s.points, 360, 'the all-hard multiplier still applies');
  assert.equal(s.complete, true);
  assert.match(s.line, /CLEARED/);
  assert.match(s.line, /4 IN A ROW/);
});

test('nonsense ticket shapes do not crash the summary', () => {
  for (const bad of [{}, { rows: null }, { rows: [] }, undefined, { rows: [null, {}] }]) {
    const s = boardSummary(bad);
    assert.equal(typeof s.line, 'string');
    assert.equal(s.complete, false);
  }
});

test('the streak only holds for a FULL board', () => {
  assert.equal(streakHolds({ rows: [{ done: true }, { done: true }, { done: true }] }), true);
  assert.equal(streakHolds({ rows: [{ done: true }, { done: true }, { done: false }] }), false, 'two of three is not a run');
  assert.equal(streakHolds({ rows: [] }), false, 'an empty board cannot protect a streak');
  assert.equal(streakHolds({}), false);
});

test('a profile carries the streak across runs, and old saves load at zero', () => {
  const fresh = loadProfile('{}');
  assert.equal(fresh.streak, 0);
  assert.equal(fresh.bestStreak, 0);
  const saved = loadProfile(JSON.stringify({ streak: 4, bestStreak: 9 }));
  assert.equal(saved.streak, 4);
  assert.equal(saved.bestStreak, 9);
  // bestStreak can never be below the current streak, however corrupt the save.
  const corrupt = loadProfile(JSON.stringify({ streak: 9, bestStreak: 2 }));
  assert.equal(corrupt.bestStreak, 9);
});

/* ── THE MONEY ──────────────────────────────────────────────────────────── */

test('a lesson pays enough to matter', () => {
  const lesson = QUESTS.find((q) => q.lesson);
  assert.equal(lesson.points, LESSON_POINTS);
  assert.ok(LESSON_POINTS >= 25, 'it was 3 against a 100-credit hat');
});

test('the whole learning ladder pays for the first cosmetic', () => {
  const lessons = QUESTS.filter((q) => q.lesson);
  // Nine lessons, three per board; a new player plays three boards.
  const boards = lessons.length / 3;
  const firstCosmetic = Math.min(...PARTS.map((p) => p.cost));
  assert.ok(boards * 3 * LESSON_POINTS >= firstCosmetic * 2, `the ladder earns ${boards * 3 * LESSON_POINTS} against a ${firstCosmetic} hat`);
});

test('no cosmetic costs more than the ladder can earn', () => {
  const lessons = QUESTS.filter((q) => q.lesson);
  const ladder = lessons.length * LESSON_POINTS;
  for (const part of PARTS) {
    assert.ok(part.cost <= ladder, `${part.label} (${part.cost}) is beyond the whole tutorial (${ladder})`);
  }
});

test('practice still never out-pays a real contract', () => {
  assert.ok(LESSON_POINTS < POINTS[2], 'mastery contracts must still be the best pay');
});

/* ── THE BOARD ITSELF (the screenshot failure) ──────────────────────────── */

test('the board shows the reward on its face, with no disclosure hiding it', async () => {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createQuestUI } = await import('../src/quest-ui.js');
  try {
    const values = new Map();
    createQuestUI({
      getRun: () => null,
      storage: { get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v) },
      audio: { lock() {}, zone() {} },
      resetInput: () => {},
      home: () => {},
      resume() {},
      view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
    });
    const doc = window.document;
    // 1. The reward is not folded away. This is the exact bug: it used to be
    //    <details class="lesson-rewards"><summary>Optional rewards</summary>.
    const folds = doc.querySelectorAll('details');
    for (const fold of folds) {
      assert.doesNotMatch(fold.textContent.toLowerCase(), /optional rewards/, 'the reward must not be behind a fold');
    }
    // 2. Every contract states its payout.
    const cards = [...doc.querySelectorAll('.bounty-card')];
    assert.equal(cards.length, 3, 'one contract per lane');
    for (const card of cards) {
      const pay = card.querySelector('.bounty-pay');
      assert.ok(pay, 'every card carries its payout');
      assert.match(pay.textContent, /^\+\d+$/, `payout reads as money: "${pay.textContent}"`);
      assert.ok(Number(pay.textContent.slice(1)) > 0);
      // 3. Every card says HOW, not just what.
      assert.ok(card.querySelector('.bounty-how')?.textContent.length > 20, 'the card explains how to earn it');
    }
    // 4. The ladder is present and priced.
    const prizes = [...doc.querySelectorAll('.bounty-prize-row .prize-option')];
    assert.equal(prizes.length, PARTS.length);
    for (const prize of prizes) assert.match(prize.textContent, /◈\s*\d+|OWNED/);
    // 5. The lanes are named as promises.
    const promises = [...doc.querySelectorAll('.bounty-promise')].map((n) => n.textContent);
    assert.equal(promises.length, 3);
    window.happyDOM.abort();
  } finally {
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});

test('a streak is shown on the board once there is one', async () => {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const { createQuestUI } = await import('../src/quest-ui.js');
  try {
    const values = new Map([['quests', JSON.stringify({ streak: 3, bestStreak: 5, coins: 40 })]]);
    createQuestUI({
      getRun: () => null,
      storage: { get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v) },
      audio: { lock() {}, zone() {} },
      resetInput: () => {},
      home: () => {},
      resume() {},
      view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
    });
    const streak = window.document.querySelector('.bounty-streak');
    assert.ok(streak, 'the streak is on the board');
    assert.match(streak.textContent, /STREAK 3/);
    assert.match(streak.textContent, /every contract/i, 'and says how to keep it');
    window.happyDOM.abort();
  } finally {
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});

test('the board does not re-title the lanes with the old taxonomy', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../src/quest-ui.js', import.meta.url), 'utf8');
  // These strings were the visible column headings.
  for (const dead of ['AIM & TARGETS', 'CUT TECHNIQUE', 'WAVE RHYTHM']) {
    assert.equal(ui.includes(dead), false, `"${dead}" still present in the UI source`);
  }
  assert.match(css, /\.bounty-card/, 'the board has its own styling');
});
