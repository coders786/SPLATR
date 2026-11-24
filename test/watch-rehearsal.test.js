import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTeachingSession,THE_WATCH,TEACHING_SCENARIOS,WATCH_REDUCED_SCALE,WATCH_TELEGRAPH_SCALE} from '../src/teaching.js';
import {placePlayer,stopPlayer,setPlayerVelocity} from '../src/physics.js';
import {createRun} from '../src/run.js';

function until(session,predicate,limit=500){
 for(let i=0;i<limit&&!predicate();i++)session.tick();
 assert.equal(predicate(),true,`condition not reached: ${session.lesson.id} / ${session.phase}`);
}
function cutFirst(session){
 const run=session.run,enemy=[...run.combat.enemies.values()][0];
 placePlayer(run.world,{x:enemy.x-70,y:enemy.y});
 stopPlayer(run.world);
 assert.equal(run.dash({x:40,y:0,power:1}),true);
 session.tick();
}

test('THE WATCH opens on a real tell, dilates it, and follows real chip phases',()=>{
 const session=createTeachingSession({scenario:'fang',rehearsal:true});
 try{
  const run=session.run;
  assert.equal(session.phase,'idle');
  assert.equal(session.chip,THE_WATCH.idle.chip);
  assert.equal(run.state.practice,true);
  assert.equal(run.state.killLedger,null);
  assert.equal(run.combat.enemies.size,1);
  until(session,()=>session.phase==='tell',120);
  assert.equal(session.chip,THE_WATCH.tell.chip);
  assert.equal(run.world.slow,true);
  assert.equal(run.world.slowScale,WATCH_TELEGRAPH_SCALE);
  for(let i=0;i<20;i++)session.tick();
  assert.equal(run.world.engine.timing.timeScale,WATCH_TELEGRAPH_SCALE);
  until(session,()=>session.phase==='resolve',300);
  assert.equal(session.chip,THE_WATCH.resolve.chip);
  assert.ok([...run.combat.enemies.values()].some(e=>e.mode==='rush'),'NOW. is backed by the active Fang rush');
  assert.deepEqual(session.phaseHistory.map(x=>x.phase).filter((x,i,a)=>i===0||x!==a[i-1]),['idle','tell','resolve']);
 } finally {session.dispose();}
});

test('a real dodge gets IT MISSED, while reduced motion uses the .6 rehearsal scale',()=>{
 const normal=createTeachingSession({scenario:'fang',rehearsal:true});
 try{
  const run=normal.run;until(normal,()=>normal.phase==='tell',120);
  placePlayer(run.world,{x:1000,y:1000});stopPlayer(run.world);
  until(normal,()=>normal.phase==='missed',360);
  assert.equal(normal.chip,THE_WATCH.missed.chip);
  assert.equal(run.state.hp,run.state.hpMax,'a dodge does not spend health');
 } finally {normal.dispose();}
 const reduced=createTeachingSession({scenario:'pulse',rehearsal:true,reducedMotion:true});
 try{
  until(reduced,()=>reduced.phase==='tell',120);
  for(let i=0;i<18;i++)reduced.tick();
  assert.equal(reduced.run.world.slowScale,WATCH_REDUCED_SCALE);
  assert.equal(reduced.run.world.engine.timing.timeScale,WATCH_REDUCED_SCALE);
  assert.equal(reduced.chip,THE_WATCH.tell.chip);
 } finally {reduced.dispose();}
});

test('a real collision becomes IT FOUND YOU before the rehearsal repeats',()=>{
 const session=createTeachingSession({scenario:'fang',rehearsal:true});
 try{
  until(session,()=>session.phase==='resolve',300);
  const run=session.run,enemy=[...run.combat.enemies.values()][0];
  run.state.hp=2;run.state.invul=0;placePlayer(run.world,{x:enemy.x,y:enemy.y});stopPlayer(run.world);session.tick();
  assert.equal(session.phase,'hurt');
  assert.equal(session.chip,THE_WATCH.hurt.chip);
  assert.equal(run.state.hp,1);
 } finally {session.dispose();}
});

