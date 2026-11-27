// Native seven-core inspection/transaction/layout QA. Controlled RAF/debug
// fixtures test correctness, not device FPS or an uncontrolled playthrough.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT,ITEMS} from '../src/equipment.js';
const cores=ITEMS.filter(i=>i.slot==='core');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5183',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk10/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000}),results=[];
try{
 for(const [width,height,touch,reduced] of [[1280,720,false,false],[960,540,false,false],[640,360,false,false],[390,844,true,false],[844,390,true,false],[320,568,true,false],[390,844,true,true]]){
  if(process.env.QA_WIDTH&&Number(process.env.QA_WIDTH)!==width)continue;
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?coreView=echo&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));await page.evaluate(()=>document.fonts.ready);
  const click=async selector=>{if(touch){const n=await page.$(selector);await n.scrollIntoView();await n.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  const saved=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));const before=await saved();
  const switcher=await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none');
  const pane=async name=>{if(switcher)await click(`.custom-view-switch button:${name==='shop'?'first':'last'}-child`);};
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'mechanism');const visited=[];
  for(const core of cores){
   await pane('shop');await click(`[data-item="${core.id}"]`);await pane('preview');
   assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.mechanismCore),core.id);assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
   const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&r.width>0&&r.height>0};});assert.ok(bounds.visible,JSON.stringify({width,height,core:core.id,bounds}));
   await page.screenshot({path:`${out}/${core.id}-${width}x${height}${reduced?'-reduced':''}.png`});visited.push(core.id);
   if(reduced){const a=await page.$eval('.custom-lab>canvas',n=>n.toDataURL());await page.evaluate(()=>qaFrames(80));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.toDataURL()),a);}
  }
  assert.deepEqual(await saved(),before,'all7 free try-ons leave equipment, ownership, discoveries, wallet and presets unchanged');
  // Inspection cannot silently fire the manual sandbox.
  await click('.custom-lab>canvas');await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.notEqual(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');
  // Core abilities now default to a read-only explanation, like the inspection.
  await page.select('.shop-demo-mode','story');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');assert.notEqual(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');
  await click('.assembly-inspect');if(await page.$eval('.shop-demo-mode',n=>n.value)!=='assembly'){await page.screenshot({path:`${out}/assembly-failed-${width}x${height}.png`});console.log(await page.$eval('.assembly-inspect',n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML};}));}assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'assembly');
  await pane('shop');await click('[data-item="time"]');await click('.equip-part');assert.equal((await saved()).equipment.equipped.core,'standard','buy is not equip');await click('.equip-part');const bought=await saved();assert.equal(bought.equipment.equipped.core,'time');assert.equal(bought.wallet.coins,1100);assert.deepEqual(bought.equipment.presets,before.equipment.presets);
  await pane('preview');await page.select('.shop-demo-mode','mechanism');await page.evaluate(()=>qaFrames(4));await click('.shop-preview-toggle');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'application');await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');await click('.shop-preview-toggle');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');assert.notEqual(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));assert.equal(await page.evaluate(()=>__riot.state.equipment.core),'time');
  // A real passive step feeds the render view; no preview-only fake timer.
  const recovery=await page.evaluate(async()=>{const {coreMechanismPose}=await import('/src/art/splatr-art-engine.js');const r=__riot,s=r.state;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.combat.add({id:'core-sentinel',kind:'fang',x:900,y:-900,pinned:true,delay:999999});s.phase='playing';s.opening=null;s.inputLock=false;s.invul=999999;s.wave.entry=0;s.focus=.4;r.focus(false);s.stop=1;r.tick();const p=coreMechanismPose(s);s.stop=9999;return p;});assert.equal(recovery.coreRecovering,true);assert.ok(recovery.coreFocus>.4);
  await page.evaluate(()=>qaFrames(4));await page.screenshot({path:`${out}/time-live-${width}x${height}${reduced?'-reduced':''}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);results.push({width,height,touch,reduced,visited,saveRetained:true,recovery,errors});await page.close();
 }
 // Malformed or non-core inspection IDs do not bypass item validation.
 for(const id of ['bad','iron']){const p=await browser.newPage();await p.goto(`${base}/?coreView=${id}`,{waitUntil:'networkidle0'});assert.equal(await p.$('.shape-lab[open]'),null);await p.close();}
 console.log('PASS:7 layouts/motion cases x7 core try-ons, no free ownership/discovery grants, native buy/equip separation, mechanism/assembly/power/practice roles, real-run Time recovery, invalid-ID rejection, no page/frame errors.');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
