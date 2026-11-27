import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createHypnoHold,HYPNO,eyeSight,blazeEntryGrant,eyeToolkitStudy} from '../src/eye-toolkit.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {equipmentRules,ITEMS,normalizeEquipment,loadEquipment} from '../src/equipment.js';
import {PART_PERKS,perkScoreMultiplier} from '../src/part-perks.js';
import {powerReadout} from '../src/power-readout.js';
import {shopStudy} from '../src/shop-catalog.js';
import {drawCubeHero,drawShopItemStudy} from '../src/art/splatr-art-engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),eyes=ITEMS.filter(i=>i.slot==='eyes');
const fang=(id='a',x=100)=>({id,kind:'fang',x,y:0,hp:1,mode:'idle'});
function fixture(eye='hypno',more={}){
 const events=[],r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{eyes:eye,...more}});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
 Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;
 r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});return {r,events};
}
function cut(r){assert.equal(r.dash({x:24,y:0,power:24/42}),true);const p=r.world.player.position,e=r.combat.add({id:'victim-'+r.state.shots,kind:'fang',x:p.x+30,y:p.y,pinned:true,delay:999999});r.combat.contacts.add(e);r.state.stop=1;r.tick();assert.equal(r.combat.enemies.has(e.id),false);}
test('atomic contracts: Blaze loses Drive score; Hypno loses aim discount; Sniper independently migrated to puncture',()=>{
 const b=equipmentRules({eyes:'blaze'}),h=equipmentRules({eyes:'hypno'});
 assert.equal(b.blazeEntry,true);assert.equal(h.hypnoDaze,true);assert.equal(h.focusDrain,1);assert.deepEqual(b.scorePerks,[]);
 assert.equal(equipmentRules({eyes:'visor'}).focusDrain,.9);assert.equal(equipmentRules({eyes:'glitch'}).focusRegen,1.12);assert.equal(equipmentRules({eyes:'smug'}).chainGrace,12);
 assert.equal(perkScoreMultiplier(equipmentRules({eyes:'sniper'}).scorePerks,{power:.899}),1);assert.equal(perkScoreMultiplier(equipmentRules({eyes:'sniper'}).scorePerks,{power:.9}),1);
 assert.equal(PART_PERKS.hypno.stat,'daze');assert.doesNotMatch(powerReadout('hypno').detail,/consumes 15% less/);assert.doesNotMatch(powerReadout('blaze').detail,/Earn 8%/);
});
test('Blaze pure entry grant respects full/current Riot cap, inactive and refresh',()=>{
 for(const max of [2,3]){assert.equal(blazeEntryGrant({fresh:true,active:true,edge:0,max}),1);assert.equal(blazeEntryGrant({fresh:true,active:true,edge:max,max}),0);}
 assert.equal(blazeEntryGrant({fresh:false,active:true}),0);assert.equal(blazeEntryGrant({fresh:true,active:false}),0);
});
test('real Blaze entry grants once AFTER ordinary refund, uses Riot cap, does not add duration',()=>{
 for(const core of ['standard','riot']){
  const {r,events}=fixture('blaze',{core});try{
   r.state.chain=equipmentRules({core}).overdriveKills-1;r.state.chainTime=100;r.state.edge=1;cut(r);
   assert.equal(r.state.edge,2);assert.equal(events.filter(e=>e.type==='blazeRefill').length,1);assert.ok(r.state.eyeAbility.flash>0);
   const duration=r.state.drive;assert.ok(duration>0);r.state.edge=1;r.state.inputLock=false;r.state.chain=equipmentRules({core}).overdriveKills*2-1;r.state.chainTime=100;cut(r);
   assert.equal(r.state.edge,2);assert.equal(events.filter(e=>e.type==='blazeRefill').length,1,'refresh cannot refund again');near(r.state.drive,duration);
  }finally{r.dispose();}
 }
});
test('Blaze full cap consumes with no delayed refund; arbitrary Drive assignment and lesson cannot ignite',()=>{
 const {r,events}=fixture('blaze');try{
  r.state.chain=5;r.state.chainTime=100;r.state.edge=3;cut(r);assert.equal(r.state.edge,3);assert.equal(events.filter(e=>e.type==='blazeRefill').length,0);
  r.state.edge=1;r.state.stop=1;r.tick();assert.equal(r.state.edge,1);r.state.drive=100;r.state.stop=1;r.tick();assert.equal(r.state.edge,1);assert.equal(r.state.eyeAbility.flash,0);
 }finally{r.dispose();}
 const {r:b,events:ev}=fixture('blaze');try{b.state.teachingArena=true;b.state.chain=5;b.state.chainTime=100;b.state.edge=1;cut(b);assert.equal(b.state.edge,1);assert.equal(ev.filter(e=>e.type==='blazeRefill').length,0);}finally{b.dispose();}
});
test('closed static sight rejects crossing, touching, endpoint and collinear obstruction, not clear/behind',()=>{
 const a={x:0,y:0},b={x:100,y:0};assert.equal(eyeSight(a,b,[]),true);
 for(const r of [{x:40,y:-10,w:10,h:20},{x:40,y:0,w:10,h:20},{x:100,y:-1,w:5,h:2},{x:-1,y:-1,w:2,h:2}])assert.equal(eyeSight(a,b,[r]),false);
 assert.equal(eyeSight(a,b,[{x:40,y:1,w:10,h:20},{x:140,y:-10,w:10,h:20}]),true);
 assert.equal(eyeSight(a,{x:0,y:100},[{x:-1,y:30,w:2,h:10}]),false);
});
test('Hypno requires continuous18 aim updates, picks nearest deterministic eligible target and only one per hold',()=>{
 const h=createHypnoHold(),a=fang('a'),b=fang('b'),options={held:true,active:true,dt:1,now:0,enemies:[b,a]};
 for(let i=0;i<17;i++)assert.equal(h.step(options),null);assert.equal(h.view().age,17);
 assert.equal(h.step(options),a);assert.equal(a.hypnoUntil,12);assert.equal(h.view().spent,true);
 for(let i=0;i<40;i++)assert.equal(h.step({...options,now:20}),null);assert.equal(b.hypnoUntil,undefined);
 h.release();for(let i=0;i<17;i++)h.step(options);assert.equal(h.step(options),b,'immune a skipped, b may be admitted on a new hold');
});
test('Hypno wall/range/boss/pinned/dead/telling/rushing/lesson targets resist; target loss does not fake admission',()=>{
 for(const extra of [{x:140.01},{kind:'monolith'},{kind:'crown'},{pinned:true},{hp:0},{mode:'tell'},{mode:'rush'},{paper:true},{tutorialTargetPlayer:true}]){
  const h=createHypnoHold(),e={...fang(),...extra};assert.equal(h.step({active:true,held:true,dt:18,enemies:[e]}),null);assert.equal(e.hypnoUntil,undefined);
 }
 const h=createHypnoHold(),e=fang();assert.equal(h.step({active:true,held:true,dt:18,enemies:[e],geometry:[{x:50,y:-10,w:8,h:20}]}),null);assert.equal(h.view().spent,false);
 assert.equal(h.step({active:true,held:true,dt:0,enemies:[]}),null);assert.equal(h.step({active:true,held:true,dt:0,enemies:[e]}),e,'still held, sight now clear');
});
test('Hypno immunity is90 world ticks per target object/generation and reset removes private state',()=>{
 const h=createHypnoHold(),e=fang(),opt={active:true,held:true,dt:18,enemies:[e]};assert.equal(h.step(opt),e);h.release();assert.equal(h.step({...opt,now:89.99}),null);assert.equal(h.step({...opt,now:90}),e);
 h.release();const next=fang();assert.equal(h.step({...opt,now:91,enemies:[next]}),next,'reused ID is not reused generation');h.reset();assert.equal(h.view().age,0);assert.equal(h.view().targetId,null);
});
test('tap release, depleted/inactive focus and zero dt cannot accumulate hidden Hypno charge',()=>{
 const h=createHypnoHold(),opt={active:true,held:true,dt:17,enemies:[fang()]};h.step(opt);h.step({...opt,held:false});assert.equal(h.view().age,0);assert.equal(h.step({...opt,dt:1}),null);h.step({...opt,active:false});assert.equal(h.view().age,0);h.step({...opt,dt:0});assert.equal(h.view().age,0);
});
test('real run accepts Hypno on18th usable aim update, shares Time world clock and costs baseline focus',()=>{
 for(const core of ['standard','time']){
  const {r,events}=fixture('hypno',{core});try{
   const e=r.combat.add({id:'local',kind:'fang',x:-240,y:-400,delay:999999});r.focus(true);
   for(let i=0;i<17;i++){r.state.stop=0;r.tick();}assert.equal(e.hypnoUntil,undefined);const before=r.state.focus;r.state.stop=0;r.tick();
   assert.equal(events.filter(e=>e.type==='hypnoDaze').length,1);near(before-r.state.focus,1/165);assert.equal(r.state.eyeAbility.spent,true);assert.ok(r.state.eyeAbility.remaining>11&&r.state.eyeAbility.remaining<12);
   assert.ok(r.world.clock<18,'hold uses input ticks, daze uses slowed world time');const until=e.hypnoUntil;r.state.stop=5;r.tick();assert.equal(e.hypnoUntil,until);assert.ok(r.state.eyeAbility.remaining>11);
   r.focus(false);r.state.inputLock=false;r.focus(true);assert.equal(r.state.eyeAbility.age,0);
  }finally{r.dispose();}
 }
});
test('actual AI initiation gate preserves movement and cool, resumes after12; existing tells and rushes are NOT canceled',()=>{
 const {r}=fixture();try{
  const e=r.combat.add({id:'gated',kind:'fang',x:-240,y:-400,delay:0});e.hypnoUntil=r.world.clock+12;const x=e.x;r.combat.move(1,1);assert.equal(e.mode,'idle');assert.notEqual(e.x,x);assert.ok(e.cool<=0);
  r.world.clock=12;r.combat.move(1,1);assert.equal(e.mode,'tell');const clock=e.clock;e.hypnoUntil=100;r.combat.move(1,1);assert.equal(e.mode,'tell');assert.ok(e.clock<clock);
  e.mode='rush';e.clock=24;e.aim=0;e.lungeSpeed=10;const rx=e.x;r.combat.move(1,1);assert.equal(e.mode,'rush');assert.notEqual(e.x,rx);
 }finally{r.dispose();}
});
const image=(id,pose={},time=0,motion=false)=>{const cv=createCanvas(240,200);drawCubeHero(cv.getContext('2d'),{x:145,y:108,radius:50,equipment:normalizeEquipment({eyes:id}),time,motion,pose:{blink:1,breathe:0,...pose}});return cv.toBuffer('image/png');};
test('seven face rigs are distinct; their local active condition changes pixels, not fake ambient time',()=>{
 assert.equal(new Set(eyes.map(e=>image(e.id).toString('base64'))).size,7);
 for(const id of ['visor','blaze','glitch','smug','hypno','sniper']){
  const pose={eyeAbility:{kind:id,active:true,age:18,remaining:12,flash:1},overdrive:true,focusRecovering:true,focusLevel:.5,eyePower:1,combo:5};
  assert.notDeepEqual(image(id),image(id,pose),id);
 }
});
test('read-only seven-eye illustrations are reduced-motion pixel stable; renderer preserves state and input',()=>{
 for(const eye of eyes){
  const eq=normalizeEquipment({eyes:eye.id}),draw=t=>{const cv=createCanvas(640,400),c=cv.getContext('2d');c.globalAlpha=.8;c.translate(2,3);const matrix=c.getTransform(),study=shopStudy(eye,t,false,eq),before=JSON.stringify(study);drawShopItemStudy(c,640,400,{equipment:eq,study});assert.deepEqual(c.getTransform(),matrix);near(c.globalAlpha,.8);assert.equal(JSON.stringify(study),before);assert.equal(study.eye.illustration,true);return cv.toBuffer('image/png');};assert.deepEqual(draw(0),draw(4500),eye.id);
  assert.equal(eyeToolkitStudy(eye.id,0).beat,0);assert.equal(eyeToolkitStudy(eye.id,1500).beat,1);assert.equal(eyeToolkitStudy(eye.id,3000).beat,2);
 }
});
test('save schema, prices and ownership contract are unchanged for all eyes',()=>{
 assert.deepEqual(eyes.map(e=>[e.id,e.price]),[['ninja',0],['visor',200],['blaze',150],['glitch',250],['smug',150],['hypno',300],['sniper',250]]);
 const raw=JSON.stringify({version:1,owned:eyes.map(e=>e.id),equipped:{eyes:'hypno'},presets:[{eyes:'blaze'},null,{eyes:'sniper'}],discovered:[]}),saved=loadEquipment(raw);assert.equal(saved.version,1);assert.equal(saved.equipped.eyes,'hypno');assert.equal(saved.presets[0].eyes,'blaze');assert.equal(saved.presets[2].eyes,'sniper');
});
test('real Hypno hold cannot advance through input lock, stun, depletion, hitstop or teaching arena',()=>{
 for(const guard of ['inputLock','stun','depleted','teachingArena']){
  const {r,events}=fixture();try{
   r.combat.add({id:'local',kind:'fang',x:-240,y:-400,delay:999999});r.focus(true);r.state[guard]=guard==='stun'?100:true;
   for(let i=0;i<20;i++){r.state.stop=0;r.tick();}assert.equal(events.filter(e=>e.type==='hypnoDaze').length,0,guard);assert.equal(r.state.eyeAbility?.spent||false,false,guard);
  }finally{r.dispose();}
 }
 const {r}=fixture();try{r.focus(true);for(let i=0;i<20;i++){r.state.stop=1;r.tick();}assert.equal(r.state.eyeAbility.age,0);}finally{r.dispose();}
});
