/**
 * A display that a headless test can actually observe.
 *
 * The point of these tests is "what does the player see", and until now nothing
 * in the suite could answer it: `test/frame.test.js` re-implemented the
 * renderer's maths by hand (`pose(e, alpha)` and `camera.view(alpha)`), so it
 * measured a COPY of the render path rather than the render path. A bug inside
 * `draw()` -- a wrong alpha, a stale transform, a skip -- was invisible to it by
 * construction.
 *
 * This module gives the real `createRenderer(...)` a recording 2D context, so a
 * test can drive the actual `draw()` and read back where every shape landed on
 * the glass. No canvas dependency: a Proxy answers every 2D call, keeps the
 * state the renderer sets, and records the full transform stack.
 *
 * What is recorded and why:
 *   - `drawImage`/`fill`/`stroke`/`fillRect` are the only operations that put
 *     pixels on screen, so a frame is "the same as the last one" exactly when it
 *     issues the same set at the same transformed coordinates. That makes
 *     duplicate detection exact instead of inference.
 *   - The transform stack is tracked so every primitive is recorded in DEVICE
 *     space. That is the space the eye sees, and it is what makes "this shape
 *     jumped" a measurable claim.
 */

/** Stands in for an OffscreenCanvas/HTMLCanvasElement. */
function makeSurface(width, height, made) {
  const surface = { width, height };
  surface.getContext = () => (made.ctx ??= createRecordingContext(width, height, made));
  return surface;
}

