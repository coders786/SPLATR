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
 *  lifted. `launch()` deliberately clamps its input to MAX_SPEED, so a dash
 *  during hyper reset 279 to 31 in one tick and destroyed the state on the
 *  next. A dash is how a hyper player STEERS: it owns the heading, the state
 *  owns the magnitude. Returns the speed actually set.
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
function railBounce(world) {
  const a = world.arena;
  if (!a) return;
  const p = world.player.position,
    v = world.player.velocity,
    RESTITUTION = 0.9,
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
      if (-v.x < ARRIVE) v.x = 0;
      else {
        v.x = -v.x * RESTITUTION;
        side = 'left';
        nx = 1;
      }
    }
  } else if (p.x > x1) {
    p.x = x1;
    if (v.x > 0) {
      if (v.x < ARRIVE) v.x = 0;
      else {
        v.x = -v.x * RESTITUTION;
        side = 'right';
        nx = -1;
      }
    }
  }
  if (p.y < y0) {
    p.y = y0;
    if (v.y < 0) {
      if (-v.y < ARRIVE) v.y = 0;
      else {
        v.y = -v.y * RESTITUTION;
        side = 'top';
        ny = 1;
      }
    }
  } else if (p.y > y1) {
    p.y = y1;
    if (v.y > 0 && v.y < ARRIVE) {
      // Resting on the floor: gravity feeds it a crumb of downward speed every
      // substep. Absorb it and stay quiet -- see ARRIVE above.
      v.y = 0;
    } else if (v.y > 0) {
      v.y = -v.y * RESTITUTION;
      // ── THE FLOOR IS A WALL, NOT A CUSHION ───────────────────────────────
      //
      // It used to be a "dead cushion": 45% of your speed, gone, and the run
      // treats arriving there as a setback. That was written when the floor sat
      // 12,000px below the spawn while the top wall sat 78,000 above -- the
      // bottom was a trap door in a shaft, not a fourth side of a table.
      //
      // The measured consequence was that it was never reached at all: across a
      // 2,400-tick run the cube's deepest point was y = -28, i.e. it never went
      // BELOW THE SPAWN, while it hit the top wall four times. A wall nobody
      // ever touches and nobody can see is not a wall.
      //
      // So the arena is now symmetric (top -78,000, floor +78,000) and the
      // floor banks like every other rail. The user's words: "add wall to
      // bottom just like above". There is no reason for one of four sides to
      // behave differently in a game about banking off four sides.

      side = 'bottom';
      ny = -1;
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
  world.struck = world.contact;
}

export function stepPhysics(world, beforeStep, pace=1) {
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
