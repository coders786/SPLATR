// Genuine pre-chunk comparisons, never a current-source visual rebaseline.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk11/visual-audit';mkdirSync(out,{recursive:true});
const beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk11/art-before.js');assert.ok(existsSync(beforePath),'Supply a genuine pre-chunk portable renderer via QA_BEFORE_ART');const before=await import(pathToFileURL(beforePath).href);
const bodies=['hologram','iron','prism'],cores=ITEMS.filter(i=>i.slot==='core'),worlds=ITEMS.filter(i=>i.slot==='world'),records=[];
const frame=(engine,equipment,radius,view=null)=>{const cv=createCanvas(300,240),c=cv.getContext('2d');engine.drawCubeHero(c,{x:180,y:140,radius,equipment,motion:false,time:0,pose:{blink:1,shellAbility:view}});return {cv,bytes:c.getImageData(0,0,300,240).data};};
for(const body of bodies)for(const core of cores)for(const world of worlds)for(const radius of [23,58]){
 const eq=normalizeEquipment({body,core:core.id,world:world.id}),a=frame(before,eq,radius),b=frame(art,eq,radius);let changed=0,footprint=0;
 for(let i=0;i<a.bytes.length;i+=4){if(a.bytes[i+3]||b.bytes[i+3])footprint++;if(a.bytes[i]!==b.bytes[i]||a.bytes[i+1]!==b.bytes[i+1]||a.bytes[i+2]!==b.bytes[i+2]||a.bytes[i+3]!==b.bytes[i+3])changed++;}
 assert.ok(changed>0,`${body}/${core.id}/${world.id}/${radius}`);records.push({body,core:core.id,world:world.id,radius,changed,footprint,fraction:changed/footprint});
}
// Preserve attack presentation exactly: the new feature alters ONLY a narrowly
// eligible hostile needle/player pair, not a player's dash/slash/blade geometry.
let attackCells=0;
for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash'))for(const core of cores){
 const eq=normalizeEquipment({dash:dash.id,slash:slash.id,core:core.id}),sword=swordProfile(eq),draw=engine=>{const cv=createCanvas(400,220),c=cv.getContext('2d');engine.drawElementalDash(c,{x:170,y:100,vx:25,vy:-4,age:3,travel:60,radius:23,element:art.dashElement(eq,sword),equipment:eq,sword,motion:true});engine.drawSlashEffect(c,{x:120,y:160,endX:330,endY:80,id:slash.id,strength:.85,progress:.35,equipment:eq});engine.drawSwordWeapon(c,{x:160,y:110,radius:23,angle:-.2,equipment:eq,sword,active:true,motion:false});return Buffer.from(c.getImageData(0,0,400,220).data);};assert.deepEqual(draw(before),draw(art));attackCells++;
}
const cv=createCanvas(1080,760),c=cv.getContext('2d');c.fillStyle='#10181d';c.fillRect(0,0,1080,760);
const labels=['HOLOGRAM / ONE NEEDLE PHASE','IRON / ONE GUARD LATCH','PRISM / TWO NEEDLE PORTS'];
for(let col=0;col<3;col++){
 const body=bodies[col],x=col*360,eq=normalizeEquipment({body,core:'standard'});c.fillStyle='#e6ecdc';c.font='bold 14px sans-serif';c.fillText(labels[col],x+15,27);
 const states=[null,{kind:body,ready:true,remaining:0,window:body==='hologram',spent:false},{kind:body,ready:false,remaining:90,window:false,spent:true}];
 for(let row=0;row<3;row++){const top=45+row*233,engine=row===0?before:art;c.save();c.beginPath();c.rect(x,top,360,230);c.clip();engine.drawCubeHero(c,{x:x+230,y:top+125,radius:66,equipment:eq,motion:false,time:0,pose:{blink:1,shellAbility:states[row]}});c.restore();c.fillStyle=row===0?'#a7b6ad':'#c6e2d0';c.font='11px monospace';const label=row===0?'BEFORE':row===1?(body==='hologram'?'LEGAL LAUNCH WINDOW':'READY'):(body==='iron'?'ACTUAL SPENT DENT':'ACTUAL RECHARGE');c.fillText(label,x+15,top+218);}
}
writeFileSync(`${out}/reactive-shells-before-after.png`,cv.toBuffer('image/png'));writeFileSync(`${out}/results.json`,JSON.stringify({beforePath,records,unchangedAttackCells:attackCells},null,2));
for(const body of bodies){const values=records.filter(r=>r.body===body&&r.radius===23).map(r=>r.fraction).sort((a,b)=>a-b);console.log(`${body}: all${values.length} core/world combinations change at23px; minimum ${(values[0]*100).toFixed(1)}% of footprint.`);}
console.log(`PASS:${records.length} character comparisons at both scales; ${attackCells} original attack cells remain pixel-exact. These are visual evidence, not FPS/aesthetic certification.`);
