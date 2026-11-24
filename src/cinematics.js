/**
 * CHUNK 6A: THE TWO CUTSCENES, AS DATA.
 *
 * Pure module — the beat tables for the cold open (§3) and the SHATTER
 * cinematic (§5.4). Painters live in the art engine keyed off the beat id;
 * timing/skip/reduced-motion live in cutscene.js. The chips are declared
 * here so the chip budget is auditable by test.
 *
 * Chip budget (§4): the cold open spends exactly two — `CUT.` and `CUT
 * THE WORLD.`; the SHATTER cinematic spends exactly one — `IT HOLDS.`
 * Reduced motion: ticks scale ×0.6, flash beats halve amplitude, no dolly.
 */
export const TPS = 60;

/** §3 — the 4-second cold open. First run of a session only. */
export const COLD_OPEN_BEATS = Object.freeze([
  // 0.0–0.8s — black. Two eyes open, slowly. Sparks fall.
  { id: 'cold-dark', ticks: 48, lockInput: true },
  // 0.8–1.6s — the Watcher ignites; the seam breathes below it.
  { id: 'cold-watcher', ticks: 48, lockInput: true },
  // 1.6–2.6s — the world tears. White-amber crack; shards like snow.
  { id: 'cold-tear', ticks: 60, lockInput: true },
  // 2.6–3.3s — the pad slams forward; three rack Fangs collinear.
  { id: 'cold-fangs', ticks: 42, lockInput: true, chip: { text: 'CUT.', at: 0 } },
  // 3.3–4.0s — ready-cam settles; the HUD fades in piece by piece.
  { id: 'cold-settle', ticks: 42, lockInput: true, chip: { text: 'CUT THE WORLD.', at: 0 } },
]);

/**
 * §5.4 — the SHATTER cinematic (~4.2s). Input locks through the dolly
 * (3.0s); the release beat is free — control returns with zero warning.
 * `rung` escalates the show only (more shards / deeper core), never the
 * rules: rung = 1 + shatters already spent this run.
 */
export const SHATTER_BEATS = Object.freeze([
  // 0.00–0.10s — absolute freeze. The mask snaps its head toward you.
  { id: 'shatter-freeze', ticks: 6, lockInput: true },
  // 0.10–0.45s — singularity opens at the chest. The world bends.
  { id: 'shatter-core', ticks: 21, lockInput: true },
  // 0.45–0.85s — white-amber crack sweep; shards lift in rings.
  { id: 'shatter-crack', ticks: 24, lockInput: true },
  // 0.85–1.60s — the sky opens. 12–16 shards settle and STAY.
  { id: 'shatter-sky', ticks: 45, lockInput: true },
  // 1.60–2.20s — borders ignite clockwise; aurora; ember rain.
  { id: 'shatter-borders', ticks: 36, lockInput: true },
  // 2.20–3.00s — the world, not the cube, is the subject. Spine bursts.
  { id: 'shatter-dolly', ticks: 48, lockInput: true },
  // 3.00–4.20s — control returns. One chip. Silence for three seconds.
  { id: 'shatter-release', ticks: 72, lockInput: false, chip: { text: 'IT HOLDS.', at: 0 } },
]);

/** Ticks the input stays locked for a run (i.e. through the dolly). */
export function lockTicks(beats, reducedMotion = false) {
  const scale = reducedMotion ? 0.6 : 1;
  return beats
    .filter((b) => b.lockInput)
    .reduce((sum, b) => sum + Math.max(1, Math.round(b.ticks * scale)), 0);
}

/** Every chip a beat table spends, in order. The budget, made auditable. */
export function chipBudget(beats) {
  return beats.filter((b) => b.chip).map((b) => b.chip.text);
}
