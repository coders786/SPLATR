import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {dragArrowVisual,drawDragArrowPreview,drawShopElementSlash} from '../src/art/splatr-art-engine.js';
const equipment=[{}, {core:'riot'},{head:'coil'},{core:'time'},{core:'echo'},{core:'grav'},{core:'magnet'}];
test('seven build-driven arrows retain one launch direction and bounded power geometry',()=>{
 const elements=new Set(),shapes=new Set();for(const eq of equipment){const spec=dragArrowVisual({dx:3,dy:-4,power:.8,equipment:Object.freeze(eq)});elements.add(spec.element);shapes.add(spec.headPath+spec.accentPath);assert.equal(spec.angle,Math.atan2(-4,3));assert.ok(spec.length<=106);for(const [x,y]of [...spec.head,...spec.shaft,...spec.accent.flat()])assert.ok(x>=0&&x<=106&&Math.abs(y)<=10);assert.ok(!spec.shaftPath.includes('NaN'));}assert.equal(elements.size,7);assert.equal(shapes.size,7);assert.ok(dragArrowVisual({power:.1}).length<dragArrowVisual({power:1}).length);
});
test('Shop previews are deterministic and preserve context at phone backing scale',()=>{
 for(const fn of [drawDragArrowPreview,drawShopElementSlash]){const render=()=>{const canvas=createCanvas(300,170),ctx=canvas.getContext('2d');ctx.globalAlpha=.4;ctx.lineWidth=6;const matrix=ctx.getTransform();fn(ctx,300,170,{equipment:Object.freeze({core:'time',slash:'laser'}),time:500,motion:false});assert.equal(ctx.globalAlpha,.4);assert.equal(ctx.lineWidth,6);assert.deepEqual(ctx.getTransform(),matrix);return canvas.toBuffer('image/png');};assert.deepEqual(render(),render());}
});
test('selected slash treatments remain distinct in the elemental Shop demonstration',()=>{
 const buffers=['katana','blood','laser','pixel'].map(slash=>{const canvas=createCanvas(300,170);drawShopElementSlash(canvas.getContext('2d'),300,170,{equipment:{slash,core:'riot'},motion:false});return canvas.toBuffer('image/png');});for(let i=1;i<buffers.length;i++)assert.notDeepEqual(buffers[0],buffers[i]);
});
