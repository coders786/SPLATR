import { RELEASE_GRAVITY, projectilePoint, sweptHit, MAX_SPEED } from './physics.js';
import { PLAYER_SIZE, clamp } from './levels.js';

/** Everything that a launch preview must decide, in ONE DOM-free module:
 *  the parabolic path, its speed band, the first surface or target it meets,
 *  a magnetised release vector and the panic ray used when a fast cube is
 *  about to enter a wall or a hostile.
 *
 *  Nothing here moves the world. It is a prediction the renderer draws and
 *  the input system may nudge. The actual impulse still goes through
 *  Matter.Body.setVelocity in physics.launch(). */

export const ARC = {
  step: 2,
  maxTicks: 190,
  gravity: RELEASE_GRAVITY,
  wallPad: PLAYER_SIZE / 2, // inscribed half-width used by the real CCD guard
  corridor: 19, // world-pixel magnetic corridor, a little wider in focus
  corridorFocus: 26,
  pull: 0.24, // how much a magnetised release bends toward a locked centre
  // A corridor hit also widens the real blade for that one launch. Capped
  // so a lock is help, not a guaranteed kill through a plate.
  reach: 0.12,
  ray: 12, // 200 ms of forward travel at 60 Hz, in simulation ticks
  raySpeed: 26, // px / tick; below this a nudge is not a panic
  slowScale: 0.2,
  slowTicks: 30, // half a second at 60 Hz, in wall-clock ticks
};

// Cool cyan at a gentle tap, crimson at terminal velocity, white hot at the
// very top. Drawn as individual dashes so speed is readable without a legend.
const COOL = [62, 214, 232],
  CRIMSON = [226, 52, 86],
  WHITE = [255, 248, 236];
export function speedRgb(power) {
  const p = clamp(power, 0, 1);
  const along = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  if (p < 0.7) return along(COOL, CRIMSON, p / 0.7);
  return along(CRIMSON, WHITE, (p - 0.7) / 0.3);
}
export function speedInk(power) {
  return `rgb(${speedRgb(power).join(',')})`;
}

export function speedBand(power) {
  return power < 0.34 ? 'easy' : power < 0.72 ? 'strong' : 'lethal';
}

/** Advance the release parabola until it first meets static geometry or the
 *  Redline. Ticks are real-time 60 Hz ticks, independent of bullet time. */
export function arcPath(start, velocity, { geometry = [], line = -Infinity } = {}) {
  const out = [];
  let end = null;
  if (!velocity || Math.hypot(velocity.x, velocity.y) < 0.001)
    return { points: out, end, ticks: 0 };
  // Sweep in 2-tick segments, the same resolution the physics substep uses
  // at speed. Every segment is tested, every second dot drawn, and the
  // final point is the meet, so the reticle is always honest.
  let cut = false;
  for (let t = ARC.step, i = 1; t <= ARC.maxTicks && !cut; t += ARC.step, i++) {
    const q = projectilePoint(start, velocity, t),
      before = projectilePoint(start, velocity, t - ARC.step);
    if (i % 2 === 0) out.push(q);
    const wall = firstWall(before, q, geometry);
    if (wall) {
      end = { kind: 'wall', x: wall.x, y: wall.y, ticks: t, nx: wall.nx, ny: wall.ny };
      cut = true;
    } else if (q.y >= line - ARC.wallPad) {
      // Cross the exact Redline y, not the sample past it: same y(t) the
      // physics uses, so the reticle lands where the loss would happen.
      const a = before.y - (line - ARC.wallPad),
        b = q.y - (line - ARC.wallPad),
        u = a === b ? 0 : clamp(a / (a - b), 0, 1),
        x = before.x + (q.x - before.x) * u;
      end = { kind: 'tide', x, y: line - ARC.wallPad, ticks: t - ARC.step + ARC.step * u };
      cut = true;
    }
  }
  if (end) out.push({ x: end.x, y: end.y });
  return { points: out, end, ticks: Math.max(0, (out.length - 1) * ARC.step) };
}

function firstWall(a, b, geometry) {
  // Same slab test the physics CCD guard uses, so the picture cannot promise
  // a wall the cube would pass through or miss one it would hit.
  let best = null;
  for (const r of geometry) {
    const hit = sweptHit(a.x, a.y, b.x - a.x, b.y - a.y, r, ARC.wallPad);
    if (hit && (!best || hit.t < best.t))
      best = {
        t: hit.t,
        x: a.x + (b.x - a.x) * hit.t,
        y: a.y + (b.y - a.y) * hit.t,
        nx: hit.nx,
        ny: hit.ny,
      };
  }
  return best;
}

/** Projectiles (needles, rings, live links) are not static, so they are not
 *  promised by the arc. They ARE what the panic ray watches for. */
