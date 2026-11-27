/** Armor-shell policy. No bodies, renderer clocks, rewards or resource grants.
 * Legacy recoil is retained exactly for other shells. Chamfer scales only the
 * primary shove, then bounds it by the legal ceiling AND unshoved speed.
 */
export const ARMOR_SHELL = Object.freeze({glanceScale: .8, storeRatio: .2, storeMax: 4, lifetime: 45, glanceTicks: 7, releaseTicks: 9});
export function armorShellRecoil(incoming, angle, push, ceiling, chamfer = false) {
  const speed = Math.hypot(incoming.x, incoming.y), scale = chamfer ? ARMOR_SHELL.glanceScale : 1;
  const x = incoming.x - Math.cos(angle) * push * scale, y = incoming.y - Math.sin(angle) * push * scale;
  const mag = Math.hypot(x, y) || 1, k = Math.min(1, (chamfer ? Math.min(ceiling, speed) : ceiling) / mag);
  return {x: x * k, y: y * k};
}
/** Only actual removed momentum along the incoming direction is recoverable.
 * Sideways/reversed shoves never count as forward loss; no imaginary reserve.
 */
export function storeArmorLoss(before, after, tick, angle) {
  const preSpeed = Math.hypot(before.x, before.y);
  if (!(preSpeed > 0)) return null;
  const loss = Math.max(0, Math.min(preSpeed, ((before.x - after.x) * before.x + (before.y - after.y) * before.y) / preSpeed));
  const amount = Math.min(ARMOR_SHELL.storeMax, loss * ARMOR_SHELL.storeRatio);
  return amount > 1e-9 ? Object.freeze({amount, preSpeed, expiresAt: tick + ARMOR_SHELL.lifetime, angle}) : null;
}
export const activeArmorSpring = (charge, tick) => !!charge && charge.amount > 0 && tick < charge.expiresAt;
/** Call only AFTER launch is accepted. A capped launch still spends the one
 * charge, but never slows an already-faster launch or exceeds pre-impact speed.
 */
export function returnArmorSpring(velocity, charge, tick, ceiling) {
  const speed = Math.hypot(velocity.x, velocity.y);
  const amount = speed > 0 && activeArmorSpring(charge, tick) ? Math.max(0, Math.min(charge.amount, charge.preSpeed - speed, ceiling - speed)) : 0;
  return {x: speed > 0 ? velocity.x * (1 + amount / speed) : velocity.x,
    y: speed > 0 ? velocity.y * (1 + amount / speed) : velocity.y, amount};
}
/** Labelled policy illustration, not a combat replay. 30 -> armor shove7;
 * accepted second launch24 occurs36ticks after contact (inside45tick reserve).
 * Reduced motion selects the static contact/reserve state, never auto-releases.
 */
export function armorShellStudy(id, elapsed, motion = true) {
  const time = motion ? Math.max(0, Number.isFinite(elapsed) ? elapsed : 0) % 3400 : 1100;
  const contact = time >= 1000, released = time >= 1600, angle = 0;
  const before = {x: 30, y: 0}, normal = armorShellRecoil(before, 0, 7, 42),
    after = armorShellRecoil(before, 0, 7, 42, id === 'chamfer');
  const reserve = storeArmorLoss(before, after, 0, angle);
  const returned = returnArmorSpring({x: 24, y: 0}, reserve, 36, 42);
  return Object.freeze({time, contact, released, angle, incoming: 30, normal: normal.x, outgoing: after.x,
    stored: id === 'segmented' && contact && !released ? reserve.amount : 0,
    returned: id === 'segmented' && released ? returned.amount : 0,
    nextSpeed: returned.x, preSpeed: reserve.preSpeed,
    age: contact ? Math.floor((time - 1000) * 60 / 1000) : -1,
    releaseAge: released ? Math.floor((time - 1600) * 60 / 1000) : -1,
    phase: !contact ? 'APPROACH / PRIMARY BLADE' : id === 'chamfer' ? 'GLANCING RECOIL / NOT ARMOR' : !released ? 'REAL LOSS STORED / 45-TICK LIMIT' : 'ACCEPTED LAUNCH / ONE RETURN'});
}
