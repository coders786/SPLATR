/**
 * CHUNK 1 — "WHAT HIT ME?"
 *
 * The report's clearest complaint: a player loses two health in one second and
 * cannot tell what touched them. The old answer was a small paragraph in the
 * corner (`HEALTH −1 / Pulse wave`) that arrived after the fact, named a system
 * rather than a body, and said nothing about WHERE the danger was.
 *
 * This module is the model for the answer:
 *
 *   1. A directional hit line from the player to the exact body that hit them
 *      (`hitDirection`). If nothing is in range, it returns null and the screen
 *      edge flash carries the news alone — no invented attacker.
 *   2. A short reaction window (`freeze`/`slowmo`) so the frame is readable.
 *   3. A safety blink long enough that a second hit inside one second is
 *      impossible by construction, not by luck (`SAFE_BLINK_TICKS >= 72`).
 *
 * Pure: no canvas, no DOM, no timers. `main.js` owns the clock and pushes the
 * resulting snapshot; `splatr-art-engine.js` paints it.
 */

/** Ticks of invulnerability promised after any real hit. 1.2s at 60 Hz. */
export const SAFE_BLINK_TICKS = 72;
/** Hard freeze before the slowdown — long enough to register, short enough
 *  that a chained run does not feel sticky. */
export const HIT_FREEZE_TICKS = 2;
/** Slow-motion window and the scale applied during it.
 *
 *  CHUNK 2: this is the whole "damage slow-motion" Module 2 asks for, and it is
 *  spent as TIME, not as skipped ticks. `hitPace` below feeds `stepPhysics`'s
 *  `pace` argument, which is the only door into `advanceTiming`; the physics
 *  clock and the gravity scale stay coupled to it, so the committed parabola
 *  survives the window instead of desyncing from it. */
export const HIT_SLOW_TICKS = 15;
export const HIT_SLOW_SCALE = 0.15;
/** Screenspace rim flash after a hit. */
export const HIT_RIM_TICKS = 36;
/** CHUNK 2: how long the frame stays below real time, in ticks, measured from
 *  the hit. Two ticks of near-freeze and fifteen of slow-motion, eased back to
 *  1.0 — 0.28s of readable room on a 60 Hz clock, which is the difference
 *  between "something hit me" and "the FANG from the left hit me". */
export const HIT_WINDOW_TICKS = HIT_FREEZE_TICKS + HIT_SLOW_TICKS;

/**
 * The exact bearing from the player to whatever hurt them.
 * Returns null when there is nothing honest to point at.
 *
 * @param {{x:number,y:number}} player
 * @param {{x:number,y:number}|null} source the attacker's body, orb or beam emitter
 * @returns {{x:number,y:number,angle:number,distance:number}|null}
 */
export function hitDirection(player, source) {
  if (!player || !source) return null;
  const x = Number(source.x), y = Number(source.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const dx = x - player.x, dy = y - player.y, distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 0.001) return null;
  return { x, y, angle: Math.atan2(dy, dx), distance };
}

/**
 * One snapshot of the whole damage reaction, for the painter and the HUD.
 * `age` counts ticks since the hit; everything derived from it is 0..1 so the
 * caller never has to know a duration.
 */
export function damageFeedback(q = {}) {
  const age = Number.isFinite(q.age) ? q.age : -1;
  const live = age >= 0 && age < HIT_RIM_TICKS;
  const ramp = live ? Math.max(0, 1 - age / HIT_RIM_TICKS) : 0;
  const dir = hitDirection(q.player, q.source);
  return {
    live,
    age,
    /** 0..1, the rim flash's own opacity multiplier. */
    rim: live ? 0.25 * Math.min(1, ramp * 2.2) : 0,
    /** The freeze frame: exactly one tick of hard stop at the moment of impact. */
    freeze: age === 0,
    /** The slow-motion fraction of real time for this tick (1 = normal). */
    timeScale: hitPace(age),
    /** The line to the attacker, when there is one. */
    direction: dir,
    /** 0..1 progress of the impact ring at the attacker's body. */
    impact: dir ? Math.min(1, age / 18) : 0,
    /** What the corner line should say. Never a paragraph. */
    label: q.cause ? `${dmgLabel(q.cause)} HIT` : 'HIT',
    /** CHUNK 2: where it came from, in one word, for the rare attacker that is
     *  off-screen and therefore has no line to point at. */
    bearing: bearingWord(dir ? dir.angle : null),
    /** True while the frame is deliberately slower than real time. */
    slow: hitPace(age) < 1,
  };
}

/**
 * The time multiplier the simulation should spend on this tick, given how long
 * ago the hit landed. 1.0 outside the window, so callers can min() it into
 * whatever pacing they already computed.
 *
 * The shape is deliberate: the impact frame itself is the hitstop (handled by
 * `s.stop` in the run), then a slow-motion window that EASES BACK rather than
 * snapping to 1.0. A linear return is the one curve that reads as a stutter;
 * the quadratic return reads as time resuming.
 *
 * @param {number} age ticks since the real hit, or a negative number for none
 * @returns {number} 0..1 multiplier
 */
export function hitPace(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a < 0) return 1;
  // The first ticks are the HITSTOP (`s.stop`), which stops the entities
  // outright; time itself stays at 1.0 there, so the two do not multiply into
  // a lurch. The slow window begins the moment motion resumes.
  if (a < HIT_FREEZE_TICKS) return 1;
  const u = (a - HIT_FREEZE_TICKS) / HIT_SLOW_TICKS;
  if (u >= 1) return 1;
  return HIT_SLOW_SCALE + (1 - HIT_SLOW_SCALE) * u * u;
}

/** Short, body-first naming. "Pulse wave" read as an enemy attack; the thing
 *  that actually hit you was the ring, so the ring is what gets named. */
export function dmgLabel(cause) {
  const map = {
    Fang: 'FANG',
    Pulse: 'RING',
    Prism: 'SHARD',
    Fork: 'SPLIT',
    Bastion: 'PLATE',
    Rift: 'RIFT',
    Well: 'WELL',
    Crown: 'CROWN',
    monolith: 'LANDLORD',
    laser: 'LASER',
    beam: 'BEAM',
  };
  return map[cause] || String(cause || 'HIT').toUpperCase();
}

/**
 * One word for "which way". Screen bearings assume +y is DOWN, which is the
 * canvas convention the hit line already uses.
 *
 * @param {number|null} angle radians, or null
 * @returns {string} '' when there is nothing to say
 */
export function bearingWord(angle) {
  if (!Number.isFinite(angle)) return '';
  const deg = (angle * 180) / Math.PI;
  const octant = ((Math.round(deg / 45) % 8) + 8) % 8;
  return ['RIGHT', 'DOWN-RIGHT', 'DOWN', 'DOWN-LEFT', 'LEFT', 'UP-LEFT', 'UP', 'UP-RIGHT'][octant];
}

/**
 * The health bar's own model: one segment per point, with the segment that
 * just broke returned so the HUD can crack it instead of silently unlinking it.
 */
export function healthSegments(hp, hpMax, previous = null) {
  const max = Math.max(1, hpMax | 0), now = Math.max(0, Math.min(max, hp | 0));
  const was = previous === null ? now : Math.max(0, Math.min(max, previous | 0));
  return {
    max,
    now,
    lost: Math.max(0, was - now),
    /** Index of the newest broken segment, or -1. */
    brokeAt: was > now ? now : -1,
    critical: now === 1,
    empty: now === 0,
  };
}
