import test from 'node:test';import assert from 'node:assert/strict';import {createCanvas} from '@napi-rs/canvas';import {createHash} from 'node:crypto';
import {drawStoreItem} from '../src/art/splatr-art-engine.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
function paint(id,extra={}){const cv=createCanvas(640,400);drawStoreItem(cv.getContext('2d'),640,400,{equipment:{dash:id},slot:'dash',time:148,...extra});return cv;}
test('eight enlarged elemental store wakes remain geometrically distinct without relying on color',()=>{
 const images=['auto','ink','fire','lightning','ice','water','void','echo'].map(x=>{const c=paint('dash-'+x).getContext('2d'),d=c.getImageData(30,140,230,160).data;return hash(Buffer.from(d.filter((_,i)=>i%4===0).map((v,i)=>Math.round((v+d[i*4+1]+d[i*4+2])/24))));});assert.equal(new Set(images).size,8);
});
test('polished wakes support deterministic reduced and held frames, and bounded thumbnail zoom',()=>{
 for(const id of ['dash-fire','dash-lightning','dash-ice','dash-water','dash-void','dash-echo']){
  for(const opts of [{motion:false},{step:1},{step:2,zoom:1.4}])assert.equal(hash(paint(id,{...opts,time:10}).toBuffer('image/png')),hash(paint(id,{...opts,time:6000}).toBuffer('image/png')),id);
 }
});
