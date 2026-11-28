// Identical inputs through a genuine pre-pass renderer and production renderer.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import * as art from '../src/art/splatr-art-engine.js';
const baseline=resolve(process.env.QA_BEFORE_ART||'.arena/action-harmony/art-before.js');assert.ok(existsSync(baseline),'genuine pre-pass renderer required');
const before=await import(pathToFileURL(baseline));
const out=process.env.QA_OUT_DIR||'docs/action-harmony-review';mkdirSync(out,{recursive:true});
const cores=['standard','grav','riot','time','glass','magnet','echo'];
const dashes=['ink','fire','lightning','ice','water','void','echo'];
const bg=(c,w,h)=>{c.fillStyle='#111821';c.fillRect(0,0,w,h);c.strokeStyle='#27313e';c.lineWidth=1;for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}};
function row(c,engine,core,y){
 const eq={core,body:'paper',head:'none',eyes:'ninja',tail:'none',dash:'dash-lightning',slash:'katana'};
 c.save();c.translate(0,y);c.fillStyle='#b7c6d2';c.font='12px sans-serif';c.fillText('SLASH / RELEASE',28,25);c.fillText('DASH / LAUNCH',468,25);c.fillText('CORE / RELEASE DETAIL',908,25);
 engine.drawSlashEffect(c,{x:60,y:159,endX:375,endY:103,progress:.37,equipment:eq,id:'katana'});
 engine.drawCubeHero(c,{x:76,y:150,radius:29,equipment:eq,motion:true,pose:{blink:1,attackProgress:.37}});
 engine.drawElementalDash(c,{x:729,y:125,vx:32,age:3,travel:65,radius:33,equipment:eq});
 engine.drawCubeHero(c,{x:729,y:125,radius:33,equipment:eq,motion:true,pose:{blink:1,dashProgress:.3}});
 engine.drawCubeHero(c,{x:1090,y:125,radius:76,equipment:eq,motion:true,pose:{blink:1,attackProgress:.3}});
 c.restore();
}
for(const core of cores){const cv=createCanvas(1320,480),c=cv.getContext('2d');bg(c,1320,480);row(c,before,core,0);row(c,art,core,240);c.fillStyle='#8f9eae';c.font='bold 12px sans-serif';c.fillText('BEFORE',28,225);c.fillStyle=art.resolveCoreFx({core}).primary;c.fillText('NOW / '+core.toUpperCase(),28,465);writeFileSync(`${out}/${core}.jpg`,cv.toBuffer('image/jpeg',85));}
const cv=createCanvas(1400,350),c=cv.getContext('2d');bg(c,1400,350);
for(const [i,element]of dashes.entries()){
 const eq={core:'time',dash:'dash-'+element,body:'paper'};const x=i*200+145;
 c.fillStyle='#d0dfeb';c.font='bold 13px sans-serif';c.fillText(element.toUpperCase(),i*200+16,28);
 for(let j=0;j<2;j++){const y=110+j*160,engine=j?art:before;engine.drawElementalDash(c,{x,y,vx:32,age:3,travel:60,radius:24,equipment:eq,element});engine.drawCubeHero(c,{x,y,radius:24,equipment:eq,motion:false,pose:{blink:1}});}
}writeFileSync(`${out}/all-dashes.jpg`,cv.toBuffer('image/jpeg',88));
// Reproducible temporal samples rather than hashes standing in for evidence.
const slashCv=createCanvas(1440,270),sc=slashCv.getContext('2d');bg(sc,1440,270);
for(const [i,progress]of [.06,.18,.32,.48,.66,.86].entries()){
 const x=i*240,eq={core:'echo',slash:'katana'};sc.save();sc.translate(x,0);art.drawSlashEffect(sc,{x:22,y:160,endX:219,endY:110,id:'katana',progress,equipment:eq});sc.fillStyle='#d1c1dc';sc.font='12px sans-serif';sc.fillText(['GATHER','OPEN','CUT','SHED','SETTLE','FADE'][i],18,33);sc.restore();
}writeFileSync(`${out}/slash-sequence.jpg`,slashCv.toBuffer('image/jpeg',88));
// Protect authoritative leading silhouettes and motion-off intent against the
// genuine baseline; only the rear cosmetic wake is allowed to change here.
const aCv=createCanvas(400,240),bCv=createCanvas(400,240);
const paint=(cv,fn)=>{const ctx=cv.getContext('2d');ctx.reset();fn(ctx);return cv.toBuffer('image/png');};
let unchangedLeading=0,unchangedStillSlashes=0,unchangedIdleCores=0;
for(const core of cores){
 const eq={core};
 assert.ok(paint(aCv,c=>before.drawCubeHero(c,{x:200,y:120,radius:60,equipment:eq,motion:false})).equals(paint(bCv,c=>art.drawCubeHero(c,{x:200,y:120,radius:60,equipment:eq,motion:false}))),core+' idle core construction');unchangedIdleCores++;
 for(const element of dashes){
  const spec={x:240,y:120,vx:32,age:3,travel:60,radius:24,equipment:{core,dash:'dash-'+element},element};
  paint(aCv,c=>before.drawElementalDash(c,spec));paint(bCv,c=>art.drawElementalDash(c,spec));
  assert.ok(Buffer.from(aCv.getContext('2d').getImageData(240,0,160,240).data).equals(Buffer.from(bCv.getContext('2d').getImageData(240,0,160,240).data)),core+'/'+element+' leading power silhouette');unchangedLeading++;
 }
 for(const id of ['razor','blood','laser','katana','confetti','comic','pixel','glitch-fx']){
  const spec={x:50,y:170,endX:340,endY:90,id,equipment:eq,reducedMotion:true,progress:.6};
  assert.ok(paint(aCv,c=>before.drawSlashEffect(c,spec)).equals(paint(bCv,c=>art.drawSlashEffect(c,spec))),core+'/'+id+' reduced slash');unchangedStillSlashes++;
 }
}
writeFileSync(`${out}/audit.json`,JSON.stringify({baseline,cores,dashes,unchangedLeading,unchangedStillSlashes,unchangedIdleCores,method:'Genuine pre-pass and current production renderer, identical equipment/age/camera. Top before, bottom after. Supplemented by browser captures and native real-run checks.',files:[...cores.map(c=>c+'.jpg'),'all-dashes.jpg','slash-sequence.jpg']},null,2));
console.log('Saved seven genuine before/after core studies, all seven dash silhouettes, and six slash phases.');
