import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createNeedlePhase,NEEDLE_PHASE,eligiblePhaseNeedle,needleEntryFraction,reactiveShellStudy,reactiveShellReadout} from '../src/needle-phase.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer,setPlayerVelocity} from '../src/physics.js';
import {ITEMS,equipmentRules,loadEquipment,normalizeEquipment} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {shopStudy} from '../src/shop-catalog.js';
import {powerReadout} from '../src/power-readout.js';
import {drawCubeHero,drawShopItemStudy,drawReactiveShellState} from '../src/art/splatr-art-engine.js';
const stationary=(extra={})=>({kind:'needle',source:'prism',x:0,y:0,px:0,py:0,vx:0,vy:0,angle:0,age:0,life:110,...extra});
const env=(now=0,more={})=>({active:true,now,previousTime:now,player:{x:0,y:0},previous:{x:0,y:0},radius:25.24,...more});
function fixture(body='hologram'){
 const events=[],r=createRun(77,(type,data)=>events.push({type,data}),{waveMode:true,equipment:{body}});
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
 Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:0});r.state.wave.entry=0;
 placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;return {r,events};
}
const step=r=>{r.state.stop=1;r.tick();};
const launch=r=>{assert.equal(r.dash({x:24,y:0,power:24/42}),true);r.state.blade=r.state.parry=0;};
const atPlayer=r=>stationary({x:r.world.player.position.x,y:r.world.player.position.y,px:r.world.player.position.x,py:r.world.player.position.y});

test('Hologram500-credit owners keep their saves; old12% aim perk is fully replaced',()=>{
 assert.equal(PART_PERKS.hologram.stat,'phase');assert.equal(equipmentRules({body:'hologram'}).needlePhase,true);assert.equal(equipmentRules({body:'hologram'}).focusDrain,1);
 assert.equal(ITEMS.find(i=>i.id==='hologram').price,500);assert.match(powerReadout('hologram').detail,/Walls, enemies, bosses, beams, rings and danger zones still hit normally/);assert.equal(powerReadout('hologram').short,'PHASE 1 NEEDLE');
 const saved=loadEquipment(JSON.stringify({owned:['hologram'],equipped:{body:'hologram'},presets:[{body:'hologram'},null,null]}));assert.equal(saved.equipped.body,'hologram');assert.equal(saved.presets[0].body,'hologram');
 const a=fixture('paper'),b=fixture();try{for(const {r}of[a,b]){r.state.focus=.5;r.focus(true);step(r);}assert.equal(a.r.state.focus,b.r.state.focus);}finally{a.r.dispose();b.r.dispose();}
});

test('unarmed/expired phase never consumes; exact0-inclusive/4-exclusive legal-launch window',()=>{
 const gate=createNeedlePhase();assert.equal(gate.filter(stationary(),true,env()),0);gate.launch(10);assert.equal(gate.filter(stationary(),true,env(9.999)),0);assert.equal(gate.filter(stationary(),true,env(14)),0);assert.equal(gate.view(14).ready,true);
 assert.equal(gate.filter(stationary(),true,env(10)),2);assert.equal(gate.view(10).remaining,120);assert.equal(gate.view(10).window,false);
});

test('relative-sweep first contact clips the window at fractional deadline crossings',()=>{
 const sweep=stationary({px:-40,x:0}),movement={previousTime:3.8,now:4.2,radius:30,player:{x:0,y:0},previous:{x:0,y:0}};
 assert.equal(needleEntryFraction(sweep,movement.player,movement.previous,30),.25);
 let g=createNeedlePhase();g.launch(0);assert.equal(g.filter(sweep,true,env(4.2,movement)),2);assert.ok(Math.abs(g.view(4.2).remaining-119.7)<1e-10);
 g=createNeedlePhase();g.launch(0);assert.equal(g.filter(stationary({px:-120,x:0}),true,env(4.2,movement)),0,'contact at4.1 is too late');
 assert.equal(needleEntryFraction(stationary({px:-40,x:-39}),{x:0,y:0},{x:0,y:0},30),null);assert.equal(needleEntryFraction(stationary({x:NaN}),{x:0,y:0},{x:0,y:0},30),null);
});

test('recharge starts only on accepted interception; empty launch/cancel cannot spend or refresh it',()=>{
 const gate=createNeedlePhase();gate.launch(0);assert.equal(gate.view(90).ready,true);gate.launch(90);assert.equal(gate.filter(stationary(),true,env(92)),2);
 gate.launch(100);assert.equal(gate.filter(stationary(),true,env(101)),0);assert.equal(gate.view(211.99).ready,false);assert.equal(gate.view(212).ready,true);
 gate.launch(212);assert.equal(gate.filter(stationary(),true,env(212)),2);assert.equal(gate.view(212).remaining,120);
});

