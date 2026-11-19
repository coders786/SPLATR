/**
 * ANIMATION — anime-inspired character motion for the cube.
 *
 * Design rule for this whole module: anime motion is not MORE effects, it is
 * SHARPER effects with REAL timing. See docs/animation.md. Every curve here is
 * chosen for the way hand-drawn action is timed:
 *
 *   - wind-up before the strike, always (anticipation is the whole grammar)
 *   - the power frame arrives in 2-3 frames, then HOLDS (the "ma" beat)
 *   - recovery is slower than the attack, and eases out
 *   - squash on impact recovers with exactly ONE overshoot
 *
 * Everything is a pure function of (phase 0..1) so it can be unit-tested and so
 * it cannot drift with frame rate: the caller derives phase from ticks, and the
 * renderer blends position with `alpha` separately.
 */

export const TAU = Math.PI * 2;

/* ── easing ──────────────────────────────────────────────────────────────── */

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const lerp = (a, b, t) => a + (b - a) * t;

/** All the speed is at the START. This is the sword swing: nearly all of the
 *  travel happens in the first two frames, which is what makes an attack read
 *  as fast rather than fast-looking. */
export const easeOutQuint = (t) => 1 - Math.pow(1 - clamp01(t), 5);

/** Slow start, hard finish. Used for the wind-up, so the blade accelerates INTO
 *  its own backswing and then snaps. */
export const easeInCubic = (t) => Math.pow(clamp01(t), 3);

/** Fast start, long glide. The settle-out of a swing: the blade decelerates
 *  into its resting position rather than stopping dead. */
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);

export const easeInOutCubic = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** One overshoot, then settle. The squash recovery. A sine settle reads as a
 *  wobbling jelly; one overshoot reads as mass with momentum. */
export const easeOutElastic = (t) => {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  // ONE overshoot, then settle. The period is a third of the usual 0.42 and the
  // decay is much heavier, so the curve crosses its target exactly once. A
  // standard elastic ease oscillates three or four times, which on a squash
  // reads as jelly rather than as mass -- and this is a cube with momentum.
  const p = 0.14;
  return Math.pow(2, -14 * x) * Math.sin(((x - p / 4) * TAU) / p) + 1;
};

/** A single hard spike that decays: 1 at t=0, 0 at t=1, no tail wobble.
 *  Used for the impact frame, which must not linger. */
export const spike = (t) => {
  const x = clamp01(t);
  return x >= 1 ? 0 : Math.pow(1 - x, 2);
};

/* ── 1. THE SLASH ────────────────────────────────────────────────────────── */

/**
 * Frame layout of one swing, in ticks. Deliberately uneven: 2 frames of
 * wind-up, 4 of swing, 2 of impact hold, 6 of settle. A symmetric curve would
 * make the blade look like it is being waved rather than fired.
 */
export const SLASH = Object.freeze({
  windup: 2,
  swing: 4,
  impact: 2,
  settle: 6,
  get total() {
    return this.windup + this.swing + this.impact + this.settle;
  },
  /** How far the blade travels, in radians. Past PI so it reads as a full
   *  committed arc rather than a poke. */
  sweep: Math.PI * 1.18,
  /** How far BACK it cocks before starting, in radians. */
  cock: 0.38,
  /** Body counter-rotation during the wind-up, in radians. */
  counter: 0.24,
});

/**
 * The pose of the blade at `age` ticks into a swing.
 *
 * Returns null when the animation is over, so the caller falls back to the
 * resting blade. Every visual property the renderer needs is here and nowhere
 * else -- there is no second copy of these numbers in renderer.js.
 */
