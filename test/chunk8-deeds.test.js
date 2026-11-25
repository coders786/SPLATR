/**
 * CHUNK 8 — THE DEED BOOK: 120 quests that each have a reason.
 *
 * The board these replace was fifteen commissions of "slice N things", dealt
 * three at a time, and the player could not have told you why any one of them
 * existed. These tests hold the three properties that make the new book a
 * different thing:
 *
 *   1. EVERY DEED ARGUES FOR ITSELF. `lead`, `why` and `pays` are required, the
 *      argument has to be an argument (not a restatement of the number), and the
 *      metric has to be one the simulation actually emits.
 *   2. THE BOOK IS A BOOK. 120 unique deeds, 24 per lane, every lane covers all
 *      three tiers and every axis, and no deed is a bigger number of another.
 *   3. THE DEAL TEACHES. Distinct lanes, distinct axes, never a finished deed,
 *      a warm-up board for a new profile, and a lean toward the lanes you are
 *      worst at.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEEDS, DEED_BY_ID, DEED_METRICS, DEED_PAY, LANES, LANE_BY_ID, UNLOCK,
  deedById, deedPool, deedMetrics, deedProgress, deedValue, deedLabel,
  dealDeeds, rerollDeed, boardState, rerollCost, focusLanes, deedUnlocked,
  unlockLine, SWEEP_BONUS, REROLL_COST, FREE_REROLLS, EMPTY_BOARD,
} from '../src/deeds.js';

/* ══ 1. THE BOOK ══════════════════════════════════════════════════════════ */

test('there are exactly 120 deeds, and every id is unique', () => {
  assert.equal(DEEDS.length, 120);
  const ids = new Set(DEEDS.map((d) => d.id));
  assert.equal(ids.size, 120, 'no duplicate ids');
  assert.equal(Object.keys(DEED_BY_ID).length, 120);
});

test('24 deeds per lane, and all five lanes are represented', () => {
  assert.deepEqual(LANES.map((l) => l.id), ['CUT', 'MOTION', 'RHYTHM', 'HUNT', 'DEPTH']);
  for (const lane of LANES) assert.equal(deedPool(lane.id).length, 24, `${lane.id} has 24 deeds`);
});

test('every lane covers all three tiers, and the odd axes exist where they can', () => {
  for (const lane of LANES) {
    const pool = deedPool(lane.id);
    assert.deepEqual([...new Set(pool.map((d) => d.tier))].sort(), [0, 1, 2], `${lane.id} tiers`);
    // `axis` is DERIVED from the metric (deeds.js AXIS_OF), so it can never
    // drift from what the deed asks. Every lane must offer at least two axes,
    // and the book as a whole must exercise all four.
    assert.ok(new Set(pool.map((d) => d.axis)).size >= 2, `${lane.id} axes`);
    for (const deed of pool) assert.ok(['peak', 'streak', 'moment', 'volume'].includes(deed.axis), `${deed.id} axis`);
    // The shape of every lane is 8 warm-ups, 10 skills, 6 performances: the
    // book gets harder as it goes, in that order, in every lane.
    for (const tier of [0, 1, 2]) {
      const want = [8, 10, 6][tier];
      assert.equal(pool.filter((d) => d.tier === tier).length, want, `${lane.id} tier ${tier}`);
    }
  }
  const all = new Set(DEEDS.map((d) => d.axis));
  assert.deepEqual([...all].sort(), ['moment', 'peak', 'streak', 'volume'], 'the book uses all four axes');
});

test('the lanes carry the design colours, and no gold', () => {
  assert.equal(LANE_BY_ID.CUT.accent, '#ff3366');
  assert.equal(LANE_BY_ID.MOTION.accent, '#00f0ff');
  assert.equal(LANE_BY_ID.RHYTHM.accent, '#dfff00');
  for (const lane of LANES) {
    assert.doesNotMatch(lane.accent, /ffcc4d|ffd166|ffd773/i, 'the pastel gold header palette is gone');
    assert.ok(lane.teaches.length > 10, 'every lane says what it teaches');
    assert.ok(lane.belief.length > 10, 'and what it believes');
  }
});

