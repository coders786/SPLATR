/** One passive FOCUS step, shared by the run and the labelled shop study.
 * Eligibility/drain/kill boosts remain owned by run; this never grants on input.
 */
export function recoverFocus(focus, multiplier = 1) {
  if (!Number.isFinite(focus) || !Number.isFinite(multiplier) || multiplier < 0) throw new RangeError('Invalid focus recovery');
  return Math.min(1, focus + multiplier / 250);
}

/** Deterministic illustration using the same recovery step, not live combat.
 * Both bars drain identically; only eligible return rates differ. Reduced motion
 * selects a stable mid-recovery frame, with no entry animation.
 */
export function focusRecoveryStudy(elapsed, {rate = 1.12, withoutRate = 1, drain = 1, motion = true} = {}) {
  const time = motion ? Math.max(0, Number.isFinite(elapsed) ? elapsed : 0) % 4400 : 1900;
  const held = time < 550;
  const start = Math.max(0, .4 - 33 * drain / 165);
  const ticks = Math.max(0, Math.floor((time - 550) * 60 / 1000));
  let focus = held ? Math.max(0, .4 - Math.floor(time * 60 / 1000) * drain / 165) : start;
  let without = focus;
  if (!held) for (let i = 0; i < ticks; i++) {focus = recoverFocus(focus, rate); without = recoverFocus(without, withoutRate);}
  return Object.freeze({focus, without, held, active: !held && focus < 1 && ticks > 0,
    age: !held && ticks > 0 && focus < 1 ? Math.min(8, ticks - 1) : -1,
    rate, withoutRate, marginal: Math.round((rate - withoutRate) * 100),
    phase: held ? 'AIM / VENTS CLOSED' : focus >= 1 ? 'FULL / VENTS CLOSED' : 'RELEASE / VENT COOLING'});
}
