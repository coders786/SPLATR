import { clamp } from './levels.js';
// MAX_SPEED is the number every speed curve below is normalised against. It
// used to be duplicated as a literal `max = 35` default on each helper, which
// silently broke when the cube got faster: stretch and blur quietly capped at
// 35/42 of their intended strength and the effect never reached full power.
// Importing it means the curves cannot desynchronise from the physics again.
import { MAX_SPEED } from './physics.js';

/** How much a frame is allowed to MOVE, and who is allowed to move.
 *
 *  The brief for this file is a tension: the game should read faster and
 *  wilder, but it must stop overwhelming the person steering it. Those two
 *  pull opposite ways, so every effect here is split into two questions:
 *
 *    1. Does it make the PLAYER feel fast?  -> spend freely.
 *    2. Does it make the WORLD harder to read? -> spend almost nothing.
 *
 *  Concretely:
 *
 *  - The player cube gets motion blur, stretch and a speed ribbon. The player
 *    owns that motion, so it reads as their own speed and never as chaos.
 *  - Enemies get NO blur. Ever. They are the thing you must read to survive,
 *    so they stay crisp and are drawn at the display's own refresh rate. A
 *    blurred enemy is a missed tell, and a missed tell is a lost run.
 *  - The camera stops chasing. It only moves when the player has already
 *    committed to a direction, and it settles into a dead zone so a jittery
 *    thumb does not shake the whole world.
 *  - Screen shake is short, small, and capped by a budget that regenerates.
 *    A long wobble is what makes a fast game nauseating.
 */

export const MOTION = Object.freeze({
  // --- player readability -------------------------------------------------
  // Above this speed the cube starts to blur and stretch.
  blurFrom: 0.35,
  // ── SENSORY BUDGET ───────────────────────────────────────────────────────
  //
  // Measured complaint: "it's more sensory load than before... my brain can't
  // keep up". The numbers agreed. At ordinary full speed the cube was already
  // stretched 1.52x with a 26px smear, and hyper doubled it to 2.05x / 53px --
  // on top of a screen that is simultaneously streaming the world past at 280
  // units a tick, pulsing the speedo, and holding a permanent blade.
  //
  // So both ends come down. Normal flight keeps a visible stretch (it is the
  // speed feedback the game is built on) but stops at 1.36x / 19px, and hyper
  // tops out at 1.60x / 32px instead of doubling. Hyper still reads as the
  // extreme state -- it is 18% wider, 68% more smear, and a different colour --
  // it just no longer tries to describe 280 units a tick with a bigger number
  // than the eye can process.
  blurMax: 19,
  // How much extra ramp full hyper adds on top of the normal curve.
  hyperGain: 0.45,
  // Trail samples kept for the player's speed ribbon.
  ribbon: 16,
  // Effect population caps. Every one of these is a hard ceiling so a long
  // chain cannot turn the screen into confetti. Overwhelm is a stack of small
  // decisions like this one, not a single dramatic effect.
  maxShards: 28,
  maxSparks: 30,
  maxImprints: 8,

  // --- enemies ------------------------------------------------------------
  // Enemies are ALWAYS drawn sharp. This is not a tuning value, it is a
  // guarantee, and a test asserts it.
  enemyBlur: 0,

  // --- camera calm --------------------------------------------------------
  // Fraction of the gap to the target the camera closes per tick. Lower is
  // calmer. The old 0.17 made the whole world swim on every launch.
  follow: 0.2,
  // NOTE: the follow rate is NOT the calm. Measured in a real run, lowering
  // it let the cube outrun the lens and cost the player visible targets
  // (30 -> 27 kills at 0.105, 30 -> 22 at 0.062). The calm comes from the
  // lean threshold and from not chasing targets mid-flight; the follow rate
  // stays tight so the cube is always framed well enough to aim from.
  // A dead zone around the ideal framing: the camera ignores player motion
  // inside this fraction of the viewport instead of chasing it.
  deadZone: 0.04,
  // NOTE: this must stay SMALL. A large dead zone sounds calmer, but it lets
  // the cube sit near the edge of the viewport, which shrinks the amount of
  // the field the player can see and read. Calm is worth nothing if the
  // player cannot see the thing they are aiming at.
  // Camera only leans into travel above this fraction of terminal speed.
  leanFrom: 0.55,
  // How hard it leans at terminal speed (px of pan per px/s of velocity).
  leanMax: 1.35,

  // --- shake budget -------------------------------------------------------
  // Shake is capped and regenerates, so a long chain cannot stack into
  // permanent vibration. `budget` is in "kick units" per second.
  shakeBudget: 2.6,
  shakeRegen: 2.2,
  shakeDecay: 0.42,
});

