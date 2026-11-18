import { clamp } from './levels.js';
import { MOTION, dampedTarget, leanFor } from './motion.js';

/** The framebuffer is only the size of the display. A virtual camera moves
 * through kilometres of world space; we never allocate a world-sized texture.
 * Camera smoothing is tick-based, with independent render interpolation. */
export function createCamera() {
  let width = 1,
    height = 1,
    base = 1,
    x = 0,
    y = 0,
    zoom = 1;
  let prevX = x,
    prevY = y,
    prevZoom = zoom;
  let home = { x: 0, y: 0 },
    last = home,
    docked = true,
    room = false,
    forward = 1;
  function frameScale() {
    const portrait = width < height * 0.85;
    return room
      ? portrait
        ? width / 676
        : Math.min(width / 830, height / 728)
      : portrait
        ? width / 792
        : Math.min(width / 1330, height / 780);
  }
  function desired(p, stationary, vx = 0, vy = 0, z = zoom) {
    const portrait = width < height * 0.85;
    const inset = room ? 0.28 : 0.32;
    const ax = stationary ? (forward > 0 ? inset : 1 - inset) : 0.48;
    const ay = stationary ? (room ? 0.76 : portrait ? 0.69 : 0.78) : 0.56;
    // Lean ONLY above the committed speed threshold (see motion.js). Below it
    // the lens is completely still, so a drifting or jittery thumb does not
    // drag the whole world around the screen.
    const lean = leanFor(vx, vy);
    return {
      x: p.x - (width / (base * z)) * ax + lean.x,
      y: p.y - (height / (base * z)) * ay + lean.y,
    };
  }
  function snap(p, stationary = false) {
    last = { ...p };
    docked = stationary;
    zoom = prevZoom = 1;
    const d = desired(p, stationary);
    x = prevX = d.x;
    y = prevY = d.y;
  }
  return {
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      // Portrait gets a tall field of view and a readable cube, not a tiny
      // letterboxed version of the landscape composition.
      base = frameScale();
      snap(last, docked);
    },
    reset(p, facing = 1, onRack = false) {
      room = onRack;
      base = frameScale();
      forward = facing;
      home = { ...p };
      snap(p, true);
    },
    snap,
    /** The lens does NOT dolly. A fixed scale, with only the faintest lean
     *  into speed, because a zoom that moves while you aim is the fastest way
     *  to make a fast game unwatchable. `widen` is accepted and ignored so
     *  callers and tests keep one signature. */
    tick(p, v, stationary, motion = true, next = null, widen = 0) {
      prevX = x;
      prevY = y;
      prevZoom = zoom;
      last = { ...p };
      docked = stationary;
      const speed = Math.hypot(v.x, v.y);
      // A slow, continuous pull-back with speed only: more of the field is
      // visible the faster you fly. It is deliberately gentle (0.94 at
      // terminal) and NEVER tied to aiming, which is the dolly that made
      // holding a shot feel like the room was breathing.
      const targetZoom = stationary || !motion ? 1 : 1 - Math.min(0.06, speed * 0.0018);
      zoom += (targetZoom - zoom) * 0.09;
      const d = desired(p, stationary, motion ? v.x : 0, motion ? v.y : 0);
      if (next) {
        d.x += clamp(
          (next.x - p.x) * 0.45,
          (-width / (base * zoom)) * 0.2,
          (width / (base * zoom)) * 0.2,
        );
        d.y += clamp(
          (next.y - p.y) * 0.4,
          (-height / (base * zoom)) * 0.14,
          (height / (base * zoom)) * 0.14,
        );
      }
      // Dead zone first, then a damped follow. Chasing every pixel of player
      // motion is what made the field feel like it was sliding underfoot.
      const aim = dampedTarget(
        d,
        { x, y },
        width / (base * zoom),
        height / (base * zoom),
      );
      x += (aim.x - x) * MOTION.follow;
      y += (aim.y - y) * MOTION.follow;
      // Never lose the player at the edge of a narrow screen on a sharp turn.
      const vw = width / (base * zoom),
        vh = height / (base * zoom);
      x = clamp(x, p.x - vw * 0.82, p.x - vw * 0.17);
      y = clamp(y, p.y - vh * 0.83, p.y - vh * 0.16);
    },
    view(alpha = 1) {
      const scale = base * (prevZoom + (zoom - prevZoom) * alpha);
      const left = prevX + (x - prevX) * alpha,
        top = prevY + (y - prevY) * alpha;
      const origin = desired(home, true, 0, 0, scale / base);
      return {
        x: left,
        y: top,
        width,
        height,
        scale,
        w: width / scale,
        h: height / scale,
        panX: left - origin.x,
        panY: top - origin.y,
      };
    },
  };
}
export const toScreen = (view, p) => ({
  x: (p.x - view.x) * view.scale,
  y: (p.y - view.y) * view.scale,
});
export const inView = (view, p, margin = 100) =>
  p.x >= view.x - margin &&
  p.x <= view.x + view.w + margin &&
  p.y >= view.y - margin &&
  p.y <= view.y + view.h + margin;

// During a cut's breathing beat, compose the NEXT choice as well as the
// cube. This matters more on a narrow phone than another few pixels of zoom.
export function frameRun(camera,run,motion=true){
  const s=run.state,p=run.world.player;
  // Look ahead ONLY when the cube is actually parked and choosing: a breath
  // after a paid cut, or a held aim. While the cube is flying, the lens stays
  // on the cube. Chasing the next target mid-flight is what made the field
  // feel like it was sliding sideways under the player's thumb.
  const looking=s.opening
    ? s.opening.rest && s.phase!=='ready'
    : s.phase==='playing' && (s.held || s.breath>0);
  // No widen flag: the lens holds one scale. Aiming, a panic grace and a
  // decision beat all used to pull the camera back, and that dolly is the
  // single most disorienting thing a fast game can do to a player.
  camera.tick(p.position,p.velocity,s.phase==='ready',motion,looking?run.nearest():null,0);
}
