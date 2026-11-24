/**
 * CHUNK 1 — THE TARGETING RING.
 *
 * The browser's own OS pointer was the game's aim marker: a default system
 * crosshair, drawn by the operating system, in the operating system's own
 * colour, at the operating system's own size — over a canvas whose whole
 * identity is flat ink and hard edges. It also vanished the moment a player
 * pulled back, which is exactly when they most need to know where the shot
 * will go, and it said nothing at all when a click was refused for want of a
 * cut.
 *
 * So the arena hides the system cursor and paints this instead: one crisp ring,
 * a dot at the true aim point, a pinch while a pull is loading, and a short
 * red refusal shake when a click could not become a cut.
 *
 * Pure geometry: no canvas, no DOM, no clock. `main.js` owns the pointer, this
 * owns what the ring should look like, the engine paints the result.
 */

/** Ring metrics in CSS px. Large enough to read in a 960×540 embed, small
 *  enough never to hide the shape underneath it. */
export const RETICLE = Object.freeze({
  radius: 20,
  /** How far the ring pinches in at full pull. */
  pinch: 6,
  dot: 2.2,
  /** A refused shot shakes for this many ticks (~0.43s). */
  refuseTicks: 26,
});

/**
 * @param {Object} q
 * @param {{x:number,y:number}|null} q.pointer CSS-px pointer, canvas-local.
 * @param {number} [q.power=0] 0..1 pull strength; pinches the ring.
 * @param {boolean} [q.charging=false] A pull is in progress.
 * @param {number} [q.cuts=1] Cut charges left. 0 arms the red warning state.
 * @param {number} [q.refuseAge=-1] Ticks since a refused shot; -1 = none.
 * @param {number} [q.tick=0] Animation clock, nominal 60 Hz ticks.
 * @param {boolean} [q.motion=true] Reduced motion drops the shake and spin.
 * @returns {null|{x,y,r,dot,alpha,charging,refused,warn,spin,shake}}
 */
export function reticleFor(q = {}) {
  const p = q.pointer;
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  const motion = q.motion !== false;
  const charging = !!q.charging;
  const power = Math.max(0, Math.min(1, Number(q.power) || 0));
  const refuseAge = Number.isFinite(q.refuseAge) ? q.refuseAge : -1;
  const refused = refuseAge >= 0 && refuseAge < RETICLE.refuseTicks;
  const warn = (Number(q.cuts) || 0) <= 0;
  // The pinch is the gesture itself made visible: the ring draws in as charge
  // loads, so a player can feel the pull without watching a bar.
  const r = RETICLE.radius - RETICLE.pinch * (charging ? power : 0) + (charging ? 1.5 : 0);
  // A refusal is a real signal (the click did nothing), so it shakes — a short,
  // decaying side-to-side that reads as "no" rather than as decoration.
  const shake = refused && motion ? 3.2 * Math.sin(refuseAge * 1.9) * (1 - refuseAge / RETICLE.refuseTicks) : 0;
  return {
    x: p.x + shake,
    y: p.y,
    r,
    dot: RETICLE.dot + (charging ? 0.8 : 0),
    alpha: charging ? 1 : 0.82,
    charging,
    refused,
    warn,
    spin: motion ? (Number(q.tick) || 0) * 0.012 : 0,
    shake,
  };
}
