// Genuine pre-chunk visual evidence. QA_BEFORE_ART must be captured before edits.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk12/visual-audit',beforePath=resolve(process.env.QA_BEFORE_ART||'.arena/harmony-chunk12/art-before.js');
assert.ok(existsSync(beforePath),'Supply genuine pre-chunk portable renderer');mkdirSync(out,{recursive:true});
const before=await import(pathToFileURL(beforePath).href),worlds=ITEMS.filter(i=>i.slot==='world'),records=[];
const frame=(engine,id,w,h,camera)=>{const cv=createCanvas(w,h),c=cv.getContext('2d');engine.drawWorldBackdrop(c,w,h,id,0,camera);return {cv,bytes:c.getImageData(0,0,w,h).data};};
const sheet=createCanvas(1000,worlds.length*326+42),c=sheet.getContext('2d');c.fillStyle='#0d1320';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='#e0e0da';c.font='bold 15px sans-serif';c.fillText('BEFORE / GENUINE PRE-CHUNK',15,25);c.fillText('AFTER / SAME CAMERA AND ACTORS',515,25);
for(const [row,world]of worlds.entries()){
 for(const [w,h]of [[960,600],[390,844]])for(const camera of [{x:0,y:0,scale:1},{x:240,y:-1300,scale:.8},{x:-430,y:-4700,scale:1.15}]){
  const a=frame(before,world.id,w,h,camera),b=frame(art,world.id,w,h,camera);let changed=0;
  for(let i=0;i<a.bytes.length;i+=4)if(Math.abs(a.bytes[i]-b.bytes[i])+Math.abs(a.bytes[i+1]-b.bytes[i+1])+Math.abs(a.bytes[i+2]-b.bytes[i+2])>12)changed++;
  // Twilight is the finished neutral baseline: its distant crane may be fully
  // occluded at a given camera. Paid environments, not that baseline, are rebuilt.
  if(world.id!=='twilight')assert.ok(changed/(w*h)>.2,`${world.id}: screen-wide change required`);
  else if(w===960&&camera.x===0)assert.ok(changed/(w*h)>.01,'neutral crane visible at origin');
  records.push({world:world.id,w,h,camera,changed,fraction:changed/(w*h)});
  if(w===960&&camera.x===0){
   for(const [col,f]of [[0,a],[1,b]]){
    const ctx=f.cv.getContext('2d');art.drawCubeHero(ctx,{x:425,y:340,radius:28,equipment:normalizeEquipment({world:world.id}),motion:false,pose:{blink:1}});
    art.drawEnemyShape(ctx,{x:650,y:265,radius:30,kind:'fang',angle:.3});
    art.drawEnemyShape(ctx,{x:575,y:420,radius:29,kind:'prism',angle:0});
    c.drawImage(f.cv,col*500,42+row*326,500,300);
   }
   c.fillStyle='#e0e0da';c.font='bold 13px monospace';c.fillText(world.name.toUpperCase(),14,42+row*326+318);
   writeFileSync(`${out}/${world.id}-after.png`,b.cv.toBuffer('image/png'));
  }
 }
}
// Architecture must not silently repaint any attack or hero mechanism.
let attacks=0,heroes=0;
for(const core of ITEMS.filter(i=>i.slot==='core'))for(const dash of ITEMS.filter(i=>i.slot==='dash'))for(const slash of ITEMS.filter(i=>i.slot==='slash')){
 const eq=normalizeEquipment({core:core.id,dash:dash.id,slash:slash.id}),sword=swordProfile(eq),draw=engine=>{const cv=createCanvas(400,220),ctx=cv.getContext('2d');engine.drawElementalDash(ctx,{x:170,y:100,vx:25,vy:-4,age:3,travel:60,radius:23,element:art.dashElement(eq,sword),equipment:eq,sword,motion:true});engine.drawSlashEffect(ctx,{x:120,y:160,endX:330,endY:80,id:slash.id,strength:.85,progress:.35,equipment:eq});engine.drawSwordWeapon(ctx,{x:160,y:110,radius:23,angle:-.2,equipment:eq,sword,active:true,motion:false});return cv.toBuffer('image/png');};assert.deepEqual(draw(before),draw(art));attacks++;
}
for(const body of ITEMS.filter(i=>i.slot==='body'))for(const core of ITEMS.filter(i=>i.slot==='core')){
 const draw=engine=>{const cv=createCanvas(180,180);engine.drawCubeHero(cv.getContext('2d'),{x:90,y:90,radius:48,equipment:normalizeEquipment({body:body.id,core:core.id}),motion:false,pose:{blink:1}});return cv.toBuffer('image/png');};assert.deepEqual(draw(before),draw(art));heroes++;
}
writeFileSync(`${out}/worlds-before-after.png`,sheet.toBuffer('image/png'));writeFileSync(`${out}/results.json`,JSON.stringify({beforePath,records,unchangedAttacks:attacks,unchangedHeroes:heroes},null,2));
console.log(`PASS ${records.length} genuine world comparisons; ${attacks} attacks and ${heroes} hero assemblies pixel-identical.`);
for(const world of worlds)console.log(`${world.id}: minimum ${(Math.min(...records.filter(r=>r.world===world.id).map(r=>r.fraction))*100).toFixed(1)}% screen visibly changed`);
