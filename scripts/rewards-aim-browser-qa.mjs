import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/rewards-aim';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const reports=[];
try{
 for(const [width,height] of [[1280,720],[960,640],[550,720],[860,440]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');});await page.reload();await page.evaluate(()=>document.fonts.ready);
  await page.click('#quests-btn');await page.click('.quest-toggle');assert.match(await page.$eval('.quest-toggle',e=>e.textContent),/OFF/);
  await page.click('.quest-board-close');await page.reload();await page.click('#quests-btn');assert.match(await page.$eval('.quest-toggle',e=>e.textContent),/OFF/);
  await page.click('.quest-board-close');await page.click('#start-btn');assert.equal(await page.$eval('.quest-mini',e=>e.hidden),true);
  await page.keyboard.press('q');assert.equal(await page.$eval('.quest-peek',e=>e.hidden),true);
  // Real pointer events exercise capture and release in the running game.
  await page.evaluate(()=>{window.aimLabels=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/RELEASE|RECOVERING/.test(text))window.aimLabels.push(text);return original.call(this,text,...args);};});
  await page.mouse.move(width*.5,height*.45);await page.mouse.down();await page.mouse.move(width*.54,height*.65,{steps:8});
  await new Promise(r=>setTimeout(r,170));await page.screenshot({path:`${out}/aim-${width}x${height}.png`});
  assert.ok(await page.evaluate(()=>window.aimLabels.length>0),'live launch compass/instruction must render');await page.mouse.up();
  await page.keyboard.press('p');if(await page.$eval('#skip-room',n=>!n.hidden)){await page.click('#skip-room');await page.keyboard.press('p');}
  await page.click('#end-btn');await page.waitForSelector('#result-page:not([hidden])');
  const wallet=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins);assert.ok(wallet>=10);
  assert.match(await page.$eval('.round-payout',e=>e.textContent),/CREDITS/);assert.equal(await page.$$eval('.quest-results .quest-row',n=>n.length),0);
  await page.screenshot({path:`${out}/free-play-${width}x${height}.png`});
  await page.click('#retry-btn');await page.keyboard.press('p');await page.click('#end-btn');await page.waitForSelector('#result-page:not([hidden])');
  const second=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins);assert.ok(second>=wallet+10);
  await page.click('#home-btn');await page.click('#quests-btn');await page.click('.quest-toggle');await page.click('.quest-board-close');await page.click('#start-btn');await page.keyboard.press('p');await page.click('#end-btn');await page.waitForSelector('#result-page:not([hidden])');
  await page.click('.result-bonuses summary');
  const metrics=await page.evaluate(()=>{
   const nodes=[document.querySelector('#panel'),...document.querySelectorAll('#result-page button')];return nodes.map(e=>{const r=e.getBoundingClientRect();return {name:e.id||e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,scroll:e.scrollHeight-e.clientHeight};});
  });
  for(const m of metrics){assert.ok(m.x>=-1&&m.y>=-1&&m.x+m.w<=width+1&&m.y+m.h<=height+1,JSON.stringify({width,height,m}));}
  assert.ok(metrics[0].scroll<=1,`expanded quest panel must fit: ${JSON.stringify(metrics[0])}`);
  await page.screenshot({path:`${out}/bonuses-open-${width}x${height}.png`});assert.deepEqual(errors,[]);reports.push({width,height,wallet,second,metrics,errors});await page.close();
 }
 console.log('PASS live mouse aim / optional quests persist / free-play payouts and retry / expanded bonus details fit four sizes');
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await browser.close();}