test('a deed pays according to its lane and tier, and a performance beats a warm-up', () => {
  for (const deed of DEEDS) assert.equal(deed.pay, DEED_PAY[deed.lane][deed.tier]);
  for (const lane of LANES) {
    const [warm, skill, performance] = DEED_PAY[lane.id];
    assert.ok(warm < skill && skill < performance, `${lane.id} pays more as it gets harder`);
  }
});

/* ══ 2. THE REASONING — the point of the whole chunk ══════════════════════ */

test('every deed argues for itself: lead, why, pays', () => {
  for (const deed of DEEDS) {
    assert.ok(deed.title.length > 0, `${deed.id} has a title`);
    assert.ok(deed.lead.length > 12, `${deed.id} has a lead`);
    assert.ok(deed.why.length > 80, `${deed.id}: the argument is a real argument`);
    assert.ok(deed.pays.length > 20, `${deed.id} says what the player keeps`);
    assert.match(deed.lead, /\.$/, `${deed.id}: the lead is a sentence`);
    assert.doesNotMatch(deed.lead, /tap a|click |press |pull back/i, `${deed.id} is not a tutorial`);
  }
});

test('the reason argues, it does not restate the number', () => {
  /* A word list here would be a test of my vocabulary, not of the design. The
     property that actually matters is structural: the argument has to be about
     the GAME (longer and more specific than the lead), it cannot open with the
     number, and it cannot be a copy of the instruction it is explaining. */
  for (const deed of DEEDS) {
    assert.ok(deed.why.length > deed.lead.length, `${deed.id}: the argument must be longer than the instruction`);
    assert.ok(deed.why.length >= 120, `${deed.id}: 120 characters is the floor for an argument`);
    assert.doesNotMatch(deed.why.slice(0, 24), new RegExp(`^${deed.target}\\b`), `${deed.id} opens with its own target`);
    assert.notEqual(deed.why, deed.lead, `${deed.id}: the reason cannot be the lead repeated`);
    assert.notEqual(deed.pays, deed.why, `${deed.id}: what you keep is not the reason`);
    // An argument names something in the world: an enemy, a mechanic, a state.
    assert.ok(/[a-z]{4,}/i.test(deed.why));
  }
  // And no two deeds share an argument — that is the tell of a padded book.
  const seen = new Map();
  for (const deed of DEEDS) {
    assert.ok(!seen.has(deed.why), `${deed.id} reuses ${seen.get(deed.why)}'s argument`);
    seen.set(deed.why, deed.id);
  }
});

test('a warm-up is not a harder version of another warm-up in the same lane', () => {
  // The old board's real sin: three kill counts called three quests. Inside one
  // lane, two deeds may share a METRIC (that is how a ladder works) but they may
  // not be the only thing that differs — the lead and the argument must differ.
  for (const lane of LANES) {
    const pool = deedPool(lane.id);
    const seen = new Map();
    for (const deed of pool) {
      const key = `${deed.metric}@${deed.tier}`;
      if (seen.has(key)) {
        assert.notEqual(seen.get(key).lead, deed.lead, `${deed.id} repeats ${seen.get(key).id}'s lead`);
        assert.notEqual(seen.get(key).why, deed.why, `${deed.id} repeats ${seen.get(key).id}'s argument`);
      }
      seen.set(key, deed);
    }
  }
});

test('every metric a deed reads is one the simulation observes', () => {
  // This is the regression pin for the failure that killed the old board: a row
  // keyed on an event the shipped mode never emitted, which could never finish.
  for (const deed of DEEDS) {
    assert.ok(DEED_METRICS[deed.metric], `${deed.id} reads "${deed.metric}" which is not in DEED_METRICS`);
    assert.ok(deed.target > 0, `${deed.id} has a target`);
  }
  // And the table has no dead entries: every documented metric is used.
  const used = new Set(DEEDS.map((d) => d.metric));
  for (const key of Object.keys(DEED_METRICS)) assert.ok(used.has(key), `DEED_METRICS.${key} is unused`);
});

/* ══ 3. THE NUMBERS ═══════════════════════════════════════════════════════ */

const metrics = (run = {}, total = {}) => deedMetrics({ run, total });

