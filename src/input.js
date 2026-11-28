import {dragArrowVisual,pointerVisual} from './art/splatr-art-engine.js';
import {MOUSE_AIM,mousePull,mousePoint} from './mouse-control.js';
import { MAX_SPEED } from './physics.js';
import {beginPull,movePull,resolvePull} from './pull-control.js';
import { clamp } from './levels.js';
import { magnetize } from './aim.js';

/** One captured primary pointer. Direct or slingshot mode is fixed on press.
 * Drawing,
 * release and the ballistic preview all use the same committed vector. */
export function createInput(canvas, { get, active, point, assist, engage, commit, lock, aimMode = () => 'direct', onPointerMove = null }) {
  const listeners=[];let disposed=false;
  const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener?.(type,handler,options));};
  const enabled=()=>!disposed&&active();
  // A deliberately marked escape must not magnetise back toward the Rift.
  const aimAssist=()=>assist()&&!(get()?.state?.visualTutorial?.stage===2&&!get()?.state?.visualTutorial?.dodged&&get()?.state?.visualTutorial?.guide?.kind==='dodge');
  const overlay=canvas.ownerDocument?.createElementNS('http://www.w3.org/2000/svg','svg');
  if(overlay){overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100;display:none;overflow:visible';overlay.innerHTML='<circle fill="none" stroke-width="1.5"/><text class="mouse-power" text-anchor="middle" fill="#e6ecc6" stroke="#151a25" stroke-width="3" paint-order="stroke" font-family="monospace" font-size="10"/><g class="pointer-origin"><path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g><g class="drag-design"><path class="drag-tether" fill="none" stroke="#aaa0b5" stroke-width="1.2" stroke-dasharray="3 5"/><path class="drag-shaft" stroke="#15121e" stroke-width="1.2"/><path class="drag-head" stroke="#15121e" stroke-width="1.2"/><path class="drag-accent" fill="none" stroke-width="1.2"/></g>';canvas.parentElement?.append(overlay);}
  function showGesture(){if(!overlay||!pointer)return;
   if(pointer.type!=='touch'||pointer.mode==='direct'){
    const aim=pointerAim(),ring=overlay.querySelector('circle'),origin=overlay.querySelector('.pointer-origin'),group=overlay.querySelector('.drag-design');
    const direct=pointer.mode==='direct',x=direct?pointer.toX:pointer.x,y=direct?pointer.toY:pointer.y,power=aim?.power||0;
    const hint=overlay.querySelector('.mouse-power');hint.style.display='';hint.setAttribute('x',x);hint.setAttribute('y',y+30);hint.textContent=direct?(!power&&pointer.dragged?'CANCEL':pointer.directByShift?'SHIFT · RELEASE':'RELEASE TO SLASH'):power?`${Math.round(power*100)}% · RELEASE`:'PULL BACK';
    overlay.style.display='block';overlay.dataset.control=pointer.type==='touch'?'touch':'mouse';overlay.dataset.mode=pointer.mode;overlay.dataset.power=String(power);
    ring.setAttribute('cx',x);ring.setAttribute('cy',y);ring.setAttribute('r',direct?10:MOUSE_AIM.deadZone+power*6);ring.setAttribute('stroke',power?'#d7e8ac':'#a99abb');
    const mark=pointerVisual({equipment:get()?.state?.equipment||{},power});overlay.dataset.pointer=mark.id;origin.setAttribute('transform',`translate(${x} ${y})`);origin.firstElementChild.setAttribute('d',mark.path);origin.firstElementChild.setAttribute('stroke',mark.color);
    group.style.display=power?'':'none';if(!power)return;
    const design=dragArrowVisual({dx:aim.x,dy:aim.y,power,equipment:get()?.state?.equipment||{},sword:get()?.state?.sword});
    overlay.dataset.element=design.element;group.setAttribute('transform',`translate(${x} ${y}) rotate(${design.angle*180/Math.PI})`);
    // The tether follows the actual cursor, not a fabricated opposite endpoint.
    const angle=design.angle,dx=pointer.toX-x,dy=pointer.toY-y;
    overlay.querySelector('.drag-tether').setAttribute('d',direct?'':`M ${dx*Math.cos(angle)+dy*Math.sin(angle)} ${-dx*Math.sin(angle)+dy*Math.cos(angle)} Q -16 ${12*power} 0 0`);
    for(const [name,path]of [['shaft',design.shaftPath],['head',design.headPath],['accent',design.accentPath]]){const node=overlay.querySelector('.drag-'+name);node.setAttribute('d',path);node.setAttribute(name==='accent'?'stroke':'fill',name==='accent'?design.light:design.color);}return;
   }
   overlay.dataset.control='touch';overlay.querySelector('.mouse-power').style.display='none';
   const {gesture:g,vector}=resolvePull(pointer),ring=overlay.querySelector('circle'),group=overlay.querySelector('.drag-design');overlay.style.display='block';
   const actual=g.kind==='pull'?pointerAim():null;
   const design=dragArrowVisual({dx:actual?.x??g.dx,dy:actual?.y??g.dy,power:actual?.power??vector?.power??0,equipment:get()?.state?.equipment||{},sword:get()?.state?.sword});overlay.dataset.element=design.element;
   const mark=pointerVisual({equipment:get()?.state?.equipment||{},power:vector?.power||0,cancel:g.kind==='cancel'}),origin=overlay.querySelector('.pointer-origin');overlay.dataset.pointer=mark.id;origin.setAttribute('transform',`translate(${pointer.x} ${pointer.y})`);origin.firstElementChild.setAttribute('d',mark.path);origin.firstElementChild.setAttribute('stroke',mark.color);
   ring.setAttribute('cx',pointer.x);ring.setAttribute('cy',pointer.y);ring.setAttribute('r',g.dragged?g.cancelRadius:g.slop);ring.setAttribute('stroke',g.kind==='cancel'?'#ee8d93':g.kind==='pull'?design.color:'#bcb2cc');
   group.style.display=g.kind==='pull'?'':'none';if(g.kind!=='pull')return;
   group.setAttribute('transform',`translate(${pointer.x} ${pointer.y}) rotate(${design.angle*180/Math.PI})`);
   const tether=overlay.querySelector('.drag-tether');tether.setAttribute('d',`M ${-Math.hypot(g.dx,g.dy)} 0 L 0 0`);
   for(const [name,path]of [['shaft',design.shaftPath],['head',design.headPath],['accent',design.accentPath]]){const node=overlay.querySelector('.drag-'+name);node.setAttribute('d',path);node.setAttribute(name==='accent'?'stroke':'fill',name==='accent'?design.light:design.color);}
  }

  let pointer = null,
    pointerShot = null,
    keyboard = null,
    last = null,
    shift = false;
  const keys = new Set();
  function cancel() {
    buffered = null;
    get()?.cancelBufferedDash?.();
    const old = pointer;
    pointer = keyboard = null;
    pointerShot = null;
    shift = false;
    keys.clear();
    if (old && canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id);
    get()?.focus(false);
    canvas.style.cursor = '';if(overlay)overlay.style.display='none';
  }
  /**
   * The last shot the player asked for that the game refused.
   *
   * A dash is rejected for reasons the player cannot see: the blade is still in
   * its recovery window, a hitstop is running, the edge has not come back yet.
   * From the player's side that is a dropped input -- they pressed, nothing
   * happened, and by the time the game would have accepted it their thumb is
   * somewhere else.
   *
   * So a refused shot is REMEMBERED for a short window and retried the moment
   * the game will take it. It is not queued beyond that: buffering everything
   * turns the game into a rhythm game that plays itself, and a shot aimed at a
   * shape that has since moved is worse than no shot.
   *
   * The window is wall-clock milliseconds, not ticks, because it is a statement
   * about HUMAN reaction time and must not stretch when the game slows down.
   */
  const BUFFER_MS = 120; // wall-clock input buffer, independent of slow motion
  let buffered = null;
  function fire(v) {
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.power) || v.power <= 0) { cancel(); return; }
    if (!('lock' in v)) v = magnetic(v, true);
    cancel();
    if (!enabled()) return;
    if (commit(v)) {
      last = { x: v.x, y: v.y, power: v.power };
      buffered = null;
      return;
    }
    buffered = { v: { x: v.x, y: v.y, power: v.power }, at: performance.now() };
  }
  /** Called once per frame by the run loop. Fires a buffered shot the moment it
   *  becomes legal, and drops it once the window has passed. */
  function retry() {
    if (!buffered) return;
    if (performance.now() - buffered.at > BUFFER_MS) {
      buffered = null;
      return;
    }
    if (!enabled()) return void (buffered = null);
    const v = buffered.v;
    if (commit(v)) {
      buffered = null;
      last = { x: v.x, y: v.y, power: v.power };
    }
  }
  function acquire(next) {
    if (next?.lock?.id === lock.once) return;
    lock.once = next?.lock?.id ?? null;
    if (next?.lock) lock.tick();
  }
  // The magnet lives in the input so the vector that is DRAWN is the vector
  // that is fired. It only bends the impulse; the blade still has to sweep
  // the target, and the corridor still respects a nearer plate.
  function magnetic(v, focus) {
    const r = get();
    if (!v?.power || !aimAssist() || !r) return v ? {...v,lock:null} : v;
    // One corridor answer for this run: it widens with tempo, and a held aim
    // widens it further. The vector that is drawn is the vector that fires.
    const out = magnetize(r.world.player.position, v, r.combat, {
      focus,
      corridor: r.assist({ focus }).corridor,
    });
    acquire(out); // one tick per acquisition, not per pointermove
    return out;
  }
  function calculatePointerAim() {
    const r = get(), p = pointer;
    if (!r || !p) return null;
    if(p.mode==='direct'){
      if(resolvePull(p).gesture.kind==='cancel')return null;
      const local=mousePoint(p),world=point(local.x,local.y);
      if(!world||![world.x,world.y].every(Number.isFinite))return null;
      return {...magnetic(r.aimAt(world,aimAssist(),MAX_SPEED),true),control:'direct'};
    }
    if(p.type!=='touch'){
      const vector=mousePull(p);if(!vector)return null;
      return {...magnetic(r.adjust(vector,aimAssist()),true),anchor:{...p.world},control:'pull'};
    }
    const {gesture,vector}=resolvePull(p);
    if(gesture.kind==='cancel')return null;
    const v=vector||{x:0,y:0,power:0};
    // While a finger is down the cube is in focus, which also
    // widens the corridor a little: an intentional aim is a declared shot.
    if (v.power) {
      const shot = magnetic(r.adjust(v, aimAssist()), true);
      // The tether is pinned to the WORLD point that was under the press. A
      // display-space anchor would drift off-screen as the lens widens during
      // a held aim, drawing a tether to nowhere.
      shot.anchor = { x: p.world.x, y: p.world.y };
      return shot;
    }
    const e = r.combat.enemies.get(p.target),
      aimed = magnetic(r.aimAt(e || p.world, !!e), true);
    aimed.anchor = { x: p.world.x, y: p.world.y };
    return aimed;
  }
  // The line the player sees is the line that will be fired. Sample assist
  // only when the pointer actually moves, not every render/tick as enemies and
  // the camera move underneath a stationary finger or mouse.
  function pointerAim() { return pointerShot; }
  function updatePointer(x, y) {
    if (!pointer || (pointer.toX === x && pointer.toY === y)) return;
    pointer=movePull(pointer,x,y);
    pointerShot=calculatePointerAim();
  }
  listen(canvas, 'pointerdown', (e) => {
    if(enabled()&&pointer&&e.button===2){e.preventDefault();cancel();return;}
    if (!enabled() || pointer || !e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    engage(e.pointerType==='touch'?'touch':'mouse');
    buffered = null;
    get()?.cancelBufferedDash?.();
    keyboard = null;
    shift = false;
    keys.clear();
    // ── CHUNK 2: CSS-TO-CANVAS SCALED POINTER MATH ───────────────────────
    // The canvas may be displayed at a different size than its layout box, and
    // it is almost never at (0,0) on the page. Measure both ONCE per press and
    // scale every client pixel by the same factor. The drag vector, the world
    // anchor and the aim target are all computed from canvas-local coordinates
    // — never raw e.clientX / e.clientY, never a world coordinate that shifts
    // under a camera pan or the 1.3x arena zoom.
    const rect = canvas.getBoundingClientRect?.() ?? { left: 0, top: 0, width: canvas.clientWidth || 800, height: canvas.clientHeight || 600 };
    const cssW = canvas.clientWidth || rect.width || 1, cssH = canvas.clientHeight || rect.height || 1;
    const scaleX = rect.width > 0 ? cssW / rect.width : 1, scaleY = rect.height > 0 ? cssH / rect.height : 1;
    const localX = (e.clientX - rect.left) * scaleX, localY = (e.clientY - rect.top) * scaleY;
    const travel = clamp(Math.min(cssW, cssH) * 0.215, 62, 150),
      world = point(localX, localY);
    const r = get();
    pointer = beginPull({
      type:e.pointerType||'mouse',
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      toX: e.clientX,
      toY: e.clientY,
      scaleX,
      scaleY,
      travel,
      mode:e.shiftKey?'direct':aimMode()==='direct'?'direct':'pull',directByShift:!!e.shiftKey,left:rect.left,top:rect.top,
      world,
      target: e.pointerType==='touch'?r.aimAt(world, aimAssist()).target:null,
    });
    pointerShot=calculatePointerAim();
    showGesture();
    try { canvas.setPointerCapture?.(e.pointerId); } catch { /* capture is a convenience, never a requirement */ }
    canvas.style.cursor = e.pointerType==='touch'?'grabbing':e.shiftKey?'crosshair':'grab';
    r.focus(true);
  });
  listen(window, 'pointermove', (e) => {
    // Additional mouse buttons arrive as pointermove while LMB is captured.
    if(pointer&&pointer.type!=='touch'&&(e.buttons&2)){e.preventDefault();cancel();return;}
    // CHUNK 1: the shell owns the drawn reticle (the OS cursor is hidden over
    // the arena), so every move is reported — not only the ones that belong to
    // a captured pull. Canvas-local CSS px, the same space the ring is drawn in.
    if (onPointerMove) {
      const box = canvas.getBoundingClientRect();
      onPointerMove({ x: e.clientX - box.left, y: e.clientY - box.top, type: e.pointerType || 'mouse' });
    }
    if (pointer?.id === e.pointerId) {
      updatePointer(e.clientX,e.clientY);
      showGesture();
    }
  },true);
  // CHUNK 2: the off-canvas release safety net. An up/cancel that is NOT on
  // the canvas still reaches this window-level handler, so a fast drag that
  // ends over the HUD, outside the element, or mid capture-loss always runs
  // the same release path: no stuck aim, no "holding" state that never ends.
  listen(window, 'pointerup', (e) => {
    if (pointer?.id !== e.pointerId || e.button!==0) return;
    if (!enabled()) {
      cancel();
      return;
    }
    updatePointer(e.clientX,e.clientY);
    fire(pointerAim());
  },true);
  for (const name of ['lostpointercapture', 'pointercancel']) {
    listen(canvas, name, (e) => {
      if (pointer?.id === e.pointerId) cancel();
    });
    listen(window, name, (e) => {
      if (pointer?.id === e.pointerId) cancel();
    }, true);
  }
  listen(canvas, 'contextmenu', (e) => {e.preventDefault();if(pointer&&pointer.type!=='touch')cancel();});
  // Browser chrome and mobile keyboards can resize the viewport mid-gesture.
  // The press coordinates are already captured in screen space: keep the
  // gesture alive across resize instead of silently discarding the drag.
  listen(window, 'orientationchange', cancel);
  listen(window, 'blur', cancel);
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
      keyboard = magnetic(
        get().adjust({ x: (x / n) * MAX_SPEED, y: (y / n) * MAX_SPEED, power: 1 }, aimAssist()),
        !!shift,
      );
  }
  listen(window, 'keydown', (e) => {
    if(enabled()&&pointer&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation?.();cancel();return;}
    if (!enabled() || e.target?.closest?.('button') || pointer || e.altKey || e.ctrlKey || e.metaKey)
      return;
    const k = e.key.toLowerCase(),
      r = get();
    if (dirs[k]) {
      if(!e.repeat){buffered=null;engage('keys');}
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
      buffered = null;
      shift = true;
      engage('keys');
      r.focus(true);
      keyboard = keyboard || last || r.suggestion();
    }
  });
  listen(window, 'keyup', (e) => {
    const k=e.key.toLowerCase();
    keys.delete(k);
    if (dirs[k] && !shift) { keyboard=null; if(enabled() && keys.size) direction(); }
    if (e.key === 'Shift' && shift) {
      shift = false;
      get()?.focus(false);
    }
  });
  return {
    get engaged() { return !!(pointer || keyboard); },
    get aim() {
      return pointer ? pointerAim() : keyboard;
    },
    /** The live magnet decision for a vector, without firing it. Exposed so
     *  the renderer, camera and the headless tests can read the same answer. */
    preview(v) {
      const r = get();
      return v?.power ? magnetic(v, true) : v;
    },
    tick() {
      if(pointer&&enabled()){
        // A press can begin on the floor or during a short stun. Keep the
        // same gesture and activate focus once flight/control becomes legal.
        const run=get();
        if(run?.state && !run.state.held) run.focus(true);
        showGesture();
      }
      if (!shift || !keyboard || !enabled()) return;
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
      lock.once = null;
      // A buffered shot must not survive into a new run or a new pause: it was
      // aimed at a field that no longer exists.
      buffered = null;
      cancel();
    },
    /** Called once per frame. See BUFFER_MS. */
    retry,
    dispose(){if(disposed)return;cancel();disposed=true;for(const remove of listeners)remove();listeners.length=0;overlay?.remove();},
    /** Exposed for tests: the same entry point a release uses. */
    fire,
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
