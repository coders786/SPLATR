import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnPulseMine,stepPulseMines,PULSE_MINE} from '../src/pulse-mines.js';
const arena={x:-500,y:-500,w:1000,h:1000};
test('mine warns before arming, harms on swept contact and can be batted into an enemy',()=>{
 const mines=[],player={x:125,y:0};spawnPulseMine(mines,{x:0,y:0},player,arena);let hurts=0,bats=0,hits=0;
 const args={dt:1,arena,player,enemies:new Map(),onHurt:()=>hurts++,onBat:()=>bats++,onHit:()=>hits++};
 stepPulseMines(mines,args);assert.equal(hurts,0,'warning is harmless');
 mines[0].age=PULSE_MINE.arm;stepPulseMines(mines,args);assert.equal(hurts,1);assert.equal(mines.length,0);
 spawnPulseMine(mines,{x:0,y:0},player,arena);stepPulseMines(mines,{...args,blade:1,angle:0});assert.equal(bats,1);assert.equal(mines[0].friendly,true);
 const victim={id:'v',kind:'fang',hp:1,r:10,x:160,y:0};args.enemies.set(victim.id,victim);
 for(let i=0;i<4&&mines.length;i++)stepPulseMines(mines,args);
 assert.equal(hits,1);assert.equal(hurts,1);assert.equal(mines.length,0);
});
test('mine capacity is bounded',()=>{const mines=[];for(let i=0;i<10;i++)spawnPulseMine(mines,{x:0,y:0},{x:300,y:0},arena);assert.equal(mines.length,PULSE_MINE.cap);});

test('live arcade Pulse ring actually deploys a mine and active blade bats it',async()=>{
 const {createRun}=await import('../src/run.js');const {placePlayer,stopPlayer,setPlayerVelocity}=await import('../src/physics.js');
 const events=[],r=createRun(4,(type,data)=>events.push({type,data}),{waveMode:true,continuous:true});
 try{
  r.state.phase='playing';r.state.wave.entry=0;r.state.invul=9999;placePlayer(r.world,{x:0,y:-500});stopPlayer(r.world);
  r.combat.hazards.push({kind:'ring',source:'pulse',sourceId:'test-pulse',x:-125,y:-500,px:-125,py:-500,age:0,life:87,radius:20,previousRadius:20});
  r.tick();assert.equal(r.state.pulseMines.length,1);assert.ok(events.some(e=>e.type==='mineSpawn'&&e.data.first));
  r.state.blade=10;setPlayerVelocity(r.world,10,0);r.tick();
  assert.equal(r.state.pulseMines[0].friendly,true);assert.ok(events.some(e=>e.type==='mineBat'));
 }finally{r.dispose();}
});
