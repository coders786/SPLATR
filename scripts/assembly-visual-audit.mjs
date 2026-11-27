// Independent before/after pixel evidence. The original renderer snapshot is
// deliberately ignored scratch, NOT a production dependency or test rebaseline.
// QA_BEFORE_ART may point to a separately captured pre-chunk portable renderer.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as current from '../src/art/splatr-art-engine.js';
import {normalizeEquipment} from '../src/equipment.js';
import {HYBRIDS} from '../src/hybrids.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk9/visual-audit';mkdirSync(out,{recursive:true});
const beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk9/art-before.js');
assert.ok(existsSync(beforePath),'Capture a pre-chunk import-free renderer and pass QA_BEFORE_ART; never compare the current renderer to itself.');
const before=await import(pathToFileURL(beforePath).href);
const cases=[...current.ITEMS.filter(i=>i.slot==='body').map(i=>({kind:'shell',id:i.id,equipment:normalizeEquipment({body:i.id})})),
 ...HYBRIDS.map(h=>({kind:'family',id:h.id,equipment:normalizeEquipment(h.parts)}))];
function frame(art,equipment,radius){
 const canvas=createCanvas(400,290),c=canvas.getContext('2d');
 art.drawCubeHero(c,{x:235,y:180,radius,equipment,motion:false,time:0,pose:{blink:1}});
 return {canvas,data:c.getImageData(0,0,400,290).data};
}
const report=[];
for(const row of cases)for(const radius of [23,58]){
 const old=frame(before,row.equipment,radius),now=frame(current,row.equipment,radius);let changed=0,union=0;
 for(let i=0;i<old.data.length;i+=4){if(old.data[i+3]||now.data[i+3])union++;
  if(old.data[i]!==now.data[i]||old.data[i+1]!==now.data[i+1]||old.data[i+2]!==now.data[i+2]||old.data[i+3]!==now.data[i+3])changed++;
 }
 assert.ok(changed>0,`${row.id}/${radius}: no visual change`);
 report.push({kind:row.kind,id:row.id,radius,changedPixels:changed,characterFootprintPixels:union,changedFraction:changed/union});
 if(radius===58)writeFileSync(`${out}/${row.kind}-${row.id}.png`,now.canvas.toBuffer('image/png'));
}
// Also prove that the shared shell mount does not repaint any distal blade.
const bladeChecks=[];
for(const row of cases.filter(c=>c.kind==='shell')){
 const blade=art=>{const cv=createCanvas(400,200),c=cv.getContext('2d');art.drawSwordWeapon(c,{x:60,y:80,radius:48,angle:0,active:true,motion:false,equipment:row.equipment,sword:{family:'rapier',reach:1.2,width:.8,color:'#88e9ff'}});return Buffer.from(c.getImageData(135,30,260,120).data);};
 assert.deepEqual(blade(current),blade(before),`${row.id}: distal blade changed`);bladeChecks.push(row.id);
}
writeFileSync(`${out}/results.json`,JSON.stringify({beforePath,cases:report,distalBladeUnchanged:bladeChecks},null,2));
for(const kind of ['shell','family'])for(const radius of [23,58]){
 const values=report.filter(r=>r.kind===kind&&r.radius===radius).map(r=>r.changedFraction).sort((a,b)=>a-b);
 console.log(`${kind} radius${radius}: all changed; min ${(values[0]*100).toFixed(1)}%, median ${(values[Math.floor(values.length/2)]*100).toFixed(1)}% of character footprint`);
}
console.log('PASS: original-snapshot comparison at both scales; all10 distal blades unchanged. Pixel deltas are visual evidence, not an aesthetic rating or FPS claim.');
