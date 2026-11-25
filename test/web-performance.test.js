import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {renderBudget,MAX_RENDER_PIXELS} from '../src/render-budget.js';
import {UBER_FRAGMENT,postFXAllowed,createImpactUniforms,UberPostFX} from '../src/uber-postfx.js';
import {createVisualPool,createRenderCuller,createArtRenderer,drawBakedGlow,createArtBake} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';

test('backing stores never use Retina resolution and remain within the 720p pixel budget',()=>{
 for(const [w,h]of [[640,360],[390,844],[1920,1080],[3840,2160]])for(const dpr of [1,2,3]){const b=renderBudget(w,h,dpr);assert.ok(b.scale<=1);assert.ok(b.width*b.height<=MAX_RENDER_PIXELS);assert.ok(b.width<=w&&b.height<=h);}
 assert.equal(renderBudget(640,360,3).width,640);assert.deepEqual(renderBudget(NaN,0,-3),{width:1,height:1,scale:1});
});
test('single-pass shader has only three texture reads and all requested controls',()=>{
 assert.equal((UBER_FRAGMENT.match(/texture2D\s*\(/g)||[]).length,3);
 for(const name of ['uGlitch','uChromatic','uGloom','uBloom','uFocusPos','uImpactMode'])assert.ok(UBER_FRAGMENT.includes(name));
 assert.match(UBER_FRAGMENT,/step\(\.45,lum\)/);assert.doesNotMatch(UBER_FRAGMENT,/for\s*\(/);
});
test('Auto does not allocate postprocessing on a 2GB device; explicit off always wins',()=>{
 assert.equal(postFXAllowed('auto',{memory:2,cores:8}),false);assert.equal(postFXAllowed('auto',{memory:8,cores:2}),false);assert.equal(postFXAllowed('auto',{memory:4,cores:4}),true);assert.equal(postFXAllowed('off',{memory:16,cores:16}),false);
 let surfaces=0;const source={style:{opacity:''}};const fx=new UberPostFX(source,{surface:()=>{surfaces++;},capabilities:{memory:2,cores:8}});
 fx.setMode('auto');assert.equal(surfaces,0);assert.equal(fx.present(),false);fx.dispose();assert.equal(source.style.opacity,'');
});
test('impact uniforms have two inverse and two normal threshold states and reject retriggers',()=>{
 const fx=createImpactUniforms();assert.equal(fx.triggerImpactFrame(),true);assert.equal(fx.triggerImpactFrame(),false);
 const sequence=[];for(let i=0;i<4;i++){fx.tick();sequence.push(fx.read().impact);}assert.deepEqual(sequence,[2,2,1,1]);fx.tick();assert.equal(fx.read().impact,0);
 fx.reset();fx.triggerImpactFrame();fx.tick(false);assert.equal(fx.read().impact,0);
});
test('visual pools reuse identities, reject double release and never exceed capacity',()=>{
 const p=createVisualPool(2),a=p.getFirstDead(),b=p.getFirstDead();a.enemy={id:'temporary'};assert.equal(p.getFirstDead(),null);assert.equal(p.release(a),true);assert.equal(p.release(a),false);const reused=p.getFirstDead();assert.equal(reused,a);assert.equal(reused.enemy,undefined);p.reset();assert.deepEqual(p.stats(),{maxSize:2,active:0,free:2});assert.ok(b);
});
test('100ms cull refresh never hides a fast entrant, moving camera or large boss',()=>{
 const c=createRenderCuller(),v={x:0,y:0,w:600,h:400},e={x:3000,y:200,r:20},before=JSON.stringify(e);
 assert.equal(c.update(0,v,[e]),true);assert.equal(c.update(99,v,[e]),false);assert.equal(c.visible(e,v),false);assert.equal(JSON.stringify(e),before);
 e.x=100;assert.equal(c.visible(e,v),true,'entry is immediate, even between broadphase refreshes');
 e.x=3000;assert.equal(c.visible(e,{...v,x:2900}),true);assert.equal(c.visible({x:800,y:200,r:250},v),true);assert.equal(c.update(100,v,[e]),true);assert.equal(c.stats().scans,2);
});
test('baked radial glow reuses pixels and restores additive blend state',()=>{
 const bake=createArtBake({surface:()=>createCanvas(1,1)}),c=createCanvas(200,200).getContext('2d');c.globalAlpha=.5;c.globalCompositeOperation='source-over';const transform=c.getTransform();
 drawBakedGlow(c,bake,90,90,32);drawBakedGlow(c,bake,80,80,24);assert.equal(bake.stats().entries,1);assert.equal(c.globalAlpha,.5);assert.equal(c.globalCompositeOperation,'source-over');assert.deepEqual(c.getTransform(),transform);bake.clear();
});
test('real renderer bakes static scenery, caps cosmetic pools, and releases surfaces on dispose',()=>{
 let allocations=0;const surface=()=>{allocations++;return createCanvas(1,1);},canvas=createCanvas(960,540),r=createArtRenderer(canvas.getContext('2d'),{width:960,height:540,surface}),run=createRun(19,()=>{},{waveMode:true,continuous:true});
 try{r.reset(19);r.field(run.world.player.position);r.draw(run,1,null,true);const a=r.performanceState();assert.ok(a.background.entries>0);assert.ok(a.background.pixels<=2000000);
  const warmAllocations=allocations;const original={kills:run.state.kills,score:run.state.score,x:run.world.player.position.x,clock:run.world.clock};for(let i=0;i<10;i++)r.draw(run,1,null,true);
  assert.equal(allocations,warmAllocations,'stationary scenery must not thrash its bounded cache');
  assert.deepEqual({kills:run.state.kills,score:run.state.score,x:run.world.player.position.x,clock:run.world.clock},original);
  assert.ok(r.performanceState().sparks.active<=30);r.dispose();assert.equal(r.performanceState().background.pixels,0);
 }finally{r.dispose();run.dispose();}
});
