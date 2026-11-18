import { clamp } from './levels.js';

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
  // Maximum blur length in px at terminal speed, along the travel axis.
  blurMax: 26,
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
  follow: 0.17,
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
export function speedRamp(speed, max = 35) {
  const t = clamp(speed / max, 0, 1);
  return clamp((t - MOTION.blurFrom) / (1 - MOTION.blurFrom), 0, 1);
}

/** Blur/stretch along the travel axis, from one speed number.
 *  Returns { along, across, blur } where `along` is the length multiplier,
 *  `across` the width multiplier and `blur` the smear length in px. */
export function stretchFor(speed, max = 35) {
  const t = speedRamp(speed, max);
  return {
    along: 1 + 0.34 * t,
    across: 1 - 0.16 * t,
    blur: MOTION.blurMax * t ** 1.4,
  };
}

/** The camera's lean vector. Zero inside the dead zone, and only above
 *  `leanFrom` so a gentle drift never moves the lens. */
export function leanFor(vx, vy, max = 35) {
  const speed = Math.hypot(vx, vy);
  if (!speed) return { x: 0, y: 0 };
  const t = clamp((speed / max - MOTION.leanFrom) / (1 - MOTION.leanFrom), 0, 1);
  const k = (MOTION.leanMax * t ** 1.6) / (speed || 1);
  return { x: vx * k, y: vy * k };
}

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
export function speedReadout(speed, max = 35) {
  const t = clamp(speed / max, 0, 1);
  const kmh = Math.round(100 * Math.pow(t, 0.82));
  return {
    kmh,
    t,
    band: kmh > 92 ? 'REDLINE' : kmh > 74 ? 'SURGE' : kmh > 46 ? 'CRUISE' : 'DRIFT',
  };
}

/** Blur is never applied to a hostile shape. Exported so a test can assert
 *  the guarantee rather than trusting a comment. */
export function enemyIsSharp(motion) {
  return !motion || MOTION.enemyBlur === 0;
}
