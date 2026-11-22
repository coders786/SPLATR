import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTROL_DRILLS,controlCue,createControlSession,controlDrill} from '../src/control-practice.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
import {roundReward} from '../src/round-rewards.js';
import {createRun} from '../src/run.js';

test('cues distinguish charging, ready, surge, missed window, Sonic and physical rest without mislabeling recharge',()=>{
 const s={wave:{phase:'breach',pace:{progress:90}},breakthrough:{}};
 assert.equal(controlCue(s).stage,'pace');assert.equal(controlCue(s).progress,.5);
 s.breakthrough={paceReady:true};assert.equal(controlCue(s).stage,'launch');
 s.breakthrough={paceReady:true,surgeSpent:true,surgeTicks:30};assert.equal(controlCue(s).stage,'surge');assert.match(controlCue(s).hint,/0.5s/);
 s.breakthrough.surgeTicks=0;s.breakthrough.recharge=45;assert.equal(controlCue(s).stage,'recharge');assert.equal(controlCue(s).progress,.5);assert.doesNotMatch(controlCue(s).title,/BANK/);
 s.breakthrough.sonic=true;assert.equal(controlCue(s).stage,'breach');assert.equal(controlCue(s,'bank').complete,true);
 s.wave.phase='return';assert.equal(controlCue(s).stage,'land');s.wave.phase='choose';assert.equal(controlCue(s).complete,true);assert.equal(controlCue(s,'breach').title,'BREACH COMPLETE');
 assert.ok(Object.isFrozen(controlCue(s)));assert.equal(controlDrill('unknown').id,'route');assert.equal(CONTROL_DRILLS.length,3);
});
test('practice sessions disclose isolated preloads, contain no enemies, pay nothing and require a fresh launch',()=>{
 for(const drill of ['route','bank','breach']){const session=createControlSession({drill}),r=session.run;try{
 assert.equal(r.state.practice,true);assert.equal(r.state.killLedger,null);assert.equal(r.combat.enemies.size,0);assert.equal(session.start(),true);assert.equal(session.start(),false);assert.equal(r.state.wave.phase,'breach');assert.equal(r.state.breakthrough.paceReady,drill!=='route');assert.equal(r.state.breakthrough.sonic,drill==='breach');
 const before=r.state.elapsed;for(let i=0;i<120;i++)session.tick();assert.equal(r.state.elapsed,before,'idle opening cannot farm gravity pace');assert.equal(r.state.shots,0);assert.equal(r.state.shatters,0);assert.equal(r.state.kills,0);assert.equal(r.state.wave.phase,'breach');assert.deepEqual(roundReward({...r.state,score:100000,kills:500}),{base:0,cuts:0,score:0,sectors:0,total:0});
 }finally{session.dispose();session.dispose();}}
 const r=createRun(841,()=>{},{waveMode:true});try{assert.equal(r.state.practice,false);assert.equal(r.state.wave.number,1);assert.ok(r.combat.enemies.size>0);assert.equal(roundReward(r.state).base,10);}finally{r.dispose();}
});
test('full real default-kit practice route earns its own pace/Hyper/Sonic, deliberately shatters and physically rests',()=>{
 const events=[],session=createControlSession({emit:type=>events.push(type)}),r=session.run;try{
 session.start();for(let i=0;i<2000&&!r.state.breakthrough.sonic;i++){if(i%24===0)r.dash({x:(Math.sign(r.world.player.velocity.x)||1)*41,y:-8,power:1});session.tick();}
 assert.ok(r.state.breakthrough.paceReady);assert.ok(events.includes('paceHeld'));assert.ok(events.includes('hyperSurge'));assert.ok(events.includes('sonicBank'));assert.equal(r.state.shatters,0);
 for(let i=0;i<300&&r.state.wave.phase==='breach';i++){if(i%12===0)r.dash(r.aimAt(r.state.wave.breach,false));session.tick();}
 assert.equal(r.state.shatters,1);assert.equal(r.state.wave.phase,'return');assert.equal(session.cue.stage,'land');
 const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<60&&!session.cue.complete;i++)session.tick();assert.equal(session.cue.complete,true);assert.equal(r.state.wave.phase,'choose');const elapsed=r.state.elapsed;for(let i=0;i<50;i++)session.tick();assert.equal(r.state.elapsed,elapsed);assert.equal(events.filter(t=>t==='dimensionBreak').length,1);assert.equal(roundReward(r.state).total,0);
 }finally{session.dispose();}
});
test('a failed drill surge must recharge by movement; aim holds and idle cannot advance it',()=>{
 const session=createControlSession({drill:'bank'}),r=session.run;try{session.start();r.dash({x:0,y:3,power:.1});for(let i=0;i<120;i++)session.tick();assert.equal(session.cue.stage,'recharge');const initial=r.state.breakthrough.recharge;r.focus(true);for(let i=0;i<120;i++)session.tick();assert.ok(r.state.breakthrough.recharge<=initial);assert.equal(r.state.breakthrough.sonic,false);assert.equal(session.cue.complete,false);}finally{session.dispose();}
});
