import Matter from 'matter-js';
import { PLAYER_SIZE } from './levels.js';
import { speed } from './pace.js';

const { Engine, Composite, Bodies, Body } = Matter;
export const STEP_MS = 1000 / 60;
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
export const MAX_SPEED = 42;
export const MAX_PULL = 176; // world pixels, NOT CSS or backing-store pixels
export const BASE_GRAVITY = 0.001;
const GRAVITY_Y = 1.35;
const MAX_SPIN = 0.18;
const MAX_TRAVEL = 5; // maximum corner travel per collision sample
// The floor on time. 0.15 made a held aim feel like a different, syrupy game.
// The exact floor is the speed the PLAYER picked (see pace.js); 0.5 is the
// default "Fast" setting, and no setting is allowed to crawl.
export const SLOW_MIN = 0.5;
/** The live floor: whatever speed the player has selected. A held aim never
 *  sinks below this, and it is what the gravity easing is normalised against. */
export function slowFloor() {
  return speed().floor;
}
const DEAD_ZONE = 7;

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
  // that costs most of it (see FLOOR_CUSHION below). Nothing here can end a
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
      // Rails bounce; the starting pad does not (you land on it, you do not
      // ping off it). A rail at ~0.86 keeps a rally alive without ever
      // out-speeding the launch that started it.
      restitution: 0.15,
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
    world.engine.timing.timeScale = world.focusScale = on ? slowFloor() : 1;
    world.engine.gravity.scale = BASE_GRAVITY * (on ? 0.1 : 1);
  }
}

function advanceTiming(world, pace) {
  const floor = slowFloor();
  const target=world.slow?floor:1;
  // Snappier in, snappier out: the slower the transition, the more the world
  // reads as "lurching" rather than as speed changing.
  world.focusScale+=(target-world.focusScale)*(world.slow?.46:.62);
  if(Math.abs(target-world.focusScale)<.002)world.focusScale=target;
  // A cut, the field-edge warning or an automatic hazard grace buys reading
  // time without changing the committed parabola. Only *held* focus
  // lightens gravity and spends focus; the two never multiply.
  world.engine.timing.timeScale=Math.min(world.focusScale,pace);
  world.engine.gravity.scale=BASE_GRAVITY*(1-.9*(1-world.focusScale)/(1-floor));
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

export function launch(world, velocity) {
  const length = Math.hypot(velocity.x, velocity.y);
  if (!Number.isFinite(length) || length < 0.001) return false;
  const k = Math.min(1, MAX_SPEED / length);
  setBulletTime(world, false, true);
  Body.setVelocity(world.player, { x: velocity.x * k, y: velocity.y * k });
  Body.setAngularVelocity(world.player, Math.sign(velocity.x) * Math.min(length * 0.003, 0.105));
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
  if (!Number.isFinite(depth) || depth <= 1.4) return;
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
function railBounce(world) {
  const a = world.arena;
  if (!a) return;
  const p = world.player.position,
    v = world.player.velocity,
    RESTITUTION = 0.9,
    FLOOR_CUSHION = 0.45,
    half = PLAYER_SIZE / 2;
  const x0 = a.x + half,
    x1 = a.x + a.w - half,
    y0 = a.y + half,
    y1 = a.y + a.h - half;
  let side = null,
    nx = 0,
    ny = 0;
  if (p.x < x0) {
    p.x = x0;
    if (v.x < 0) {
      v.x = -v.x * RESTITUTION;
      side = 'left';
      nx = 1;
    }
  } else if (p.x > x1) {
    p.x = x1;
    if (v.x > 0) {
      v.x = -v.x * RESTITUTION;
      side = 'right';
      nx = -1;
    }
  }
  if (p.y < y0) {
    p.y = y0;
    if (v.y < 0) {
      v.y = -v.y * RESTITUTION;
      side = 'top';
      ny = 1;
    }
  } else if (p.y > y1) {
    p.y = y1;
    if (v.y > 0) {
      const arrival = Math.hypot(v.x, v.y);
      v.y = -v.y * RESTITUTION;
      // THE FLOOR IS A DEAD CUSHION.
      //
      // Every other rail is a bank you play, so it returns speed. The floor is
      // the one wall you are NOT supposed to be at: falling costs you most of
      // your energy. Without the penalty a fall is a free reset and there is no
      // reason to stay up -- the climb is the game.
      //
      // 0.45 keeps roughly a fifth of the kinetic energy and leaves the player
      // genuinely set back but alive. That is the difference between a bounce
      // and a setback, which is what "lossy" has to mean to be felt.
      v.x *= FLOOR_CUSHION;
      v.y *= FLOOR_CUSHION;
      side = 'bottom';
      ny = -1;
      world.floorCost = { arrival, after: Math.hypot(v.x, v.y) };
    }
  }
  if (!side) return;
  Body.setPosition(world.player, { x: p.x, y: p.y });
  Body.setVelocity(world.player, { x: v.x, y: v.y });
  // The rail is a bank, not a wall: publish the contact so the run can pay it.
  world.contact = {
    x: p.x,
    y: p.y,
    nx,
    ny,
    depth: 0,
    surface: 'rail',
    side,
    speed: Math.hypot(v.x, v.y),
  };
}

export function stepPhysics(world, beforeStep, pace=1) {
  advanceTiming(world,pace);
  const scale = world.engine.timing.timeScale;
  beforeStep?.(scale); // enemy timing and gravity wells share this exact step
  const fastest = snapshot(world.player, world.playerCeiling || MAX_SPEED);
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
    Engine.update(world.engine, STEP_MS / steps);
    catchCrossing(world, x, y, incoming);
    railBounce(world);
    capVelocity(p, world.playerCeiling || MAX_SPEED);
  }
  // A wall or the underside of a deck is NOT ground. Check the contact normal
  // in the blade's frame rather than approximating airborne from vertical speed.
  world.grounded = world.engine.pairs.list.some((pair) => {
    if (!pair.isActive || pair.isSensor) return false;
    const { parentA, parentB, normal } = pair.collision;
    const ny = parentA === world.player ? normal.y : parentB === world.player ? -normal.y : 0;
    return ny < -0.55 && world.player.velocity.y > -1.3;
  });
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
