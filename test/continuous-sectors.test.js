import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {createRenderer} from '../src/renderer.js';
import {installDom,createDisplay} from './support/display.js';
import {placePlayer,stopPlayer} from '../src/physics.js';

function removeWave(run){for(const e of [...run.combat.enemies.values()])run.combat.remove(e);run.state.stop=0;run.tick();}

test('arcade starts immediately in a large arena, with no doorway or story state',()=>{
 const events=[];const run=createRun(2,t=>events.push(t),{waveMode:true,continuous:true,lockdownIntro:true});
 try {
  assert.deepEqual(run.world.arena,{x:-2400,y:-3300,w:4800,h:3600});
  assert.equal(run.state.phase,'ready');assert.equal(run.state.arcade.sector,1);
  assert.ok(run.combat.enemies.size>0);assert.ok(run.waveGoal());
  assert.ok(!run.world.engine.world.bodies.some(b=>['sector-seal','anchor-lock','lockdown-fracture'].includes(b.label)));
  for(const key of ['gate','narrative','cutscene','storyMoment','midWaveStorySeen'])assert.equal(key in run.state,false);
  assert.equal(run.dash({x:0,y:-42,power:1}),true);
  for(let i=0;i<8;i++)run.tick();
  assert.ok(!events.includes('lockdownBreak'));
 }finally{run.dispose();}
});

test('waves advance only after all enemies are gone, without moving walls or locking input',()=>{
 const events=[],run=createRun(19,t=>events.push(t),{waveMode:true,continuous:true});
 try {
  run.state.phase='playing';run.state.invul=99999;
  const arena={...run.world.arena};
  for(let next=2;next<=4;next++){
   const enemies=[...run.combat.enemies.values()];
   for(const e of enemies.slice(0,-1))run.combat.remove(e);
   run.state.stop=0;run.tick();assert.equal(run.state.wave.number,next-1);
   for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
   run.state.stop=0;run.tick();
   assert.equal(run.state.wave.number,next);assert.equal(run.state.arcade.sector,next);
   assert.deepEqual(run.world.arena,arena);assert.equal(run.state.phase,'playing');
   assert.ok(run.combat.enemies.size>0);assert.ok(!run.state.inputLock);
  }
  assert.equal(events.filter(x=>x==='waveClear').length,3);
  assert.ok(!events.includes('dimensionBreak'));
 }finally{run.dispose();}
});

test('formations spawn safely near the player at field edges and render',()=>{
 const dom=installDom();const run=createRun(23,()=>{},{waveMode:true,continuous:true});
 const {canvas,ctx}=createDisplay(880,710);const renderer=createRenderer(canvas);
 try {
  run.state.phase='playing';run.state.invul=99999;
  placePlayer(run.world,{x:2150,y:-3000});stopPlayer(run.world);removeWave(run);
  for(const enemy of run.combat.enemies.values()){
   assert.ok(enemy.x>=run.world.arena.x && enemy.x<=run.world.arena.x+run.world.arena.w);
   assert.ok(enemy.y>=run.world.arena.y && enemy.y<=run.world.arena.y+run.world.arena.h);
   assert.ok(Math.hypot(enemy.x-run.world.player.position.x,enemy.y-run.world.player.position.y)>=200);
  }
  renderer.tick(run,true);renderer.draw(run,1,null,true);assert.ok(ctx.__ops.length>0);
 }finally{renderer.dispose();run.dispose();dom.uninstall();}
});

test('a real final cut advances the arcade and pays the wave only once',()=>{
 const events=[],run=createRun(2,type=>events.push(type),{waveMode:true,continuous:true,postRewards:true});
 try{
  run.state.phase='playing';run.state.invul=9999;
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);
  run.combat.add({id:'last-fang',kind:'fang',x:0,y:-200,wave:true,pinned:true,delay:1000});
  placePlayer(run.world,{x:0,y:-80});stopPlayer(run.world);
  assert.equal(run.dash({x:0,y:-42,power:1}),true);
  for(let i=0;i<30&&run.state.wave.number===1;i++)run.tick();
  assert.equal(run.state.kills,1);assert.equal(run.state.wave.number,2);
  assert.equal(events.filter(e=>e==='waveClear').length,1);
  assert.ok(run.combat.enemies.size>0);
 }finally{run.dispose();}
});

test('Glass challenge is reachable at Wave 5 in arcade, once, and never in practice',()=>{
 for(const practice of [false,true]){
  const events=[],run=createRun(31,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true,controlPractice:practice});
  try{
   run.state.phase='playing';run.state.invul=99999;
   while(run.state.wave.number<5){
    const before=run.state.wave.number;
    removeWave(run);
    // Some waves introduce a boss after the ordinary enemies are removed.
    if(run.state.wave.number===before)removeWave(run);
    assert.equal(run.state.wave.number,before+1);
    if(run.state.wave.number<5)assert.equal(events.filter(e=>e.type==='challenge'&&e.data.id==='glass').length,0);
   }
   assert.equal(events.filter(e=>e.type==='challenge'&&e.data.id==='glass').length,practice?0:1);
   run.tick();assert.equal(events.filter(e=>e.type==='challenge'&&e.data.id==='glass').length,practice?0:1);
  }finally{run.dispose();}
 }
});
