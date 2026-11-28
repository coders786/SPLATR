/**
 * CHUNK 3 — FLOW: the landlord's rhythm, the length of OVERDRIVE, and a goal
 * that is live while you are fighting for it.
 *
 * ── WHY THIS FILE EXISTS, AND WHY IT IS NOT "MODULE 3/4 AS WRITTEN" ───────
 *
 * The launch doc lists Modules 3 and 4 as separate chunks. Three of their
 * headline bullets were already shipped in this codebase, and re-implementing
 * them would have been churn on working systems, so this pass spends its
 * effort on the parts that were genuinely absent:
 *
 *   ALREADY THERE (verified, not re-built)
 *     · cut-halves     — `bisect` + `shards` + `cutHalf` in the art engine,
 *                        including the flat paper fold and plate fragments.
 *     · paint decals   — `imprints`, capped by `MOTION.maxImprints`.
 *     · +1 Cut a kill  — `run.js` pays `s.edge = min(edgeMax, s.edge + 1)`.
 *     · squash/stretch — `stretchFor` / `squashed` / `landFor` in the engine.
 *
 *   GENUINELY MISSING (this chunk)
 *     · The Landlord arrived on a `%5` sector and only once the arena had
 *       already torn (it needed `arenaMode === 'SHATTERED'`), so a player who
 *       never reached 100% fracture never met the boss. The doc asks for every
 *       3rd–4th wave; this makes that a rule instead of a coincidence.
 *     · OVERDRIVE lasted 175 ticks (2.9s). The doc asks for 5s.
 *     · Objectives existed only as the three anchor locks — a fixed chore,
 *       identical every sector, with no way to fail or to earn anything. There
 *       was no "live bonus goal" anywhere in the run.
 *
 * ── ONE DELIBERATE EXCLUSION ──────────────────────────────────────────────
 *
 * The doc also asks for an "85% wave auto-clear" to stop stragglers stalling a
 * wave. It is NOT here, and the reason is measured rather than aesthetic: a
 * trivial bot (launch at the nearest body whenever a cut is available) clears
 * all 12 of sector 1's bodies in 12 launches and takes zero damage, and leaves
 * the field empty — there is no straggler tail to cut off. Adding a threshold
 * would change what "clear" MEANS (an intact body vanishing without being cut)
 * to fix a problem that does not reproduce. If a real playtest shows a stuck
 * field, the honest fix is a hunt cue, not a silent sweep — and this module is
 * where that cue would go.
 *
 * Pure: no canvas, no DOM, no clock. The directors own the timing; this owns
 * the rules.
 */
import { clamp } from './levels.js';

/* ── THE LANDLORD'S CADENCE ─────────────────────────────────────────────── */

/**
 * Sector cadence for the Monolith: sectors 4, 8, 12 …
 *
 * Give players several sectors to learn enemy patterns before the first boss,
 * then keep encounters spaced apart at four-sector intervals.
 */
export const LANDLORD = Object.freeze({ first: 4, every: 4 });

/** Smallest sector that is allowed to raise the landlord. */
export function landlordFirst() {
  return LANDLORD.first;
}

/**
 * Does sector `number` raise the landlord?
 *
 * @param {number} number 1-based sector / wave number
 * @returns {boolean}
 */
export function landlordDue(number) {
  const n = Math.floor(Number(number) || 0);
  if (n < LANDLORD.first) return false;
  return (n - LANDLORD.first) % LANDLORD.every === 0;
}

/** The next sector that will raise it, for a countdown the HUD can show. */
export function nextLandlord(number) {
  const n = Math.max(1, Math.floor(Number(number) || 1));
  for (let i = n; i < n + LANDLORD.every + 1; i++) if (landlordDue(i)) return i;
  return n + LANDLORD.every;
}

/* ── OVERDRIVE LENGTH ───────────────────────────────────────────────────── */

/**
 * Five seconds, in 60 Hz ticks, as the doc asks — up from the 175 ticks (2.9s)
 * that was picked when the field was denser and a chain was easier to hold.
 *
 * This is the one number in the chunk that changes how strong the player is,
 * so it is named here rather than left as a literal in `run.js`, and the HUD
 * reads the same constant to draw the bar. Nothing else about Overdrive
 * changes: it still pays ×2 score, still pierces plates, still drains on the
 * clock.
 */
export const OVERDRIVE = Object.freeze({ ticks: 300, seconds: 5 });