export function slashFor(age, dir = 0) {
  const a = age;
  const total = SLASH.total;
  if (!(a >= 0) || a >= total) return null;
  const { windup, swing, impact, settle } = SLASH;

  let angle, smear, alpha, weight, flash;
  if (a < windup) {
    // WIND-UP: rotate back past the start. Slow-in, so it looks loaded.
    const t = easeInCubic(a / windup);
    angle = dir - SLASH.cock * t;
    smear = 0;
    alpha = 0.55 + 0.45 * t;
    weight = 0.55 + 0.45 * t;
    flash = 0;
  } else if (a < windup + swing) {
    // SWING: the whole arc in four frames, all the speed up front.
    const t = easeOutQuint((a - windup) / swing);
    angle = dir - SLASH.cock + (SLASH.sweep + SLASH.cock) * t;
    // The smear is the swung arc itself; it peaks mid-swing and is what sells
    // the speed. This is the anime "smear frame".
    smear = Math.sin(clamp01((a - windup) / swing) * Math.PI) * 1;
    alpha = 1;
    weight = 1;
    flash = 0;
  } else if (a < windup + swing + impact) {
    // IMPACT HOLD: two flat frames. No motion at all -- the held beat is what
    // makes the speed around it feel fast.
    const t = (a - windup - swing) / impact;
    angle = dir + SLASH.sweep;
    // THE IMPACT FRAME IS A CLEAN FRAME.
    //
    // It deliberately carries much less smear than the swing peak. Anime impact
    // frames are sharp -- the smear belongs to the travel leading up to them,
    // and a smeared hold makes the hit feel soft and late. The blade stops, the
    // arc snaps to a crisp edge, and the player reads contact.
    // Ends at 0.21 so the settle can inherit it exactly. See the settle branch.
    smear = 0.42 * (1 - 0.5 * t) - 0.21 * t;
    alpha = 1;
    weight = 1;
    flash = 1 - t * 0.5;
  } else {
    // SETTLE: the arc fades from its tail while the blade drifts to rest.
    const t = clamp01((a - windup - swing - impact) / settle);
    const e = easeOutCubic(t);
    angle = dir + SLASH.sweep + 0.1 * e;
    // The settle continues from the impact frame's smear, not from the swing's.
    // It used to restart at 0.75 here, which produced a visible POP: the arc
    // cleaned up on impact and then smeared again a frame later. A fade has to
    // continue the value it inherits.
    // Inherits the impact frame's LAST value, so the fade is continuous.
    smear = (1 - e) * 0.21;
    alpha = 1 - e;
    weight = 1 - e * 0.85;
    flash = Math.max(0, 0.5 - t) * 2;
  }

  // Body counter-rotation: the cube leans AWAY from the swing while loading and
  // snaps through with it. This is the difference between "a blade appeared next
  // to a cube" and "the cube swung".
  const counter =
    a < windup ? -SLASH.counter * easeInCubic(a / windup) : a < windup + swing
      ? -SLASH.counter + SLASH.counter * 1.6 * easeOutQuint((a - windup) / swing)
      : SLASH.counter * 0.6 * (1 - clamp01((a - windup - swing) / (impact + settle)));

  return {
    /** absolute blade bearing */
    angle,
    /** 0..1, how much of the swung arc to draw as a smear */
    smear,
    alpha,
    /** blade thickness multiplier */
    weight,
    /** 0..1 white flash on the leading edge, impact frames only */
    flash,
    /** body rotation offset, radians */
    counter,
    phase: a < windup ? 'windup' : a < windup + swing ? 'swing' : a < windup + swing + impact ? 'impact' : 'settle',
    /** feet planted: no stretch while swinging, so the arc is the motion */
    t: a / total,
  };
}

/* ── 2. THE FALL ─────────────────────────────────────────────────────────── */

export const FALL = Object.freeze({
  /** Below this downward speed the cube is drifting, not falling. */
  drift: 8,
  /** At or above this it is a plunge. */
  plunge: 20,
  /** Ticks of squash after a landing. */
  land: 9,
});

/**
 * Body language of a descent, as functions of downward speed.
 *
 * Anime falling is NOT inverted stretch. It has a vocabulary: the body turns to
 * resist the drop, the eyes close, and the trailing scarf streams upward because
 * the air is being left behind. All of it is derived from one number.
 */
export function fallFor(vy, speed = 0) {
  const down = Math.max(0, vy);
  if (down < FALL.drift) return null;
  // 0 at drift, 1 at plunge -- the single axis everything else reads from.
  const k = clamp01((down - FALL.drift) / (FALL.plunge - FALL.drift));
  return {
    k,
    /** Lean BACK against the fall: the body fights gravity before it gives in. */
    lean: -0.16 * (1 - easeInCubic(k)),
    /** Vertical elongation. Squash is wide+short, plunge is narrow+long. */
    stretch: 1 + 0.1 * k,
    squeeze: 1 - 0.12 * k,
    /** Eyes close to two lines as the drop gets fast. */
    eyes: 1 - k,
    /** Scarf streams UP in world space, i.e. opposite the travel. */
    scarfLift: 1.25 * k,
    /** The smear runs upward, behind the cube. Never in front. */
    trail: k,
  };
}

/** The landing squash: one hard impact frame, then one overshoot back. */
export function landFor(age) {
  if (!(age >= 0) || age > FALL.land) return null;
  const t = age / FALL.land;
  // Hard squash immediately, elastic recover.
  const q = 1 - easeOutElastic(t);
  return {
    /** >1 = wider than tall */
    wide: 1 + 0.42 * q,
    tall: 1 - 0.34 * q,
    alpha: 1,
    t,
  };
}

/* ── 3. MOVEMENT, 8 DIRECTIONS, INTERPOLATED ─────────────────────────────── */

/**
 * The eight poses. Index 0 is EAST and they run counter-clockwise, so index
 * maps to direction = i * TAU/8.
 *
 * Each entry is body language, not a sprite: lean (radians, positive = nose
 * down), tall (vertical scale), wide (horizontal scale), scarf (phase offset),
 * eyes (1 open, 0 closed).
 *
 * This is the "8 directions must be interpolated" half of the brief: there are
 * EIGHT discrete, deliberately-different poses, and the renderer blends the two
 * nearest by angle. Discrete states keep each pose readable; the blend keeps the
 * motion smooth. Doing it with 8 fixed sprites would pop; doing it with a pure
 * continuous formula gives mush with no personality at any angle.
 */
