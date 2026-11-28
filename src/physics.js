import { MOVEMENT } from './movement-model.js';
import {sideRebound} from './rebound-response.js';
import Matter from 'matter-js';
import { PLAYER_SIZE } from './levels.js';

const { Engine, Composite, Bodies, Body } = Matter;
export const STEP_MS = MOVEMENT.stepMs;
// Matter velocity units: px / nominal 60 Hz step.
//
// 35 -> 42 is the "more speed" pass. Two measurements made this safe rather
// than a guess:
//  - The renderer holds 1.39 ms/frame at DPR 2 with 29 live enemies (~720 fps
//    of CPU headroom in this sandbox), so the extra speed is nowhere near the
//    frame budget.
//  - MAX_TRAVEL forces Matter to substep whenever the fastest corner moves
//    more than 5 px, so raising the cap samples thin walls MORE often instead
//    of letting the cube tunnel through them.
// Everything downstream reads this one constant (aim, impact stretch, the
// speedometer normalisation), so the whole game scales with it.
export const MAX_SPEED = MOVEMENT.maxSpeed;
/** Alias kept for spec traceability: the speed a full-power dash produces. */
export const BASE_DASH_SPEED = MAX_SPEED;
/** Absolute velocity ceiling for ANY body in the world. Hyper (280) and a banked
 * rally fit inside it; the 1.30x pinball rails of a shattered arena (CHUNK 3)
 * may never exceed it. Only `launch()` and the rail solver may write it. */
export const MAX_PINBALL_SPEED = 320;
/** The SHATTERED arena's rail restitution: an arrival leaves at 1.30x its
 * speed (never past MAX_PINBALL_SPEED). Nothing else in the game may
 * exceed 1.0 on a reflect. */
export const PINBALL_RESTITUTION = 1.3;
/** Arrival speed (px/tick) above which the SHATTERED floor is a 1.30x
 * bumper instead of the trampoline kick — below it the anti-softlock
 * kick and its one-pip rescue stay live. Same scale as ARRIVE. */
export const SHATTER_FLOOR_MIN = 8;
export const MAX_PULL = MOVEMENT.maxPull; // world pixels, NOT CSS or backing-store pixels
export const BASE_GRAVITY = MOVEMENT.gravityScale;
const GRAVITY_Y = MOVEMENT.gravityY;
const MAX_SPIN = 0.18;
const MAX_TRAVEL = MOVEMENT.maxTravel; // maximum corner travel per collision sample
// Held aim deliberately slows simulation by 90%; release immediately restores
// the committed launch. Automatic breath/panic still follow tempo preferences.
export const SLOW_MIN = MOVEMENT.focusScale;
/** Deliberate aim floor. At over-speed (a banked rally or hyper) the world
 * holds at MOVEMENT.focusFastFloor instead — a held aim may steer an
 * over-speed cube without the world collapsing into a crawl, which read as
 * "aim-hold deletes hyper speed". Ordinary flight keeps SLOW_MIN. */
export function slowFloor(speed = 0) {
  const v = Number(speed);
  return Number.isFinite(v) && v > MOVEMENT.focusFastAt ? MOVEMENT.focusFastFloor : SLOW_MIN;
}
function playerSpeed(world) {
  return Math.hypot(world.player.velocity.x, world.player.velocity.y);
}
const DEAD_ZONE = MOVEMENT.deadZone;

export function createPhysics(level) {
  const engine = Engine.create({
    gravity: { x: 0, y: GRAVITY_Y, scale: BASE_GRAVITY },
    positionIterations: 7,
    velocityIterations: 5,
    enableSleeping: false,
  });
  // THE ARENA WALLS.
  //
  // The field used to have no walls at all: the cube flew in one direction and
  // the run was over. That is a steering game. With four walls it becomes a
  // BILLIARDS game -- you bank off a rail, chain the cut through a pack of
  // shapes, and carry the speed into the next shot. The walls are what make a
  // chain possible at all, because they are the only thing that can redirect a
  // committed parabola without spending an edge.
  //
  // They are placed against the visible view, not the world grid, and they live
  // in world space at fixed coordinates so a run cannot outrun them. Bounce is
  // high but not 1.0: a perfectly elastic wall feels weightless, and the cube
  // should lose a little speed off each rail so a long rally is earned.
  //
  // `arena` is a ring of four boundaries. None of them damage the player: the
  // top and sides are banks that return speed, and the floor is a dead cushion
  // that banks like the others. Nothing here can end a
  // run -- falling is a setback, and only enemy contact takes hull.
  // RAILS ARE CHECKED, NOT SIMULATED.
  //
  // The first cut built four Matter rectangles and dropped them into the same
  // composite as the player. That works for a 2300px table and collapses for a
  // big one: Matter's broadphase does not like 100,000-unit static bodies, and a
  // tall arena perturbed collision for every other body in the world -- 13 tests
  // that had nothing to do with rails started failing.
  //
  // A rail is a rectangle boundary. It does not need mass, it does not need a
  // contact solver, and the cube is the only thing that ever touches it. So the
  // rail is an analytic clamp applied to the player after the physics step:
  // reflect the velocity on the axis that was crossed, set restitution, and
  // report a contact exactly like a Matter contact so the rest of the game
  // (bank reward, impact rings, surface tags) is unchanged.
  const arena = level.arena || null;
  // A small injected set of rectangles is useful for testing the same
  // continuous-collision guard.
  const geometry = level.pad ? [level.pad] : level.solids || [];
  const solids = geometry.map((r) =>
    Bodies.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, {
      isStatic: true,
      friction: 0.48,
      // ── MATTER MUST NOT BOUNCE THE RAILS ─────────────────────────────────
      //
      // `railBounce` owns all four boundaries analytically: it is what
      // implements the trampoline kick, the 0.25s wall ignore and the pinball
      // inward bounce, none of which Matter knows about. These bodies exist so
      // the cube can be STOPPED by a rail, not so they can reflect it.
      //
      // Leaving a restitution here meant the floor bounced the cube twice --
      // once analytically and once through the solver. Measured while chasing
      // it: a kick that wrote -13.5 px/tick came out of the next tick reading
      // -35.5, a 1,700px climb from a rule that promises one third of a screen.
      // The analytic layer has to be the only one writing velocity at a rail.
      restitution: 0,
    }),
  );
  const player = Bodies.rectangle(level.spawn.x, level.spawn.y, PLAYER_SIZE, PLAYER_SIZE, {
    label: 'blade',
    restitution: 0.25,
    friction: 0.42,
    frictionStatic: 0.7,
    frictionAir: 0,
    density: 0.002,
    slop: 0.02,
  });
  player.plugin.previous = { x: player.position.x, y: player.position.y, angle: player.angle };
  Composite.add(engine.world, [...solids, player]);
  return {
    engine,
    arena,
    // The speed the cube is allowed to reach. Normally MAX_SPEED, but a rail
    // bank raises it so that CHAINING is a way past the limit. Without this the
    // boost was inert: capVelocity clamped the cube back to MAX_SPEED on the
    // very next substep, so a 5-bank rally was worth nothing.
    playerCeiling: MAX_SPEED,
    ceilingDecay: 0,
    player,
    geometry,
    level,
    grounded: true,
    launched: false,
    slow: false,
    // Training lessons may supply a fixed, state-derived dilation while an
    // enemy telegraphs. Ordinary focus leaves this null and keeps the normal
    // speed-aware floors above untouched.
    slowScale: null,
    focusScale: 1,
    previousClock: 0,
    clock: 0,
    substeps: 1,
    // The last real surface contact, for the impact pose and its ring. Set by
    // stepPhysics from an actual collision normal, never guessed from speed.
    contact: null,
  };
}

