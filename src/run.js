import {
  createPhysics,
  stopPlayer,
  stepPhysics,
  launch,
  holdSpeed,
  setBulletTime,
  destroyPhysics,
  MAX_SPEED,
  RELEASE_GRAVITY,
  boostPlayer,
  dampPlayer,
  setPlayerVelocity,
} from './physics.js';
import { panicWindow, panicScale } from './aim.js';
import { DASH, SPLAT } from './animation.js';
import { SPAWN, PAD, ARENA, createStream, bandAt, district, clamp, PLAYER_SIZE } from './levels.js';
import { createCombat } from './slasher.js';
import { TYPES } from './shapes.js';
import { createOpening } from './opening.js';
import { beginStroke, printKill, impactFor, SHEAR } from './stroke.js';
import { IMPACT } from './impact.js';
import { PACE, breathFor, focusPace, tempoOf, assistRange } from './pace.js';
import { tierOf } from './motion.js';

/** The highest chain a miss can leave behind.
 *
 *  Low enough that a miss really does cost you hyper -- the gate needs seven and
 *  you are left with three, so you must land four more in a row -- and high
 *  enough that one bad shot does not delete a run. Measured against the test
 *  bot: chain resets to 0 collapsed score 10x; a cap of 3 leaves ordinary
 *  scoring intact while still requiring a fresh four-link run for hyper.
 */
export const MISS_CAP = 3;

/** The highest the ORDINARY rally ratchet may lift the speed ceiling.
 *
 *  `MAX_SPEED` is 42 and the redline reads against it, so a ceiling that climbs
 *  without bound means the speedometer can never be full. 58 is ~1.4x the limit:
 *  a bank still throws the cube visibly past the redline, but the permission is
 *  temporary and the number can always come back down. Hyper is exempt -- it
 *  sets its own ceiling and drops it on exit.
 */
export const RALLY_CEIL = 58;

export const MAX_EDGE = 3,
  /** Ticks (~133 ms at 1x) during which the shape you just cut cannot hurt you. */
  CUT_GRACE = 8,
  /**
   * Ticks (~500 ms at 1x) of safety after hitting ARMOUR instead of a body.
   *
   * A Bastion shell or a Crown plate does not die to one cut, so the ordinary
   * 133 ms grace expires while the cube is still inside the shape it just
   * bounced off -- and the player takes a hit for the crime of having attacked
   * a target the game invited them to attack. Armoured contact is the one case
   * that needs the longer window, and the brief names 0.5 s for it.
   */
  ARMOR_GRACE = 30,
  /** The shove off a plate, in px/tick. Small on purpose: this is the cue that
   *  the blade bounced, not a launch. */
  ARMOR_PUSH = 7,
  /** Speed above which a rail bounce is a shot the player played rather than a
   *  fall gravity paid for. Below it the rail reflects elastically and pays
   *  nothing; at or above it the bounce boosts and returns a pip. */
  BANK_EARN = 34,
  // The longest a chain window can ever be. Kept as an export because it is the
  // documented ceiling and because anything external that needs "the" window
  // should get the maximum, not a stale literal.
  CHAIN_TIME = 96,
  DRIVE_REACH = 1.38;

/** ── HYPER ────────────────────────────────────────────────────────────────
 *
 *  The tier that breaks the speed limit. Everything here is DERIVED (see
 *  docs/hyper.md); the derivations are kept beside the numbers so a balance
 *  change can be re-run rather than guessed at again.
 *
 *  SPEED = 280. A wall at -78,000px needs a minimum of 242 -- bisected against
 *  the real integrator, not a formula, because the integrator has substeps,
 *  drag and several clamps. 242 would be reachable ONLY from a perfect vertical
 *  launch that touches nothing; 280 leaves 34,000px of margin, which is what
 *  pays for slashing shapes on the way up. Every kill and every bank costs
 *  energy, and the margin absorbs that cost.
 *
 *  ENTRY = 7 consecutive within 14 dashes. Measured: a 7-chain lands on dash
 *  10-17 across eight seeds (median 11). A budget of 10 -- the original spec --
 *  fires on zero runs. 14 sits between the median and the worst case, so it
 *  still demands a genuinely fast opening without being impossible.
 *
 *  There is no duration timer. Radius of the state is speed: gravity bleeds
 *  280 back through the normal cap in about 9.2 seconds (measured), so hyper
 *  ENDS when you run out of speed exactly as the brief describes. Slashing
 *  accelerates the decay, because a cut spends forward velocity to make chaos,
 *  so the player who slashes hardest burns hyper fastest. That tension is free.
 */
// ── THE ASCENT CAP ─────────────────────────────────────────────────────────
//
// A chain that keeps a big vertical component lets the cube out-run the wave
// director: measured from a real recording, a tutorial-fed Overdrive took the
// player from Sector 02 to Sector 32 in about nine seconds, which is thirty
// sectors of content skipped and then a wall of nothing at the top.
//
// This is a SOFT cap, applied only while the cube is climbing and only to the
// UPWARD component. It is deliberately not a speed cap: horizontal speed and
// the hyper ceiling are untouched, so the game still feels fast. What it buys
// is time -- the field gets to exist in front of the player before they have
// flown past it.
export const MAX_ASCENT_VY = 26;

// ── THE VIEWPORT WATCHDOG ──────────────────────────────────────────────────
//
// A backstop, not the fix. The fix for the empty field was in levels.js (the
// top wall was skipping every cell past it). This exists because "the field is
// never empty" is a property a RUN must hold, and a property worth having even
// if the cell geometry is right: one mistake in the wave director, or one
// future change to the table, and the player is staring at a dead screen again.
//
// If nothing has been alive within a viewport of the cube for this long, the
// stream is forced to resync. Resyncing is the honest repair -- it rebuilds
// cells relative to the player instead of inventing shapes, so the field the
// player gets is the field the seed says belongs there.
export const RAIL_SETTLE_VY = 1.2;

export const EMPTY_WATCHDOG_TICKS = 90;
export const WATCHDOG_REACH = 1800;

/** Ticks the floor is ignored after a trampoline kick -- half a second at 60Hz.
 *
 *  The floor is an INSTANT trampoline: it kicks on every touch, at a fixed
 *  height, regardless of arrival speed. Without a dead band that behaviour is
 *  a vibrator -- the kick lifts the cube, gravity returns it 40 ticks later,
 *  it kicks again, forever, and the player is pinned to a line they cannot
 *  leave. The window is the difference between a trampoline and a trap.
 */
export const FLOOR_IGNORE_TICKS = 30;

/** What fraction of a fall survives a held aim -- 10%, i.e. a 90% reduction.
 *
 *  Applied to the velocity itself, once per tick, while the player is holding
 *  aim and moving down. Deliberately NOT routed through the focus meter: the
 *  brief is that aiming slows falling, and a player with an empty meter still
 *  has to be able to save themselves. */
export const AIM_FALL_KEEP = 0.1;

/** The fall-speed cap: one screen height per 1.2 seconds.
 *
 *  Expressed as a speed rather than an acceleration so it cannot be exceeded by
 *  any combination of gravity, a long fall or a badly-timed bank. 720px / 1.2s
 *  at 60 ticks per second is 10px per tick; the constant is per tick because
 *  that is the unit the integrator works in.
 *
 *  Without a cap, a cube that fell from the top rail arrived fast enough to
 *  tunnel through a plate between two substeps, and the whole "falling" half of
 *  the game was one long blur with no readable speed.
 */
export const FALL_CAP_VY = 720 / 1.2 / 60;

export const HYPER = Object.freeze({
  speed: 280,
  chain: 7,
  dashes: 14,
  // A bounce gained per unit of impact speed, so the rebound behind the wall is
  // proportional to how fast you arrived. See the bounce rule in the rail block.
  bankGain: 0.6,
  // Hard cap on a hyper rebound: 1.35x arrival. Enough for a chain of bounces to
  // compound into spectacle, bounded so the integrator is never handed a number
  // it cannot step.
  reboundCap: 1.35,
  // Per-tick velocity bleed while hyper is live.
  //
  // 0.005 was chosen against an OPEN field, where the cube flew free and lost
  // speed to gravity. Inside the arena with four rails to bank off, a good
  // player re-gains speed on every bounce, so the measured episode length was
  // 10-15 SECONDS and hyper covered 61% of a run. That is not a state the
  // player enters, it is the mode they live in -- and it is exactly the
  // "super speed from a single launch" feeling that was reported.
  //
  // 0.011 roughly halves that: a hyper is now a burst you spend, and the
  // bounces have to keep earning it back or it ends.
  drag: 0.011,
  // Longest a single hyper may last, in ticks. Six seconds.
  //
  // Physics alone was not enough to end it. In an open field the cube slowed
  // and faded naturally, but the arena has four rails that GIVE speed back, so
  // the measured episode was 10-15 seconds and hyper covered 61-65% of a run --
  // the player was effectively always in it. This is a budget, not a timer on
  // fun: six seconds is 2.5x the longest dash-streak the game expects, and it is
  // long enough to cross a third of the arena at full hyper.
  //
  // Exit stays physical when the player spends it early -- gravity and drag can
  // end it sooner. This only guarantees it ENDS.
  ticks: 360,
});

/** How long the chain survives after a kill, as a function of chain length.
 *
 *  WHY THIS IS NOT A CONSTANT
 *  Measured on the real sim: kills land every ~19 ticks (p90 31). The window was
 *  144 ticks -- 7.5x the gap -- so it could not expire. Over 2200 ticks the chain
 *  reset exactly ZERO times and `maxChain` came out at 112 against 112 kills. The
 *  chain was not measuring chaining at all; it was measuring how long you stayed
 *  alive, which `kills` already measures. The x8 multiplier was a permanent
 *  constant dressed up as a combo meter.
 *
 *  The window therefore shrinks as the chain grows: generous for the first link
 *  so learning is forgiving, demanding by link twelve. Verified after the change:
 *  maxChain separates from kills (30 vs 85) and chains break 1-6 times a run.
 *
 *  The floor of 24 is a guard, not a design target -- measurement showed the
 *  curve bottoms out naturally around 28 links, so the floor never actually
 *  binds. It exists so the function stays total for any chain value.
 */
export const chainWindow = (chain) => Math.max(24, CHAIN_TIME - chain * 6);

/* ── THE SPEED WINDOW ───────────────────────────────────────────────────────
 *
 * The speedometer used to read a single tick's displacement, which is not a
 * speed -- it is a sample, and it lies in two specific, reported ways:
 *
 *   1. A hitstop skips `stepPhysics`, so that tick's distance is 0 and the dial
 *      dropped to 0 on the exact frame an impact landed.
 *   2. The rail solver nudges a resting cube a few px every tick, so the dial
 *      read 61 while the cube lay flat on the floor.
 *
 * Both are fixed by the same thing: measure a ~0.2s MEAN of real distance, and
 * publish exactly zero when the simulation says the cube is at rest. They live
 * here rather than inline so the behaviour can be asserted directly instead of
 * inferred from a 400-tick simulation that has to reproduce a floor.
 */
export const MOVE_WINDOW = 12;

/** Append one tick's displacement to the window and recompute the mean.
 *  Mean distance per TICK, not per second: every consumer already speaks in
 *  px/tick and the speed tiers are calibrated to that. */
export function pushMove(s, moved) {
  s.moveHist[s.moveHistAt] = moved;
  s.moveHistAt = (s.moveHistAt + 1) % s.moveHist.length;
  let sum = 0;
  for (let i = 0; i < s.moveHist.length; i++) sum += s.moveHist[i];
  s.movedAvg = sum / s.moveHist.length;
  return s.movedAvg;
}

/** A cube at rest has no speed, and the average has to say so too.
 *
 *  Averaging alone cannot fix the floor report. The residual per tick is small
 *  but PERSISTENT, so the mean of twelve jittery samples is a steady small
 *  number -- a liar's 61 rather than a liar's 0. At rest the window is emptied,
 *  which also means a player leaving the floor starts the average from nothing
 *  instead of inheriting the speed they had before they landed. */
