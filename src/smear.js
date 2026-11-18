/** Anime speed rendering.
 *
 *  The brief was "more motion blur and ghost imaging, anime-like -- research
 *  what that is like and add it", so this is built from the vocabulary the
 *  animation industry actually uses rather than from a photographic blur
 *  filter. Four different effects, each doing a different job:
 *
 *  ## stretch smear
 *  The form itself is elongated along its travel. Not a blur -- the shape is
 *  still crisp, it is just *wrong*: too long for the object that made it.
 *
 *  ## multi-image smear (the "ghost")
 *  Several distinct copies of the same silhouette, usually 3-5, spaced along
 *  the path at decreasing opacity. The key detail is that the copies are
 *  SEPARATE SHAPES, not a smeared average. When you average frames you get a
 *  camera blur; when you stamp discrete copies you get the hand-drawn look,
 *  because that is literally what an animator did -- drew the same cel
 *  repeatedly a few millimetres apart.
 *
 *  ## morphing smear
 *  A transient shape that neither the object nor a blur of it: a wedge, a
 *  triangle, a swoosh. It exists for one or two frames and cannot be traced
 *  back to the form. This is the least "correct" effect and the one that most
 *  sells speed, because the eye reads it as the object outrunning its own
 *  definition.
 *
 *  ## impact frames / speed lines
 *  A single high-contrast frame at a contact, and long tapered strokes along
 *  the direction of travel.
 *
 *  WHY DRAWN BEATS PHOTOGRAPHIC
 *  A real motion blur is what a camera sees, so the brain files it as a camera
 *  artefact -- the object was fine, the lens smeared it. A drawn distortion is
 *  impossible, so the brain files it as the OBJECT moving too fast to render.
 *  That is the entire trick, and it is why this file draws discrete shapes
 *  instead of using canvas `filter: blur()`.
 *
 *  All of it is cube-only. Enemies are never smeared: they are the things the
 *  player has to aim at, and a blurry target is an unfair target.
 */

/** Live ghosts. A ghost is a frozen snapshot of the cube's pose, aged out.
 *
 *  Deliberately a fixed-size ring buffer and not an array that grows: this runs
 *  every frame and allocating per-frame garbage is how a 60fps game becomes a
 *  40fps game with a GC hitch. */
export function createSmear(capacity = 10) {
  const xs = new Float32Array(capacity),
    ys = new Float32Array(capacity),
    as = new Float32Array(capacity),
    fs = new Float32Array(capacity),
    ages = new Float32Array(capacity).fill(-1);
  let head = 0;

  return {
    /** Record the cube's pose. `age` starts at 0 and climbs with `tick`. */
    push(x, y, angle, facing) {
      xs[head] = x;
      ys[head] = y;
      as[head] = angle;
      fs[head] = facing;
      ages[head] = 0;
      head = (head + 1) % capacity;
    },
    tick(dt) {
      for (let i = 0; i < capacity; i++) if (ages[i] >= 0) ages[i] += dt;
    },
    clear() {
      ages.fill(-1);
    },
    /** Iterate live ghosts, oldest last. */
    each(fn) {
      for (let i = 0; i < capacity; i++) {
        // Walk backwards from head so we emit newest -> oldest.
        const k = (head - 1 - i + capacity * 2) % capacity;
        if (ages[k] >= 0) fn(xs[k], ys[k], as[k], fs[k], ages[k]);
      }
    },
    get size() {
      let n = 0;
      for (let i = 0; i < capacity; i++) if (ages[i] >= 0) n++;
      return n;
    },
  };
}

/** How many ghosts and how far apart, for a given speed.
 *
 *  Derived from the tier thresholds rather than invented: ghosts appear as soon
 *  as the cube is genuinely fast (surge) and thicken at redline, so the effect
 *  is a readout of speed instead of decoration that is always on. If it were
 *  always on it would stop meaning anything.
 */
export function ghostFor(speed, MAX_SPEED) {
  const t = Math.max(0, Math.min(1.6, speed / MAX_SPEED));
  if (t < 0.55) return { count: 0, gap: 0, alpha: 0 };
  // 0 at the surge threshold, 1 at redline and beyond.
  const k = Math.min(1, (t - 0.55) / 0.35);
  return {
    count: t > 0.9 ? 4 : 3,
    gap: 9 + 16 * k,
    alpha: 0.1 + 0.26 * k,
  };
}

/** The morphing smear: an impossible transient shape behind the cube.
 *
 *  A tapered wedge that starts at the cube and trails away for a distance
 *  proportional to speed. It is drawn ONCE per frame, underneath everything,
 *  and it is the effect that reads as "the cube is tearing". */
export function morphWedge(c, speed, MAX_SPEED) {
  const t = Math.max(0, Math.min(1.5, speed / MAX_SPEED));
  if (t < 0.62) return null;
  const k = Math.min(1, (t - 0.62) / 0.5);
  return { length: 22 + 78 * k, width: 15 + 9 * k, alpha: 0.1 + 0.2 * k };
}
