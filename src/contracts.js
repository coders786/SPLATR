/**
 * CHUNK 6 — RIOT CONTRACTS.
 *
 * The contract screen has been rebuilt from the rules up, not re-skinned. The
 * previous system was four things in one box: a practice venue, a duplicate
 * shop, a set of tutorial tooltips, and an on/off switch for rewards. This file
 * is only one thing — a self-refreshing board of three goals you can actually
 * read at a glance.
 *
 * ── THE THREE PILLARS ─────────────────────────────────────────────────────
 *
 *   CARNAGE  (hot pink)   cumulative volume. Nothing is wasted: progress
 *                         survives death, and every kill in every run counts.
 *   STYLE    (cyan)       precision. Double cuts, max-pull power cuts, banks.
 *   SURVIVAL (acid lime)  distance. Sectors reached, sealed, cleared clean.
 *
 * Each pillar tops up from `profile.tally`, a durable per-run counter set, so
 * a CARNAGE contract of 50 kills is finished by playing, however badly.
 *
 * ── THE LOOP ──────────────────────────────────────────────────────────────
 *
 *   · progress is live and numeric, drawn as a bar on the card
 *   · completing all three sweeps the board: +SWEEP bonus, fresh contracts,
 *     slightly richer, and a sweep counter that climbs
 *   · one free reroll per run per board, then it costs credits
 *
 * Pure: no DOM, no canvas, no clock. The UI reads this; it does not mutate it.
 */

/** Credit value by pillar and tier. Richer contracts pay more; a sweep pays most. */
export const CONTRACT_PAY = Object.freeze({
  CARNAGE: Object.freeze([25, 35, 50]),
  STYLE: Object.freeze([30, 40, 55]),
  SURVIVAL: Object.freeze([30, 45, 60]),
});

/** A full board cleared pays this on top of the three contracts. */
export const SWEEP_BONUS = 75;
/** Reroll after the free one: cheap enough to use, high enough to mean something. */
export const REROLL_COST = 10;
/** Free rerolls per run, per board. */
export const FREE_REROLLS = 1;

/**
 * The pillars. `accent` is the exact colour the card's top border and label
 * use — one place, so the board cannot drift from the design.
 */
export const PILLARS = Object.freeze([
  Object.freeze({
    id: 'CARNAGE',
    tag: '/// CARNAGE',
    accent: '#ff3366',
    belief: 'Nothing is wasted. Every kill counts, in every run.',
    // Cumulative: the bar never goes back down.
    cumulative: true,
  }),
  Object.freeze({
    id: 'STYLE',
    tag: '/// STYLE',
    accent: '#00f0ff',
    belief: 'Proof you are not just mashing.',
    cumulative: false,
  }),
  Object.freeze({
    id: 'SURVIVAL',
    tag: '/// SURVIVAL',
    accent: '#dfff00',
    belief: 'How deep you get before the field wins.',
    cumulative: false,
  }),
]);

export const PILLAR_BY_ID = Object.freeze(
  Object.fromEntries(PILLARS.map((p) => [p.id, p])),
);

/**
 * The contract pool.
 *
 * `metric` names a field in `contractMetrics()`. `per` says whether the goal is
 * a cumulative total (checked against the durable tally, survives death) or a
 * per-run peak (checked against this run only). Every objective is ONE line of
 * plain English — no tooltips, no "Tap a triangle. Pull back for a stronger
 * launch."
 */
