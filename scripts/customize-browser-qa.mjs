import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/customize',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height] of [[1280,720],[550,720],[860,440]]){
  const page=await browser.newPage();await page.setViewport({width,height});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.quests',JSON.stringify({coins:2000,owned:['halo'],heads:{}}));});await page.reload();
  await page.click('#customize-btn');await page.click('.destination-parts');assert.ok(await page.$eval('.customize',n=>n.open));
  await page.click('.custom-card:nth-child(2)');await page.click('.custom-detail button');
  await page.click('[data-slot="body"]');await page.click('.custom-card:nth-child(2)');await page.click('.custom-detail button');
  assert.match(await page.$eval('.custom-status',n=>n.textContent),/owned/);await page.click('.custom-detail button');
  await page.click('[data-slot="eyes"]');await page.click('.custom-card:nth-child(2)');await page.click('.custom-detail button');await page.click('.custom-detail button');
  await page.click('[data-slot="tail"]');await page.click('.custom-card:nth-child(2)');await page.click('.custom-detail button');await page.click('.custom-detail button');
  if(width<=700)await page.click('.custom-view-switch button:nth-child(2)');
  await page.click('.preset-store');
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.equal(state.equipped.body,'obsidian');assert.equal(state.equipped.head,'halo');assert.equal(state.equipped.tail,'wings');assert.equal(state.presets[0].eyes,'visor');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),1200);
  await page.click('[data-action="dash"]');await new Promise(r=>setTimeout(r,300));
  assert.equal(await page.$eval('.customize',n=>n.scrollWidth<=n.clientWidth+1 && n.scrollHeight<=n.clientHeight+1),true,'no outer dialog clipping');
  assert.equal(await page.$eval('.custom-presets',n=>{const b=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return b.bottom<=d.bottom&&b.top>=d.top;}),true,'presets visible inside dialog');
  await page.screenshot({path:`.arena/customize/shop-${width}x${height}.png`});
  await page.keyboard.press('Escape');assert.equal(await page.$eval('.customize',n=>n.open),false);
  await page.click('#start-btn');await new Promise(r=>setTimeout(r,500));await page.screenshot({path:`.arena/customize/run-${width}x${height}.png`});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,purchase:true,vaultOwnership:true,preset:true,noHorizontalClip:true,errors}));await page.close();
 }
} finally {await browser.close();}
