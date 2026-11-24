/**
 * CHUNK 1 — THE HUD'S WORDS.
 *
 * Every label that reaches a player during a run is decided here, in one pure
 * file, so "is this readable at 960×540?" is a question with one answer instead
 * of six.
 *
 * What this file fixes, concretely:
 *
 *  - `2525 px/s` / `TARGET 2837+` was engineering telemetry. It is now a 0–100
 *    RUSH bar with two words on it (`RUSH`, `RUSH READY`).
 *  - `HOLD PACE` / `PACE READY` / `OVERCHARGED — LETHAL` were three names for
 *    one meter, in three corners. That is now the same bar, which says RUSH.
 *  - `SHATTER EVENT`, `FAULT LINES`, `CRITICAL COLLAPSE` described the world's
 *    condition, not the player's goal. The bar is now `BOSS CHARGE`, and the
 *    tiers are plain-English steps toward the boss.
 *  - `NO CUTS / RECHARGING` was a sentence in the far right corner about a
 *    resource the player was already staring at on their own body. Gone: the
 *    cut charges arc under the cube, and a refused click shakes the reticle.
 */

/** The three names the old HUD used for the same escalation, collapsed. */
export const RUSH_LABEL = 'RUSH';

/**
 * The merged pace/hyper readout.
 *
 * @param {Object} p live pace snapshot from `run.state.wave.pace`
 * @param {Object} [breakthrough] `run.state.breakthrough`
 * @returns {{label:string,fill:number,ready:boolean,live:boolean}}
 */
export function rushReadout(p, breakthrough = null, drive = 0) {
  const progress = Math.max(0, Math.min(1, Number(p?.progress) || 0));
  const sonic = !!breakthrough?.sonic;
  const ready = !!breakthrough?.paceReady && !breakthrough?.surgeSpent;
  const surge = Math.max(0, Number(breakthrough?.surgeTicks) || 0);
  const overdrive = (Number(drive) || 0) > 0;
  const live = sonic || surge > 0 || overdrive;
  let label = RUSH_LABEL;
  if (overdrive) label = 'OVERDRIVE';
  else if (sonic) label = 'RUSH HELD';
  else if (surge > 0) label = `RUSH ${(surge / 60).toFixed(1)}s`;
  else if (ready) label = 'RUSH READY';
  return {
    label,
    fill: ready || live ? 1 : progress,
    ready: ready || live,
    live,
  };
}

/**
 * The persistent world meter as the player's goal.
 * The internal tier ids (STABLE / TREMORS / FAULT LINES / CRITICAL COLLAPSE)
 * stay in `fracture.js` — the art and the sound still escalate by tier. What
 * the player reads is a charge toward the next boss and a plain step name.
 */
export const RANK_WORDS = Object.freeze(['CALM', 'STIRRING', 'UNSTABLE', 'COLLAPSING']);

export function bossChargeReadout(pct, tier = 0) {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  return {
    label: 'BOSS CHARGE',
    pct: `${Math.floor(n)}%`,
    tier: `NEXT BOSS · ${RANK_WORDS[Math.max(0, Math.min(RANK_WORDS.length - 1, tier | 0))]}`,
    /** Spoken form: the bar alone does not explain itself to a screen reader. */
    speech: `Boss charge ${Math.floor(n)} percent. ${RANK_WORDS[Math.max(0, Math.min(RANK_WORDS.length - 1, tier | 0))].toLowerCase()}.`,
  };
}

/** The four-second starter hint. One sentence, first kill retires it. */
export const START_HINT = 'AIM & CLICK TO CUT';
export const START_HINT_KILLS = 1;

/** The corner damage line's ceiling: four words. */
export const DAMAGE_LINE_MAX_WORDS = 4;

export function shortDamageLine(label) {
  const words = String(label || 'HIT').trim().toUpperCase().split(/\s+/);
  return words.slice(0, DAMAGE_LINE_MAX_WORDS).join(' ');
}

/**
 * The explicit guide label at the bottom edge of the arena for the starter
 * hint. A ticker, never a modal: it must not cover the field.
 */
export function hintVisible(kills, ticksSinceStart) {
  return (Number(kills) || 0) < START_HINT_KILLS && (Number(ticksSinceStart) || 0) < 480;
}
