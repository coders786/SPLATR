import test from 'node:test';
import assert from 'node:assert/strict';
import {createBreakthrough,stepBreakthrough,launchSurge,bankBreakthrough,placeBreach,crossesBreach} from '../src/breakthrough.js';
import {createRun} from '../src/run.js';
import {placePlayer,stopPlayer} from '../src/physics.js';
function advance(r){for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.state.stop=0;r.tick();if(r.state.wave.phase==='breach')return;const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<30&&r.state.wave.phase!=='choose';i++)r.tick();r.chooseWaveBuff(r.state.wave.offers[0].id);}
function milestone(){const events=[],r=createRun(41,(type,data)=>events.push({type,...data}),{waveMode:true});r.state.phase='playing';r.state.invul=99999;for(let i=0;i<4;i++)advance(r);assert.equal(r.state.wave.number,5);r.state.wave.entry=0;advance(r);assert.equal(r.state.wave.phase,'breach');return {r,events};}
test('pace arms a deliberate one-shot surge; valid bank in its window earns Sonic',()=>{
 const a=createBreakthrough();assert.equal(launchSurge(a).boost,false);const b=stepBreakthrough(a,{paceHeld:true});const c=launchSurge(b);assert.equal(a.paceReady,false);assert.equal(c.boost,true);assert.equal(launchSurge(c.state).boost,false);const d=bankBreakthrough(c.state);assert.equal(d.sonic,true);assert.equal(d.state.sonic,true);assert.equal(bankBreakthrough(d.state).sonic,false);assert.equal(launchSurge(d.state).boost,false);
});
test('failed window can recharge by moving, not by waiting, focus or paused simulation',()=>{
 let p=launchSurge(stepBreakthrough(createBreakthrough(),{paceHeld:true})).state;
 for(let i=0;i<90;i++)p=stepBreakthrough(p);assert.equal(p.surgeTicks,0);assert.equal(p.surgeSpent,true);const idle=p;
 for(let i=0;i<200;i++)p=stepBreakthrough(p,{atPace:true,holding:true});assert.equal(p.surgeSpent,true);
 assert.equal(stepBreakthrough(p,{active:false,paceHeld:true}),p);
 for(let i=0;i<90;i++)p=stepBreakthrough(p,{atPace:true});assert.equal(p.surgeSpent,false);assert.ok(launchSurge(p).boost);assert.equal(idle.surgeSpent,true);
});
test('breach placement stays in current view/arena and swept crossing handles high speeds',()=>{
 const a={x:-900,y:-1250,w:1800,h:1550};for(const p of [{x:0,y:0},{x:860,y:260},{x:-860,y:-1200}]){
 const v={x:p.x-180,y:p.y-200,w:360,h:400},q=placeBreach(a,p,v);assert.ok(q.x>=a.x+100&&q.x<=a.x+a.w-100&&q.y>=a.y+100&&q.y<=a.y+a.h-100);assert.ok(q.x>=v.x+60&&q.x<=v.x+v.w-60&&q.y>=v.y+60&&q.y<=v.y+v.h-60);}
 assert.ok(crossesBreach({x:-300,y:0},{x:300,y:0},{x:0,y:0,r:42}));assert.equal(crossesBreach({x:-300,y:100},{x:300,y:100},{x:0,y:0}),false);assert.equal(crossesBreach({x:0,y:0},{x:0,y:0},{x:0,y:0}),false);
});
test('fifth-wave clear opens safe finish path; skip keeps rewards without a shatter or second portal',()=>{
 const {r}=milestone();try{const ledger=JSON.stringify(r.state.killLedger);assert.equal(r.combat.enemies.size,0);for(let i=0;i<120;i++)r.tick();assert.equal(r.state.wave.phase,'breach');assert.equal(r.state.edge,r.state.edgeMax);assert.ok(r.state.invul>0);assert.equal(JSON.stringify(r.state.killLedger),ledger);
 assert.equal(r.skipBreach(),true);assert.equal(r.state.wave.phase,'return');assert.equal(r.state.shatters,0);assert.equal(r.state.wave.report.shattered,false);assert.equal(r.skipBreach(),false);
 }finally{r.dispose()}
});
test('default kit can earn pace, Hyper, Sonic and deliberately shatter after all enemies are gone',()=>{
 const {r,events}=milestone();try{
 // Set up a clear practice lane, not a pre-earned meter or artificial velocity.
 placePlayer(r.world,{x:0,y:-650});stopPlayer(r.world);r.state.wave.breach.previous={...r.world.player.position};
 let ticks=0;for(;ticks<2000&&!r.state.wave.breach?.ready;ticks++){
 if(ticks%24===0){const direction=Math.sign(r.world.player.velocity.x)||1;r.dash({x:direction*41,y:-8,power:1});}r.tick();}
 assert.ok(r.state.breakthrough.paceReady,JSON.stringify(r.state.breakthrough));assert.ok(events.some(e=>e.type==='hyperSurge'));assert.ok(events.some(e=>e.type==='sonicBank'));assert.ok(r.state.wave.breach.ready);
 const priorShots=r.state.shots;for(let i=0;i<3;i++)r.tick();assert.equal(r.state.shatters,0,'ready alone does not auto-complete');assert.equal(r.state.shots,priorShots);
 for(let i=0;i<300&&r.state.wave.phase==='breach';i++){if(i%12===0)r.dash(r.aimAt(r.state.wave.breach,false));r.tick();}
 assert.equal(r.state.wave.phase,'return');assert.equal(r.state.shatters,1);assert.equal(r.state.wave.report.shattered,true);assert.equal(events.filter(e=>e.type==='dimensionBreak').length,1);assert.ok(r.state.wave.shatterFx);assert.ok(r.state.wave.platform);
 }finally{r.dispose()}
});
