import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const url=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');url.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try{for(const [width,height] of [[1100,700],[390,844]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:width<600});await page.goto(url.href);await page.waitForSelector('#start-btn',{visible:true});await page.click('#start-btn');await page.waitForFunction(()=>window.__riot?.state.phase==='ready');
 await page.mouse.move(width*.5,height*.55);await page.mouse.down();await page.mouse.move(width*.75,height*.4);await page.mouse.up();await page.waitForFunction(()=>window.__riot.state.phase==='playing');
 await page.evaluate(()=>{const s=window.__riot.state;s.invul=99999;s.wave.entry=0;s.stop=0;s.wave.pace.held=true;s.wave.pace.progress=180;});
 await page.waitForFunction(()=>window.__riot.state.drive>0);await page.waitForFunction(()=>document.querySelector('.speed-pace[data-arcade="true"] .pace-action')?.textContent.startsWith('RUSH '));
 const hud=await page.$eval('.speed-pace[data-arcade="true"]',e=>({display:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON(),text:e.textContent,aria:e.querySelector('[role=meter]').getAttribute('aria-valuetext')}));
 assert.notEqual(hud.display,'none');assert.ok(hud.rect.width>0&&hud.rect.right<=width);assert.match(hud.text,/BONUS SCORE/);assert.match(hud.aria,/Rush|RUSH/);assert.equal(await page.$eval('#drive',e=>e.hidden),true);assert.deepEqual(errors,[]);
 console.log(`PASS ${width}x${height}: one visible, accessible Rush meter`);await page.close();
}}finally{await browser.close();}