test('one exact hazard identity is suppressed until clear; it resumes ordinary resolution on reentry',()=>{
 const gate=createNeedlePhase(),h=stationary();gate.launch(0);assert.equal(gate.filter(h,true,env()),2);assert.equal(gate.filter(h,true,env(2)),1);assert.equal(gate.filter({...h},true,env(2)),0);
 assert.equal(gate.filter(h,false,env(3,{player:{x:100,y:0}})),0);assert.equal(gate.filter(h,true,env(3)),0);assert.equal(h.spent,undefined);assert.equal(h.life,110);
 gate.reset();assert.equal(gate.view(3).ready,true);assert.equal(gate.filter(h,true,env(3)),0);
});

test('narrow hostile eligibility excludes boss debris, zones/rings/contact/tutorial and spent needles',()=>{
 for(const h of [stationary({source:'monolith'}),stationary({kind:'zone'}),stationary({kind:'ring'}),stationary({source:'fang'}),stationary({tutorial:true}),stationary({protected:true}),stationary({boss:true}),stationary({spent:true})]){
  assert.equal(eligiblePhaseNeedle(h),false);const g=createNeedlePhase();g.launch(0);assert.equal(g.filter(h,true,env()),0);assert.equal(g.view(0).ready,true);
 }
 assert.equal(eligiblePhaseNeedle(stationary({source:'crown'})),true);const g=createNeedlePhase();g.launch(0);assert.equal(g.filter(stationary(),true,env(1,{active:false})),0);
});

test('real phase preserves needle movement/lifetime and does not grant invulnerability, Edge, score or velocity',()=>{
 const {r,events}=fixture();try{
  launch(r);const h=atPlayer(r),before={velocity:{...r.world.player.velocity},edge:r.state.edge,score:r.state.score,invul:r.state.invul};r.combat.hazards.push(h);step(r);
  assert.equal(r.state.hp,3);assert.ok(r.combat.hazards.includes(h));assert.equal(h.spent,undefined);assert.ok(h.life<110);assert.equal(r.state.invul,before.invul);assert.deepEqual(r.world.player.velocity,before.velocity);assert.equal(r.state.edge,before.edge);assert.equal(r.state.score,before.score);assert.equal(events.filter(e=>e.type==='needlePhase').length,1);
  step(r);assert.ok(r.combat.hazards.includes(h));assert.equal(events.filter(e=>e.type==='needlePhase').length,1);assert.equal(r.state.shellAbility.ready,false);
  // The same source now actually moves clear; it is not paused/deleted by phase.
  h.vx=80;step(r);assert.ok(h.x>r.world.player.position.x);assert.ok(r.combat.hazards.includes(h));
  h.vx=-80;step(r);assert.equal(r.state.hp,2);assert.equal(r.combat.hazards.includes(h),false);
 }finally{r.dispose();}
});

test('two simultaneous needles have one deterministic pass, not a volley-wide block',()=>{
 const {r,events}=fixture();try{launch(r);const a=atPlayer(r),b=atPlayer(r);r.combat.hazards.push(a,b);step(r);assert.equal(r.state.hp,2);assert.deepEqual(r.combat.hazards,[b]);assert.equal(events.filter(e=>e.type==='needlePhase').length,1);}finally{r.dispose();}
});

test('rejected input does not rearm phase and after-window needle still hurts normally',()=>{
 const {r}=fixture();try{
  launch(r);r.world.previousClock=r.world.clock=4;r.state.inputLock=true;assert.equal(r.dash({x:24,y:0,power:24/42}),false);r.state.inputLock=false;r.combat.hazards.push(atPlayer(r));step(r);assert.equal(r.state.hp,2);assert.equal(r.state.shellAbility.ready,true);
 }finally{r.dispose();}
});

test('phase excludes tutorial contexts/invulnerability and does not protect a real Fang rush',()=>{
 for(const flag of ['tutorialActive','teachingArena']){const {r,events}=fixture();try{r.state[flag]=true;launch(r);r.combat.hazards.push(atPlayer(r));step(r);assert.equal(events.some(e=>e.type==='needlePhase'),false);assert.equal(r.state.shellAbility,null);}finally{r.dispose();}}
 const {r,events}=fixture();try{launch(r);r.state.invul=20;r.combat.hazards.push(atPlayer(r));step(r);assert.equal(events.some(e=>e.type==='needlePhase'),false);r.state.invul=0;assert.equal(r.hurt('Fang',null,{kind:'fang-rush'}),true);assert.equal(r.state.hp,2);}finally{r.dispose();}
});

test('walls remain solid: real Hologram launch banks without a phase teleport',()=>{
 const {r}=fixture();try{const arena=r.world.arena;placePlayer(r.world,{x:arena.x+27,y:-400});stopPlayer(r.world);r.state.inputLock=false;assert.equal(r.dash({x:-30,y:0,power:30/42}),true);for(let i=0;i<10;i++){r.state.stop=0;r.tick();}assert.ok(r.world.player.position.x>=arena.x);assert.ok(r.state.banks>0||r.state.impacts.length>0);assert.equal(r.state.shellAbility.ready,true);}finally{r.dispose();}
});

