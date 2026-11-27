// Reproducible captures of CURRENT art, not proposed upgrade artwork.
// Outputs ignored local QA images; no game state or source is modified.
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/visual-replan',{recursive:true});
import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {ITEMS,normalizeEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
import {drawShopCardArt,drawShopElementDash,drawShopElementSlash} from '../src/art/splatr-art-engine.js';
const dir='.arena/visual-replan';
for(const [group,slots]of [['heads-eyes',['head','eyes']],['shells-cores',['body','core']],['tails-worlds',['tail','world']],['aim-sensors',['pointer','radar','trajectory']]]){
 const items=ITEMS.filter(i=>slots.includes(i.slot)),cols=4,cw=300,ch=205,canvas=createCanvas(cw*cols,Math.ceil(items.length/cols)*ch),c=canvas.getContext('2d');c.fillStyle='#100e19';c.fillRect(0,0,canvas.width,canvas.height);
 items.forEach((it,i)=>{const x=i%cols*cw,y=Math.floor(i/cols)*ch,eq=normalizeEquipment({[it.slot]:it.id});c.save();c.translate(x,y);c.save();c.beginPath();c.rect(0,0,cw,175);c.clip();drawShopCardArt(c,cw,175,{equipment:eq,slot:it.slot,time:28,motion:true,selected:false});c.restore();c.fillStyle='#ece6dc';c.font='15px sans-serif';c.fillText(it.name+' / '+it.id,8,195);c.restore();});writeFileSync(`${dir}/${group}.png`,canvas.toBuffer('image/png'));
}
for(const [slot,draw]of [['dash',drawShopElementDash],['slash',drawShopElementSlash]]){
 const items=ITEMS.filter(i=>i.slot===slot),canvas=createCanvas(1200,items.length*200),c=canvas.getContext('2d');
 items.forEach((it,i)=>[240,410,570,850].forEach((time,j)=>{const eq=normalizeEquipment({[slot]:it.id}),sword=swordProfile(eq);c.save();c.translate(j*300,i*200);draw(c,300,170,{equipment:eq,sword,time,motion:true});c.fillStyle='#ece6dc';c.font='13px sans-serif';c.fillText(`${it.name} / ${time}ms`,6,190);c.restore();}));writeFileSync(`${dir}/${slot}-stages.png`,canvas.toBuffer('image/png'));
}
console.log('Captured current unmodified art, 73 catalogue items; not proposed art.');
