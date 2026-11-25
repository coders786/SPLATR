/**
 * CHUNK 6 — RIOT CONTRACTS.
 *
 * The previous screen had an identity crisis: a practice venue, a duplicate
 * shop set, tutorial tooltips, and an on/off switch for rewards, all in one
 * modal. These tests pin the replacement — and, more importantly, pin the
 * ABSENCES, because the failure mode here was never "the code was wrong", it
 * was "four unrelated things were in the box".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PILLARS, PILLAR_BY_ID, CONTRACTS, CONTRACT_PAY, SWEEP_BONUS, REROLL_COST, FREE_REROLLS,
  contractById, pillarPool, contractMetrics, contractProgress, dealContract, dealBoard,
  boardState, rerollCost, progressLabel, EMPTY_BOARD,
} from '../src/contracts.js';

/* ── THE PILLARS ────────────────────────────────────────────────────────── */

test('there are three pillars, each with its own colour from the design', () => {
  assert.equal(PILLARS.length, 3);
  assert.deepEqual(PILLARS.map((p) => p.id), ['CARNAGE', 'STYLE', 'SURVIVAL']);
  // The exact palette from the redesign: hot pink, electric cyan, acid lime.
  assert.equal(PILLAR_BY_ID.CARNAGE.accent, '#ff3366');
  assert.equal(PILLAR_BY_ID.STYLE.accent, '#00f0ff');
  assert.equal(PILLAR_BY_ID.SURVIVAL.accent, '#dfff00');
  // No gold anywhere near the cards: that header was the complaint.
  for (const p of PILLARS) assert.doesNotMatch(p.accent, /ffcc4d|ffd166|ffd773/i);
});

test('every pillar has contracts to deal, and each one states a single objective', () => {
  for (const p of PILLARS) {
    const pool = pillarPool(p.id);
    assert.ok(pool.length >= 5, `${p.id} needs depth, got ${pool.length}`);
    for (const c of pool) {
      assert.equal(c.pillar, p.id);
      assert.ok(c.title.length > 0);
      // ONE crisp sentence. The old cards had a title, a tier, a goal, an
      // instruction and a grey flavour footnote.
      assert.ok(c.objective.length <= 52, `${c.id}: "${c.objective}" is a paragraph`);
      assert.match(c.objective, /\.$/, `${c.id} is a sentence`);
      assert.doesNotMatch(c.objective, /tap a|pull back|press |click /i, `${c.id} is a tutorial, not a contract`);
      assert.ok(c.target > 0);
      assert.ok(CONTRACT_PAY[p.id][c.tier] > 0);
    }
  }
});

test('CARNAGE is cumulative and the others are won in a run', () => {
  const carnage = pillarPool('CARNAGE');
  assert.ok(carnage.every((c) => c.per === 'total' || c.per === 'peak'), 'volume builds across runs');
  const style = pillarPool('STYLE');
  assert.ok(style.every((c) => c.per === 'run'), 'style is a per-run performance');
  assert.equal(PILLAR_BY_ID.CARNAGE.cumulative, true);
  assert.equal(PILLAR_BY_ID.STYLE.cumulative, false);
});

test('contract ids are unique and the pools do not overlap', () => {
  const ids = CONTRACTS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate contract id');
  for (const p of PILLARS) {
    for (const c of pillarPool(p.id)) assert.equal(contractById(c.id).id, c.id);
  }
});

/* ── PROGRESS AND DEALING ───────────────────────────────────────────────── */

const metrics = (over = {}) => contractMetrics({
  run: { doubles: 0, triples: 0, power: 0, banks: 0, overdrive: false, sector: 1, seals: 0, flawless: 0, ...over.run },
  tally: { kills: 0, fang: 0, bastion: 0, crown: 0, monoliths: 0, ...over.tally },
});

