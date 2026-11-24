/**
 * CHUNK 6: THE MOMENTUM LEDGER — the earned-speed economy.
 *
 * Speed used to be a ladder you could climb by leaning on the walls. This is
 * the small, visible fix for that: a three-pip economy filled by doing the
 * thing the game is actually about — cutting at pace, or banking off a rail
 * at pace — and by nothing else. Bounces alone fill nothing.
 *
 * What the pips buy:
 *
 *   1 pip  — nothing. The ledger exists; it spends nothing.
 *   2 pips — the ordinary ceiling floor holds at 1.25x instead of bleeding
 *            back to MAX_SPEED (the permission a rally earned sticks around
 *            instead of evaporating on the next tick).
 *   3 pips — Hyper is available at a 5-link chain instead of 7.
 *
 * What the pips deliberately do NOT buy: speed. No pip grants velocity. The
 * ledger is a permission economy — it opens the door a little wider and keeps
 * the door open a little longer. Velocity is still earned the same way it
 * always was: banks, cuts and the physics of the arena.
 *
 * Decay: one pip withers every 14 s without a fill (840 ticks at 60 Hz).
 * Pips are not consumed by entering Hyper — the reward is the relaxation
 * itself, and a spent streak ends Hyper anyway.
 *
 * Pure module: no physics, no DOM, no store. The run holds the state object;
 * the shell decides how to draw it.
 */

export const MOMENTUM = Object.freeze({
  max: 3,
  /** One pip withers every 14 s without a fill. */
  decayTicks: 840,
  /** A cut counts as "at pace" at >= 60% of the ordinary launch limit
   *  (25.2 px/tick — a dash or a rally, never a falling body). */
  paceRatio: 0.6,
  /** Two or more pips hold the ordinary ceiling floor at 1.25x MAX_SPEED. */
  ceilingBoost: 1.25,
  /** Three pips bring the Hyper entry gate down to this chain length. */
  hyperChain: 5,
  /** Pips required for the relaxed Hyper gate. */
  fullPips: 3,
  /** Arrival speed where the high-speed rebound curve starts to diminish. */
  reboundAt: 160,
  /** Maximum bonus below the diminishing-speed threshold. */
  reboundBonus: 0.35,
});

export function createMomentum() {
  return { count: 0, idle: 0, total: 0 };
}

/** Advance the decay clock. Inactive ticks (menus, pause) do not wither pips. */
export function stepMomentum(state, { dt = 1, active = true } = {}) {
  if (!active) return state;
  const time = Number.isFinite(dt) ? Math.max(0, Math.min(1, dt)) : 0;
  if (!time) return state;
  if (state.count <= 0) {
    state.idle = 0;
    return state;
  }
  state.idle += time;
  while (state.idle >= MOMENTUM.decayTicks && state.count > 0) {
    state.idle -= MOMENTUM.decayTicks;
    state.count -= 1;
  }
  return state;
}

/** One fill. The caller decides what deserves a pip; this enforces the cap
 *  and refreshes the decay clock. */
export function gainMomentum(state, source = 'cut') {
  if (!state) return state;
  state.count = Math.min(MOMENTUM.max, state.count + 1);
  state.idle = 0;
  state.total += 1;
  return state;
}

/** The ceiling multiplier the ledger holds open. 1x below two pips. */
export function pipCeilingScale(count) {
  return (count ?? 0) >= 2 ? MOMENTUM.ceilingBoost : 1;
}

/** The chain length that unlocks Hyper right now. `base` is HYPER.chain —
 *  passed in so this module never has to know run.js's constants. */
export function hyperChainFor(count, base = 7) {
  return (count ?? 0) >= MOMENTUM.fullPips ? MOMENTUM.hyperChain : base;
}

/**
 * Return the rebound multiplier paid for an arrival at a rail.
 *
 * Below the high-speed threshold the full 1.35x ceiling is available. Above
 * it, the excess is deliberately diminished: at 320 px/tick the multiplier is
 * 1.175 rather than another flat 1.35x kick. This keeps a fast bank exciting
 * without turning consecutive wall contacts into a motor.
 */
export function diminishingRebound(arrival, {
  threshold = MOMENTUM.reboundAt,
  bonus = MOMENTUM.reboundBonus,
} = {}) {
  const speed = Number.isFinite(arrival) ? Math.max(0, arrival) : 0;
  const edge = Number.isFinite(threshold) && threshold > 0 ? threshold : MOMENTUM.reboundAt;
  const extra = Number.isFinite(bonus) ? Math.max(0, bonus) : MOMENTUM.reboundBonus;
  return 1 + extra * Math.min(1, edge / Math.max(edge, speed));
}

// Descriptive aliases keep the pure rule easy to discover from tuning tools.
export const reboundScale = diminishingRebound;
export const diminishedRebound = diminishingRebound;
