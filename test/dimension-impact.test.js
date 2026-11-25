import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createDimensionImpact,drawDimensionImpact} from '../src/art/splatr-art-engine.js';
import {createRenderer} from '../src/renderer.js';
import {createRun} from '../src/run.js';
import {installDom,createDisplay} from './support/display.js';

test('major impacts only; ordinary cuts, debris and secondary chains cannot strobe',()=>{
 for(const d of [{},{small:true,throughcut:true},{paper:true,throughcut:true},{secondary:true,throughcut:true},{fromShear:true,throughcut:true}])assert.equal(createDimensionImpact().event('cut',d),false);
 for(const [type,d] of [['dimensionBreak',{}],['monolithDown',{}],['cut',{throughcut:true}],['cut',{strokeKills:3}],['cut',{kind:'crown'}]])assert.equal(createDimensionImpact().event(type,d),true);
});
test('one envelope, 24-tick lifetime, 90-tick cooldown, no overlapping queued bursts',()=>{
 const fx=createDimensionImpact();assert.equal(fx.event('dimensionBreak',{x:1,y:2}),true);
 const snapshot=fx.snapshot();snapshot.age=500;assert.equal(fx.snapshot().age,0,'snapshot cannot modify state');
 for(let i=0;i<24;i++){assert.equal(fx.event('cut',{throughcut:true}),false);fx.tick();}
 assert.equal(fx.snapshot(),null);
 for(let i=24;i<90;i++)fx.tick();assert.equal(fx.event('monolithDown',{}),true);
 fx.reset();assert.equal(fx.snapshot(),null);assert.equal(fx.event('dimensionBreak',{}),true);
});
test('reduced motion prevents and clears an active envelope',()=>{
 const fx=createDimensionImpact();assert.equal(fx.event('dimensionBreak',{},false),false);
 fx.event('dimensionBreak',{});fx.tick(false);assert.equal(fx.snapshot(),null);
});
test('painting is deterministic, bounded, canvas-state safe, and absent after release',()=>{
 for(const size of [[960,540],[360,640],[640,360]]){
  const [w,h]=size,canvas=createCanvas(w,h),c=canvas.getContext('2d');c.translate(2,3);c.globalAlpha=.7;const before=c.getTransform();
  drawDimensionImpact(c,w,h,{x:-2000,y:9000,age:5,major:true});assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.7);
  const image=(age,motion=true)=>{const a=createCanvas(w,h);drawDimensionImpact(a.getContext('2d'),w,h,{age,motion});return a.toBuffer('image/png');};
  assert.deepEqual(image(5),image(5));assert.notDeepEqual(image(1),image(12));assert.deepEqual(image(24),image(1,false));
 }
});
test('real renderer integrates the impact; draws do not age it; reset and shake-off suppress it',()=>{
 const dom=installDom(),{canvas}=createDisplay(960,540),renderer=createRenderer(canvas),run=createRun(19,()=>{},{staged:false});
 try{
  renderer.event('dimensionBreak',{x:0,y:0},true);assert.ok(renderer.effectState().dimensionImpact);
  const before=renderer.effectState(),state={score:run.state.score,hp:run.state.hp,clock:run.world.clock,x:run.world.player.position.x};
  for(let i=0;i<5;i++)renderer.draw(run,1,null,true);
  assert.deepEqual(renderer.effectState(),before);assert.deepEqual({score:run.state.score,hp:run.state.hp,clock:run.world.clock,x:run.world.player.position.x},state);
  renderer.tick(run,true);assert.equal(renderer.effectState().dimensionImpact.age,1);
  renderer.setShakeLevel('off');renderer.tick(run,true);assert.equal(renderer.effectState().dimensionImpact,null);
  renderer.reset(19);renderer.event('dimensionBreak',{},true);assert.equal(renderer.effectState().dimensionImpact,null);
  renderer.setShakeLevel('full');renderer.event('dimensionBreak',{},true);assert.ok(renderer.effectState().dimensionImpact);
  renderer.field(run.world.player.position);assert.equal(renderer.effectState().dimensionImpact,null);
 }finally{renderer.dispose();run.dispose();dom.uninstall();}
});