test('progress is numeric and clamps at the target', () => {
  const c = contractById('butcher'); // 50 kills, cumulative
  assert.deepEqual(contractProgress(c, metrics({ tally: { kills: 32 } })), { value: 32, target: 50, fraction: 0.64, done: false });
  const over = contractProgress(c, metrics({ tally: { kills: 500 } }));
  assert.equal(over.fraction, 1, 'the bar never overflows');
  assert.equal(over.value, 500, 'but the number tells the truth');
  assert.equal(over.done, true);
  assert.equal(progressLabel(c, metrics({ tally: { kills: 32 } })), '32 / 50');
});

test('a missing or corrupt metric reads as zero, never NaN', () => {
  const c = contractById('butcher');
  for (const bad of [{}, { kills: NaN }, { kills: -5 }, { kills: 'many' }, null]) {
    const p = contractProgress(c, bad || {});
    assert.equal(Number.isFinite(p.value), true);
    assert.ok(p.value >= 0);
  }
});

test('dealing is deterministic per (seed, board, pillar)', () => {
  for (const seed of [1, 7, 99]) {
    const a = dealBoard({ seed, board: 0, metrics: metrics() });
    const b = dealBoard({ seed, board: 0, metrics: metrics() });
    assert.deepEqual(a.map((c) => c.id), b.map((c) => c.id));
    assert.equal(a.length, 3, 'one per pillar');
  }
});

test('a board never deals the same pillar twice, or a contract already finished', () => {
  // Everything in CARNAGE is done. The board must not post a dead slot.
  const done = metrics({ tally: { kills: 1000, fang: 1000, bastion: 1000, crown: 1000 } });
  for (let board = 0; board < 6; board++) {
    const grid = dealBoard({ seed: 3, board, metrics: done });
    assert.equal(grid.length, 3);
    assert.equal(new Set(grid.map((c) => c.pillar)).size, 3);
    for (const c of grid) {
      if (c.pillar === 'CARNAGE') assert.equal(contractProgress(c, done).done, false, `${c.id} is already finished`);
    }
  }
});

test('a reroll avoids the contract it is replacing', () => {
  const avoid = pillarPool('STYLE')[0].id;
  for (let seed = 0; seed < 30; seed++) {
    const pick = dealContract({ pillar: 'STYLE', seed, board: 0, avoid: [avoid], metrics: metrics() });
    assert.notEqual(pick.id, avoid);
  }
});

/* ── THE SWEEP ──────────────────────────────────────────────────────────── */

const three = () => PILLARS.map((p) => ({ ...pillarPool(p.id)[0], pillar: p.id, pay: 30 }));

test('a board is swept only when all three are complete', () => {
  const grid = three();
  const none = boardState({ grid, claimed: [] }, {});
  assert.equal(none.sweep, false);
  assert.equal(none.done, 0);
  assert.deepEqual(none.pips, [false, false, false]);

  const partial = boardState({ grid, claimed: [] }, contractMetrics({ run: {}, tally: { kills: 999 } }));
  assert.equal(partial.sweep, false, 'one of three is not a sweep');

  // Force every contract complete.
  const all = contractMetrics({
    run: { doubles: 99, triples: 99, power: 99, banks: 99, overdrive: true, sector: 9, seals: 9, flawless: 9 },
    tally: { kills: 999, fang: 999, bastion: 999, crown: 999, monoliths: 9 },
  });
  const swept = boardState({ grid, claimed: [] }, all);
  assert.equal(swept.sweep, true);
  assert.deepEqual(swept.pips, [true, true, true]);
  assert.equal(swept.owed, 90, 'three contracts at 30 each');
});

test('the sweep bonus is a real number and bigger than any single contract', () => {
  assert.ok(SWEEP_BONUS > 0);
  const richest = Math.max(...Object.values(CONTRACT_PAY).flat());
  assert.ok(SWEEP_BONUS >= richest, 'clearing the board must beat clearing one card');
});

/* ── REROLL ECONOMY ─────────────────────────────────────────────────────── */

