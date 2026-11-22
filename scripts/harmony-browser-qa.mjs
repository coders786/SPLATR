import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const output='.arena/harmony';mkdirSync(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const page=await browser.newPage();await page.setViewport({width:1280,height:800});const errors=[];page.on('pageerror',e=>errors.push(e.stack||String(e)));
 await page.goto('http://localhost:3000');await page.evaluate(async()=>{
  const {ITEMS}=await import('/src/equipment.js');localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.fieldMix','full');
  localStorage.setItem('riot.quests',JSON.stringify({coins:2400,owned:[],heads:{}}));localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(x=>x.id),equipped:{head:'coil',eyes:'glitch',body:'lava',core:'grav',tail:'wings',slash:'katana',world:'tokyo'}}));
 });await page.reload();await page.evaluate(()=>document.fonts.ready);await delay(200);await page.screenshot({path:`${output}/01-main-menu.png`});await page.click('#customize-btn');await page.click('.destination-parts');
 async function select(slot,id,equip=false){await page.click(`[data-slot="${slot}"]`);await page.click(`[data-item="${id}"]`);if(equip&&!await page.$eval('.equip-part',n=>n.disabled))await page.click('.equip-part');}
 for(const [slot,id] of [['head','coil'],['eyes','glitch'],['body','lava'],['core','grav'],['tail','wings'],['slash','katana'],['world','tokyo']]){await select(slot,id);await delay(280);await page.screenshot({path:`${output}/tab-${slot}.png`});}
 for(const [title,parts] of [['ARC ANGEL',{core:'magnet',tail:'wings'}],['MAGMA FLAIL',{body:'lava',tail:'anchor'}],['VOID KING',{head:'crown',core:'grav',tail:'anchor'}],['LASER WYRM',{head:'viper',body:'prism',slash:'laser'}]]){
  for(const [slot,id] of Object.entries(parts))await select(slot,id,true);
  assert.match(await page.$eval('.custom-hybrid',n=>n.textContent),new RegExp(title));await page.click('[data-action="slice"]');await delay(900);await page.screenshot({path:`${output}/mutation-${title.toLowerCase().replaceAll(' ','-')}.png`});
 }
 await page.click('.custom-recipes');assert.equal(await page.$$eval('.codex-card',n=>n.length),35);assert.ok(await page.$('.codex-card.unknown'));await delay(200);await page.screenshot({path:`${output}/mutation-codex.png`});await page.click('.codex-close');
 await select('world','manga',true);await select('head','samurai',true);await select('body','paper',true);await select('slash','katana',true);await page.click('[data-action="slice"]');await delay(900);await page.screenshot({path:`${output}/manga-paper-lab.png`});
 // Native pointer drag inside the actual sandbox, not a direct scene-state mutation.
 await page.click('[data-action="aim"]');const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect(),s=Math.min(r.width/640,r.height/400);return {x:r.x+(r.width-640*s)/2,y:r.y+(r.height-400*s)/2,s};});
 await page.mouse.move(bounds.x+235*bounds.s,bounds.y+185*bounds.s);await page.mouse.down();await page.mouse.move(bounds.x+466*bounds.s,bounds.y+180*bounds.s,{steps:12});await page.mouse.up();
 await page.waitForFunction(()=>Number(document.querySelector('.custom-lab>canvas').dataset.hits)>0,{timeout:4000});assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.testMode),'manual');await delay(180);await page.screenshot({path:`${output}/manual-dummy-cut.png`});
 // Forge is replayable, mode highlight is explicit, and lab does not grant wallet/quest credit.
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')));assert.equal(save.coins,2400);
 await page.keyboard.press('Escape');await page.click('#start-btn');await delay(200);await page.screenshot({path:`${output}/manga-paper-run.png`});
 assert.deepEqual(errors,[]);console.log('PASS desktop: main menu, 7 tabs, 4 mutation mid-slices, 35-entry codex, native drag hits dummy, Manga lab/run, unchanged wallet');
 for(const [width,height] of [[550,720],[860,440]]){await page.setViewport({width,height});await page.reload();await page.click('#customize-btn');await page.click('.destination-parts');if(width<700)await page.click('.custom-view-switch button:nth-child(2)');await delay(120);assert.ok(await page.$eval('.shape-lab',n=>n.scrollHeight<=n.clientHeight+1&&n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:`${output}/layout-${width}x${height}.png`});await page.keyboard.press('Escape');console.log(`PASS ${width}x${height}: no outer scroll/clipping`);}
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