test('death is a silent repeat, not a fail state, and rehearsal rewards stay empty',()=>{
 const session=createTeachingSession({scenario:'fang',rehearsal:true});
 try{
  const run=session.run;until(session,()=>session.phase==='resolve',300);
  const enemy=[...run.combat.enemies.values()][0];
  run.state.hp=1;run.state.invul=0;placePlayer(run.world,{x:enemy.x,y:enemy.y});stopPlayer(run.world);
  for(let i=0;i<50&&session.restarted===0;i++)session.tick();
  assert.equal(session.restarted,1);
  assert.equal(run.state.phase,'playing');
  assert.equal(run.state.hp,run.state.hpMax);
  assert.equal(run.combat.enemies.size,1);
  assert.ok(session.events.includes('over'));
  assert.ok(session.events.includes('rehearsalRestart'));
  assert.equal(run.state.fracture.pct,0);
  assert.equal(run.state.momentum.count,0);
  assert.equal(run.state.momentum.total,0);
  assert.equal(run.state.upgrades.length,0);
  assert.equal(run.state.killLedger,null);
 } finally {session.dispose();}
});

test('a first real cut ends the lesson and TRY AT SPEED reopens it at 1.0x',()=>{
 const session=createTeachingSession({scenario:'fang',rehearsal:true});
 try{
  cutFirst(session);
  assert.equal(session.complete,true);
  assert.equal(session.phase,'cut');
  assert.equal(session.chip,THE_WATCH.cut.chip);
  assert.equal(session.tryAtSpeed(),true);
  assert.equal(session.speedMode,'speed');
  assert.equal(session.complete,false);
  assert.equal(session.run.world.slowScale,null);
  assert.equal(session.run.world.slow,false);
  assert.equal(session.run.world.engine.timing.timeScale,1);
  assert.equal(session.run.state.phase,'playing');
 } finally {session.dispose();}
});

test('the Monolith lesson is a real reach rehearsal and never pays the run economy',()=>{
 const session=createTeachingSession({scenario:'monolith',rehearsal:true});
 try{
  const run=session.run,monolith=[...run.combat.enemies.values()][0];
  assert.equal(run.state.arenaMode,'SHATTERED');
  placePlayer(run.world,{x:monolith.x,y:monolith.y+130});stopPlayer(run.world);session.tick();
  assert.equal(session.complete,true);
  assert.equal(session.phase,'reach');
  assert.equal(session.chip,THE_WATCH.reach.chip);
  assert.equal(run.state.kills,0);
  assert.equal(run.state.fracture.pct,0);
  assert.equal(session.tryAtSpeed(),true);
  assert.equal(session.speedMode,'speed');
 } finally {session.dispose();}
});

test('all non-Monolith lessons expose their real enemy warning without the guided pause',()=>{
 for(const lesson of TEACHING_SCENARIOS.filter(x=>x.id!=='monolith')){
  const session=createTeachingSession({scenario:lesson.id,rehearsal:true});
  try{
   until(session,()=>session.phase==='tell'||session.phase==='resolve'||session.phase==='hurt',520);
   assert.ok(session.events.includes('waveStart'),lesson.id);
   assert.ok(session.phaseHistory.some(x=>x.phase==='tell'),`${lesson.id} needs a tell phase`);
   assert.equal(session.waiting,false,`${lesson.id} must not wait for NEXT STEP`);
  } finally {session.dispose();}
 }
});

