import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/run.js';
import {placePlayer, stopPlayer} from '../src/physics.js';

function shotAt(run,x,y,dx=0,dy=-42,ticks=12){
  placePlayer(run.world,{x,y});stopPlayer(run.world);
  run.state.edge=run.state.edgeMax;run.state.invul=10000;
  assert.equal(run.dash({x:dx,y:dy,power:1}),true);
  for(let i=0;i<ticks;i++)run.tick();
}

test('lockdown accepts an immediate real launch, without a timed wait',()=>{
 const events=[];const run=createRun(2,(t)=>events.push(t),{waveMode:true,continuous:true,lockdownIntro:true});
 assert.equal(run.state.phase,'ready');assert.equal(run.state.narrative.intro,true);
 assert.equal(run.dash({x:0,y:-42,power:1}),true);
 for(let i=0;i<8;i++)run.tick();
 assert.equal(run.state.narrative.intro,false);assert.ok(events.includes('lockdownBreak'));
 assert.equal(run.state.narrative.sector,1);assert.equal(run.state.wave.phase,'combat');run.dispose();
});

test('locks require the live forward blade and seal requires all three plus an upward crossing',()=>{
 const events=[];const run=createRun(12,(t)=>events.push(t),{waveMode:true,continuous:true});
 run.state.phase='playing';run.state.invul=10000;
 const n=run.state.narrative,first=n.locks[0];
 assert.ok(run.world.engine.world.bodies.some(b=>b.label==='sector-seal'),'sealed barrier is a real solid');
 // A passive overlapping cube cannot destroy an anchor.
 placePlayer(run.world,{x:first.x,y:first.y});stopPlayer(run.world);run.tick();assert.equal(first.broken,false);
 // A live blade facing away cannot cut a lock behind it.
 shotAt(run,first.x,first.y+130,0,42,2);assert.equal(first.broken,false);
 shotAt(run,first.x,first.y+130);assert.equal(first.broken,true);
 let seal=n.seal;shotAt(run,seal.x,seal.y+130);assert.equal(n.sector,1,'two missing locks block the seal');
 for(const lock of n.locks.filter(l=>!l.broken))shotAt(run,lock.x,lock.y+130);
 assert.ok(n.locks.every(l=>l.broken));assert.equal(n.seal.ready,true);assert.ok(!run.world.engine.world.bodies.some(b=>b.label==='sector-seal'),'unlocked barrier no longer blocks the blade crossing');
 // Crossing downward does not count as an upward breakthrough.
 placePlayer(run.world,{x:seal.x,y:seal.y-130});stopPlayer(run.world);run.state.blade=0;run.tick();
 shotAt(run,seal.x,seal.y-130,0,42);assert.equal(n.sector,1);
 shotAt(run,seal.x,seal.y+130);assert.equal(n.sector,2);assert.equal(run.state.wave.phase,'combat');
 assert.equal(run.state.wave.cleared,1);assert.equal(events.filter(e=>e==='dimensionBreak').length,1);
 assert.equal([...run.combat.enemies.values()].filter(e=>e.id.startsWith('crown/prism/')).length,2);
 assert.equal(n.reaction.kind,'smug');run.dispose();
});

test('sectors continue through 04 with new locks and nonblocking reactions',()=>{
 const run=createRun(19,()=>{},{waveMode:true,continuous:true});run.state.phase='playing';
 for(let expected=2;expected<=4;expected++){
  const n=run.state.narrative,oldY=run.world.arena.y;
  for(const l of n.locks)shotAt(run,l.x,l.y+130);
  const seal=n.seal;shotAt(run,seal.x,seal.y+130);
  assert.equal(n.sector,expected);assert.equal(run.world.arena.y,oldY-850);
  assert.equal(n.locks.filter(l=>!l.broken).length,3);assert.equal(n.reaction.kind,expected===2?'smug':expected===3?'alarm':'split');
  assert.equal(run.state.phase,'playing');assert.equal(run.state.wave.phase,'combat');
 }
 run.dispose();
});

test('sector-three conduit damage follows actual prism destruction',()=>{
 const run=createRun(21,()=>{},{waveMode:true,continuous:true});run.state.phase='playing';
 for(let i=0;i<2;i++){
  for(const l of run.state.narrative.locks)shotAt(run,l.x,l.y+130);
  const q=run.state.narrative.seal;shotAt(run,q.x,q.y+130);
 }
 const n=run.state.narrative;assert.equal(n.sector,3);assert.equal(n.conduits,3);
 const prism=[...run.combat.enemies.values()].find(e=>e.kind==='prism');assert.ok(prism);
 // Dash into the actual combat entity; do not call the director or edit conduit state.
 shotAt(run,prism.x,prism.y+130);
 assert.equal(run.combat.enemies.has(prism.id),false);assert.equal(n.conduits,2);assert.ok(n.sparkAge>0);
 run.dispose();
});
