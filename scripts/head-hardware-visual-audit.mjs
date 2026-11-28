// A genuine pre-edit module is required; never manufacture a baseline.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {shopStudy} from '../src/shop-catalog.js';
import {visualStoryFrame,visualStudyTime} from '../src/visual-story.js';
const beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/item-correlation/art-before.js');assert.ok(existsSync(beforePath),'Supply the genuine pre-edit art module with QA_BEFORE_ART');
const old=await import(pathToFileURL(beforePath)),out='docs/item-correlation';mkdirSync(out,{recursive:true});
let unchangedBaseline=0,changedHeads=0,unchangedAttacks=0,unchangedStories=0;
const render=fn=>{const cv=createCanvas(420,280);fn(cv.getContext('2d'));return cv.toBuffer('image/png');};
for(const head of ITEMS.filter(i=>i.slot==='head'))for(const body of ITEMS.filter(i=>i.slot==='body'))for(const core of ITEMS.filter(i=>i.slot==='core'))for(const radius of [23,64]){
 const equipment=normalizeEquipment({head:head.id,body:body.id,core:core.id}),paint=engine=>render(c=>engine.drawCubeHero(c,{x:270,y:175,radius,equipment,motion:false,pose:{blink:1,breathe:0}}));
 if(head.id==='none'){assert.deepEqual(paint(old),paint(art));unchangedBaseline++;}else{assert.notDeepEqual(paint(old),paint(art),`${head.id}/${body.id}/${core.id}/${radius}`);changedHeads++;}
}
for(const core of ITEMS.filter(i=>i.slot==='core'))for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash')){
 const equipment=normalizeEquipment({core:core.id,dash:dash.id,slash:slash.id}),paint=engine=>render(c=>{engine.drawElementalDash(c,{x:210,y:100,vx:32,age:3,travel:60,radius:23,equipment,element:engine.dashElement(equipment)});engine.drawSlashEffect(c,{x:90,y:200,endX:340,endY:120,id:slash.id,equipment,progress:.35});});assert.deepEqual(paint(old),paint(art));unchangedAttacks++;
}
for(const item of ITEMS.filter(i=>i.slot!=='head'))for(let beat=0;beat<3;beat++){
 const equipment=normalizeEquipment({[item.slot]:item.id}),frame=visualStoryFrame(0,false,beat),study=shopStudy(item,visualStudyTime(item.slot,item.id,frame),false,equipment),paint=engine=>{const cv=createCanvas(640,400);engine.drawVisualShopStory(cv.getContext('2d'),640,400,{equipment,study,frame,surface:createCanvas(640,400)});return cv.toBuffer('image/png');};assert.deepEqual(paint(old),paint(art),item.id);unchangedStories++;
}
writeFileSync(`${out}/art-audit.json`,JSON.stringify({genuineBefore:'.arena/item-correlation/art-before.js',unchangedBaseline,changedHeads,unchangedAttacks,unchangedStories,note:'Same current equipment and study data, genuine old/new production renderer. All eight paid/unlock head silhouettes intentionally change; bare-head construction and non-head default studies/attack artwork are protected. Pixel evidence is not a human-recognition study.'},null,2));
console.log(`PASS: ${changedHeads} deliberate head/body/core/scale changes; ${unchangedBaseline} bare-head constructions, ${unchangedAttacks} attack cells and ${unchangedStories} non-head story beats pixel-identical.`);
