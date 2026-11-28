import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import {
  createElementalDashStage, drawElementalDashStage, drawDashStageMark,
  drawDashStageParticle, resolveDashStageDensity,
  DASH_STAGE_LIMITS, DASH_STAGE_MATERIALS, DASH_STAGE_RECEIPTS
} from '../src/art/splatr-art-engine.js';

const paint = fn => {
  const canvas=createCanvas(480,360); fn(canvas.getContext('2d'));
  return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
};
const blank=paint(()=>{});
function runFor(element='ink',dense=false){return {
  state:{phase:'playing',shots:0,slashAge:-1,equipment:{dash:'dash-'+element},sword:null},
  world:{viewW:1280,player:{position:{x:240,y:180},velocity:{x:25,y:0}}},
  combat:{enemies:new Map(Array.from({length:dense?30:0},(_,i)=>[i,{}])),hazards:dense?Array.from({length:20},()=>({})):[]}
};}
function launch(stage,run){stage.tick(run,true);run.state.shots++;run.state.slashAge=0;stage.event('dash',{...run.world.player.position,angle:0},true);stage.tick(run,true);}
function advance(stage,run,n,move=false){for(let i=0;i<n;i++){run.state.slashAge++;if(move)run.world.player.position.x+=20;stage.tick(run,true);}}

test('seven material profiles describe different motion and geometry, not color swaps',()=>{
 assert.equal(Object.keys(DASH_STAGE_MATERIALS).length,7);
 assert.equal(new Set(Object.values(DASH_STAGE_MATERIALS).map(x=>x.shape)).size,7);
 for(const m of Object.values(DASH_STAGE_MATERIALS)){assert.ok(Object.isFrozen(m));assert.ok(m.particleLife<=72);assert.ok(m.markLife<=72);}
 assert.ok(Object.isFrozen(DASH_STAGE_LIMITS));assert.ok(Object.isFrozen(DASH_STAGE_RECEIPTS));
});

test('all seven launch/contact/bank/proc marks are deterministic, animate, and have finite visible dissipation',()=>{
 for(const role of ['launch','contact','armor','bank','proc']){
  const images=new Set();for(const element of Object.keys(DASH_STAGE_MATERIALS)){
   const spec={element,role,x:240,y:180,angle:.3,age:4,life:60};
   const a=paint(c=>drawDashStageMark(c,spec));assert.notEqual(a,blank,role+' '+element);images.add(a);
   assert.equal(a,paint(c=>drawDashStageMark(c,spec)));
   assert.notEqual(a,paint(c=>drawDashStageMark(c,{...spec,age:25})));
   assert.notEqual(paint(c=>drawDashStageMark(c,{...spec,age:50})),blank);
   assert.equal(paint(c=>drawDashStageMark(c,{...spec,age:60})),blank);
  }
  // Banks intentionally share a normal-aligned contour while carrying each
  // material's particles; the other four beats have authored element shapes.
  assert.equal(images.size,7);
 }
});

test('particle silhouettes and delayed echo are distinct and expire',()=>{
 const images=[];for(const element of Object.keys(DASH_STAGE_MATERIALS)){
  const particle={element,active:true,x:240,y:180,age:10,life:50,delay:0,size:5,rotation:.2,serial:3};
  const a=paint(c=>drawDashStageParticle(c,particle));images.push(a);assert.notEqual(a,blank);
  assert.equal(paint(c=>drawDashStageParticle(c,{...particle,age:50})),blank);
  assert.equal(paint(c=>drawDashStageParticle(c,{...particle,age:1,delay:4})),blank);
 }
 assert.equal(new Set(images).size,7);
});

test('flow requires real accepted launch, short age and actual displacement, never ambient speed',()=>{
 const stage=createElementalDashStage(),run=runFor();
 for(let i=0;i<100;i++){run.world.player.position.x+=25;stage.tick(run,true);}
 assert.equal(stage.snapshot().particles.length,0);assert.equal(stage.snapshot().totals.flow,0);
 run.world.player.position.x=240;launch(stage,run);advance(stage,run,12,true);
 assert.ok(stage.snapshot().totals.flow>0);const n=stage.snapshot().totals.flow;advance(stage,run,50,true);assert.equal(stage.snapshot().totals.flow,n);
 const other=createElementalDashStage(),fixed=runFor();launch(other,fixed);advance(other,fixed,10);assert.equal(other.snapshot().totals.flow,0);
});