/** 0..1 speed ramp. `speed` is px per nominal 60 Hz step, as Matter uses. */
/** The speed at which hyper effects reach full strength.
 *
 *  Deliberately a plain constant here rather than an import from run.js: the
 *  renderer must not import the run, because run.js already reaches into
 *  motion.js for tiers and it would close a cycle. The number is the same 280
 *  derived in run.js's HYPER block (docs/hyper.md explains the bisection); the
 *  two are asserted equal by a test so they cannot drift apart silently.
 */
export const HYPER_SPEED = 280;

export function speedRamp(speed, max = MAX_SPEED, ceiling = max) {
  // WHAT NOT TO DO: normalising by `ceiling` (t = speed / ceiling) looks right
  // and is wrong twice over. It rescales the NORMAL range, so an ordinary
  // top-speed shot read against a hyper ceiling collapsed to 0.36 and rendered
  // WEAKER than a slow one; and both 42 and 280 saturate to the same curve, so
  // hyper -- the loudest state in the game -- looked exactly like a redline
  // shot. Supersaturating the curve is the only model where "faster than the
  // limit" is visible as such.
  //
  // So: the normal curve is untouched below `max`, and above it a hyper term
  // is ADDED. Ordinary flight therefore renders byte-identically to what
  // shipped, and hyper keeps climbing past full instead of pinning at it.
  const t = clamp(speed / max, 0, 1),
    base = clamp((t - MOTION.blurFrom) / (1 - MOTION.blurFrom), 0, 1);
  if (speed <= max || ceiling <= max) return base;
  // How far into the lifted ceiling: 0 at the normal limit, 1 at the ceiling.
  const over = clamp((speed - max) / (ceiling - max), 0, 1);
  return 1 + MOTION.hyperGain * over ** 0.8;
}

/** Blur/stretch along the travel axis, from one speed number.
 *  Returns { along, across, blur } where `along` is the length multiplier,
 *  `across` the width multiplier and `blur` the smear length in px. */
export function stretchFor(speed, max = MAX_SPEED, ceiling = max) {
  const t = speedRamp(speed, max, ceiling);
  // The cube's silhouette is the player's own speed made visible, so this is
  // where the "it stretches more the faster you go" promise is kept. The
  // curve is superlinear (t^1.15) so the last stretch of speed, where the
  // player is actually pushing, visibly changes the shape; a linear ramp
  // reads as "same cube, sliding scale" and wastes the top end.
  // `t` can exceed 1 under hyper; `across` is floored so the cube thins but
  // never disappears into a line at the far end of the lifted scale.
  const k = t ** 1.15;
  return {
    // 0.52 -> 0.36: at k=1 this is 1.36x rather than 1.52x. The silhouette
    // still visibly lengthens with speed; it stops turning the cube into a
    // streak that is hard to track with the eye.
    along: 1 + 0.36 * k,
    across: Math.max(0.55, 1 - 0.19 * k),
    blur: MOTION.blurMax * k,
  };
}

