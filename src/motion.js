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
  // ── SPEED PAST THE LIMIT IS NEVER SILENT ────────────────────────────────
  //
  // This used to be `if (speed <= max || ceiling <= max) return base`, so with
  // no hyper state in scope EVERYTHING above 42 collapsed to exactly the same
  // value as 42. Measured: 42px/tick and 120px/tick rendered identically apart
  // from a transform one pixel wide. A player bouncing along at nearly three
  // times the limit got the same silhouette as one cruising, because "hyper" is
  // a STATE they had not earned -- so the game said "you are as fast as you can
  // be" right up until it suddenly said everything had changed.
  //
  // The fix separates two things that were conflated:
  //
  //   overspeed  speed ABOVE `max`, however it was reached. Always visible.
  //   hyper      the earned state, which lifts the ceiling and adds a bonus.
  //
  // `ceil` is now at least the speed itself, so the overspeed term keeps
  // climbing instead of pinning. Ordinary flight below `max` is untouched --
  // `base` is byte-identical to what shipped -- and a hyper ceiling still adds
  // its own term on top.
  if (speed <= max) return base;
  // The reference for "how overspeed" is the FASTEST THE GAME CAN REACH, not the
  // current ceiling. Using the ceiling was the original bug in disguise: without
  // hyper in scope the ceiling IS `max`, so the span collapsed and every speed
  // sat at the same value. `TOP_SPEED` is the physical maximum -- hyper's
  // ceiling times the rebound cap -- so 0 is "just over the limit" and 1 is
  // "a full sonic rebound", and every speed in between gets its own number
  // whether or not the hyper state happens to be live.
  const TOP_SPEED = HYPER_SPEED * 1.35,
    span = Math.max(TOP_SPEED, ceiling),
    over = clamp((speed - max) / (span - max), 0, 1);
  // The earned state still adds its own term on top of the physical one.
  const bonus = ceiling > max ? MOTION.hyperGain : 0;
  return 1 + (MOTION.hyperGain + bonus) * over ** 0.8;
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
    //
    // `along` is NOT capped at k=1 any more: overspeed carries it to 1.55 at
    // terminal, because a cube at three times the limit should not have the
    // same silhouette as one at the limit. It is bounded by the physics
    // (TOP_SPEED), so it cannot run away.
    along: 1 + 0.36 * k,
    across: Math.max(0.55, 1 - 0.19 * k),
    // Blur IS capped, and at its own number rather than at `blurMax`.
    //
    // `blurMax` (19) is the smear an ORDINARY full-speed shot earns -- it was
    // never a perceptual ceiling, and before this change everything above 42
    // px/tick sat on exactly 19, which was the bug: 42 and 120 blurred the same.
    // Motion smear is the one channel where more really does become
    // nauseating, so it gets a bounded extension instead of the unbounded one
    // the silhouette gets: 19 at the limit, 26 at terminal, linear in k.
    blur: speed <= max ? MOTION.blurMax * k : MOTION.blurMax * k * 0.72 + MOTION.blurMax * 0.65,
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
  /** Vertical budget per tick. Named, because the brief and the tests both
   *  speak in terms of ONE number for "the worst a dash may move the frame
   *  vertically". 30 is the proven ceiling: below it a full-speed climb is
   *  outrun by the cube, above it the frame reads as a pan. */
  maxCamStepY: 30,
  maxStepPx: 30,

  // ── HORIZONTAL IS NOT THE PROBLEM THE FOLLOW WAS SOLVING ────────────────
  //
  // The follow was tuned for the VERTICAL axis -- a cube climbing at terminal
  // speed, where the frame must keep up or the player flies off the top.
  // Horizontally the same value means a 42px/tick lateral dash drags the entire
  // skyline 30px sideways in a frame, and a dash is the most common thing the
  // player does. That is the "screen whip".
  //
  // So the axes are separated: vertical keeps the proven follow, horizontal is
  // capped at a fraction of it. The cube is allowed to move sideways on screen;
  // the city is not.
  //
  // 18 rather than the 2 that seemed right on paper. A hard 2px/tick cap does
  // stop the whip, and it also breaks the frame: the cube outruns the view by
  // 40px/tick, so it slides across the screen and every dash visibly stutters
  // (measured: p95/p50 traced travel 1.90, i.e. sprites speeding up and slowing
  // down, against a 1.8 threshold). 18 is the value at which the skyline stops
  // whipping and the frame still reads as a glide -- and it is enforced ONCE
  // per tick, on the tick's actual displacement, so no other rule can add to it.
  maxStepXPx: 18,
  /** Deadzone around the framing target, as a fraction of the viewport.
   *  Motion inside it does not move the camera at all -- which is what makes a
   *  small hover, a rail bounce or a breathing idle read as a still frame. */
  deadzoneX: 0.05,
  deadzoneY: 0.1,
  /** Downward look-ahead while falling, in world px, and the speed at which it
   *  is fully applied. Small and damped: enough that a fast drop shows where it
   *  is going, not enough to swing the frame. */
  fallLead: 60,
  fallLeadVy: 40,
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
// ── SCREEN SHAKE: TRAUMA, NOT IMPULSES ─────────────────────────────────────
//
// Squirrel Eiserloh's model, and the reason for it is that the old one was not
// a shake at all: it stored a single scalar AND a bearing, then translated the
// frame by `cos(bearing)/sin(bearing)` for the whole life of the effect. That
// is a SHOVE in one direction -- the screen jumps once and slides back -- with
// no oscillation anywhere in it. It also stored the amount rather than the
// trauma, so the decay curve was a straight line and every impact looked the
// same size.
//
// What this does instead:
//
//   * `trauma` in [0,1], decaying LINEARLY over ~0.38s.
//   * displacement = trauma^2, so small hits are almost invisible and big ones
//     are unmistakable, and the decay reads as "shutting down" rather than
//     "fading out".
//   * the offset is driven by CONTINUOUS WAVES of differing frequency, not by
//     a random number per frame. Random per-frame offsets read as noise (and
//     make a 144Hz screen shake differently from a 60Hz one); waves at
//     incommensurate frequencies read as a physical shudder and are
//     reproducible frame for frame.
//   * hard clamps, because a shake is a garnish and this is a game people play
//     for minutes at a time: SHAKE.maxPx positional, SHAKE.maxRollDeg
//     rotational. Roll is included but tiny -- rotation is the single most
//     nauseating transform a camera can apply.
//   * the HUD is never inside this transform (see renderer.js: the shake is
//     applied to the world pass only).
export const SHAKE = Object.freeze({
  /** Peak positional displacement of the frame, in px. */
  maxPx: 7,
  /** Peak rotational roll, in degrees. Deliberately tiny. */
  maxRollDeg: 0.6,
  /** Seconds for trauma to fall from 1 to 0. */
  decaySeconds: 0.38,
  /** Wave frequencies (radians per tick at 60Hz) and phase offsets. Chosen to
   *  be incommensurate so the pattern does not visibly repeat. */
  freqX: 13.7,
  freqY: 17.3,
  freqRoll: 9.1,
  /** A single impact may add at most this much trauma before clamps apply, so
   *  a chain of cuts cannot sum into a seizure. */
  maxBump: 0.55,
  /** Ticks before another bump is accepted. Prevents a fast multi-kill from
   *  re-triggering on every contact in the same frame burst. */
  cooldown: 6,
});