test('Iron latch reads actual one-use guard and stays spent through repairs; needles do not spend it',()=>{
 const {r}=fixture('iron');try{step(r);assert.equal(r.state.shellAbility.ready,true);assert.equal(r.hurt('Fang',null,{kind:'fang-rush'}),false);assert.equal(r.state.shellAbility.spent,true);r.state.hp=3;step(r);assert.equal(r.state.shellAbility.spent,true);assert.equal(r.hurt('Fang',null,{kind:'fang-rush'}),true);}finally{r.dispose();}
 const q=fixture('iron').r;try{assert.equal(q.hurt('Prism needle',null,{kind:'prism-needle'}),true);step(q);assert.equal(q.state.shellAbility.spent,false);}finally{q.dispose();}
});

test('Prism hardpoints read the actual45-tick side-wall cooldown and exactly two projectiles',()=>{
 const {r}=fixture('prism');try{
  step(r);assert.equal(r.state.shellAbility.ready,true);const a=r.world.arena;placePlayer(r.world,{x:a.x+27,y:-400});setPlayerVelocity(r.world,-20,0);
  for(let i=0;i<8&&r.state.shellAbility.ready;i++){r.state.stop=0;r.tick();}
  assert.equal(r.state.shellAbility.ready,false);assert.equal(r.state.equipmentFx.projectiles.length,2);assert.ok(r.state.shellAbility.remaining>0&&r.state.shellAbility.remaining<=45);
  const left=r.state.shellAbility.remaining;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);step(r);assert.equal(r.state.shellAbility.remaining,left-1);
  for(let i=0;i<45;i++)step(r);assert.equal(r.state.shellAbility.ready,true);
 }finally{r.dispose();}
});

test('death/retire/dispose clear phase state and cannot keep a live HUD receipt',()=>{
 for(const action of ['death','retire','dispose']){const {r}=fixture();launch(r);r.combat.hazards.push(atPlayer(r));step(r);assert.equal(r.state.shellAbility.ready,false);
 if(action==='death'){r.state.hp=1;r.hurt('QA');}else r[action]();assert.equal(r.state.shellAbility,null);assert.equal(reactiveShellReadout(r.state.shellAbility),'');if(action!=='dispose')r.dispose();}
});

function frame(id,q,time=0,motion=false){const cv=createCanvas(320,250),c=cv.getContext('2d');c.translate(1,2);const matrix=c.getTransform();const equipment=Object.freeze(normalizeEquipment({body:id,core:'echo'}));drawCubeHero(c,{x:180,y:155,radius:57,equipment,time,motion,pose:{blink:1,shellAbility:q}});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,1);return cv.toBuffer('image/png');}
test('three hardware grammars distinguish readiness/spent/window and freeze decorative motion',()=>{
 for(const id of ['hologram','iron','prism']){const ready={kind:id,ready:true,window:false,remaining:0,spent:false},spent={kind:id,ready:false,window:false,remaining:80,spent:true};assert.notDeepEqual(frame(id,ready),frame(id,spent));assert.deepEqual(frame(id,spent,0),frame(id,spent,999));assert.deepEqual(frame(id,{...spent,flash:1}),frame(id,spent));assert.deepEqual(frame(id,{...ready,kind:'bad'}),frame(id,null));}
 assert.notDeepEqual(frame('hologram',{kind:'hologram',ready:true}),frame('hologram',{kind:'hologram',ready:true,window:true}));drawReactiveShellState(null);
});

test('shared enlarged studies are explicit illustrations, state-balanced and reduced-motion stable',()=>{
 for(const id of ['hologram','iron','prism']){
  const eq=normalizeEquipment({body:id}),it=ITEMS.find(i=>i.id===id),draw=(time)=>{const cv=createCanvas(640,400),c=cv.getContext('2d'),text=[],fn=c.fillText.bind(c);c.translate(1,2);c.globalAlpha=.6;const m=c.getTransform();c.fillText=(v,...a)=>{text.push(v);fn(v,...a);};drawShopItemStudy(c,640,400,{equipment:eq,study:shopStudy(it,time,false,eq)});assert.deepEqual(c.getTransform(),m);assert.equal(c.globalAlpha,.6);assert.ok(text.some(v=>v.includes('ILLUSTRATION')));return cv.toBuffer('image/png');};assert.deepEqual(draw(0),draw(9000));
 }
 const a=reactiveShellStudy('hologram',0),b=reactiveShellStudy('hologram',1000),c=reactiveShellStudy('hologram',1850);assert.equal(a.ready,true);assert.equal(a.window,false);assert.equal(b.window,true);assert.equal(c.ready,false);assert.equal(c.phase,'PASS');assert.equal(NEEDLE_PHASE.recharge,120);
});