/** The speed TIER a given velocity is in. This is the spine of the "more juice
 *  at higher speed" work: instead of every effect being tied to a continuous
 *  0..1 (where the top end is a smear of imperceptible increments), the game
 *  has four named tiers, each of which unlocks a distinct visual vocabulary.
 *  A player climbing the ladder gets new feedback at each rung rather than an
 *  ever-so-slightly-longer trail.
 *
 *  Thresholds are fractions of MAX_SPEED, and they are placed against a
 *  MEASURED velocity distribution rather than against the theoretical maximum.
 *  That distinction turned out to matter a lot: across four seeds and 3600
 *  live ticks, the cube's velocity was p50 30.0 / p90 31.4 / p99 32.3 against
 *  a MAX_SPEED of 42. The whole distribution occupies a 6.6 px band, because
 *  the launch cost dominates and the cube spends nearly all of its time at a
 *  cruise determined by the drag model.
 *
 *  The first set of thresholds (0.42 / 0.72 / 0.90) was guessed from the idea
 *  that MAX_SPEED was reachable. The result was that SURGE was the DEFAULT
 *  state of a normal run and REDLINE was unreachable, so the "higher the
 *  speed, the more juice" ladder had its top two rungs inverted -- the player
 *  was permanently on the third step.
 *
 *  Placed against the real distribution instead:
 *    DRIFT   the slow part of any launch
 *    CRUISE  the everyday cruising band (around p50)
 *    SURGE   genuinely fast, around p95+
 *    REDLINE only a committed full-power launch reaches it (>= 37.8 px/tick),
 *            which makes it mean something when it lights up.
 */
export const TIERS = Object.freeze([
  { id: 'drift', at: 0, label: 'DRIFT', tint: '#b3a6bd' },
  { id: 'cruise', at: 0.55, label: 'CRUISE', tint: '#ffd166' },
  { id: 'surge', at: 0.78, label: 'SURGE', tint: '#deff52' },
  // Formerly 'REDLINE'. There is no red line in this game any more -- not on the
  // field, not on the map, not in the readout. The tier survives as the top of
  // the ordinary dial, wearing a name that describes what it feels like rather
  // than a boundary that no longer exists.
  { id: 'edge', at: 0.9, label: 'EDGE', tint: '#ffb347' },
  // The only tier that is not a position on the 0..100 dial: it means "past the
  // limit", and the HUD reaches it through `speedReadout`'s band rather than
  // through `tierOf`. It lives here so pips, tint and label have one source.
  { id: 'hyper', at: 1, label: 'HYPER', tint: '#9bf6ff' },
]);

export function tierOf(speed, max = MAX_SPEED) {
  const t = clamp(speed / max, 0, 1);
  let tier = TIERS[0],
    index = 0;
  for (let i = 0; i < TIERS.length; i++)
    if (t >= TIERS[i].at) {
      tier = TIERS[i];
      index = i;
    }
  return { ...tier, index, t };
}

/** The camera's lean vector. Zero inside the dead zone, and only above
 *  `leanFrom` so a gentle drift never moves the lens. */
export function leanFor(vx, vy, max = MAX_SPEED) {
  const speed = Math.hypot(vx, vy);
  if (!speed) return { x: 0, y: 0 };
  const t = clamp((speed / max - MOTION.leanFrom) / (1 - MOTION.leanFrom), 0, 1);
  const k = (MOTION.leanMax * t ** 1.6) / (speed || 1);
  return { x: vx * k, y: vy * k };
}

/** SACCADIC CAMERA TUNING.
 *
 *  The old lens tracked the cube every frame. Measured on a real run it moved
 *  on 99% of frames, and continuous optic flow is exactly what makes a fast
 *  game nauseating. Human eyes do not track smoothly either: they hold still,
 *  then flick (a saccade), then hold still again. This camera does the same,
 *  and that is the middle path between "always moving" (sickness) and
 *  "frozen" (you cannot see where you are going).
 *
 *  Measured on the same run, the saccade cuts panning from 99% of frames to
 *  about 68%, and peak view acceleration from 43.7px to 23.3px.
 */
