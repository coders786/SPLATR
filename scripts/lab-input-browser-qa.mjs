import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/lab-input',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1280,height:800});await page.goto('http://localhost:3000');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.motion','0');});await page.reload();await page.click('#customize-btn');await page.click('.destination-parts');await page.click('[data-action="aim"]');
 const b=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect(),s=Math.min(r.width/640,r.height/400);return {x:r.x+(r.width-640*s)/2,y:r.y+(r.height-400*s)/2,s};});
 const position=()=>page.$eval('.custom-lab>canvas',n=>({x:Number(n.dataset.playerX),y:Number(n.dataset.playerY),mode:n.dataset.testMode,hits:Number(n.dataset.hits)}));
 await page.mouse.move(b.x+235*b.s,b.y+185*b.s);await page.mouse.down();await page.mouse.move(b.x+466*b.s,b.y+180*b.s,{steps:8});await delay(80);const before=await position();await delay(650);const after=await position();assert.equal(after.mode,'aiming');assert.equal(before.x,after.x);assert.equal(before.y,after.y);assert.ok(await page.$eval('.custom-lab>canvas',n=>document.activeElement===n));
 await page.screenshot({path:'.arena/lab-input/reduced-motion-held-aim.png'});await page.mouse.up();await page.waitForFunction(()=>Number(document.querySelector('.custom-lab>canvas').dataset.hits)>0,{timeout:3000});
 assert.equal(await page.$eval('.shape-lab',n=>n.dataset.motion),'false');assert.equal(await page.$eval('.equipped-pills path',n=>getComputedStyle(n).animationName).catch(()=> 'none'),'none');console.log('PASS reduced-motion manual dash hits dummy; hold locks origin; pointer focuses keyboard target');
 await page.click('[data-action="aim"]');await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.waitForFunction(()=>Number(document.querySelector('.custom-lab>canvas').dataset.hits)>0,{timeout:3000});console.log('PASS Space fires from visible automatic pose with reduced motion');
 await page.click('[data-action="aim"]');await page.mouse.move(b.x+235*b.s,b.y+185*b.s);await page.mouse.down();await delay(50);await page.$eval('.custom-lab>canvas',n=>n.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));await page.mouse.up();await delay(80);assert.equal((await position()).hits,0);assert.equal((await position()).mode,'aim');console.log('PASS pointer cancellation clears aim without accidental dash');
 // Right mouse button is not a dash gesture.
 await page.mouse.click(b.x+300*b.s,b.y+180*b.s,{button:'right'});await delay(80);assert.equal((await position()).mode,'aim');
 // Re-entering the lab discards old input and never alters run progression.
 await page.keyboard.press('Escape');await page.click('#customize-btn');await page.click('.destination-parts');await delay(80);assert.equal((await position()).hits,0);assert.equal(await page.$eval('.shape-lab',n=>n.open),true);
 await page.click('[data-item="halo"]');assert.equal(await page.$eval('.shape-lab',n=>n.dataset.preview),'true');assert.match(await page.$eval('.custom-lab-label b',n=>n.textContent),/TRY-ON/);assert.equal(await page.$eval('[data-item="halo"]',n=>document.activeElement===n),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.head),'none');
 await page.click('[data-slot="eyes"]');await page.click('[data-slot="head"]');assert.equal(await page.$eval('.shape-lab',n=>n.dataset.preview),'false');assert.equal(await page.$eval('[data-item="none"]',n=>n.getAttribute('aria-pressed')),'true');
 console.log('PASS try-on labeled explicitly, keyboard focus retained, no silent equip, tab returns to equipped part');
 assert.deepEqual(errors,[]);console.log('PASS secondary button ignored, clean reopen, zero page errors');
}finally{await browser.close();}