test('confirmed procs use real nonempty receipts, never launch-based predictions or nonexistent victims',()=>{
 const stage=createElementalDashStage(),run=runFor();stage.tick(run,true);
 for(const [type,rule]of Object.entries(DASH_STAGE_RECEIPTS))if(!rule.quiet)stage.event(type,{x:100,y:100,targets:[],links:[],hits:type==='voidCollapse'?0:[]},true);
 stage.tick(run,true);assert.equal(stage.snapshot().particles.length,0);assert.equal(stage.snapshot().marks.length,0);
 stage.event('emberIgnite',{x:100,y:100,targets:['accepted']},true);
 stage.event('frostContact',{x:130,y:100,targets:[{id:'cold'}]},true);
 stage.event('voltContact',{origin:{x:100,y:100},links:[{x:160,y:100},{x:180,y:100}]},true);
 stage.event('voidCollapse',{x:200,y:100,hits:1},true);
 stage.event('repriseFired',{hits:[{x:220,y:100}]},true);
 stage.tick(run,true);const state=stage.snapshot();assert.equal(state.marks.filter(m=>m.role==='proc').length,6);
 assert.deepEqual(new Set(state.marks.map(m=>m.element)),new Set(['fire','ice','lightning','void','echo']));
 const volt=state.marks.filter(m=>m.element==='lightning');assert.deepEqual(volt.map(m=>m.x),[160,180]);
});

test('secondary damage and repeated same-receipt targets do not spam primary contact stage',()=>{
 const stage=createElementalDashStage(),run=runFor();stage.tick(run,true);
 for(let i=0;i<10;i++){stage.event('cut',{x:200,y:180,entityId:'one'},true);stage.event('armor',{x:220,y:180,entityId:'secondary',secondary:true},true);}
 stage.tick(run,true);assert.equal(stage.snapshot().marks.length,1);assert.equal(stage.snapshot().marks[0].role,'contact');
 stage.event('cut',{x:200,y:180,entityId:'other'},true);stage.tick(run,true);assert.equal(stage.snapshot().marks.length,2);
});

test('events project immutable primitive copies and caller changes cannot retarget them',()=>{
 const stage=createElementalDashStage(),run=runFor('ink');stage.tick(run,true);
 const data={x:200,y:160,angle:.2,equipment:{dash:'dash-fire'}};stage.event('dash',data,true);data.x=900;data.equipment.dash='dash-void';stage.tick(run,true);
 const mark=stage.snapshot().marks[0];assert.equal(mark.x,200);assert.equal(mark.element,'fire');
 const copy=stage.snapshot();copy.marks[0].x=1000;copy.particles[0].x=1000;assert.equal(stage.snapshot().marks[0].x,200);assert.notEqual(stage.snapshot().particles[0].x,1000);
});

test('particles have genuinely different motion: cinders rise, drops fall, void returns, echo steps',()=>{
 const states={};for(const element of ['fire','water','void','echo','ice','lightning']){
  const stage=createElementalDashStage(),run=runFor(element);launch(stage,run);const first=stage.snapshot().particles[0];advance(stage,run,20);const later=stage.snapshot().particles.find(p=>p.serial===first.serial);assert.ok(later);states[element]={first,later};
 }
 assert.ok(states.fire.later.y<states.fire.first.y);
 assert.ok(states.water.later.y>states.water.first.y);
 assert.notEqual(states.ice.later.rotation,states.ice.first.rotation);
 assert.equal(states.lightning.later.rotation,states.lightning.first.rotation);const returning=createElementalDashStage(),rv=runFor('void');launch(returning,rv);advance(returning,rv,20);const peak=returning.snapshot().particles[0];advance(returning,rv,15);const close=returning.snapshot().particles.find(p=>p.serial===peak.serial);assert.ok(Math.hypot(close.x-close.anchorX,close.y-close.anchorY)<Math.hypot(peak.x-peak.anchorX,peak.y-peak.anchorY));
 const e=createElementalDashStage(),r=runFor('echo');launch(e,r);const a=e.snapshot().particles[0];advance(e,r,1);const b=e.snapshot().particles[0];assert.equal(a.x,b.x);assert.equal(a.y,b.y);
});

test('bank particles stay in the playable half-plane for all seven materials and four normals',()=>{
 for(const element of Object.keys(DASH_STAGE_MATERIALS))for(const [nx,ny]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const stage=createElementalDashStage(),run=runFor(element);stage.tick(run,true);stage.event('bank',{x:240,y:180,nx,ny},true);stage.tick(run,true);
  for(let i=0;i<60;i++){for(const p of stage.snapshot().particles)assert.ok((p.x-240)*nx+(p.y-180)*ny>=-1e-8,element+' normal '+nx+','+ny);advance(stage,run,1);}
 }
});

