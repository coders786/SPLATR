import test from 'node:test';import assert from 'node:assert/strict';
import {beginPull,movePull,resolvePull} from '../src/pull-control.js';
import {createRun} from '../src/run.js';
test('pull session latches without rendering, maps CSS distance continuously and preserves direction',()=>{
 for(const type of ['mouse','touch'])for(const travel of [62,120,150])for(let angle=0;angle<6.28;angle+=.3){
 let s=beginPull({x:100,y:100,type,travel});Object.freeze(s);s=movePull(s,100+Math.cos(angle)*25,100+Math.sin(angle)*25);let previous=0;
 for(let distance=25;distance<210;distance+=3){s=movePull(s,100+Math.cos(angle)*distance,100+Math.sin(angle)*distance);const {vector}=resolvePull(s);const speed=Math.hypot(vector.x,vector.y);assert.ok(speed>=11.75&&speed<=42.00001);assert.ok(speed>=previous-1e-8);assert.ok(Math.abs(vector.x*Math.sin(angle)-vector.y*Math.cos(angle))<1e-8);previous=speed;}
 const relaxed=movePull(s,100,113);assert.equal(resolvePull(relaxed).gesture.kind,'pull');assert.equal(resolvePull(movePull(relaxed,100,102)).gesture.kind,'cancel');
 }
});
test('zero-cut cube on launch deck recovers exactly one escape cut instead of a permanent softlock',()=>{
 const r=createRun(12,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=99999;r.state.edge=0;for(let i=0;i<300;i++)r.tick();assert.ok(r.world.grounded);assert.equal(r.state.edge,1);assert.equal(r.state.shots,0);assert.equal(r.state.score,0);
 for(let i=0;i<300;i++)r.tick();assert.equal(r.state.edge,1,'deck does not fill rack');const y=r.world.player.position.y;assert.equal(r.dash({x:0,y:-30,power:30/42}),true);for(let i=0;i<8;i++)r.tick();assert.ok(r.world.player.position.y<y-30);assert.equal(r.state.shots,1);
 }finally{r.dispose();}
});

test('quick zero-cut upward release escapes before the recovery timer, without minting cuts on invalid input',()=>{
 const r=createRun(12,()=>{},{waveMode:true});try{r.state.phase='playing';r.state.invul=99999;for(let i=0;i<60;i++)r.tick();r.state.edge=0;
 assert.equal(r.dash({x:NaN,y:-30,power:1}),false);assert.equal(r.state.edge,0);assert.equal(r.dash({x:0,y:30,power:1}),false);assert.equal(r.state.edge,0);
 const y=r.world.player.position.y;assert.equal(r.dash({x:0,y:-30,power:30/42}),true);assert.equal(r.state.edge,0);assert.equal(r.state.shots,1);for(let i=0;i<8;i++)r.tick();assert.ok(r.world.player.position.y<y-30);
 }finally{r.dispose();}
});