export const DIRS = Object.freeze([
  // E
  { name: 'E', lean: 0.2, tall: 1, wide: 1, scarf: 0, eyes: 1 },
  // NE
  { name: 'NE', lean: 0.13, tall: 1.05, wide: 0.98, scarf: 0.7, eyes: 1 },
  // N
  { name: 'N', lean: 0, tall: 1.08, wide: 0.96, scarf: 1.4, eyes: 1 },
  // NW
  { name: 'NW', lean: -0.13, tall: 1.05, wide: 0.98, scarf: 2.1, eyes: 1 },
  // W
  { name: 'W', lean: -0.2, tall: 1, wide: 1, scarf: 2.8, eyes: 1 },
  // SW
  { name: 'SW', lean: -0.11, tall: 0.97, wide: 1.05, scarf: 3.5, eyes: 0.75 },
  // S
  { name: 'S', lean: 0, tall: 0.95, wide: 1.08, scarf: 4.2, eyes: 0.5 },
  // SE
  { name: 'SE', lean: 0.11, tall: 0.97, wide: 1.05, scarf: 4.9, eyes: 0.75 },
]);

/**
 * Blend the two nearest of the eight poses for a given heading.
 *
 * `moving` false holds the direction at `hold` (the last one used) instead of
 * snapping to east, which is what a pure atan2(0,0) would do. A cube at rest on
 * the pad keeps the pose it settled in.
 */
export function moveFor(vx, vy, hold = 0) {
  const speed = Math.hypot(vx, vy);
  if (speed < 0.6) {
    const d = DIRS[hold & 7];
    return { ...d, index: hold & 7, mix: 0, speed, moving: false, lean: d.lean * 0.25 };
  }
  // Octant index, continuous. `u` is how far between i and i+1.
  const t = Math.atan2(vy, vx);
  const turns = (t / TAU) * 8;
  const i = ((Math.floor(turns) % 8) + 8) % 8;
  const u = turns - Math.floor(turns);
  const a = DIRS[i],
    b = DIRS[(i + 1) % 8];
  // Lean is a signed angle; blending it directly is wrong across the W
  // discontinuity, so both halves are blended as offsets from their own pose.
  const lean = lerp(a.lean, b.lean, u);
  const scarf = lerp(a.scarf, b.scarf, u);
  return {
    name: u < 0.5 ? a.name : b.name,
    index: i,
    mix: u,
    speed,
    moving: true,
    lean,
    tall: lerp(a.tall, b.tall, u),
    wide: lerp(a.wide, b.wide, u),
    scarf,
    eyes: lerp(a.eyes, b.eyes, u),
  };
}

/* ── 4. THE CUBE: COMPOSED POSE ──────────────────────────────────────────── */

/**
 * Compose everything into one pose the renderer applies in a single transform.
 *
 * Precedence, which is also the reading order for the player:
 *   landing squash  >  slash counter-rotation  >  fall language  >  direction
 *
 * The slash wins over the fall because a swing is a decision the player made;
 * the fall is something happening to them. Landing beats both because it is the
 * newest event.
 *
 * Returns { lean, tall, wide, eyes, scarf, counter } where every field is a
 * multiplier or an angle in radians -- no drawing happens here, which is what
 * makes the whole system testable without a canvas.
 */
export function cubePose({ vx = 0, vy = 0, age = 0, slashAge = -1, fallAge = -1, landAge = -1, hold = 0, facing = 1 } = {}) {
  const move = moveFor(vx, vy, hold);
  let lean = move.lean,
    tall = move.tall,
    wide = move.wide,
    eyes = move.eyes,
    scarf = move.scarf,
    counter = 0,
    slash = null,
    fall = null,
    land = null;

  // The fall vocabulary only speaks while actually descending.
  fall = fallFor(vy, move.speed);
  if (fall) {
    lean += fall.lean;
    tall = lerp(tall, tall * fall.stretch, fall.k);
    wide = lerp(wide, wide * fall.squeeze, fall.k);
    eyes = lerp(eyes, 0, fall.k * 0.9);
    scarf = lerp(scarf, scarf + fall.scarfLift, 1);
  }

  // A slash is the player's decision, so it overrides the descent lean.
  if (slashAge >= 0) {
    slash = slashFor(slashAge, 0);
    if (slash) {
      counter = slash.counter * facing;
      // Feet planted: the swing is the motion, so the body does not also
      // stretch. This is also what keeps the arc readable.
      tall = lerp(tall, 1, 0.5);
      wide = lerp(wide, 1, 0.5);
    }
  }

  // Landing squash is the newest event and wins outright.
  land = landFor(landAge);
  if (land) {
    tall *= land.tall;
    wide *= land.wide;
    lean *= 1 - land.t * 0.6;
  }

  return { lean, tall, wide, eyes, scarf, counter, slash, fall, land, move, facing };
}
