import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {drawReleaseCut,drawSettledSeam,drawPlatformSettlement} from '../src/art/splatr-art-engine.js';
const render=(world='twilight',age=12,angle=0,motion=true)=>{const canvas=createCanvas(360,320);drawReleaseCut(canvas.getContext('2d'),{x:180,y:160,age,angle},motion,{world});return canvas;};
test('release reveals distinct world construction, follows cut and expires without a global flash',()=>{
 const worlds=['twilight','foundry','manga','void','synth','tokyo'].map(world=>render(world).toBuffer('image/png'));for(let i=1;i<worlds.length;i++)assert.notDeepEqual(worlds[0],worlds[i]);assert.notDeepEqual(worlds[0],render('twilight',12,1).toBuffer('image/png'));assert.deepEqual(render('twilight',64).toBuffer('image/png'),createCanvas(360,320).toBuffer('image/png'));
 const data=render().getContext('2d').getImageData(0,0,360,320).data;let count=0;for(let y=0;y<320;y++)for(let x=0;x<360;x++)if(data[(y*360+x)*4+3]){count++;assert.ok(x>75&&x<285&&y>45&&y<275);}assert.ok(count>1000);
});
test('release quiets rapidly, reduced geometry stays fixed, and drawing restores context',()=>{
 const alpha=age=>render('manga',age).getContext('2d').getImageData(0,0,360,320).data.reduce((sum,v,i)=>sum+(i%4===3?v:0),0);assert.ok(alpha(40)<alpha(12)*.4);
 for(const fn of [c=>drawReleaseCut(c,Object.freeze({x:180,y:160,age:8}),false,{world:'manga'}),c=>drawSettledSeam(c,{x:180,y:160}),c=>drawPlatformSettlement(c,{x:20,y:100,w:300,h:24},{age:4,motion:false})]){const ctx=createCanvas(360,320).getContext('2d');ctx.globalAlpha=.4;ctx.lineWidth=6;ctx.translate(2,4);const matrix=ctx.getTransform();fn(ctx);assert.equal(ctx.globalAlpha,.4);assert.equal(ctx.lineWidth,6);assert.deepEqual(ctx.getTransform(),matrix);}
});
test('actual success creates rest evidence once, skip cannot create it, next wave clears it',async()=>{
 const {createRun}=await import('../src/run.js'),{placePlayer,stopPlayer}=await import('../src/physics.js');for(const success of [true,false]){const events=[],r=createRun(41,t=>events.push(t),{waveMode:true});try{
 r.state.phase='playing';r.state.wave.number=5;r.state.wave.entry=0;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const b=r.state.wave.breach;
 if(success){r.state.breakthrough.sonic=true;b.ready=true;b.armed=true;b.readyShot=r.state.shots;placePlayer(r.world,{x:b.x-70,y:b.y});stopPlayer(r.world);b.previous={...r.world.player.position};r.dash({x:42,y:0,power:1});for(let i=0;i<8&&r.state.wave.phase==='breach';i++)r.tick();assert.equal(events.filter(t=>t==='dimensionBreak').length,1);assert.ok(r.state.wave.shatterTrace);assert.equal(r.state.wave.shattered,true);}else{assert.equal(r.skipBreach(),true);assert.equal(r.state.wave.shatterTrace,null);}
 const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<40&&r.state.wave.phase!=='choose';i++)r.tick();assert.equal(r.state.wave.phase,'choose');assert.equal(r.chooseWaveBuff(r.state.wave.offers[0].id),true);assert.equal(r.state.wave.shatterTrace,null);
 }finally{r.dispose();}}
});