export const CONTRACTS = Object.freeze([
  /* ── CARNAGE: volume ── */
  Object.freeze({ id: 'butcher', pillar: 'CARNAGE', tier: 0, title: 'SHAPE BUTCHER', objective: 'Slice 50 enemies. Counts every run.', metric: 'kills', per: 'total', target: 50 }),
  Object.freeze({ id: 'fangwork', pillar: 'CARNAGE', tier: 0, title: 'FANG WORK', objective: 'Slice 30 fangs.', metric: 'fang', per: 'total', target: 30 }),
  Object.freeze({ id: 'plateage', pillar: 'CARNAGE', tier: 1, title: 'PLATE BREAKER', objective: 'Break 15 armoured plates.', metric: 'bastion', per: 'total', target: 15 }),
  Object.freeze({ id: 'bountyline', pillar: 'CARNAGE', tier: 2, title: 'BOUNTY LINE', objective: 'Take down 3 crowns.', metric: 'crown', per: 'total', target: 3 }),
  Object.freeze({ id: 'hundred', pillar: 'CARNAGE', tier: 2, title: 'HUNDRED CUTS', objective: 'Reach 100 total kills.', metric: 'kills', per: 'total', target: 100 }),

  /* ── STYLE: precision ── */
  Object.freeze({ id: 'doubletrouble', pillar: 'STYLE', tier: 0, title: 'DOUBLE TROUBLE', objective: 'Land 5 double cuts in one run.', metric: 'doubles', per: 'run', target: 5 }),
  Object.freeze({ id: 'maxpull', pillar: 'STYLE', tier: 1, title: 'FULL COMMIT', objective: 'Make 10 max-power cuts in one run.', metric: 'power', per: 'run', target: 10 }),
  Object.freeze({ id: 'bankline', pillar: 'STYLE', tier: 1, title: 'BANK SHOT', objective: 'Land 3 clean banks in one run.', metric: 'banks', per: 'run', target: 3 }),
  Object.freeze({ id: 'triplethreat', pillar: 'STYLE', tier: 2, title: 'TRIPLE THREAT', objective: 'Land 2 triple cuts in one run.', metric: 'triples', per: 'run', target: 2 }),
  Object.freeze({ id: 'overclock', pillar: 'STYLE', tier: 2, title: 'OVERCLOCKED', objective: 'Reach Overdrive in one run.', metric: 'overdrive', per: 'run', target: 1 }),

  /* ── SURVIVAL: distance ── */
  Object.freeze({ id: 'deeper', pillar: 'SURVIVAL', tier: 0, title: 'DEEPER', objective: 'Reach sector 3.', metric: 'sector', per: 'peak', target: 3 }),
  Object.freeze({ id: 'cleanrun', pillar: 'SURVIVAL', tier: 0, title: 'CLEAN SWEEP', objective: 'Seal 3 sectors.', metric: 'seals', per: 'run', target: 3 }),
  Object.freeze({ id: 'untouched', pillar: 'SURVIVAL', tier: 1, title: 'UNTOUCHED', objective: 'Seal 2 sectors without taking a hit.', metric: 'flawless', per: 'run', target: 2 }),
  Object.freeze({ id: 'deepdive', pillar: 'SURVIVAL', tier: 1, title: 'DEEP DIVE', objective: 'Reach sector 5.', metric: 'sector', per: 'peak', target: 5 }),
  Object.freeze({ id: 'landlord', pillar: 'SURVIVAL', tier: 2, title: 'EVICT THE LANDLORD', objective: 'Fell a landlord.', metric: 'monoliths', per: 'total', target: 1 }),
]);

/**
 * A contract by id, or null.
 *
 * CHUNK 6: resolves `pay` too. A board is SAVED as a list of ids and restored
 * through this function, so a card that came back from a save used to carry no
 * payout at all — the claim button rendered `♦ +undefined` and paid NaN. The
 * payout is derived from (pillar, tier) here, which is the only place that
 * needs to know the table.
 */
export function contractById(id) {
  const c = CONTRACTS.find((x) => x.id === id);
  if (!c) return null;
  return { ...c, pay: CONTRACT_PAY[c.pillar][c.tier] };
}

/** The pool for one pillar. */
export function pillarPool(pillar) {
  return CONTRACTS.filter((c) => c.pillar === pillar);
}

/**
 * The live counters a contract is judged against, derived from a run plus the
 * durable tally.
 *
 * `run` values are per-run peaks this run reached; `total` values come from
 * `profile.tally`, which the shell accumulates at the end of every run (and
 * during it, for the counters that are cheap to maintain).
 */
export function contractMetrics({ run = {}, tally = {} } = {}) {
  const n = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return {
    // volume (cumulative)
    kills: n(tally.kills),
    fang: n(tally.fang),
    bastion: n(tally.bastion),
    crown: n(tally.crown),
    monoliths: n(tally.monoliths),
    // precision (this run)
    doubles: n(run.doubles),
    triples: n(run.triples),
    power: n(run.power),
    banks: n(run.banks),
    overdrive: run.overdrive ? 1 : 0,
    // distance (this run)
    sector: n(run.sector),
    seals: n(run.seals),
    flawless: n(run.flawless),
  };
}