test('queue, contact ledger, marks and pool stay bounded under ten thousand event admissions',()=>{
 const stage=createElementalDashStage(),run=runFor('fire',true);stage.tick(run,true);
 for(let i=0;i<10000;i++)stage.event('cut',{x:180+i%30,y:140,entityId:'target-'+i},true);
 assert.ok(stage.snapshot().queued<=DASH_STAGE_LIMITS.queue);stage.tick(run,true);
 for(let frame=0;frame<40;frame++){for(let i=0;i<20;i++)stage.event('cut',{x:180+i,y:140,entityId:frame+':'+i},true);stage.tick(run,true);}
 const snap=stage.snapshot();assert.equal(snap.capacity,96);assert.ok(snap.particles.length<=96);assert.ok(snap.marks.length<=12);assert.ok(snap.totals.rejected>0);
 assert.equal(snap.density.dense,true);assert.equal(snap.density.particles,28);assert.equal(snap.density.marks,4);
});

test('busy/portrait budgets reduce secondary detail without altering game authority',()=>{
 const normal=resolveDashStageDensity(),phone=resolveDashStageDensity({width:390}),busy=resolveDashStageDensity({enemies:30,hazards:12});
 assert.ok(phone.particles<normal.particles);assert.ok(busy.particles<phone.particles);assert.ok(busy.spawnScale<normal.spawnScale);assert.ok(busy.opacity<normal.opacity);
 const stage=createElementalDashStage(),run=runFor('fire',true);launch(stage,run);const authority=JSON.stringify(run);advance(stage,run,4);assert.equal(JSON.stringify(run).replace('"slashAge":4','"slashAge":0'),authority);
});

test('reduced motion, stopped phase, field reset, new run and finite expiry remove all state',()=>{
 const stage=createElementalDashStage(),run=runFor('ice');launch(stage,run);assert.ok(stage.snapshot().particles.length);
 assert.equal(paint(c=>stage.draw(c,{motion:false})),blank);stage.tick(run,false);assert.equal(stage.snapshot().particles.length,0);assert.equal(stage.snapshot().marks.length,0);
 launch(stage,run);run.state.phase='dead';stage.tick(run,true);assert.equal(stage.snapshot().particles.length,0);run.state.phase='playing';launch(stage,run);stage.tick(runFor(),true);assert.equal(stage.snapshot().particles.length,0);
 launch(stage,run);advance(stage,run,120);assert.equal(stage.snapshot().particles.length,0);assert.equal(stage.snapshot().marks.length,0);stage.reset();assert.equal(stage.snapshot().frame,0);
});

test('draws are repeatable and read-only, restore canvas state, and cull remote effects',()=>{
 const stage=createElementalDashStage(),run=runFor('ice');launch(stage,run);advance(stage,run,8);const snap=JSON.stringify(stage.snapshot());
 const image=()=>paint(c=>stage.draw(c,{scale:.7}));assert.notEqual(image(),blank);assert.equal(image(),image());assert.equal(JSON.stringify(stage.snapshot()),snap);
 assert.equal(paint(c=>stage.draw(c,{view:{x:10000,y:10000,w:300,h:300}})),blank);
 const c=createCanvas(480,360).getContext('2d');c.globalAlpha=.42;c.lineWidth=7;c.setLineDash([2,6]);c.translate(4,8);const tx=c.getTransform();stage.draw(c,{scale:.5});assert.equal(c.globalAlpha,.42);assert.equal(c.lineWidth,7);assert.deepEqual(c.getLineDash(),[2,6]);assert.deepEqual(c.getTransform(),tx);
});

test('malformed drawing and receipt inputs do not invent effects or corrupt context',()=>{
 const stage=createElementalDashStage(),run=runFor();stage.tick(run,true);
 for(const type of ['dash','cut','armor','bank','emberIgnite','voidCollapse']){stage.event(type,{x:NaN,y:100},true);stage.event(type,null,true);}
 stage.tick(run,true);assert.equal(stage.snapshot().particles.length,0);
 assert.equal(paint(c=>drawElementalDashStage(c,{particles:null,marks:[]})),blank);
 assert.equal(paint(c=>drawElementalDashStage(c,{particles:[null],marks:[null]})),blank);
 assert.equal(paint(c=>drawDashStageMark(c,{element:'ice',x:NaN,y:180,angle:0,age:1,life:40})),blank);
});

