import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ITEMS} from '../src/equipment.js';
const out=process.env.STORE_QA_OUT||'docs/store-performances',base=process.env.PREVIEW_URL||'http://127.0.0.1:5192';
mkdirSync(`${out}/items`,{recursive:true});mkdirSync(`${out}/native`,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),errors=[],rows=[],layouts=[];
const groups={head:'cube',eyes:'cube',body:'cube',core:'cube',tail:'cube',slash:'attack',dash:'attack',pointer:'sensors',radar:'sensors',trajectory:'sensors',world:'world'};
const advance=(p,n=8)=>p.evaluate(n=>qaFrames(n),n);
async function click(p,selector){await p.$eval(selector,n=>n.scrollIntoView({block:'nearest'}));await p.click(selector);await advance(p);}
async function open(width,height,reduced=false){const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height});await p.evaluateOnNewDocument(reduced=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.motion',reduced?'0':'1');localStorage.setItem('riot.postfx','off');let clock=performance.now(),id=0;const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...queue.values()];queue.clear();for(const fn of work)fn(clock);}};},reduced);await p.goto(base,{waitUntil:'domcontentloaded'});await advance(p);await click(p,'#customize-btn');await p.evaluate(()=>document.fonts.ready);return p;}
const save=p=>p.evaluate(()=>({equipment:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')}));
const canvases=p=>p.$$eval('.custom-card',ns=>ns.map(n=>{const cv=n.querySelector('canvas'),r=cv.getBoundingClientRect(),v=n.closest('.custom-grid').getBoundingClientRect();return{id:n.dataset.item,visible:r.bottom>v.top&&r.top<v.bottom&&r.right>v.left&&r.left<v.right,image:cv.toDataURL()};}));
async function slot(p,s){await click(p,`.shop-groups [data-group="${groups[s]}"]`);await click(p,`.shop-slots [data-slot="${s}"]`);}
try{
 const p=await open(1440,900),before=await save(p);
 const a=await canvases(p);await advance(p,26);const b=await canvases(p);for(const item of a){const next=b.find(x=>x.id===item.id);if(item.visible)assert.notEqual(next.image,item.image,`unhovered shelf ${item.id} animates`);else assert.equal(next.image,item.image,`offscreen ${item.id} is culled`);}
 await click(p,'.shop-demo-play');const held=await canvases(p),main=await p.$eval('.custom-lab>canvas',n=>n.toDataURL());await advance(p,90);assert.deepEqual(await canvases(p),held,'all shelf cards pause together');assert.equal(await p.$eval('.custom-lab>canvas',n=>n.toDataURL()),main,'selected preview pauses');await click(p,'.shop-demo-play');
 for(const s of Object.keys(groups)){
  await slot(p,s);await p.screenshot({path:`${out}/native/desktop-${s}.jpg`,type:'jpeg',quality:82});
  for(const it of ITEMS.filter(i=>i.slot===s)){
   await click(p,`[data-item="${it.id}"]`);
   for(let beat=0;beat<3;beat++){
    await click(p,`.visual-story-step[data-step="${beat}"]`);
    const cv=await p.$('.custom-lab>canvas');await cv.screenshot({path:`${out}/items/${it.id}-${beat}.jpg`,type:'jpeg',quality:83});
    const painted=await p.$eval('.custom-lab>canvas',cv=>{const c=cv.getContext('2d'),d=c.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=0;i<d.length;i+=16)if(d[i]+d[i+1]+d[i+2]>180)n++;return n;});assert.ok(painted>20,`${it.id}/${beat} painted`);rows.push({id:it.id,slot:s,beat,painted});
   }
  }
 }
 assert.deepEqual(await save(p),before,'browsing all 73 items leaves ownership, purchases and equipment untouched');await p.close();
 for(const [width,height,reduced] of [[390,844,false],[320,568,false],[844,390,false],[390,844,true]]){
  const p=await open(width,height,reduced),before=await save(p);await slot(p,'dash');await click(p,'[data-item="dash-water"]');await p.screenshot({path:`${out}/native/${width}x${height}${reduced?'-reduced':''}-shelf.jpg`,type:'jpeg',quality:85});
  if(reduced){const a=await canvases(p);await advance(p,100);assert.deepEqual(await canvases(p),a,'reduced-motion shelves stay still');}
  await click(p,'.watch-part');await click(p,'.visual-story-step[data-step="1"]');await p.screenshot({path:`${out}/native/${width}x${height}${reduced?'-reduced':''}-preview.jpg`,type:'jpeg',quality:85});
  const geometry=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('.custom-lab>canvas').getBoundingClientRect().toJSON()}));assert.equal(geometry.overflow,false);assert.ok(geometry.canvas.width>180);assert.deepEqual(await save(p),before);layouts.push({width,height,reduced,...geometry});await p.close();
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${rows.length} actual selected-canvas captures, every unhovered visible card animated, offscreen culling, all-card pause, reduced motion, save retention, ${layouts.length} mobile layouts`);
}finally{await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify({rows,layouts,errors,method:'Actual Armory UI driven through native buttons; item crops are selected canvas screenshots, not a separate art-study page.'},null,2));}
