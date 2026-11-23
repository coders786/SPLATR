import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {stopPlayer,placePlayer} from '../src/physics.js';
import {combatStatus} from '../src/combat-status.js';

test('normal opening waits for launch, then gives a reachable full Fang tell and real damage across seeds',()=>{
 for(let seed=0;seed<30;seed++){
  const events=[];let r;
  r=createRun(seed,(type,data)=>{if(type==='tell'||type==='hurt')events.push({type,kind:data.kind,cause:data.cause,tick:r.state.elapsed});},{waveMode:true});
  try{
   const positions=[...r.combat.enemies.values()].map(e=>[e.x,e.y]);
   for(let i=0;i<180;i++)r.tick();
   assert.equal(r.state.phase,'ready');assert.equal(r.state.elapsed,0);assert.deepEqual([...r.combat.enemies.values()].map(e=>[e.x,e.y]),positions);assert.equal(combatStatus(r.state).title,'ENEMIES WAITING');
   assert.equal(r.state.wave.brief.counts.pulse,1);
   assert.ok(r.dash({x:0,y:-12,power:12/42}));stopPlayer(r.world);
   let tell=null,rush=null,hit=null;
   for(let i=0;i<260;i++){
    r.tick();
    if(!tell){const e=[...r.combat.enemies.values()].find(e=>e.mode==='tell');if(e)tell={tick:r.state.elapsed,e,span:e.span};}
    if(tell&&!rush&&tell.e.mode==='rush')rush=r.state.elapsed;
    if(r.state.hp<3){hit=r.state.elapsed;break;}
   }
   assert.equal(tell?.e.kind,'fang');assert.ok(tell.tick>=30&&tell.tick<=90,`${seed}: ${tell.tick}`);
   assert.equal(tell.span,66);assert.ok(rush-tell.tick>=66,`${seed}: full warning`);
   assert.ok(hit>rush&&hit<=200,`${seed}: real hit after rush: ${hit}`);
   assert.equal(events.find(e=>e.type==='hurt')?.cause,'Fang');assert.equal(r.state.lastDamage?.cause,'Fang');
  }finally{r.dispose();}
 }
});

test('only actual safe contacts and real defenses produce explanatory status',()=>{
 const r=createRun(6,()=>{},{waveMode:true});
 try{
  r.state.phase='playing';r.state.wave.entry=0;r.state.invul=0;
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  placePlayer(r.world,{x:0,y:-200});stopPlayer(r.world);
  const e=r.combat.add({id:'overlap',kind:'fang',x:0,y:-200,home:'fixture',pinned:true});
  e.mode='idle';r.combat.contacts.add(e);r.tick();assert.equal(r.state.hp,3);assert.equal(combatStatus(r.state).title,'SAFE TOUCH');
  e.mode='rush';e.clock=20;r.combat.contacts.add(e);r.tick();assert.equal(r.state.hp,2);assert.equal(combatStatus(r.state).title,'TEMPORARILY PROTECTED');
  r.combat.contacts.add(e);r.tick();assert.equal(r.state.hp,2);assert.equal(r.state.lastDamage.cause,'Fang');
  r.state.invul=0;r.state.waveShield=1;r.hurt('Fang',e,{kind:'fang-rush'});assert.equal(r.state.hp,2);assert.equal(combatStatus(r.state).title,'HIT BLOCKED');assert.match(combatStatus(r.state).detail,/ward/);
  r.state.lastDefense=null;r.state.invul=0;r.state.parry=0;r.state.safeContact=null;r.state.elapsed=500;assert.equal(combatStatus(r.state),null);
 }finally{r.dispose();}
});

test('Fang does not begin an unreachable rush from outside its actual travel range',()=>{
 const r=createRun(2,()=>{},{waveMode:true});try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  placePlayer(r.world,{x:0,y:-400});stopPlayer(r.world);
  const e=r.combat.add({id:'far',kind:'fang',x:430,y:-400,home:'fixture',wavePlaced:true,delay:0});
  r.combat.move(1,1);assert.equal(e.mode,'idle');
  placePlayer(r.world,{x:200,y:-400});r.combat.move(1,1);assert.equal(e.mode,'tell');assert.equal(e.span,66);
 }finally{r.dispose();}
});

test('a player leaving the announced Fang lane is not dealt scripted damage',()=>{
 for(let seed=0;seed<8;seed++){
  const r=createRun(seed,()=>{},{waveMode:true});try{
   r.dash({x:0,y:-12,power:12/42});stopPlayer(r.world);let e;
   for(let i=0;i<100&&!e;i++){r.tick();e=[...r.combat.enemies.values()].find(x=>x.mode==='tell');}
   assert.ok(e);const p=r.world.player.position,angle=e.aim;
   // Controlled reposition perpendicular to the fixed announced aim, during the tell.
   placePlayer(r.world,{x:p.x-Math.sin(angle)*380,y:p.y+Math.cos(angle)*380});stopPlayer(r.world);
   let sawRush=false;for(let i=0;i<100;i++){r.tick();if(e.mode==='rush')sawRush=true;if(sawRush&&e.mode==='idle')break;}
   assert.ok(sawRush);assert.equal(r.state.hp,3,`seed ${seed}: escaped charge`);assert.equal(r.state.lastDamage,null);
  }finally{r.dispose();}
 }
});

test('a real Iron guard and a real parry explain the block without recording health loss',()=>{
 for(const defense of ['iron','parry']){
  const r=createRun(45,()=>{},{waveMode:true,equipment:defense==='iron'?{body:'iron'}:null});try{
   r.state.phase='playing';r.state.wave.entry=0;r.state.invul=0;
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   placePlayer(r.world,{x:0,y:-200});stopPlayer(r.world);
   const e=r.combat.add({id:'enemy',kind:'fang',x:defense==='iron'?0:300,y:-200,home:'fixture',pinned:true});
   if(defense==='iron'){e.mode='rush';e.clock=20;r.combat.contacts.add(e);r.combat.rushContacts.add(e);}
   else {r.state.blade=12;r.state.parry=10;const p=r.world.player.position;r.combat.hazards.push({kind:'needle',source:'prism',x:p.x,y:p.y,px:p.x,py:p.y,vx:0,vy:0,angle:0,age:0,life:30});}
   r.tick();assert.equal(r.state.hp,3,defense);assert.equal(r.state.lastDamage,null);assert.equal(r.state.lastDefense?.kind,defense);assert.equal(combatStatus(r.state).title,'HIT BLOCKED');
  }finally{r.dispose();}
 }
});
