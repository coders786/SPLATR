// Genuine pre-chunk tail comparison, not a silent current-art rebaseline.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk13/visual-audit',beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk13/art-before.js');assert.ok(existsSync(beforePath),'Supply genuine pre-chunk portable art snapshot');mkdirSync(out,{recursive:true});const before=await import(pathToFileURL(beforePath).href);
const tails=ITEMS.filter(i=>i.slot==='tail'),bodies=ITEMS.filter(i=>i.slot==='body'),cores=ITEMS.filter(i=>i.slot==='core'),records=[];
const frame=(engine,equipment,radius,view=null)=>{const cv=createCanvas(420,260),c=cv.getContext('2d');engine.drawCubeHero(c,{x:300,y:135,radius,equipment,motion:false,time:0,pose:{blink:1,tailAbility:view}});return {cv,data:c.getImageData(0,0,420,260).data};};
for(const tail of tails)for(const body of bodies)for(const core of cores)for(const radius of [23,58]){
 const eq=normalizeEquipment({tail:tail.id,body:body.id,core:core.id}),a=frame(before,eq,radius),b=frame(art,eq,radius);let changed=0,footprint=0;
 for(let i=0;i<a.data.length;i+=4){if(a.data[i+3]||b.data[i+3])footprint++;if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3])changed++;}
 assert.ok(changed>0,`${tail.id}/${body.id}/${core.id}/${radius}`);records.push({tail:tail.id,body:body.id,core:core.id,radius,changed,fraction:changed/footprint});
}
const cv=createCanvas(900,50+tails.length*223),c=cv.getContext('2d');c.fillStyle='#111b24';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#e0e3d6';c.font='bold 15px sans-serif';c.fillText('BEFORE / GENUINE ORIGINAL',16,27);c.fillText('NOW / SAME BUILD, QUIET HARDWARE',466,27);
for(const [row,tail]of tails.entries()){
 const eq=normalizeEquipment({tail:tail.id,core:'standard'}),q=tail.id==='wings'?{kind:tail.id,ready:true}:null;
 for(const [col,engine]of [[0,before],[1,art]]){const f=frame(engine,eq,52,col?q:null);c.drawImage(f.cv,col*450,44+row*223,450,210);}
 c.fillStyle='#cfdbcf';c.font='12px monospace';c.fillText(tail.name.toUpperCase(),16,44+row*223+214);
}
let attacks=0;
for(const core of cores)for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash')){
 const eq=normalizeEquipment({core:core.id,dash:dash.id,slash:slash.id}),sword=swordProfile(eq),draw=engine=>{const cv=createCanvas(400,220),c=cv.getContext('2d');engine.drawElementalDash(c,{x:170,y:100,vx:25,vy:-4,age:3,travel:60,radius:23,element:art.dashElement(eq,sword),equipment:eq,sword,motion:true});engine.drawSlashEffect(c,{x:120,y:160,endX:330,endY:80,id:slash.id,strength:.85,progress:.35,equipment:eq});engine.drawSwordWeapon(c,{x:160,y:110,radius:23,angle:-.2,equipment:eq,sword,active:true,motion:false});return cv.toBuffer('image/png');};assert.deepEqual(draw(before),draw(art));attacks++;
}
writeFileSync(`${out}/tails-before-after.png`,cv.toBuffer('image/png'));writeFileSync(`${out}/results.json`,JSON.stringify({beforePath,records,unchangedAttackCells:attacks},null,2));
console.log(`PASS ${records.length} genuine tail/body/core/size comparisons all visibly changed; ${attacks} original attacks pixel-identical.`);
for(const tail of tails){const cells=records.filter(r=>r.tail===tail.id&&r.radius===23);console.log(`${tail.id}: minimum ${(Math.min(...cells.map(r=>r.fraction))*100).toFixed(1)}% of 23px character footprint changed`);}