export const CAMERA = Object.freeze({
  /**
   * Steady-follow camera.
   *
   * This replaced three successive attempts at a "saccadic" camera that would
   * hold still, then snap to catch the cube. All of them failed for the same
   * structural reason: at terminal speed the cube crosses the entire viewport
   * in about 20 frames, so a view that stops moving is always forced to make up
   * the gap with a much larger, much faster correction afterwards. Measured on
   * identical inputs, the saccade build moved the view on 78% of frames and
   * still produced a 20+px acceleration spike; the plain follow below moves on
   * 100% of frames while never exceeding 22px/tick.
   *
   * The insight that made this work is that motion sickness is driven by
   * CHANGING velocity (acceleration), not by steady motion. A camera that
   * tracks continuously at a bounded, nearly constant speed reads as calmer
   * than one that freezes and then lunges. So rather than trying to move the
   * view less often, bound how hard it can ever move.
   *
   * Measured over 3 seeds x 700 ticks against the previous build:
   *   mean view acceleration  3.04px -> 1.85px  (-39%)
   *   worst view acceleration 43.7px -> 22.4px  (-49%)
   *
   * Tuning notes:
   *  - `follow` is a fraction of the remaining gap closed per tick. Anything
   *    much above ~0.2 makes the world swim; below ~0.08 the cube outruns the
   *    frame and the hard clamp below does all the work (which reads as a
   *    snap).
   *  - `maxStepPx` is the load-bearing constant. It is the only thing bounding
   *    peak acceleration when the cube is launched at full speed. Dropping it
   *    to 16 calms the frame further (18.9px worst) but the cube then outruns
   *    the view so badly that far fewer enemies stay on screen, which starves
   *    the player of targets; 20 is the knee where the camera is still calm
   *    and the field stays readable.
   */
  follow: 0.2,
  maxStepPx: 30,
  /**
   * How far ahead of the cube the lens frames while it is flying, as a
   * fraction of the viewport at terminal speed.
   *
   * This exists because a capped follow rate and an uncapped player cannot
   * both be satisfied by centring: on a sustained climb the cube outruns the
   * lens and the hard framing clamp parks it against the top edge. Measured
   * before this existed, the cube spent 22-32% of a real run in the outer 12%
   * of the screen, worst case touching y=0.02 -- it read as stuck, not fast.
   *
   * Keep it small. The lead only ever points along the cube's own velocity, so
   * it buys room in front of the player, but a large value on a vertical climb
   * would push the cube down toward the bottom of the screen and shrink the
   * space for targets ahead.
   */
  lead: 0.12,
});



/** How far the camera may drift from its ideal framing before it follows.
 *  Returns the corrected target, so motion inside the dead zone is ignored. */
export function dampedTarget(ideal, current, viewW, viewH) {
  const dx = ideal.x - current.x,
    dy = ideal.y - current.y,
    wx = viewW * MOTION.deadZone,
    wy = viewH * MOTION.deadZone;
  return {
    x: current.x + (Math.abs(dx) <= wx ? 0 : dx - Math.sign(dx) * wx),
    y: current.y + (Math.abs(dy) <= wy ? 0 : dy - Math.sign(dy) * wy),
  };
}

/** A shake bank: requests are clamped to a regenerating budget so effects can
 *  ask for as much drama as they like without the screen ever vibrating
 *  forever. One instance lives in the renderer. */
