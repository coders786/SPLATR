import Matter from 'matter-js';
import { PLAYER_SIZE } from './levels.js';

const { Engine, Composite, Bodies, Body } = Matter;
export const STEP_MS = 1000 / 60;
export const MAX_SPEED = 35; // Matter velocity units: px / nominal 60 Hz step
export const MAX_PULL = 176; // world pixels, NOT CSS or backing-store pixels
export const BASE_GRAVITY = 0.001;
const GRAVITY_Y = 1.35;
const MAX_SPIN = 0.18;
const MAX_TRAVEL = 5; // maximum corner travel per collision sample
const SLOW = 0.15;
const DEAD_ZONE = 7;

export function createPhysics(level) {
  const engine = Engine.create({
    gravity: { x: 0, y: GRAVITY_Y, scale: BASE_GRAVITY },
    positionIterations: 7,
    velocityIterations: 5,
    enableSleeping: false,
  });
  // No ceiling, recovery floor or invisible room walls. A small injected set of
  // rectangles is useful for testing the same continuous-collision guard.
  const geometry = level.pad ? [level.pad] : level.solids || [];
  const solids = geometry.map((r) =>
    Bodies.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, {
      isStatic: true,
      label: 'solid',
      friction: 0.48,
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
 * rather than each component, so a diagonal shot has no speed advantage. */
export function dragVector(origin, pointer) {
  const dx = origin.x - pointer.x,
    dy = origin.y - pointer.y;
  const length = Math.hypot(dx, dy);
  const power = Math.min(length / MAX_PULL, 1);
  if (length < DEAD_ZONE) return { x: 0, y: 0, power: 0 };
  const k = (power * MAX_SPEED) / length;
  return { x: dx * k, y: dy * k, power };
}

function capVelocity(body) {
  if (body.speed > MAX_SPEED) Body.setSpeed(body, MAX_SPEED);
  if (body.angularSpeed > MAX_SPIN) Body.setAngularSpeed(body, MAX_SPIN);
}

/** Target the timing controls; the fixed clock, rather than pointer event
 * frequency, drives the blend. A launch explicitly returns to real time so
 * its first frame agrees with the trajectory the player just committed to. */
export function setBulletTime(world, on, immediate = false) {
  world.slow = Boolean(on);
  if (immediate) {
    world.engine.timing.timeScale = world.focusScale = on ? SLOW : 1;
    world.engine.gravity.scale = BASE_GRAVITY * (on ? 0.1 : 1);
  }
}

function advanceTiming(world, pace) {
  const target=world.slow?SLOW:1;
  world.focusScale+=(target-world.focusScale)*(world.slow?.32:.54);
  if(Math.abs(target-world.focusScale)<.002)world.focusScale=target;
  // A cut buys reading time without changing the committed parabola. Only
  // *held* focus lightens gravity and spends focus; the two never multiply.
  world.engine.timing.timeScale=Math.min(world.focusScale,pace);
  world.engine.gravity.scale=BASE_GRAVITY*(1-.9*(1-world.focusScale)/(1-SLOW));
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
function catchCrossing(world, startX, startY) {
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
  if (vn < 0)
    Body.setVelocity(p, {
      x: p.velocity.x - (1 + p.restitution) * vn * first.nx,
      y: p.velocity.y - (1 + p.restitution) * vn * first.ny,
    });
}

function snapshot(body) {
  const prev = body.plugin.previous;
  prev.x = body.position.x;
  prev.y = body.position.y;
  prev.angle = body.angle;
  capVelocity(body);
  return body.speed + body.angularSpeed * Math.SQRT1_2 * PLAYER_SIZE;
}

/** Advance exactly ONE real-time 1/60s tick. Render/monitor refresh rate is
 * deliberately not a parameter. At maximum speed a thin wall is sampled many
 * times; resting worlds cost one Matter update. Budget angular tip travel too. */
export function stepPhysics(world, beforeStep, pace=1) {
  advanceTiming(world,pace);
  const scale = world.engine.timing.timeScale;
  beforeStep?.(scale); // enemy timing and gravity wells share this exact step
  const fastest = snapshot(world.player);
  const steps = Math.max(1, Math.ceil(((fastest + 0.5) * scale) / MAX_TRAVEL));
  world.substeps = steps;
  for (let i = 0; i < steps; i++) {
    const p = world.player,
      x = p.position.x,
      y = p.position.y;
    Engine.update(world.engine, STEP_MS / steps);
    catchCrossing(world, x, y);
    capVelocity(p);
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