test('progress is numeric, clamped, and never NaN', () => {
  const deed = DEED_BY_ID['cut-firstblood']; // kills 3
  assert.deepEqual(deedProgress(deed, metrics({ kills: 2 })), { value: 2, target: 3, fraction: 2 / 3, done: false });
  assert.equal(deedProgress(deed, metrics({ kills: 9 })).fraction, 1, 'the bar never overflows');
  assert.equal(deedValue(deed, metrics({ kills: 9 })), 9, 'but the number tells the truth');
  assert.equal(deedLabel(deed, metrics({ kills: 2 })), '2 / 3');
  for (const bad of [{}, { kills: NaN }, { kills: -4 }, { kills: 'many' }, null]) {
    const p = deedProgress(deed, bad || {});
    assert.equal(Number.isFinite(p.value), true);
    assert.ok(p.value >= 0);
  }
});

test('a clean climb is worth nothing the moment a hit lands', () => {
  const deed = DEED_BY_ID['depth-quiet']; // runClean 3
  assert.equal(deedProgress(deed, metrics({ sector: 4, hits: 0 })).done, true);
  assert.equal(deedProgress(deed, metrics({ sector: 4, hits: 1 })).value, 0, 'one hit voids the climb');
});

test('marks and heights are counted as DISTINCT values, not as a list length', () => {
  assert.equal(metrics({ marks: ['fang', 'fang', 'fang'] }).marks, 1);
  assert.equal(metrics({ marks: ['fang', 'prism', 'fork'] }).marks, 3);
  assert.equal(metrics({ heights: ['top', 'top'] }).heights, 1);
  assert.equal(metrics({ heights: ['top', 'middle', 'bottom'] }).heights, 3);
});

/* ══ 4. THE DEAL ══════════════════════════════════════════════════════════ */

test('a board is three deeds, in three different lanes and three different axes', () => {
  for (let seed = 0; seed < 40; seed++) {
    const grid = dealDeeds({ seed, board: seed % 3, metrics: metrics({ sector: 4 }).valueOf(), progress: { done: 20, lanes: { CUT: 6, MOTION: 5, RHYTHM: 4, HUNT: 3, DEPTH: 2 } } });
    assert.equal(grid.length, 3, `seed ${seed} deals three`);
    assert.equal(new Set(grid.map((d) => d.lane)).size, 3, `seed ${seed}: one deed per lane`);
    assert.equal(new Set(grid.map((d) => d.axis)).size, 3, `seed ${seed}: three different questions`);
  }
});

test('dealing is deterministic per (seed, board)', () => {
  const p = { done: 12, lanes: { CUT: 4, MOTION: 4, RHYTHM: 4 } };
  for (const seed of [1, 7, 99]) {
    const a = dealDeeds({ seed, board: 2, progress: p, metrics: metrics({ sector: 3 }) });
    const b = dealDeeds({ seed, board: 2, progress: p, metrics: metrics({ sector: 3 }) });
    assert.deepEqual(a.map((d) => d.id), b.map((d) => d.id));
  }
});

test('a brand-new profile gets a WARM-UP board, never a performance', () => {
  // This is the bug the book shipped with for one build: the first board a new
  // player ever saw was THE APEX — reach sector 7 with five flawless seals.
  for (let seed = 0; seed < 60; seed++) {
    const grid = dealDeeds({ seed, board: 0, metrics: metrics() });
    assert.equal(grid.length, 3);
    for (const deed of grid) assert.equal(deed.tier, 0, `seed ${seed} dealt ${deed.id} (tier ${deed.tier}) to a new profile`);
  }
});

test('the unlock ladder opens skills, then performances, and never a lane unseen', () => {
  assert.equal(UNLOCK.skill, 2);
  assert.equal(UNLOCK.performance, 6);
  const skill = DEEDS.find((d) => d.tier === 1);
  const perf = DEEDS.find((d) => d.tier === 2);
  assert.equal(deedUnlocked(skill, { done: 0 }), false);
  assert.equal(deedUnlocked(skill, { done: 2 }), true);
  assert.equal(deedUnlocked(perf, { done: 6 }), false, 'six deeds are not enough without the lane');
  assert.equal(deedUnlocked(perf, { done: 6, lanes: { [perf.lane]: 1 } }), true);
  assert.equal(deedUnlocked(perf, { done: 2, lanes: { [perf.lane]: 1 } }), false);
  // A locked deed can say what it is waiting for.
  assert.match(unlockLine(perf, { done: 0 }), /more deeds/);
  assert.equal(unlockLine(perf, { done: 6, lanes: { [perf.lane]: 1 } }), '');
  // And the deal honours it.
  for (let seed = 0; seed < 30; seed++) {
    for (const deed of dealDeeds({ seed, board: 0, metrics: metrics(), progress: { done: 2, lanes: { CUT: 2 } } })) {
      assert.ok(deed.tier <= 1, `${deed.id} skipped the ladder`);
      assert.ok(deedUnlocked(deed, { done: 2, lanes: { CUT: 2 } }), `${deed.id} is not fair to ask yet`);
    }
  }
});

