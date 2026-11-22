import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/discovery-shop',{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height]of [[1280,720],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:5000}));});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#customize-btn');
 assert.equal(await page.$eval('.shape-lab',e=>e.dataset.section),'parts');assert.equal(await page.$$('.build-home-card').then(e=>e.length),0);
 await page.screenshot({path:`.arena/discovery-shop/shop-${width}.png`});
 await page.click('.destination-discoveries');assert.ok(await page.$$('.codex-card.unknown').then(e=>e.length)>10);assert.equal(await page.$$('.codex-card.unknown .codex-ingredients,.codex-card.unknown .recipe-try').then(e=>e.length),0);
 assert.ok(await page.$$eval('.codex-card.unknown h3',e=>e.every(n=>n.textContent==='UNKNOWN MUTATION')));await page.screenshot({path:`.arena/discovery-shop/journal-${width}.png`});await page.click('.codex-close');
 const build=await page.evaluate(async()=>{const{SWORD_BUILDS}=await import('/src/swords.js');return SWORD_BUILDS.find(b=>b.id==='wraith')});
 const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped);
 for(const [slot,id]of Object.entries(build.parts)){
  await page.click(`[data-slot="${slot}"]`);await page.click(`[data-item="${id}"]`);const owned=await page.evaluate(id=>JSON.parse(localStorage.getItem('riot.equipment')).owned.includes(id),id);
  if(!owned){await page.click('.equip-part');assert.equal(await page.evaluate(slot=>JSON.parse(localStorage.getItem('riot.equipment')).equipped[slot],slot),initial[slot],'buy does not equip');}
  await page.click('.equip-part');
 }
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).discovered.includes('wraith')));
 assert.match(await page.$eval('.mix-discovery',e=>e.textContent),/DISCOVERED/);
 await page.click('.destination-discoveries');assert.equal(await page.$eval('[data-mutation="wraith"]',e=>e.classList.contains('discovered')),true);assert.ok(await page.$('[data-mutation="wraith"] .codex-ingredients'));await page.click('.codex-close');
 if(width<=700)await page.click('.custom-view-switch button:last-child');await page.screenshot({path:`.arena/discovery-shop/discovered-${width}.png`});
 const box=await page.$eval('.shape-lab',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,scroll:e.scrollHeight-e.clientHeight}});assert.ok(box.x>=0&&box.y>=0&&box.right<=width&&box.bottom<=height&&box.scroll<=1);assert.deepEqual(errors,[]);await page.close();
}console.log('PASS four sizes: parts-first, secret unknown combinations, buy != equip, real mix discovery persisted, found recipe journal, no JS errors');}finally{await browser.close()}
