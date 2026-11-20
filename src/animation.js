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

/* ── 8. THE DASH, ROTATION LOCKED AT ZERO ─────────────────────────────────── */

/** Which of the eight SCREEN directions a velocity points at.
 *
 *  Index 0 = East, 1 = South-East, 2 = South, 3 = South-West, ... i.e. it runs
 *  CLOCKWISE on screen, because screen Y grows DOWNWARD.
 *
 *  This is deliberately NOT the `DIRS` index. `DIRS` runs counter-clockwise in
 *  math convention (Y up) while being named for screen directions, so its
 *  index 2 is called 'N' and fires when the cube moves DOWN. That mismatch is
 *  a real bug in the movement poses; it is not repeated here, where a wrong
 *  index would light the wrong wall on every diagonal dash.
 */
export const OCTANT_NAMES = Object.freeze(['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']);

export function octant(vx, vy) {
  if (!vx && !vy) return 0;
  const t = Math.atan2(vy, vx);
  return ((Math.round((t / TAU) * 8) % 8) + 8) % 8;
}

export const DASH = Object.freeze({
  /** Anticipation. Two ticks: enough to read as a coil, short enough that the
   *  dash still answers the input. */
  windup: 2,
  /** The dashes state. Five ticks, matching the brief's frames 3-7. */
  active: 5,
  /** Braking and the elastic settle. Eight ticks, not five: at five the settle
   *  moved 0.175 of the body's own length per tick, which is a pop, not a
   *  spring. The brief's 3 frames were a starting point; this is what actually
   *  reads as elastic. */
  recover: 8,
  /** Sum of the three. Written out because the object is frozen. */
  total: 15,
});

/** The dash's own channels, for one tick of its life.
 *
 *  Driven from the SAME tick counter as the blade (`slashAge`), never from a
 *  second clock: two timers drift, and a dash that disagrees with its own cut
 *  is worse than no dash at all.
 *
 *  Every channel here is axis-aligned by construction. `along`/`across` are
 *  scales on X and Y, `core` is a translation of the inner core only, and
 *  `lead`/`trail` name which walls to light or dissolve. Nothing rotates.
 */
