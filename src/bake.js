/**
 * BAKED MOTION TABLES.
 *
 * The animation module computes its curves from first principles every frame --
 * `Math.pow`, `Math.sin`, `Math.exp` -- which is the right way to DESIGN a
 * curve and a wasteful way to RENDER one. The inputs are coarse: a slash is 14
 * ticks long, a direction blend is one of eight fixed poses. At that resolution
 * a table indexed by tick is not an approximation of the curve, it is the curve
 * sampled at the only points that can ever be asked for.
 *
 * So this module bakes the expensive, repeatedly-evaluated curves into flat
 * `Float64Array`s ONCE at module load. `animation.js` keeps the pure functions
 * (they are the specification, and the tests still exercise them); the renderer
 * takes the values from these tables because it is the thing running 60 times a
 * second.
 *
 * ── WHAT IS AND IS NOT BAKED ────────────────────────────────────────────────
 *
 * Baked (indexed by an integer the game can actually produce):
 *   SLASH_BY_TICK   14 rows, one per tick of a swing.
 *   LAND_BY_TICK    10 rows, one per tick of a landing recovery.
 *   DIR pose table   8 rows of 5 channels, plus a precomputed blend so a
 *                    heading between two poses is 5 lerps, not 5 lerps + atan2.
 *
 * NOT baked (continuous, no useful tick resolution):
 *   fallFor()       depends on velocity, which is a float with no ceiling.
 *   stretchFor()    same.
 *   anything whose input is a position or a speed.
 *
 * ── THE GUARANTEE ───────────────────────────────────────────────────────────
 *
 * A table is only honest if it cannot drift from the function it was baked from.
 * `bakeTables()` is exported and the test suite compares every row against a
 * live evaluation. A curve change that is not re-baked fails the test.
 */

import { SLASH, FALL, slashFor, landFor, fallFor, DIRS, TAU } from './animation.js';

/** How many floats each baked row carries. Named so the reader can index it. */
export const SLASH_ROW = Object.freeze({
  angle: 0,
  smear: 1,
  alpha: 2,
  weight: 3,
  flash: 4,
  counter: 5,
  phase: 6, // 0..3 = windup, swing, impact, settle
  width: 8, // floats per row
});

export const LAND_ROW = Object.freeze({
  wide: 0,
  tall: 1,
  t: 2,
  // How hard the frame is rung, and how settled it is. Both were added with the
  // landing's drawn impact: without them the renderer had no quantity to fade
  // the shock ring and the ground scuff on, so a landing was applied as a
  // silent scale and nothing was ever drawn.
  shock: 3,
  settle: 4,
  width: 5,
});

/** Bake the whole slash arc, one row per tick, INCLUDING the null tail. */
export function bakeSlash() {
  const n = SLASH.total;
  const out = new Float64Array(n * SLASH_ROW.width);
  for (let a = 0; a < n; a++) {
    const s = slashFor(a, 0);
    const o = a * SLASH_ROW.width;
    if (!s) {
      // -1 in the angle slot is the "no swing" sentinel; the renderer checks it
      // before touching anything else, so the remaining slots do not matter.
      out[o + SLASH_ROW.angle] = -1;
      continue;
    }
    out[o + SLASH_ROW.angle] = s.angle;
    out[o + SLASH_ROW.smear] = s.smear;
    out[o + SLASH_ROW.alpha] = s.alpha;
    out[o + SLASH_ROW.weight] = s.weight;
    out[o + SLASH_ROW.flash] = s.flash;
    out[o + SLASH_ROW.counter] = s.counter;
    out[o + SLASH_ROW.phase] =
      s.phase === 'windup' ? 0 : s.phase === 'swing' ? 1 : s.phase === 'impact' ? 2 : 3;
  }
  return out;
}

/** Bake the landing recovery, one row per tick, null sentinel included. */
export function bakeLand() {
  const n = FALL.land + 1;
  const out = new Float64Array(n * LAND_ROW.width);
  for (let a = 0; a < n; a++) {
    const l = landFor(a);
    const o = a * LAND_ROW.width;
    if (!l) {
      out[o + LAND_ROW.wide] = -1;
      continue;
    }
    out[o + LAND_ROW.wide] = l.wide;
    out[o + LAND_ROW.tall] = l.tall;
    out[o + LAND_ROW.t] = l.t;
    out[o + LAND_ROW.shock] = l.shock;
    out[o + LAND_ROW.settle] = l.settle;
  }
  return out;
}

