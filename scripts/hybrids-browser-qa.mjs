import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/hybrids',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[550,720],[860,440]]){
 const page=await browser.newPage();await page.setViewport({width,height});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:3000');await page.evaluate(()=>{
 localStorage.clear();localStorage.setItem('riot.fieldMix','full');localStorage.setItem('riot.started','1');
 localStorage.setItem('riot.equipment',JSON.stringify({owned:['visor','hologram','ghost','glass'],equipped:{eyes:'visor',body:'hologram',tail:'ghost',core:'glass'}}));
 });await page.reload();await page.click('#customize-btn');await page.click('.destination-parts');
 assert.equal(await page.$eval('.custom-hybrid',n=>n.textContent),'CYBER PHANTOM');
 await page.click('.custom-card[aria-label^="Broken Oni,"]');assert.ok(await page.$eval('.custom-detail button',n=>n.disabled));
 assert.match(await page.$eval('.custom-detail',n=>n.textContent),/Challenge: defeat a Crown at 1 HEALTH/);
 await page.click('[data-slot="core"]');await page.click('.custom-card[aria-label^="Glass Cannon,"]');
 if(width<=700)await page.click('.custom-view-switch button:nth-child(2)');
 await page.screenshot({path:`.arena/hybrids/preview-${width}x${height}.png`});
 await page.keyboard.press('Escape');await page.click('#start-btn');await new Promise(r=>setTimeout(r,300));
 assert.equal(await page.$eval('#hull',n=>n.children.length),1);assert.equal(await page.$eval('#hybrid-title',n=>n.textContent),'CYBER PHANTOM');
 await page.screenshot({path:`.arena/hybrids/run-${width}x${height}.png`});assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: hybrid preview/title, locked Oni, owned Glass, one-Hull HUD, zero errors`);await page.close();
}}finally{await browser.close();}
