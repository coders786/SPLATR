// Real UI regression checks for the visibility defects found in screenshot review.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT,ITEMS} from '../src/equipment.js';
import {shopGroup} from '../src/shop-catalog.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5188',out=process.env.QA_OUT_DIR||'.arena/item-visual-review/interaction';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000}),results=[];
try{
 for(const [width,height,reduced]of [[1440,1000,false],[390,844,false],[844,390,false],[390,844,true]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:width<1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let clock=0,id=0;const queue=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);
   window.qaAdvance=ms=>{const end=clock+ms;while(clock<end){clock=Math.min(end,clock+1000/60);const work=[...queue.values()];queue.clear();for(const fn of work)fn(clock);}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('#customize-btn');await page.evaluate(()=>document.fonts.ready);
  const advance=ms=>page.evaluate(ms=>qaAdvance(ms),ms),click=async sel=>{const e=await page.$(sel);assert.ok(e,sel);await e.scrollIntoView();if(width<1000)await e.tap();else await e.click();await e.dispose();await advance(50);};
  const save=()=>page.evaluate(()=>[localStorage.getItem('riot.equipment'),localStorage.getItem('riot.shop-wallet')]),key=`${width}x${height}${reduced?'-reduced':''}`;
  // Opening the shop normalizes a legacy seed to include free owned items.
  // Snapshot after that migration, before any browsing or inspection.
  await click('#customize-btn');const before=await save();
  for(const id of ['iron','dash-lightning','dash-echo']){
   const item=ITEMS.find(i=>i.id===id);
   if(await page.$eval('.custom-view-switch',e=>getComputedStyle(e).display!=='none'))await click('.custom-view-switch button:first-child');
   await click(`.shop-group[data-group="${shopGroup(item.slot).id}"]`);await click(`.shop-slots [data-slot="${item.slot}"]`);await click(`[data-item="${id}"]`);await page.mouse.move(1,1);
   assert.equal(await page.$eval('.shop-demo-mode',e=>e.value),'story');
   const cardSelector=`[data-item="${id}"] canvas`,pixels=sel=>page.$eval(sel,e=>e.toDataURL());
   if(id==='dash-lightning'){
    // The visible catalogue card must really redraw, not just get a CSS class.
    const card=await page.$(cardSelector);await card.scrollIntoView();await advance(310);const a=await pixels(cardSelector);await card.screenshot({path:`${out}/card-${id}-${key}-a.png`});await advance(140);const b=await pixels(cardSelector);await card.screenshot({path:`${out}/card-${id}-${key}-b.png`});
    if(reduced)assert.equal(a,b,'reduced-motion cards remain still');else assert.notEqual(a,b,'selected dash card animates');await card.dispose();
   }
   if(await page.$eval('.custom-view-switch',e=>getComputedStyle(e).display!=='none'))await click('.custom-view-switch button:last-child');
   await advance(600);
   const bounds=await page.$eval('.custom-lab>canvas',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};});
   assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width+1&&bounds.bottom<=height+1,JSON.stringify({key,id,bounds}));
   assert.equal(await page.$eval('.custom-lab>canvas',e=>e.getAttribute('role')),'img');
   const stage=await page.$('.custom-lab>canvas');await stage.screenshot({path:`${out}/${id}-${key}-a.png`});const a=await pixels('.custom-lab>canvas');await advance(1200);await stage.screenshot({path:`${out}/${id}-${key}-b.png`});const b=await pixels('.custom-lab>canvas');await advance(2300);await stage.screenshot({path:`${out}/${id}-${key}-c.png`});
   if(reduced)assert.equal(a,b);else assert.notEqual(a,b);
   await page.screenshot({path:`${out}/${id}-${key}-full.png`});
   if(!reduced){await click('.shop-demo-play');const paused=await pixels('.custom-lab>canvas');await advance(1400);assert.equal(await pixels('.custom-lab>canvas'),paused,'main stage pause is real');await click('.shop-demo-play');}
   if(id==='iron'){
    await click('.assembly-inspect');assert.equal(await page.$eval('.shop-demo-mode',e=>e.value),'assembly');await click('.assembly-next');await click('.assembly-current');
    assert.equal(await page.$eval('.custom-lab>canvas',e=>e.dataset.assemblyBody),'iron');
    await click('.lab-exit');await click('#customize-btn');assert.equal(await page.$eval('.shop-demo-mode',e=>e.value),'story','reopening body browse must not silently return to assembly');
   }
   assert.deepEqual(await save(),before,'read-only preview cannot buy, equip or change presets');results.push({id,key,reduced,bounds,saveUnchanged:true});await stage.dispose();
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(`PASS ${results.length} ordinary-click visibility cases, 3 viewport sizes, reduced motion, visible card animation, pause, explicit assembly and unchanged saves.`);
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
