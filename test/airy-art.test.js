import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawCubeHero,drawShopPartPortrait,drawVisualShopStory,drawPartComparison} from '../src/art/splatr-art-engine.js';
import {normalizeEquipment,ITEMS} from '../src/equipment.js';
import {shopStudy} from '../src/shop-catalog.js';
import {visualStoryFrame,visualStudyTime} from '../src/visual-story.js';

function balanced(draw){const cv=createCanvas(640,400),c=cv.getContext('2d');c.translate(2,3);c.globalAlpha=.8;c.setLineDash([2,3]);const before=c.getTransform();draw(c);assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,.8);assert.deepEqual(c.getLineDash(),[2,3]);return cv;}

test('airy portrait field is flat paper, not another panel inside a panel, for all equipment-object slots',()=>{
 for(const item of ITEMS.filter(x=>['head','eyes','body','core','tail','slash','dash'].includes(x.slot))){const equipment=Object.freeze(normalizeEquipment({[item.slot]:item.id}));const cv=createCanvas(300,184),c=cv.getContext('2d');drawShopPartPortrait(c,300,184,{equipment,slot:item.slot});
  // Sampling unused corners measures the actual stage, not a source constant.
  const px=(x,y)=>[...c.getImageData(x,y,1,1).data];assert.deepEqual(px(2,2),['slash','dash'].includes(item.slot)?[28,41,50,255]:[232,233,223,255],item.id);assert.deepEqual(px(297,181),px(2,2),item.id);
 }
});

test('the paper forehead and bridge remain open surface instead of a second eye-mask cage',()=>{
 const cv=createCanvas(300,300),c=cv.getContext('2d');drawCubeHero(c,{x:150,y:150,radius:100,equipment:normalizeEquipment({}),motion:false,pose:{blink:1,breathe:0}});
 for(const [x,y]of [[150,93],[150,107],[150,120]])assert.deepEqual([...c.getImageData(x,y,1,1).data],[255,248,236,255]);
});

test('all ten simplified shells retain Canvas state and accept frozen equipment and truthful receipts',()=>{
 for(const item of ITEMS.filter(x=>x.slot==='body')){const equipment=Object.freeze(normalizeEquipment({body:item.id,head:'coil',core:'echo'})),pose=Object.freeze({blink:1,breathe:0,headAbility:Object.freeze({kind:'coil',active:true}),coreLive:true,coreChain:2,coreEchoes:1,reducedMotion:true,focusRecovering:true,focusLevel:.5,recoveryAge:2,shellGlanceAge:2,shellContactAngle:.3});const snapshot=JSON.stringify({equipment,pose});balanced(c=>drawCubeHero(c,{x:320,y:220,radius:64,equipment,pose,motion:false}));assert.equal(JSON.stringify({equipment,pose}),snapshot);}
});

test('airy story and comparison still restore context on all three beats and never edit a build',()=>{
 for(const item of ITEMS.filter(x=>['head','core','body','eyes','tail'].includes(x.slot))){const equipment=Object.freeze(normalizeEquipment({[item.slot]:item.id})),before=JSON.stringify(equipment);for(let beat=0;beat<3;beat++){const frame=visualStoryFrame(0,false,beat),study=shopStudy(item,visualStudyTime(item.slot,item.id,frame),false,equipment);balanced(c=>drawVisualShopStory(c,640,400,{equipment,study,frame}));balanced(c=>drawPartComparison(c,640,400,{before:equipment,after:equipment,slot:item.slot,mode:'power',beforeStudy:study,afterStudy:study,frame}));}assert.equal(JSON.stringify(equipment),before);}
});
