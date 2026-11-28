import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {ITEMS,normalizeEquipment,equipmentRules} from '../src/equipment.js';
import {STORE_PERFORMANCES,storePerformanceFrame,drawStoreItem} from '../src/art/splatr-art-engine.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
function paint(it,extra={}){const cv=createCanvas(320,200);drawStoreItem(cv.getContext('2d'),320,200,{equipment:normalizeEquipment({[it.slot]:it.id}),slot:it.slot,...extra});return cv.toBuffer('image/png');}
test('every catalogue item has three authored beats and its own immutable particle silhouette',()=>{
 assert.equal(Object.keys(STORE_PERFORMANCES).length,ITEMS.length);
 const paths=new Set();
 for(const it of ITEMS){const d=STORE_PERFORMANCES[it.id];assert.equal(d.id,it.id);assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.path)&&d.path.every(Object.isFrozen));assert.equal(new Set(d.beats).size,3);assert.ok(d.beats.every(x=>x.length>3));paths.add(JSON.stringify(d.path));}
 assert.equal(paths.size,ITEMS.length,'no recolored duplicate silhouettes');
});
test('all 219 item beats animate and each item has three visibly different states',()=>{
 for(const it of ITEMS){const beats=[];for(let beat=0;beat<3;beat++){const a=paint(it,{time:beat*100+24}),b=paint(it,{time:beat*100+71});assert.notEqual(hash(a),hash(b),`${it.id}/${beat} is not a frozen portrait`);beats.push(hash(a));}assert.equal(new Set(beats).size,3,it.id);}
});
test('all store items freeze deterministically for reduced motion and manual rail steps',()=>{
 for(const it of ITEMS){assert.equal(hash(paint(it,{time:10,motion:false})),hash(paint(it,{time:9000,motion:false})),it.id);for(let step=0;step<3;step++)assert.equal(hash(paint(it,{time:10,step})),hash(paint(it,{time:9000,step})),`${it.id}/${step}`);}
});
test('store illustrations restore canvas state and do not mutate equipment or rules',()=>{
 const cv=createCanvas(320,200),c=cv.getContext('2d');
 for(const it of ITEMS){const equipment=normalizeEquipment({[it.slot]:it.id}),before=JSON.stringify(equipment),rules=equipmentRules(equipment);c.globalAlpha=.41;c.lineWidth=7;c.setLineDash([2,7]);c.translate(1,2);const tx=c.getTransform();drawStoreItem(c,320,200,{equipment,slot:it.slot,time:140});assert.deepEqual(c.getTransform(),tx);assert.equal(c.globalAlpha,.41);assert.equal(c.lineWidth,7);assert.deepEqual(c.getLineDash(),[2,7]);assert.equal(JSON.stringify(equipment),before);assert.deepEqual(equipmentRules(equipment),rules);c.resetTransform();}
});
test('store frame seeking is bounded and rejects missing identities',()=>{
 assert.equal(storePerformanceFrame('missing'),null);for(const n of [NaN,-20,Infinity,0,1e9]){const f=storePerformanceFrame('halo',n);assert.ok(f.beat>=0&&f.beat<3);assert.ok(f.progress>=0&&f.progress<=1);}
});
