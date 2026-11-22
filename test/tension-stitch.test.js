import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {drawTensionStitch,resolveTensionStitch} from '../src/art/splatr-art-engine.js';
const draw=(extra={},motion=true)=>{const canvas=createCanvas(260,260);drawTensionStitch(canvas.getContext('2d'),{x:130,y:115,...extra},motion);return canvas;};
test('stitch follows actual milestones, not progress/strain or idle time',()=>{
 assert.equal(resolveTensionStitch({cue:{step:0,progress:1},strain:1}).step,0);assert.equal(resolveTensionStitch({cue:{step:1}}).step,1);assert.equal(resolveTensionStitch({ready:true}).step,2);
 const sealed=draw().toBuffer('image/png');assert.deepEqual(sealed,draw({age:1000,strain:1}).toBuffer('image/png'));assert.notDeepEqual(sealed,draw({cue:{step:1}}).toBuffer('image/png'));assert.notDeepEqual(sealed,draw({ready:true}).toBuffer('image/png'));
});
test('rejections distinguish held stitches, partial slow cut and fresh input without closing ready opening',()=>{
 const renders=['sealed','slow','fresh'].map(reason=>draw({ready:reason!=='sealed',feedback:{kind:reason==='sealed'?'BUILD SPEED':reason==='slow'?'MORE SPEED':'NEW DASH',reason,age:8,angle:.4}}).toBuffer('image/png'));assert.notDeepEqual(renders[0],renders[1]);assert.notDeepEqual(renders[1],renders[2]);
 const area=canvas=>Buffer.from(canvas.getContext('2d').getImageData(30,20,200,165).data);assert.deepEqual(area(draw({ready:true})),area(draw({ready:true,feedback:{reason:'fresh',kind:'NEW DASH',age:8}})));
});
test('reduced seam cue is stationary, immutable, bounded and context-safe',()=>{
 const q=Object.freeze({x:130,y:115,ready:true,feedback:Object.freeze({kind:'MORE SPEED',reason:'slow',age:6,angle:0})});const canvas=createCanvas(260,260),c=canvas.getContext('2d');c.globalAlpha=.4;c.lineWidth=5;c.translate(2,3);const before=c.getTransform();drawTensionStitch(c,q,false);assert.equal(c.globalAlpha,.4);assert.equal(c.lineWidth,5);assert.deepEqual(c.getTransform(),before);assert.deepEqual(draw(q,false).toBuffer('image/png'),draw(q,false).toBuffer('image/png'));
});
test('real rejected crossings carry reason metadata without shattering, damage or reward',async()=>{
 const {createRun}=await import('../src/run.js'),{placePlayer,stopPlayer}=await import('../src/physics.js');
 for(const reason of ['sealed','slow','fresh']){const events=[],r=createRun(41,(type,data)=>events.push({type,data}),{waveMode:true});try{r.state.phase='playing';r.state.wave.number=5;r.state.wave.entry=0;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const b=r.state.wave.breach;
 if(reason!=='sealed'){r.state.breakthrough.sonic=true;b.ready=true;b.armed=true;b.readyShot=r.state.shots;}
 placePlayer(r.world,{x:b.x-70,y:b.y});stopPlayer(r.world);b.previous={...r.world.player.position};r.dash({x:reason==='slow'?10:24,y:0,power:1});if(reason==='fresh'){b.readyShot=r.state.shots;b.armed=false;}
 const hp=r.state.hp,score=r.state.score;for(let i=0;i<12&&!events.some(e=>e.type==='breachContact');i++)r.tick();const hits=events.filter(e=>e.type==='breachContact');assert.equal(hits.length,1);assert.equal(hits[0].data.reason,reason);assert.equal(r.state.wave.phase,'breach');assert.equal(r.state.shatters,0);assert.equal(r.state.hp,hp);assert.equal(r.state.score,score);
 }finally{r.dispose();}}
});
test('consecutive slow crossings stay local and emit once per fresh launch',async()=>{
 const {createRun}=await import('../src/run.js'),{placePlayer,stopPlayer}=await import('../src/physics.js');const events=[],r=createRun(41,(type,data)=>events.push({type,data}),{waveMode:true});try{
 r.state.phase='playing';r.state.wave.number=5;r.state.wave.entry=0;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const b=r.state.wave.breach;r.state.breakthrough.sonic=true;b.ready=true;b.armed=true;b.readyShot=r.state.shots;const hp=r.state.hp,score=r.state.score;
 for(let attempt=0;attempt<3;attempt++){placePlayer(r.world,{x:b.x-70,y:b.y});stopPlayer(r.world);b.previous={...r.world.player.position};assert.equal(r.dash({x:10,y:0,power:10/42}),true);for(let i=0;i<12;i++){r.state.stop=0;r.tick();}assert.equal(events.filter(e=>e.type==='breachContact').length,attempt+1);assert.equal(b.feedback.reason,'slow');assert.equal(r.state.wave.phase,'breach');}
 assert.equal(r.state.hp,hp);assert.equal(r.state.score,score);assert.equal(r.state.shatters,0);
 }finally{r.dispose();}
});