// Paper racks catch the cube between swings. Moving it during a return uses
// Matter's own transform so the rendered pose and the next collision agree.
export function stopPlayer(world) {
  Body.setVelocity(world.player, { x: 0, y: 0 });
  Body.setAngularVelocity(world.player, 0);
}
export function placePlayer(world, p) {
  Body.setPosition(world.player, p);
}

/** Pool cue: drag to the LEFT to travel RIGHT. Clamp the vector's length
 *  rather than each component, so a diagonal shot has no speed advantage.
 *
 *  The response is deliberately ELASTIC at the short end and identical at the
 *  long end:
 *
 *    - A tiny drag is nearly free. A thumb that moves 8 px while settling onto
 *      the glass used to launch at 8/176 of full speed in an almost random
 *      direction, which is the worst possible feel for a beginner.
 *    - The middle of the pull is expanded, so the useful band of powers is
 *      physically larger and a rookie can actually find 60% instead of
 *      jumping from 20% to 90%.
 *    - `power` is still exactly 1 at MAX_PULL, so a full commit is unchanged.
 *
 *  Direction is untouched: only the length of the vector is reshaped.
 */
const easePower = (t) => t * t * (2.4 - 1.4 * t);
export function dragVector(origin, pointer) {
  const dx = origin.x - pointer.x,
    dy = origin.y - pointer.y;
  const length = Math.hypot(dx, dy);
  if (length < DEAD_ZONE) return { x: 0, y: 0, power: 0 };
  const raw = Math.min(length / MAX_PULL, 1),
    power = easePower(raw);
  const k = (power * MAX_SPEED) / length;
  return { x: dx * k, y: dy * k, power };
}

function capVelocity(body, ceiling = MAX_SPEED) {
  if (body.speed > ceiling) Body.setSpeed(body, ceiling);
  if (body.angularSpeed > MAX_SPIN) Body.setAngularSpeed(body, MAX_SPIN);
}

/** Target the timing controls; the fixed clock, rather than pointer event
 * frequency, drives the blend. A launch explicitly returns to real time so
 * its first frame agrees with the trajectory the player just committed to. */
export function setBulletTime(world, on, immediate = false) {
  world.slow = Boolean(on);
  if (immediate) {
    const floor = Number.isFinite(world.slowScale)
      ? Math.max(SLOW_MIN, Math.min(1, world.slowScale))
      : slowFloor(playerSpeed(world));
    world.engine.timing.timeScale = world.focusScale = on ? floor : 1;
    world.engine.gravity.scale = BASE_GRAVITY * (on ? floor : 1);
  }
}

function advanceTiming(world, pace) {
  const floor = Number.isFinite(world.slowScale)
    ? Math.max(SLOW_MIN, Math.min(1, world.slowScale))
    : slowFloor(playerSpeed(world));
  const target=world.slow?floor:1;
  // Snappier in, snappier out: the slower the transition, the more the world
  // reads as "lurching" rather than as speed changing.
  world.focusScale+=(target-world.focusScale)*(world.slow?.46:.62);
  if(Math.abs(target-world.focusScale)<.002)world.focusScale=target;
  // A cut, the field-edge warning or an automatic hazard grace buys reading
  // time without changing the committed parabola. Only *held* focus
  // lightens gravity and spends focus; the two never multiply.
  world.engine.timing.timeScale=Math.min(world.focusScale,pace);
  // Gravity keeps exactly the fraction of itself the clock does: 10% at an
  // ordinary held aim, 55% at an over-speed one. (The previous curve eased
  // to 10% no matter how fast the cube was travelling — algebraically this
  // is identical for every ordinary-flight hold, since the ordinary floor
  // IS SLOW_MIN.)
  world.engine.gravity.scale=BASE_GRAVITY*world.focusScale;
}


/** Multiply the player's current velocity. Used by the rail-bank rule.
 *
 *  Deliberately separate from `launch`: a launch is a NEW commitment and
 *  re-aims the cube, while a boost keeps whatever direction a bounce just gave
 *  it. Calling launch here would silently re-aim a shot that a rail had already
 *  decided, which is the opposite of billiards.
 *
 *  The cap is applied to the RESULT, not the factor, so repeated banks cannot
 *  compound past it. `capVelocity` is not used because it clamps to MAX_SPEED,
 *  and a banked rally is explicitly allowed to exceed the launch limit.
 */
/**
 * Scale the player's velocity by `factor` -- which may be BELOW 1.
 *
 * `boostPlayer` clamps its factor with `Math.max(1, ceiling / speed)` because it
 * exists to spend speed, never to lose it. A bounce that must LOSE energy needs
 * this instead: multiplying by 0.82 through `boostPlayer` is a no-op, and near
 * the ceiling it is a ratchet. Measured with the no-op: a cube that only fell
 * accelerated to -199 px/tick in 100 ticks and left the arena.
 */
