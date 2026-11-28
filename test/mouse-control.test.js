import test from 'node:test';import assert from 'node:assert/strict';
import {createInput} from '../src/input.js';import {mousePull,mousePoint,MOUSE_AIM} from '../src/mouse-control.js';import {createRun} from '../src/run.js';import {placePlayer,stopPlayer} from '../src/physics.js';
function rig(mode='pull'){const previous=globalThis.window,oldNow=performance.now,events=new Map(),on=new Map(),shots=[];let now=1000,cam={x:0,y:0},active=true,cancelled=0;performance.now=()=>now;globalThis.window={addEventListener:(k,v)=>events.set(k,v),removeEventListener(){}};
 const run={state:{},world:{player:{position:{x:0,y:0}}},combat:{enemies:new Map()},focus(){},cancelBufferedDash(){cancelled++;},aimAt(q,a,speed=31.7){const n=Math.hypot(q.x,q.y)||1;return {x:q.x/n*speed,y:q.y/n*speed,power:speed/42};},adjust(v){return {...v};}};
 const canvas={style:{},clientWidth:800,clientHeight:600,focus(){},getBoundingClientRect:()=>({left:40,top:60,width:400,height:300}),hasPointerCapture:()=>false,setPointerCapture(){},releasePointerCapture(){},addEventListener:(k,v)=>on.set(k,v),removeEventListener(){}};
 const input=createInput(canvas,{get:()=>run,active:()=>active,point:(x,y)=>({x:x+cam.x,y:y+cam.y}),assist:()=>false,aimMode:()=>mode,engage(){},lock:{tick(){}},commit(v){shots.push(v);return true;}});
 const ev=(x,y,extra={})=>({clientX:x,clientY:y,pointerId:1,pointerType:'mouse',isPrimary:true,button:0,preventDefault(){},...extra});return{input,run,on,events,shots,ev,time:t=>now=t,camera:p=>cam=p,active:v=>active=v,cancelled:()=>cancelled,restore(){input.dispose();performance.now=oldNow;globalThis.window=previous;}};}
