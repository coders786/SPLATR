// Input and automatic slow-time grants remain gameplay-owned. Read-only
// prediction geometry and its speed palette live in the standalone art engine.
import {aimVisuals} from './art/splatr-art-engine.js';
import {panicPace,panicTicksFor} from './pace.js';
const {threatAhead}=aimVisuals;
export const {ARC,speedRgb,speedInk,speedBand,arcPath,corridorReach,magnetize,impactPreview,predictAim}=aimVisuals;
export {threatAhead};

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
  s.panicTicks = panicTicksFor(s);
  s.panicWarm = 0;
  s.panic = {
    kind: threat.kind,
    x: threat.x,
    y: threat.y,
    ux: threat.ux,
    uy: threat.uy,
    ticks: s.panicTicks,
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
  const floor = panicPace(state);
  return 1 - (1 - floor) * panicGrip(state);
}
