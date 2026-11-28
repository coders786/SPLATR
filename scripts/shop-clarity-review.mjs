// Screenshot-led player walkthrough. Review artifacts only; no application edits.
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',out='docs/shop-clarity-review';mkdirSync(out,{recursive:true});
const b=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),rows=[],errors=[];
const advance=p=>p.evaluate(()=>qaFrames(8));
async function click(p,sel){await p.$eval(sel,n=>n.scrollIntoView({block:'nearest'}));await p.click(sel);await advance(p);}
async function shot(p,id,task){const file=id+'.jpg';await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${out}/${file}`,type:'jpeg',quality:87});const state=await p.evaluate(()=>{const box=s=>{const n=document.querySelector(s);if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};return{viewport:{w:innerWidth,h:innerHeight},root:{...document.querySelector('.shape-lab')?.dataset},canvas:box('.custom-lab>canvas'),purchase:box('.preview-purchase'),shop:box('.custom-shop'),preview:box('.custom-lab'),infoOpen:document.querySelector('.power-sheet')?.open,text:document.querySelector('.shape-lab')?.innerText};});rows.push({file,task,...state});}
async function open(w,h,coins=0){const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:w,height:h,hasTouch:w<700});await p.evaluateOnNewDocument(coins=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');if(coins)localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins,owned:[]}));let clock=performance.now(),id=0;const q=new Map();window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};},coins);await p.goto(base,{waitUntil:'domcontentloaded'});await advance(p);await p.waitForSelector('#customize-btn',{visible:true});await click(p,'#customize-btn');await p.waitForSelector('.shape-lab[open]');return p;}
try{
 for(const [w,h]of [[1440,900],[390,844],[320,568],[640,360]]){
  const p=await open(w,h),tag=`${w}x${h}`;
  await shot(p,`${tag}-01-entry`,'Open Shop from the normal post-training-completed home; no item deep link; fresh 0-credit save.');
  await click(p,'[data-item="coil"]');await shot(p,`${tag}-02-selected`,'Select Lightning Coil. What is selected, owned, or affordable?');
  if(w<700)await click(p,'.custom-view-switch button:last-child');await shot(p,`${tag}-03-watch`,'Watch the selected item. Can I still see the item name, category, ownership and next action?');
  await click(p,'.visual-story-info');await shot(p,`${tag}-04-details`,'Open optional details. Are the effect and trade-off easier to find?');await click(p,'.power-sheet button');
  await click(p,'.compare-part');await shot(p,`${tag}-05-compare`,'Compare the item with what I wear. How much UI must I decode?');
  if(w<700)await click(p,'.custom-view-switch button:first-child');await click(p,'.shop-slots [data-slot="core"]');await shot(p,`${tag}-06-cores`,'Browse cores. Are the meaningful differences scannable from the cards?');
  await click(p,'[data-item="grav"]');if(w<700)await click(p,'.custom-view-switch button:last-child');await shot(p,`${tag}-07-grav`,'Inspect an unfamiliar core after changing category.');
  if(w<700)await click(p,'.custom-view-switch button:first-child');await p.select('.shop-filter','affordable');await advance(p);await shot(p,`${tag}-08-affordable`,'Filter by what a fresh 0-credit player can afford.');
  await p.close();
 }
 const p=await open(1440,900,1500);await click(p,'[data-item="coil"]');await shot(p,'funded-01-buy','Controlled 1500-credit fixture, inspect an affordable part.');await click(p,'.equip-part');await shot(p,'funded-02-owned','Buy the Coil: distinguish purchase from equipping.');await click(p,'.equip-part');await shot(p,'funded-03-equipped','Equip the Coil: distinguish currently worn from selected.');await click(p,'.assembly-inspect');await shot(p,'advanced-01-build','Open the secondary build inspector.');await click(p,'.shop-preview-toggle');await shot(p,'advanced-02-practice','Open secondary practice controls.');await p.close();
 console.log(`Captured ${rows.length} native screenshots; page errors: ${errors.length}.`);
}finally{await b.close();writeFileSync(`${out}/manifest.json`,JSON.stringify({method:'Scripted player-perspective walkthrough, not human participant research. Native home → Shop navigation; fresh save with training completed and 0 credits in four layouts. Separate funded transaction fixture is explicitly identified. RAF advanced deterministically for comparable stills. Application source and UI styles unchanged.',errors,rows},null,2));}