/** A 2D context that records instead of rasterising. */
export function createRecordingContext(width, height) {
  const state = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineCap: 'butt',
    lineJoin: 'miter',
    shadowBlur: 0,
    shadowColor: 'transparent',
    filter: 'none',
    imageSmoothingEnabled: true,
  };
  // Column-major 2D affine, exactly as canvas stores it.
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const points = []; // current path, device space
  const ops = [];    // pixel-producing ops this frame, device space
  const counts = Object.create(null);

  const apply = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const mul = (a, b) => [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
  const note = (name) => {
    counts[name] = (counts[name] ?? 0) + 1;
  };
  const emit = (kind, extra) => {
    if (!points.length && kind !== 'rect') return;
    // A raster of the path/rect in device space, plus the paint that filled it.
    // Rounded so sub-pixel noise cannot make two identical frames differ.
    const r = (n) => Math.round(n * 100) / 100;
    ops.push({
      kind,
      // The paint that actually filled/stroked this path. Only `fillRect` used
      // to record it, so a `fill()` path -- which is how most of the drawn
      // line-work is painted -- came back as `null` and a test (or a render
      // replay) had no colour to reason about.
      paint: String(kind === 'stroke' ? state.strokeStyle : state.fillStyle),
      alpha: r(state.globalAlpha),
      pts: points.map(([x, y]) => [r(x), r(y)]),
      // The transform in force when the pixels were emitted, rounded to the
      // resolution a float comparison actually needs. `pts` alone cannot answer
      // "was this shape rotated": device points describe WHERE a shape landed,
      // not how the frame was oriented when it was laid down. The off-diagonal
      // terms `m[1]`/`m[2]` are exactly the rotation/shear, so an
      // axis-alignment invariant reads them and nothing else.
      m: m.slice(),
      ...extra,
    });
  };

  const ctx = {
    get canvas() {
      return { width, height };
    },
    // --- state -------------------------------------------------------------
    save() {
      stack.push({ m: m.slice(), s: { ...state } });
      note('save');
    },
    restore() {
      const top = stack.pop();
      if (top) {
        m = top.m;
        Object.assign(state, top.s);
      }
      note('restore');
    },
    setTransform(a, b, c, d, e, f) {
      m = [a, b, c, d, e, f];
    },
    resetTransform() {
      m = [1, 0, 0, 1, 0, 0];
    },
    transform(a, b, c, d, e, f) {
      m = mul(m, [a, b, c, d, e, f]);
    },
    translate(x, y) {
      m = mul(m, [1, 0, 0, 1, x, y]);
    },
    scale(x, y) {
      m = mul(m, [x, 0, 0, y, 0, 0]);
    },
    rotate(a) {
      const cos = Math.cos(a), sin = Math.sin(a);
      m = mul(m, [cos, sin, -sin, cos, 0, 0]);
    },
    // --- path --------------------------------------------------------------
    beginPath() {
      points.length = 0;
      note('beginPath');
    },
    moveTo(x, y) {
      points.push(apply(x, y));
    },
    lineTo(x, y) {
      points.push(apply(x, y));
    },
    quadraticCurveTo(cx, cy, x, y) {
      points.push(apply(cx, cy), apply(x, y));
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      points.push(apply(c1x, c1y), apply(c2x, c2y), apply(x, y));
    },
    arc(x, y, r, a0, a1) {
      // Sample the arc so its device-space extent is comparable between frames.
      const p = apply(x, y), s = Math.hypot(m[0], m[1]) * r;
      points.push([p[0] - s, p[1] - s], [p[0] + s, p[1] + s]);
    },
    ellipse(x, y, rx, ry) {
      const p = apply(x, y);
      points.push([p[0] - rx, p[1] - ry], [p[0] + rx, p[1] + ry]);
    },
    rect(x, y, w, h) {
      points.push(apply(x, y), apply(x + w, y + h));
    },
    roundRect(x, y, w, h) {
      points.push(apply(x, y), apply(x + w, y + h));
    },
    closePath() {},
    // --- paint -------------------------------------------------------------
    fill() {
      emit('fill');
      note('fill');
    },
    stroke() {
      emit('stroke');
      note('stroke');
    },
    fillRect(x, y, w, h) {
      points.length = 0;
      points.push(apply(x, y), apply(x + w, y + h));
      emit('rect', { paint: String(state.fillStyle) });
      note('fillRect');
    },
    strokeRect(x, y, w, h) {
      points.length = 0;
      points.push(apply(x, y), apply(x + w, y + h));
      emit('strokeRect');
      note('strokeRect');
    },
    fillText(t, x, y) {
      points.length = 0;
      points.push(apply(x, y));
      emit('text', { text: String(t) });
      note('fillText');
    },
    strokeText() {
      note('strokeText');
    },
    drawImage(img, ...a) {
      points.length = 0;
      if (a.length >= 4) points.push(apply(a[0], a[1]), apply(a[0] + a[2], a[1] + a[3]));
      else points.push(apply(a[0] ?? 0, a[1] ?? 0));
      emit('image', { src: img && img.__id });
      note('drawImage');
    },
    // --- no-ops the renderer calls ----------------------------------------
    setLineDash() {},
    clip() {
      note('clip');
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createPattern() {
      return null;
    },
    measureText(t) {
      return { width: String(t).length * 6 };
    },
    getImageData() {
      return { data: new Uint8ClampedArray(4) };
    },
    putImageData() {},
    clearRect() {},
    // --- test surface ------------------------------------------------------
    /** Everything drawn since the last `beginFrame`. */
    __ops: ops,
    __counts: counts,
    /** Device-space matrix, for assertions about transform leakage. */
    __matrix: () => m.slice(),
    __state: state,
    __reset() {
      ops.length = 0;
      points.length = 0;
      for (const k of Object.keys(counts)) delete counts[k];
      stack.length = 0;
      state.globalAlpha = 1;
      state.globalCompositeOperation = 'source-over';
      state.fillStyle = '#000';
      state.strokeStyle = '#000';
      state.lineWidth = 1;
      m = [1, 0, 0, 1, 0, 0];
    },
  };
  // Any property the renderer sets (fillStyle, globalAlpha, ...) lands in
  // `state` and reads back unchanged, which is what a real context does.
  return new Proxy(ctx, {
    get(t, k) {
      if (k in t) return t[k];
      if (k in state) return state[k];
      return undefined;
    },
    set(t, k, v) {
      if (k in t) {
        t[k] = v;
        return true;
      }
      state[k] = v;
      return true;
    },
    has(t, k) {
      return k in t || k in state;
    },
  });
}

/** Install the minimum browser globals a headless renderer needs.
 *
 *  Deliberately tiny and explicit: the renderer's only DOM dependencies are an
 *  offscreen canvas for the grain sheet, a ResizeObserver and devicePixelRatio.
 *  Everything else it touches is the 2D context, which `createRecordingContext`
 *  provides. Stubbing exactly these -- rather than pulling in jsdom -- means a
 *  new DOM dependency fails loudly here instead of silently passing. */
export function installDom({ width = 880, height = 710, dpr = 1 } = {}) {
  const made = [];
  const prev = {
    document: globalThis.document,
    ResizeObserver: globalThis.ResizeObserver,
    devicePixelRatio: globalThis.devicePixelRatio,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  globalThis.document = {
    createElement(tag) {
      if (tag !== 'canvas') return {};
      const surface = makeSurface(1, 1, {});
      made.push(surface);
      return surface;
    },
    documentElement: { style: {} },
  };
  // The renderer only needs observe/disconnect; it resizes synchronously on
  // construction, so the callback never has to fire.
  globalThis.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.devicePixelRatio = dpr;
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  return {
    surfaces: made,
    width,
    height,
    uninstall() {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete globalThis[k];
        else globalThis[k] = v;
      }
    },
  };
}

/** A canvas element the renderer can be constructed against, with recording. */
export function createDisplay(width = 880, height = 710) {
  const ctx = createRecordingContext(width, height);
  const canvas = {
    width,
    height,
    style: {},
    // The renderer annotates the element with its current storyboard scene, so
    // the CSS and the draw share one source. A real element always has `dataset`.
    dataset: {},
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height, right: width, bottom: height }),
  };
  ctx.__vpWidth = width;
  return { canvas, ctx, width, height };
}

/** A signature for one rendered frame: what was painted, where, at what alpha.
 *  Two frames with the same signature are the same image. */
export function frameSignature(ctx) {
  return ctx.__ops
    .map(
      (o) =>
        `${o.kind}:${o.alpha}:${o.paint ?? ''}:` +
        o.pts.map(([x, y]) => `${x},${y}`).join('|') +
        (o.text ? `:${o.text}` : ''),
    )
    .join(';');
}

/** Device-space centre of the largest fill/stroke on the frame that is NOT the
 *  full-screen backdrop. Used to locate the thing the player is chasing. */
export function frameCentroid(ctx) {
  let best = null, area = 0;
  for (const o of ctx.__ops) {
    if (!o.pts.length) continue;
    const xs = o.pts.map((p) => p[0]), ys = o.pts.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const a = w * h;
    if (a > area && w < (ctx.__vpWidth ?? 1e9) * 0.98) {
      area = a;
      best = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, w, h };
    }
  }
  return best;
}