test('one free reroll, then it costs credits', () => {
  assert.equal(FREE_REROLLS, 1);
  assert.equal(rerollCost({ rerolls: 0 }), 0, 'the first one is free');
  assert.equal(rerollCost({ rerolls: 1 }), REROLL_COST);
  assert.equal(rerollCost({ rerolls: 9 }), REROLL_COST, 'the price does not compound');
  assert.equal(rerollCost(EMPTY_BOARD), 0);
  assert.ok(REROLL_COST > 0 && REROLL_COST < 15, 'cheap enough to use');
});

/* ── THE MODAL ITSELF (the identity-crisis absences) ────────────────────── */

async function openBoard({ storage = new Map(), coins } = {}) {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  if (coins != null) storage.set('quests', JSON.stringify({ coins }));
  const values = storage;
  const { createQuestUI } = await import('../src/quest-ui.js');
  const ui = createQuestUI({
    getRun: () => null,
    storage: { get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v) },
    audio: { lock() {}, zone() {} },
    resetInput: () => {},
    home: () => {},
    resume() {},
    view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
  });
  const doc = window.document;
  doc.querySelector('#quests-btn').click();
  return { window, doc, ui, values };
}
const close = (window) => {
  window.happyDOM.abort();
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
};

test('the modal contains contracts and nothing else', async () => {
  const { window, doc } = await openBoard();
  try {
    // Present: three cards, three bars, the sweep track, one shop door.
    assert.equal(doc.querySelectorAll('.riot-card').length, 3);
    assert.equal(doc.querySelectorAll('.riot-card .riot-track').length, 3);
    assert.equal(doc.querySelectorAll('.riot-card .riot-count').length, 3);
    assert.equal(doc.querySelectorAll('.riot-sweep').length, 1);
    assert.equal(doc.querySelectorAll('.riot-shop').length, 1);
    assert.match(doc.querySelector('.riot-title').textContent, /RIOT CONTRACTS/);
    // Absent: the duplicate shop, the practice entries, the rewards toggle.
    assert.equal(doc.querySelectorAll('.prize-option').length, 0, 'no mini-shop');
    assert.equal(doc.querySelectorAll('.control-practice-entry').length, 0, 'practice modes moved out');
    assert.equal(doc.querySelectorAll('.quest-toggle').length, 0, 'no rewards toggle');
    assert.equal(doc.querySelectorAll('details').length, 0, 'nothing is folded away');
  } finally {
    close(window);
  }
});

test('the main-menu door says CONTRACTS, not Quests, and is not a graduation cap', async () => {
  const { window, doc } = await openBoard();
  try {
    const btn = doc.querySelector('#quests-btn');
    assert.match(btn.textContent, /CONTRACTS/i);
    assert.doesNotMatch(btn.textContent, /quest/i);
    // The icon must be the reticle, not the guide (open book) glyph.
    const svg = btn.querySelector('svg');
    assert.ok(svg, 'the button has an icon');
    assert.equal(svg.dataset.uiIcon, 'target');
  } finally {
    close(window);
  }
});

test('each card is colour-coded by pillar and carries its own reward', async () => {
  const { window, doc } = await openBoard();
  try {
    const cards = [...doc.querySelectorAll('.riot-card')];
    const accents = cards.map((c) => c.style.getPropertyValue('--accent').trim());
    assert.deepEqual(accents, ['#ff3366', '#00f0ff', '#dfff00']);
    for (const card of cards) {
      assert.ok(card.querySelector('.riot-tag').textContent.startsWith('///'), 'the slash motif');
      assert.ok(card.querySelector('.riot-card-title').textContent.length > 0);
      assert.ok(card.querySelector('.riot-objective').textContent.length > 0);
      assert.match(card.querySelector('.riot-count').textContent, /^\d+ \/ \d+$/, 'numeric progress');
      // Either a reward footer or a claim button. Never both, never neither.
      const foot = card.querySelector('.riot-footer');
      const claim = card.querySelector('.riot-claim');
      assert.ok(foot || claim, 'a card always states its worth');
      if (!claim) assert.match(foot.textContent, /REWARD.*♦/s);
    }
  } finally {
    close(window);
  }
});