export function dampPlayer(world, factor) {
  const v = world.player.velocity,
    speed = Math.hypot(v.x, v.y);
  if (!Number.isFinite(speed) || speed < 0.001) return speed;
  Body.setVelocity(world.player, { x: v.x * factor, y: v.y * factor });
  return speed * factor;
}

/** Set the player's velocity outright (px/tick). */
export function setPlayerVelocity(world, x, y) {
  Body.setVelocity(world.player, { x, y });
}

export function boostPlayer(world, factor, ceiling) {
  const v = world.player.velocity,
    speed = Math.hypot(v.x, v.y);
  if (!Number.isFinite(speed) || speed < 0.001) return 0;
  const k = Math.min(factor, Math.max(1, ceiling / speed));
  const nx = v.x * k,
    ny = v.y * k;
  Body.setVelocity(world.player, { x: nx, y: ny });
  return Math.hypot(nx, ny) - speed;
}

/** Set the player's speed to `speed` along the CURRENT heading, or leave it
 *  alone if it is already faster.
 *
 *  This is the counterpart to `launch()` for states where the speed limit is
 *  lifted. `launch()` no longer clamps its input to MAX_SPEED (CHUNK 2); it
 *  preserves the speed it is handed along the aimed heading. `holdSpeed`
 *  remains for callers that need to re-assert a floor along the CURRENT
 *  heading without re-aiming. Returns the speed actually set.
 */
export function holdSpeed(world, speed = 0) {
  const v = world.player.velocity,
    len = Math.hypot(v.x, v.y);
  if (!Number.isFinite(len) || len < 0.001) return 0;
  // `speed` 0 means PRESERVE: keep whatever survived the launch clamp. A
  // positive speed is a floor, never a ceiling, so this cannot slow the cube.
  const keep = Math.max(len, speed);
  Body.setVelocity(world.player, { x: (v.x / len) * keep, y: (v.y / len) * keep });
  return keep;
}

/** Launch along the aim, preserving the speed the cube already owns.
 *
 *  `storedSpeed` is the magnitude BEFORE this launch was committed to (the
 *  caller measures it); `retention` is the steered fraction of it (1.0 =
 *  gentle/medium, 1.05 = clean bank-steer, >= 0.85 on a full reversal).
 *  BASE_DASH_SPEED — what THIS input would produce under the ordinary rules —
 *  is the floor, so a deliberate weak pull is never promoted to full speed,
 *  and a hyper-speed steer is never demoted to it either.
 */
export function launch(world, velocity, { storedSpeed = 0, retention = 1, maxCeiling = MAX_PINBALL_SPEED } = {}) {
  const length = Math.hypot(velocity.x, velocity.y);
  if (!Number.isFinite(length) || length < 0.001) return false;
  const pv = world.player.velocity;
  const currentSpeed = Math.max(storedSpeed, Math.hypot(pv.x, pv.y));
  const baseDashSpeed = Math.min(length, MAX_SPEED);
  const launchSpeed = Math.min(Math.max(baseDashSpeed, currentSpeed * retention), Math.max(maxCeiling, baseDashSpeed));
  setBulletTime(world, false, true);
  Body.setVelocity(world.player, { x: 0, y: 0 });
  Body.setVelocity(world.player, { x: (velocity.x / length) * launchSpeed, y: (velocity.y / length) * launchSpeed });
  // ── THE CUBE DOES NOT SPIN. EVER. ────────────────────────────────────────
  //
  // This line added angular velocity proportional to the launch, up to 0.105
  // rad/tick. It was the "diagonal corner-twisting" in the bug report and it is
  // a direct violation of the golden rule: the cube's outer edges must stay
  // parallel to the screen axes, so its corners are always 90 degrees.
  //
  // Measured before the fix: one dash left the cube at 1.99 rad -- 114 degrees
  // of rotation -- and it kept turning, which is why the shape read as a
  // crooked diamond with spikes coming out of it rather than a square. Nothing
  // downstream was at fault; every diagonal frame in the video traces back to
  // this one line.
  //
  // Zeroed rather than deleted so a body that somehow arrives spinning is also
  // straightened by a launch.
  Body.setAngularVelocity(world.player, 0);
  Body.setAngle(world.player, 0);
  world.grounded = false;
  world.launched = true;
  return true;
}

/** Segment vs. an AABB (slab test). Returns the FIRST time of entry in [0,1]
 * and its outward normal. Initial overlaps are left to Matter's contact solver.
 * An optional inset expands the obstacle by the moving shape's support size. */
export function sweptHit(x, y, dx, dy, r, inset = 0) {
  const l = r.x - inset,
    t = r.y - inset,
    rr = r.x + r.w + inset,
    b = r.y + r.h + inset;
  if (
    (x < l && x + dx < l) ||
    (x > rr && x + dx > rr) ||
    (y < t && y + dy < t) ||
    (y > b && y + dy > b)
  )
    return null;
  if (x > l && x < rr && y > t && y < b) return null;
  const tx1 = dx ? (l - x) / dx : -Infinity,
    tx2 = dx ? (rr - x) / dx : Infinity;
  const ty1 = dy ? (t - y) / dy : -Infinity,
    ty2 = dy ? (b - y) / dy : Infinity;
  const ex = Math.min(tx1, tx2),
    ey = Math.min(ty1, ty2);
  const entry = Math.max(ex, ey),
    exit = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
  if (entry > exit || entry < 0 || entry > 1) return null;
  return { t: entry, nx: ex > ey ? -Math.sign(dx) : 0, ny: ey >= ex ? -Math.sign(dy) : 0 };
}

