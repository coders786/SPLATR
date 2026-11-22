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
  aimFallKeep: .1,
  floorKick: 22,
  floorIgnore: 12,
  wallKeep: .85,
  wallHop: 4,
  wallIgnore: 8,
  ascent: 26,
  fall: 10,
  launchGrace: 8,
  recharge: 76,
});
/** Post-integration safety envelope. A fresh shot gets eight complete ticks
 * before ordinary ascent/fall limits apply, so full-power down/up shots do
 * not lose most of their velocity on their first frame. Banks and floor
 * rescue retain their existing ownership/exemptions. */
export function flightEnvelope(state, banked = false) {
  const committed = state.launchGrace > 0;
  return {
    minVy: state.hyper || banked || state.floorIgnore > 0 || committed ? -Infinity : -MOVEMENT.ascent,
    maxVy: state.hyper || committed ? Infinity : MOVEMENT.fall,
  };
}
