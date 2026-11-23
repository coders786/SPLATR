import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeachingSession, TEACHING_SCENARIOS, teachingReadout} from '../src/teaching.js';
import {createRun} from '../src/run.js';
import {placePlayer, stopPlayer} from '../src/physics.js';

function launchAtTarget(session) {
 const {run}=session, enemy=[...run.combat.enemies.values()][0];
 placePlayer(run.world,{x:enemy.x-55,y:enemy.y});stopPlayer(run.world);
 assert.equal(run.dash({x:30,y:0,power:1}),true);
 return enemy;
}

test('training covers every real enemy and uses isolated fresh runs',()=>{
 assert.deepEqual(new Set(TEACHING_SCENARIOS.map(s=>s.kind)),new Set(['fang','pulse','prism','fork','bastion','rift','well','crown']));
 assert.equal(new Set(TEACHING_SCENARIOS.map(s=>s.id)).size,TEACHING_SCENARIOS.length);
 for(const lesson of TEACHING_SCENARIOS){
  const session=createTeachingSession({scenario:lesson.id}),r=session.run;
  assert.equal(r.state.practice,true);assert.equal(r.state.killLedger,null);
  assert.equal(r.combat.enemies.size,lesson.count||1);
  assert.ok([...r.combat.enemies.values()].every(e=>e.kind===lesson.kind));
  for(let i=0;i<200;i++)session.tick();
  assert.equal(r.state.phase,'playing',`${lesson.id} remains usable while observing`);
  session.dispose();session.dispose();
 }
});

test('launch opens a real blade and parry, hits refund Edge and extend the blade',()=>{
 const session=createTeachingSession({scenario:'fang'}),r=session.run;
 launchAtTarget(session);const start=r.state.blade;
 assert.ok(start>0);assert.equal(r.state.parry,10);assert.equal(r.state.edge,r.state.edgeMax-1);
 session.tick();assert.ok(session.events.includes('cut'));assert.equal(r.state.edge,r.state.edgeMax);
 assert.ok(r.state.blade>start);assert.equal(session.complete,true);session.dispose();
 const fresh=createTeachingSession({scenario:'fang'});assert.equal(fresh.run.state.shots,0);assert.equal(fresh.run.state.blade,0);assert.equal(fresh.run.combat.enemies.size,1);fresh.dispose();
});

test('Fork actually spawns offspring and armor takes actual damage',()=>{
 const fork=createTeachingSession({scenario:'fork'});launchAtTarget(fork);fork.tick();
 assert.deepEqual([...fork.run.combat.enemies.values()].map(e=>[e.kind,e.small]),[['fang',true],['fang',true]]);
 assert.equal(fork.complete,false);fork.dispose();
 for(const [id,hp] of [['bastion',2],['crown',3]]){
  const s=createTeachingSession({scenario:id}),e=launchAtTarget(s);assert.equal(e.hp,hp);s.tick();assert.equal(e.hp,hp-1);assert.ok(s.events.includes('armor'));assert.equal(s.complete,false);s.dispose();
 }
});

test('attacking enemies produce genuine tells, hazards and linked-beam phases',()=>{
 for(const [id,hazard] of [['pulse','ring'],['prism','needle'],['crown','needle']]){
  const s=createTeachingSession({scenario:id});let found=false;
  for(let i=0;i<220;i++){s.tick();found ||= s.run.combat.hazards.some(h=>h.kind===hazard);if(s.waiting)s.continueStep();}
  assert.ok(s.events.includes('tell'),id);assert.ok(found,id);s.dispose();
 }
 const fang=createTeachingSession({scenario:'fang'});let rushed=false;for(let i=0;i<200;i++){fang.tick();rushed ||= [...fang.run.combat.enemies.values()].some(e=>e.mode==='rush');if(fang.waiting)fang.continueStep();}assert.ok(rushed);fang.dispose();
 const link=createTeachingSession({scenario:'link'}),phases=new Set();for(let i=0;i<220;i++){link.tick();for(const beam of link.run.combat.links)phases.add(beam.mode);if(link.waiting)link.continueStep();}assert.ok(phases.has('tell'));assert.ok(phases.has('live'));link.dispose();
 const normal=createRun(2,()=>{},{waveMode:true});assert.equal(normal.setPracticeLinks([]),false);normal.dispose();
});

test('opening guidance reflects the live blade, parry, rack and armor',()=>{
 const state={opening:{rest:false,row:0},blade:12.3,parry:4};let info=teachingReadout(state);
 assert.equal(info.title,'SLASH ACTIVE');assert.equal(info.remaining,12.3);assert.equal(info.parry,true);
 state.blade=0;assert.equal(teachingReadout(state).title,'SLASH ENDED');
 state.opening={rest:true,row:2};state.edge=2;assert.equal(teachingReadout(state,[{kind:'bastion',hp:1}]).title,'BASTION / ONE PLATE LEFT');
 assert.equal(teachingReadout({opening:null}),null);
});


