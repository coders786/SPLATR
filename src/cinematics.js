/**
 * CHUNK 6A: THE STORY CUTSCENES, AS DATA.
 *
 * Pure module — the beat tables for the cold open (§3), sector crossings, and
 * the SHATTER cinematic (§5.4). Painters live in the art engine keyed off the beat id;
 * timing/skip/reduced-motion live in cutscene.js. The chips are declared
 * here so the chip budget is auditable by test.
 *
 * Chip budget (§4): the cold open spends exactly two — `CUT.` and `CUT
 * THE WORLD.`; the one mid-wave pulse spends `LET IT PASS.`; the SHATTER
 * cinematic spends exactly one — `IT HOLDS.` Reduced motion: ticks scale ×0.6,
 * flash beats halve amplitude, no dolly.
 */
export const TPS = 60;

/** §3 — the 2.4-second cold open. First run of a session only. */
export const COLD_OPEN_BEATS = Object.freeze([
  // 0.0–0.2s — the hook: two eyes snap open before the player can get bored.
  { id: 'cold-dark', ticks: 12, lockInput: true },
  // 0.2–0.7s — the Watcher ignites; the seam breathes below it.
  { id: 'cold-watcher', ticks: 30, lockInput: true },
  // 0.7–1.4s — the world tears. White-amber crack; shards like snow.
  { id: 'cold-tear', ticks: 42, lockInput: true },
  // 1.4–2.0s — the pad slams forward; three rack Fangs drop into the action.
  { id: 'cold-fangs', ticks: 36, lockInput: true, chip: { text: 'CUT.', at: 0 } },
  // 2.0–2.4s — control returns while the last image is still fading.
  { id: 'cold-settle', ticks: 24, lockInput: false, chip: { text: 'CUT THE WORLD.', at: 0 } },
]);

/**
 * A sector crossing is a one-second visual sentence, not another briefing
 * panel. It has four jobs in order: acknowledge the cut, reveal the seam,
 * move the room, hand back control. The handoff begins before the last ember
 * disappears so the player never waits for a title card to finish.
 */
export const SECTOR_BEATS = Object.freeze([
  { id: 'sector-locks', ticks: 10, lockInput: true },
  { id: 'sector-seam', ticks: 20, lockInput: true },
  { id: 'sector-rise', ticks: 20, lockInput: true },
  { id: 'sector-release', ticks: 10, lockInput: false },
]);

/** Add the current wave's one highlighted story line without changing the
 * reusable shot order. The base table stays silent for timing and painter
 * tests; the shell supplies the chapter-specific chip at the seam shot. */
export function sectorBeats(chip = '') {
  const text = String(chip || '').trim();
  if (!text) return SECTOR_BEATS;
  return Object.freeze(SECTOR_BEATS.map((beat, index) => index === 1
    ? Object.freeze({ ...beat, chip: { text, at: .2 } })
    : beat));
}

/**
 * The one mid-wave story pulse is deliberately not another stop-and-watch
 * panel. It is a one-second, nonblocking visual demonstration triggered by the
 * first wave's real midpoint formation. The Pulse and the Watcher remain
 * legible while the formation stays live beneath it.
 */
export const MID_WAVE_BEATS = Object.freeze([
  { id: 'mid-wave-signal', ticks: 10, lockInput: false },
  { id: 'mid-wave-teach', ticks: 32, lockInput: false },
  { id: 'mid-wave-return', ticks: 18, lockInput: false },
]);

export function midWaveBeats(chip = '') {
  const text = String(chip || '').trim();
  if (!text) return MID_WAVE_BEATS;
  return Object.freeze(MID_WAVE_BEATS.map((beat, index) => index === 1
    ? Object.freeze({ ...beat, chip: { text, at: .15 } })
    : beat));
}

/**
 * §5.4 — the SHATTER cinematic (2.5s). Input locks through the dolly
 * (2.0s); the release beat is free while the afterimage finishes. `rung`
 * escalates the show only (more shards / deeper core), never the rules:
 * rung = 1 + shatters already spent this run.
 */
export const SHATTER_BEATS = Object.freeze([
  // 0.00–0.10s — absolute freeze. The mask snaps its head toward you.
  { id: 'shatter-freeze', ticks: 6, lockInput: true },
  // 0.10–0.35s — singularity opens at the chest. The world bends.
  { id: 'shatter-core', ticks: 15, lockInput: true },
  // 0.35–0.70s — white-amber crack sweep; shards lift in rings.
  { id: 'shatter-crack', ticks: 21, lockInput: true },
  // 0.70–1.20s — the sky opens. 12–16 shards settle and STAY.
  { id: 'shatter-sky', ticks: 30, lockInput: true },
  // 1.20–1.60s — borders ignite clockwise; aurora; ember rain.
  { id: 'shatter-borders', ticks: 24, lockInput: true },
  // 1.60–2.00s — the world, not the cube, is the subject. Spine bursts.
  { id: 'shatter-dolly', ticks: 24, lockInput: true },
  // 2.00–2.50s — control returns while the last light clears.
  { id: 'shatter-release', ticks: 30, lockInput: false, chip: { text: 'IT HOLDS.', at: 0 } },
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

/**
 * The pacing contract is public so a future art pass cannot quietly add a
 * second of dead air. The release window is deliberately part of the plan:
 * control returns during the final image instead of after it.
 */
function pacingOf(beats) {
  const totalTicks=beats.reduce((sum,beat)=>sum+Math.max(1,Math.round(beat.ticks)),0),lockedTicks=lockTicks(beats);
  return Object.freeze({
    totalTicks,
    lockedTicks,
    releaseTicks:totalTicks-lockedTicks,
    totalSeconds:totalTicks/TPS,
    lockedSeconds:lockedTicks/TPS,
  });
}

export const CUTSCENE_PACING = Object.freeze({
  coldOpen:pacingOf(COLD_OPEN_BEATS),
  sector:pacingOf(SECTOR_BEATS),
  midWave:pacingOf(MID_WAVE_BEATS),
  shatter:pacingOf(SHATTER_BEATS),
});
