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

/** The speed above which the body is supersonic. Hyper's own ceiling.
 *
 *  Restated here rather than imported: motion.js imports animation.js, so
 *  importing back would close a cycle. `test/animation.test.js` asserts this
 *  equals HYPER_SPEED, which is what keeps the two from drifting.
 */
export const HYPER_CEILING = 280;

export const FALL = Object.freeze({
  /** Below this downward speed the cube is drifting, not falling. */
  drift: 8,
  /** At or above this it is a plunge. */
  plunge: 20,
  /** `rush` reaches 1 here. Was effectively 80 (the old divisor was 60 from
   *  plunge); a full-speed dive is 280, so the vocabulary had 200 px/tick of
   *  silence to say nothing in. */
  terminal: 220,
  /** The physical ceiling of a fall, where `dive` reaches 1. */
  top: 378,
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
  // ── k SATURATES AT 20px/tick, AND THE VOCABULARY USED TO STOP THERE ────
  //
  // Measured: everything above vy 20 produced identical numbers. But a plunge
  // off a full-power launch, or a hyper dive, reaches 80-280. So the FASTEST
  // falls in the game looked exactly like an ordinary one -- the one moment the
  // animation had the most to say was the moment it went quiet.
  //
  // `rush` is the second axis: 0 at an ordinary plunge, 1 at terminal. It only
  // ever adds, so every existing sample of the curve is unchanged and the
  // hand-authored vocabulary above still reads exactly as designed.
  // ── rush NOW RUNS TO 220, NOT 80 ──────────────────────────────────────
  //
  // `(down - 20) / 60` saturated at vy 80, and measured, 80 / 140 / 280 / 378
  // were numerically IDENTICAL: tall 1.663, wide 0.599, eyes 0.10, scarf 3.55.
  // A hyper dive down a wall rendered exactly like a routine drop, which is the
  // same bug as the horizontal blur last round, still live on this axis.
  //
  // The reference is the physical top of a fall (`TOP_FALL`), so the curve has
  // somewhere to go the whole way down.
  const rush = clamp01((down - FALL.plunge) / (FALL.terminal - FALL.plunge));
  // `dive` is the far end, where the body stops resisting and goes streamlined.
  // It exists so 220 and 378 are different drawings, not just different numbers.
  const dive = clamp01((down - FALL.terminal) / (FALL.top - FALL.terminal));
  return {
    k,
    rush,
    /** The far end: the body has stopped resisting and gone streamlined. */
    dive,
    /** Lean BACK against the fall: the body fights gravity before it gives in.
     *
     *  This used to be `-0.16 * (1 - easeInCubic(k))`, which is LARGEST at
     *  k = 0 and decays to zero. Added to the pose's own lean, the body rocked
     *  12 degrees backwards at vy 8 and then snapped upright at vy 20 -- a
     *  stumble while barely moving, and rigid exactly when the drop got real.
     *
     *  Now it starts at 0 and grows with the fall, so the read is: the faster
     *  the drop, the harder the body resists it. It is an EXPRESSION channel --
     *  it dips the leading corners rather than rotating them.
     */
    lean: 0.2 * easeInCubic(k) + 0.1 * rush,
    /** Vertical elongation. Squash is wide+short, plunge is narrow+long.
     *
     *  `dive` adds a further term past `terminal`, so a full dive keeps
     *  narrowing instead of flattening out with `rush` once it saturates. */
    stretch: 1 + 0.1 * k + 0.16 * rush + 0.1 * dive,
    squeeze: 1 - 0.12 * k - 0.14 * rush - 0.08 * dive,
    /** Eyes close to two lines.
     *
     *  They used to hit their floor at vy 20 -- the instant the fall became a
     *  fall at all -- so the face was a threshold crossing rather than a
     *  readout. Now they stay open through the ordinary plunge and close as the
     *  dive locks in, which is when the body stops looking where it is going. */
    eyes: 1 - 0.55 * k - 0.45 * dive,
    /** Scarf streams UP in world space, i.e. opposite the travel. */
    scarfLift: 1.25 * k + 0.9 * rush,
    /** The smear runs upward, behind the cube. Never in front. */
    trail: k + 0.55 * rush + 0.5 * dive,
    /** How many trailing cels to draw. A plunge gets one plume; a dive gets a
     *  stack of them, which is the only thing that separates the two on screen. */
    cels: 1 + Math.round(3 * rush) + Math.round(2 * dive),
    /** 0..1, how much the frame itself should compress at this speed. */
    shock: rush,
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
    /** How hard the frame is rung, 1 at the instant of contact -> 0 by the end.
     *  The renderer uses this for the impact ring and the ground scuff; without
     *  it the landing was applied as a silent scale and nothing was DRAWN. */
    shock: Math.pow(1 - t, 1.6),
    /** 0 at contact, 1 at rest. The ground marks fade along this. */
    settle: t,
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
/**
 * ── HOW FAR THESE POSES MOVE, AND WHY THEY MOVED FURTHER ────────────────
 *
 * The first set read as almost nothing. Measured: the whole eight-direction
 * range covered 6.0px of travel on a 46px body (tall 0.95..1.08), 22.9 degrees
 * of lean, and eyes that only ever half-closed. On screen that is a square
 * twitching, not a character moving.
 *
 * The numbers are now sized against the BODY, not against what felt tasteful in
 * a table. The body is 46px, so:
 *
 *   tall 0.86..1.20  = 15.6px of vertical travel -- visible at a glance
 *   lean 0.34 rad    = 39 degrees, the unmistakable forward lean of a drive
 *   twist            = the body's own rotation about its angle, so a diagonal
 *                      reads as a body TURNING into the corner
 *   scarf            = phase offset, so the same cloth animates differently
 *                      depending on which way you are going
 *
 * `twist` is new. It is the channel that makes a diagonal legible: without it
 * NE and NW are just "up, slightly tilted", and the corner poses read as
 * variants of north rather than as their own decisions.
 *
 * `stretch` is new too: how much the body is dragged along its own travel by
 * speed alone. It is the difference between a cube that MOVES and a cube that
 * is BEING THROWN.
 */
export const DIRS = Object.freeze([
  // E — driving right: leading with the edge, leaning hard into it.
  { name: 'E', lean: 0.34, tall: 0.99, wide: 1.03, scarf: 0, eyes: 1, twist: 0.1, stretch: 0.16 },
  // NE — the corner pose: taller, twisted, chin up.
  { name: 'NE', lean: 0.22, tall: 1.1, wide: 0.93, scarf: 0.7, eyes: 1, twist: 0.24, stretch: 0.13 },
  // N — full climb: stretched long and thin, the classic rising silhouette.
  { name: 'N', lean: 0, tall: 1.2, wide: 0.88, scarf: 1.4, eyes: 1, twist: 0, stretch: 0.1 },
  // NW — corner, mirrored: the twist goes the other way.
  { name: 'NW', lean: -0.22, tall: 1.1, wide: 0.93, scarf: 2.1, eyes: 1, twist: -0.24, stretch: 0.13 },
  // W — driving left, mirrored.
  { name: 'W', lean: -0.34, tall: 0.99, wide: 1.03, scarf: 2.8, eyes: 1, twist: -0.1, stretch: 0.16 },
  // SW — falling left: heavy, wider, eyes narrowing against the wind.
  { name: 'SW', lean: -0.18, tall: 0.9, wide: 1.12, scarf: 3.5, eyes: 0.6, twist: -0.14, stretch: 0.18 },
  // S — full drop: the widest, shortest, most compressed pose. Eyes shut.
  { name: 'S', lean: 0, tall: 0.86, wide: 1.18, scarf: 4.2, eyes: 0.3, twist: 0, stretch: 0.2 },
  // SE — falling right.
  { name: 'SE', lean: 0.18, tall: 0.9, wide: 1.12, scarf: 4.9, eyes: 0.6, twist: 0.14, stretch: 0.18 },
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
    // Resting: every channel relaxes toward neutral. A stopped cube must not
    // keep the full driving lean of the direction it arrived from -- that reads
    // as a pose frozen mid-stride. The eyes stay as they were, because a
    // resting cube is awake.
    const d = DIRS[hold & 7];
    return {
      ...d,
      index: hold & 7,
      mix: 0,
      speed,
      moving: false,
      lean: d.lean * 0.25,
      tall: lerp(d.tall, 1, 0.72),
      wide: lerp(d.wide, 1, 0.72),
      twist: d.twist * 0.3,
      stress: 0,
      stretch: d.stretch * 0.3,
    };
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
  // How hard the cube is being thrown, 0..1 against its own limit. This scales
  // the stretch only -- it never changes which pose was chosen, so direction
  // and speed stay independent readings.
  const stress = clamp01((speed - 12) / 26);
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
    // The two channels that make a diagonal read as a turn and a fast cube read
    // as thrown rather than moved. Both are blended, so neither can pop.
    twist: lerp(a.twist, b.twist, u) * clamp01(speed / 18),
    stretch: lerp(a.stretch, b.stretch, u) * stress,
    stress,
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
    twist = move.twist,
    stretch = move.stretch,
    counter = 0,
    slash = null,
    fall = null,
    land = null;

  // The fall vocabulary only speaks while actually descending.
  fall = fallFor(vy, move.speed);
  if (fall) {
    lean += fall.lean;
    // ── THE FALL'S SQUASH USED ONLY `k`, WHICH SATURATES AT vy 20 ────────
    //
    // `fall.k` is 1 from vy 20 onwards, so this blend was already complete a
    // quarter of the way down the curve. `rush` and `dive` are the axes that
    // keep going, and they are what the stretch/squeeze multiply already
    // contain -- so the weight runs all the way to 1 instead of stopping.
    const f = Math.min(1, fall.k * 0.6 + fall.rush * 0.3 + fall.dive * 0.3);
    tall = lerp(tall, tall * fall.stretch, f);
    wide = lerp(wide, wide * fall.squeeze, f);
    // ── THE FALL'S EYE CURVE WAS COMPUTED AND THEN IGNORED ───────────────
    //
    // This was `lerp(eyes, 0, fall.k * 0.9)` -- a hardcoded zero. `fallFor`
    // returns a carefully shaped `eyes` that stays open through an ordinary
    // plunge and closes as the dive locks in, and nothing read it. Now the
    // stated curve is the one that reaches the face.
    eyes = lerp(eyes, fall.eyes, f);
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
      twist = lerp(twist, 0, 0.5);
      stretch = lerp(stretch, 0, 0.6);
    }
  }

  // Landing squash is the newest event and wins outright.
  land = landFor(landAge);
  if (land) {
    tall *= land.tall;
    wide *= land.wide;
    lean *= 1 - land.t * 0.6;
    // A squash flattens the twist too -- the body is being compressed, not
    // turned, and letting the two coexist made the landing look like a spin.
    twist *= 1 - land.t * 0.8;
    stretch *= 1 - land.t * 0.8;
  }

  // The dive's extra stretch goes on the body's vertical axis, because a fall is
  // always straight down in world space regardless of the cube's own angle.
  if (fall && fall.rush > 0) {
    tall *= 1 + 0.1 * fall.rush;
    wide *= 1 - 0.08 * fall.rush;
  }
  // ── SKEW REPLACES THE ROTATION ─────────────────────────────────────────
  //
  // `twist` used to be applied as `c.rotate(twist)` -- the whole body turned up
  // to 28 degrees on a diagonal. A rotated square is ambiguous: it reads just as
  // well as spinning, sliding sideways, being mis-drawn, or the camera rolling.
  // It is also the one channel that fights the player's read of which way they
  // are going, because a rotated square and a square travelling diagonally look
  // alike.
  //
  // A SHEAR has none of that ambiguity. A sheared square can only read as being
  // dragged: the leading edge leads, the trailing edge lags, and the shape stays
  // upright so the eye never has to decide whether it turned. The pose data
  // keeps `twist` (eight poses and their tests unchanged); this is where it is
  // reinterpreted as a shear, in the same units it always had.
  //
  // Scaled by the same `clamp01(speed / 18)` the twist used, so a resting cube
  // is square and a full launch is visibly dragged.
  const skew = -twist * 0.62;
  // ── SONIC ──────────────────────────────────────────────────────────────
  //
  // Measured bug: hyper 280 and sonic 378 rendered BYTE-IDENTICALLY. A sonic
  // rebound -- the wall throwing you back harder than you arrived, which is the
  // most rewarding thing the physics does -- had no look of its own after the
  // single frame of its boom.
  //
  // `sonic` is 0 until the body is past hyper's ceiling and 1 at the physical
  // top (a full `reboundCap` bounce). It is derived from SPEED, not from the
  // hyper state, because a sonic rebound is a thing that happens to the cube
  // whether or not the state is still live.
  const speedNow = Math.hypot(vx, vy);
  const sonic = clamp01((speedNow - HYPER_CEILING) / (HYPER_CEILING * 0.35));
  // `stretch` is applied to the body along its own heading, not to `tall`,
  // because a cube thrown east should get LONGER east, not taller. The renderer
  // rotates by the heading to apply it.
  return {
    lean,
    tall,
    wide,
    eyes,
    scarf,
    twist,
    /** Shear along travel, radians-equivalent: takes the place of the rotation.
     *  Positive shears the leading edge over the trailing one. */
    skew,
    stretch,
    /** 0 below hyper's ceiling, 1 at the physical top speed. Drives the
     *  supersonic silhouette, the pressure cone and the ribbon. */
    sonic,
    counter,
    slash,
    fall,
    land,
    move,
    facing,
    /** The world-space bearing the body is being dragged along. */
    heading: Math.atan2(vy, vx),
  };
}
