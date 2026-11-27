// Native free previews and purchase boundaries; controlled RAF, not device FPS.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {SHOWCASE_IDS} from '../src/ability-showcase.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5187',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk15/browser';mkdirSync(out,{recursive:true});
const walletBalance=Number(process.env.QA_WALLET||1500);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000}),results=[];
try{
 const layouts=process.env.QA_DESKTOP_ONLY?[[1280,720,false,false]]:[[1280,720,false,false],[640,360,false,false],[390,844,true,false],[390,844,true,true]];
 for(const [width,height,touch,reduced]of layouts)for(const id of (process.env.QA_ITEM?[process.env.QA_ITEM]:process.env.QA_STUDY_IDS?process.env.QA_STUDY_IDS.split(','):SHOWCASE_IDS)){
  const item=ITEMS.find(i=>i.id===id),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced,walletBalance})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.motion',reduced?'0':'1');localStorage.setItem('riot.postfx','off');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:walletBalance,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
   // Record canvas copy too: a screenshot alone cannot audit every label.
   window.qaCanvasWords=[];const native=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){qaCanvasWords.push(String(text));return native.call(this,text,...args);};
  },{defaults:DEFAULT_EQUIPMENT,reduced,walletBalance});
  await page.goto(`${base}/?shopItem=${id}`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(5));await page.evaluate(()=>document.fonts.ready);
  const saved=()=>page.evaluate(()=>[localStorage.getItem('riot.equipment'),localStorage.getItem('riot.shop-wallet')]),before=await saved();
  const click=async selector=>{const n=await page.$(selector);if(touch)await n.tap();else await n.click();await n.dispose();await page.evaluate(()=>qaFrames(4));};
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});assert.ok(bounds.visible,JSON.stringify({id,width,height,bounds}));
  const guide=await page.$eval('.shop-ability-guide',n=>n.textContent);for(const label of ['WHAT IT DOES','HOW TO USE IT','WATCH FOR THIS'])assert.ok(guide.includes(label));assert.doesNotMatch(guide,/\bticks?\b|\bsimulation\b|\bprimary\b|\bclamped\b/i);
  const pixels=()=>page.$eval('.custom-lab>canvas',n=>n.toDataURL()),initial=await pixels();await page.evaluate(()=>qaFrames(110));const next=await pixels();if(reduced)assert.equal(initial,next);else assert.notEqual(initial,next,id);
  if(!reduced){await click('.shop-demo-play');const paused=await pixels();await page.evaluate(()=>qaFrames(40));assert.equal(await pixels(),paused);}
  await page.focus('.custom-lab>canvas');const scrollBefore=await page.$eval('.custom-lab',n=>n.scrollTop);await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab',n=>n.scrollTop),scrollBefore,'Space must not scroll the readonly stage');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.hits),'0');assert.deepEqual(await saved(),before);
  const canvasWords=await page.evaluate(()=>qaCanvasWords);assert.doesNotMatch(canvasWords.join(' '),/\bticks?\b|\bsimulation\b/i,id);
  await page.screenshot({path:`${out}/${id}-${width}x${height}${reduced?'-reduced':''}.png`});
  if(process.env.QA_PRACTICE){
   await click('.shop-preview-toggle');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'application');await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(12));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');assert.deepEqual(await saved(),before);
   await click('.shop-preview-toggle');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.hits),'0');
   if(item.slot==='pointer'){await page.select('.shop-demo-mode','arrow');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'arrow');assert.equal(await page.$eval('.shop-demo-play',n=>n.disabled),true);await page.select('.shop-demo-mode','story');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');}
  }
  if(await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none'))await click('.custom-view-switch button:first-child');
  await click('.power-info');const words=await page.$eval('.power-sheet',n=>n.textContent);assert.doesNotMatch(words,/\bticks?\b|\bsimulation\b|\bprimary\b/i);assert.ok(words.includes('HOW TO USE IT'));await click('.power-sheet button');
  if(item.price===null){assert.equal(await page.$eval('.equip-part',n=>n.disabled),true);assert.deepEqual(await saved(),before);}
  else if(item.price>0){await click('.equip-part');let [eq,wallet]=await saved();eq=JSON.parse(eq);wallet=JSON.parse(wallet);assert.equal(eq.equipped[item.slot],DEFAULT_EQUIPMENT[item.slot]);assert.equal(wallet.coins,walletBalance-item.price);await click('.equip-part');const after=(await saved()).map(JSON.parse);assert.equal(after[0].equipped[item.slot],id);assert.deepEqual(after[0].presets,JSON.parse(before[0]).presets);assert.deepEqual(after[0].discovered,JSON.parse(before[0]).discovered);}
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);results.push({id,width,height,touch,reduced,bounds,guide,words,errors});await page.close();
 }
 console.log(`PASS ${results.length} native ability-store cases: selected ability showcases, readable copy, readonly input, pause/stills, buy/equip separation and challenge locks, preserved saves, no page/frame errors.`);
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