test('real attack lessons pause on each actual cue and require explicit continuation',()=>{
 for(const id of ['fang','pulse','prism','link','fork','bastion','rift','well','crown']){
  const s=createTeachingSession({scenario:id});
  assert.equal(s.step[0],'tell',id);
  for(let i=0;i<220&&!s.waiting;i++)s.tick();
  assert.equal(s.waiting,true,`${id} real tell checkpoint`);assert.equal(s.step[0],'tell');
  const elapsed=s.run.state.elapsed;for(let i=0;i<30;i++)s.tick();assert.equal(s.run.state.elapsed,elapsed,`${id} really paused`);
  assert.equal(s.continueStep(),true);assert.equal(s.step[0],'attack');assert.equal(s.waiting,false);
  for(let i=0;i<220&&!s.waiting;i++)s.tick();
  assert.equal(s.waiting,true,`${id} actual attack checkpoint`);
  if(id==='fang')assert.ok([...s.run.combat.enemies.values()].some(e=>e.mode==='rush'));
  if(id==='link')assert.ok(s.run.combat.links.some(l=>l.mode==='live'));
  if(['pulse','prism','crown'].includes(id))assert.ok(s.run.combat.hazards.some(h=>h.source===id&&h.age>=8));
  if(['fork','bastion','rift','well'].includes(id))assert.ok(s.run.combat.hazards.some(h=>h.kind==='zone'&&h.source===id));
  s.continueStep();assert.equal(s.step[0],({crown:'armor',fork:'split',bastion:'armor',well:'pull'})[id]||'clear');s.dispose();
 }
});

test('steps track real actions, remember simultaneous outcomes and never fake a missed cue',()=>{
 const slash=createTeachingSession({scenario:'slash'});
 assert.ok([...slash.run.combat.enemies.values()].every(e=>e.pinned));
 launchAtTarget(slash);slash.tick();assert.equal(slash.step[0],'launch');assert.equal(slash.waiting,true);
 slash.continueStep();assert.equal(slash.step[0],'cut');assert.equal(slash.waiting,true,'same-tick cut is remembered');
 slash.continueStep();assert.equal(slash.step[0],'clear');slash.dispose();
 const early=createTeachingSession({scenario:'fang'});launchAtTarget(early);early.tick();assert.equal(early.complete,true);assert.equal(early.waiting,false);assert.equal(early.step[0],'tell');assert.equal(early.objectivesComplete,false);early.dispose();
 const observe=s=>{for(let j=0;j<2;j++){for(let i=0;i<260&&!s.waiting;i++)s.tick();assert.equal(s.waiting,true);s.continueStep();}};
 const fork=createTeachingSession({scenario:'fork'});observe(fork);launchAtTarget(fork);fork.tick();assert.equal(fork.step[0],'split');assert.equal(fork.waiting,true);fork.continueStep();assert.equal(fork.step[0],'clear');fork.dispose();
 const bastion=createTeachingSession({scenario:'bastion'});observe(bastion);launchAtTarget(bastion);bastion.tick();assert.equal(bastion.waiting,true);assert.equal(bastion.step[0],'armor');bastion.continueStep();assert.equal(bastion.step[0],'clear');bastion.dispose();
 const well=createTeachingSession({scenario:'well'});observe(well);const e=[...well.run.combat.enemies.values()][0];placePlayer(well.run.world,{x:e.x-150,y:e.y});stopPlayer(well.run.world);assert.ok(well.run.dash({x:0,y:-20,power:1}));well.tick();assert.equal(well.waiting,true);assert.equal(well.step[0],'pull');well.dispose();
});

test('a full Fang lesson advances through real warning, charge, cut and completion',()=>{
 const s=createTeachingSession({scenario:'fang'});
 try{
  for(let i=0;i<220&&!s.waiting;i++)s.tick();assert.equal(s.step[0],'tell');assert.equal(s.waiting,true);s.continueStep();
  for(let i=0;i<220&&!s.waiting;i++)s.tick();assert.equal(s.step[0],'attack');assert.equal(s.waiting,true);s.continueStep();
  assert.equal(s.step[0],'clear');launchAtTarget(s);for(let i=0;i<15&&!s.waiting;i++)s.tick();
  assert.equal(s.complete,true);assert.equal(s.waiting,true);assert.equal(s.step[0],'clear');
  assert.equal(s.continueStep(),true);assert.equal(s.objectivesComplete,true);assert.equal(s.continueStep(),false);
 }finally{s.dispose();}
});