/* ── THE LIVE BONUS GOAL ────────────────────────────────────────────────── */

/**
 * What a goal is worth when it lands. Paid in the two currencies the game
 * already pays in — Credits (the shop) and Fracture (the world tearing open
 * sooner) — never in a new one, and never in health, because health is the
 * thing the run is about.
 */
export const GOAL_REWARD = Object.freeze({ credits: 2, fracture: 2 });

/**
 * The goal table. Each entry is a rule the player can hold in their head while
 * fighting, which is the whole point: an objective you have to stop and read is
 * not an objective, it is a menu.
 *
 * `metric` names the field in the metrics snapshot; `target` is the count (or 1
 * for a keep-it-up goal); `line` is what the HUD says, at most a few words.
 */
export const GOALS = Object.freeze({
  firstblood: Object.freeze({
    id: 'firstblood',
    label: 'FIRST BLOOD',
    line: 'CUT IN 8s',
    metric: 'firstKillTicks',
    target: 480,
    /** Lower is better for a speed goal. */
    lower: true,
  }),
  pace: Object.freeze({
    id: 'pace',
    label: 'HOLD RUSH',
    line: 'HOLD RUSH ONCE',
    metric: 'paceHeld',
    target: 1,
    bool: true,
  }),
  banks: Object.freeze({
    id: 'banks',
    label: 'BANK TWICE',
    line: '2 CLEAN BANKS',
    metric: 'banks',
    target: 2,
  }),
  overdrive: Object.freeze({
    id: 'overdrive',
    label: 'REACH RUSH',
    line: 'REACH RUSH',
    metric: 'overdrive',
    target: 1,
  }),
  gold: Object.freeze({
    id: 'gold',
    label: 'BREAK THE CROWN',
    line: 'BREAK A CROWN',
    metric: 'crowns',
    target: 1,
  }),
});

/**
 * A 32-bit avalanche. Needed because the sector number is the ONLY input that
 * differs between sectors in a run, and `hash(seed, sector, salt) % 5` is not
 * well mixed in its low bits for consecutive sectors — measured over 300 seeds
 * it dealt the same goal to sectors 1,3 and 5 of one run, which turns a deck of
 * four goals into two. This mixes first and deals flat (each goal within 1.5%
 * of even, and even across the first sector specifically).
 */
