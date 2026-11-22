import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeedPace,stepSpeedPace,paceTarget} from '../src/speed-pace.js';
import {createRun} from '../src/run.js';
import {setPlayerVelocity} from '../src/physics.js';
test('wave target increases but caps within default launch capability',()=>{
 assert.equal(paceTarget(1),18);assert.equal(paceTarget(2),19.5);assert.equal(paceTarget(100),30);assert.equal(paceTarget(-3),18);
});
test('real speed is separate from smoothed display and cannot earn while stationary',()=>{
 const initial=createSpeedPace();let p=stepSpeedPace(initial,{speed:30});assert.equal(initial.progress,0);assert.equal(p.progress,1);assert.equal(p.speed,30);assert.equal(p.displaySpeed,30,'first live sample is not a fake ramp from zero');
 p=stepSpeedPace(p,{speed:0});assert.equal(p.speed,0);assert.equal(p.progress,1);assert.equal(p.status,'recover');assert.ok(p.displaySpeed>0&&p.displaySpeed<30);
});
test('brief dips preserve progress, prolonged slowing drains gradually, recovery resumes',()=>{
 let p=createSpeedPace();for(let i=0;i<90;i++)p=stepSpeedPace(p,{speed:24});
 for(let i=0;i<45;i++)p=stepSpeedPace(p,{speed:0});assert.equal(p.progress,90);
 p=stepSpeedPace(p,{speed:0});assert.ok(p.progress<90&&p.progress>89);p=stepSpeedPace(p,{speed:24});assert.equal(p.status,'holding');assert.equal(p.below,0);
 for(let i=0;i<200;i++)p=stepSpeedPace(p,{speed:24});assert.equal(p.held,true);assert.equal(p.progress,180);
 for(let i=0;i<900;i++)p=stepSpeedPace(p,{speed:0});assert.equal(p.progress,180,'earned per-wave practice is retained');
});
test('focus cannot earn, inactive simulation freezes and slow time advances proportionally',()=>{
 let a=createSpeedPace(),b=createSpeedPace();for(let i=0;i<60;i++)a=stepSpeedPace(a,{speed:24});for(let i=0;i<600;i++)b=stepSpeedPace(b,{speed:24,dt:.1});assert.ok(Math.abs(a.progress-b.progress)<1e-8);assert.ok(Math.abs(a.displaySpeed-b.displaySpeed)<1e-8);
 const copy={...a};for(let i=0;i<100;i++)a=stepSpeedPace(a,{speed:999,active:false});assert.deepEqual(a,copy);
 for(let i=0;i<100;i++)a=stepSpeedPace(a,{speed:99,holding:true});assert.ok(a.progress<copy.progress);assert.equal(a.held,false);
 assert.equal(stepSpeedPace(createSpeedPace(),{speed:NaN,dt:Infinity}).progress,0);
});
test('real run owns fresh pace per wave; rest cannot charge and clear never waits for practice',()=>{
 const r=createRun(131,()=>{},{waveMode:true});try{
 r.state.phase='playing';r.state.wave.entry=0;setPlayerVelocity(r.world,30,0);r.tick();assert.ok(r.state.wave.pace.speed>0);assert.ok(r.state.wave.pace.progress>0);
 for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();assert.equal(r.state.wave.phase,'return');assert.equal(r.state.wave.report.paceHeld,false);
 const progress=r.state.wave.pace.progress;for(let i=0;i<15;i++)r.tick();assert.equal(r.state.wave.pace.progress,progress);
 r.state.wave.phase='choose';r.state.wave.offers=[{id:'test'}];assert.equal(r.chooseWaveBuff('test'),true);assert.equal(r.state.wave.pace.target,19.5);assert.equal(r.state.wave.pace.progress,0);
 }finally{r.dispose()}
});