test('a finished deed is never dealt again', () => {
  const all = {
    kills: 999, throughcuts: 999, armor: 999, marks: 99, wideCut: 999, upCut: 999, lowCut: 999, highCut: 999,
    dashes: 999, powerCuts: 999, powerStreak: 99, banks: 999, cleanBanks: 999, bankChain: 99, bankCuts: 999,
    hyper: 99, hyperTicks: 9999, hyperPeak: 9999, hyperApexKills: 9, airTicks: 99999, airKills: 99, floorKicks: 999,
    chain: 99, paceTicks: 99999, doubles: 999, triples: 999, quads: 99, overdrives: 99, fastKills: 999, quietTicks: 99999,
    fang: 999, prism: 999, fork: 999, bastion: 999, crown: 999, bigKill: 999, heirKill: 999, monoliths: 99,
    rescue: 9, speciesPair: 9, sector: 99, seals: 99, flawless: 99, sectorsEntered: 99, monolithSector: 1, apex: 1,
  };
  const totals = { cutsTotal: 9999, dashesTotal: 9999, paceTotal: 99999, seals: 9999, bigKillTotal: 9999, deepRuns3: 99, deepRuns4: 99 };
  const grid = dealDeeds({ seed: 4, board: 3, metrics: metrics(all, totals), progress: { done: 40, lanes: { CUT: 9, MOTION: 8, RHYTHM: 8, HUNT: 8, DEPTH: 7 } } });
  for (const deed of grid) assert.equal(deedProgress(deed, metrics(all, totals)).done, false, `${deed.id} is already finished`);
});

test('a held deed is not dealt again, and `avoid` excludes a rerolled slot', () => {
  const held = dealDeeds({ seed: 2, board: 0, metrics: metrics(), progress: { done: 1 } });
  const again = dealDeeds({ seed: 2, board: 0, open: held.map((d) => d.id), metrics: metrics(), progress: { done: 1 } });
  for (const deed of again) assert.ok(!held.some((h) => h.id === deed.id), `${deed.id} was already on the board`);
  const avoid = held[0].id;
  for (let seed = 0; seed < 30; seed++) {
    const one = rerollDeed({ seed, board: 0, avoid: [avoid], metrics: metrics(), progress: { done: 1 } });
    assert.ok(one && one.id !== avoid, 'a reroll never returns the deed it replaced');
  }
});

test('the board leans toward the lane you finish least often', () => {
  const history = { CUT: { dealt: 10, done: 10 }, MOTION: { dealt: 10, done: 9 }, RHYTHM: { dealt: 10, done: 1 }, HUNT: { dealt: 10, done: 0 }, DEPTH: { dealt: 2, done: 0 } };
  const focus = focusLanes(history, 2);
  assert.equal(focus.length, 2);
  for (const id of focus) assert.ok(['HUNT', 'DEPTH', 'RHYTHM'].includes(id), `${id} is not a weak lane`);
  // An unseen lane is a gap, not an average.
  assert.ok(focusLanes({}, 1).length === 1);
  // And a board dealt with that focus actually contains one.
  const grid = dealDeeds({ seed: 3, board: 1, metrics: metrics({ sector: 2 }), progress: { done: 8, lanes: { CUT: 5, MOTION: 3 } }, focus });
  assert.ok(grid.some((d) => focus.includes(d.lane)), 'the board acted on the focus');
});

test('a board never puts the same axis in two slots', () => {
  for (let seed = 0; seed < 25; seed++) {
    const grid = dealDeeds({ seed, board: 0, metrics: metrics({ sector: 5 }), progress: { done: 30, lanes: { CUT: 6, MOTION: 6, RHYTHM: 6, HUNT: 6, DEPTH: 6 } } });
    assert.equal(new Set(grid.map((d) => d.axis)).size, 3, `seed ${seed}`);
  }
});

