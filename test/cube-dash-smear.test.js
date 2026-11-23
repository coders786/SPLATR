import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawCubeDashSmear,resolveCubeDashSmear,drawShopElementDash} from '../src/art/splatr-art-engine.js';
import {createRun} from '../src/run.js';
import {createRenderer} from '../src/renderer.js';
import {createDisplay,installDom} from './support/display.js';

const image=(spec)=>{const canvas=createCanvas(320,220),ctx=canvas.getContext('2d');drawCubeDashSmear(ctx,{x:160,y:110,radius:25,...spec});return canvas.toBuffer('image/png');};

test('smear displacement tracks all eight velocities and stays bounded with a smooth phase envelope',()=>{
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4, vx=42*Math.cos(a),vy=42*Math.sin(a),s=resolveCubeDashSmear({vx,vy,age:4,radius:25});
  assert.ok(s);assert.ok(Math.abs(Math.hypot(s.ux,s.uy)-1)<1e-12);
  for(const distance of s.offsets){assert.ok(distance>0&&distance<=25*1.82);assert.ok((-s.ux*distance)*vx+(-s.uy*distance)*vy<0);}
  assert.ok(s.offsets[0]<s.offsets[1]&&s.offsets[1]<s.offsets[2]);
  assert.ok(resolveCubeDashSmear({vx,vy,age:2.001,radius:25}).offsets[0]<s.offsets[0]*.01);
  assert.ok(resolveCubeDashSmear({vx,vy,age:6.999,radius:25}).offsets[0]<s.offsets[0]*.01);
 }
 const slow=resolveCubeDashSmear({vx:12,age:4}),fast=resolveCubeDashSmear({vx:42,age:4});assert.ok(fast.offsets[0]>slow.offsets[0]);
});
test('smears render only during active movement, honor reduced motion and reject invalid input',()=>{
 const blank=createCanvas(320,220).toBuffer('image/png');
 for(const spec of [{vx:42,age:2},{vx:42,age:7},{vx:0,age:4},{vx:42,age:4,motion:false},{vx:Infinity,age:4},{vx:42,age:NaN},{vx:42,age:4,radius:0}])assert.deepEqual(image(spec),blank);
 assert.notDeepEqual(image({vx:42,age:4}),blank);
});
test('cel artwork is deterministic, distinct by equipment, and never leaks canvas state',()=>{
 const spec=Object.freeze({vx:42,vy:0,age:4,equipment:Object.freeze({body:'gold',eyes:'visor',core:'time'})});
 assert.deepEqual(image(spec),image(spec));assert.notDeepEqual(image(spec),image({...spec,equipment:{body:'obsidian',eyes:'ninja',core:'riot'}}));
 const ctx=createCanvas(300,200).getContext('2d');ctx.translate(3,5);ctx.globalAlpha=.4;ctx.lineWidth=7;const t=ctx.getTransform();drawCubeDashSmear(ctx,{x:100,y:100,...spec});assert.deepEqual(ctx.getTransform(),t);assert.equal(ctx.globalAlpha,.4);assert.equal(ctx.lineWidth,7);
});
test('gameplay draws displaced cube cels, never for reduced motion or a wall splat',()=>{
 const dom=installDom();const {canvas,ctx}=createDisplay(880,710),renderer=createRenderer(canvas),run=createRun(19,()=>{}, {staged:true});
 try{
  run.state.phase='playing';run.state.slashAge=4;run.state.splat=null;run.world.player.velocity.x=42;run.world.player.velocity.y=0;
  const count=(motion)=>{ctx.__reset();renderer.draw(run,1,null,motion);return ctx.__ops.filter(o=>o.kind==='fill'&&o.paint==='#fff8e8'&&o.alpha>0&&o.alpha<.6);};
  const cels=count(true);assert.equal(cels.length,3,'three body slices reach gameplay canvas');
  assert.equal(count(false).length,0);run.state.splat={age:1,nx:-1,ny:0};assert.equal(count(true).length,0);
  for(const cel of cels){assert.ok(Math.abs(cel.m[1])<1e-8&&Math.abs(cel.m[2])<1e-8,'smear cels stay axis-aligned');}
 }finally{renderer.dispose();run.dispose();dom.uninstall();}
});
test('shop dash study uses the same displaced body cels, while reduced motion remains static',()=>{
 const ctx=createDisplay(300,170).ctx;
 ctx.__reset();drawShopElementDash(ctx,300,170,{equipment:{body:'paper'},time:400,motion:true});
 assert.equal(ctx.__ops.filter(o=>o.kind==='fill'&&o.paint==='#fff8e8'&&o.alpha<.6).length,3);
 ctx.__reset();drawShopElementDash(ctx,300,170,{equipment:{body:'paper'},time:400,motion:false});
 assert.equal(ctx.__ops.filter(o=>o.kind==='fill'&&o.paint==='#fff8e8'&&o.alpha<.6).length,0);
});

test('manual practice uses the same body cels during a real launch',async()=>{
 const {drawPreviewScene}=await import('../src/art/splatr-art-engine.js');
 const {createLabScene}=await import('../src/lab-scene.js');
 const scene=createLabScene();assert.equal(scene.fire(450,190),true);for(let i=0;i<4;i++)scene.tick();
 const ctx=createDisplay(640,400).ctx;
 drawPreviewScene(ctx,{equipment:{body:'paper'},state:scene.state,mode:'slice',options:{motion:true}});
 assert.equal(ctx.__ops.filter(o=>o.kind==='fill'&&o.paint==='#fff8e8'&&o.alpha>0&&o.alpha<.6).length,3);
});

test('all directional cels paint different, reproducible pixels behind the sharp cube',()=>{
 const outputs=new Set();for(let i=0;i<8;i++){const a=i*Math.PI/4,spec={vx:42*Math.cos(a),vy:42*Math.sin(a),age:4};const bytes=image(spec);assert.deepEqual(bytes,image(spec));outputs.add(bytes.toString('base64'));}assert.equal(outputs.size,8);
});
