import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const url=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');url.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try {
 for(const [width,height] of [[1100,700],[390,844]]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height,hasTouch:width<600});
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:9999,owned:[]}));localStorage.setItem('riot.postfx','off');});
  await page.goto(url.href);await page.waitForSelector('#customize-btn',{visible:true});await page.click('#customize-btn');
  const tabs=await page.$$eval('.shop-groups button',es=>es.map(e=>({text:e.textContent,visible:!!e.getClientRects().length,pressed:e.getAttribute('aria-pressed')})));
  assert.equal(tabs.length,2);assert.match(tabs[0].text,/GEAR & MODS/);assert.match(tabs[1].text,/STYLE \/ SKINS/);assert.ok(tabs.every(t=>t.visible));
  await page.click('[data-group="style"]');
  assert.deepEqual(await page.$$eval('.shop-slots button:not([hidden])',els=>els.map(e=>e.dataset.slot)),['eyes','dash','world']);
  for(const [slot,id] of [['eyes','sniper'],['dash','dash-fire'],['world','manga']]){
   await page.$eval(`[data-slot="${slot}"]`,e=>{e.scrollIntoView({block:'nearest',inline:'nearest'});e.click();});
   await page.$eval(`[data-item="${id}"]`,e=>e.click());
   assert.match(await page.$eval(`[data-item="${id}"] .shelf-benefit`,e=>e.textContent),/VISUAL ONLY/);
   if(width<600)await page.$eval('.custom-view-switch button:last-child',e=>e.click());
   await page.$eval('.preview-purchase',e=>e.click());
   const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.equal(save.equipped[slot],id);
   if(width<600)await page.$eval('.custom-view-switch button:first-child',e=>e.click());
  }
  await page.$eval('.lab-exit',e=>e.click());await page.click('#start-btn');
  await page.waitForFunction(()=>window.__riot?.state.phase==='ready');
  const equipment=await page.evaluate(()=>window.__riot.state.equipment);assert.equal(equipment.eyes,'sniper');assert.equal(equipment.dash,'dash-fire');assert.equal(equipment.world,'manga');
  await page.mouse.move(width*.5,height*.55);await page.mouse.down();await page.mouse.move(width*.75,height*.4);await page.mouse.up();await page.waitForFunction(()=>window.__riot.state.shots===1);
  assert.equal(await page.evaluate(()=>window.__riot.state.precisionShot.eligible),false);
  assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: named gear/style tabs, cosmetic labels, purchases persist into live run`);
  await context.close();
 }
}finally{await browser.close();}