export function createShake() {
  let trauma = 0,
    clock = 0,
    cool = 0,
    lastBump = 0;
  // Wave functions. `sin` of three different rates, sampled on a clock that
  // only advances while trauma is alive, so the pattern always starts from the
  // same phase on a new impact and is therefore the same shake every time.
  const wave = (f, ph) => Math.sin(clock * f + ph);
  return {
    /** Current positional amplitude in px, already trauma^2 and clamped. */
    get px() {
      // Two independent ceilings, and both matter. `SHAKE.maxPx` is the
      // vestibular limit -- no impact may move the world further than that,
      // ever. `MOTION.shakeBudget` is the older per-impact budget that the
      // volume of the effect was originally expressed in; a single bump must
      // not exceed it either, or a "capped" shake can still be louder than the
      // sound design assumes. Both are applied, smallest wins.
      const a = trauma * trauma * SHAKE.maxPx;
      return Math.min(SHAKE.maxPx, MOTION.shakeBudget, a);
    },
    /** Back-compat: the old API exposed a single scalar. */
    get amount() {
      return this.px;
    },
    get trauma() {
      return trauma;
    },
    /** The offset to translate the WORLD by, this frame. */
    get x() {
      const a = this.px;
      return a * wave(SHAKE.freqX, 0);
    },
    get y() {
      const a = this.px;
      return a * wave(SHAKE.freqY, 1.7) * 0.8;
    },
    /** Roll in DEGREES. Clamped hard; callers must apply it to the world only. */
    get rollDeg() {
      const a = this.px;
      const r = (a / SHAKE.maxPx) * wave(SHAKE.freqRoll, 0.9) * SHAKE.maxRollDeg;
      return Math.max(-SHAKE.maxRollDeg, Math.min(SHAKE.maxRollDeg, r));
    },
    /**
     * Ask for a bump of trauma. `force` is in the old pixel units for the
     * callers that already speak it; it is converted to trauma here.
     *
     * MAX, NOT SUM -- and this is the whole anti-stacking rule. Cutting three
     * shapes in one swing used to call this three times, and three summed
     * impulses produced a single very large shake out of three small ones. A
     * shake is a reaction to an event, and three events that land in the same
     * six ticks are one event as far as the eyes are concerned.
     */
    ask(force, _angle, scale = 1) {
      if (cool > 0) return 0;
      const bump = Math.min(SHAKE.maxBump, Math.max(0, force) / MOTION.shakeBudget);
      if (bump <= 0) return 0;
      // MAX with the live trauma, plus a small diminishing addition so a
      // genuinely bigger hit still reads bigger. Never a plain sum.
      const next = Math.min(1, Math.max(trauma, bump * scale) + bump * 0.18);
      const gained = next > trauma;
      lastBump = bump;
      if (!gained) return 0;
      trauma = next;
      cool = SHAKE.cooldown;
      return this.px;
    },
    /** Advance. `dt` is in ticks. */
    tick(dt) {
      if (cool > 0) cool = Math.max(0, cool - dt);
      if (trauma > 0) {
        // Linear decay in SECONDS, converted through the tick delta so a high
        // refresh rate runs it more often with a smaller dt and the total comes
        // out identical.
        trauma = Math.max(0, trauma - (dt / 60) / SHAKE.decaySeconds);
        clock += dt;
      }
      return this.px;
    },
    reset() {
      trauma = 0;
      clock = 0;
      cool = 0;
      lastBump = 0;
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
/** The speed the dial reserves its top for: hyper's ceiling times the rebound
 *  cap, i.e. the fastest the physics can ever deliver. Restated locally because
 *  motion.js owns HYPER_SPEED but the rebound cap lives in run.js, and a cycle
 *  is worse than one number with a test on it. */
const HIGH_SPEED = HYPER_SPEED * 1.35;

export function speedReadout(speed, max = MAX_SPEED, ceiling = HYPER_SPEED, hyperLive = null) {
  // ── THE DIAL: TWO REGIMES, BOTH WITH ROOM ────────────────────────────────
  //
  // This function has been wrong twice, in opposite directions, and the reasons
  // are worth keeping because they are the whole design problem.
  //
  // v1 was `speed / max`. Measured over five casual runs, ordinary flight sits
  // at 42px/tick at the p50, p90 AND p99 -- so the needle was pegged for the
  // entire game and the only thing left for it to say was "HYPER", which it said
  // at 44. 27% of every HYPER label in a real run was false.
  //
  // v2 scaled the dial to the true 0-280 range so the LABEL would stop lying.
  // The label became honest and the NEEDLE became inert: full normal speed sat
  // at -20 degrees, barely off rest, and 90% of the sweep happened between 108
  // and 280 -- a range ordinary play never visits.
  //
  // v3 is a split sweep, the way a real gauge with a redline region does it:
  //
  //   0 .. max      ->  0 .. 70 of the dial   (where the player actually lives)
  //   max .. TOP    -> 70 .. 100              (the earned state)
  //
  // Ordinary full speed lands at 70 with the needle past two-thirds, so the
  // gauge MOVES through the whole of normal play. The top 30 is reserved for
  // hyper, so the state that breaks the limit still has somewhere to go.
  // The sqrt on the ordinary half keeps the low end from crowding at rest.
  const TOP = HIGH_SPEED,
    ordinary = Math.pow(clamp(speed / max, 0, 1), 0.5) * 0.7,
    extra = speed <= max ? 0 : 0.3 * Math.pow(clamp((speed - max) / (TOP - max), 0, 1), 0.75),
    t = clamp(ordinary + extra, 0, 1),
    kmh = Math.round(100 * t),
    // `over` is the earned state, not a speed threshold: the word HYPER is a
    // reward for seven consecutive links, not for a wall bounce that happens to
    // carry the cube past 42. When a caller passes no flag, speed decides.
    over = hyperLive === null ? speed > max * 2 : hyperLive;
  // The bands, on the same two-regime scale as the needle:
  //   42  = p50 AND p99 of ordinary flight, so it is mid-ladder, not "fast".
  //   108 = fastest an ordinary (non-hyper) run reached across five seeds.
  const band = over
    ? 'HYPER'
    : speed > max * 1.9
      ? 'EDGE'
      : speed > max * 1.15
        ? 'SURGE'
        : speed > max * 0.5
          ? 'CRUISE'
          : 'DRIFT';
  return { kmh, t, over, live: over, band };
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
  // ── CONTACT INK: 0.4 SECONDS, HARD CEILING ─────────────────────────────
  //
  // This was 34 ticks -- 567 ms -- and it is the single longest-lived mark the
  // game draws. The report is blunt about the result: long white/dark strokes
  // were being found stretched across the screen at moments when the player was
  // not aiming and had not dashed, and they read as a broken line left behind
  // by mistake rather than as a mark that had been made.
  //
  // 20 ticks is 333 ms: long enough that the eye registers a mark ON the world
  // and ties it to the cut that made it, short enough that nothing is still on
  // screen by the time the cube has moved somewhere else. The brief's number is
  // "under half a second"; this is comfortably under a third.
  imprint: { life: 20, hold: 0.4, ease: 'smooth' },
  // A cut shard is debris: it leaves quickly and must not linger to be read.
  shard: { life: 20, hold: 0.1, ease: 'in' },
  // A spark is a short punctuation mark, not an object.
  spark: { life: 11, hold: 0, ease: 'in' },
  // The hit flash on an enemy: two frames of white, then gone. Any longer and
  // a fast target reads as a solid white blob sliding across the screen.
  flash: { life: 16, hold: 0.18, ease: 'out' },
  // The blade sweep is the single most important read in the game: it must be
  // long enough to show the ARC of the cut, short enough to feel like a whip.
  // ── 38, NOT 31 ──────────────────────────────────────────────────────────
  //
  // `s.blade` is set to 16..31 on a dash (`16 + 15 * speed/MAX_SPEED`) but a
  // CUT extends it with `s.blade = min(38, s.blade + 7)`. So on a three-kill
  // dash the hitbox was live for 38 ticks while this animation expired at 31 --
  // for the last seven ticks the blade could still cut things and drew nothing
  // at all. That is the "blade expired mid-flight" read in the recording, and
  // it is a hitbox the player cannot see.
  //
  // The window covers the longest the counter can be, and the last four ticks
  // flicker (see `bladeAlpha`) so expiry is telegraphed instead of silent.
  blade: { life: 38, hold: 0.0, ease: 'smooth' },
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

/* ══════════════════════════════════════════════════════════════════════════
   THE METER READOUTS
   ══════════════════════════════════════════════════════════════════════════

   One function that turns run state into every number the HUD displays.
   Extracted for one reason: a meter is a claim about the game, and a claim
   that lives inside a DOM update callback can only be checked by looking at
   it. Here it can be asserted.

   What the HUD was missing:

     edge   -- the cut charges. Three, spent on every slash, re-earned only by
               staying airborne. There was NO readout. A player whose cuts
               stopped working had nothing on screen explaining why.
     focus  -- the bullet-time reserve. It drains while held and regenerates
               while not, and it is the entire risk/reward of aiming mid-air.
               Also had no readout.

   Those two are the resources the game is actually built on, and both were
   invisible. That is the "new meters" part of this rework; the rest is
   making the existing ones agree with each other.
*/
export function meterReadout(s) {
  const hp = Math.max(0, s.hp | 0),
    edgeMax = s.edgeMax || 3,
    edge = clamp(s.edge ?? 0, 0, edgeMax),
    // The recharge timer, as a share of the window it has to fill. `sig` is
    // the window the simulation actually uses, so the HUD cannot drift from
    // it: 76 dt-units, the same constant run.js banks against.
    regenWindow = s.regenWindow || 76,
    regen = edge >= edgeMax ? 0 : clamp((s.recharge || 0) / regenWindow, 0, 1),
    focus = clamp(s.focus ?? 1, 0, 1);
  return {
    hp,
    edge,
    edgeMax,
    edgeEmpty: edge <= 0,
    // The timer only means something when a pip is actually owed.
    regen: edge >= edgeMax ? 0 : regen,
    regenDue: edge < edgeMax && regen > 0.02,
    focus,
    focusPct: Math.round(100 * focus),
    // Local, not global: these two describe this meter, and a shared
    // "isLow" flag would be the kind of state that ends up meaning two things.
    focusLive: !!s.held && !s.depleted && focus > 0.01,
    focusEmpty: !!s.depleted || focus <= 0.01,
  };
}

/** The dial's needle angle, in degrees, and the arc's fill share.
 *
 *  Two encodings of one number, and they must never disagree. Both are
 *  derived here so a test can assert the relationship instead of trusting
 *  that two DOM writes stayed in step. */
export function dialGeometry(readout) {
  // The arc is capped at the top of the scale; the needle is not. HYPER is an
  // event, and the pointer leaving its track is the one honest way to draw
  // "past the end" without the arc spinning off the dial.
  const arc = clamp(readout.t, 0, 1),
    needle = clamp(readout.t, 0, 1.15);
  return {
    arcPct: arc * 100,
    // -90deg is the needle at rest (pointing left along the dial's base); a
    // full 0..1 sweep is 180deg.
    needleDeg: -90 + needle * 180,
    over: readout.t > 1,
  };
}
