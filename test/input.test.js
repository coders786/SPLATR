import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

/* ── THE BUFFERED SHOT ──────────────────────────────────────────────────────
 *
 * A dash is refused for reasons the player cannot see -- blade recovery, a
 * hitstop, an edge that has not come back. Before this, a refused shot was
 * simply gone: the player pressed, nothing happened, and their thumb had moved
 * on by the time the game would have taken it.
 */

/** createInput binds a handful of window-level listeners; give it a no-op
 *  window so the module can be exercised without a browser. */
function stubWindow() {
  const prev = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  return () => {
    globalThis.window = prev;
  };
}

/** A canvas stand-in that records the listeners createInput installs. */
function stubCanvas() {
  const on = new Map();
  return {
    style: {},
    hasPointerCapture: () => false,
    releasePointerCapture() {},
    setPointerCapture() {},
    addEventListener: (k, fn) => on.set(k, fn),
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  };
}

function rig(accept) {
  const restore = stubWindow();
  const canvas = stubCanvas(),
    committed = [];
  const input = createInput(canvas, {
    get: () => null,
    active: () => true,
    point: () => ({ x: 0, y: 0 }),
    assist: () => ({ corridor: 1 }),
    engage() {},
    lock: { once: null, at: -1e9, tick() {} },
    commit(v) {
      if (!accept()) return false;
      committed.push(v);
      return true;
    },
  });
  return { input, committed, restore };
}

test('a refused shot is remembered and fires the moment it becomes legal', () => {
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  input.fire({ x: 3, y: -9, power: 0.5 });
  assert.equal(committed.length, 0, 'refused while the game will not take it');
  ok = true;
  input.retry();
  assert.equal(committed.length, 1, 'the same shot fires once the game accepts it');
  assert.deepEqual(committed[0], { x: 3, y: -9, power: 0.5 });
  input.retry();
  assert.equal(committed.length, 1, 'and it fires exactly once');
  restore();
});

test('a buffered shot expires instead of firing late', () => {
  // The window is human reaction time, not a queue. A shot that lands half a
  // second after the player asked for it is aimed at a field that has moved.
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  const realNow = performance.now;
  try {
    let t = 1000;
    performance.now = () => t;
    input.fire({ x: 0, y: -10, power: 0.5 });
    t += 400; // well past the 140ms window
    ok = true;
    input.retry();
    assert.equal(committed.length, 0, 'a stale shot is dropped, not fired late');
    input.retry();
    assert.equal(committed.length, 0, 'and it never comes back');
  } finally {
    performance.now = realNow;
    restore();
  }
});

test('reset drops a buffered shot so it cannot leak into the next run', () => {
  let ok = false;
  const { input, committed, restore } = rig(() => ok);
  input.fire({ x: 1, y: -1, power: 0.4 });
  input.reset();
  ok = true;
  input.retry();
  assert.equal(committed.length, 0, 'a new run must not inherit the last run\'s aim');
  restore();
});

test('an accepted shot leaves nothing buffered', () => {
  const { input, committed, restore } = rig(() => true);
  input.fire({ x: 2, y: -8, power: 0.6 });
  assert.equal(committed.length, 1);
  input.retry();
  assert.equal(committed.length, 1, 'retry has nothing to do');
  restore();
});

test('cancel drops a refused release and invalid vectors never reach commit',()=>{
 let ok=false;const {input,committed,restore}=rig(()=>ok);
 try{input.fire({x:1,y:-5,power:.7});input.cancel();ok=true;input.retry();
 for(const v of [null,undefined,{x:NaN,y:2,power:1},{x:1,y:2,power:0}])input.fire(v);
 assert.equal(committed.length,0);}finally{restore();}
});

function gestureRig(){
 const previous=globalThis.window,events=new Map(),canvasEvents=new Map(),shots=[];
 globalThis.window={addEventListener:(k,f)=>events.set(k,f)};
 const run={focus(){},world:{player:{position:{x:0,y:0}}},combat:{enemies:new Map()},aimAt:()=>({x:0,y:-25,power:.8}),adjust:v=>v};
 const canvas={style:{},clientWidth:800,clientHeight:600,focus(){},hasPointerCapture:()=>false,setPointerCapture(){},releasePointerCapture(){},addEventListener:(k,f)=>canvasEvents.set(k,f)};
 let accepting=true;
 const input=createInput(canvas,{get:()=>run,active:()=>true,point:(x,y)=>({x,y}),assist:()=>false,engage(){},commit:v=>{if(!accepting)return false;shots.push(v);return true;},lock:{tick(){}}});
 const ev=(x,y)=>({isPrimary:true,pointerId:1,pointerType:'touch',button:0,clientX:x,clientY:y,preventDefault(){}});
 return {input,shots,events,canvasEvents,ev,accept:v=>accepting=v,restore:()=>globalThis.window=previous};
}
test('dragging back to the origin cancels rather than firing an accidental tap',()=>{
 const r=gestureRig();try{
 r.canvasEvents.get('pointerdown')(r.ev(100,100));r.events.get('pointermove')(r.ev(150,160));assert.ok(r.input.aim);
 r.events.get('pointermove')(r.ev(102,102));assert.equal(r.input.aim,null);
 r.events.get('pointerup')(r.ev(102,102));assert.equal(r.shots.length,0);
 }finally{r.restore();}
});
test('new pointer intent replaces refused shot; capture loss and blur never fire',()=>{
 const r=gestureRig();try{
 r.accept(false);r.input.fire({x:10,y:-20,power:.8});r.canvasEvents.get('pointerdown')(r.ev(100,100));r.accept(true);r.input.retry();assert.equal(r.shots.length,0);
 r.canvasEvents.get('lostpointercapture')(r.ev(100,100));r.events.get('pointerup')(r.ev(160,180));assert.equal(r.shots.length,0);
 r.canvasEvents.get('pointerdown')(r.ev(100,100));r.events.get('blur')();r.events.get('pointerup')(r.ev(160,180));assert.equal(r.shots.length,0);
 }finally{r.restore();}
});
test('displayed pointer aim is the actual release vector and fires only once',()=>{
 const r=gestureRig();try{
 r.canvasEvents.get('pointerdown')(r.ev(100,100));r.events.get('pointermove')(r.ev(130,180));const aim=r.input.aim;
 r.events.get('pointerup')(r.ev(130,180));r.events.get('pointerup')(r.ev(130,180));
 assert.equal(r.shots.length,1);assert.deepEqual(r.shots[0],aim);assert.ok(aim.y<0,'pull down launches forward/up');
 }finally{r.restore();}
});