/** Read a contract's current value out of a metrics snapshot. */
export function contractValue(contract, metrics = {}) {
  if (!contract) return 0;
  const v = metrics[contract.metric];
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

/** `{value, target, fraction, done}` for one contract. */
export function contractProgress(contract, metrics = {}) {
  const value = contractValue(contract, metrics);
  const target = Math.max(1, contract?.target || 1);
  return Object.freeze({
    value,
    target,
    fraction: Math.min(1, value / target),
    done: value >= target,
  });
}

/**
 * Pick one contract for a pillar.
 *
 * Deterministic in (seed, board, pillar) so the board is the same if you reopen
 * the screen, and `avoid` lets a reroll exclude what you just threw away.
 * Contracts already at their target are skipped — a board that deals you
 * something you already finished is a dead slot.
 */
export function dealContract({ pillar, seed = 0, board = 0, avoid = [], metrics = {} } = {}) {
  const pool = pillarPool(pillar).filter((c) => !avoid.includes(c.id));
  const open = pool.filter((c) => !contractProgress(c, metrics).done);
  // A dead slot must never be dealt. If the whole pool is finished, the pillar
  // ESCALATES instead: the least-complete contract is re-posted with its target
  // pushed out by another full target's worth, so CARNAGE keeps climbing (50,
  // then 100, then 150) instead of recycling a card the player already cleared.
  if (!open.length) {
    const source = pool.length ? pool : pillarPool(pillar);
    if (!source.length) return null;
    const base = [...source].sort((a, b) => contractProgress(a, metrics).value - contractProgress(b, metrics).value)[0];
    const step = Math.max(1, base.target);
    const rounds = Math.max(0, Math.floor(contractProgress(base, metrics).value / step));
    return Object.freeze({
      ...base,
      id: base.id,
      escalated: true,
      target: step * (rounds + 1),
      title: base.title,
      objective: `Slice ${step * (rounds + 1)} ${base.metric === 'kills' ? 'enemies' : base.metric}. Counts every run.`,
    });
  }
  const usable = open;
  if (!usable.length) return null;
  const h = Math.imul((seed | 0) ^ Math.imul(board | 0, 0x9e3779b9), 2654435761) >>> 0;
  // Mix per pillar so the three slots do not all land on index 0.
  const lane = pillar.charCodeAt(0) * 7919;
  const idx = ((h + lane) >>> 0) % usable.length;
  return usable[idx];
}

/**
 * A whole board: one contract per pillar, with its payout.
 *
 * `board` climbs with every sweep, and the tier that is DEALT climbs with it —
 * so the board gets richer as you sweep, which is what makes the loop worth
 * running twice.
 */
export function dealBoard({ seed = 0, board = 0, avoid = {}, metrics = {} } = {}) {
  return PILLARS.map((pillar) => {
    const contract = dealContract({ pillar: pillar.id, seed, board, avoid: avoid[pillar.id] || [], metrics });
    if (!contract) return null;
    return Object.freeze({
      ...contract,
      pillar: pillar.id,
      accent: pillar.accent,
      tag: pillar.tag,
      pay: CONTRACT_PAY[pillar.id][contract.tier],
    });
  }).filter(Boolean);
}

/**
 * The board's own state: which contracts, which are claimed, how many sweeps.
 * A tiny reducer so the shell does not have to hold this in five variables.
 */
export const EMPTY_BOARD = Object.freeze({ grid: Object.freeze([]), board: 0, sweeps: 0, rerolls: 0, claimed: Object.freeze([]) });

/**
 * Sweep check. All three contracts complete and unclaimed? Then the board is
 * swept: `sweep: true`, the bonus owed, and the caller deals a fresh grid.
 */
export function boardState(state = EMPTY_BOARD, metrics = {}) {
  const grid = state.grid || [];
  const claimed = new Set(state.claimed || []);
  const progress = grid.map((c) => ({ contract: c, ...contractProgress(c, metrics), claimed: claimed.has(c.id) }));
  const done = progress.filter((p) => p.done);
  const claimable = done.filter((p) => !p.claimed);
  const sweep = grid.length === 3 && progress.every((p) => p.done);
  return Object.freeze({
    progress,
    pips: grid.map((p, i) => progress[i].done),
    done: done.length,
    total: grid.length,
    claimable,
    sweep,
    owed: claimable.reduce((n, p) => n + (p.contract.pay || 0), 0),
  });
}

/** Can this card be rerolled right now, and what does it cost? */
export function rerollCost(state = EMPTY_BOARD) {
  const used = Math.max(0, Number(state.rerolls) || 0);
  return used < FREE_REROLLS ? 0 : REROLL_COST;
}

/** Progress bar text: `12 / 40`. */
export function progressLabel(contract, metrics = {}) {
  const p = contractProgress(contract, metrics);
  return `${Math.min(p.value, p.target)} / ${p.target}`;
}
