import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createCanvas} from '@napi-rs/canvas';
import {drawLiveCombatSlash,drawLiveCombatDash,drawLiveCombatImpact,drawLiveThreatAccent} from '../src/art/splatr-art-engine.js';
const paint=fn=>{const cv=createCanvas(420,300);fn(cv.getContext('2d'));return createHash('sha256').update(cv.toBuffer('image/png')).digest('hex');},blank=paint(()=>{});
test('default/free equipment has visible live attack, dash, hit and threat feedback',()=>{
 assert.notEqual(paint(c=>drawLiveCombatSlash(c,{x:200,y:150,age:3})),blank);
 assert.notEqual(paint(c=>drawLiveCombatDash(c,{x:200,y:150,age:3})),blank);
 for(const type of ['cut','armor','hurt','break'])assert.notEqual(paint(c=>drawLiveCombatImpact(c,{type,x:200,y:150},3)),blank,type);
 assert.notEqual(paint(c=>drawLiveThreatAccent(c,{mode:'tell',r:24,clock:10,span:60},{x:200,y:150})),blank);
});
test('all combat visual clocks seek, expire and respect reduced motion',()=>{
 for(const fn of [drawLiveCombatSlash,drawLiveCombatDash]){assert.equal(paint(c=>fn(c,{x:200,y:150,age:100})),blank);assert.equal(paint(c=>fn(c,{x:NaN,y:150,age:3})),blank);assert.notEqual(paint(c=>fn(c,{x:200,y:150,age:2})),paint(c=>fn(c,{x:200,y:150,age:7})));}
 assert.equal(paint(c=>drawLiveCombatDash(c,{x:200,y:150,age:2,motion:false})),blank);
 assert.equal(paint(c=>drawLiveCombatSlash(c,{x:200,y:150,age:2,motion:false})),paint(c=>drawLiveCombatSlash(c,{x:200,y:150,age:7,motion:false})));
 for(const type of ['cut','armor','hurt','break'])assert.equal(paint(c=>drawLiveCombatImpact(c,{type,x:200,y:150},16)),blank);
});
test('combat drawings restore canvas state and never mutate authority snapshots',()=>{
 const cv=createCanvas(420,300),c=cv.getContext('2d'),equipment=Object.freeze({core:'standard',dash:'dash-auto'}),hit=Object.freeze({type:'cut',x:200,y:150,equipment,contact:Object.freeze({angle:.3,strength:.8})});
 for(const fn of [()=>drawLiveCombatSlash(c,{x:200,y:150,age:3,equipment}),()=>drawLiveCombatDash(c,{x:200,y:150,age:3,equipment}),()=>drawLiveCombatImpact(c,hit,3),()=>drawLiveThreatAccent(c,{mode:'rush',r:24},{x:200,y:150})]){c.globalAlpha=.42;c.lineWidth=7;c.setLineDash([2,6]);const tx=c.getTransform();fn();assert.equal(c.globalAlpha,.42);assert.equal(c.lineWidth,7);assert.deepEqual(c.getTransform(),tx);assert.deepEqual(c.getLineDash(),[2,6]);}
});
test('production renderer receives real starter-kit kill receipts without changing run state during draw',async()=>{
 const [{createRenderer},{createRun},{installDom,createDisplay}]=await Promise.all([import('../src/renderer.js'),import('../src/run.js'),import('./support/display.js')]);const dom=installDom(),{canvas}=createDisplay(960,540);let renderer;const run=createRun(81,(type,data)=>renderer?.event(type,data,true),{waveMode:true});renderer=createRenderer(canvas);
 try{Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,stop:1});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);assert.ok(run.dash({x:25,y:0,power:.6}));const p=run.world.player.position,e=run.combat.add({id:'live-cut-proof',kind:'fang',x:p.x+20,y:p.y,hp:1,pinned:true,delay:99999});run.combat.contacts.add(e);run.state.stop=1;run.tick();renderer.tick(run,true);assert.ok(run.state.kills>=1);assert.equal(renderer.effectState().liveCombat.version,2);assert.ok(renderer.effectState().liveCombat.impacts>=1);const snapshot=JSON.stringify({hp:run.state.hp,kills:run.state.kills,clock:run.world.clock,blade:run.state.blade,velocity:run.world.player.velocity});for(let i=0;i<3;i++)renderer.draw(run,1,null,true);assert.equal(JSON.stringify({hp:run.state.hp,kills:run.state.kills,clock:run.world.clock,blade:run.state.blade,velocity:run.world.player.velocity}),snapshot);renderer.reset(81);assert.equal(renderer.effectState().liveCombat.impacts,0);}finally{renderer.dispose();run.dispose();dom.uninstall();}
});
