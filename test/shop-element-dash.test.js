import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {drawShopElementDash,resolveShopDashPose,dashElement} from '../src/art/splatr-art-engine.js';
const render=(equipment={},time=500,motion=true,sword=null)=>{const canvas=createCanvas(300,170);drawShopElementDash(canvas.getContext('2d'),300,170,{equipment,time,motion,sword});return canvas;};
test('dash study has load, real displacement and a readable held reference, with fixed reduced pose',()=>{
 assert.equal(resolveShopDashPose(0).phase,'LOAD');assert.ok(resolveShopDashPose(480).x>resolveShopDashPose(300).x+100);assert.equal(resolveShopDashPose(1100).phase,'DASH STUDY');assert.ok(resolveShopDashPose(1100).age>=0);assert.deepEqual(resolveShopDashPose(0,false),resolveShopDashPose(900,false));assert.deepEqual(render({},0,false).toBuffer('image/png'),render({},900,false).toBuffer('image/png'));
});
test('all seven gameplay elements produce distinct dash studies, including hybrid priority',()=>{
 const eqs=[{}, {core:'riot'},{head:'coil'},{core:'time'},{core:'echo'},{core:'grav'},{core:'magnet'}];const buffers=eqs.map(eq=>render(eq,1100,false).toBuffer('image/png'));for(let i=0;i<buffers.length;i++)for(let j=0;j<i;j++)assert.notDeepEqual(buffers[i],buffers[j]);assert.equal(dashElement({slash:'laser',core:'time'},{build:'glacier'}),'ice');assert.notDeepEqual(render({slash:'laser',core:'time'},500,false).toBuffer('image/png'),render({slash:'laser',core:'time'},500,false,{build:'glacier'}).toBuffer('image/png'));
});
test('dash renderer is deterministic, preserves state and keeps artwork in its study canvas',()=>{
 const canvas=createCanvas(300,170),c=canvas.getContext('2d'),equipment=Object.freeze({core:'riot'});c.globalAlpha=.4;c.lineWidth=6;c.translate(1,2);const matrix=c.getTransform();drawShopElementDash(c,300,170,{equipment,time:500,motion:true});assert.equal(c.globalAlpha,.4);assert.equal(c.lineWidth,6);assert.deepEqual(c.getTransform(),matrix);assert.deepEqual(render(equipment).toBuffer('image/png'),render(equipment).toBuffer('image/png'));
});
test('held Volt reference includes travel-dependent rear rails instead of an empty idle hero',()=>{
 // These two rows sit behind the cube and above the registration baseline.
 // The live lance only paints them when actual travel exceeds45.
 const c=render({dash:'dash-lightning'},1100).getContext('2d');
 for(const y of [96,105]){
  const px=c.getImageData(143,y,12,1).data;
  assert.ok(Array.from({length:12},(_,i)=>px[i*4]>80&&px[i*4+1]>90&&px[i*4+2]>55).some(Boolean),'separated rear rail must remain visible in labelled reference');
 }
});