// Matter.js uses discrete SAT, not a magic "CCD enabled" flag. In addition to
// bounded steps below, sweep an inscribed square through static geometry. It
// fits the blade at EVERY angle; a crossing here is never just a proximity hit.
function catchCrossing(world, startX, startY, incoming = 0) {
  const p = world.player,
    dx = p.position.x - startX,
    dy = p.position.y - startY;
  const inset = PLAYER_SIZE / (2 * Math.SQRT2);
  let first = null;
  for (const r of world.geometry) {
    const hit = sweptHit(startX, startY, dx, dy, r, inset);
    if (hit && (!first || hit.t < first.t)) first = hit;
  }
  if (!first) return;
  // Recover to the contact plane with the real square's projected half-extent.
  const extent = (PLAYER_SIZE / 2) * (Math.abs(Math.cos(p.angle)) + Math.abs(Math.sin(p.angle)));
  const clearance = extent - inset + 0.02;
  Body.setPosition(p, {
    x: startX + dx * first.t + first.nx * clearance,
    y: startY + dy * first.t + first.ny * clearance,
  });
  const vn = p.velocity.x * first.nx + p.velocity.y * first.ny;
  if (vn < 0) {
    // The impulse into the surface is exactly what the pose should squash by.
    noteContact(world, startX + dx * first.t, startY + dy * first.t, first.nx, first.ny, Math.max(-vn, incoming));
    Body.setVelocity(p, {
      x: p.velocity.x - (1 + p.restitution) * vn * first.nx,
      y: p.velocity.y - (1 + p.restitution) * vn * first.ny,
    });
  }
}

/** One contact per step, the hardest of the substeps. `depth` is the closing
 *  speed along the surface normal, so a glancing slide is not a slam. A body
 *  that keeps resolving against the same surface is RESTING, not hitting, so
 *  repeats are dropped for `contactHold` ticks: otherwise the pose would buzz
 *  every frame a cube sits on the pad. */
function noteContact(world, x, y, nx, ny, depth, surface = null) {
  // A cube resting on the pad resolves a tiny impulse at the same point every
  // tick. That is not a hit. A contact counts when it is a real closing speed
  // AND either somewhere new or the first one after a clean frame. Depth is
  // the closing rate, so a body merely leaning on a surface reads ~0.
  // The closing speed below which a contact is a REST, not an arrival. A real
  // landing measures 20+; a body leaning on a pad measures 1.4-1.9.
  if (!Number.isFinite(depth) || depth <= 3.2) return;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const prev = world.contact;
  if (prev) {
    // Same surface, same neighbourhood, and no real closing speed: the cube is
    // sitting there resolving a lean, not arriving.
    const samePlace = Math.hypot(x - prev.x, y - prev.y) < 26,
      sameFace = prev.nx * nx + prev.ny * ny > 0.75;
    if (samePlace && sameFace && depth < 9) return;
    if (world.clock < prev.until && samePlace && sameFace) return;
  }
  world.contact = { x, y, nx, ny, depth, surface, speed: world.player.speed, clock: world.clock, until: world.clock + 0.22 };
  // The event for THIS tick. `world.contact` keeps the debounce memory.
  world.struck = world.contact;
}

function snapshot(body, ceiling = MAX_SPEED) {
  const prev = body.plugin.previous;
  prev.x = body.position.x;
  prev.y = body.position.y;
  prev.angle = body.angle;
  // The ceiling has to be threaded through here too.
  //
  // This call used to cap at MAX_SPEED unconditionally, on EVERY tick, before
  // the substep count was even computed. That meant world.playerCeiling was
  // being honoured inside the substep loop and then silently undone here at the
  // top of the next tick -- which is why every "reach the wall" speed boost
  // measured exactly 2345px of climb no matter what was launched, and why the
  // measured peak speed never once exceeded 42.1 against a stated ceiling of 88.
  capVelocity(body, ceiling);
  return body.speed + body.angularSpeed * Math.SQRT1_2 * PLAYER_SIZE;
}

/** Advance exactly ONE real-time 1/60s tick. Render/monitor refresh rate is
 * deliberately not a parameter. At maximum speed a thin wall is sampled many
 * times; resting worlds cost one Matter update. Budget angular tip travel too. */
/** Reflect the cube off the arena rails.
 *
 *  Analytic, not simulated: the rail is a boundary, the cube is the only thing
 *  that touches it, and both facts are already true. Reflecting a velocity is
 *  exact, cheap, and cannot perturb anything else in the world -- which is the
 *  whole reason this is not four Matter rectangles.
 *
 *  Returns nothing; a contact is published on `world.contact` in the SAME shape
 *  Matter produces, so the bank reward, impact rings and surface tags all keep
 *  working without knowing rails are handled differently.
 */
/* ── HOW HARD THE FLOOR KICKS ───────────────────────────────────────────────
 *
 * The brief fixes the HEIGHT (one third of a screen), not the speed, so the
 * speed is derived from the height. A launch at v peaks v^2/(2g) above the
 * launch point, so the kick that peaks exactly h up is sqrt(2 g h).
 *
 * G is MEASURED, not assumed. Solving v^2/(2*rise) against the real integrator
 * gives 0.3773, 0.3776 and 0.3799 for launches of 16, 24 and 34 px/tick -- the
 * spread is the frame quantisation, and 0.378 is the value all three agree on.
 * Writing the constant down rather than re-deriving it from GRAVITY_Y keeps the
 * kick honest even though the engine's gravity scale and Matter's internal
 * scaling both sit between that number and the pixels the player sees.
 *
 * `world.viewH` is published by the camera on every resize; 720 is the stand-in
 * where it is absent. The clamps keep the result sane for any viewport: a tiny
 * screen must not kick so weakly the cube cannot clear anything, and a huge one
 * must not fire it into the ceiling.
 */
export const GRAVITY_PX = 0.378;
// ── THE PINBALL WALLS ────────────────────────────────────────────────────────
//
// Inward speed kept on a sideways bounce, the lift added, and how long that wall
// ignores the cube afterwards. The 0.85 is deliberately below 1: a wall that
// returns everything is a perpetual-motion rally, and the missing 15% is what
// makes a wall bounce a repositioning move rather than free energy.
export const WALL_KEEP = MOVEMENT.wallKeep,
  WALL_HOP = MOVEMENT.wallHop,
  /** Seconds, in the clock units `railBounce` compares against. */
  WALL_IGNORE = MOVEMENT.wallIgnore;

export function trampolineVy() { return MOVEMENT.floorKick; }

/** How high a launch at `vy` actually peaks -- the inverse, for assertions. */
export function trampolineRise(vy) {
  return (vy * vy) / (2 * GRAVITY_PX);
}

