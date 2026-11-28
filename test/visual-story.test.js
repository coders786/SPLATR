import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {visualStoryFrame,visualStudyTime} from '../src/visual-story.js';
import {drawVisualShopStory,visualOnlyContext} from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {shopStudy} from '../src/shop-catalog.js';
import {swordProfile} from '../src/swords.js';
test('visual story has a real setup/action/payoff hold and stable manual/reduced poses',()=>{
 assert.equal(visualStoryFrame(600).beat,0);assert.equal(visualStoryFrame(2200).beat,1);assert.equal(visualStoryFrame(4100).beat,2);assert.equal(visualStoryFrame(5400).beat,0);assert.equal(visualStudyTime('dash','dash-echo',visualStoryFrame(4100)),4100);assert.equal(visualStudyTime('eyes','hypno',visualStoryFrame(4100)),3300);
 assert.deepEqual(visualStoryFrame(0,false),visualStoryFrame(90000,false));for(let i=0;i<3;i++)assert.deepEqual(visualStoryFrame(0,true,i),visualStoryFrame(9999,true,i));
 for(const t of [NaN,Infinity,-12,0,5401])assert.ok(Number.isFinite(visualStoryFrame(t).progress));
});
test('all 73 products paint three wordless beats without mutating equipment or leaking canvas state',()=>{
 for(const item of ITEMS){
  const equipment=Object.freeze(normalizeEquipment({[item.slot]:item.id})),before=JSON.stringify(equipment),cv=createCanvas(640,400),c=cv.getContext('2d'),surface=createCanvas(640,400);let words=0;
  c.fillText=()=>words++;c.strokeText=()=>words++;
  for(let beat=0;beat<3;beat++){
   const frame=visualStoryFrame(0,true,beat),elapsed=visualStudyTime(item.slot,item.id,frame);
   const study=shopStudy(item,elapsed,true,equipment);c.translate(2,3);const transform=c.getTransform();
   drawVisualShopStory(c,640,400,{equipment,study,sword:swordProfile(equipment),frame,surface});assert.deepEqual(c.getTransform(),transform,item.id);c.resetTransform();
  }
  assert.equal(words,0,item.id);assert.equal(JSON.stringify(equipment),before,item.id);assert.ok(c.getImageData(0,0,640,400).data.some((v,i)=>i%4===3&&v),item.id);
 }
});
test('the text-free adapter suppresses teaching labels and remains local to the shop',()=>{
 const c=createCanvas(64,64).getContext('2d');let calls=0;c.fillText=()=>calls++;const v=visualOnlyContext(c);v.fillText('WORDS',0,0);assert.equal(calls,0);c.fillText('normal game text',0,0);assert.equal(calls,1);assert.equal(visualOnlyContext(c),v);v.fillStyle='#abcdef';assert.equal(c.fillStyle,'#abcdef');
});

test('the shop can own one accessible story rail without changing the illustration',()=>{
 const item=ITEMS.find(i=>i.slot==='head'),equipment=normalizeEquipment({head:item.id}),frame=visualStoryFrame(0,true,1),study=shopStudy(item,visualStudyTime(item.slot,item.id,frame),true,equipment);
 const paint=externalRail=>{const canvas=createCanvas(640,400),c=canvas.getContext('2d');drawVisualShopStory(c,640,400,{equipment,study,sword:swordProfile(equipment),frame:{...frame,externalRail},surface:createCanvas(640,400)});return c;};
 const standalone=paint(false),shop=paint(true);
 assert.ok(Buffer.from(standalone.getImageData(0,0,640,350).data).equals(Buffer.from(shop.getImageData(0,0,640,350).data)),'only the redundant rail may differ');
 assert.ok(!Buffer.from(standalone.getImageData(240,352,160,32).data).equals(Buffer.from(shop.getImageData(240,352,160,32).data)),'standalone retains dots; the shop suppresses them');
});
