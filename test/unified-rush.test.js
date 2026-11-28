import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer,setPlayerVelocity} from '../src/physics.js';
import {arcadeRushReadout} from '../src/hud-copy.js';
import {OVERDRIVE} from '../src/flow.js';
import {SPEED_PACE} from '../src/speed-pace.js';

test('arcade meter reads one state and cannot promise a second speed grant in the same wave',()=>{
 const state={drive:0,chain:2,chainTime:10,rushKillTarget:4,wave:{pace:{progress:SPEED_PACE.goalTicks*.75},paceNotified:false}};
 assert.equal(arcadeRushReadout(state).fill,.75);
 state.wave.paceNotified=true;assert.equal(arcadeRushReadout(state).fill,.5);
 state.chainTime=0;assert.equal(arcadeRushReadout(state).fill,0);
 state.drive=OVERDRIVE.ticks/2;const live=arcadeRushReadout(state);
 assert.equal(live.fill,.5);assert.equal(live.label,'RUSH 2.5s');assert.equal(live.live,true);
});

test('real continuous speed threshold enters and refreshes the same Rush, once per wave',()=>{
 const events=[];const r=createRun(4,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
 try{
  r.state.phase='playing';r.state.invul=9999;r.state.wave.entry=0;
  const p=r.state.wave.pace;p.progress=SPEED_PACE.goalTicks-1;
  setPlayerVelocity(r.world,30,0);
  for(let i=0;i<10&&!r.state.drive;i++)r.tick();
  assert.ok(r.state.drive>0);assert.equal(r.state.rushSource,'speed');assert.equal(r.state.overdriveBest,OVERDRIVE.ticks);
  assert.equal(events.filter(e=>e.type==='drive').length,1);assert.equal(r.state.breakthrough,null);
  r.state.drive=0;r.state.stop=0;setPlayerVelocity(r.world,30,0);r.tick();
  assert.equal(r.state.drive,0,'a held pace cannot repeatedly grant Rush in the same wave');
 }finally{r.dispose();}
});

test('real combo kill uses same Rush and Riot retains its four-kill threshold',()=>{
 for(const core of ['standard','riot']){
  const events=[];const r=createRun(31,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true,equipment:{core}});
  try{
   r.state.phase='playing';r.state.invul=99999;r.state.wave.entry=0;
   const target=r.state.rushKillTarget;assert.equal(target,core==='riot'?4:6);
   r.state.chain=target-1;r.state.chainTime=999;
   const enemy=[...r.combat.enemies.values()][0];
   placePlayer(r.world,{x:enemy.x,y:enemy.y+120});stopPlayer(r.world);
   assert.equal(r.dash({x:0,y:-42,power:1}),true);
   for(let i=0;i<30&&!r.state.drive;i++)r.tick();
   assert.ok(r.state.drive>0);assert.equal(r.state.rushSource,'combo');
   assert.equal(events.filter(e=>e.type==='drive').length,1);assert.equal(r.state.breakthrough,null);
  }finally{r.dispose();}
 }
});

test('Rush kill chains through nearby enemies with a strict six-target cap and no combo refunds',()=>{
 const events=[],r=createRun(2,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
 try{
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  for(let i=0;i<9;i++)r.combat.add({id:`chain/${i}`,kind:'fang',x:i*120,y:-200,pinned:true,delay:99999,wave:true});
  r.state.phase='playing';r.state.wave.entry=0;r.state.invul=99999;r.state.drive=250;
  placePlayer(r.world,{x:0,y:-80});stopPlayer(r.world);assert.equal(r.dash({x:0,y:-42,power:1}),true);
  for(let i=0;i<8;i++)r.tick();
  assert.equal(r.state.kills,7);assert.equal(r.state.chain,1,'secondary kills do not advance the primary combo');
  assert.equal(events.filter(e=>e.type==='rushBlastHit').length,6);
  assert.equal(events.filter(e=>e.type==='rushBlast').length,6);
  assert.ok(events.filter(e=>e.type==='rushBlast').every(e=>e.data.radius===135));
  assert.ok(r.combat.enemies.has('chain/7'));assert.ok(r.combat.enemies.has('chain/8'));
 }finally{r.dispose();}
});

test('no blast without Rush; an armored survivor does not relay a blast',()=>{
 for(const rush of [false,true]){
  const events=[],r=createRun(2,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
  try{
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   r.combat.add({id:'first',kind:'fang',x:0,y:-200,pinned:true,delay:99999,wave:true});
   const armor=r.combat.add({id:'armor',kind:'bastion',x:120,y:-200,pinned:true,delay:99999,wave:true});
   r.combat.add({id:'far',kind:'fang',x:240,y:-200,pinned:true,delay:99999,wave:true});
   const hp=armor.hp;r.state.phase='playing';r.state.wave.entry=0;r.state.invul=99999;r.state.drive=rush?250:0;
   placePlayer(r.world,{x:0,y:-80});stopPlayer(r.world);r.dash({x:0,y:-42,power:1});for(let i=0;i<8;i++)r.tick();
   assert.equal(armor.hp,hp-(rush?1:0));assert.equal(events.filter(e=>e.type==='rushBlastHit').length,rush?1:0);
   assert.ok(r.combat.enemies.has('far'));
  }finally{r.dispose();}
 }
});
