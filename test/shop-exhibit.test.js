import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawShopPartPortrait,drawPartComparison,visualOnlyContext} from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {shopStudy} from '../src/shop-catalog.js';
import {visualStoryFrame,visualStudyTime} from '../src/visual-story.js';
import {exhibitStock} from '../src/shop-exhibit.js';
const pixels=c=>Buffer.from(c.getImageData(0,0,c.canvas.width,c.canvas.height).data);
test('shelf ownership is independent of selection and never spends credits',()=>{
 const item=ITEMS.find(i=>i.id==='coil');
 assert.equal(exhibitStock(item,{selected:true}).state,'trying');
 assert.equal(exhibitStock(item,{selected:true,owned:true}).state,'owned');
 assert.equal(exhibitStock(item,{selected:true,owned:true,equipped:true}).state,'equipped');
 assert.equal(exhibitStock(item,{coins:100}).shortfall,300);
 assert.equal(exhibitStock(item,{owned:true}).shortfall,0);
 assert.equal(exhibitStock({price:null},{selected:true}).state,'locked');
});
test('all catalogue portraits paint without words, equipment writes or leaked canvas state',()=>{
 const seen=new Map();
 for(const item of ITEMS){const cv=createCanvas(300,184),c=cv.getContext('2d'),equipment=Object.freeze(normalizeEquipment({[item.slot]:item.id})),save=JSON.stringify(equipment);let words=0;c.fillText=()=>words++;c.strokeText=()=>words++;
 c.translate(1,2);c.globalAlpha=.9;const transform=c.getTransform();
 drawShopPartPortrait(c,300,184,{equipment,slot:item.slot,time:180,motion:false});
 assert.deepEqual(c.getTransform(),transform,item.id);assert.equal(c.globalAlpha,.9);assert.equal(JSON.stringify(equipment),save);assert.equal(words,0,item.id);
 const key=pixels(c).toString('base64');assert.ok(!seen.has(key),`${item.id} duplicates ${seen.get(key)}`);seen.set(key,item.id);
 }
});
test('reduced-motion portraits are pixel-stable regardless of supplied clock',()=>{
 for(const item of ITEMS){const equipment=normalizeEquipment({[item.slot]:item.id});const paint=time=>{const c=createCanvas(300,184).getContext('2d');drawShopPartPortrait(c,300,184,{equipment,slot:item.slot,time,motion:false});return pixels(c);};assert.ok(paint(0).equals(paint(90000)),item.id);}
});
test('Look and synchronized Power comparisons cover all slots without mutation or canvas leaks',()=>{
 for(const item of ITEMS){const before=Object.freeze(normalizeEquipment({})),after=Object.freeze(normalizeEquipment({[item.slot]:item.id})),current=ITEMS.find(i=>i.id===before[item.slot]),save=JSON.stringify([before,after]);
 for(const mode of ['look','power']){const c=createCanvas(640,400).getContext('2d'),frame=visualStoryFrame(0,false,2),study=i=>shopStudy(i,visualStudyTime(item.slot,i.id,frame),false,i===item?after:before);c.translate(1,2);const transform=c.getTransform();
 drawPartComparison(visualOnlyContext(c),640,400,{before,after,slot:item.slot,mode,frame,beforeStudy:study(current),afterStudy:study(item),surface:createCanvas(640,400)});
 assert.deepEqual(c.getTransform(),transform,item.id);assert.equal(JSON.stringify([before,after]),save,item.id);
 }
 }
});
test('invalid portrait sizes do not touch the caller context',()=>{const c=createCanvas(40,40).getContext('2d'),save=pixels(c);for(const [w,h]of [[0,1],[-1,4],[NaN,4],[40,Infinity]])drawShopPartPortrait(c,w,h);assert.ok(pixels(c).equals(save));});
