// Genuine pre-chunk renderer is mandatory. No regenerated baseline.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
import {DASH_STUDY_IDS} from '../src/dash-study.js';
import {shopStudy} from '../src/shop-catalog.js';
import {playerCanvas} from '../src/shop-language.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk21/visual-audit',path=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk21/art-before.js');assert.ok(existsSync(path));const before=await import(pathToFileURL(path));mkdirSync(out,{recursive:true});
const showcased=ITEMS.filter(i=>DASH_STUDY_IDS.includes(i.id));let heroes=0,attacks=0,changedAttacks=0;
for(const head of ITEMS.filter(i=>i.slot==='head'))for(const body of ITEMS.filter(i=>i.slot==='body'))for(const core of ITEMS.filter(i=>i.slot==='core'))for(const radius of [23,58]){
 const eq=normalizeEquipment({head:head.id,body:body.id,core:core.id}),draw=engine=>{const cv=createCanvas(420,260);engine.drawCubeHero(cv.getContext('2d'),{x:285,y:155,radius,equipment:eq,time:0,motion:false,pose:{blink:1}});return cv.toBuffer('image/png');};assert.deepEqual(draw(before),draw(art),`unchanged live hero ${head.id}/${body.id}/${core.id}/${radius}`);heroes++;
}
for(const core of ITEMS.filter(i=>i.slot==='core'))for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash')){
 const eq=normalizeEquipment({core:core.id,dash:dash.id,slash:slash.id}),sword=swordProfile(eq),draw=engine=>{const cv=createCanvas(400,220),c=cv.getContext('2d');engine.drawElementalDash(c,{x:170,y:100,vx:25,vy:-4,age:3,travel:60,radius:23,element:art.dashElement(eq,sword),equipment:eq,sword,motion:true});engine.drawSlashEffect(c,{x:120,y:160,endX:330,endY:80,id:slash.id,strength:.85,progress:.35,equipment:eq});engine.drawSwordWeapon(c,{x:160,y:110,radius:23,angle:-.2,equipment:eq,sword,active:true,motion:false});return cv.toBuffer('image/png');};if(dash.id==='dash-echo'){assert.notDeepEqual(draw(before),draw(art));changedAttacks++;}else{assert.deepEqual(draw(before),draw(art));attacks++;}
}
const cv=createCanvas(1280,46+showcased.length*340),c=cv.getContext('2d');c.fillStyle='#101b24';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#e6edd3';c.font='bold 15px sans-serif';c.fillText('GENUINE PRE-CHUNK DASH STUDIES',22,29);c.fillText('NOW / AN ABILITY-SPECIFIC EXPLANATION',660,29);
for(const [i,it]of showcased.entries()){
 const equipment=normalizeEquipment({[it.slot]:it.id}),study=shopStudy(it,3300,false,equipment),frames=[];
 for(const engine of [before,art]){const tile=createCanvas(640,400);engine.drawShopItemStudy(playerCanvas(tile.getContext('2d')),640,400,{study,equipment,sword:swordProfile(equipment)});frames.push(tile);}
 if(it.id==='dash-echo')assert.notDeepEqual(frames[0].toBuffer('image/png'),frames[1].toBuffer('image/png'),it.id);else assert.deepEqual(frames[0].toBuffer('image/png'),frames[1].toBuffer('image/png'),it.id);for(let col=0;col<2;col++)c.drawImage(frames[col],col*640,46+i*340,640,330);
}
writeFileSync(`${out}/ability-studies-before-after.png`,cv.toBuffer('image/png'));writeFileSync(`${out}/results.json`,JSON.stringify({genuineBefore:path,changedStudies:['dash-echo'],unchangedHeroes:heroes,unchangedAttackCells:attacks,changedRepriseCells:changedAttacks,note:'Study comparison uses identical current copy/profile inputs with the genuine old renderer. Full UI/copy snapshot is audited separately.'},null,2));console.log(`PASS Reprise study visibly replaced; 7 other dash studies unchanged; ${heroes} live head/body/core/size hero cells and ${attacks} other attack-render cells pixel-identical; ${changedAttacks} explicit Reprise cells visibly changed.`);