/* ══ 5. THE BOARD ═════════════════════════════════════════════════════════ */

const three = () => ['cut', 'motion', 'rhythm'].map((lane) => {
  const d = DEEDS.find((x) => x.lane === lane.toUpperCase() && x.tier === 0);
  return deedById(d.id);
});

test('a board sweeps only when all three are done, and the sweep beats any card', () => {
  const grid = three();
  assert.equal(boardState({ grid, claimed: [] }, metrics()).sweep, false);
  const none = boardState({ grid, claimed: [] }, metrics());
  assert.deepEqual(none.pips, [false, false, false]);
  assert.equal(none.done, 0);

  // Finish all three: their targets maximum, every metric wide open.
  const all = metrics({ kills: 99, highCut: 99, lowCut: 99, wideCut: 99, upCut: 99, doubles: 99, armor: 99, seals: 99, dashes: 99, banks: 99, powerCuts: 99, airTicks: 9999, airKills: 99, floorKicks: 99, bankCuts: 99, paceTicks: 9999, triples: 99, chain: 99, overdrives: 99, fastKills: 99, quietTicks: 9999 });
  const swept = boardState({ grid, claimed: [] }, all);
  assert.equal(swept.sweep, true);
  assert.deepEqual(swept.pips, [true, true, true]);
  assert.equal(swept.owed, grid.reduce((n, d) => n + d.pay, 0));
  const richest = Math.max(...Object.values(DEED_PAY).flat());
  assert.ok(SWEEP_BONUS >= richest, 'clearing the board must beat clearing one card');
});

test('one free reroll, then it costs; the price never compounds', () => {
  assert.equal(FREE_REROLLS, 1);
  assert.equal(rerollCost({ rerolls: 0 }), 0);
  assert.equal(rerollCost({ rerolls: 1 }), REROLL_COST);
  assert.equal(rerollCost({ rerolls: 9 }), REROLL_COST);
  assert.equal(rerollCost(EMPTY_BOARD), 0);
});

test('boardState restores from stored IDS, not from stored objects', () => {
  const grid = ['cut-firstblood', 'rhythm-held', 'depth-sector2'];
  const st = boardState({ grid, claimed: ['cut-firstblood'] }, metrics({ kills: 3, paceTicks: 120, sector: 2 }));
  assert.equal(st.grid.length, 3);
  assert.equal(st.grid[0].pay, DEED_PAY.CUT[0], 'a restored deed still knows its worth');
  assert.equal(st.total, 3);
  assert.equal(st.owed, st.grid[1].pay + st.grid[2].pay, 'a claimed deed is not owed');
});

/* ══ 6. THE BOARD ITSELF (the DOM) ═══════════════════════════════════════ */

async function openBoard({ storage = new Map(), coins } = {}) {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  if (coins != null) storage.set('quests', JSON.stringify({ coins }));
  const { createQuestUI } = await import('../src/quest-ui.js');
  const ui = createQuestUI({
    getRun: () => null,
    storage: { get: (k, d) => storage.get(k) ?? d, set: (k, v) => storage.set(k, v) },
    audio: { lock() {}, zone() {} },
    resetInput: () => {},
    home: () => {},
    resume() {},
    view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
  });
  const doc = window.document;
  doc.querySelector('#quests-btn').click();
  return { window, doc, ui, storage };
}
const close = (window) => {
  window.happyDOM.abort();
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
};

test('the board shows three deeds, each with a lead and a READ WHY', async () => {
  const { window, doc } = await openBoard();
  try {
    const cards = [...doc.querySelectorAll('.deed-card')];
    assert.equal(cards.length, 3);
    for (const card of cards) {
      assert.ok(card.querySelector('.riot-card-title').textContent.length > 0);
      assert.ok(card.querySelector('.deed-lead').textContent.length > 12, 'the lead is on the card');
      assert.ok(card.querySelector('.deed-keeps').textContent.length > 20, 'what you keep is on the card');
      assert.match(card.querySelector('.riot-count').textContent, /^\d+ \/ \d+$/, 'numeric progress');
      assert.ok(card.querySelector('.deed-read'), 'the argument is one tap away');
      assert.ok(card.querySelector('.deed-argument').hidden, 'and folded by default');
      assert.ok(card.querySelector('.deed-worth') || card.querySelector('.deed-claim'), 'the card states its worth');
    }
  } finally {
    close(window);
  }
});

