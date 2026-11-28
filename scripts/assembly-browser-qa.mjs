// Native assembly/gallery/transaction QA. Read-only examples must not grant,
// equip or discover parts. Controlled RAF is correctness evidence, not FPS.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {HYBRIDS} from '../src/hybrids.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5182';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk9/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000});
const results=[];
try{
 for(const [width,height,touch,reduced] of [[1280,720,false,false],[960,540,false,false],[640,360,false,false],[390,844,true,false],[844,390,true,false],[320,568,true,false],[390,844,true,true]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));
   localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();
   window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);
   window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?assembly=1&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));
  await page.evaluate(()=>document.fonts.ready);
  const click=async selector=>{if(touch){const el=await page.$(selector);await el.scrollIntoView();await el.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  const snapshot=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));
  const before=await snapshot();
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'assembly');
  assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const visible=selector=>page.$eval(selector,n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});
  const defaultBounds=await visible('.custom-lab>canvas');assert.ok(defaultBounds.visible,JSON.stringify({width,height,defaultBounds}));
  await page.screenshot({path:`${out}/assembly-default-${width}x${height}${reduced?'-reduced':''}.png`});
  const visited=[];
  for(const h of HYBRIDS){
   await click('.assembly-next');const family=await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily);assert.equal(family,h.id);visited.push(family);
   assert.match(await page.$eval('.custom-lab-label b',n=>n.textContent),/FREE BUILD EXAMPLE/);
   assert.match(await page.$eval('.assembly-caption',n=>n.textContent),/ownership and discoveries are unchanged/);
   const bounds=await visible('.custom-lab>canvas');assert.ok(bounds.visible,JSON.stringify({width,height,id:h.id,bounds}));
   assert.ok((await visible('.assembly-next')).visible);
   if(['forge','glacier','phantom'].includes(h.id))await page.screenshot({path:`${out}/${h.id}-${width}x${height}${reduced?'-reduced':''}.png`});
  }
  assert.deepEqual(await snapshot(),before,'all17 examples must leave saved equipment, wallet, discoveries and presets byte-equivalent');
  if(reduced){const a=await page.$eval('.custom-lab>canvas',n=>n.toDataURL());await page.evaluate(()=>qaFrames(100));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.toDataURL()),a);}
  await click('.assembly-next');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily),'standard','wrap returns to your preview');
  await click('.assembly-prev');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily),HYBRIDS.at(-1).id);
  await click('.assembly-current');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily),'standard');
  const switched=await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none');
  if(switched)await click('.custom-view-switch button:first-child');
  await click('.shop-slots [data-slot="body"]');await click('[data-item="iron"]');
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story','ordinary shell browsing opens the ability, not construction');
  assert.equal((await snapshot()).equipment.equipped.body,'paper');
  if(switched)await click('.custom-view-switch button:last-child');
  await click('.assembly-inspect');
  assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyBody),'iron');
  if(switched)await click('.custom-view-switch button:first-child');
  await click('.equip-part');assert.equal((await snapshot()).equipment.equipped.body,'paper','buy is not equip');
  await click('.equip-part');const saved=await snapshot();assert.equal(saved.equipment.equipped.body,'iron');assert.equal(saved.wallet.coins,1050);assert.deepEqual(saved.equipment.presets,before.equipment.presets);
  if(switched)await click('.custom-view-switch button:last-child');
  // Switching to a power study must hide the reference controls. The ASSEMBLY
  // button returns to the current item, not a stale example.
  await page.select('.shop-demo-mode','story');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.assembly-gallery',n=>n.hidden),true);
  await click('.assembly-inspect');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.assemblyBody),'iron');
  await click('.shop-preview-toggle');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'application');
  await click('.shop-preview-toggle');
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));
  assert.equal(await page.evaluate(()=>window.__riot.state.equipment.body),'iron','saved construction reaches the actual run');
  assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);assert.deepEqual(errors,[]);
  if(width===1280)await page.screenshot({path:`${out}/live-iron-${width}x${height}.png`});
  results.push({width,height,touch,reduced,visited,defaultBounds,saveRetained:true,errors});await page.close();
 }
 console.log('PASS:7 layouts/motion cases, native browsing of all17 examples per case, wrap/back/current, unchanged ownership/discoveries/wallet/presets, free item try-on then explicit buy/equip, power/practice mode parity, actual run equipment, no frame/page errors.');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
