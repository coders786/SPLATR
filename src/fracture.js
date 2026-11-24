/**
 * CHUNK 2: THE DIMENSION FRACTURE.
 *
 * A persistent 0-100 meter that survives restarts, menu round-trips and RUN
 * ENDED screens. It is fed by ordinary play — every cut, every cleared wave,
 * every Dimension Shatter in a breach — and it only stops at 100, the brink
 * of the Dimension Shatter event (Chunk 3).
 *
 * Pure module: no renderer, no physics, no storage access. The run holds the
 * state object, the shell decides where to persist it, the HUD decides how to
 * draw it. That split is what makes the meter headless-testable.
 */

export const FRACTURE_KEY = 'fracturePct';
export const FRACTURE_MAX = 100;

// ── TIERS ─────────────────────────────────────────────────────────────────
//
// The thresholds are the design's own: STABLE, TREMORS, FAULT LINES and
// CRITICAL COLLAPSE. Each step escalates what the arena looks like, sounds
// like and fields against the player — never the rules of one cut. Wave
// intensity lives in `encounters.js` (two bonus Fangs per tier); the rumble
// cadence in `rumble` is ticks between tremor cues (0 = silent).
export const FRACTURE_TIERS = Object.freeze([
  Object.freeze({ id: 'stable', at: 0, label: 'STABLE', rumble: 0 }),
  Object.freeze({ id: 'tremors', at: 25, label: 'TREMORS', rumble: 480 }),
  Object.freeze({ id: 'faultlines', at: 50, label: 'FAULT LINES', rumble: 240 }),
  Object.freeze({ id: 'critical', at: 75, label: 'CRITICAL COLLAPSE', rumble: 120 }),
]);

export function fractureTier(pct) {
  const p = clampPct(pct);
  let tier = 0;
  for (let i = 0; i < FRACTURE_TIERS.length; i++) if (p >= FRACTURE_TIERS[i].at) tier = i;
  return tier;
}

// ── SKY STAGES ────────────────────────────────────────────────────────────
//
// The four sky stages the brief calls for. They are NOT the same ladder as the
// tiers above: the sky begins cracking long before the warning tier does, so a
// player who watches the horizon learns the number before the HUD shows the
// word. Stages: 0 = clear plum twilight, 1 = 10%, 2 = 35%, 3 = 60%, 4 = 88%.
export const FRACTURE_SKY = Object.freeze([
  Object.freeze({ at: 0, label: 'CLEAR SKY' }),
  Object.freeze({ at: 10, label: 'HAZE' }),
  Object.freeze({ at: 35, label: 'CRACKED SKY' }),
  Object.freeze({ at: 60, label: 'SPLIT SKY' }),
  Object.freeze({ at: 88, label: 'COLLAPSE SKY' }),
]);

export function fractureSky(pct) {
  const p = clampPct(pct);
  let stage = 0;
  for (let i = 0; i < FRACTURE_SKY.length; i++) if (p >= FRACTURE_SKY[i].at) stage = i;
  return stage;
}

// ── THE GAIN LADDER ───────────────────────────────────────────────────────
//
// Per kill is small enough that the number always feels connected to play,
// and large enough that a full clear is visibly closer than it was a second
// ago. The two bonuses exist for the two deliberate acts: ending a wave and
// shattering a dimension.
export const FRACTURE_PER_KILL = 0.4;
export const FRACTURE_PER_WAVE_CLEAR = 2.5;
export const FRACTURE_PER_DIMENSION_BREAK = 6;
export const FRACTURE_PER_MONOLITH = 12;

export function clampPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= FRACTURE_MAX) return FRACTURE_MAX;
  return n;
}

export function createFractureState(initial = 0) {
  const pct = clampPct(initial);
  return { pct, gained: 0, tier: fractureTier(pct), sky: fractureSky(pct) };
}

/**
 * Feed the meter. Mutates `state` (the run's shared state object) and emits:
 *  - `fractureGain` {pct, gained, tier, sky} on every effective gain (the
 *    shell persists this to storage; it is one event per kill at worst);
 *  - `fractureTier` {tier, label} only when the TIER LADDER moves, so the
 *    shell can fire the big cue and the HUD can restyle itself.
 * Returns the summary, or null when nothing changed (already at 100).
 */
export function gainFracture(state, amount, emit = () => {}) {
  const s = state?.fracture;
  const add = Number(amount) || 0;
  if (!s || add <= 0) return null;
  const before = s.pct, beforeTier = s.tier;
  const pct = clampPct(before + add);
  if (pct === before) return null;
  s.pct = pct;
  s.gained = (s.gained || 0) + (pct - before);
  s.tier = fractureTier(pct);
  s.sky = fractureSky(pct);
  const summary = { pct, gained: s.gained, delta: pct - before, tier: s.tier, sky: s.sky };
  emit('fractureGain', summary);
  if (s.tier !== beforeTier) emit('fractureTier', { tier: s.tier, label: FRACTURE_TIERS[s.tier].label });
  return summary;
}

/** The persistence snapshot for the shell: exactly the number to write. */
export function persistFracture(state) {
  return clampPct(state?.fracture?.pct ?? 0);
}

/**
 * CHUNK 3: the SHATTER EVENT SPENDS the meter. Resets the run's meter to zero
 * (tier and sky included) and returns the pct that was spent. The event
 * itself — freeze, arena mode, hull, dash, FX — lives in the run; persisting
 * the zero is the shell's job via the emitted `shatterEvent`.
 */
export function consumeFracture(state) {
  const s = state?.fracture;
  if (!s) return 0;
  const spent = s.pct;
  s.pct = 0;
  s.gained = 0;
  s.tier = fractureTier(0);
  s.sky = fractureSky(0);
  return spent;
}