test('the shipped UI contains the watch rehearsal, not the removed step/NEXT-STEP DOM',()=>{
 const source=readFileSync(new URL('../src/teaching-ui.js',import.meta.url),'utf8');
 assert.match(source,/createTeachingSession\(\{scenario:lesson\.id,rehearsal:true/);
 assert.match(source,/TRY AT SPEED/);
 assert.doesNotMatch(source,/teaching-step|NEXT STEP|continueStep/);
});

test('a live cut and a live clean bank are the only run-side momentum fills',()=>{
 const cutEvents=[];
 const fast=createRun(9,(type,data)=>cutEvents.push({type,data}),{waveMode:true});
 try{
  fast.state.phase='playing';fast.state.wave.entry=0;
  for(const e of [...fast.combat.enemies.values()])fast.combat.remove(e);
  fast.combat.add({id:'pace-target',kind:'fang',x:75,y:0,pinned:true,wavePlaced:true,delay:0});
  placePlayer(fast.world,{x:0,y:0});stopPlayer(fast.world);fast.dash({x:42,y:0,power:1});fast.tick();
  assert.equal(fast.state.momentum.count,1);
  const cut=cutEvents.find(e=>e.type==='cut');
  assert.ok(cut);
  assert.equal(cut.data.paceQualified,true);
  assert.equal(cut.data.momentumEarned,true);
  assert.ok(cut.data.speed>=cut.data.paceTarget);
  assert.ok(cutEvents.some(e=>e.type==='cut'));
 } finally {fast.dispose();}
 const slow=createRun(10,()=>{},{waveMode:true});
 try{
  slow.state.phase='playing';slow.state.wave.entry=0;
  for(const e of [...slow.combat.enemies.values()])slow.combat.remove(e);
  slow.combat.add({id:'slow-target',kind:'fang',x:75,y:0,pinned:true,wavePlaced:true,delay:0});
  placePlayer(slow.world,{x:0,y:0});stopPlayer(slow.world);slow.dash({x:8.4,y:0,power:.2});slow.tick();
  assert.equal(slow.state.momentum.count,0,'slow cuts score but do not fill a pip');
 } finally {slow.dispose();}
 const bankEvents=[];const bank=createRun(41,(type,data)=>bankEvents.push({type,data}),{waveMode:true});
 try{
  bank.state.phase='playing';bank.state.wave.entry=0;placePlayer(bank.world,{x:1450,y:-450});bank.dash({x:42,y:0,power:1});
  for(let i=0;i<100&&bank.state.wave.cleanBanks.total===0;i++)bank.tick();
  assert.equal(bank.state.wave.cleanBanks.total,1);
  assert.equal(bank.state.momentum.count,1,'the pace-qualified clean bank fills once');
  const clean=bankEvents.find(e=>e.type==='cleanBank');
  assert.ok(clean);
  assert.equal(clean.data.paceQualified,true);
  assert.equal(clean.data.momentumEarned,true);
  assert.ok(clean.data.incoming>=clean.data.paceTarget);
 } finally {bank.dispose();}
 const practice=createRun(42,()=>{},{waveMode:true,controlPractice:true});
 try{
  practice.state.phase='playing';practice.state.wave.entry=0;placePlayer(practice.world,{x:1450,y:-450});practice.dash({x:42,y:0,power:1});
  for(let i=0;i<100&&practice.state.wave.cleanBanks.total===0;i++)practice.tick();
  assert.equal(practice.state.wave.cleanBanks.total,1);
  assert.equal(practice.state.momentum.count,0,'practice banks do not grant progression');
 } finally {practice.dispose();}
});

test('the first Hyper rail boom reads measured arrival speed and diminishes above 160',()=>{
 const runAt=speed=>{
  const events=[],r=createRun(99,(type,data)=>events.push({type,data}),{waveMode:true});
  r.state.phase='playing';r.state.wave.entry=0;r.state.hyper=true;r.state.hyperBoom=true;r.state.hyperAge=1;r.state.sinceDash=true;
  r.world.playerCeiling=378;r.state.ceiling=378;placePlayer(r.world,{x:1550,y:0});setPlayerVelocity(r.world,speed,0);r.tick();
  const bank=events.find(x=>x.type==='bank');const after=Math.hypot(r.world.player.velocity.x,r.world.player.velocity.y);r.dispose();return {bank,after};
 };
 const low=runAt(160),high=runAt(320);
 assert.ok(low.bank&&high.bank);
 assert.ok(low.bank.data.after>low.bank.data.speed,'the first boom pays the low-speed ceiling');
 assert.ok(high.bank.data.after<high.bank.data.speed*1.25,'the high-speed bonus diminishes instead of a flat 1.35x');
 assert.ok(high.after>low.after,'the high arrival still feels faster, not capped to the low case');
});