test('READ WHY reveals the argument and the argument is a real one', async () => {
  const { window, doc } = await openBoard();
  try {
    const card = doc.querySelector('.deed-card');
    const read = card.querySelector('.deed-read');
    assert.equal(read.getAttribute('aria-expanded'), 'false');
    read.click();
    const body = card.querySelector('.deed-argument');
    assert.equal(body.hidden, false, 'the argument is revealed');
    assert.equal(read.getAttribute('aria-expanded'), 'true');
    assert.match(body.querySelector('.deed-reason').textContent, /^WHY THIS DEED /);
    assert.ok(body.querySelector('.deed-reason').textContent.length > 90, 'a paragraph, not a fragment');
    assert.match(body.querySelector('.deed-pays').textContent, /^WHAT YOU KEEP /);
    read.click();
    assert.equal(body.hidden, true, 'and it folds back up');
  } finally {
    close(window);
  }
});

test('the three cards are three different lanes, colour-coded, with a legend', async () => {
  const { window, doc } = await openBoard();
  try {
    const cards = [...doc.querySelectorAll('.deed-card')];
    const lanes = cards.map((c) => c.dataset.lane);
    assert.equal(new Set(lanes).size, 3, 'three lanes');
    for (const card of cards) {
      const accent = card.style.getPropertyValue('--accent').trim();
      assert.ok(accent.length === 7 && accent.startsWith('#'), 'each card takes its lane colour');
      assert.ok(card.querySelector('.riot-tag').textContent.startsWith('///'));
      assert.ok(['WARM-UP', 'SKILL', 'PERFORMANCE'].includes(card.querySelector('.deed-tier').textContent));
    }
    // The legend is the explanation of the board, so it names all five lanes.
    assert.equal(doc.querySelectorAll('.deed-lane').length, 5);
    assert.match(doc.querySelector('.riot-title').textContent, /THE DEED BOOK/);
  } finally {
    close(window);
  }
});

test('a claim pays the deed, records it, and spends the free reroll first', async () => {
  /* End to end, the way a player gets there: hold a board, run the events that
     prove one of the deeds, open the board, claim. The claim is only reachable
     because the LEDGER moved — which is the whole loop in one test. */
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const values = new Map();
  const storage = { get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v) };
  // A run shaped like the shell's own object: the fields quest-ui.js reads.
  const run = {
    state: {
      phase: 'playing', opening: null, tutorialActive: false, practice: false,
      kills: 0, score: 0, band: 1, hp: 3, edge: 3, edgeMax: 3, shatters: 0,
      bestPace: 0, bestCleanBankChain: 0, wave: { phase: 'combat', cleanBanks: { best: 0 }, pace: { target: 18, speed: 20, best: 0, held: true } },
    },
    world: { grounded: false, player: { position: { x: 0, y: 0 } }, arena: { x: -1200, y: -6000, w: 2400, h: 6000 } },
    combat: { enemies: new Map(), hazards: [], add() {} },
  };
  const { createQuestUI } = await import('../src/quest-ui.js');
  const doc = window.document;
  try {
    const ui = createQuestUI({
      getRun: () => run, storage, audio: { lock() {}, zone() {} },
      resetInput() {}, home() {}, resume() {}, motion: () => false,
      view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
    });
    ui.start();
    // Prove the WARM-UP deeds the easy way: lots of real events of every kind,
    // through the same door the shell uses.
    for (let i = 0; i < 40; i++) {
      ui.event('dash', { power: 1 });
      ui.event('cut', { kind: i % 3 ? 'fang' : 'prism', strokeKills: 1 + (i % 3), cut: 0.1, release: true, speed: 300, y: -1000, armorRemoved: 0 });
      ui.tick();
    }
    ui.event('sector', { band: 4 });
    for (let i = 0; i < 40; i++) ui.tick();
    // Open the board.
    doc.querySelector('#quests-btn').click();
    const claim = doc.querySelector('.deed-claim');
    assert.ok(claim, 'a deed the run has proven offers CLAIM');
    assert.match(claim.textContent, /CLAIM ♦ \+\d+/);
    const before = JSON.parse(values.get('quests'));
    claim.click();
    const after = JSON.parse(values.get('quests'));
    assert.ok(after.coins > before.coins, `claiming paid (${before.coins} -> ${after.coins})`);
    assert.equal(after.board.claimed.length, 1, 'the deed is marked claimed');
    assert.ok(after.doneIds.length >= 1, 'and recorded in the book for the unlock ladder');

    // The reroll is per card, states its price on its face, and the first is free.
    const reroll = [...doc.querySelectorAll('.riot-reroll')].find((b) => !b.disabled);
    assert.ok(reroll, 'an unfinished deed can be rerolled');
    assert.match(reroll.title, /reroll/i);
    const coinsBefore = JSON.parse(values.get('quests')).coins;
    const rerollsBefore = JSON.parse(values.get('quests')).board.rerolls;
    reroll.click();
    const spent = JSON.parse(values.get('quests'));
    assert.equal(spent.board.rerolls, rerollsBefore + 1, 'the reroll is recorded');
    if (reroll.dataset.free === 'true') {
      assert.match(reroll.title, /free/i);
      assert.equal(reroll.textContent.trim(), '↻', 'a free reroll wears no price');
      assert.equal(spent.coins, coinsBefore, 'the free one costs nothing');
      const next = [...doc.querySelectorAll('.riot-reroll')].find((b) => !b.disabled);
      if (next) {
        assert.equal(next.dataset.free, 'false', 'the second one is priced');
        assert.match(next.textContent, /\d/, 'the price is on the button');
      }
    }
  } finally {
    window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.requestAnimationFrame;
  }
});

