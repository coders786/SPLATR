import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
const out='.arena/shop-element-dash';mkdirSync(out,{recursive:true});const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{let count=0;for(const [width,height]of [[1280,720],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1')});await page.reload();await page.click('#customize-btn');assert.equal(await page.$eval('.shop-demo-mode',e=>e.value),'dash');
 const saved=await page.evaluate(()=>localStorage.getItem('riot.equipment'));
 for(const [element,slot,id]of [['ink','core','standard'],['fire','core','riot'],['lightning','head','coil'],['ice','core','time'],['echo','core','echo'],['void','core','grav'],['water','core','magnet']]){
 if(width<=700)await page.click('.custom-view-switch button:first-child');await page.click(`[data-slot="${slot}"]`);await page.$eval(`[data-item="${id}"]`,e=>e.click());if(width<=700)await page.click('.custom-view-switch button:last-child');await page.waitForFunction(element=>document.querySelector('.shape-lab').dataset.previewElement===element,{},element);
 if(width===390||width===1280){await new Promise(r=>setTimeout(r,600));await page.screenshot({path:`${out}/${element}-${width}.png`});}
 const box=await page.$eval('.shape-lab',e=>({scroll:e.scrollHeight-e.clientHeight,right:e.getBoundingClientRect().right,bottom:e.getBoundingClientRect().bottom}));assert.ok(box.scroll<=1&&box.right<=width&&box.bottom<=height);count++;
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('riot.equipment')),saved,'free preview must not equip or purchase');
 // Reduced-motion preview is a stable reference frame containing dash artwork.
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await new Promise(r=>setTimeout(r,80));const still=await page.$eval('.custom-lab>canvas',e=>e.toDataURL());await new Promise(r=>setTimeout(r,180));assert.equal(await page.$eval('.custom-lab>canvas',e=>e.toDataURL()),still);assert.equal(await page.$eval('.shop-demo-play',e=>e.disabled),true);assert.deepEqual(errors,[]);await page.close();
 }console.log(`PASS ${count} free Shop elemental-dash previews: all seven elements at four sizes, no overflow/save mutation, stable reduced-motion reference, no page errors`);
}finally{await browser.close()}