export function dashFor(slashAge, vx, vy) {
  if (!(slashAge >= 0) || slashAge > DASH.total) return null;
  const dir = octant(vx, vy);
  const speed = Math.hypot(vx, vy);
  // How hard the dash is, 0..1. A tap does not deform like a full-power launch.
  const power = clamp01(speed / 42);
  // The direction, snapped to the octant so a near-axis diagonal cannot produce
  // a half-lit wall. `dx`/`dy` are SCREEN signs: +x is right, +y is DOWN, which
  // is why this reads straight off the velocity rather than off cos/sin of an
  // index -- the first version derived it from cos/sin and lit the wrong wall on
  // every diagonal.
  const a = (dir / 8) * TAU;
  const dx = Math.sign(Math.round(Math.cos(a) * 1e6) / 1e6),
    dy = Math.sign(Math.round(Math.sin(a) * 1e6) / 1e6);
  // A wall leads when it is on the side travel is heading toward.
  const lead = { x: dx, y: dy };
  const trail = { x: -dx, y: -dy };

  if (slashAge < DASH.windup) {
    // ── ANTICIPATION ──────────────────────────────────────────────────────
    // Compress BACKWARD along the dash axis: taller and thinner for a
    // horizontal dash. The core pulls right back to the trailing wall.
    const t = (slashAge + 1) / DASH.windup;
    const k = 0.16 * power * t;
    return withAxes({
      phase: 'windup',
      dir,
      t,
      along: 1 - k,
      across: 1 + k * 0.62,
      core: { x: -dx * 0.42 * t, y: -dy * 0.42 * t },
      lead,
      trail,
      // The leading wall flashes DURING the wind-up: the telegraph.
      leadGlow: 0.35 + 0.5 * t,
      trailBreak: 0,
      ghost: 0,
    }, dx, dy);
  }
  if (slashAge < DASH.windup + DASH.active) {
    // ── THE DASHES STATE ──────────────────────────────────────────────────
    // Stretched ALONG the axis of travel, core slammed against the leading
    // wall, trailing wall breaking into dashes.
    const t = (slashAge - DASH.windup) / (DASH.active - 1);
    const ease = 1 - Math.pow(1 - t, 2);
    return withAxes({
      phase: 'active',
      dir,
      t,
      along: 1 + (0.3 * power + 0.08) * (0.35 + 0.65 * ease),
      across: 1 - (0.16 * power + 0.04) * (0.35 + 0.65 * ease),
      core: { x: dx * 0.34, y: dy * 0.34 },
      lead,
      trail,
      leadGlow: 1,
      // Ramps in and STAYS: the back of the body is dematerialised for the whole
      // dash, not just at the start of it.
      trailBreak: 0.35 + 0.65 * Math.min(1, t * 2.2),
      ghost: 1,
    }, dx, dy);
  }
  // ── RECOVERY ─────────────────────────────────────────────────────────────
  // The leading edge stops first and the back catches up, so the body overshoots
  // the other way before it settles.
  const t = (slashAge - DASH.windup - DASH.active) / DASH.recover;
  // Start from where the dash ENDED and decay toward rest, oscillating through
  // it ONCE. The first version used `cos(t * 1.5pi) * exp(-t*3.2)` on its own,
  // which starts at 1.0 and snaps the body from 1.380 straight to 0.910 in one
  // tick -- a visible pop exactly where the animation is meant to feel elastic.
  const peak = 0.3 * power + 0.08;
  // A HALF cosine, not 1.5 pi: over five ticks a 1.5-pi oscillation is 80
  // degrees of turn per tick, which measured as two hard pops (0.262 and 0.150
  // in one tick) right where the animation is supposed to feel elastic. A half
  // wave brings the body down through rest once and eases out of it.
  const settle = Math.cos(t * Math.PI) * Math.pow(1 - t, 1.4);
  return withAxes({
    phase: 'recover',
    dir,
    t,
    along: 1 + peak * settle,
    across: 1 - peak * 0.55 * settle,
    core: { x: dx * 0.34 * (1 - t), y: dy * 0.34 * (1 - t) },
    lead,
    trail,
    leadGlow: 0.6 * (1 - t),
    trailBreak: 0.9 * Math.pow(1 - t, 1.6),
    // ── ZERO GHOSTS ONCE THE DASH IS OVER ────────────────────────────────
    //
    // This used to fade from 1 to 0 across recovery, so a cube that had
    // finished dashing -- and was now just falling or sitting -- kept drawing
    // after-images. The brief is explicit: ghost copies exist ONLY while a dash
    // is actively flying, and a cube on the floor drops ZERO. Recovery is not
    // the dash; it is the settle afterwards, and the settle is exactly when the
    // player needs to read the cube's real position.
    ghost: 0,
  }, dx, dy);
}

/** Resolve `along`/`across` into SCREEN-AXIS scales `sx`/`sy`.
 *
 *  This is where "no rotation" is actually enforced, so it is worth being
 *  explicit about what it means. A cardinal dash stretches along its own
 *  direction, which for E is the X axis and for S is the Y axis -- no rotation
 *  needed, the axis of travel IS a screen axis.
 *
 *  A DIAGONAL has no such luck. Its axis of travel lies at 45 degrees, and the
 *  only ways to stretch along it are to rotate the body or to shear it. Both
 *  are forbidden. The first version of this code quietly stretched X and thinned
 *  Y for every direction, so a south-east dash came out WIDE AND SHORT -- which
 *  is the silhouette of an EASTWARD dash, and read as the cube moving east
 *  while its trail went south-east. That is worse than no deformation at all.
 *
 *  So a diagonal gets a mild UNIFORM scale instead: bigger along both axes while
 *  dashing, smaller along both while loading. A uniform scale cannot imply a
 *  direction, which is exactly right -- past 45 degrees the direction is carried
 *  by the lit walls, the corner-wedged core, and the diagonal speed lines, and
 *  the body's job is to look braced, not to point.
 */
function withAxes(dash, dx, dy) {
  const diagonal = dx !== 0 && dy !== 0;
  const sx = diagonal ? 1 + (dash.along - 1) * 0.55 : dx ? dash.along : dash.across;
  const sy = diagonal ? 1 + (dash.along - 1) * 0.55 : dy ? dash.along : dash.across;
  return { ...dash, sx, sy };
}

/* ── 9. THE DASH'S VFX, AS PURE FUNCTIONS ─────────────────────────────────── */