/**
 * The fall vocabulary, sampled per integer downward speed.
 *
 * `fallFor` takes a float velocity, but a renderer never needs sub-pixel
 * resolution on a plume. Sampling every integer px/tick from 0 to `FALL_SAMPLES`
 * turns a stack of pow/sin/exponential into one index and a few reads, exactly
 * as the slash and landing tables do.
 *
 * The table spans past `FALL.plunge` (20) all the way to 120, because the whole
 * point of `rush` is that the vocabulary KEEPS CHANGING above the plunge
 * threshold -- it used to saturate at 20 and then say nothing at all.
 */
export const FALL_SAMPLES = 120;
export const FALL_ROW = Object.freeze({
  k: 0,
  rush: 1,
  lean: 2,
  stretch: 3,
  squeeze: 4,
  eyes: 5,
  scarfLift: 6,
  trail: 7,
  cels: 8,
  width: 9,
});

export function bakeFall() {
  const out = new Float64Array((FALL_SAMPLES + 1) * FALL_ROW.width);
  for (let vy = 0; vy <= FALL_SAMPLES; vy++) {
    const f = fallFor(vy);
    const o = vy * FALL_ROW.width;
    if (!f) {
      // Below the drift threshold there is no vocabulary: a null sentinel so the
      // renderer draws nothing and a gentle drop stays quiet.
      out[o + FALL_ROW.k] = -1;
      continue;
    }
    out[o + FALL_ROW.k] = f.k;
    out[o + FALL_ROW.rush] = f.rush;
    out[o + FALL_ROW.lean] = f.lean;
    out[o + FALL_ROW.stretch] = f.stretch;
    out[o + FALL_ROW.squeeze] = f.squeeze;
    out[o + FALL_ROW.eyes] = f.eyes;
    out[o + FALL_ROW.scarfLift] = f.scarfLift;
    out[o + FALL_ROW.trail] = f.trail;
    out[o + FALL_ROW.cels] = f.cels;
  }
  return out;
}

/**
 * The eight direction poses as one flat table: lean, tall, wide, scarf, eyes.
 *
 * Baking this is worth more than it looks. `moveFor` runs every frame and reads
 * five channels off two rows; flattening the objects means the hot path never
 * touches a property by name on an intermediate object.
 */
export function bakeDirections() {
  const W = 5;
  const out = new Float64Array(8 * W);
  for (let i = 0; i < 8; i++) {
    const d = DIRS[i];
    out[i * W + 0] = d.lean;
    out[i * W + 1] = d.tall;
    out[i * W + 2] = d.wide;
    out[i * W + 3] = d.scarf;
    out[i * W + 4] = d.eyes;
  }
  return out;
}

/** How many samples the direction blend table holds. 64 is one every 5.625°,
 *  and the blend is smooth enough that the error against the exact lerp is
 *  below what a 1px-wide stroke can show. */
export const DIR_LUT_N = 64;

/**
 * Bake the octant blend: for each of DIR_LUT_N sample angles, which two poses
 * are involved and how far between them. This removes `atan2`, two `Math.floor`
 * calls and a modulo from the per-frame path.
 *
 * The table stores: index (0..7), fraction (0..1). Both are exact for the
 * sample; a caller holding a continuous angle rounds to the nearest sample.
 */
export function bakeDirectionBlend(n = DIR_LUT_N) {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const turns = (t / TAU) * 8;
    const idx = ((Math.floor(turns) % 8) + 8) % 8;
    const u = turns - Math.floor(turns);
    out[i * 2] = idx;
    out[i * 2 + 1] = u;
  }
  return out;
}

/**
 * Everything, baked once. Imported as a singleton so module load pays for it
 * exactly one time -- a few thousand float writes, measured at well under a
 * millisecond.
 */
export const SLASH_TABLE = bakeSlash();
export const LAND_TABLE = bakeLand();
export const DIR_TABLE = bakeDirections();
export const BLEND_TABLE = bakeDirectionBlend();
export const FALL_TABLE = bakeFall();