export function threatAhead(world, combat, velocity, { blade = 0, line = -Infinity } = {}) {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < ARC.raySpeed) return null;
  const p = world.player.position,
    reach = ARC.ray,
    ux = velocity.x / speed,
    uy = velocity.y / speed,
    tip = { x: p.x + ux * speed * reach, y: p.y + uy * speed * reach },
    r = PLAYER_SIZE * 0.44;
  let best = null;
  const consider = (d, kind, x, y) => {
    if (!Number.isFinite(d) || d < 0) return;
    if (!best || d < best.d) best = { d, ticks: d / speed, kind, x, y, ux, uy };
  };
  for (const e of combat.enemies.values()) {
    // The blade cuts a shape it reaches in time. Only a shape we would reach
    // with an expired blade is a crash, not a cut.
    // Distance from the segment to the target's rounded perimeter.
    const ax = e.x - p.x,
      ay = e.y - p.y,
      along = clamp(ax * ux + ay * uy, 0, speed * reach),
      miss = Math.hypot(ax - ux * along, ay - uy * along);
    // Blade ticks remaining vs. ticks until the surface is reached: arriving
    // with two ticks in hand is a cut, not a crash.
    if (blade > 2 && blade - 2 > Math.max(0, along - e.r) / speed) continue;
    if (miss <= e.r + r) consider(
        Math.max(0, along - Math.sqrt(Math.max(0, (e.r + r) ** 2 - miss * miss))),
        'shape',
        e.x,
        e.y,
      );
    else if (miss <= 46 && along <= e.r + r) consider(0, 'shape', e.x, e.y);
  }
  for (const h of combat.hazards || []) {
    if (h.spent) continue;
    if (h.kind === 'needle') {
      const ax = h.x - p.x,
        ay = h.y - p.y;
      const along = clamp(ax * ux + ay * uy, 0, speed * reach);
      if (Math.hypot(ax - ux * along, ay - uy * along) <= r + 15)
        consider(Math.max(0, along), 'needle', h.x, h.y);
    } else {
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (Math.abs(d - h.radius) <= r + 8 && d <= speed * reach)
        consider(Math.max(0, d - h.radius), 'ring', h.x, h.y);
    }
  }
  for (const l of combat.links || []) {
    if (l.mode === 'off') continue;
    const ax = l.a.x - p.x,
      ay = l.a.y - p.y,
      bx = l.b.x - p.x,
      by = l.b.y - p.y,
      wx = bx - ax,
      wy = by - ay;
    const t = clamp(-(ax * wx + ay * wy) / (wx * wx + wy * wy || 1), 0, 1),
      cx = ax + wx * t,
      cy = ay + wy * t,
      along = clamp(cx * ux + cy * uy, 0, speed * reach);
    if (Math.hypot(cx - ux * along, cy - uy * along) <= r + 6)
      consider(Math.max(0, along), 'link', l.a.x + wx * t, l.a.y + wy * t);
  }
  // The Redline is a boundary, not a shape. A descent that would cross it
  // inside the ray is exactly the unfair last-second fall this beat prevents.
  if (Number.isFinite(line)) {
    // Rays only see what is IN FRONT of the cube, not every surface below.
    const gap = line - PLAYER_SIZE / 2 - p.y;
    // Current downward rate must reach the stripe, and the ray must still be
    // pointed at it: same 200 ms look-ahead as the wall test.
    if (uy > 0.2 && gap > 0 && gap / uy <= speed * reach)
      consider(gap / uy, 'tide', p.x + (gap / uy) * ux, line - PLAYER_SIZE / 2);
  }
  // The ray only claims surfaces inside its 200 ms look-ahead. The slab test
  // already pads the wall, so the meet can sit a few px past `tip`; a hit at
  // or before t = 1 is the one this ray may call imminent.
  const wall = firstWall(p, tip, world.geometry);
  if (wall && wall.t <= 1) {
    const d = Math.hypot(wall.x - p.x, wall.y - p.y),
      hit = { d, ticks: d / speed, kind: 'wall', x: wall.x, y: wall.y, ux: wall.nx, uy: wall.ny };
    if (!best || d < best.d) best = hit;
  }
  return best;
}

/** Base payload shared by the pure preview and the live input. The input
 *  fires THIS, so the vector it bets on is exactly the one the arc drew. */
export function corridorReach(lock) {
  return lock ? ARC.reach : 0;
}

/** A magnetic corridor is swept along the CURRENT release vector, not the
 *  rendered dots. Targets are first-hit surfaces on that corridor. When one
 *  is caught, the release is bent toward its centre by a bounded fraction of
 *  the angle, and reported so the reticle can snap and the input can chirp. */
export function magnetize(start, velocity, combat, { focus = false, geometry = [] } = {}) {
  if (!velocity?.power) return { ...velocity, lock: null };
  const corridor = focus ? ARC.corridorFocus : ARC.corridor,
    speed = Math.hypot(velocity.x, velocity.y),
    ux = velocity.x / speed,
    uy = velocity.y / speed;
  let best = null;
  for (const e of combat.enemies.values()) {
    if (e.small) continue;
    const ax = e.x - start.x,
      ay = e.y - start.y,
      along = ax * ux + ay * uy;
    if (along <= 0 || along > 1180) continue;
    const miss = Math.hypot(ax - ux * along, ay - uy * along),
      radius = e.r + corridor;
    if (miss > radius) continue;
    if (!best || along < best.along) best = { e, along, miss };
  }
  if (!best) return { ...velocity, lock: null };
  const { e, miss } = best,
    pull = ARC.pull * (1 - clamp(miss / (e.r + ARC.corridorFocus), 0, 1)) + ARC.pull * 0.35,
    target = Math.atan2(e.y - start.y, e.x - start.x),
    a = Math.atan2(uy, ux),
    da = Math.atan2(Math.sin(target - a), Math.cos(target - a)) * clamp(pull, 0.14, 0.42),
    na = a + da;
  return {
    x: Math.cos(na) * speed,
    y: Math.sin(na) * speed,
    power: velocity.power,
    lock: { id: e.id, x: e.x, y: e.y, r: e.r, kind: e.kind },
  };
}