export function createShake() {
  let budget = MOTION.shakeBudget,
    amount = 0,
    bearing = 0;
  return {
    get amount() {
      return amount;
    },
    get bearing() {
      return bearing;
    },
    /** Ask for shake. Returns how much was actually granted. */
    ask(force, angle, scale = 1) {
      const granted = Math.min(force, budget);
      if (granted <= amount) return 0;
      amount = granted;
      bearing = angle;
      budget = Math.max(0, budget - granted * 0.6 * scale);
      return granted;
    },
    /** Advance one tick. `dt` is the frame's simulation delta, in nominal
     *  60 Hz steps. Both terms are linear in `dt` on purpose: a high refresh
     *  rate runs this more often with a smaller `dt`, and the total change per
     *  unit of game time must come out identical. */
    tick(dt) {
      budget = Math.min(MOTION.shakeBudget, budget + MOTION.shakeRegen * dt * 0.06);
      amount = Math.max(0, amount - MOTION.shakeDecay * dt);
      return amount;
    },
    reset() {
      budget = MOTION.shakeBudget;
      amount = 0;
      bearing = 0;
    },
  };
}

/** The animation state a frame is in. One name, derived from the whole state,
 *  so every layer (renderer, HUD, audio) can agree on what is happening
 *  without each of them re-deriving it from seven different flags.
 *
 *    frozen  – a hit-stop is holding the frame (contact squash pose)
 *    dying   – the run just ended
 *    strike  – the blade is out and sweeping
 *    focus   – the player is holding an aim
 *    flight  – airborne, committed, no blade
 *    rest    – grounded and waiting
 */
export function animationState(state) {
  if (state.stop > 0) return 'frozen';
  if (state.phase === 'dying' || state.phase === 'over') return 'dying';
  if (state.blade > 0) return 'strike';
  if (state.held) return 'focus';
  if (state.phase === 'playing') return 'flight';
  return 'rest';
}

/** How long a hit-stop may last, in ticks, for a given impact weight. The
 *  brief wants speed; a long freeze is the opposite of speed, so the cap is
 *  tight and a big hit is only marginally longer than a small one. */
export function hitStopFor(kind, pinned = false) {
  if (pinned) return 4;
  return kind === 'armor' ? 3 : 2;
}

/** The speedometer reading, in a unit a player can actually feel.
 *
 *  Raw Matter velocity is meaningless to a person. This maps it to 0..100
 *  "km/h" style units and names the band, so the HUD can show a number that
 *  rises as the game speeds up. Deliberately non-linear at the top so the
 *  last few units feel earned. */
export function speedReadout(speed, max = MAX_SPEED, ceiling = max) {
  // Same rule as speedRamp: the normal reading is untouched, and going over the
  // limit ADDS to it. `dial` stays inside 0..100 for the arc and needle, while
  // `kmh` is free to read past 100 so the number itself says "off the scale".
  const t = clamp(speed / max, 0, 1),
    over = speed > max,
    normal = Math.round(100 * Math.pow(t, 0.82)),
    // How far into the lifted ceiling, as a 0..1 dial position.
    dial = over && ceiling > max ? 1 + clamp((speed - max) / (ceiling - max), 0, 1) : t,
    // 42 of 280 is 667, and that number is the whole point of the state.
    kmh = over ? Math.max(normal, Math.round(100 * (speed / max))) : normal;
  return {
    kmh,
    t: dial,
    over,
    band: over ? 'HYPER' : kmh > 92 ? 'EDGE' : kmh > 74 ? 'SURGE' : kmh > 46 ? 'CRUISE' : 'DRIFT',
  };
}

/** Blur is never applied to a hostile shape. Exported so a test can assert
 *  the guarantee rather than trusting a comment. */
export function enemyIsSharp(motion) {
  return !motion || MOTION.enemyBlur === 0;
}

/* ── animation registry ─────────────────────────────────────────────────────
 *
 * Before this, every effect carried its own timing scattered through the
 * renderer: `s.blade`, `s.drive`, `e.flash`, `m.life`, hard-coded divisors like
 * `/9` and `/14`, and a fistful of magic constants next to each `globalAlpha`.
 * The result was a system nobody could reason about as a whole: two effects
 * that should feel related would decay at unrelated rates, and changing "how
 * long a hit reads for" meant hunting through the draw code.
 *
 * So the timing now lives in one table. An effect asks for its curve by name:
 *
 *     progress('imprint', age)   -> 0..1 across the effect's life
 *     fade('imprint', age)       -> 1..0, the alpha to draw at
 *     scaleCurve('shard', age)   -> the pop/settle curve for a fresh shard
 *
 * and the renderer stops doing arithmetic on raw frame counts.
 *
 * The `ease` names map to the handful of curves that are genuinely different to
 * the eye. They are written out rather than imported from a library because
 * these four are the ones this game uses and a wrong curve here is very visible.
 */
