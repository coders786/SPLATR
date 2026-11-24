/** Movement contract. Units are pixels per nominal 60 Hz physics tick.
 * Simulation remains fixed-step; slow time changes elapsed simulation, never
 * the committed direction. No permanent acceleration or wall/floor farming. */
export const MOVEMENT = Object.freeze({
  stepMs: 1000 / 60,
  maxSpeed: 42,
  maxPull: 176,
  gravityScale: .001,
  gravityY: 1.35,
  maxTravel: 5,
  deadZone: 7,
  focusScale: .1,
  // A held aim at over-speed holds the world at 55% instead of crawling at
  // 10% — the fix for "aim-hold while travelling at hyper loses its speed".
  // Gravity, capped by the same clock, keeps proportionally more of itself.
  focusFastFloor: .55,
  focusFastAt: 168, // px/tick — 60% of HYPER.speed (280)
  aimFallKeep: .1,
  floorKick: 22,
  floorIgnore: 12,
  wallKeep: .85,
  wallHop: 4,
  wallIgnore: 8,
  ascent: 26,
  fall: 10,
  launchGrace: 8,
  recharge: 60,
});
/** Post-integration safety envelope. A fresh shot gets eight complete ticks
 * before ordinary ascent/fall limits apply, so full-power down/up shots do
 * not lose most of their velocity on their first frame. Banks and floor
 * rescue retain their existing ownership/exemptions.
 *
 * CHUNK 2 (director): the ascent cap is a rule for the ORDINARY chain, not
 * for a world that has been torn open. A shattered arena — or any approach
 * already carrying more speed than an ordinary launch can build — keeps
 * everything. Only the absolute MAX_PINBALL_SPEED bounds those (see
 * physics.js). `speed` is the live total at the cap site. */
export function flightEnvelope(state, banked = false, speed = 0) {
  const committed = state.launchGrace > 0;
  const shattered = state?.arenaMode === 'SHATTERED';
  const fast = shattered || (Number.isFinite(speed) && speed > MOVEMENT.maxSpeed);
  return {
    minVy: state.hyper || banked || state.floorIgnore > 0 || committed || fast ? -Infinity : -MOVEMENT.ascent,
    maxVy: state.hyper || committed ? Infinity : MOVEMENT.fall,
  };
}