/** CHUNK 3: after any reflect in a SHATTERED arena, the cube may never
 * exceed MAX_PINBALL_SPEED — restitution 1.3 compounds, the ceiling does not.
 * The reflect has to survive the per-substep velocity cap, so the running
 * ceiling is lifted to the reflected speed, exactly the way every bank
 * reward in this codebase pays its speed out. The ordinary bleed in the run
 * brings it back down. */
function capPinball(v, world) {
  const sp = Math.hypot(v.x, v.y);
  const after = Math.min(sp, MAX_PINBALL_SPEED);
  if (sp > MAX_PINBALL_SPEED) {
    const k = MAX_PINBALL_SPEED / sp;
    v.x *= k; v.y *= k;
  }
  if (world) world.playerCeiling = Math.max(world.playerCeiling || MAX_SPEED, after);
  return after;
}

function railBounce(world) {
  const a = world.arena, SHATTERED = world.arenaMode === 'SHATTERED';
  if (!a) return;
  const incomingX=world.player.velocity.x,incomingY=world.player.velocity.y;
  const p = world.player.position,
    v = world.player.velocity,
    RESTITUTION = 0.9,
    SHATTER_RESTITUTION = SHATTERED ? Math.max(PINBALL_RESTITUTION, Math.min(1.5, Number(world.railRestitution) || PINBALL_RESTITUTION)) : PINBALL_RESTITUTION,
    half = PLAYER_SIZE / 2,
    // ── ARRIVING AT A RAIL IS AN EVENT, RESTING ON ONE IS NOT ──────────────
    //
    // Gravity adds ~0.375 px/tick of downward speed to a resting cube on every
    // physics substep. The old test was `if (v.y > 0)`, so that crumb of
    // gravity counted as "moving INTO the floor": the position was clamped, the
    // velocity reflected, and `world.contact` republished with a brand-new
    // object -- every substep, forever.
    //
    // Measured: a cube parked on the floor reported `surface === 'rail'` on
    // 289 of 300 ticks. Every consumer of that channel (impact rings, the wall
    // splat, the bank reward's identity guard) was being handed a fresh contact
    // ~19 times a second for a cube that was not moving.
    //
    // So a closing speed below ARRIVE is treated as REST: the velocity is
    // zeroed rather than reflected, and no contact is published. A real
    // arrival -- anything above the threshold -- still reflects and still
    // publishes, which is what makes this edge-triggered instead of
    // level-triggered.
    // Raised from 2.4: a cube parked on the floor picks up 4-5 px/tick of
    // gravity between substeps, which cleared the old threshold, reflected at
    // 0.9 and rattled for 300 ticks. These residuals are not arrivals -- a real
    // one measures tens of pixels per tick (a 70 px/tick drop is a landing; a
    // parked cube reporting 5.2 is the integrator breathing). Measured on the
    // old value: four "contact" events over 300 parked ticks.
    ARRIVE = 8;
  // ── HOW HARD THE FLOOR KICKS ───────────────────────────────────────────────
  //
  // The brief fixes the HEIGHT (one third of a screen), not the speed, so the
  // speed has to be derived from the height with the gravity this step
  // integrates. For constant gravity, the apex of a launch at speed v is
  // v^2 / (2g), so the launch speed that peaks exactly h above the floor is
  // sqrt(2 g h). Deriving it means the kick stays a third of a screen if the
  // viewport or gravity is ever retuned, instead of silently becoming a
  // fifth of one.
  //
  const x0 = a.x + half,
    x1 = a.x + a.w - half,
    y0 = a.y + half,
    y1 = a.y + a.h - half;
  // ── WHAT THE CUBE IS RESTING ON ────────────────────────────────────────
  //
  // Published every tick, whether or not anything bounces. `run.js` reads this
  // to settle the resting state explicitly instead of letting a micro-cycle
  // survive into the next frame. Reset first so it never goes stale.
  world.railRest = null;
  let side = null,
    nx = 0,
    ny = 0,
    // Where the body must end up, if a rail clamped it. Written once, below.
    clampX = null,
    clampY = null;
  // ── PINBALL WALLS ──────────────────────────────────────────────────────
  //
  // The brief for the side walls is exact: bounce INWARD at 85% of the sideways
  // speed you arrived with, add a TINY upward hop, and ignore that wall for a
  // quarter second so one arrival cannot be counted twice. The cube stays
  // perfectly upright -- the walls never rotate it, which is the same rule as
  // the golden one: no shear, no twist, axis-aligned only.
  //
  // The hop is why a wall is useful rather than a wall of punishment: arriving
  // flat and sideways at rail height came back flat and sideways, so the cube
  // would scrape along the same rail until it lost all speed. A small lift turns
  // that into an arc the player can steer out of.
  //
  // The old reflect was `RESTITUTION` (0.9) with no hop and no ignore window,
  // which is also why a cube grazing a wall could re-collide on the next
  // substep and buzz along the boundary.
  const wallIgnore = world.wallIgnore || (world.wallIgnore = { left: 0, right: 0 });
  // Ignore is a REWARD debounce, not permission to trap an outward launch
  // against the clamp. Even a second real arrival reflects physically; only
  // the first may publish/pay a contact inside this short window.
  const sideArrival=(name,inward)=>{
    const closing=-v.x*inward;
    if(closing<=0)return;
    if(closing<ARRIVE){v.x=0;return;}
    const out=sideRebound(v,inward,{shattered:SHATTERED,restitution:SHATTER_RESTITUTION});
    v.x=out.x;v.y=out.y;world.wallBounced=2;
    if(v.y<0)world.banked=true;
    if(SHATTERED){capPinball(v,world);world.bumped=true;}
    if(wallIgnore[name]>world.clock)return;
    wallIgnore[name]=world.clock+WALL_IGNORE;
    side=name;nx=inward;
  };
  if(p.x<x0){clampX=x0;sideArrival('left',1);}
  else if(p.x>x1){clampX=x1;sideArrival('right',-1);}
  if (p.y < y0) {
    clampY = y0;
    world.railRest = { side: 'ceiling' };
    if (v.y < 0) {
      if (-v.y < ARRIVE) v.y = 0;
      else {
        v.y = -v.y * (SHATTERED ? SHATTER_RESTITUTION : RESTITUTION);
        if (SHATTERED) { capPinball(v, world); world.bumped = true; }
        side = 'top';
        ny = 1;
      }
    }
  } else if (p.y > y1) {
    // ── THE CLAMP IS WHAT TURNED THE KICK INTO A TRAP ────────────────────
    //
    // This used to run unconditionally, BEFORE the kick was decided. On the
    // substep after a launch the cube is above the line moving UP, but its
    // freshly-written velocity had not been integrated yet, so `p.y` was still
    // exactly `y1` from the clamp a moment ago -- and the branch re-clamped it,
    // re-kicked it, and the arc came out at 1,700px from a rule that promises a
    // third of a screen. Measured: -13.5 in, -35.7 out on the very next
    // substep, with the ignore window correctly at 29.
    //
    // So the clamp is now conditional: a cube that is already at the floor and
    // moving down gets placed on it, and a cube that is leaving is left alone.
    // ── DO NOT TELEPORT A CUBE THAT IS ALREADY LEAVING ───────────────────
    //
    // The condition used to be `if (v.y > 0) p.y = y1`, on the theory that a
    // downward-moving cube belongs on the floor. But `v` is Matter's LIVE
    // velocity, and the solver rewrites it every substep -- including setting
    // it positive again AFTER a kick has already fired. So on the very next
    // substep this clamp yanked a cube that was 45px in the air back down onto
    // the line, and the solver answered the teleport with a −134 px/tick
    // velocity. That is the 1,700px "kick".
    //
    // The honest test is positional: the cube is at the floor only if it is at
    // the floor. A cube inside the boundary gets placed on it; a cube already
    // above it is left exactly where it is.
    // (`p` is a live reference to the body's position. Writing it directly and
    // then returning early -- which `if (!side) return` below does -- leaves
    // Matter's `positionPrev` describing the OLD position while the body has
    // already been moved. The next integration diffs the two and invents a
    // velocity out of the jump: measured, a 45px clamp produced −134 px/tick.
    // The clamp is recorded here and written through `Body.setPosition` once,
    // at the bottom, for every branch.
    if (p.y > y1) clampY = y1;
    // Touching the floor at all, at any speed, is what "resting" means here;
    // `run.js` decides whether the VERTICAL SPEED is small enough to settle.
    world.railRest = { side: 'floor' };
    // ── THE FLOOR IS A TRAMPOLINE, AND ITS KICK IS FIXED ────────────────
    //
    // The brief is explicit: touching the bottom must kick the cube straight up
    // by a THIRD OF A SCREEN, every time, no matter how fast it arrived. That
    // is deliberately NOT a restitution: a restitution makes a gentle landing
    // gentle and a fast one violent, which is how you end up pinned to the
    // floor after a slow fall, unable to get back into play.
    //
    // So the reflect is replaced by an absolute speed, computed from the
    // viewport the cube is being played on. The 1/3-screen height is converted
    // into a launch velocity by `TRAMPOLINE_VY` below, using the same gravity
    // the step integrates, so the arc actually lands where the brief says.
    //
    // `world.floorKick` publishes the event. `run.js` pays the pip, flashes
    // the line, plays the one sound and holds the ignore window -- the physics
    // layer knows nothing about any of that.
    // ── THE DEAD BAND MAKES IT A TRAMPOLINE AND NOT A VIBRATOR ─────────
    //
    // `run.js` sets `world.floorIgnore` for half a second after every kick. While
    // it is set the floor behaves as an ordinary cushion: the cube lands, the
    // vertical speed is absorbed, and nothing is published. Without this the
    // kick would fire on the very next substep, because a fixed kick lifts the
    // cube to a fixed height and gravity returns it forever -- measured, a cube
    // dropped once onto the floor bounced on an identical arc until the run was
    // over, and the pit recovery never had a chance to run.
    // ── IT KICKS ONCE, AND ONLY WHEN IT IS AT THE FLOOR ──────────────────
    //
    // `railBounce` runs once per SUBSTEP, and a tick can be split into four.
    // Two separate ways that produced a double kick:
    //
    //   * the ignore window is published by run.js AFTER this tick's physics,
    //     so the second substep still saw 0;
    //   * a fast arrival can be clamped into the floor, kicked, and then
    //     clamped again in the same tick while still "moving down".
    //
    // The fix is not a longer timer, it is asking the question properly: the
    // cube only gets kicked when it is actually AT the floor and moving into
    // it. A cube that has just been kicked is above the line with upward
    // velocity, so it cannot be kicked again, whatever the timer says.
    const atFloor = p.y >= y1 - 0.5;
    if (SHATTERED && v.y >= SHATTER_FLOOR_MIN && atFloor && !(world.floorIgnore > 0)) {
      // The 4th border is a bumper too: an arrival slams back at 1.30x its own
      // speed, capped. A fall too gentle to slam still gets the trampoline
      // kick below — the one-pip rescue is not negotiable, even here.
      v.y = -v.y * SHATTER_RESTITUTION;
      capPinball(v, world);
      world.floorKick = { vy: Math.abs(v.y), speed: Math.hypot(v.x, v.y), rescue: false };
      world.bumped = true;
      Body.setVelocity(world.player, { x: v.x, y: v.y });
      world.kickHold = { y: v.y };
      side = 'bottom';
      ny = -1;
    } else if (v.y > 0 && atFloor && !(world.floorIgnore > 0)) {
      const kick = trampolineVy(world, world.viewH);
      v.y = -kick;
      // AN ABSOLUTE KICK, WRITTEN THROUGH THE BODY.
      //
      // `v` is a live reference to the body's velocity, and Matter's solver
      // will integrate again inside this same tick's remaining substeps. On a
      // fast arrival the solver had already eaten part of the downward speed
      // before this branch ran, so the written value was being reduced to
      // whatever was left: measured, a 60px/tick arrival produced a kick of 11
      // instead of 13.5, and the same rule that promises one third of a screen
      // delivered 155px instead of 240. Writing it through the body makes the
      // kick the last word on the cube's vertical speed this substep.
      Body.setVelocity(world.player, { x: v.x, y: -kick });
      world.floorKick = { vy: kick, speed: Math.hypot(v.x, v.y) };
      // ── THE KICK IS THE LAST WORD OF THE STEP ────────────────────────────
      //
      // A tick splits into up to four substeps and this can fire on any of
      // them. The substeps after it integrate gravity and resolve the floor
      // contact again, and each one takes a bite out of the launch: measured,
      // a 13.5 kick left the tick reading 11.0 -- a trampoline that gets weaker
      // the faster you land. `stepPhysics` re-applies it after the loop so the
      // height is a constant rather than a remainder.
      world.kickHold = { y: -kick };
      side = 'bottom';
      ny = -1;
    } else if (v.y > 0 && p.y > y1 - PLAYER_SIZE) {
      // Ignoring: settle onto the line rather than reflect. This is the half
      // second of quiet that proves the trampoline has a dead band.
      //
      // `p.y > y1 - PLAYER_SIZE` is the depth guard: only a cube actually inside
      // the body of the floor is settled onto it. The test used to be `v.y > 0`
      // alone, which is also true of a cube that is LEAVING.
      v.y = 0;
    }
  }
  // ── THE CLAMP IS WRITTEN WHETHER OR NOT A RAIL PAID ────────────────────
  //
  // This used to `return` when no rail bounced, which skipped the position
  // write below -- but `p` had already been mutated in place, so the body was
  // moved without its `positionPrev` being updated. Matter then integrated the
  // difference on the next substep and produced a velocity out of thin air.
  // The floor's half-second ignore window is exactly a case where the clamp
  // applies and no rail pays, so this path was hit on every trampoline landing.
  if (clampX !== null || clampY !== null) {
    Body.setPosition(world.player, {
      x: clampX ?? p.x,
      y: clampY ?? p.y,
    });
    if (clampX !== null) p.x = clampX;
    if (clampY !== null) p.y = clampY;
    Body.setVelocity(world.player, { x: v.x, y: v.y });
  }
  if (!side) return;
  if (v.y < 0) world.banked = true;
  Body.setPosition(world.player, { x: p.x, y: p.y });
  Body.setVelocity(world.player, { x: v.x, y: v.y });
  // The rail is a bank, not a wall: publish the contact so the run can pay it.
  const normalLength=Math.hypot(nx,ny)||1;
  world.contact = {
    x: p.x,
    y: p.y,
    nx:nx/normalLength,
    ny:ny/normalLength,
    depth: 0,
    surface: 'rail',
    side,
    incomingX,incomingY,
    speed: Math.hypot(v.x, v.y),
  };
  world.struck = world.contact;
}

