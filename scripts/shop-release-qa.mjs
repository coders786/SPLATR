// Focused native-browser smoke for the quest-free economy and functional shop.
// CHROME_BIN=/path/to/chrome PREVIEW_URL=http://127.0.0.1:5175 node scripts/shop-release-qa.mjs
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const url=process.env.PREVIEW_URL||'http://127.0.0.1:5175/';
const output=process.env.CAPTURE_DIR||'.arena/shop-release';mkdirSync(output,{recursive:true});
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
const results=[];
try{
 for(const [width,height,touch] of [[960,540,false],[640,360,false],[390,844,true],[844,390,true]]){
  const page=await browser.newPage(),errors=[];
  await page.setViewport({width,height,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&m.text().includes('[SPLATR]'))errors.push(m.text());});
  // Returning player, with an old wallet fixture. No run/simulation backdoor.
  await page.evaluateOnNewDocument(()=>{
   // Controlled RAF (as in browser-smoke.cjs): reproducible state, not a
   // wall-clock performance claim. All interactions still use browser input.
   let stamp=0,id=0;const queue=new Map();
   window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);
   window.cancelAnimationFrame=id=>queue.delete(id);
   window.__qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
   if(!localStorage.getItem('qa-seeded')){
    localStorage.setItem('riot.quests',JSON.stringify({coins:2000,owned:['halo']}));
    localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('qa-seeded','1');
   }
  });
  await page.setRequestInterception(true);
  page.on('request',r=>new URL(r.url()).protocol.startsWith('http')&&!r.url().startsWith(new URL(url).origin)?r.abort():r.continue());
  await page.goto(url,{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>!document.querySelector('#boot'));
  assert.equal(await page.$('.quest-board-dialog,.quest-hud,#quests-btn,.vault-scene'),null);
  await page.click('#customize-btn');await page.waitForSelector('.customize[open]');
  await page.click('[data-item="neko"]');
  const funds=await page.$eval('.custom-wallet',n=>n.textContent);
  const owned=await page.$eval('.custom-detail .equip-part',n=>n.textContent);
  if(owned.includes('BUY'))await page.click('.custom-detail .equip-part');
  if(await page.$eval('.custom-detail .equip-part',n=>n.textContent==='EQUIP'))await page.click('.custom-detail .equip-part');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.head),'neko');
  assert.match(await page.$eval('.part-benefit',n=>n.textContent),/12 simulation ticks/);
  // Selected part, buy/equip action and exit must have finite visible bounds.
  const bounds=await page.evaluate(()=>Object.fromEntries(['.custom-detail .equip-part','.lab-exit','.custom-detail'].map(s=>{const n=document.querySelector(s),r=n.getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}];})));
  assert.ok(bounds['.lab-exit'].visible,JSON.stringify(bounds));
  assert.ok(bounds['.custom-detail .equip-part'].visible,JSON.stringify(bounds));
  await page.screenshot({path:`${output}/shop-${width}x${height}.png`});
  await page.click('.lab-exit');await page.click('#start-btn');
  await page.waitForSelector('#hud:not([hidden])');
  // First-session cold open has a 0.5-second skip gate.
  await page.evaluate(()=>window.__qaFrames(40));
  await page.keyboard.press('q');
  await page.evaluate(()=>window.__qaFrames(2));
  // Native launch, pause, end and retry flow.
  if(touch)await page.touchscreen.tap(width*.6,height*.5);else await page.mouse.click(width*.6,height*.5);
  await page.evaluate(()=>window.__qaFrames(12));
  await page.click('#pause-btn');
  try { await page.waitForSelector('#pause-page:not([hidden])',{timeout:7000}); }
  catch(e) { await page.screenshot({path:`${output}/failed-run-${width}.png`});console.error(JSON.stringify({errors,ui:await page.evaluate(()=>({screen:{...document.querySelector('#game').dataset},announcement:document.querySelector('#announcement').textContent,hud:document.querySelector('#hud').outerHTML.slice(0,1000)}))}));throw e; }
  await page.click('#end-btn');await page.waitForSelector('#result-page:not([hidden])');
  assert.match(await page.$eval('.round-receipt',n=>n.textContent),/CREDITS/);
  const wallet=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins);
  assert.ok(wallet>=1800);assert.equal(await page.$('.result-bonuses,.next-prize'),null);
  const resultBounds=await page.evaluate(()=>['retry-btn','home-btn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth};}));
  assert.ok(resultBounds.every(b=>b.visible),JSON.stringify(resultBounds));
  await page.screenshot({path:`${output}/result-${width}x${height}.png`});
  await page.click('#retry-btn');await page.waitForSelector('#hud:not([hidden])');
  await page.reload({waitUntil:'networkidle0'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.head),'neko');
  assert.deepEqual(errors,[]);
  results.push({width,height,touch,errors,bounds,wallet,initialFunds:funds});await page.close();
 }
 writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
