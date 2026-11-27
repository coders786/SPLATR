// Before/after character evidence plus exact unchanged attack presentation.
// Requires a genuine pre-chunk standalone renderer snapshot (ignored locally).
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as current from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk10/visual-audit';mkdirSync(out,{recursive:true});
const beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk10/art-before.js');assert.ok(existsSync(beforePath),'Use QA_BEFORE_ART with a genuine pre-chunk portable renderer; never rebaseline against the current source.');const before=await import(pathToFileURL(beforePath).href);
const cores=ITEMS.filter(i=>i.slot==='core'),bodies=ITEMS.filter(i=>i.slot==='body'),dashes=ITEMS.filter(i=>i.slot==='dash'),slashes=ITEMS.filter(i=>i.slot==='slash');
const cases=[];
function hero(art,equipment,radius){const cv=createCanvas(300,240),c=cv.getContext('2d');art.drawCubeHero(c,{x:180,y:130,radius,equipment,motion:false,time:0,pose:{blink:1}});return {cv,c,bytes:c.getImageData(0,0,300,240).data};}
for(const body of bodies)for(const core of cores)for(const radius of [23,58]){
 const equipment=normalizeEquipment({body:body.id,core:core.id}),a=hero(before,equipment,radius),b=hero(current,equipment,radius);let changed=0,union=0;
 for(let i=0;i<a.bytes.length;i+=4){if(a.bytes[i+3]||b.bytes[i+3])union++;if(a.bytes[i]!==b.bytes[i]||a.bytes[i+1]!==b.bytes[i+1]||a.bytes[i+2]!==b.bytes[i+2]||a.bytes[i+3]!==b.bytes[i+3])changed++;}
 assert.ok(changed>0,`${body.id}/${core.id}/${radius}`);
 // Protect the unchanged eye/upper-face pixels, not just the hit rules.
 const crop=c=>Buffer.from(c.getImageData(180-radius*.70,130-radius*.54,radius*1.40,radius*.69).data);
 assert.deepEqual(crop(a.c),crop(b.c),`upper face changed:${body.id}/${core.id}/${radius}`);
 cases.push({body:body.id,core:core.id,radius,changed,footprint:union,fraction:changed/union});
}
// No core makeover may alter an explicit Dash or Slash. Check every one of
// 8x7x7=392 loadouts against the original renderer with real resolved swords.
let attackCells=0;
for(const dash of dashes)for(const slash of slashes)for(const core of cores){
 const equipment=normalizeEquipment({dash:dash.id,slash:slash.id,core:core.id}),sword=swordProfile(equipment);
 const attack=art=>{const cv=createCanvas(400,220),c=cv.getContext('2d');
  art.drawElementalDash(c,{x:170,y:100,vx:25,vy:-4,age:3,travel:60,radius:23,element:current.dashElement(equipment,sword),equipment,sword,motion:true});
  art.drawSlashEffect(c,{x:120,y:160,endX:330,endY:80,id:slash.id,strength:.85,progress:.35,equipment});
  art.drawSwordWeapon(c,{x:160,y:110,radius:23,angle:-.2,equipment,sword,active:true,motion:false});return Buffer.from(c.getImageData(0,0,400,220).data);};
 assert.deepEqual(attack(before),attack(current),`${dash.id}/${slash.id}/${core.id}: attack presentation changed`);attackCells++;
}
const comparison=createCanvas(1400,570),c=comparison.getContext('2d');c.fillStyle='#10181d';c.fillRect(0,0,1400,570);c.font='bold 17px sans-serif';c.fillStyle='#a4b5ac';c.fillText('BEFORE / SMALL SYMBOL CHAMBERS',22,28);c.fillStyle='#e9efdc';c.fillText('AFTER / FITTED CORE MECHANISMS — SAME IRON SHELL',22,302);
cores.forEach((core,i)=>{const x=i*200,equipment=normalizeEquipment({body:'iron',core:core.id});for(const [art,y]of [[before,35],[current,310]]){c.save();c.beginPath();c.rect(x,y,200,228);c.clip();art.drawCubeHero(c,{x:x+113,y:y+122,radius:63,equipment,motion:false,time:0});c.restore();}c.fillStyle='#e8e8db';c.font='bold 13px sans-serif';c.fillText(core.name,x+13,548);});
writeFileSync(`${out}/core-before-after.png`,comparison.toBuffer('image/png'));
writeFileSync(`${out}/results.json`,JSON.stringify({beforePath,cases,unchangedAttackCells:attackCells},null,2));
for(const radius of [23,58]){const list=cases.filter(c=>c.radius===radius).map(c=>c.fraction).sort((a,b)=>a-b);console.log(`radius${radius}: all70 combinations visibly changed; min ${(list[0]*100).toFixed(1)}%, median ${(list[35]*100).toFixed(1)}% of character footprint; upper-face pixels exact.`);}
console.log(`PASS:${attackCells} original-snapshot attack cells exactly unchanged. Pixel deltas are visibility evidence, not aesthetics or an FPS benchmark.`);