export function settleMove(s) {
  s.movedAvg = 0;
  s.moveHist.fill(0);
  return s.movedAvg;
}
export function ballisticAim(from, to, speed) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    d2 = dx * dx + dy * dy,
    b = speed * speed + RELEASE_GRAVITY * dy,
    disc = b * b - RELEASE_GRAVITY ** 2 * d2;
  if (d2 < 1 || disc < 0 || b <= 0) return null;
  const t = Math.sqrt((2 * d2) / (b + Math.sqrt(disc)));
  return { x: dx / t, y: dy / t - 0.5 * RELEASE_GRAVITY * t, power: speed / MAX_SPEED };
}
export function createRun(
  seed,
  emit = () => {},
  { warmup = false, staged = warmup } = {},
) {
  // Stream the normal neighbourhood, but keep its other bodies off the
  // Hold the rest of the stream until the first live Fang is cut (or the
  // player leaves it). A strong launch gets one short decision beat after it
  // crosses empty sky. That is not a phantom hit: no score, freeze or refund.
  let solo = staged,
    glideAt = Infinity,
    // Identity of the physics contact already shown, so one collision does
    // not re-squash the pose on every substep of the same tick.
    lastContact = null;
  const waiting = [];
  const world = createPhysics({ seed, spawn: SPAWN, pad: PAD, arena: ARENA }),
    origin = { ...SPAWN },
    combat = createCombat(world, (e) => emit('tell', e)),
    // ── NO ENEMY MAY ENTER OUTSIDE THE WALLS ──────────────────────────────
    //
    // Every enemy in the game arrives through `combat.add`, and this is the only
    // caller, so this is the one place the invariant can actually be held.
    //
    // It had to be: the spawn grid is 1,600 x 1,240 and laid out by cell index,
    // with no knowledge of the arena. Measured before this guard, 24.8% of all
    // enemy samples sat OUTSIDE the rails -- up to 2,545 units past the right
    // wall and further above the top one. From inside the table that looked like
    // shapes crawling out of the barrier, and worse, they were unreachable: the
    // cube cannot follow them through a wall it bounces off.
    //
    // The clamp is by the body's own half-extent, not by a constant, so a big
    // Bastion is as far inside as a small Fang. Combined with the spawn cliff in
    // levels.js (cells that fall entirely outside are not generated at all), an
    // enemy can no longer be placed beyond the rail or on the far side of it.
    place = (spec) => {
      // The body's OWN radius, not a constant: combat.add scales by `size` or
      // `small`, so a 0.6x Fork must sit as far from the rail as a full-size
      // Bastion. Deriving it here means the clamp cannot drift out of step with
      // whatever the shape table says.
      const t = TYPES[spec.kind],
        r = (t?.r ?? 32) * (spec.size ?? (spec.small ? 0.6 : 1));
      return combat.add({
        ...spec,
        x: clamp(spec.x + origin.x, ARENA.x + r, ARENA.x + ARENA.w - r),
        y: clamp(spec.y + origin.y, ARENA.y + r, ARENA.y + ARENA.h - r),
      });
    },
    stream = createStream(
      seed,
      (spec) => (solo && !spec.sentry ? waiting.push(spec) : place(spec)),
      combat.leave,
      staged,
    ),
    lesson = warmup ? createOpening(seed,world,combat) : null;
  const s = {
    phase: 'ready',
    opening: lesson?.state ?? null,
    staged,
    net: false,
    caught: false,
    reach: 1,
    breath:0,
    story:warmup,
    // Tutorial banners are legal ONLY in the Cutting Room. `enterField()`
    // lowers this for good; nothing in the live field can raise it again.
    tutorialActive: warmup,
    /** Ticks the field has been empty near the player. See EMPTY_WATCHDOG_TICKS. */
    emptyTicks: 0,
    /**
     * SPEED AS THE PLAYER CAN SEE IT.
     *
     * This is `hypot(dx,dy)/dt` between settled positions, not the velocity the
     * integrator happens to be holding. They are usually the same. They diverge
     * exactly when they must not: a cube pinched against a rail is resolved by
     * the solver every tick, so a raw velocity can be read mid-resolution --
     * non-zero while the body has not moved at all. Anything whose job is to
     * describe MOTION (the speedometer, squash/stretch, ghost emission) reads
     * this; anything whose job is to MODEL it (gravity, bounces) keeps using
     * velocity.
     */
    moved: 0,
    /** Ticks of floor immunity after a trampoline kick. See FLOOR_IGNORE_TICKS. */
    floorIgnore: 0,
    /** Ticks the bottom line stays white after a kick (renderer reads it). */
    floorFlash: 0,
    /** Total trampoline kicks, diagnostic only. */
    floorKicks: 0,
    // 12-tick rolling window of `moved` (200ms at 60Hz), and its mean.
    moveHist: new Array(12).fill(0),
    moveHistAt: 0,
    movedAvg: 0,
    /** Last settled position, for `moved`. */
    _lastX: 0,
    _lastY: 0,
    /** How many times the watchdog has had to resync. Diagnostic only. */
    watchdog: 0,
    firstAir:false,
    warning:0,
    panic:null,
    panicTicks:0,
    panicGrants:[],
    panicWarm:0,
    locked:false,
    // Last real surface contact (see physics.noteContact) and how long ago,
    // in ticks. Drives the contact squash and its shockwave ring.
    impact:null,
    impactAge:0,
    // ── FLOOR RECOVERY ────────────────────────────────────────────────────
    //
    // Touching a rail is not free any more. It returns ONE edge -- enough to
    // launch again, so a player can never be soft-locked at zero pips on the
    // floor -- and it costs the chain, which is the thing that actually
    // matters.
    //
    // Before this, the floor gave a pip back on a 76-tick timer regardless, so
    // parking on it was already the best way to farm dashes. The rule now is:
    // the floor is a way OUT of trouble, never a way to build a run. Full
    // three-pip refills and Overdrive stay strictly tied to aerial cuts.
    edgeReturn: 0,
    /** Did the player THROW themselves since the last rail? A bank only pays
     *  for a shot the player played -- see the bank block in tick. */
    sinceDash: false,
    /** Ticks of refill cooldown left after touching a rail. */
    floorCool: 0,
    /** True while the cube is clear of every rail band. Gate for the floor's
     *  one-pip recovery: you have to have LEFT the floor to be paid for
     *  arriving on it again. */
    railAway: true,
    /** Set by `dash()`; holds `slashAge` at 0 for the swing's first tick. */
    freshSwing: false,
    /** Rail banks this run. Feeds the BANK form axis, so it must exist from
     *  tick zero -- it was never initialised, and `(s.banks || 0) + 1` hid that
     *  by creating it on the first bank. A run with no banks reported
     *  `undefined`, which readForm turned into a NaN axis. */
    banks: 0,
    /** Ticks of post-cut grace left against `cutGraceFrom`. */
    cutGrace: 0,
    /** The id of the enemy just cut. Grace is against THIS one, not the field. */
    cutGraceFrom: null,
    // Rail-bank shockwave. Separate from `impact` because it is a different
    // event with a different feeling: `impact` says "you touched something",
    // `boom` says "you bounced off a wall at speed". The renderer draws it big
    // and directional; see the sonic-boom block in renderer.js.
    boom:null,
    boomAge:0,
    // ── ANIMATION AGES ────────────────────────────────────────────────────
    //
    // The renderer needs to know how MANY TICKS AGO something happened, not
    // just that it happened. These are the only new state the animation system
    // requires: -1 means "never", and each is reset on its event. The renderer
    // then interpolates within the tick using alpha, so a swing at 144Hz shows
    // intermediate frames rather than repeating.
    slashAge: -1,
    landAge: -1,
    fallAge: -1,
    // ── THE WALL SPLAT ───────────────────────────────────────────────────
    //
    // Set when a DASH is interrupted by a rail: `{age, nx, ny}` where the
    // normal points AWAY from the wall. The dash itself is not cancelled --
    // `slashAge` keeps running, because the blade is already thrown -- but the
    // body stops reading as a dash and reads as a pancake for SPLAT.total
    // ticks. A later, non-dash contact never starts one: this is specifically
    // "you dashed into a wall", not "you touched something".
    splat: null,
    swingStart: 0,
    seed: seed >>> 0,
    hp: 3,
    score: 0,
    kills: 0,
    chain: 0,
    maxChain: 0,
    chainTime: 0,
    chainMax: CHAIN_TIME,
    shots: 0,
    blade: 0,
    parry: 0,
    edge: 3,
    recharge: 0,
    focus: 1,
    held: false,
    depleted: false,
    invul: 0,
    stop: 0,
    drive: 0,
    elapsed: 0,
    peak: 0,
    band: 1,
    line: 650,
    oldLine: 650,
    death: 0,
    cause: '',
    previousSlash: -0.65,
    slashAngle: -0.65,
    stroke: null,
    bestStroke: null,
    throughcuts: 0,
    // ── HYPER ──────────────────────────────────────────────────────────────
    // `hyper` is the live state; `hyperLevel` is 0..1 for the rendered
    // intensity (it rises on entry and falls with speed), so the effect can
    // be drawn as a fade rather than a switch.
    hyper: false,
    hyperLevel: 0,
    hyperCount: 0, // how many times hyper was entered this run
    // fastest speed reached WHILE hyper was live
    hyperPeak: 0,
    // The chain length already spent on a promotion. Hyper is earned by a
    // streak that has not been used yet, so exiting and immediately re-entering
    // off the same chain is not possible.
    hyperChain: 0,
    // True until the first wall contact of a hyper, which is the one bounce
    // allowed to throw the cube back harder than it arrived.
    hyperBoom: false,
    // The dash count at which the current chain began. Hyper's 14-dash budget
    // is measured from here, not from the start of the run.
    chainFrom: 0,
  };
  if (!lesson) stream.sync(SPAWN, s.line);
  function nearest() {
    const p = world.player.position;
    let best = null,
      rank = Infinity;
    for (const e of combat.enemies.values()) {
      if (!s.opening && (e.y > s.line - 50 || (s.caught && e.y > p.y - 70))) continue;
      const dx = e.x - p.x,
        dy = e.y - p.y,
        d = Math.hypot(dx, dy) + (dy > 65 ? 560 + dy : 0);
      if (d < rank) {
        best = e;
        rank = d;
      }
    }
    return best;
  }
  function solution(to, speed) {
    const p = world.player.position,
      lead = clamp(Math.hypot(to.x - p.x, to.y - p.y) / speed, 0, 11),
      q = { x: to.x + (to.vx || 0) * lead, y: to.y + (to.vy || 0) * lead };
    const v = ballisticAim(p, q, speed);
    if (v) return v;
    const a = Math.atan2(q.y - p.y - 40, q.x - p.x);
    return { x: Math.cos(a) * speed, y: Math.sin(a) * speed, power: speed / MAX_SPEED };
  }
  function suggestion() {
    return solution(
      nearest() || { x: world.player.position.x + 90, y: world.player.position.y - 240 },
      31.7,
    );
  }
  function aimAt(q, assist = true) {
    // The snap radius widens with tempo: at full speed a tap that is "close
    // enough" is the difference between steering and fighting the controls.
    const range = assistRange(s).snap;
    let to = q,
      best = range; // a tap snaps only when it is actually near the shape
    if (assist)
      for (const e of combat.enemies.values()) {
        const d = Math.hypot(e.x - q.x, e.y - q.y),
          reach = Math.min(best, e.r + range * 0.2); // tiny shapes don't get a wide snap
        if (d < reach) {
          to = e;
          best = d;
        }
      }
    return { ...solution(to, 31.7), target: to.id };
  }
  function adjust(v, assist = true) {
    if (!v?.power) return v;
    const speed = Math.hypot(v.x, v.y);
    if (s.phase === 'ready' && v.y > -speed * 0.13) {
      const y = -Math.max(Math.abs(v.y), speed * 0.22);
      v = { ...v, x: Math.sign(v.x) * Math.sqrt(Math.max(0, speed * speed - y * y)), y };
    }
    if (!assist) return v;
    let best = v,
      cos = 0.9945;
    const p = world.player.position;
    for (const e of combat.enemies.values()) {
      if (Math.hypot(e.x - p.x, e.y - p.y) > 740) continue;
      const a = solution(e, speed),
        dot = (a.x * v.x + a.y * v.y) / (speed * speed);
      if (dot > cos) {
        cos = dot;
        best = { ...a, target: e.id };
      }
    }
    return best;
  }
  function focus(on) {
    if (on && s.panicTicks > 0) {
      s.panic = null;
      s.panicTicks = 0;
      s.panicWarm = 0;
    }
    s.held =
      !!on &&
      !s.opening?.rest &&
      !s.opening?.returning &&
      !s.opening?.finishing &&
      s.phase === 'playing' &&
      !world.grounded;
    if (!on) s.depleted = false;
    setBulletTime(world, s.held && !s.depleted && s.focus > 0.01, !on);
  }
  function dash(v) {
    const pv = world.player.velocity,
      speedBeforeLaunch = Math.hypot(pv.x, pv.y);
    if (
      !['ready', 'playing'].includes(s.phase) ||
      !v ||
      (s.opening && !s.opening.rest) ||
      (!s.opening?.free && s.edge <= 0) ||
      !launch(world, v)
    )
      return false;
    s.phase = 'playing';
    s.caught = false;
    s.held = s.depleted = false;
    s.shots++;
    s.sinceDash = true;
    s.breath = 0;
    s.breathMax = 0;
    s.firstAir = false;
    s.warning = 0;
    s.panic = null;
    s.panicTicks = 0;
    s.panicWarm = 0;
    s.panicGrants = [];
    glideAt = !s.opening && Math.hypot(v.x, v.y) > 22 ? world.clock + 13 : Infinity;
    s.parry = 10;
    if (!s.opening?.free) s.edge--;
    if (s.opening) lesson.launch();
    // A magnetised corridor makes THIS launch slightly wider, then forgets.
    s.locked = Boolean(v.lock);
    s.reach = s.opening?.reach ?? (s.drive > 0 ? DRIVE_REACH : 1) + (s.locked ? 0.12 : 0);
    // Seed the tier latch from the speed BEFORE this launch. Without this the
    // first tick of any launch initialises the latch instead of comparing to
    // it, so the single most satisfying moment in the game -- committing to
    // full power and going straight to REDLINE -- was the one crossing that
    // could never announce itself.
    s.tier = tierOf(speedBeforeLaunch, MAX_SPEED).index;
    s.swingStart = world.clock;
    s.blade = 16 + 15 * Math.min(1, Math.hypot(v.x, v.y) / MAX_SPEED);
    // ── A DASH MUST NOT ERASE HYPER ────────────────────────────────────────
    //
    // `launch()` clamps its input to MAX_SPEED (physics.js line ~219), which is
    // right for an ordinary launch and catastrophic here: dashing mid-hyper
    // reset the cube from 279 to 31 in a single tick and dropped the state on
    // the next one. Measured: hyper ended on a launch tick 1 tick after it
    // began, over and over. The dash is how a hyper player STEERS -- it must
    // redirect the speed, never spend it.
    //
    // So the launch sets the heading and hyper restores the magnitude along it.
    // The speed is re-asserted against the CURRENT heading rather than the
    // aim's, because the aim vector is already scaled by launch()'s clamp.
    // PRESERVE, never refill.
    //
    // Two failures bracket this line and it sits between them:
    //   refill to HYPER.speed  -> hyper is INFINITE (measured 1650 ticks, 27s,
    //                             never ends, because each dash repaired
    //                             everything gravity took)
    //   holdSpeed(world) alone -> hyper is 14 TICKS (measured), because
    //                             launch() above has ALREADY clamped velocity to
    //                             MAX_SPEED, so "preserve" preserved the damage
    //
    // So the speed is taken from BEFORE the launch (already captured as
    // speedBeforeLaunch) and re-applied along the NEW heading. The dash still
    // owns direction; the state owns magnitude; and nothing is repaired, so
    // gravity and drag remain the only drains.
    if (s.hyper)
      holdSpeed(world, Math.min(speedBeforeLaunch, world.playerCeiling || HYPER.speed));
    s.previousSlash = s.slashAngle = Math.atan2(v.y, v.x);
    // Every dash is a swing. Restarting the clock here (rather than on contact)
    // is what makes the attack read as something the PLAYER did: the wind-up
    // begins on the input, so by the time the blade reaches a shape it is
    // already travelling.
    s.slashAge = 0;
    // Hold the zero frame for one tick -- see the note at the animation clocks.
    s.freshSwing = true;
    s.stroke = beginStroke(world.player.position, s.slashAngle, s.shots);
    emit('dash', {
      ...world.player.position,
      angle: s.slashAngle,
      power: Math.min(1, Math.hypot(v.x, v.y) / MAX_SPEED),
    });
    return true;
  }
  /** ── HYPER ENTRY AND EXIT ────────────────────────────────────────────────
   *
   *  Entering is a performance check. Staying in used to be purely a physics
   *  consequence -- hyper lived exactly as long as the cube stayed above the
   *  normal limit -- which worked in the open field the state was designed for
   *  and failed inside the arena, where four rails hand speed back on every
   *  bounce. Measured in the arena: episodes of 10-15 SECONDS and hyper covering
   *  61% of a run, so the state stopped being an event.
   *
   *  So it is now BOTH. The player can always leave early by spending their
   *  speed (a cut costs forward velocity, gravity and drag take the rest), and
   *  a hard budget of HYPER.ticks guarantees it ends even for a player who does
   *  nothing but bounce off walls. Six seconds, spent rather than endured.
   *
   *  Called once per tick, after kills are resolved, so a kill that completes
   *  the seventh link can promote in the same tick it happened.
   */
  function hyperStep() {
    // ENTRY: seven links, and a fast enough opening. `s.shots` is the dash
    // count, so this is "seven in a row, before the fourteenth launch".
    //
    // `hyperChain` is what makes this a RISING EDGE rather than a level check.
    // Without it a state that ended at speed 41 with a chain of 9 still on the
    // board re-promoted on the very next tick -- measured 4 entries in 65 ticks,
    // all off one chain. The chain that earned hyper is CONSUMED by it: to get
    // hyper again you have to build a NEW run of seven. That is also what the
    // brief means by "fast nail 7 consecutive chains" -- consecutive means a
    // fresh streak, not a lingering one.
    if (
      !s.hyper &&
      s.chain >= HYPER.chain &&
      s.shots - (s.chainFrom ?? s.shots) <= HYPER.dashes &&
      s.chain > s.hyperChain
    ) {
      s.hyper = true;
      s.hyperAge = 0;
      s.hyperCount++;
      s.hyperChain = s.chain;
      // The wall owes you exactly one violent throw.
      s.hyperBoom = true;
      // The ceiling is raised FIRST so the impulse is not immediately clamped
      // away -- capVelocity runs on every substep and would otherwise erase it.
      world.playerCeiling = HYPER.speed;
      s.ceiling = HYPER.speed;
      // The push. boostPlayer scales the CURRENT velocity up to the ceiling
      // rather than setting an absolute speed, so the direction the player was
      // already travelling is preserved. Hyper is a promotion, not a reset: you
      // leave at speed, along the line you chose.
      boostPlayer(world, HYPER.speed, HYPER.speed);
      // An edge back, so entering hyper does not strand you with nothing to
      // spend. This is feedback, not power -- the same refund a bank gives.
      s.edge = Math.min(MAX_EDGE, s.edge + 1);
      emit('hyper', {
        ...world.player.position,
        speed: Math.round(Math.hypot(world.player.velocity.x, world.player.velocity.y)),
        count: s.hyperCount,
        chain: s.chain,
        shots: s.shots,
      });
    }
    if (s.hyper) {
      // FRICTION. Gravity alone is a weak drain on a state that can last
      // twenty-seven seconds, and on a wall bounce it gives speed back. This is
      // a small constant bleed that shortens a quiet hyper without touching the
      // part the player is actively earning: measured 5.6s from full hyper to
      // the normal limit, with gravity and bounces fighting over the middle.
      const v = world.player.velocity,
        sp = Math.hypot(v.x, v.y);
      if (sp > MAX_SPEED) {
        const k = Math.max(MAX_SPEED, sp * (1 - HYPER.drag));
        world.player.velocity.x = (v.x / sp) * k;
        world.player.velocity.y = (v.y / sp) * k;
      }
      const speed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
      s.hyperPeak = Math.max(s.hyperPeak, speed);
      s.hyperAge = (s.hyperAge || 0) + 1;
      // EXIT: when the speed has been spent, OR when the budget runs out.
      //
      // The physical exit alone was not enough: a bank gives speed back, so a
      // rally inside hyper refilled it faster than gravity and drag drained it
      // and the state ran 10-15 seconds (measured). A burst the player cannot
      // leave is indistinguishable from going fast all the time.
      const spent = speed <= MAX_SPEED,
        expired = s.hyperAge >= HYPER.ticks;
      if (spent || expired) {
        s.hyper = false;
        // THE CEILING MUST COME DOWN WITH THE STATE.
        //
        // It did not, and this was the worst number in the build. On exit the
        // ceiling was still 280 and bled at 0.22 per tick, so the cube spent
        // the next ~18 SECONDS allowed to move at six times the normal limit;
        // it did not actually slow down until gravity happened to catch it, and
        // every ordinary bank in that window re-raised the ceiling again. The
        // measured result was a permanent ceiling of 86 against a design limit
        // of 42, with the cube over the redline 61% of the time.
        //
        // The state is over. The permission goes with it.
        world.playerCeiling = Math.min(world.playerCeiling || MAX_SPEED, MAX_SPEED);
        s.ceiling = world.playerCeiling;
        emit('hyperEnd', { peak: Math.round(s.hyperPeak), count: s.hyperCount, expired });
      } else {
        // Intensity for the renderer: 0 at the threshold, 1 at full hyper.
        s.hyperLevel = Math.min(1, (speed - MAX_SPEED) / (HYPER.speed - MAX_SPEED));
      }
    }
    if (!s.hyper) s.hyperLevel = 0;
  }

  function end(cause) {
    if (s.phase !== 'playing') return;
    s.cause = cause;
    s.phase = 'dying';
    focus(false);
    s.death = 27;
    s.hp = 0;
    s.stop = 0;
    s.blade = 0;
    emit('break', { ...world.player.position, angle: world.player.angle });
  }
  /** Grant a breath and remember how long THIS one is, so the pace ramp can
   *  normalise against it. Dividing by the base constant made a long breath
   *  push the multiplier below its own floor. */
  function grantBreath(ticks) {
    if (ticks <= 0) return;
    s.breath = Math.max(s.breath, ticks);
    s.breathMax = Math.max(ticks, s.breath, s.breathMax || 0);
  }
  function hurt(cause) {
    if (s.opening || s.phase !== 'playing' || s.invul > 0) return false;
    s.hp--;
    // Mercy is real-world reaction time. A faster game compresses world time
    // into fewer frames, so the window is stretched to keep the player's
    // actual recovery time unchanged.
    s.invul = PACE.invulTicks;
    s.chain = s.chainTime = s.drive = s.blade = s.parry = s.breath = s.hyperChain = 0;
    s.chainMax = CHAIN_TIME;
    s.panic = null;
    s.panicTicks = s.panicWarm = 0;
    s.edge = Math.max(1, s.edge);
    s.stop = Math.max(s.stop, 3);
    if (s.hp <= 0) end(cause);
    else emit('hurt', { ...world.player.position, cause });
    return true;
  }
  function cut(e, fromShear = false) {
    if (e.lastSlash === s.shots) return;
    e.lastSlash = s.shots;
    // ── POST-CUT GRACE ────────────────────────────────────────────────────
    //
    // A successful slice used to leave you inside the shape you just sliced.
    // The blade kept you safe for that tick, but the next contact -- one or two
    // ticks later, still overlapping -- chose `hurt()` because the cut had
    // spent `lastSlash`. So the reward for landing a cut at speed was taking a
    // hit on the way out: measured in the recording as "it punishes you
    // mid-pass".
    //
    // So the enemy you cut cannot HURT you for a short window.
    //
    // 8 ticks at normal time is ~133 ms, inside the 120-150 ms the brief asks
    // for, and it is deliberately PER-ENEMY: it must never be a global
    // invulnerability, or cutting one shape would be a shield against the
    // field.
    //
    // ── THERE IS NO IMPULSE HERE, AND THAT IS DELIBERATE ─────────────────
    //
    // The brief also asks for a "rebound impulse". A physical one was tried at
    // +5 and then +2 px/tick and rejected both times: writing velocity on every
    // cut compounds through the chain, changes which shapes get reached, and
    // measurably starved hyper -- the frame-rate camera test dropped from 150+
    // hyper frames to 70 at 60Hz with a +2 nudge. A reward that quietly makes
    // the headline state rarer is not a reward.
    //
    // The "carried clear" feel comes from the grace window instead: you keep
    // your real momentum and simply cannot be punished while you leave the
    // body. That is the part that fixes the recording's complaint, and it does
    // not touch the physics.
    if (!fromShear) {
      s.cutGrace = Math.max(s.cutGrace, CUT_GRACE);
      s.cutGraceFrom = e.id;
    }
    glideAt = Infinity;
    // ── THE IMPACT SQUASH ────────────────────────────────────────────────
    //
    // Fired on a CONNECTED CUT, which is the real impact in this game. It was
    // first keyed on landing, which measured ZERO occurrences across six full
    // runs -- the cube launches off a pad, climbs, and never comes back down, so
    // "landing" is not an event that happens.
    //
    // A connecting cut is: 17 per run. It is also the moment that deserves the
    // anime impact frame -- the body compresses for one frame at the instant the
    // blade meets a shape, which is what an impact cel is for.
    if (!fromShear) s.landAge = 0;
    const hpBefore = e.hp;
    e.hp -= s.drive > 0 ? 3 : fromShear ? SHEAR.damage : 1;
    e.flash = 16;
    s.swingStart = world.clock;
    if (s.opening) lesson.hit(e.hp > 0);
    if (e.hp > 0) {
      if (!s.opening) grantBreath(breathFor(s, 'cut'));
      s.stop = Math.max(e.pinned ? 5 : 2, s.stop);
      e.fault = s.slashAngle - e.angle;
      // ── HITTING ARMOUR IS A SHOVE, NOT A TURN ───────────────────────────
      //
      // This branch used to `return` with no consequence for the player at all,
      // so a blade that bounced off a plate felt identical to a blade that
      // missed -- and then the ordinary 133 ms grace expired while the cube was
      // still inside the shape, so the buzz of armour was followed by a hit.
      //
      // Two things happen instead:
      //
      // 1. THE PLAYER IS PUSHED BACK along the cut, away from the plate. One
      //    shove per contact, written through the body, and capped so a
      //    point-blank diagonal cannot fling the cube into a wall.
      // 2. The grace window is the ARMOURED one -- half a second -- so the
      //    follow-through cannot punish the player for the bounce.
      // The shove runs BACK along the cut: the blade came in along the slash
      // direction, so the cube is turned away from the plate.
      const a = s.slashAngle,
        pv = world.player.velocity;
      const nx = pv.x - Math.cos(a) * ARMOR_PUSH,
        ny = pv.y - Math.sin(a) * ARMOR_PUSH;
      // ── THE CEILING IS THE LIVE ONE, NOT `MAX_SPEED` ────────────────────
      //
      // This clamped to MAX_SPEED (42) and took hyper away the first time the
      // cube bounced off a plate at hyper speed: 42 is the bound for an ordinary
      // run, and hyper exists precisely to raise it. Two tests caught it -- the
      // cube "fell under the normal limit" and hyper ended, and the blade lapsed
      // with it.
      //
      // `world.playerCeiling` is the running limit the physics already enforces,
      // so the shove can never be the thing that slows the cube below what the
      // game has granted it.
      const ceil = world.playerCeiling || MAX_SPEED,
        mag = Math.hypot(nx, ny) || 1,
        k = Math.min(1, ceil / mag);
      setPlayerVelocity(world, nx * k, ny * k);
      s.cutGrace = Math.max(s.cutGrace, ARMOR_GRACE);
      s.cutGraceFrom = e.id;
      e.fault = s.slashAngle - e.angle;
      emit('armor', { x: e.x, y: e.y, r: e.r, cut: s.slashAngle, hp: e.hp, kind: e.kind });
      return;
    }
    combat.remove(e);
    stream.mark(e);
    s.kills++;
    // A streak that starts now begins its own dash budget. Hyper's gate is
    // "seven links within fourteen dashes", and that budget belongs to the
    // STREAK, not to the run: measuring against the run-wide dash counter meant
    // the gate closed permanently after launch 14 of a 128-dash run, so the
    // feature was unreachable for the other 90% of play.
    if (!(s.chainTime > 0)) s.chainFrom = s.shots;
    s.chain = s.chainTime > 0 ? s.chain + 1 : 1;
    s.maxChain = Math.max(s.maxChain, s.chain);
    s.chainTime = chainWindow(s.chain);
    // Remember the window actually granted. The HUD draws a fill bar and used
    // to divide by the CHAIN_TIME constant; with a varying window that reads
    // wrong (a fresh 96-tick window against a 96 divisor is fine, but link 10's
    // 36-tick window would show as a third-full bar). State carries it so the
    // meter always means "fraction of THIS chain's window remaining".
    s.chainMax = s.chainTime;
    if (s.chain % 6 === 0) {
      const fresh = s.drive <= 0;
      s.drive = 175;
      if (fresh) emit('drive', {});
    }
    const mult = Math.min(8, s.chain) * (s.drive > 0 ? 2 : 1),
      base = (e.small ? 45 : TYPES[e.kind].points) * mult,
      stroke = s.stroke,
      // ── PRE-EXISTING CRASH, FLAGGED ────────────────────────────────────
      //
      // `s.stroke` is only ever assigned inside `dash()` and starts null, but
      // a rail BANK also sets `s.blade = 14` -- so a cube can hold a live blade
      // without ever having dashed. When an enemy is in range on that tick,
      // `cut()` runs and `printKill` trips over `stroke.contacts`.
      //
      // Reproduced: TypeError at stroke.js:59 after a floor bank, tick 160.
      // Not caused by the floor-recovery work, but that work makes banks far
      // more common, so it gets a guard rather than a re-run. A cut with no
      // stroke on record opens no ledger; it still scores.
      ledger = printKill(
        // A bank-only blade gets a throwaway ledger: the function below reads
        // `released`/`points`/`kills` on the same object, so passing null was
        // never an option -- it just crashed further down the line.
        stroke || (s.bladeLedger ??= beginStroke(world.player.position, s.slashAngle, s.shots)),
        e, base, fromShear, s.slashAngle, hpBefore,
      ),
      { points, release } = ledger;
    // A small kill is still an impact: a short beat, never a free full
    // launch. A full-size kill buys a real choice, longer on the first one.
    if (!s.opening && !fromShear && e.small) grantBreath(breathFor(s, 'small'));
    if (!s.opening && !e.small && !fromShear) {
      if (e.sentry && s.story) s.firstAir = true;
      grantBreath(
        s.firstAir ? breathFor(s, 'firstAir') : Math.round(breathFor(s, 'cut') * 1.35),
      );
    }
    if (!s.bestStroke || stroke.points > s.bestStroke.points) s.bestStroke = stroke;
    s.score += points;
    s.edge = Math.min(MAX_EDGE, s.edge + 1);
    s.focus = 1;
    s.blade = Math.min(38, s.blade + 7);
    const impact = impactFor(e.kind, e.small, release, e.paper);
    s.stop = Math.max(s.stop, impact.stop);
    // A cut is a contact too: squash along the incoming travel, ring at the
    // exact point the two silhouettes met.
    {
      const sp = Math.hypot(world.player.velocity.x, world.player.velocity.y) || 0,
        ux = e.x - world.player.position.x,
        uy = e.y - world.player.position.y,
        n = Math.hypot(ux, uy) || 1;
      noteImpact(e.x - (ux / n) * e.r, e.y - (uy / n) * e.r, ux / n, uy / n, Math.max(sp, 8));
    }
    emit('cut', {
      x: e.x,
      y: e.y,
      angle: e.angle,
      r: e.r,
      kind: e.kind,
      cut: s.slashAngle,
      hpBefore,
      fault: e.fault,
      small: !!e.small,
      paper: !!e.paper,
      impact,
      release,
      fromShear,
      throughcut: ledger.released,
      strokePoints: ledger.points,
      strokeKills: ledger.kills,
      points,
      chain: s.chain,
    });
    if (release) {
      s.throughcuts++;
      const dx = Math.cos(s.slashAngle),
        dy = Math.sin(s.slashAngle),
        end = { x: e.x + dx * SHEAR.reach, y: e.y + dy * SHEAR.reach };
      ledger.shear = { x: e.x, y: e.y, end, angle: s.slashAngle };
      emit('shear', ledger.shear);
      // Snapshot the victims before spawning children. A wave never spawns a
      // second wave or hits a surviving plate twice on the same launch.
      for (const victim of combat.forwardHits(e, end, SHEAR.width)) cut(victim, true);
    }
    if (e.kind === 'fork') combat.kids(e);
    if (e.kind === 'crown' && s.hp < 3) {
      s.hp++;
      emit('repair', {});
    }
  }
  /** Record one contact: where, which way, how hard. `depth` is the closing
   *  speed along the normal; IMPACT turns that into a bend and a ring. */
  function noteImpact(x, y, nx, ny, depth) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || (!nx && !ny)) return;
    s.impact = { x, y, nx, ny, depth: Math.max(0, depth || 0), speed: world.player.speed };
    s.impactAge = 0;
  }
  function freezePoses() {
    s.previousSlash = s.slashAngle;
    world.previousClock = world.clock;
    const b = world.player;
    Object.assign(b.plugin.previous, b.position, { angle: b.angle });
    for (const e of combat.enemies.values()) {
      e.px = e.x;
      e.py = e.y;
      e.pa = e.angle;
    }
    for (const h of combat.hazards) {
      h.px = h.x;
      h.py = h.y;
      h.previousRadius = h.radius;
    }
    s.oldLine = s.line;
  }
  /** Is the cube within a body-length of any arena rail? */
  function railNear(w) {
    // Half a body plus a little slack: the rails clamp the CENTRE to
    // `edge + half`, so this is the band in which a bounce can happen.
    const pad = PLAYER_SIZE * 0.5 + 6;
    const a = w.arena,
      q = w.player.position,
      half = PLAYER_SIZE / 2;
    if (!a) return false;
    return (
      q.x <= a.x + half + pad ||
      q.x >= a.x + a.w - half - pad ||
      q.y <= a.y + half + pad ||
      q.y >= a.y + a.h - half - pad
    );
  }
  function recharge(dt) {
    // ── THE DRIP ONLY RUNS IN THE AIR ──────────────────────────────────────
    //
    // A pip comes back every 76 dt-units. That timer is load-bearing: it is
    // what keeps a whiffed start recoverable without a kill, and removing it
    // outright measured as four broken pacing tests (a player who misses twice
    // is simply stuck).
    //
    // What made it a FARM was that it ran while the cube sat on the floor. So
    // it is gated on `world.grounded` instead of being deleted: touch the rail
    // and the clock stops. The floor still hands back ONE pip on contact (see
    // the rail block in tick), so you can never be soft-locked down there --
    // but the floor can no longer be a pip factory, because the only thing it
    // pays is the single edge that lets you leave.
    if (s.edge >= MAX_EDGE) return void (s.recharge = 0);
    // Refuse to drip while the cube is IN CONTACT RANGE of a rail, not merely
    // while `grounded` is set. `grounded` is a single-tick flag derived from a
    // contact that is published once per arrival, and a cube bouncing on the
    // floor spends most of its time between arrivals -- so the flag was false
    // on exactly the ticks the drip needed to be suppressed.
    // ── AND THE DRIP STOPS AT THE RAIL BAND ────────────────────────────
    //
    // Proximity alone was not enough. A bounce throws the cube ~1000px clear of
    // the floor, so by the time the ripening counter mattered it was nowhere
    // near a rail and the drip paid out mid-air -- measured, a cube that only
    // fell bounced once and then collected two free pips while climbing away.
    //
    // So touching the floor STOPS the clock for a full window rather than just
    // pausing it while the cube is close. The window is longer than the timer,
    // which means a bounce can never generate a pip on its own; only sustained
    // flight can. That is what makes the floor a way out instead of a source.
    if (s.floorCool > 0) return void (s.recharge = 0);
    if (world.grounded || railNear(world)) return void (s.recharge = 0);
    s.recharge += dt;
    if (s.recharge >= 76) {
      s.edge++;
      s.recharge = 0;
    }
  }
  // ── resetRunState: THE CUTTING ROOM DOES NOT PAY ─────────────────────────
  //
  // Everything the Cutting Room accumulated is dropped on the way out. This
  // used to read "Keep the score, including the Overdrive they may just have
  // earned", and it leaked the whole tutorial economy into Sector 01: measured
  // at that commit, a clean warmup crossed the line carrying 2,100 points and a
  // chain of 4, and a better run carried 5,700 and a chain of 12. The player
  // then began the real game on a multiplier they had not earned, against
  // opponents that could not fight back, with the wave counter dragged up
  // behind them.
  //
  // A rehearsal does not score.
  //
  // Deliberately NOT reset:
  //   `best`   -- a run that beat the record and then quit still beat it.
  //   `kills`  -- lifetime-of-the-run, so the form readout stays honest about
  //               what the player actually cut.
  //   `hp`     -- the Cutting Room has no damage; rebuilding it would be a gift.
  function resetRunState() {
    s.score = 0;
    s.chain = s.chainTime = s.chainMax = 0;
    s.maxChain = 0;
    s.drive = 0;
    s.hyper = false;
    s.hyperAge = s.hyperChain = 0;
    s.band = 0;
    s.peak = 0;
    s.tier = 0;
    s.blade = 0;
    s.slashAge = -1;
    s.slashAngle = s.previousSlash = -0.65;
    s.freshSwing = false;
    s.parry = 0;
    s.stop = 0;
    // `throughcuts` is a lifetime STAT (it feeds the form grade), not an
    // economy value, so it is kept alongside `kills`.
    // Three clean pips and no dash in flight. `stopPlayer` is what the field
    // already used to put the cube at rest; it zeroes velocity properly rather
    // than leaving a launch the player cannot see.
    s.edge = MAX_EDGE;
    s.recharge = 0;
    s.depleted = false;
    stopPlayer(world);
    // ── AND THE BANNERS GO WITH IT ────────────────────────────────────────
    // One-way. The live field has no tutorial cards at all after this, which
    // is the fix for the card that kept reappearing in Sector 32.
    s.story = false;
    s.tutorialActive = false;
    s.caught = false;
    s.net = false;
    s.firstAir = false;
    s.warning = 0;
    s.panic = null;
    s.panicTicks = s.panicWarm = 0;
  }
  function enterField(cleared) {
    if (!s.opening || (!cleared && s.opening.finishing) || !['ready', 'playing'].includes(s.phase))
      return false;
    for (const e of combat.enemies.values()) combat.remove(e);
    s.opening = null;
    s.net = cleared;
    // `story` used to be re-armed to `cleared` here, which is what let the
    // guide cards come back for a player who finished the racks. It is a
    // one-way switch now: the field has no tutorial cards at all.
    s.story = false;
    focus(false);
    stopPlayer(world);
    freezePoses();
    Object.assign(origin, world.player.position);
    s.line = s.oldLine = origin.y + 650;
    s.peak = 0;
    s.reach = s.drive > 0 ? DRIVE_REACH : 1;
    s.edge = MAX_EDGE;
    s.recharge = 0;
    s.focus = 1;
    s.blade = s.parry = s.stop = 0;
    if (cleared) resetRunState();
    // Let the player actually see the first live opponent before the tide
    // starts.
    s.phase = 'ready';
    stream.sync(SPAWN, s.line - origin.y);
    emit('field', { cleared });
    return true;
  }
  function tick() {
    if (s.phase === 'ready' || s.phase === 'over') return;
    if (s.phase === 'dying') {
      freezePoses();
      if (--s.death === 0) {
        s.phase = 'over';
        emit('over', {});
      }
      return;
    }
    s.elapsed++;
    // The floor's dead band is a fact about the WORLD, and it is what the
    // physics step reads to decide whether a touch is a kick or a landing.
    // Published every tick so it can never go stale.
    world.floorIgnore = s.floorIgnore;
    // Speed tier crossings. The tier is read from the cube's LIVE velocity,
    // so it can change mid-flight as gravity bleeds a launch or a chain
    // accelerates one. Only a crossing UPWARD is celebrated: announcing that
    // you got slower would punish the player for the physics they cannot see.
    // Latched on `s.tier` so a speed that hovers on a threshold cannot spam.
    {
      const v = world.player.velocity,
        speed = Math.hypot(v.x, v.y),
        tier = tierOf(speed, MAX_SPEED);
      // The BASELINE matters more than it looks. Seeding this at 0 (DRIFT)
      // meant the cube launched straight into CRUISE while the latch still
      // believed it was at DRIFT, so every launch fired a "you reached CRUISE"
      // announcement for a tier the player had never left. Tracking the last
      // OBSERVED tier means only a genuine change upward is celebrated, and
      // the latch is seeded on the first tick the cube is actually flying.
      // NOTE: the latch is only written in the branch that consumes it.
      // An earlier version ended with a bare `else s.tier = tier.index`, which
      // overwrote the latch on every single tick -- so the "did it go up?"
      // comparison always ran against the current tier and could never be
      // true. The event was unreachable, and no amount of adjusting the
      // threshold would have fixed it.
      if (s.tier == null) s.tier = tier.index;
      else if (tier.index > s.tier && s.phase === 'playing' && !s.opening) {
        s.tier = tier.index;
        emit('tier', {
          id: tier.id,
          label: tier.label,
          multiplier: 1 + tier.index,
          speed: Math.round(speed),
        });
      } else if (tier.index < s.tier) s.tier = tier.index;
    }
    // ── ENTITY-ONLY HITSTOP ────────────────────────────────────────────────
    //
    // This used to `return` here, which froze THE WHOLE RUN: physics, the
    // camera, the hazards, the clock. On a Crown split (4 ticks) the world
    // visibly stopped, and because the camera was frozen inside the stop the
    // muzzle of the impact and the frame around it both locked -- a dropped
    // frame, not an impact.
    //
    // A hitstop should stop the things that were HIT, not the room they are in.
    // So the ENTITIES freeze (their poses are pinned and their bodies do not
    // integrate) while the clock, the camera and the effect layers keep running.
    // The player keeps reading the frame as a still image of the moment, with
    // the world continuing around it -- which is what sells the weight.
    // NOT a `return`. Everything below this line is the part that should keep
    // running during a hitstop: the animation clocks, the springs, the
    // shockwaves, the effect ages. Only the physical integration is gated,
    // and that happens much further down at `stepPhysics`.
    // Read the flag FIRST. Decrementing before testing is an off-by-one that
    // silently integrates on the opening tick of every hitstop -- the one tick
    // that matters, because that is the frame the impact lands on.
    const stopped = s.stop > 0;
    if (stopped) {
      s.stop--;
      freezePoses();
    }
    if (s.impact && ++s.impactAge > IMPACT.springTicks) {
      s.impact = null;
      s.impactAge = 0;
    }
    if (s.boom && ++s.boomAge > 30) {
      s.boom = null;
      s.boomAge = 0;
    }
    // Animation clocks. These advance in TICKS and are read by the renderer
    // together with `alpha`, so the animation is frame-rate independent: at
    // 144Hz the renderer sees the same tick twice with different alpha and
    // draws the in-between frame itself.
    //
    // ── AGE 0 MUST BE OBSERVABLE ─────────────────────────────────────────
    //
    // `dash()` sets `slashAge = 0` from OUTSIDE the tick, so anything that
    // increments unconditionally burns the zero frame before the renderer or a
    // test can see it -- the wind-up's first frame simply never existed. That
    // went unnoticed because the old whole-run hitstop `return` skipped this
    // line on the ticks that mattered, which is a bug cancelling a bug.
    //
    // `s.freshSwing` is set by `dash()` and consumed here: the tick that
    // STARTS a swing holds it at 0, and the next tick begins counting.
    if (s.slashAge >= 0 && !s.freshSwing) s.slashAge++;
    s.freshSwing = false;
    // The splat runs on its own clock, because it is the BODY's reaction and
    // the dash's clock keeps running. It ends and clears itself, so nothing
    // downstream has to remember to reset it.
    if (s.splat && ++s.splat.age >= SPLAT.total) s.splat = null;
    // Cap it: landFor() stops returning a pose past FALL.land anyway, so an
    // unbounded counter was harmless here -- but it is a number that would
    // eventually lose float precision over a long run, and a counter that
    // measures nothing should not grow forever.
    if (s.landAge >= 0 && s.landAge <= 64) s.landAge++;
    if (world.player.velocity.y > 0) s.fallAge = (s.fallAge >= 0 ? s.fallAge : 0) + 1;
    else s.fallAge = -1;
    // ── LANDING ──────────────────────────────────────────────────────────
    //
    // The squash fires on the transition from airborne to grounded, which is
    // what actually happens when the cube comes down: it lands on the pad.
    //
    // Keying this on a `bottom` RAIL contact instead fired ZERO times in a
    // 2,400-tick run, because the arena floor sits below the pad and the cube
    // never reaches it -- the squash was dead code, and it looked fine in a
    // unit test because that test called landFor() directly.
    //
    // `grounded` is set by the physics step from the real contact normal, so
    // this is a landing, not an approximation of one.
    if (world.grounded && !s.wasGrounded && s.phase === 'playing') s.landAge = 0;
    s.wasGrounded = world.grounded;
    if (s.opening?.finishing) {
      freezePoses();
      if (!--s.opening.finishing) enterField(true);
      return;
    }
    if (s.opening && lesson.parkedTick(s)) {
      recharge(1);
      return;
    }
    if (s.held && !s.depleted) {
      s.focus = Math.max(0, s.focus - 1 / 165);
      if (s.focus < 0.0001) {
        s.depleted = true;
        setBulletTime(world, false);
      }
    } else if (!s.held) s.focus = Math.min(1, s.focus + 1 / 250);
    // One beat to choose the next line. A new launch is always immediate.
    if (world.clock >= glideAt) {
      glideAt = Infinity;
      // A DASH THAT CROSSES EMPTY SPACE BREAKS THE STREAK.
      //
      // This is what "seven CONSECUTIVE cuts" has to mean, and it did not: the
      // chain only reset on a TIMEOUT, so it was really "seven kills before
      // your last one ages out". Kills accrue passively -- a launch that merely
      // flies past a dying shape still counts -- so in the measured build hyper
      // promoted itself at dash 9 with the player doing nothing but launching
      // and waiting. The user's report was exact: "how is my character getting
      // super speed just from single time launching".
      //
      // `glideAt` firing IS the miss: the launch resolved and the blade never
      // connected. Missing breaks the streak, which makes seven-in-a-row an
      // actual feat and makes the dash budget meaningful.
      // A miss CAPS the streak, it does not erase it.
      //
      // Two failures bracket this line, both measured:
      //   no reset at all  -> hyper promoted itself at dash 9 from passive play
      //                       ("super speed just from single time launching")
      //   reset to zero    -> a single miss wiped a 38-chain, and long-run score
      //                       collapsed from ~350,000 to ~35,000 on half the
      //                       seeds. That is not "consecutive cuts", that is a
      //                       knife-edge that makes every shot must-hit-or-restart.
      //
      // So a miss drops the streak to MISS_CAP. The player keeps their momentum
      // and their Overdrive, but they cannot climb a streak by missing -- each
      // miss puts a ceiling of MISS_CAP on the chain until enough hits lift it
      // back above. Seven-in-a-row is still exactly what hyper requires (the
      // gate wants chain >= HYPER.chain, and a miss makes that impossible until
      // you rebuild past the cap), and a long clean run is untouched.
      if (!world.grounded && s.chain > MISS_CAP && !s.caught) {
        s.chain = MISS_CAP;
        s.chainTime = chainWindow(MISS_CAP);
        s.chainFrom = s.shots;
      }
      // Also leave a short beat after crossing empty space. No phantom
      // impact, refund or freeze for missing the target.
      if (!world.grounded) grantBreath(breathFor(s, 'small'));
    }
    // The lethal stripe should not first enter view a tenth of a second
    // before impact. Telegraph a descent and give it a readable final beat.
    const gap=s.line-world.player.position.y;
    s.warning = s.opening
      ? 0
      : clamp((840 - gap) / 220, 0, 1) * clamp((world.player.velocity.y - 3) / 11, 0, 1);
    // At most two forward panic beats per launch, half a second each. They
    // never touch the focus meter: the grace is a pace limit, not a spend.
    if (s.panicTicks > 0) {
      s.panicWarm = Math.min(99, s.panicWarm + 1);
      if (--s.panicTicks === 0) {
        s.panic = null;
        s.panicWarm = 0;
      }
    }
    if (!s.panicTicks) panicWindow({ world, state: s, combat }, false, true);
    // Pacing, from one place: a breath is a short lean, the field-edge warning
    // is a shove, and nothing here is allowed to crawl. `held` focus sets its own
    // floor through world.slow, which advanceTiming also caps.
    const focusFloor = s.held ? focusPace(s) : 1,
      pace = Math.min(
        1 - (1 - PACE.warnDepth) * s.warning,
        s.breath
          ? PACE.breathScale +
            (1 - PACE.breathScale) * (1 - s.breath / Math.max(1, s.breathMax || PACE.breathTicks))
          : 1,
        panicScale(s),
        focusFloor,
      );
    if(s.breath) s.breath--;
    if(!s.breath) s.breathMax=0;
    // ── THE ONE GATED CALL ────────────────────────────────────────────────
    //
    // A hitstop stops the things that were HIT. This is the only line the stop
    // touches: no integration, no enemy movement, no rail resolution. The
    // camera, the effect clocks and every spring below keep running, so the
    // frame is a still image of the impact inside a room that is still moving.
    if (!stopped)
      stepPhysics(
        world,
        // `beforeStep` runs immediately BEFORE the substeps, so anything the
        // physics pass reads must be published here, not at the top of the
        // tick. The floor's ignore window was published at the top of the tick
        // and set at the bottom of it, which meant physics always saw the value
        // from the PREVIOUS tick -- 0 -- and re-kicked the cube on the very
        // substep after every trampoline launch. Measured: -13.5 in, -35.5 out,
        // and a 1,700px climb from a rule that promises one third of a screen.
        (dt) => {
          world.floorIgnore = s.floorIgnore;
          combat.move(dt, s.band);
        },
        pace,
      );
    else world.previousClock = world.clock;
    // ── IS THE CUBE CLEAR OF THE RAILS? (read by the contact block below) ──
    //
    // This has to be measured AFTER physics and BEFORE any contact is handled:
    // the floor's one-pip rescue pays only if the cube has been clear of the
    // rail since it last paid, and the contact block is what asks. Computing it
    // at the bottom of the tick (where it used to live) meant the answer was
    // always one tick stale -- measured while the cube was still ON the rail --
    // so the rescue never fired at all on a clean fall.
    if (!stopped) s.railAway = !railNear(world);

    // ── SOFT ASCENT CAP ──────────────────────────────────────────────────
    //
    // Only the UPWARD component, only while climbing, and applied after the
    // integrator so it cannot fight the solver. Horizontal speed is untouched,
    // so this costs the player nothing except altitude-per-tick.
    //
    // Not applied during hyper: hyper is the reward state and its whole point
    // is going through the ceiling. Boarded-out ascent is a problem of the
    // ORDINARY chain, which is where it was measured.
    //
    // IT DOES NOT APPLY TO A REBOUND. `railBounce` has already written the new
    // upward velocity by the time this runs, and clamping that is clamping the
    // bank -- measured, it shrank every bounce by ~40%, which changed the whole
    // shape of a floor rally (4 bottom contacts in 400 ticks where there had
    // been 2, and the one-pip floor rescue stopped paying because the cube never
    // got clear of the rail band). A bank is the player's reward for arriving
    // fast; it is not the run-away ascent this cap exists to fix.
    //
    // So the cap only trims speed the CHAIN built -- the case where the cube is
    // climbing on its own momentum with the blade out.
    // ── A TRAMPOLINE KICK IS A BANK, NOT A CLIMB ─────────────────────────
    //
    // The floor writes a FIXED upward speed (see trampolineVy), and the cap
    // below exists to trim speed the CHAIN built on open-air momentum. Clamping
    // a kick would silently make the trampoline's height depend on the cap
    // instead of on one third of a screen -- and it did: measured, a kick of
    // 13.5 px/tick came out of the tick reading -26, because the cap exempted
    // only `world.banked` and the kick had not set it.
    //
    // `world.floorKick` is consumed by the floor paayer earlier in this tick, so
    // the exemption is latched on `s.floorIgnore`, which is exactly the half
    // second the floor owns after a kick.
    if (!stopped && !s.hyper && !world.banked && !(s.floorIgnore > 0)) {
      const vy = world.player.velocity.y;
      if (vy < -MAX_ASCENT_VY) world.player.velocity.y = -MAX_ASCENT_VY;
    }
    // ── THE FALL SPEED CAP ────────────────────────────────────────────────
    //
    // One screen height per 1.2 seconds, and it is a hard cap rather than a
    // drag curve. The brief is about READABILITY as much as fairness: below
    // this speed the arc is something the player can look at and time a save
    // against, and above it the fall is a blur that ends in a wall.
    //
    // Exempt while aiming: a held aim is the player explicitly asking for time,
    // and the aim damping above already owns that case (it reduces the fall to
    // 10%, far below the cap). Also exempt on a trampoline tick, because the
    // floor's kick owns the vertical speed for that half second.
    if (!stopped && !s.hyper && world.player.velocity.y > FALL_CAP_VY)
      world.player.velocity.y = FALL_CAP_VY;
    // ── WHAT ACTUALLY MOVED ──────────────────────────────────────────────
    //
    // Displacement over the tick, computed after physics and before anything
    // reads it. `velocity` can be non-zero on a body that did not move -- the
    // rail solver resolves every tick -- so anything whose job is to DESCRIBE
    // motion (the speedometer, squash/stretch, ghost emission) reads this
    // instead. Anything whose job is to MODEL motion (gravity, bounces) keeps
    // velocity.
    {
      const p2 = world.player.position;
      s.moved = Math.hypot(p2.x - s._lastX, p2.y - s._lastY);
      s._lastX = p2.x;
      s._lastY = p2.y;
      // ── A SMOOTHED SPEED, NOT A ONE-FRAME ONE ───────────────────────────
      //
      // `moved` is the distance covered in ONE tick, and anything reading it
      // directly has two failure modes that both showed up in play:
      //
      //  1. A hitstop skips `stepPhysics` entirely, so the distance for those
      //     ticks is 0. A readout of the raw value drops to 0 in the middle of
      //     the fastest moment in the game -- the frame the impact lands on.
      //  2. A cube vibrating against the floor rail covers a few px every
      //     tick, so a raw readout says "61" while the cube is visibly still.
      //
      // Both are the same mistake: a single tick is not a speed, it is a
      // sample. The speedometer now reads a ~0.2s mean of real distance, which
      // survives a 2-5 tick freeze because the samples around it are large, and
      // averages floor jitter against the still frames between bounces.
      //
      // `MOVE_HIST` is 12 ticks -- 200ms at the 60Hz the simulation runs at.
      pushMove(s, s.moved);
      // A cube resting on a rail or a deck, with no meaningful vertical speed,
      // is AT REST: whatever velocity the solver left behind is not motion the
      // player can see, so the effects that read "how fast is this thing"
      // are told zero.
      const rest = world.railRest;
      s.railSettle =
        (rest || world.grounded) && Math.abs(world.player.velocity.y) < RAIL_SETTLE_VY;
      // ── AT REST THE WINDOW IS ZEROED, NOT AVERAGED ──────────────────────
      //
      // Averaging alone cannot fix the "61 while standing still" report. The
      // rail solver nudges the cube a few px every tick, so the mean of twelve
      // jittery samples is a steady small number -- a liar's 61 rather than a
      // liar's 0. At rest the window is emptied, which also means a player
      // leaving the floor starts the average from nothing instead of
      // inheriting the speed they had before they landed.
      if (s.railSettle) settleMove(s);

    }
    // ── READ THE EVENT, NOT THE MEMORY ──────────────────────────────────
    //
    // `world.contact` is the LAST contact and never goes back to null: it is
    // the debounce memory `noteContact` uses. Reading it here meant the level
    // test `hitSurface !== lastContact` was masquerading as an edge test, so a
    // cube parked on the floor reported "touching a rail" on 289 of 300 ticks
    // and its pose stayed squashed.
    //
    // `world.struck` is the contact that happened THIS TICK, or null.
    // One contact per tick, straight from Matter's resolved normal. A wall,
    // a deck, a plate that stops the blade: the pose bends the same way.
    const hitSurface = world.struck;
    // ── THE FLOOR PAYS, ONCE PER TOUCH ────────────────────────────────────
    //
    // The brief for the bottom line is exact: every touch kicks the cube up a
    // third of a screen (physics does that), flashes the line WHITE, plays ONE
    // spring sound, and returns ONE edge pip -- but only while the player is
    // below three, and then the floor is ignored for half a second so a cube
    // can never double-bounce or buzz against it.
    //
    // `world.floorKick` is the physics layer saying "a kick just happened", and
    // it is one event per arrival, not one per tick: the ignore window below is
    // what guarantees that, because without it a trampoline that always kicks
    // would re-kick on the very next substep.
    if (world.floorKick) {
      const kick = world.floorKick;
      world.floorKick = null;
      if (s.phase === 'playing' && !(s.floorIgnore > 0)) {
        // Half a second of immunity from the floor. 30 ticks at 60Hz.
        s.floorIgnore = FLOOR_IGNORE_TICKS;
        s.floorFlash = 8; // how long the line stays white; see the renderer
        s.floorKicks = (s.floorKicks || 0) + 1;
        // Tells the generic rail-bank block below that this contact is already
        // paid and must not be boosted or damped on top of the kick.
        s.floorTouched = true;
        // ONE pip, and only while below the maximum. A player sitting on three
        // edges gets the bounce and the flash but not a fourth pip; a player
        // with none gets a way back into the game. This is the anti-farm: the
        // cap is the reward ceiling, not a cooldown.
        if (s.edge < MAX_EDGE) {
          s.edge++;
          s.edgeReturn = 14;
        }
        emit('floorKick', { vy: kick.vy, edge: s.edge });
      }
    }
    if (hitSurface && hitSurface !== lastContact && s.phase === 'playing') {
      lastContact = hitSurface;
      noteImpact(hitSurface.x, hitSurface.y, hitSurface.nx, hitSurface.ny, hitSurface.depth);
      // ── A DASH INTO A WALL ──────────────────────────────────────────────
      //
      // `surface === 'rail'` is the arena boundary (physics.js publishes that
      // for all four sides). Hitting one MID-DASH is the case the brief calls
      // Wall_Impact_[Direction]: the dash is interrupted and the body splats.
      //
      // The window is the dash's own active phase -- a dash that has already
      // spent itself braking against nothing cannot be "interrupted", and a
      // wall touched while walking is just a wall.
      if (hitSurface.surface === 'rail' && s.slashAge >= 0 && s.slashAge < DASH.windup + DASH.active) {
        s.splat = { age: 0, nx: hitSurface.nx, ny: hitSurface.ny };
      }
    }
    // ── RAIL BANK ────────────────────────────────────────────────────────────
    //
    // A rail is not a wall you hit, it is a shot you play. Bouncing off a rail
    // refunds an edge and kicks the cube faster than it arrived.
    //
    // Without this rule the walls were pure cost. Measured: the cube hit the
    // top rail around t=75 and then rattled around the arena for 200 ticks with
    // 0 edges, unable to launch, while enemies sat 400-600px away. Kills fell
    // from 48 to 7. A wall that only takes is worse than no wall.
    //
    // Keyed on its own cooldown rather than on `hitSurface !== lastContact`:
    // that test is right for drawing an impact ring but wrong for a reward,
    // because Matter resolves one rail contact across several ticks and reuses
    // the same contact object. Measuring banks that way saw exactly ONE in 300
    // ticks while the cube was visibly sitting on the rail.
    if (hitSurface?.surface === 'rail' && s.phase === 'playing' && !(s.bankCool > 0)) {
      // ── THE FLOOR ITSELF ────────────────────────────────────────────────
      //
      // One edge back, and the chain goes. `edgeReturn` is a counter the HUD
      // reads to flash the pip that came back, so the refund is visible rather
      // than a number quietly changing.
      //
      // RESET THE CHAIN, not just let it time out: timing out would let a
      // player hop on the floor between kills and keep a long chain alive,
      // which is exactly the farm this is meant to close.
      // ONE PER ENTRY, not one per cooldown.
      //
      // `bankCool` was the gate here, which meant a cube resting on the floor
      // simply waited out 24 ticks and collected again: measured, a cube that
      // only ever fell went 0 -> 1 -> 2 -> 3 pips in 71 ticks on the floor
      // alone. A cooldown is a rate limit; what this needs is an EDGE. So the
      // recovery pays only if the cube has been clear of the rail band since
      // the last time it paid, which is tracked as `s.railAway`.
      // ...and it only pays when you have NOTHING. The brief for this was
      // narrow: "0-pip floor states aren't soft-locks". A cube with a pip in
      // reserve is not soft-locked, it is armed -- it needs no rescue, and
      // paying it anyway turns every bounce into income. Measured before this
      // gate: a cube that only ever fell collected a pip on each bounce, once
      // every 24 ticks, indefinitely.
      if (s.railAway && s.edge === 0) {
        s.edge++;
        s.edgeReturn = 14;
        emit('recover', { edge: s.edge });
      }
      // (An earned bounce further down this block may add one more; the cap is
      // MAX_EDGE either way, so a fast arrival can go 0 -> 2 but never 0 -> 3.)
      if (s.chain > 0) {
        s.chain = 0;
        s.chainTime = 0;
        s.drive = 0;
        emit('chainBroken', {});
      }
      const v = world.player.velocity,
        speed = Math.hypot(v.x, v.y),
        // ── THE BOUNCE, AND THE NEAR-WALL BONUS ────────────────────────────
        //
        // Under hyper the gain SCALES WITH IMPACT SPEED rather than being a
        // constant. That is the brief's "if you are already near the wall when
        // you earn this speed, bouncing gives you a more sonic boom speed" --
        // and it falls out of the physics instead of needing a special case for
        // being close to a wall. A player who enters hyper near a rail arrives
        // fast and rebounds harder; one who enters far away spends the margin
        // travelling. Same rule, different outcome, no branching.
        //
        //   impact  42 (normal)  -> gain 1.09, an ordinary billiard bounce
        //   impact 280 (full)    -> gain 1.60, the wall throws you back harder
        //
        // Clamped to HYPER.reboundCap so a chain of bounces compounds into
        // spectacle rather than into a number the integrator cannot step.
        // ── THE SONIC BOOM IS ONE BOUNCE, NOT A MOTOR ─────────────────────
        //
        // A pure multiplier here pumps forever: measured with a bot bouncing
        // every 8 ticks, each rail contact returned +35% and hyper never ended
        // (1650 ticks, 27s, no exit). A bounce that always gives back more than
        // it took is not a payoff, it is a perpetual motion machine.
        //
        // The brief is narrower than that: "if you are ALREADY NEAR THE WALL
        // when you earn this speed, bouncing gives you a greater sonic-boom
        // speed". That is one violent throw, the reward for arriving fast, and
        // then the state decays as designed. So the boom is armed on entry and
        // spent by the first rail contact; later bounces are ordinary.
        boom = s.hyper && s.hyperBoom,
        BOOST = boom
          ? Math.min(HYPER.reboundCap, 1 + (speed / HYPER.speed) * HYPER.bankGain)
          : s.hyper
            ? // NOT a small boost. Even 1.06 per bounce is a net MOTOR: a bot
              // touching a rail every 8 ticks gains 4.8% while drag takes
              // 3.9%, so hyper ran 1440+ ticks and never ended. A wall during
              // hyper is a turn, not a reward -- the one reward is the boom.
              1
            : 1.14,
        CEIL = boom ? HYPER.speed * HYPER.reboundCap : s.hyper ? HYPER.speed : MAX_SPEED * 2.1;
      // ── 0.4s, THE NUMBER THE BRIEF ASKS FOR ──────────────────────────
      //
      // This was 8 ticks (0.13s), which is a debounce, not a cooldown. On a
      // floor bounce it meant a pip every 8 ticks: measured, a cube dropped
      // onto the floor went 0 -> 2 -> 3 pips in 31 ticks doing nothing but
      // falling. Touching a rail is an ENTRY, and an entry has to cost time.
      s.bankCool = 24;
      // Raise the CEILING as well as the velocity.
      //
      // This is the rule that makes "chain slashes to a speed beyond the limit"
      // true. `capVelocity` runs on every physics substep and clamps the cube
      // to MAX_SPEED, so a pure velocity boost was erased before it could be
      // seen -- the boost functions were being called and doing nothing.
      // Each bank in a rally lifts the ceiling a little further, so the run's
      // top speed is a function of how well the rally is going, not of a
      // constant. It decays back so the limit is only ever beaten MOMENTARILY.
      // RALLY_CEIL bounds the ordinary ratchet.
      //
      // Each bank used to add a flat +1.6 to the ceiling while the bleed was
      // only -0.22/tick, so a rally banking more often than once every ~7 ticks
      // climbed the ceiling WITHOUT LIMIT: measured 42 -> 86 over 1,800 ticks,
      // which is why the cube felt like it never came back down. A rally is
      // allowed a burst well above the limit -- that is the bank's whole reward
      // -- but the permission itself is capped, so a good rally is fast for a
      // moment rather than permanently faster.
      const rally = Math.min(RALLY_CEIL, (world.playerCeiling || MAX_SPEED) + 1.6);
      world.playerCeiling = boom
        ? HYPER.speed * HYPER.reboundCap
        : s.hyper
          ? HYPER.speed
          : Math.min(CEIL, rally);
      if (boom) s.hyperBoom = false;
      s.ceiling = world.playerCeiling;
      // ── THE BOUNCE HAS TO BE EARNED ──────────────────────────────────
      //
      // This used to pay on SPEED, and speed cannot tell the difference: the
      // cube's terminal velocity IS `MAX_SPEED` (42), which is also roughly
      // what a dash arrives at. Measured, a cube simply dropped onto the floor
      // arrived at 42 px/tick and banked exactly like a deliberate shot, twice
      // in 47 ticks, with gravity as the only input.
      //
      // So the test is not how fast you hit the rail, it is whether you THREW
      // yourself at it. `s.sinceDash` is set by `dash()` and consumed here, so
      // a cube that is only falling -- however fast -- banks nothing.
      // ── THE FLOOR'S KICK IS THE REWARD, NOT A BANK TO BOOST ──────────
      //
      // The trampoline already wrote a fixed upward speed this tick. Letting the
      // generic bank machinery boost it as well turned a 240px kick into a
      // 1,700px one -- measured: arrive at 20, kick at 13.5, and the next tick
      // read -35.5 because `earned` was still true from the dash that began the
      // fall. The two rules are alternatives, not layers: if the floor kicked,
      // this contact has already paid.
      // `floorTouched` is set by the trampoline block above on the tick a kick
      // was paid, and is the honest "the floor already handled this contact".
      // Comparing `floorKicks` against a falling `floorIgnore` was a losing
      // race: the window decrements before this block reads it, so the test was
      // false on exactly the tick it needed to be true.
      const floorKicked = Boolean(s.floorTouched);
      s.floorTouched = false;
      const earned = s.sinceDash && !floorKicked;
      if (floorKicked) s.sinceDash = false;

      // Touching a rail stops the refill clock for longer than the timer takes
      // to ripen, so a bounce can never pay for itself. See `recharge`.
      s.floorCool = 160;
      if (earned && !floorKicked && speed < CEIL) boostPlayer(world, BOOST, CEIL);
      // An unearned bounce is NOT a free elastic reflection. Left perfectly
      // elastic it is a perpetual motion machine -- the cube comes back up at
      // exactly the speed it went down, so gravity re-charges it forever.
      //
      // NOTE: `boostPlayer(world, 0.82)` cannot do this. It clamps the factor
      // with `Math.max(1, ...)`, so anything under 1 is a no-op at best and a
      // RATCHET at worst: when the cube is over the ceiling it multiplies by
      // `ceiling/speed` after having already risen, so repeated bounces climb.
      // Measured with the no-op: a cube that only fell reached -199 px/tick in
      // 100 ticks and escaped the arena entirely. So this damps directly.
      // ── NEVER DAMP A CUBE THE FLOOR JUST KICKED ─────────────────────────
      //
      // The floor's kick is an absolute upward speed. The generic damping below
      // exists to stop an unearned rail bounce being a perpetual-motion machine,
      // but it does not know the difference between "the cube drifted into a
      // wall" and "the trampoline just fired". Because it multiplies whatever
      // velocity it finds, running it on a kick tick silently reduced a 13.5
      // launch to 11.05 -- a floor that gets weaker the faster you land.
      //
      // `s.floorIgnore` is the floor's own half-second, which is exactly the
      // window in which the floor owns the cube's vertical speed.
      // ── AND NEVER DAMP A MANDATED WALL BOUNCE EITHER ────────────────────
      //
      // The pinball walls keep a FIXED fraction (WALL_KEEP) of the arrival
      // speed. This damper used to multiply that again, so a 20px/tick arrival
      // came back at 13.9 instead of the 17.0 the rule promises -- 0.85 * 0.82.
      // Two independent reductions on one event is the same defect as two
      // writers to one property, and it is why the wall felt spongy.
      //
      // The damper's job is the CUSHION rails (the ceiling), which have no
      // ignore window and would otherwise be a perpetual-motion rally.
      else if (!earned && !(s.floorIgnore > 0) && !(world.wallBounced > 0))
        dampPlayer(world, 0.82);
      // ...and only an earned bounce returns a pip. The floor's own recovery
      // (one edge, chain reset) is handled above and is deliberately separate:
      // it is the way OUT of trouble, not a reward for touching a wall.
      // The floor's own pip is paid in the trampoline block above; paying again
      // here would make one touch worth two pips.
      if (earned && !floorKicked) s.edge = Math.min(MAX_EDGE, s.edge + 1);
      s.banks++;
      s.blade = Math.max(s.blade, 14);
      // Publish the shockwave for the renderer. Only worth drawing at speed:
      // a slow graze should not produce a sonic boom.
      if (speed > MAX_SPEED * 0.45) {
        s.boom = {
          x: hitSurface.x,
          y: hitSurface.y,
          nx: hitSurface.nx,
          ny: hitSurface.ny,
          speed,
        };
        s.boomAge = 0;
      }
      emit('bank', {
        x: hitSurface.x,
        y: hitSurface.y,
        nx: hitSurface.nx,
        ny: hitSurface.ny,
        speed: Math.round(speed),
        after: Math.round(Math.hypot(world.player.velocity.x, world.player.velocity.y)),
        hyper: s.hyper,
        banks: s.banks,
        combo: s.banks >= 3,
      });
    }
    // The pip-return flash is a short readout, not a state.
    if (s.edgeReturn > 0) s.edgeReturn--;
    // Bleed the rally ceiling back down to the normal limit. A shot is faster
    // than MAX_SPEED for a second or two after a bank and then the world
    // reasserts itself, so the over-speed is a burst the player created.
    if (s.hyper) {
      // During hyper the FLOOR of the ceiling is HYPER.speed -- but a bounce is
      // allowed to raise it to HYPER.speed * reboundCap and that headroom must
      // survive the next tick or the rebound is clamped away the instant it
      // happens. (Measured before this fix: every bounce peaked at 354 for one
      // tick and was cut to 280 on the next, so the wall-throw never landed.)
      // Bleed the extra headroom back at the same rate the normal rally does.
      const floor = HYPER.speed;
      if (!(world.playerCeiling > floor)) world.playerCeiling = floor;
      else world.playerCeiling = Math.max(floor, world.playerCeiling - 0.6);
      s.ceiling = world.playerCeiling;
    } else if (world.playerCeiling > MAX_SPEED) {
      world.playerCeiling = Math.max(MAX_SPEED, world.playerCeiling - 0.22);
      s.ceiling = world.playerCeiling;
    }
    const dt = world.engine.timing.timeScale;
    s.previousSlash = s.slashAngle;
    // Reach is a property of the launch, not of the frame: a magnetised
    // corridor keeps its slightly wider blade until the next launch.
    if (!s.opening) s.reach = (s.drive > 0 ? DRIVE_REACH : 1) + (s.locked ? 0.12 : 0);
    if (s.blade > 0) {
      s.slashAngle = Math.atan2(world.player.velocity.y, world.player.velocity.x);
      combat.sweepBlade(s.slashAngle, s.reach);
    }
    for (const e of combat.contacts) {
      if (!combat.enemies.has(e.id) || s.phase !== 'playing') continue;
      // The shape you just cut cannot TOUCH you while you leave its body. This
      // is scoped by id on purpose -- see the note in `cut()`.
      //
      // It suppresses the HURT branch only. Cutting is never suppressed: the
      // whole point of the window is that the cube is still inside the shape
      // and may earn another plate off it (a Bastion shell, a Crown plate), and
      // swallowing that would turn a reward into a lockout. Measured with the
      // grace applied to both branches: the "second cut scores once" test lost
      // its second cut entirely.
      if (s.blade > 0) cut(e);
      else if (s.cutGrace > 0 && e.id === s.cutGraceFrom) continue;
      else hurt(TYPES[e.kind].name);
    }
    combat.contacts.clear();
    combat.attacks(dt, (h) => {
      const facing = h.kind === 'needle' && Math.cos(s.slashAngle - h.angle) < -0.2;
      if (s.blade <= 0 || !(facing || s.parry > 0))
        hurt(h.kind === 'ring' ? 'Pulse wave' : `${TYPES[h.source].name} needle`);
      else if (h.kind === 'needle') emit('parry', { x: h.x, y: h.y, angle: h.angle });
    });
    combat.linkAttacks(stream.live, dt, () => {
      if (s.parry <= 0) hurt('Prism link');
    });
    if (s.phase !== 'playing') return;
    // HYPER HOLDS THE BLADE ON.
    //
    // This one line is the whole "continuously in slashing mode" behaviour. The
    // contact loop already chooses cut() over hurt() when s.blade > 0, so
    // keeping the blade alive converts every shape the cube touches into chaos
    // instead of damage. No new collision code, no special case in the fight --
    // hyper just refuses to let the blade expire.
    s.blade = s.hyper ? Math.max(s.blade, 1) : Math.max(0, s.blade - dt);
    s.parry = Math.max(0, s.parry - dt);
    // ── THE GRACE WINDOW IS A DISTANCE, NOT A DURATION ──────────────────
    //
    // It must not burn down during a hitstop. The whole point is "you cannot be
    // hurt while you LEAVE the body", and during a stop the cube is not leaving
    // anything -- it is pinned in place by the very impact that started the
    // window. Measured: an 8-tick grace against a Bastion whose armor hit
    // triggers a 5-tick stop left 3 ticks of real movement, and the cube was
    // struck by the same Bastion it had just cut.
    //
    // So it is held while the entities are frozen. The window is spent on
    // motion, which is what it was for.
    if (s.cutGrace > 0 && !stopped) {
      s.cutGrace = Math.max(0, s.cutGrace - dt);
      if (!s.cutGrace) s.cutGraceFrom = null;
    }
    s.invul = Math.max(0, s.invul - dt);
    s.drive = Math.max(0, s.drive - dt);
    recharge(world.focusScale);
    if (s.opening) {
      if (lesson.advance(s, dt)) emit('racksCleared', {});
      return;
    }
    if (
      solo &&
      (!combat.enemies.has('0:0/0') ||
        Math.hypot(world.player.position.x - origin.x, world.player.position.y - origin.y) > 410)
    ) {
      solo = false;
      for (const spec of waiting) if (stream.live.has(spec.home)) place(spec);
      waiting.length = 0;
      emit('leaveLane', {});
    }
    // ── TIMERS COUNT DOWN EVERY TICK ────────────────────────────────────
    //
    // `bankCool` used to be decremented at the BOTTOM OF THE BANK BLOCK, which
    // only runs on a tick where a bank happened. So the cooldown froze the
    // moment the cube left the rail and the very next arrival banked again:
    // measured, a cube dropped on the floor took a second pip 24 ticks later
    // with the cooldown still reading 23. A head start you give yourself is
    // only a head start if it runs down.
    if (s.bankCool > 0) s.bankCool--;
    if (s.floorCool > 0) s.floorCool--;
    if (s.floorIgnore > 0) s.floorIgnore--;
    if (s.floorFlash > 0) s.floorFlash--;
    // ── AIMING SLOWS THE FALL BY 90%, FOCUS OR NOT ──────────────────────
    //
    // The brief asks for this as a physical rule, not a focus perk: holding aim
    // must slow falling by 90%, so a player can line up a save on the way down
    // without spending anything for the privilege. The old code gated the slow
    // on `s.focus > 0.01` AND only refreshed it inside `focus()`, which runs on
    // the aim EVENT -- so a player who held aim until the meter emptied got no
    // slowdown at all, and a player who aimed then fell kept the flag from the
    // moment they pressed the button.
    //
    // Evaluated every tick from the live holding state, which is the only thing
    // that is actually true.
    if (s.phase === 'playing' && s.held && world.player.velocity.y > 0) {
      world.player.velocity.y *= AIM_FALL_KEEP;
    }
    // "Away from the rails" is a fact about where the cube IS, not a timer.
    // It is what makes the floor's one-pip recovery an entry rather than a
    // rate limit, so it is recomputed every tick.
    // NOTE: `s.railAway` is refreshed at the TOP of the next tick (it is a
    // fact about where the cube IS, and it has to be current when the rail
    // contact block reads it). This line used to sit HERE, after the contact
    // block had already consumed it, so the rescue always saw the value from
    // while the cube was still ON the rail -- and never paid. MOVED to the
    // start of the tick; see `s.railAway` there.
    s.chainTime = Math.max(0, s.chainTime - dt);
    if (!s.chainTime) s.chain = 0;
    hyperStep();
    const p = world.player.position;
    s.peak = Math.max(s.peak, origin.y - p.y);
    s.oldLine = s.line;
    s.line = Math.min(s.line - dt * (0.38 + Math.min(6, s.band) * 0.07), origin.y - s.peak + 1180);
    // The cut-room safety net is gone with the Redline.
    //
    // It existed for exactly one job: catching you before the lethal stripe.
    // With the stripe no longer lethal there is nothing to be caught from, and
    // keeping the branch would mean the game silently rewinds your momentum and
    // freezes you for a hazard that no longer exists. `s.net` is still SET
    // (run setup and the field guide both read it) -- it simply no longer
    // triggers a rescue.
    // THE REDLINE NO LONGER KILLS.
    //
    // The bottom wall is the floor now, and it is a dead cushion (see
    // physics.railBounce) rather than a loss. Falling is a real, costly setback
    // you recover from, not the end of a run -- which means the only way to
    // lose is enemy damage, and the game stops punishing you for gravity.
    //
    // `s.line` is deliberately KEPT as the enemy spawn frontier. levels.js uses
    // it to decide which cells may spawn, so deleting it outright would let the
    // field grow without bound. It is now a boundary for the FIELD, not for the
    // player: the field stops descending below it and nothing dies there.
    stream.sync({ x: p.x - origin.x, y: p.y - origin.y }, s.line - origin.y);
    // ── THE WATCHDOG ───────────────────────────────────────────────────────
    //
    // Counts ticks with nothing alive within a viewport of the cube. Counting
    // NEARBY rather than just `enemies.size` matters: a shape stranded two
    // screens away is not a field, it is a number in a map.
    {
      let near = 0;
      for (const e of combat.enemies.values()) {
        if (Math.hypot(e.x - p.x, e.y - p.y) < WATCHDOG_REACH) { near++; break; }
      }
      if (near > 0) s.emptyTicks = 0;
      else if (++s.emptyTicks >= EMPTY_WATCHDOG_TICKS) {
        s.emptyTicks = 0;
        s.watchdog++;
        // ── RESYNC IS NOT ENOUGH ────────────────────────────────────────────
        //
        // `stream.sync` rebuilds the cells around the cube, but every slot in a
        // cell the player has already been through is still masked out by
        // `cleared` -- so on a return visit the resync re-enters cells that
        // have nothing left to give and the field stays empty. Reported as 65
        // seconds of empty sky in Sector 07: the player fell to the floor while
        // the field was high, the watchdog fired over and over, and each fire
        // rebuilt a region that had already been cleared.
        //
        // So the watchdog now GUARANTEES shapes, the way the design asks: if
        // there is nothing within reach, put two enemies in the upper half of
        // the view the player is actually looking at. This is not a random
        // event and it does not respect the seed's cell layout -- it is a floor
        // under "a run-based game may not present an empty screen", and it is
        // deliberately the strongest thing in this file.
        //
        // First resync, because a fresh cell may legitimately have plenty to
        // offer and inventing shapes on top of that would double the field.
        stream.sync({ x: p.x - origin.x, y: p.y - origin.y }, s.line - origin.y);
        let live2 = 0;
        for (const e of combat.enemies.values()) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < WATCHDOG_REACH) { live2++; break; }
        }
        if (live2 === 0) spawnInView(p, origin);
      }
    }
    const band = bandAt(-s.peak);
    if (band > s.band) {
      s.band = band;
      s.edge = 3;
      s.focus = 1;
      emit('sector', { band, name: district(seed, band) });
      if (band % 3 === 0) {
        for (const e of combat.enemies.values()) if (e.kind === 'crown') combat.remove(e);
        combat.add({
          kind: 'crown',
          ...combat.crownPost(p,band%2?1:-1),
          id: `crown-${band}`,
          home: 'hunter',
          slot: -1,
          phase: 0,
          delay: 65,
        });
      }
    }
  }
  /** Put shapes where the player is LOOKING.
   *
   *  The last resort of the empty-field watchdog. Two enemies, in the upper
   *  half of the CURRENT view, spaced across it so they are not one blob. Kinds
   *  are the two cheapest ordinary ones on purpose: a rescue must never hand
   *  the player a Crown as a gift, and it must not need the cell layout to
   *  decide anything.
   *
   *  `WATCHDOG_REACH` is a little over a viewport, so shapes placed here are
   *  inside the frame the player can see, not merely inside the arena.
   */
  function spawnInView(p, origin) {
    if (!['ready', 'playing'].includes(s.phase) || s.opening) return 0;
    const halfW = origin?.halfW || origin?.w || WATCHDOG_REACH,
      halfH = origin?.halfH || origin?.h || WATCHDOG_REACH,
      // Upper half of the view: in world terms, ABOVE the cube.
      topY = p.y - Math.min(halfH * 0.75, WATCHDOG_REACH * 0.6),
      spread = Math.min(halfW * 0.55, WATCHDOG_REACH * 0.5);
    let n = 0;
    for (let i = 0; i < 2; i++) {
      const kind = i === 0 ? 'fang' : 'prism',
        x = p.x + (i === 0 ? -spread : spread),
        y = topY + i * 90,
        id = `rescue-${s.watchdog}-${i}`;
      const e = combat.add({ kind, x, y, id, home: 'rescue', slot: -1, delay: 24 });
      if (e) n++;
    }
    if (n) emit('rescue', { n });
    return n;
  }
  function retire() {
    if (!['ready', 'playing'].includes(s.phase)) return;
    s.phase = 'over';
    s.cause = 'Retired';
    focus(false);
    emit('over', {});
  }
  return {
    world,
    combat,
    stream,
    state: s,
    /**
     * Publish the viewport height, which the floor's trampoline needs.
     *
     * `trampolineVy` is defined as "one third of a screen", and it reads
     * `world.viewH`. Nothing ever wrote that property -- the comment in
     * physics.js claimed the camera did, but the camera has no reference to the
     * world -- so the `|| 720` fallback was silently the real rule on every
     * device. A phone in portrait got a 720px kick on an 800px screen; a tall
     * desktop window got one third of 720 instead of one third of 1080.
     *
     * The renderer calls this on every resize, which is the only place that
     * knows the real height. It is also safe to call before the first frame.
     */
    setViewport(w, h) {
      if (Number.isFinite(h) && h > 0) world.viewH = h;
      if (Number.isFinite(w) && w > 0) world.viewW = w;
      return world.viewH;
    },
    tick,
    dash,
    hurt,
    focus,
    adjust,
    aimAt,
    nearest,
    suggestion,
    /** 0..1 how fast this run has become; read by input and the HUD. */
    get tempo() {
      return tempoOf(s);
    },
    /** The live steering range for this run, one source for corridor + snap. */
    assist: (o = {}) =>
      assistRange(s, {
        ...o,
        // In flight the player has already committed: widen the help without
        // making the caller remember to ask. On the ground it stays tighter.
        airborne: o.airborne ?? !world.grounded,
      }),
    skipOpening: () => enterField(false),
    retire,
    dispose() {
      combat.dispose();
      destroyPhysics(world);
    },
  };
}