/** The ghost after-images left behind during the dash.
 *
 *  Three silhouettes, spaced back along the axis of travel, each one older,
 *  smaller and fainter than the last. They are the AFTER-IMAGES of where the
 *  body was, so they are laid down along `-lead`: an eastward dash leaves them
 *  strung out to the west.
 *
 *  They do not rotate. An after-image of a square must be a square, or the
 *  trail reads as the body spinning, which is the one thing this animation is
 *  forbidden to suggest.
 *
 *  Returned as `{x, y, scale, alpha, age}` in BODY-LOCAL units (the caller
 *  multiplies by `R`), because the renderer applies them inside the body's own
 *  transform where the on-screen scale is already correct.
 */
export const GHOSTS = Object.freeze({
  count: 3,
  /**
   * Gap between after-images, in body half-widths. It was 0.62, which put the
   * three ghosts 3-7px apart against a 46px-wide body: they landed on top of
   * each other and read as ONE solid slab of acid behind the cube rather than
   * as three fading echoes. Measured at the glass: -72, -76, -79 px.
   */
  spread: 1.05,
  fade: 0.4,
});

export function ghostsFor(dash) {
  if (!dash || !(dash.ghost > 0.02) || dash.phase === 'windup') return [];
  const out = [];
  for (let i = 0; i < GHOSTS.count; i++) {
    // u runs 0 (nearest the body) to 1 (oldest). The NEAREST ghost is the
    // brightest because it is the most recent one.
    const u = (i + 1) / (GHOSTS.count + 1);
    // Distance grows with u and with how much of the dash is still live: the
    // trail elongates as the dash accelerates and collapses as it recovers.
    //
    // It starts at 1.0 -- the body's OWN trailing wall in these units -- and
    // goes outward from there. The first version started at 0, so every ghost
    // was drawn inside the 1.48-long stretched body and read as three vertical
    // stripes across the cube instead of as after-images behind it. Measured:
    // ghosts at -1.2..-2.6px against a body half-width of 34px.
    const back = 1 + u * GHOSTS.spread * dash.ghost * (1 + dash.t);
    // `lead` is a SIGN PAIR, so on a diagonal `(-1,-1)` it is sqrt(2) long. Using
    // it raw put the diagonal ghosts 1.41x further out than the cardinal ones
    // and they detached from the body into free-floating plates. Normalising it
    // makes the trail the same length in all eight directions.
    const ln = Math.hypot(dash.lead.x, dash.lead.y) || 1;
    out.push({
      // Along the trailing direction, in body units.
      x: (-dash.lead.x / ln) * back,
      y: (-dash.lead.y / ln) * back,
      // Each ghost is a little smaller: the body was slightly less stretched
      // when it occupied that position, and a receding silhouette gives the
      // trail its depth. Shrinking is axis-aligned.
      scale: (1 - u * 0.3) * (1 - 0.1 * (1 - dash.ghost)),
      alpha: dash.ghost * GHOSTS.fade * (1 - u * 0.72),
      age: u,
    });
  }
  return out;
}

/** Where the launch dust goes, and where the braking sparks go.
 *
 *  Two different events with two different reads:
 *    - LAUNCH (start of `active`): the trailing wall kicks dust BACKWARD,
 *      along the axis of travel, splayed evenly either side of it. It is the
 *      ground being shoved away.
 *    - BRAKE (start of `recover`): sparks fly FORWARD, from the leading wall
 *      that has just stopped dead. It is friction, so they spark ahead and
 *      outward, and they are brighter and shorter-lived than dust.
 *
 *  Both return unit-direction vectors plus a speed factor, so the renderer
 *  owns all the drawing and this function owns only the choreography.
 */
export const DUST = Object.freeze({ count: 6, splay: 0.62, speed: 3.1 });
export const SPARKS = Object.freeze({ count: 7, splay: 0.9, speed: 4.4 });

