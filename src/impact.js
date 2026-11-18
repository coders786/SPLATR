import { clamp } from './levels.js';
import { MAX_SPEED } from './physics.js';

/** Contact feel, in numbers a test can argue about.
 *
 *  Three ideas from the design brief, kept DOM-free so they can be verified
 *  without a browser:
 *    - a fast body stretches ALONG its travel and thins across it, so the eye
 *      has a spatial line to track instead of a flickering square;
 *    - a contact compresses along the collision normal, expands along the
 *      tangent, and springs back through a damped oscillator;
 *    - every real contact throws one expanding ring from the exact point.
 *
 *  None of this moves physics. The impulse is always Matter's own velocity,
 *  and the frozen frames live in run.state.stop. This module only decides how
 *  much a POSE bends, so a wrong number here can never change a hit.
 */
export const IMPACT = Object.freeze({
  // Elongation starts where a cube is genuinely flying, not on a nudge.
  stretchFrom: MAX_SPEED * 0.52, // ~18 px / tick
  stretchMax: 0.46, // 1 -> 1.46 along the velocity vector
  stretchThin: 0.52, // how much of that stretch is paid back across it
  // A contact bends at least this much and at most that.
  squashMin: 0.14,
  squashMax: 0.4,
  springTicks: 15,
  // One ring per contact, gone in a quarter of a second.
  waveTicks: 17,
  waveFrom: 7,
  waveTo: 46,
});

/** 0 at a slow drift, 1 at terminal speed. Drives both the stretch and the
 *  weight of the contact bend: a gentle tap must not deform like a cannon. */
export function velocityWeight(speed) {
  if (!Number.isFinite(speed) || speed <= IMPACT.stretchFrom) return 0;
  return clamp((speed - IMPACT.stretchFrom) / (MAX_SPEED - IMPACT.stretchFrom), 0, 1);
}

/** Anisotropic elongation: `along` is the scale on the velocity axis, `across`
 *  the compensating thin on the perpendicular. Volume reads roughly constant,
 *  so a fast cube looks pulled, not simply bigger. */
export function elongate(speed) {
  const k = velocityWeight(speed) * IMPACT.stretchMax;
  return { along: 1 + k, across: 1 - k * IMPACT.stretchThin };
}

/** Damped harmonic springback. 1 on the contact frame, crossing zero and
 *  ringing slightly the other way, settled inside IMPACT.springTicks. */
export function spring(age, ticks = IMPACT.springTicks) {
  if (!Number.isFinite(age) || age < 0 || age >= ticks) return 0;
  const u = age / ticks;
  return Math.cos(u * Math.PI * 2.35) * Math.exp(-u * 4.4);
}

/** How hard a body of this speed should bend: 0 when slow, IMPACT.squashMax
 *  at terminal. A gentle contact still reads, so `squashMin` is the floor. */
export function contactSquash(speed) {
  return IMPACT.squashMin + (IMPACT.squashMax - IMPACT.squashMin) * velocityWeight(speed);
}

/** The pose distortion for one contact at `age` ticks old.
 *  `nx, ny` is the unit collision normal (direction of travel into the
 *  surface). Returns the squash axis in RADIANS to rotate the pose by, plus
 *  the along/across scale multipliers to apply inside that rotation. */
export function squashed(speed, nx, ny, age, ticks = IMPACT.springTicks) {
  const ring = spring(age, ticks);
  if (!ring) return null;
  const amp = contactSquash(speed) * ring,
    axis = Math.atan2(ny, nx);
  return { axis, along: 1 - amp, across: 1 + amp * 0.72 };
}

/** A contact ring's current radius and alpha, or null once it is spent. */
export function wave(age, ticks = IMPACT.waveTicks) {
  if (!Number.isFinite(age) || age < 0 || age >= ticks) return null;
  const u = age / ticks,
    ease = 1 - (1 - u) ** 2.4;
  return {
    r: IMPACT.waveFrom + (IMPACT.waveTo - IMPACT.waveFrom) * ease,
    alpha: (1 - u) ** 1.5,
  };
}
