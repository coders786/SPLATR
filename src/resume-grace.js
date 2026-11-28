// A pause is a wall-clock interruption, not simulation time. Freeze for the
// reacquisition cue, then ramp the fixed-step clock up without changing the
// physics step or borrowing the player's existing invulnerability.
export const RESUME_HOLD_MS = 400;
export const RESUME_RAMP_MS = 400;
const rampIntegral = t => .1 * t + .9 * t * t * t / (3 * RESUME_RAMP_MS * RESUME_RAMP_MS);
function integral(ms) {
  const t = Math.max(0, ms - RESUME_HOLD_MS);
  return rampIntegral(Math.min(t, RESUME_RAMP_MS)) + Math.max(0, t - RESUME_RAMP_MS);
}
export function createResumeGrace() {
  let started = null, previous = null;
  return {
    start(now) { started = previous = now; },
    cancel() { started = previous = null; },
    get active() { return started !== null; },
    get frozen() { return started !== null && previous - started < RESUME_HOLD_MS; },
    advance(now) {
      if (started === null) return { scale: 1, phase: 'none', progress: 1 };
      const safeNow = Math.max(previous, now), before = previous - started, elapsed = safeNow - started;
      const delta = safeNow - previous;
      const scale = delta ? (integral(elapsed) - integral(before)) / delta : 0;
      previous = safeNow;
      const phase = elapsed < RESUME_HOLD_MS ? 'hold' : elapsed < RESUME_HOLD_MS + RESUME_RAMP_MS ? 'ramp' : 'none';
      const progress = Math.min(1, elapsed / RESUME_HOLD_MS);
      if (phase === 'none') started = previous = null;
      return { scale, phase, progress };
    },
  };
}
