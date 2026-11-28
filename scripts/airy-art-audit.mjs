// Exact before source, captured before this pass. Artwork references, not browser
// screenshots; native UI and live evidence live in the adjacent review folders.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
const baseline=gunzipSync(readFileSync('docs/airy-review/baseline/art-before.js.gz'));
const old=await import(`data:text/javascript;base64,${baseline.toString('base64')}`);
const out='docs/airy-review/art';mkdirSync(out,{recursive:true});
const paint=(engine,equipment,radius=68)=>{const cv=createCanvas(480,320),c=cv.getContext('2d');c.fillStyle='#e8e9df';c.fillRect(0,0,480,320);engine.drawCubeHero(c,{x:284,y:186,radius,equipment,motion:false,pose:{blink:1,breathe:0}});return cv.toBuffer('image/png');};
const bodies=ITEMS.filter(x=>x.slot==='body'),cores=ITEMS.filter(x=>x.slot==='core');
let combinations=0,attacks=0;
for(const b of bodies)for(const core of cores)for(const radius of [23,68]){
 const eq=normalizeEquipment({body:b.id,core:core.id});assert.notDeepEqual(paint(old,eq,radius),paint(art,eq,radius));combinations++;
}
for(const item of ITEMS.filter(x=>['body','core','head','eyes','tail'].includes(x.slot))){
 const eq=normalizeEquipment({[item.slot]:item.id});
 for(const [label,engine]of [['before',old],['after',art]])writeFileSync(`${out}/${item.slot}-${item.id}-${label}.png`,paint(engine,eq));
}
for(const core of cores)for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash')){
 const equipment=normalizeEquipment({core:core.id,dash:dash.id,slash:slash.id}),paint=engine=>{const cv=createCanvas(420,280),c=cv.getContext('2d');engine.drawElementalDash(c,{x:210,y:100,vx:32,age:3,travel:60,radius:23,equipment,element:engine.dashElement(equipment)});engine.drawSlashEffect(c,{x:90,y:200,endX:340,endY:120,id:slash.id,equipment,progress:.35});return cv.toBuffer('image/png');};assert.deepEqual(paint(old),paint(art));attacks++;
}
writeFileSync('docs/airy-review/art-results.json',JSON.stringify({combinations,unchangedAttackCells:attacks,baselineSHA256:createHash('sha256').update(baseline).digest('hex'),method:'Genuine saved pre-edit module vs current production renderer, identical equipment/camera. PNGs are offline art references, not native browser screenshots. Pixel difference is not proof of recognition.'},null,2));
console.log(`PASS ${combinations} shell/core/scale changes, ${attacks} unchanged attack cells.`);