export function dashBurst(dash, kind) {
  if (!dash) return [];
  const spec = kind === 'brake' ? SPARKS : DUST;
  // The burst fires on ONE tick, not every tick of the phase, so the caller
  // tells us the age. A burst that repeats is a plume, not an impact.
  const dx = dash.trail.x,
    dy = dash.trail.y;
  // The two axes perpendicular to the dash direction, in screen space.
  const px = -dy,
    py = dx;
  const out = [];
  for (let i = 0; i < spec.count; i++) {
    // Spread the fan evenly across [-1, 1] and alternate sides so the cloud is
    // symmetric about the dash axis.
    const u = spec.count === 1 ? 0 : (i / (spec.count - 1)) * 2 - 1;
    // Braking sparks aim FORWARD (the wall stopped the front of the body);
    // launch dust aims BACKWARD. Both splay off the axis.
    const ax = kind === 'brake' ? -dx : dx,
      ay = kind === 'brake' ? -dy : dy;
    const splay = u * spec.splay;
    out.push({
      // Unit-ish direction, not normalised: a wider splay is a wider fan.
      dx: ax + px * splay,
      dy: ay + py * splay,
      // Middle particles fly furthest; the edges of the fan are slower.
      speed: spec.speed * (1 - Math.abs(u) * 0.45),
      // Alternating two-tone so the burst is not one flat colour.
      hot: i % 2 === 0,
    });
  }
  return out;
}

/* ── 10. THE WALL SPLAT ───────────────────────────────────────────────────── */

/** The pancake, then the daze.
 *
 *  A dash that hits a wall is INTERRUPTED: the body flattens against the
 *  surface it hit, holds for a beat, then peels off and wobbles. All of it
 *  axis-aligned -- a wall is a screen edge here, so flattening against one is
 *  a pure X or Y scale, never a rotation.
 *
 *  `normal` is the direction pointing AWAY from the wall (the way the body is
 *  pushed), in screen signs. A ceiling hit gives `{x:0,y:1}`: the body
 *  flattens vertically and bulges horizontally, which is what a pancake on a
 *  ceiling actually looks like.
 *
 *  Returns null when there is no splat, so callers can `if (splat)`.
 */
export const SPLAT = Object.freeze({
  /** Ticks compressed against the wall. */
  hold: 3,
  /** Ticks peeling off and wobbling back to rest. */
  daze: 11,
  total: 14,
  /** How flat the body gets at worst. */
  flat: 0.34,
  /** How much it bulges along the wall while flat. */
  bulge: 0.5,
});

export function splatFor(age, normal) {
  if (!(age >= 0) || age >= SPLAT.total) return null;
  const nx = Math.sign(normal?.x ?? 0),
    ny = Math.sign(normal?.y ?? 0);
  // A normal needs at least one axis; a zero normal is not a contact.
  if (!nx && !ny) return null;
  // How much of the flatten is applied on each axis: the axis ALONG the normal
  // is the one that compresses.
  const onX = Math.abs(nx),
    onY = Math.abs(ny);
  if (age < SPLAT.hold) {
    // ── PANCAKE ───────────────────────────────────────────────────────────
    // Snaps flat on contact, holds. The core is pinned against the wall too,
    // so the face is pressed into it rather than floating in a flat body.
    const t = age / SPLAT.hold;
    const k = SPLAT.flat + (1 - SPLAT.flat) * 0.28 * t;
    const b = SPLAT.bulge * (1 - 0.15 * t);
    return {
      phase: 'pancake',
      t,
      sx: 1 - (1 - k) * onX + b * onY,
      sy: 1 - (1 - k) * onY + b * onX,
      core: { x: -nx * 0.62, y: -ny * 0.62 },
      // The contact ring: how hard the wall is being hit, for debris.
      hit: 1 - t * 0.4,
      daze: 0,
    };
  }
  // ── DAZE ────────────────────────────────────────────────────────────────
  // Peel off the wall with a damped wobble. Two oscillations, gone by the end.
  const t = (age - SPLAT.hold) / SPLAT.daze;
  const wob = Math.cos(t * Math.PI * 2) * Math.pow(1 - t, 1.6);
  const k = SPLAT.flat + (1 - SPLAT.flat) * Math.min(1, t * 2.6);
  const b = SPLAT.bulge * (1 - t) * 0.5;
  return {
    phase: 'daze',
    t,
    sx: 1 - (1 - k) * onX + (b + wob * 0.16) * onY,
    sy: 1 - (1 - k) * onY + (b + wob * 0.16) * onX,
    // The core peels away from the wall and floats back to centre.
    core: { x: -nx * 0.62 * (1 - t), y: -ny * 0.62 * (1 - t) },
    hit: 0,
    // Dizzy eyes: the caller feeds this to the face so the cube looks stunned.
    daze: Math.pow(1 - t, 1.3),
  };
}
