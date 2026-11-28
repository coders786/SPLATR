// Play the shipped page with fresh preferences and after switching aim modes.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const url=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');url.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try {
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1100,height:700});await page.goto(url.href);await page.waitForSelector('#start-btn',{visible:true});
 await page.click('#options-btn');assert.equal(await page.$eval('#aim-mode-opt b',e=>e.textContent),'Direct');
 await page.click('#aim-mode-opt');assert.equal(await page.$eval('#aim-mode-opt b',e=>e.textContent),'Slingshot');
 await page.reload();await page.waitForSelector('#start-btn',{visible:true});await page.click('#options-btn');assert.equal(await page.$eval('#aim-mode-opt b',e=>e.textContent),'Slingshot');
 await page.keyboard.press('Escape');await page.click('#start-btn');
 await page.evaluate(()=>{window.__riot.state.invul=10000;});
 await page.mouse.move(400,330);await page.mouse.down();await page.mouse.move(510,330);
 const pull=await page.$eval('svg[data-control]',e=>({mode:e.dataset.mode,angle:e.querySelector('.drag-design').getAttribute('transform')}));
 assert.equal(pull.mode,'pull');assert.ok(Math.cos(Number(pull.angle.match(/rotate\(([-.\d]+)/)[1])*Math.PI/180)<-.9,'pulling right fires left');await page.mouse.up();
 await page.waitForFunction(()=>window.__riot.state.shots===1);
 await page.keyboard.press('Escape');await page.click('#pause-options');await page.click('#aim-mode-opt');assert.equal(await page.$eval('#aim-mode-opt b',e=>e.textContent),'Direct');await page.keyboard.press('Escape');await page.click('#resume-btn');
 await page.mouse.move(520,250);await page.mouse.down();await page.mouse.move(600,210);
 const direct=await page.$eval('svg[data-control]',e=>({mode:e.dataset.mode,power:Number(e.dataset.power)}));assert.equal(direct.mode,'direct');assert.equal(direct.power,1);
 await page.mouse.up();await page.waitForFunction(()=>window.__riot.state.shots===2);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS: default direct, saved slingshot, opposite pull and live pause-mode switch');
} finally {await browser.close();}
