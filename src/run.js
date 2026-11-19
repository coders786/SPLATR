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
} from './physics.js';
import { panicWindow, panicScale } from './aim.js';
import { SPAWN, PAD, ARENA, createStream, bandAt, district, clamp } from './levels.js';
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
    // Rail-bank shockwave. Separate from `impact` because it is a different
    // event with a different feeling: `impact` says "you touched something",
    // `boom` says "you bounced off a wall at speed". The renderer draws it big
    // and directional; see the sonic-boom block in renderer.js.
    boom:null,
    boomAge:0,
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
    glideAt = Infinity;
    const hpBefore = e.hp;
    e.hp -= s.drive > 0 ? 3 : fromShear ? SHEAR.damage : 1;
    e.flash = 16;
    s.swingStart = world.clock;
    if (s.opening) lesson.hit(e.hp > 0);
    if (e.hp > 0) {
      if (!s.opening) grantBreath(breathFor(s, 'cut'));
      s.stop = Math.max(e.pinned ? 5 : 2, s.stop);
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
      { points, release } = printKill(stroke, e, base, fromShear, s.slashAngle, hpBefore);
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
      throughcut: stroke.released,
      strokePoints: stroke.points,
      strokeKills: stroke.kills,
      points,
      chain: s.chain,
    });
    if (release) {
      s.throughcuts++;
      const dx = Math.cos(s.slashAngle),
        dy = Math.sin(s.slashAngle),
        end = { x: e.x + dx * SHEAR.reach, y: e.y + dy * SHEAR.reach };
      stroke.shear = { x: e.x, y: e.y, end, angle: s.slashAngle };
      emit('shear', stroke.shear);
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
  function recharge(dt) {
    if (s.edge < MAX_EDGE) {
      s.recharge += dt;
      if (s.recharge >= 76) {
        s.edge++;
        s.recharge = 0;
      }
    } else s.recharge = 0;
  }
  function enterField(cleared) {
    if (!s.opening || (!cleared && s.opening.finishing) || !['ready', 'playing'].includes(s.phase))
      return false;
    for (const e of combat.enemies.values()) combat.remove(e);
    s.opening = null;
    s.net = cleared;
    s.story=cleared;
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
    // Let the player actually see the first live opponent before the tide
    // starts. Keep the score, including the Overdrive they may just have earned.
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
    if (s.stop > 0) {
      s.stop--;
      freezePoses();
      // A frozen frame still holds its contact pose: the squash is drawn on
      // the last resolved contact, not on a new one.
      return;
    }
    if (s.impact && ++s.impactAge > IMPACT.springTicks) {
      s.impact = null;
      s.impactAge = 0;
    }
    if (s.boom && ++s.boomAge > 30) {
      s.boom = null;
      s.boomAge = 0;
    }
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
    stepPhysics(world, (dt) => combat.move(dt, s.band),pace);
    // One contact per tick, straight from Matter's resolved normal. A wall,
    // a deck, a plate that stops the blade: the pose bends the same way.
    const hitSurface = world.contact;
    if (hitSurface && hitSurface !== lastContact && s.phase === 'playing') {
      lastContact = hitSurface;
      noteImpact(hitSurface.x, hitSurface.y, hitSurface.nx, hitSurface.ny, hitSurface.depth);
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
      s.bankCool = 8; // long enough to debounce, short enough to chain
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
      // A hyper bounce can GAIN speed (BOOST > 1 up to the cap); a normal bounce
      // is a modest kick. Both go through the same guarded boost.
      if (speed > 4 && speed < CEIL) boostPlayer(world, BOOST, CEIL);
      s.edge = Math.min(MAX_EDGE, s.edge + 1);
      s.banks = (s.banks || 0) + 1;
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
    if (s.bankCool > 0) s.bankCool--;
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
      if (s.blade > 0) cut(e);
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
