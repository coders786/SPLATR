import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/learning',{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height]of [[1280,720],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1')});await page.reload();await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`.arena/learning/home-${width}.png`});await page.click('#quests-btn');
 assert.equal(await page.$$eval('.quest-option',e=>e.length),3);assert.equal(await page.$$eval('.quest-option[aria-pressed=true]',e=>e.length),3);
 assert.equal(await page.$eval('.lesson-rewards',e=>e.open),false);
 const bounds=await page.$eval('.quest-board-dialog',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}});assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width&&bounds.bottom<=height);
 await page.screenshot({path:`.arena/learning/board-${width}.png`});await page.click('.quest-board-close');await page.click('#start-btn');await new Promise(r=>setTimeout(r,1100));assert.equal(await page.$$eval('dialog[open]',e=>e.length),0);assert.deepEqual(errors,[]);await page.close();
}console.log('PASS four-size teaching board: three preselected lessons, secondary rewards, bounded dialog and immediate start; zero JS errors');}finally{await browser.close()}