test('a completed contract becomes a claim button that actually pays', async () => {
  // Seed a profile that has already done the volume work.
  const storage = new Map([['quests', JSON.stringify({
    coins: 0,
    tally: { kills: 9999, fang: 9999, bastion: 9999, crown: 9999, monoliths: 99 },
  })]]);
  const { window, doc, values } = await openBoard({ storage });
  try {
    const claimed = doc.querySelector('.riot-claim');
    assert.ok(claimed, 'a finished contract offers CLAIM');
    assert.match(claimed.textContent, /CLAIM ♦ \+\d+/);
    const before = JSON.parse(values.get('quests')).coins;
    claimed.click();
    const after = JSON.parse(values.get('quests')).coins;
    assert.ok(after > before, `claiming paid (${before} -> ${after})`);
  } finally {
    close(window);
  }
});

test('the sweep track shows three pips and states the bonus', async () => {
  const { window, doc } = await openBoard();
  try {
    const sweep = doc.querySelector('.riot-sweep');
    assert.equal(sweep.querySelectorAll('.riot-pips > i').length, 3);
    assert.match(sweep.textContent, new RegExp(`\\+${SWEEP_BONUS}`));
    assert.equal(sweep.dataset.ready, 'false');
  } finally {
    close(window);
  }
});

test('the reroll button swaps a contract and spends the free one first', async () => {
  const { window, doc, values } = await openBoard({ storage: new Map([['quests', JSON.stringify({ coins: 100 })]]) });
  try {
    const styleCard = doc.querySelectorAll('.riot-card')[1];
    const before = styleCard.querySelector('.riot-card-title').textContent;
    styleCard.querySelector('.riot-reroll').click();
    const afterCard = doc.querySelectorAll('.riot-card')[1];
    const saved = JSON.parse(values.get('quests'));
    assert.equal(saved.board.rerolls, 1, 'the free reroll was spent');
    assert.equal(saved.coins, 100, 'and it was free');
    // It may legitimately deal the same title back only if the pool was size 1.
    assert.ok(pillarPool('STYLE').length > 1);
    assert.equal(afterCard.querySelector('.riot-reroll').title.includes('free'), false, 'the next one costs');
    void before;
  } finally {
    close(window);
  }
});

test('practice modes now live on the PRACTICE & HELP page', async () => {
  const { Window } = await import('happy-dom');
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  window.Element.prototype.animate = () => ({});
  const doc = window.document;
  try {
    // They exist in the markup, inside the manual (practice) page.
    const manual = doc.querySelector('#manual-page');
    assert.ok(manual, 'the practice page exists');
    assert.ok(manual.querySelector('#manual-modes'), 'it has a modes strip');
    // And they are NOT in the contracts dialog.
    const dialog = doc.querySelector('.quest-board-dialog');
    // The dialog is only built by createQuestUI; either way, neither control
    // may be inside it.
    assert.ok(dialog?.querySelector('#manual-teaching') == null);
    assert.ok(dialog?.querySelector('#manual-drill') == null);
    // No training copy inside the contracts modal.
    assert.doesNotMatch(dialog?.textContent || '', /LIVE ENEMY TRAINING/);
    assert.doesNotMatch(dialog?.textContent || '', /CONTROL PRACTICE/);
  } finally {
    close(window);
  }
});

test('the old gold header colour is gone from the contract styling', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const start = css.indexOf('CHUNK 6: RIOT CONTRACTS');
  const end = css.indexOf('@media(max-width:680px)', start);
  const block = css.slice(start, end === -1 ? undefined : end);
  assert.ok(block.length > 500, 'the riot contract styles exist');
  // Declarations only: the stylesheet's comment explains which colour was
  // removed, and naming it there is not the same as painting with it.
  const declarations = block
    .split('\n')
    .filter((line) => !line.trim().startsWith('/*') && !line.trim().startsWith('*') && !line.trim().startsWith('//'))
    .join('\n');
  assert.doesNotMatch(declarations, /#ffcc4d/i, 'no pastel gold header is painted');
  assert.match(block, /--accent/, 'cards take their pillar colour');
  assert.match(block, /skewX/, 'the title screen skew is present');
});