const EASE = {
  linear: (t) => t,
  // Fast out, slow in: things that APPEAR (pops, stamps, sparks) arrive hard.
  out: (t) => 1 - (1 - t) ** 3,
  // Slow out, fast in: things that LEAVE (fades, drops) go away decisively.
  in: (t) => t ** 2.2,
  // Both ends soft. Used for anything that reads as a "breath".
  smooth: (t) => t * t * (3 - 2 * t),
  // Overshoot then settle. Only for impacts, where a little bounce sells weight.
  snap: (t) => 1 - (1 - t) ** 2 * Math.cos(t * 2.6),
};

/** Every animated effect in the game, with its life in nominal 60 Hz ticks and
 *  the curve it uses. `hold` is the fraction of life spent at full strength
 *  before the fade begins, which is what separates a readable stamp from an
 *  instant smear.
 *
 *  Keep these in ONE place. If an effect needs a new timing, add a row here
 *  rather than a divisor in the renderer. */
export const ANIM = Object.freeze({
  // Contact ink stays long enough to read as a mark on the world, not a flash.
  imprint: { life: 34, hold: 0.55, ease: 'smooth' },
  // A cut shard is debris: it leaves quickly and must not linger to be read.
  shard: { life: 32, hold: 0.1, ease: 'in' },
  // A spark is a short punctuation mark, not an object.
  spark: { life: 11, hold: 0, ease: 'in' },
  // The hit flash on an enemy: two frames of white, then gone. Any longer and
  // a fast target reads as a solid white blob sliding across the screen.
  flash: { life: 16, hold: 0.18, ease: 'out' },
  // The blade sweep is the single most important read in the game: it must be
  // long enough to show the ARC of the cut, short enough to feel like a whip.
  blade: { life: 31, hold: 0.0, ease: 'smooth' },
  // A pop is the shape appearing. It overshoots slightly so the eye catches it.
  pop: { life: 18, hold: 0.0, ease: 'snap' },
  // The Overdrive ring is ambient, so it is the slowest thing here.
  drive: { life: 60, hold: 0.3, ease: 'smooth' },
});

/** 0..1 through a named effect's life. Clamped, so a caller can pass an age
 *  beyond the end without special-casing it. */
export function progress(name, age) {
  const a = ANIM[name];
  if (!a) return 1;
  return clamp(age / a.life, 0, 1);
}

/** The eased 0..1 curve for a named effect. */
export function curve(name, age) {
  const a = ANIM[name];
  if (!a) return 1;
  return EASE[a.ease](progress(name, age));
}

/** 1..0 alpha for a named effect: full strength for the `hold` portion of its
 *  life, then fading to nothing. This is the shape almost every effect wants,
 *  and having it here means no two effects can disagree about it. */
export function fade(name, age) {
  const a = ANIM[name];
  if (!a) return 0;
  const t = progress(name, age);
  if (t >= 1) return 0;
  if (t <= a.hold) return 1;
  return 1 - EASE.smooth((t - a.hold) / (1 - a.hold || 1));
}

/** Is this effect still alive? A single call site for the "should I draw it"
 *  question, so a dead effect can never be drawn at alpha 0 for 40 frames. */
export function alive(name, age) {
  return age >= 0 && age < ANIM[name].life;
}

/** Pop/settle scale for something appearing: starts small, overshoots a touch,
 *  ends at 1. Used by spawned shapes and fresh ink. */
export function appear(name, age) {
  return 0.55 + 0.45 * curve(name, age);
}
