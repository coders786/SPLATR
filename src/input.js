import { MAX_PULL, MAX_SPEED, dragVector } from './physics.js';
import { clamp } from './levels.js';

/** Exactly one captured primary pointer. A hold remembers what was under the
 * finger at press, so camera motion doesn't steal a target before release.
 * A pull is relative to that press in display pixels, independent of zoom. */
export function createInput(canvas, { get, active, point, assist, engage, commit }) {
  let pointer = null,
    keyboard = null,
    last = null,
    shift = false;
  const keys = new Set();
  function cancel() {
    const old = pointer;
    pointer = keyboard = null;
    shift = false;
    keys.clear();
    if (old && canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id);
    get()?.focus(false);
    canvas.style.cursor = '';
  }
  function fire(v) {
    cancel();
    if (active() && commit(v)) last = { x: v.x, y: v.y, power: v.power };
  }
  function pointerAim() {
    const r = get(),
      p = pointer,
      v = dragVector({ x: 0, y: 0 }, { x: (p.toX - p.x) * p.gain, y: (p.toY - p.y) * p.gain });
    if (v.power) return r.adjust(v, assist());
    const e = r.combat.enemies.get(p.target);
    return r.aimAt(e || p.world, !!e);
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (!active() || pointer || !e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    engage(e.pointerType==='touch'?'touch':'mouse');
    keyboard = null;
    shift = false;
    keys.clear();
    const travel = clamp(Math.min(canvas.clientWidth, canvas.clientHeight) * 0.215, 62, 150),
      world = point(e.clientX, e.clientY);
    const r = get();
    pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      toX: e.clientX,
      toY: e.clientY,
      gain: MAX_PULL / travel,
      world,
      target: r.aimAt(world, assist()).target,
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    r.focus(true);
  });
  window.addEventListener('pointermove', (e) => {
    if (pointer?.id === e.pointerId) {
      pointer.toX = e.clientX;
      pointer.toY = e.clientY;
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (pointer?.id !== e.pointerId) return;
    if (!active()) {
      cancel();
      return;
    }
    pointer.toX = e.clientX;
    pointer.toY = e.clientY;
    fire(pointerAim());
  });
  for (const name of ['lostpointercapture', 'pointercancel'])
    canvas.addEventListener(name, (e) => {
      if (pointer?.id === e.pointerId) cancel();
    });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('orientationchange', cancel);
  // Eight directions or fine steering in focus. Only the first un-aimed Space
  // suggests a cut in the field. On the paper racks Space follows the sight.
  const dirs = {
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0],
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
  };
  function direction() {
    let x = 0,
      y = 0;
    for (const k of keys) {
      x += dirs[k][0];
      y += dirs[k][1];
    }
    const n = Math.hypot(x, y);
    if (n)
      keyboard = get().adjust(
        { x: (x / n) * MAX_SPEED, y: (y / n) * MAX_SPEED, power: 1 },
        assist(),
      );
  }
  window.addEventListener('keydown', (e) => {
    if (!active() || e.target?.closest?.('button') || pointer || e.altKey || e.ctrlKey || e.metaKey)
      return;
    const k = e.key.toLowerCase(),
      r = get();
    if (dirs[k]) {
      if(!e.repeat)engage('keys');
      keys.add(k);
      e.preventDefault();
      if (!shift) direction();
    } else if (k === ' ') {
      e.preventDefault();
      if (!e.repeat) {
        engage('keys');
        fire(
          keyboard ||
            (r.state.opening || r.state.phase === 'ready' ? null : last) ||
            r.suggestion(),
        );
      }
    } else if (k === 'shift' && !e.repeat) {
      e.preventDefault();
      shift = true;
      engage('keys');
      r.focus(true);
      keyboard = keyboard || last || r.suggestion();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === 'Shift' && shift) {
      shift = false;
      get()?.focus(false);
    }
  });
  return {
    get aim() {
      return pointer ? pointerAim() : keyboard;
    },
    tick() {
      if (!shift || !keyboard || !active()) return;
      const turn =
        Number(keys.has('d') || keys.has('arrowright')) -
        Number(keys.has('a') || keys.has('arrowleft'));
      if (!turn) return;
      const a = Math.atan2(keyboard.y, keyboard.x) + turn * 0.042,
        speed = Math.hypot(keyboard.x, keyboard.y);
      keyboard = { x: Math.cos(a) * speed, y: Math.sin(a) * speed, power: speed / MAX_SPEED };
    },
    cancel,
    reset() {
      last = null;
      cancel();
    },
  };
}

/** Gameplay swipes can suppress the next compatibility mouse-click on touch
 * browsers. Activate a genuine stationary button tap at touchend instead.
 * Leave mouse, keyboard, AT click and scrolling to the native controls. */
export function enableMenuTaps() {
  let press = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      const button = e.target.closest?.('button');
      press = null;
      if (!button || button.disabled || e.touches.length !== 1) return;
      const t = e.touches[0];
      press = { button, id: t.identifier, x: t.clientX, y: t.clientY };
    },
    { passive: true },
  );
  const moved = (t) => Math.hypot(t.clientX - press.x, t.clientY - press.y) > 9;
  document.addEventListener(
    'touchmove',
    (e) => {
      if (press && (e.touches.length !== 1 || moved(e.touches[0]))) press = null;
    },
    { passive: true },
  );
  document.addEventListener(
    'touchend',
    (e) => {
      if (!press) return;
      const t = Array.from(e.changedTouches).find((t) => t.identifier === press.id),
        { button } = press;
      const tap =
        t &&
        !e.touches.length &&
        !moved(t) &&
        e.cancelable &&
        !button.disabled &&
        button.contains(document.elementFromPoint(t.clientX, t.clientY));
      press = null;
      if (tap) {
        e.preventDefault();
        button.focus({ preventScroll: true });
        button.click();
      }
    },
    { passive: false },
  );
  const cancel = () => {
    press = null;
  };
  document.addEventListener('touchcancel', cancel, { passive: true });
  window.addEventListener('blur', cancel);
}