test('native production run forwards real dash and primary cut, with read-only draw and field cleanup',async()=>{
 const [{createRenderer},{createRun},{installDom,createDisplay}]=await Promise.all([import('../src/renderer.js'),import('../src/run.js'),import('./support/display.js')]);
 const dom=installDom(),{canvas}=createDisplay(960,540);let renderer;const receipts=[];
 const run=createRun(81,(type,data)=>{receipts.push(type);renderer?.event(type,data,true);},{waveMode:true,equipment:{dash:'dash-fire'}});renderer=createRenderer(canvas);
 try{Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,stop:1});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);renderer.tick(run,true);assert.ok(run.dash({x:25,y:0,power:.6}));renderer.tick(run,true);
  const p=run.world.player.position,e=run.combat.add({id:'stage-native-cut',kind:'fang',x:p.x+20,y:p.y,hp:1,pinned:true,delay:99999});run.combat.contacts.add(e);run.state.stop=1;run.tick();renderer.tick(run,true);assert.ok(receipts.includes('cut'));const state=renderer.effectState().dashStage;assert.ok(state.marks.some(m=>m.role==='launch'));assert.ok(state.marks.some(m=>m.role==='contact'));assert.ok(state.particles.every(p=>p.element==='fire'));
  const before=JSON.stringify(state),authority=JSON.stringify({hp:run.state.hp,kills:run.state.kills,clock:run.world.clock,velocity:run.world.player.velocity});for(let i=0;i<3;i++)renderer.draw(run,1,null,true);assert.equal(JSON.stringify(renderer.effectState().dashStage),before);assert.equal(JSON.stringify({hp:run.state.hp,kills:run.state.kills,clock:run.world.clock,velocity:run.world.player.velocity}),authority);
  renderer.field({x:0,y:0},false);assert.equal(renderer.effectState().dashStage.particles.length,0);assert.equal(renderer.effectState().dashStage.marks.length,0);
 }finally{renderer.dispose();run.dispose();dom.uninstall();}
});

test('native elemental mechanics deliver only admitted proc accents through production renderer',async()=>{
 const [{createRenderer},{createRun},{installDom,createDisplay},{placePlayer,stopPlayer}]=await Promise.all([import('../src/renderer.js'),import('../src/run.js'),import('./support/display.js'),import('../src/physics.js')]);
 const dom=installDom();
 try{for(const [dash,proc]of [['fire','emberIgnite'],['ice','frostContact'],['lightning','voltContact']]){
  const {canvas}=createDisplay(960,540);let renderer;const receipts=[];
  const run=createRun(77,(type,data)=>{receipts.push({type,data});renderer?.event(type,data,true);},{waveMode:true,equipment:{dash:'dash-'+dash}});renderer=createRenderer(canvas);
  try{Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999,stop:1});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);run.state.wave.entry=0;placePlayer(run.world,{x:-450,y:-250});stopPlayer(run.world);renderer.tick(run,true);run.dash({x:25,y:0,power:.6});
   const p=run.world.player.position,primary=run.combat.add({id:'primary-'+dash,kind:'fang',x:-300,y:-400,hp:5,delay:99999}),neighbor=run.combat.add({id:'neighbor-'+dash,kind:'fang',x:-300,y:-485,hp:5,delay:99999});run.state.blade=12;run.state.stop=1;run.combat.contacts.add(primary);run.tick();renderer.tick(run,true);
   assert.ok(receipts.some(e=>e.type===proc),dash+' emits real '+proc);const admitted=receipts.filter(e=>e.type===proc).some(e=>dash==='lightning'?e.data.links.length>0:e.data.targets.length>0);assert.equal(renderer.effectState().dashStage.marks.some(m=>m.role==='proc'),admitted,dash+' accents match admission, including empty conduction');if(dash!=='lightning')assert.ok(admitted);assert.ok(neighbor.hp>0);assert.ok(renderer.effectState().dashStage.marks.filter(m=>m.role==='proc').every(m=>m.element===dash));
  }finally{renderer.dispose();run.dispose();}
 }}finally{dom.uninstall();}
});

test('particle interpolation is display-only and does not advance the material clock',()=>{
 const stage=createElementalDashStage(),run=runFor('fire');launch(stage,run);advance(stage,run,8);const state=stage.snapshot(),particle=state.particles[0],before=JSON.stringify(stage.snapshot());
 const left=paint(c=>drawDashStageParticle(c,particle,{alpha:0})),right=paint(c=>drawDashStageParticle(c,particle,{alpha:1}));assert.notEqual(left,right);assert.equal(JSON.stringify(stage.snapshot()),before);assert.equal(right,paint(c=>drawDashStageParticle(c,particle,{alpha:2})));
});