test('the modal contains the deed board and nothing else', async () => {
  const { window, doc } = await openBoard();
  try {
    assert.equal(doc.querySelectorAll('.riot-card .riot-track').length, 3, 'every deed has a bar');
    assert.equal(doc.querySelectorAll('.riot-sweep').length, 1, 'the sweep track is on the board');
    assert.equal(doc.querySelectorAll('.riot-pips > i').length, 3);
    assert.equal(doc.querySelectorAll('.riot-shop').length, 1, 'one door to the real shop');
    assert.equal(doc.querySelectorAll('.prize-option').length, 0, 'no duplicate shop inside the modal');
    assert.equal(doc.querySelectorAll('.control-practice-entry').length, 0, 'practice modes live elsewhere');
    assert.equal(doc.querySelectorAll('.quest-toggle').length, 0, 'no rewards toggle');
    assert.equal(doc.querySelectorAll('details').length, 0, 'nothing is folded away');
    assert.doesNotMatch(doc.querySelector('.quest-board-dialog').textContent, /LIVE ENEMY TRAINING/);
    assert.doesNotMatch(doc.querySelector('.quest-board-dialog').textContent, /CONTROL PRACTICE/);
  } finally {
    close(window);
  }
});

test('the main-menu door says DEEDS, still with the reticle icon', async () => {
  const { window, doc } = await openBoard();
  try {
    const btn = doc.querySelector('#quests-btn');
    assert.match(btn.textContent, /DEEDS/i);
    assert.doesNotMatch(btn.textContent, /quest|contract/i);
    const svg = btn.querySelector('svg');
    assert.ok(svg);
    assert.equal(svg.dataset.uiIcon, 'target');
  } finally {
    close(window);
  }
});

test('the CSS keeps the palette and carries the argument styles', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const start = css.indexOf('CHUNK 8: THE DEED BOOK');
  const end = css.indexOf('@media(max-width:680px)', start);
  const block = css.slice(start, end === -1 ? undefined : end);
  assert.ok(block.length > 800, 'the deed styles exist');
  for (const el of ['.deed-lead', '.deed-reason', '.deed-pays', '.deed-read', '.deed-lane', '.deed-keeps', '.deed-foot']) {
    assert.ok(block.includes(el), `${el} is styled`);
  }
  const declarations = block.split('\n').filter((l) => !l.trim().startsWith('/*') && !l.trim().startsWith('*')).join('\n');
  assert.doesNotMatch(declarations, /#ffcc4d/i, 'no pastel gold is painted');
});