/** First-hostile surface along the corrected release. A visual promise only:
 *  the real collision is still the blade's sweep and Matter sensors. */
export function impactPreview(start, velocity, combat, path) {
  if (!velocity?.power || !path.points.length) return null;
  const last = path.points[path.points.length - 1];
  if (path.end && path.end.kind !== 'wall') return null;
  const limit = path.end ? Math.hypot(last.x - start.x, last.y - start.y) + PLAYER_SIZE * 0.6 : Infinity;
  let best = null;
  for (const t of path.points) {
    const d = Math.hypot(t.x - start.x, t.y - start.y);
    if (d > limit) break;
    for (const e of combat.enemies.values()) {
      const q = e.r + PLAYER_SIZE * 0.36;
      if (Math.hypot(t.x - e.x, t.y - e.y) > q) continue;
      const along = d;
      if (!best || along < best.along) best = { x: e.x, y: e.y, r: e.r, kind: e.kind, id: e.id, along };
    }
    if (best) break;
  }
  return best;
}

/** Full aim snapshot. Cheap enough for every pointermove: the arc is bounded
 *  at 190 ticks × 2-tick samples and there are at most a few dozen bodies. */
export function predictAim(run, velocity, { focus = false, magnetic = true } = {}) {
  if (!run || !velocity?.power) return null;
  const start = { ...run.world.player.position },
    // The live input already carries its magnet answer; never bend it twice.
    lockOn = magnetic
      ? magnetize(start, velocity, run.combat, { focus })
      : { ...velocity, lock: velocity.lock ?? null },
    path = arcPath(start, lockOn, { geometry: run.world.geometry, line: run.state.line }),
    speed = Math.hypot(lockOn.x, lockOn.y),
    power = speed / MAX_SPEED,
    hit = impactPreview(start, lockOn, run.combat, path);
  return {
    start,
    velocity: lockOn,
    path: path.points,
    end: hit ? { kind: 'target', x: hit.x, y: hit.y, id: hit.id } : path.end,
    hit,
    lock: lockOn.lock,
    power,
    band: speedBand(power),
    ink: speedInk(power),
    ticks: path.ticks,
    // A real launch is a touch wider along the corridor this shot crosses.
    reach: lockOn.lock ? ARC.reach : 0,
  };
}

/** The panic window. Only when airborne, untouched and fast does a forward
 *  ray buy half a second of 20% time. The grant lives ON the run state, so a
 *  test can drive it without a browser:
 *    s.panic      { kind, x, y, ticks, born } | null   (telegraph + ray)
 *    s.panicTicks wall ticks remaining, counted down by run.tick()
 *    s.panicGrants ids of threats already granted this launch (at most two)
 *  A press ends it: the player is now aiming an escape. Held focus then owns
 *  the time scale. Releasing focus cannot re-trigger the SAME threat. */
export function panicWindow(run, pressed, motion = true) {
  const s = run.state;
  const clear = () => {
    s.panicTicks = 0;
    s.panicWarm = 0;
    s.panic = null;
  };
  if (pressed) {
    clear();
    return null;
  }
  if (s.opening || s.held || s.phase !== 'playing' || run.world.grounded) {
    if (s.panicTicks > 0) clear();
    return null;
  }
  const threat = motion
    ? threatAhead(run.world, run.combat, run.world.player.velocity, {
        blade: s.blade,
        line: s.line,
      })
    : null;
  if (!threat) {
    clear();
    return null;
  }
  const key = `${threat.kind}:${Math.round(threat.x / 40)}:${Math.round(threat.y / 40)}`;
  if (s.panicGrants.includes(key)) return s.panic;
  if (s.panicGrants.length >= 2) return s.panic;
  s.panicGrants.push(key);
  s.panicTicks = ARC.slowTicks;
  s.panicWarm = 0;
  s.panic = {
    kind: threat.kind,
    x: threat.x,
    y: threat.y,
    ux: threat.ux,
    uy: threat.uy,
    ticks: ARC.slowTicks,
    born: run.world.clock,
  };
  s.warning = Math.max(s.warning || 0, 0.55);
  return s.panic;
}

/** 0.2 at full grip, eased over five wall ticks either side so the beat
 *  enters and leaves like a breath rather than a hard cut. */
export function panicGrip(state) {
  if (!state.panicTicks) return 0;
  return Math.min(1, state.panicWarm / 5, state.panicTicks / 5);
}
export function panicScale(state) {
  return 1 - (1 - ARC.slowScale) * panicGrip(state);
}