test('pull-back aim reverses all eight drag directions in preview and release',()=>{
 for(const [dx,dy] of [[-80,0],[80,0],[0,-80],[0,80],[-60,-60],[-60,60],[60,-60],[60,60]]){
  const r=gestureRig();try{
   r.canvasEvents.get('pointerdown')(r.ev(200,200));r.events.get('pointermove')(r.ev(200+dx,200+dy));const shown=r.input.aim;
   assert.equal(Math.sign(shown.x)||0,(-Math.sign(dx))||0,`preview x ${dx},${dy}`);assert.equal(Math.sign(shown.y)||0,(-Math.sign(dy))||0,`preview y ${dx},${dy}`);
   r.events.get('pointerup')(r.ev(200+dx,200+dy));assert.equal(r.shots.length,1);assert.deepEqual(r.shots[0],shown);
  }finally{r.restore();}
 }
});

test('dispose removes every owned listener, cancels buffered inputs and is idempotent across repeated practice visits',()=>{
 const previous=globalThis.window;const target=()=>{const entries=new Map();return {entries,addEventListener(type,fn){if(!entries.has(type))entries.set(type,new Set());entries.get(type).add(fn);},removeEventListener(type,fn){entries.get(type)?.delete(fn);}};};
 const w=target();globalThis.window=w;let commits=0;
 try{for(let i=0;i<12;i++){
 const c={...target(),style:{},hasPointerCapture:()=>false,releasePointerCapture(){}};
 const input=createInput(c,{get:()=>null,active:()=>true,point:()=>({x:0,y:0}),assist:()=>false,engage(){},lock:{once:null,tick(){}},commit(){commits++;return false;}});
 input.fire({x:30,y:0,power:1});assert.equal(commits,i+1);input.dispose();input.dispose();input.retry();input.fire({x:30,y:0,power:1});assert.equal(commits,i+1);
 assert.ok([...c.entries.values()].every(set=>set.size===0));assert.ok([...w.entries.values()].every(set=>set.size===0));
 }}finally{globalThis.window=previous;}
});
test('sub-threshold pointer jitter is always a target tap, never a weak drag',()=>{
 // The deadzone is 8px screen space (CHUNK 2): 6.7px of jitter is a tap.
 const r=gestureRig();try{r.canvasEvents.get('pointerdown')(r.ev(100,100));r.events.get('pointermove')(r.ev(106,103));assert.deepEqual(r.input.aim,{x:0,y:-25,power:.8,lock:null,anchor:{x:100,y:100}});r.events.get('pointerup')(r.ev(106,103));assert.equal(r.shots.length,1);assert.equal(r.shots[0].x,0);assert.equal(r.shots[0].y,-25);}finally{r.restore();}
});

test('short intentional pulls have a visible launch floor in every direction',()=>{
 for(const [dx,dy]of [[14,0],[-14,0],[0,14],[0,-14],[10,10]]){const r=gestureRig();try{
 r.canvasEvents.get('pointerdown')(r.ev(200,200));r.events.get('pointermove')(r.ev(200+dx,200+dy));const preview=r.input.aim;
 r.events.get('pointerup')(r.ev(200+dx,200+dy));assert.equal(r.shots.length,1);assert.deepEqual(r.shots[0],preview);assert.ok(Math.hypot(preview.x,preview.y)>=11,'short pull is not swallowed by friction');assert.ok(preview.x*dx+preview.y*dy<0);
 }finally{r.restore();}}
});

test('release just below acquisition remains a pull, not a dropped shot or target tap',()=>{
 for(const type of ['touch']){const r=gestureRig(),ev=(x,y)=>({...r.ev(x,y),pointerType:type});try{
 r.canvasEvents.get('pointerdown')(ev(200,200));r.events.get('pointermove')(ev(200,224));r.events.get('pointermove')(ev(200,213));const preview=r.input.aim;
 assert.ok(preview&&preview.y<0);r.events.get('pointerup')(ev(200,213));assert.equal(r.shots.length,1);assert.deepEqual(r.shots[0],preview);assert.ok(Math.hypot(preview.x,preview.y)>=11);
 }finally{r.restore();}}
});
