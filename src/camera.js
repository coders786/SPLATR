import { clamp } from './levels.js';
import { CAMERA, leanFor } from './motion.js';

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
  // How far ahead of the cube the lens frames, as a fraction of the viewport,
  // at terminal speed. Small on purpose: enough that a sustained climb never
  // pins the cube to the edge, not so much that the cube sits near the bottom
  // of a rising screen.
  const LEAD = CAMERA.lead;
  let leadX = 0,
    leadY = 0;
  // Speed at which the lead is fully applied. Matches MAX_SPEED loosely; a
  // fraction below terminal is enough because the lead saturates early.
  const MAX_LEAD_V = 42;
  function desired(p, stationary, vx = 0, vy = 0, z = zoom) {
    const portrait = width < height * 0.85;
    const inset = room ? 0.28 : 0.32;
    // The resting and flying framings stay distinct: the opening racks are
    // composed around the resting framing and must remain fully on screen at
    // 320x568. What removes the per-shot pan is the saccade below, not moving
    // the composition.
    const ax = stationary ? (forward > 0 ? inset : 1 - inset) : 0.48;
    const ay = stationary ? (room ? 0.76 : portrait ? 0.69 : 0.78) : 0.56;
    // Frame AHEAD of the cube while it is flying.
    //
    // Following the cube's exact centre is what put it against the top edge:
    // the follow rate is capped (deliberately -- an uncapped chase whips the
    // frame), so on a sustained climb the cube outruns the lens and the hard
    // framing clamp then parks it at the boundary. Measured before this
    // change: the cube sat in the outer 12% of the screen on 22-32% of frames
    // in a real run, and looked stuck rather than fast.
    //
    // So the lens leads the direction of travel by a fixed slice of the
    // viewport. This is not a lookahead toward targets (that made the field
    // slide sideways); it only ever leans along the cube's own velocity, so
    // the extra screen space is always in front of the player, which is where
    // a fast game needs to be readable anyway.
    // Sign: `screenFraction = ax + lead`, so to leave room IN FRONT of the
    // cube the lead has to be the NEGATIVE of its direction of travel. Climbing
    // (vy < 0) must therefore produce a POSITIVE lead.y, which puts the cube
    // lower on the screen and the empty space above it.
    // Smooth the direction of travel before leading, so the lead cannot swing
    // with every arc of the cube. A raw velocity lead doubled the worst view
    // acceleration (22.5 -> 41.9 px/tick) because the framing target flipped
    // side to side as the cube curved, and a framing target that changes its
    // mind is exactly the lurch this camera exists to avoid. The lead now
    // follows a slow average, so it only ever responds to SUSTAINED travel.
    leadX += (clamp((-vx / MAX_LEAD_V) * LEAD, -LEAD, LEAD) - leadX) * (stationary ? 0.5 : 0.08);
    leadY += (clamp((-vy / MAX_LEAD_V) * LEAD, -LEAD, LEAD) - leadY) * (stationary ? 0.5 : 0.08);
    const lead = { x: leadX, y: leadY };
    const axMix = ax,
      ayMix = ay;
    // Lean ONLY above the committed speed threshold (see motion.js). Below it
    // the lens is completely still, so a drifting or jittery thumb does not
    // drag the whole world around the screen.
    const lean = leanFor(vx, vy);
    return {
      x: p.x - (width / (base * z)) * axMix + lean.x - lead.x * (width / (base * z)),
      y: p.y - (height / (base * z)) * ayMix + lean.y - lead.y * (height / (base * z)),
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
      // NO speed zoom. A lens that rescales with velocity moves the ENTIRE
      // image at once -- including the shapes the player is reading -- and
      // scaling is the single most nauseating transform a camera can apply.
      // Whatever wider view a fast launch needs comes from the saccade
      // framing instead, which moves deliberately and then stops.
      zoom = stationary || !motion ? 1 : 1;
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
      // CAMERA: one smooth follow, hard-capped speed, no zoom, no lookahead.
      //
      // Earlier attempts at a "hold then catch" camera were cleverer than the
      // problem: the cube crosses the whole viewport in about 20 frames at
      // terminal speed, so any camera that stops moving is forced to snap
      // afterwards, and the snap is worse than the pan it replaced.
      //
      // What actually feels calm is not less motion but STEADIER motion: a
      // view that moves at a roughly constant, slow rate and never changes
      // direction sharply. So: a gentle exponential follow, a ceiling on how
      // far the view may travel per frame, and nothing else moving at all
      // (no zoom breathing, no lookahead toward targets).
      const vw = width / (base * zoom),
        vh = height / (base * zoom),
        dx = (d.x - x) * CAMERA.follow,
        dy = (d.y - y) * CAMERA.follow,
        dist = Math.hypot(dx, dy),
        // Cap the per-frame travel. This is the load-bearing line: it bounds
        // the peak view velocity regardless of how fast the cube is going, so
        // a long launch cannot whip the frame.
        k = dist > CAMERA.maxStepPx ? CAMERA.maxStepPx / dist : 1;
      x += dx * k;
      y += dy * k;
      // The cube is always inside the viewport. A property of the code, not a
      // hope about the tuning.
      const kx = vw * 0.02,
        ky = vh * 0.02;
      if (p.x < x + kx) x = p.x - kx;
      else if (p.x > x + vw - kx) x = p.x - vw + kx;
      if (p.y < y + ky) y = p.y - ky;
      else if (p.y > y + vh - ky) y = p.y - vh + ky;
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
