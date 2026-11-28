import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const url=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');url.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try{for(const [width,height] of [[1100,700],[390,844]]){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:width<600});await page.goto(url.href);await page.click('#customize-btn');
 const saved=await page.evaluate(()=>localStorage.getItem('riot.equipment'));await page.$eval('[data-item="crown"]',e=>e.click());if(width<600)await page.$eval('.custom-view-switch button:last-child',e=>e.click());
 const canvas=await page.$('.custom-lab>canvas');await canvas.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>Number(document.querySelector('.custom-lab>canvas').dataset.hits)>=2,{timeout:6000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('riot.equipment')),saved,'free try-on cannot equip or save');assert.match(await page.$eval('.custom-lab>canvas',e=>e.getAttribute('aria-label')),/Real selected-gear/);assert.deepEqual(errors,[]);
 console.log(`PASS ${width}x${height}: selected Crown uses real combat on both targets without saving`);await context.close();
}}finally{await browser.close();}