export function stepPhysics(world, beforeStep, pace=1, onTravel=null) {
  const a = world.arena;
  // ── A CONTACT IS AN EVENT; `world.contact` IS THE MEMORY ────────────────
  //
  // Two different things were sharing one field:
  //
  //   `world.contact`  the LAST contact, kept alive across ticks because
  //                    `noteContact` uses it to debounce a body resting on a
  //                    surface (the `until` window). This is memory.
  //   `world.struck`   the contact that happened THIS TICK, or null. This is
  //                    the event.
  //
  // They were merged, so `world.contact` never went back to null and read as a
  // permanent "I am touching a wall" for the rest of the run. Measured: one
  // contact object stayed live for 60 consecutive ticks on a cube flying AWAY
  // from the wall at 42 px/tick, and a cube parked on the floor reported
  // `surface: 'rail'` on 289 of 300 ticks.
  //
  // Every edge test downstream (`hitSurface !== lastContact`) was therefore a
  // level test. Splitting the fields fixes the channel without giving up the
  // debounce that keeps a resting body from buzzing.
  world.struck = null;
  // Did a RAIL write upward velocity this step? The ascent cap in run.js must
  // not clamp a bank -- a bank is a reward, not the runaway climb the cap
  // exists for. Set here because it is the physics pass that knows.
  world.banked = false;
  // Cleared before the substeps and re-set by `railBounce` when a side wall
  // applies its own fixed reduction. See WALL_KEEP.
  if (world.wallBounced > 0) world.wallBounced--;
  advanceTiming(world,pace);
  const scale = world.engine.timing.timeScale;
  beforeStep?.(scale); // enemy timing and gravity wells share this exact step
  const travelCeiling=()=>{const base=world.playerCeiling||MAX_SPEED,extra=Math.max(0,world.playerBurstAllowance||0);return extra>0?Math.min(MAX_PINBALL_SPEED,base+extra):base;};
  const fastest = snapshot(world.player, travelCeiling());
  const steps = Math.max(1, Math.ceil(((fastest + 0.5) * scale) / MAX_TRAVEL));
  world.substeps = steps;
  // The speed the cube ARRIVES with. Matter resolves an impact inside
  // Engine.update, so reading it afterwards would always see ~0 and every
  // landing would look like a body at rest.
  const incoming = world.player.speed;
  for (let i = 0; i < steps; i++) {
    const p = world.player,
      x = p.position.x,
      y = p.position.y;
    // Equipment changes only the player, never the arena or enemy gravity.
    if(world.playerGravityMultiplier != null && world.playerGravityMultiplier !== 1) {
      p.force.y -= p.mass * world.engine.gravity.y * world.engine.gravity.scale * (1-world.playerGravityMultiplier);
    }
    const priorStrike=onTravel?world.struck:null;
    Engine.update(world.engine, STEP_MS / steps);
    catchCrossing(world, x, y, incoming);
    railBounce(world);
    const beforeCap=onTravel?p.speed:0;
    capVelocity(p, travelCeiling());
    // Opt-in observation only. SAT may stop a thin-wall impact before the
    // continuous guard emits struck: that still transfers velocity ownership.
    const staticContact=onTravel&&world.engine.pairs.list.some(pair=>pair.isActive&&((pair.bodyA===p&&pair.bodyB.isStatic)||(pair.bodyB===p&&pair.bodyA.isStatic)));
    if(onTravel)onTravel({from:{x,y},to:{x:p.position.x,y:p.position.y},start:world.clock+scale*i/steps,end:world.clock+scale*(i+1)/steps,discontinuity:world.struck!==priorStrike||!!staticContact,velocityScale:beforeCap>0?Math.min(1,p.speed/beforeCap):1});
  }
  // ── RE-ASSERT THE FLOOR'S KICK ─────────────────────────────────────────
  //
  // See `kickHold` in `railBounce`. Only the vertical component is forced: a
  // kick never changes the player's lateral speed, and overwriting x would
  // cancel a steer that happened in the same tick.
  if (world.kickHold) {
    const k = world.kickHold;
    world.kickHold = null;
    if (world.player.velocity.y > k.y)
      Body.setVelocity(world.player, { x: world.player.velocity.x, y: k.y });
    // The body's cached speed drives the NEXT tick's substep count and the
    // ceiling clamp. `setVelocity` does not refresh it, so a kick left it at the
    // pre-kick value and `capVelocity` scaled the whole vector to match -- which
    // turned a 13.5 launch into a 42 one on the following tick.
    world.player.speed = Math.hypot(world.player.velocity.x, world.player.velocity.y);
    world.player.speedSquared = world.player.speed * world.player.speed;
  }
  // ── THE GOLDEN RULE, ENFORCED EVERY TICK ────────────────────────────────
  //
  // Corners are always 90 degrees. Launch no longer adds spin (see `launch`),
  // but a wall, an enemy contact or the solver can still impart some, and a
  // shape that is even a degree or two off square reads as a diamond at this
  // size. Rather than chase every source, the invariant is asserted where it
  // matters: after the physics step, the cube is axis-aligned by definition.
  //
  // This is a straighten, not a freeze -- there is nothing to preserve, because
  // the cube is never meant to have an orientation other than zero.
  if (world.player.angle !== 0 || world.player.angularVelocity !== 0) {
    Body.setAngle(world.player, 0);
    Body.setAngularVelocity(world.player, 0);
  }
  // A wall or the underside of a deck is NOT ground. Check the contact normal
  // in the blade's frame rather than approximating airborne from vertical speed.
  world.grounded = world.engine.pairs.list.some((pair) => {
    if (!pair.isActive || pair.isSensor) return false;
    const { parentA, parentB, normal } = pair.collision;
    const ny = parentA === world.player ? normal.y : parentB === world.player ? -normal.y : 0;
    return ny < -0.55 && world.player.velocity.y > -1.3;
  });
  // ── A RAIL IS GROUND FOR THE REFILL RULE ────────────────────────────────
  //
  // `world.grounded` is derived from Matter contact normals, and the arena rails
  // are NOT Matter bodies -- they are an analytic clamp in railBounce. So a cube
  // resting on the floor reported `grounded: false`, the airborne refill drip
  // kept ticking, and camping on the floor paid pips at the same rate as flying.
  // Measured: edge climbed to MAX_EDGE over 300 parked ticks.
  //
  // This has to be applied AFTER the Matter pass, which owns the flag and would
  // otherwise overwrite it.
  // Proximity to the boundary is the honest test, not a contact event: a cube
  // pinched against a rail touches it on EVERY tick, so there is no "contact"
  // to read on the ticks in between. Both axes are checked, so a cube sliding
  // along the floor is still resting on it.
  if (world.grounded && world.slow) setBulletTime(world, false);
  for (const pair of world.engine.pairs.list) {
    if (!pair.isActive || pair.isSensor) continue;
    const collision = pair.collision,
      { parentA, parentB, normal, depth: overlap } = collision;
    const sign = parentA === world.player ? 1 : parentB === world.player ? -1 : 0;
    if (!sign) continue;
    // Which body did we actually hit? A rail bounce must be told apart from
    // landing on a pad, because one is a billiard shot and the other is a stop.
    const other = parentA === world.player ? parentB : parentA;
    const nx = normal.x * sign,
      ny = normal.y * sign;
    if (!(overlap >= 0) || incoming < 1.2) continue;
    // Matter's support points are where the two silhouettes actually touched.
    // Using the body centre would put a landing's shockwave inside the cube.
    const supports = collision.supports;
    let cx = world.player.position.x,
      cy = world.player.position.y;
    if (Array.isArray(supports) && supports.length) {
      const raw = supports[0];
      if (Number.isFinite(raw?.x) && Number.isFinite(raw?.y)) {
        cx = raw.x;
        cy = raw.y;
      }
    }
    noteContact(world, cx, cy, -nx, -ny, incoming, other?.label === 'rail' ? 'rail' : 'solid');
  }
  world.previousClock = world.clock;
  world.clock += scale;
}