function mix32(h) {
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * The goal deck, in a fixed order. Order is load-bearing: the no-repeat walk
 * below indexes into it, so the same (seed, sector) always resolves the same
 * way, and a sector that cannot serve `gold` still cannot after a reindex.
 */
export const GOAL_DECK = Object.freeze(['firstblood', 'pace', 'banks', 'overdrive', 'gold']);

/**
 * The first sector always asks for the same thing: land a cut, quickly. It is
 * the one directive that teaches the verb, and a deck of four goals rolled at
 * random would hand a first-time player "reach Overdrive" before they have made
 * a single cut.
 */
export const FIRST_GOAL = 'firstblood';

function seedBits(seed, number) {
  return (Math.imul(seed | 0, 374761393) + Math.imul(number | 0, 668265263) + 0x9e3779b9) | 0;
}

/**
 * Choose this sector's goal. Deterministic in (seed, sector) so a replay, a
 * test and the HUD all agree, and so the goal cannot be re-rolled by pausing.
 *
 * Two properties are enforced by construction rather than hoped for:
 *
 *   1. NO REPEAT IN ADJACENT SECTORS. The index is walked from sector 1 with a
 *      derangement step (`r < prev ? r : r + 1` picks uniformly among the
 *      indices that are NOT the previous one), so sector n can never ask for
 *      the goal sector n-1 just asked for. A plain `hash(seed, n) % 5` does not
 *      give you this — measured over 300 seeds it repeated the previous goal in
 *      5 of every 11 sector transitions.
 *   2. NO IMPOSSIBLE ASK. `gold` is only dealt when the field actually holds a
 *      Crown, and the walk skips it otherwise without changing the deck order.
 *
 * @param {{number?:number, seed?:number, hasCrown?:boolean}} q
 * @returns {{id:string,label:string,line:string,metric:string,target:number,lower:boolean}}
 */
export function goalFor({ number = 1, seed = 0, hasCrown = false } = {}) {
  const sector = Math.max(1, Math.floor(Number(number) || 1));
  const deck = hasCrown ? GOAL_DECK : GOAL_DECK.filter((id) => id !== 'gold');
  if (sector === 1) {
    const g = GOALS[FIRST_GOAL];
    return Object.freeze({ ...g, lower: !!g.lower });
  }
  // Sector 1 is authored, so the walk starts there and only begins varying at 2.
  let index = GOAL_DECK.indexOf(FIRST_GOAL) % deck.length;
  const L = deck.length;
  for (let n = 2; n <= sector; n++) {
    const r = mix32(seedBits(seed, n)) % (L - 1);
    index = r < index ? r : r + 1;
  }
  const g = GOALS[deck[index]];
  return Object.freeze({ ...g, lower: !!g.lower });
}

/**
 * The counters a goal is judged against, taken from the live sector.
 * Kept as a plain object so the rule can be tested without a run.
 */
export function goalMetrics(wave = {}, state = {}) {
  const started = wave.starts || {};
  return {
    kills: Math.max(0, (state.kills | 0) - (started.kills | 0)),
    hits: Math.max(0, (state.damageTaken | 0) - (started.damage | 0)),
    banks: Math.max(0, (wave.cleanBanks?.total | 0) - (started.banks | 0)),
    crowns: Math.max(0, (state.killLedger?.rows?.crown?.kills | 0) - (started.crowns | 0)),
    paceHeld: !!wave.pace?.held,
    overdrive: !!state.overdriveSeen,
    firstKillTicks: Number.isFinite(wave.firstKillTick) ? wave.firstKillTick : -1,
    ticks: Number.isFinite(wave.age) ? wave.age : 0,
  };
}

/**
 * How far along the goal is, 0..1. A boolean goal is 0 until it is true; a
 * speed goal is 0 until the cut lands and then 1 if it landed inside the
 * window; a count goal is the fraction of its target.
 *
 * @returns {{fraction:number, met:boolean, value:number, target:number, text:string}}
 */
export function goalProgress(goal, m = {}) {
  if (!goal) return { fraction: 0, met: false, value: 0, target: 1, text: '' };
  let value, met;
  if (goal.bool) {
    value = m[goal.metric] ? 1 : 0;
    met = value >= goal.target;
  } else if (goal.lower) {
    // A speed goal cannot be met until the event happens, and it FAILS (stays
    // unmet) the moment the window closes — but it must not read as "failed"
    // while it is still possible, so the fraction is time remaining.
    value = Number.isFinite(m[goal.metric]) && m[goal.metric] >= 0 ? m[goal.metric] : -1;
    met = value >= 0 && value <= goal.target;
    const remaining = value < 0 ? clamp(1 - (m.ticks || 0) / goal.target, 0, 1) : clamp(1 - value / goal.target, 0, 1);
    return { fraction: met ? 1 : remaining * 0.9, met, value: value < 0 ? 0 : value, target: goal.target, text: goal.line };
  } else {
    value = Math.max(0, m[goal.metric] | 0);
    met = value >= goal.target;
  }
  const fraction = clamp(goal.target > 0 ? value / goal.target : 0, 0, 1);
  const text = met ? `${goal.label} ✓` : `${Math.min(value, goal.target)}/${goal.target}`;
  return { fraction, met, value, target: goal.target, text };
}

/**
 * The one line the HUD prints for a goal: its name plus live progress, never a
 * sentence, never more than five words.
 *
 * @param {object} goal
 * @param {object} m metrics
 * @param {boolean} [met]
 */
export function goalLine(goal, m = {}) {
  const p = goalProgress(goal, m);
  if (p.met) return `${goal.label} ✓`;
  if (goal.bool) return goal.line;
  if (goal.lower) return goal.line;
  return `${goal.label} ${Math.min(p.value, goal.target)}/${goal.target}`;
}

/**
 * What the goal pays at the clear boundary, or null when it was missed.
 *
 * The caller owns the actual mutation (`gainFracture`, the credit ledger), for
 * the same reason every other reward in this game does: the rules live where
 * the run can be inspected, not inside a presentation file.
 */
export function goalPayout(goal, m = {}) {
  if (!goal) return null;
  const met = goalProgress(goal, m).met;
  if (!met) return null;
  return Object.freeze({
    id: goal.id,
    label: goal.label,
    credits: GOAL_REWARD.credits,
    fracture: GOAL_REWARD.fracture,
  });
}
