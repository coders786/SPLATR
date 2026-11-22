import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/equipment-wave2',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height] of [[1280,720],[550,720],[860,440]]) {
  const page=await browser.newPage();await page.setViewport({width,height});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.fieldMix','full');localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:10000,owned:[],heads:{}}));});await page.reload();
  await page.click('#customize-btn');await page.click('.destination-parts');
  for(const [slot,name] of [['head','Viper Horns'],['eyes','SSJ Blaze'],['body','Hologram Wire'],['core','Riot Reactor'],['tail','Ghost Scarf'],['slash','Neon Laser'],['world','Blood Foundry']]){
    await page.click(`[data-slot="${slot}"]`);await page.click(`.custom-card[aria-label^="${name},"]`);
    await page.click('.custom-detail button');assert.match(await page.$eval('.custom-status',n=>n.textContent),/owned/);await page.click('.custom-detail button');
  }
  const save=await page.evaluate(()=>({eq:JSON.parse(localStorage.getItem('riot.equipment')),quest:JSON.parse(localStorage.getItem('riot.quests'))}));
  assert.deepEqual(save.eq.equipped,{head:'viper',eyes:'blaze',body:'hologram',core:'riot',tail:'ghost',slash:'laser',world:'foundry'});assert.equal(save.quest.coins,7650);
  if(width<=700)await page.click('.custom-view-switch button:nth-child(2)');
  await page.click('[data-action="aim"]');await new Promise(r=>setTimeout(r,200));await page.screenshot({path:`.arena/equipment-wave2/build-${width}x${height}.png`});
  assert.ok(await page.$eval('.customize',n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1));
  await page.keyboard.press('Escape');await page.click('#start-btn');await new Promise(r=>setTimeout(r,500));
  assert.equal(await page.$eval('#edge',n=>n.children.length),2,'Riot HUD shows two bars');await page.screenshot({path:`.arena/equipment-wave2/run-${width}x${height}.png`});
  assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: seven purchases, exact wallet, equipped build, two-bar HUD, zero JS errors`);await page.close();
 }
} finally {await browser.close();}