/** Same release velocity and gravity as the real shot. Ballistic preview is
 * intentionally truncated at the first obstacle; no promised ricochets. It
 * predicts REAL-TIME flight, even when the player is aiming in bullet time. */
export function projectilePoint(start, velocity, ticks) {
  const g = GRAVITY_Y * BASE_GRAVITY * STEP_MS * STEP_MS;
  return {
    x: start.x + velocity.x * ticks,
    y: start.y + velocity.y * ticks + 0.5 * g * ticks * ticks,
  };
}

export function destroyPhysics(world) {
  Composite.clear(world.engine.world, false, true);
  Engine.clear(world.engine);
}

export const RELEASE_GRAVITY = GRAVITY_Y * BASE_GRAVITY * STEP_MS * STEP_MS;

/** Collision-free release samples use Matter's semi-implicit substep order,
 * including its speed cap. The analytic parabola is only a coarse hint. */
export function releaseSamples(start, velocity, ticks = 190, {minVy=-Infinity,maxVy=Infinity,ceiling=MAX_SPEED} = {}) {
  let x=start.x,y=start.y,vx=velocity.x,vy=velocity.y;
  const initial=Math.hypot(vx,vy),k=initial>ceiling?ceiling/initial:1;
  vx*=k;vy*=k;
  const points=[{x,y}];
  for(let t=1;t<=ticks;t++){
    const steps=Math.max(1,Math.ceil((Math.hypot(vx,vy)+.5)/MAX_TRAVEL));
    for(let i=0;i<steps;i++){
      vy+=RELEASE_GRAVITY/steps;
      x+=vx/steps;y+=vy/steps;
      const speed=Math.hypot(vx,vy);
      if(speed>ceiling){vx*=ceiling/speed;vy*=ceiling/speed;}
    }
    vy=Math.max(minVy,Math.min(maxVy,vy));
    points.push({x,y});
  }
  return points;
}
