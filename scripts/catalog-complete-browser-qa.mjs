import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/catalog-complete',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height] of [[1280,720],[550,720],[860,440]]) {
  const page=await browser.newPage();await page.setViewport({width,height});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:3000');
  const recipes=await page.evaluate(async()=>{
   const {ITEMS}=await import('/src/equipment.js'),{HYBRIDS}=await import('/src/hybrids.js');
   localStorage.clear();localStorage.setItem('riot.fieldMix','full');localStorage.setItem('riot.started','1');
   localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(x=>x.id)}));return HYBRIDS;
  });await page.reload();
  for(const recipe of recipes) {
   await page.click('#customize-btn');await page.click('.destination-parts');
   if(width<=700)await page.click('.custom-view-switch button:first-child');
   for(const [slot,id] of Object.entries(recipe.parts)){
    await page.click(`[data-slot="${slot}"]`);
    await page.evaluate(async(id)=>{const {ITEMS}=await import('/src/equipment.js');const name=ITEMS.find(x=>x.id===id).name;const card=[...document.querySelectorAll('.custom-card')].find(x=>x.getAttribute('aria-label').startsWith(name+','));card.dataset.qaTarget='true';},id);
    await page.click('[data-qa-target="true"]');
    if(!await page.$eval('.custom-detail button',b=>b.disabled))await page.click('.custom-detail button');
   }
   const actual=await page.$eval('.custom-hybrid',n=>n.textContent);
   if(actual!==recipe.title){await page.screenshot({path:'.arena/catalog-complete/failed.png'});console.log(await page.evaluate(()=>({save:localStorage.getItem('riot.equipment'),detail:document.querySelector('.custom-detail').textContent})));}
   assert.equal(actual,recipe.title);
   if(width<=700)await page.click('.custom-view-switch button:nth-child(2)');
   await page.screenshot({path:`.arena/catalog-complete/${recipe.id}-shop-${width}x${height}.png`});
   assert.ok(await page.$eval('.customize',n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1));
   assert.ok(await page.$eval('.custom-presets',n=>{const b=n.getBoundingClientRect(),d=n.closest('dialog').getBoundingClientRect();return b.bottom<=d.bottom;}));
   await page.keyboard.press('Escape');await page.click('#start-btn');await new Promise(r=>setTimeout(r,120));
   assert.equal(await page.$eval('#hybrid-title',n=>n.textContent),recipe.title);
   await page.screenshot({path:`.arena/catalog-complete/${recipe.id}-run-${width}x${height}.png`});
   // Reload intentionally tests persisted discoveries and starts the next recipe from the menu.
   await page.reload();
  }
  const discovered=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).discovered);
  assert.equal(discovered.length,11);assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: all eleven recipes equipped, persisted, preview/run titles, controls inside bounds, zero errors`);await page.close();
 }
} finally {await browser.close();}
