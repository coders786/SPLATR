import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/physics-contract';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const reports=[];
try{
 for(const [width,height] of [[1280,720],[960,640],[550,720],[860,440]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:123,rounds:12,bestBand:5,recent:['fang5','triple1','sector3']}));});await page.reload();await page.evaluate(()=>document.fonts.ready);
  const before=await page.$$eval('.quest-option',els=>els.map(e=>e.getAttribute('aria-label')));
  await page.click('.quest-shuffle');const after=await page.$$eval('.quest-option',els=>els.map(e=>e.getAttribute('aria-label')));assert.notDeepEqual(after,before);assert.equal(after.length,9);assert.equal(await page.$$eval('.quest-option[aria-pressed=true]',els=>els.length),3);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),123,'offer changes are free');
  await page.click('.quest-columns>div:nth-child(2) .quest-option:first-of-type');assert.equal(await page.$$eval('.quest-option[aria-pressed=true]',els=>els.length),3);
  const boxes=await page.$$eval('.quest-option,.quest-shuffle,#start-btn,.quest-toggle',els=>els.map(e=>{const r=e.getBoundingClientRect();return {name:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=width+1&&b.y+b.h<=height+1,JSON.stringify({width,height,b}));
  await page.screenshot({path:`${out}/quest-board-${width}x${height}.png`});
  await page.click('#start-btn');await new Promise(r=>setTimeout(r,150));assert.match(await page.$eval('.round-pay',e=>e.textContent),/ROUND \+10 CREDITS/);assert.ok((await page.$eval('.quest-next',e=>e.textContent)).length>4);await page.screenshot({path:`${out}/quest-hud-${width}x${height}.png`});
  assert.deepEqual(errors,[]);reports.push({width,height,boxes,errors});await page.close();
 }
 console.log('PASS seeded contract board / free offer generation / selection / live goal and credit forecast / four viewport sizes');
}finally{writeFileSync(`${out}/board-report.json`,JSON.stringify(reports,null,2));await browser.close();}
