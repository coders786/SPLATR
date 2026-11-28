import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {WORLD_GUIDES,worldGuide} from '../src/world-guide.js';
import {drawWorldIdentity,drawPartComparison} from '../src/art/splatr-art-engine.js';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';

test('six landmark identities are distinct, stationary with reduced motion and preserve caller state',()=>{
 const images=new Set();
 for(const world of Object.keys(WORLD_GUIDES)){
  const render=time=>{const c=createCanvas(390,844).getContext('2d');c.translate(3,4);c.globalAlpha=.7;const matrix=c.getTransform();drawWorldIdentity(c,390,844,{world,time,motion:false});assert.deepEqual(c.getTransform(),matrix);assert.equal(c.globalAlpha,.7);return c.canvas.toBuffer('image/png').toString('base64');};
  const still=render(0);assert.equal(render(900),still);images.add(still);assert.ok(Object.isFrozen(worldGuide(world)));
 }
 assert.equal(images.size,6);assert.equal(worldGuide('unknown'),WORLD_GUIDES.twilight);
});
test('comparison paints both fitted parts without changing supplied builds or canvas state',()=>{
 const before=Object.freeze({...DEFAULT_EQUIPMENT}),after=Object.freeze({...before,head:'coil'}),c=createCanvas(640,400).getContext('2d');c.translate(2,3);const matrix=c.getTransform();
 drawPartComparison(c,640,400,{before,after,slot:'head',beforeName:'Bare Head',afterName:'Lightning Coil',beforeBenefit:'Balanced',afterBenefit:'Stored power'});
 assert.deepEqual(c.getTransform(),matrix);assert.equal(after.head,'coil');assert.equal(before.head,DEFAULT_EQUIPMENT.head);assert.ok(c.getImageData(0,0,640,400).data.some((v,i)=>i%4===3&&v));
});
