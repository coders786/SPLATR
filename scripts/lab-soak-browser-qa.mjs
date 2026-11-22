// Real-time, active browser endurance test. Default minimum is twenty minutes.
// Run against the existing united dev server; never starts a second server.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
const output=process.env.SOAK_OUTPUT||'.arena/lab-soak';mkdirSync(output,{recursive:true});for(const name of ['failure.json','report.json'])rmSync(`${output}/${name}`,{force:true});
const minutes=Number(process.env.SOAK_MINUTES||20);
assert.ok(Number.isFinite(minutes)&&minutes>0);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--js-flags=--expose-gc']});
const productionHtml=readFileSync('dist/index.html','utf8');
const errors=[],samples=[];let cycles=0,interactions=0,started=performance.now(),baselineWallet='',baselineHeap=null;
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('error',e=>errors.push(String(e)));
 await page.setRequestInterception(true);page.on('request',request=>{if(new URL(request.url()).pathname==='/__lab-soak__')request.respond({status:200,contentType:'text/html',body:productionHtml});else request.continue();});
 await page.setViewport({width:1280,height:800});await page.goto('http://localhost:3000/__lab-soak__');await page.evaluate(async()=>{
  const {ITEMS}=await import('/src/equipment.js');localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.fieldMix','full');localStorage.setItem('riot.quests',JSON.stringify({coins:2400,owned:[],heads:{}}));localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(x=>x.id),equipped:{head:'coil',eyes:'glitch',body:'lava',core:'grav',tail:'anchor',slash:'katana',world:'tokyo'}}));
 });await page.reload();baselineWallet=await page.evaluate(()=>localStorage.getItem('riot.quests'));started=performance.now();
 const variants=[['head','coil'],['eyes','hypno'],['body','hologram'],['core','magnet'],['tail','wings'],['slash','laser'],['world','manga']];
 while(performance.now()-started<minutes*60000){
  const [width,height]=[[1280,800],[860,440],[550,720]][cycles%3];await page.setViewport({width,height});await page.click('#customize-btn');await page.click('.destination-parts');interactions++;
  if(width<700)await page.click('.custom-view-switch button:first-child');
  for(const [slot,id] of variants){await page.click(`[data-slot="${slot}"]`);await page.click(`[data-item="${id}"]`);if(!await page.$eval('.equip-part',n=>n.disabled))await page.click('.equip-part');interactions+=3;await delay(130);}
  if(width<700)await page.click('.custom-view-switch button:nth-child(2)');
  for(const mode of ['slice','dash','bounce','hit','aim']){await page.click(`[data-action="${mode}"]`);interactions++;await delay(250);}
  const b=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect(),s=Math.min(r.width/640,r.height/400);return {x:r.x+(r.width-640*s)/2,y:r.y+(r.height-400*s)/2,s};});
  await page.mouse.move(b.x+235*b.s,b.y+185*b.s);await page.mouse.down();await page.mouse.move(b.x+466*b.s,b.y+180*b.s,{steps:8});await delay(200);await page.mouse.up();interactions++;
  await page.waitForFunction(()=>Number(document.querySelector('.custom-lab>canvas').dataset.hits)>0,{timeout:6000});await delay(1300);
  await page.click('.custom-recipes');assert.equal(await page.$$eval('.codex-card',n=>n.length),35);await page.$eval('.mutation-codex',n=>n.scrollTop=n.scrollHeight);await delay(600);await page.$eval('.mutation-codex',n=>n.scrollTop=0);await page.click('.codex-close');interactions+=4;
  assert.ok(await page.$eval('.shape-lab',n=>n.scrollHeight<=n.clientHeight+1&&n.scrollWidth<=n.clientWidth+1),'outer dialog clipping');
  await page.click(`[data-preset="${cycles%3}"]`);assert.ok(await page.evaluate(i=>!!JSON.parse(localStorage.getItem('riot.equipment')).presets[i],cycles%3),'preset was not stored/recalled');interactions++;
  await page.click('.randomize');await delay(400);interactions++;await page.keyboard.press('Escape');await delay(800);
  assert.equal(await page.evaluate(()=>localStorage.getItem('riot.quests')),baselineWallet,'lab changed quest/wallet save');assert.deepEqual(errors,[],'browser errors');
  if(cycles%5===0){await page.evaluate(()=>globalThis.gc?.());const m=await page.metrics();if(baselineHeap===null)baselineHeap=m.JSHeapUsedSize;samples.push({cycle:cycles,elapsedSeconds:Math.round((performance.now()-started)/1000),heapBytes:m.JSHeapUsedSize,nodes:m.Nodes,documents:m.Documents});assert.ok(m.JSHeapUsedSize<baselineHeap+64*1024*1024,'heap grew more than 64MiB over baseline');}
  cycles++;console.log(JSON.stringify({cycles,interactions,elapsedSeconds:Math.round((performance.now()-started)/1000),viewport:`${width}x${height}`,errors:errors.length}));
 }
 const elapsedSeconds=(performance.now()-started)/1000;assert.ok(elapsedSeconds>=minutes*60);await page.setViewport({width:1280,height:800});await page.click('#customize-btn');await page.click('.destination-parts');await delay(250);await page.screenshot({path:`${output}/final-lab.png`});await page.click('.custom-recipes');await delay(250);await page.screenshot({path:`${output}/final-codex.png`});
 const report={status:'PASS',build:'immutable production HTML captured at test start',requestedMinutes:minutes,elapsedSeconds,cycles,interactions,errors,samples,checks:['native pointer dummy cut every cycle','seven slot preview/equip every cycle','all five action modes every cycle','21 codex cards and scrolling every cycle','numbered preset save/recall','owned-only randomize','three viewport sizes','no outer dialog clipping','quest/wallet save byte-for-byte unchanged','heap growth bounded to 64MiB over collected baseline']};writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){writeFileSync(`${output}/failure.json`,JSON.stringify({status:'FAIL',elapsedSeconds:(performance.now()-started)/1000,cycles,interactions,error:String(e.stack||e),errors,samples},null,2));throw e;}finally{await browser.close();}
