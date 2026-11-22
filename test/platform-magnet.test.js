import test from 'node:test';import assert from 'node:assert/strict';import {platformMagnet} from '../src/platform-magnet.js';import {createRun} from '../src/run.js';import {placePlayer,setPlayerVelocity} from '../src/physics.js';
const q=Object.freeze({x:-150,y:100,w:300,h:24});
test('rest magnet bounds force, yields to aiming/new launch and ignores distant/combat positions',()=>{
 const p=Object.freeze({x:200,y:0}),v=Object.freeze({x:42,y:30});const m=platformMagnet(q,p,v);assert.equal(m.active,true);assert.ok(Math.abs(m.vx)<=14&&m.vy<=9);for(const options of [{active:false},{held:true},{launchGrace:2},{dt:0}])assert.equal(platformMagnet(q,p,v,options).active,false);assert.equal(platformMagnet(q,{x:900,y:0},v).active,false);assert.equal(platformMagnet(q,{x:NaN,y:0},v).active,false);
});
test('below-deck routes around the end before rising instead of pulling through solid',()=>{
 assert.equal(platformMagnet(q,{x:0,y:160},{x:0,y:0}).route,'around');const rise=platformMagnet(q,{x:215,y:160},{x:0,y:0});assert.equal(rise.route,'rise');assert.ok(rise.vy<0);
});
test('real rest platform captures overshoots and below-deck returns with one required choice',()=>{
 for(const start of [{x:190,y:-85,vx:30,vy:12},{x:0,y:65,vx:0,vy:0},{x:-190,y:-85,vx:-30,vy:12}]){
 const events=[],r=createRun(51,(type)=>events.push(type),{waveMode:true});try{r.state.phase='playing';r.state.invul=99999;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+q.w/2+start.x,y:q.y+start.y});setPlayerVelocity(r.world,start.vx,start.vy);
 for(let i=0;i<480&&r.state.wave.phase!=='choose';i++)r.tick();assert.equal(r.state.wave.phase,'choose',JSON.stringify(start));assert.equal(events.filter(e=>e==='waveRest').length,1);assert.equal(r.state.wave.offers.length,3);assert.equal(r.state.wave.number,1);assert.equal(r.state.shots,0);assert.equal(r.state.score,0);
 }finally{r.dispose();}}
});
test('near arena edges the underneath route chooses the reachable end',()=>{
 const arena={x:-900,y:-1250,w:1800,h:1550};for(const side of [-1,1]){const q={x:side<0?-860:560,y:-300,w:300,h:24};const p={x:q.x+150,y:-240};const result=platformMagnet(q,p,{x:0,y:0},{arena});assert.ok(result.targetX>arena.x+30&&result.targetX<arena.x+arena.w-30);assert.equal(Math.sign(result.vx),-side);}
});
test('platform magnet artwork is visible, context-safe and stationary in reduced motion',async()=>{
 const {createCanvas}=await import('@napi-rs/canvas'),{drawPlatformMagnet}=await import('../src/art/splatr-art-engine.js');const draw=time=>{const canvas=createCanvas(360,220),ctx=canvas.getContext('2d');ctx.globalAlpha=.7;ctx.lineWidth=5;drawPlatformMagnet(ctx,{x:30,y:150,w:300,h:24},{active:true,time,motion:false});assert.equal(ctx.globalAlpha,.7);assert.equal(ctx.lineWidth,5);return canvas;};assert.deepEqual(draw(0).toBuffer('image/png'),draw(50).toBuffer('image/png'));assert.ok(draw(0).getContext('2d').getImageData(0,0,360,220).data.some((v,i)=>i%4===3&&v));
});