test('spring power starts continuously at zero, saturates and never depends on hold time',()=>{
 assert.ok(Object.isFrozen(MOUSE_AIM));let last=0;
 for(let d=0;d<=250;d+=.25){const v=mousePull({x:0,y:0,toX:d,toY:0,travel:120});const p=v?.power||0;assert.ok(p>=last&&p<=1);if(d<=6)assert.equal(v,null);else assert.ok(v.x<0);last=p;}
 assert.equal(mousePull({x:0,y:0,toX:120,toY:0,travel:120}).power,1);
 assert.equal(mousePull({x:NaN,y:0,toX:1,toY:0}),null);
});
test('desktop projection uses canvas offsets and CSS scale, never page coordinates',()=>assert.deepEqual(mousePoint({toX:240,toY:210,left:40,top:60,scaleX:2,scaleY:2}),{x:400,y:300}));
test('stationary left press and tiny jitter never turn into a direct shot, even after a long hold',()=>{
 for(const delta of [0,1,2]){const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.time(99999);r.events.get('pointermove')(r.ev(200+delta,150));assert.equal(r.input.aim,null);r.events.get('pointerup')(r.ev(200+delta,150));assert.equal(r.shots.length,0);}finally{r.restore();}}
});
test('7px and 9px both pull opposite the cursor, without a mode or minimum-power cliff',()=>{
 const powers=[];for(const d of [7,9]){const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(200+d,150));const shown=r.input.aim;assert.ok(shown.x<0);powers.push(shown.power);r.events.get('pointerup')(r.ev(200+d,150));assert.deepEqual(r.shots,[shown]);}finally{r.restore();}}assert.ok(powers[1]>powers[0]);assert.ok(powers[0]<.3);
});
test('all eight desktop directions invert the drag; actual preview equals release',()=>{
 for(const [x,y]of [[-100,0],[100,0],[0,-100],[0,100],[-80,-80],[-80,80],[80,-80],[80,80]]){const r=rig();try{r.on.get('pointerdown')(r.ev(240,210));r.events.get('pointermove')(r.ev(240+x/2,210+y/2));const v=r.input.aim;assert.equal(Math.sign(v.x)||0,-Math.sign(x)||0);assert.equal(Math.sign(v.y)||0,-Math.sign(y)||0);r.events.get('pointerup')(r.ev(240+x/2,210+y/2));assert.deepEqual(r.shots,[v]);}finally{r.restore();}}
});
test('returning a mouse spring to its visible origin cancels; pulling out again re-arms',()=>{
 for(const rearm of [false,true]){const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(350,150));r.events.get('pointermove')(r.ev(200,150));assert.equal(r.input.aim,null);if(rearm)r.events.get('pointermove')(r.ev(160,170));r.events.get('pointerup')(r.ev(rearm?160:200,rearm?170:150));assert.equal(r.shots.length,rearm?1:0);}finally{r.restore();}}
});
test('pull vector is camera-independent; waiting longer does not charge it',()=>{const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(230,180));const a=r.input.aim;r.camera({x:-900,y:-700});r.time(99999);assert.deepEqual(r.input.aim,a);r.events.get('pointerup')(r.ev(230,180));assert.deepEqual(r.shots,[a]);}finally{r.restore();}});
test('Shift+click selects an explicit direct mode on PRESS and retains normal fixed speed',()=>{const r=rig();try{r.on.get('pointerdown')(r.ev(200,150,{shiftKey:true}));assert.ok(r.input.aim.x>0);r.time(99999);r.events.get('pointermove')(r.ev(280,150,{shiftKey:false}));const v=r.input.aim;assert.ok(v.x>0);assert.equal(v.power,1);r.events.get('pointerup')(r.ev(280,150));assert.deepEqual(r.shots,[v]);}finally{r.restore();}});
test('pressing Shift during a spring cannot switch its model mid-drag',()=>{const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(250,150,{shiftKey:true}));assert.ok(r.input.aim.x<0);r.events.get('pointerup')(r.ev(250,150));assert.equal(r.shots.length,1);}finally{r.restore();}});
test('Escape, right chord, right press, context-menu, blur and lost capture cancel without firing',()=>{for(const kind of ['escape','chord','right','menu','blur','capture']){const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(300,180));if(kind==='escape')r.events.get('keydown')({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});if(kind==='chord')r.events.get('pointermove')(r.ev(300,180,{buttons:3}));if(kind==='right')r.on.get('pointerdown')(r.ev(300,180,{button:2}));if(kind==='menu')r.on.get('contextmenu')({preventDefault(){}});if(kind==='blur')r.events.get(kind)();if(kind==='capture')r.on.get('lostpointercapture')(r.ev(300,180));r.events.get('pointerup')(r.ev(300,180));assert.equal(r.shots.length,0,kind);assert.equal(r.input.engaged,false);assert.equal(r.input.aim,null);}finally{r.restore();}}});
test('off-canvas release remains valid; duplicate/right releases do not double-fire',()=>{const r=rig();try{r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointerup')(r.ev(1000,-100,{button:2}));assert.equal(r.shots.length,0);r.events.get('pointermove')(r.ev(1000,-100));const shown=r.input.aim;r.events.get('pointerup')(r.ev(1000,-100));r.events.get('pointerup')(r.ev(1000,-100));assert.deepEqual(r.shots,[shown]);}finally{r.restore();}});
test('new mouse press and cancellation clear an older unspent reload intent',()=>{const r=rig();try{const n=r.cancelled();r.on.get('pointerdown')(r.ev(200,150));assert.ok(r.cancelled()>n);r.input.cancel();assert.equal(r.shots.length,0);assert.equal(r.input.aim,null);}finally{r.restore();}});
test('real run accepts explicit mouse aim speed with cosmetic Sniper eyes',()=>{const r=createRun(77,()=>{},{waveMode:true,equipment:{eyes:'sniper'}});try{Object.assign(r.state,{phase:'playing',opening:null,inputLock:false});placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;const v=r.aimAt({x:-200,y:-450},false,42);assert.ok(Math.abs(v.power-1)<1e-10);assert.equal(r.dash(v),true);assert.equal(r.state.precisionShot.eligible,false);}finally{r.dispose();}});
test('cancelBufferedDash removes only the unspent request, not resources or an existing launch',()=>{const r=createRun(77,()=>{},{waveMode:true});try{r.state.edgeBuffer={x:42,y:0,power:1};const before={edge:r.state.edge,shots:r.state.shots,focus:r.state.focus,position:{...r.world.player.position}};r.cancelBufferedDash();assert.equal(r.state.edgeBuffer,null);assert.deepEqual({edge:r.state.edge,shots:r.state.shots,focus:r.state.focus,position:{...r.world.player.position}},before);}finally{r.dispose();}});

test('control-practice guidance constructs with valid icons without breaking the main app bootstrap',async()=>{
 const [{Window},{createControlPracticeUI}]=await Promise.all([import('happy-dom'),import('../src/control-practice-ui.js')]);const w=new Window(),previous=globalThis.document,oldCancel=globalThis.cancelAnimationFrame;globalThis.document=w.document;globalThis.cancelAnimationFrame=()=>{};w.document.body.innerHTML='<main id="game"></main>';let ui;
 try{ui=createControlPracticeUI({resetInput(){}});assert.ok(w.document.querySelector('.control-help [data-ui-icon="pull"]'));assert.match(w.document.querySelector('.control-help').textContent,/Aim at target/);}finally{ui?.dispose();globalThis.document=previous;globalThis.cancelAnimationFrame=oldCancel;await w.happyDOM.abort();}
});

test('moving targets cannot shift a stationary pull, and the visible vector is what releases',()=>{
 const r=rig();try{
  let angle=0;r.run.adjust=v=>({ ...v,x:Math.cos(angle)*Math.hypot(v.x,v.y),y:Math.sin(angle)*Math.hypot(v.x,v.y) });
  r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(240,150));const shown=r.input.aim;
  angle=1;for(let i=0;i<20;i++)r.input.tick();assert.deepEqual(r.input.aim,shown);
  r.events.get('pointermove')(r.ev(240,150));assert.deepEqual(r.input.aim,shown);
  r.events.get('pointerup')(r.ev(240,150));assert.deepEqual(r.shots,[shown]);
 }finally{r.restore();}
});
test('viewport resize during a held drag does not release or cancel it',()=>{
 const r=rig();try{
  r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(250,150));const shown=r.input.aim;
  r.events.get('resize')?.();assert.equal(r.input.engaged,true);assert.deepEqual(r.input.aim,shown);assert.equal(r.shots.length,0);
  r.events.get('pointerup')(r.ev(250,150));assert.deepEqual(r.shots,[shown]);
 }finally{r.restore();}
});

test('a 20px mouse pull produces a useful launch even on a large viewport',()=>{
 const v=mousePull({x:0,y:0,toX:0,toY:20,travel:140});
 assert.ok(Math.hypot(v.x,v.y)>=11);assert.ok(v.y<0);
});

test('first arcade drag is not silently forced upward',()=>{
 const r=createRun(77,()=>{},{waveMode:true,continuous:true});try{
  assert.equal(r.state.phase,'ready');
  const down={x:0,y:25,power:.6};assert.deepEqual(r.adjust(down,false),down);
 }finally{r.dispose();}
});
test('a ground-started gesture activates focus if the player becomes airborne while still holding',()=>{
 const r=rig();try{
  r.run.state.held=false;let airborne=false;r.run.focus=on=>{r.run.state.held=on&&airborne;};
  r.on.get('pointerdown')(r.ev(200,150));r.events.get('pointermove')(r.ev(250,150));r.input.tick();assert.equal(r.run.state.held,false);
  airborne=true;r.input.tick();assert.equal(r.run.state.held,true);assert.equal(r.shots.length,0);
 }finally{r.restore();}
});

test('direct mouse and touch aim at the release position at full power, cancel on return or blur',()=>{
 for(const type of ['mouse','touch']){
  const r=rig('direct');try{
   const ev=(x,y)=>r.ev(x,y,{pointerType:type});
   r.on.get('pointerdown')(ev(180,150));r.events.get('pointermove')(ev(300,180));
   const shown=r.input.aim;assert.equal(shown.control,'direct');assert.equal(shown.power,1);assert.ok(shown.x>0&&shown.y>0);
   r.events.get('pointerup')(ev(300,180));assert.deepEqual(r.shots,[shown]);
   r.on.get('pointerdown')(ev(180,150));r.events.get('pointermove')(ev(300,180));r.events.get('pointermove')(ev(180,150));assert.equal(r.input.aim,null);r.events.get('pointerup')(ev(180,150));assert.equal(r.shots.length,1);
   r.on.get('pointerdown')(ev(180,150));r.events.get('blur')();r.events.get('pointerup')(ev(180,150));assert.equal(r.shots.length,1);assert.equal(r.input.engaged,false);
  }finally{r.restore();}
 }
});
