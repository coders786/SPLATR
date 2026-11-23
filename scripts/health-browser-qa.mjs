import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/health',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height] of [[1280,720],[390,680],[860,440]]){
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width,height,hasTouch:width<600,isMobile:width<600});
  await page.setRequestInterception(true);
  page.on('request',async r=>{
   if(new URL(r.url()).pathname==='/src/main.js'){
    const res=await fetch(r.url());
    await r.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.qaHealth={get run(){return run},start,updateHUD};'});
   } else await r.continue();
  });
  await page.goto('http://localhost:3000');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.evaluate(()=>{localStorage.setItem('riot.started','1')});await page.reload();await page.click('#manual-btn');await page.click('.manual-drill[data-lesson=fang]');await page.waitForSelector('.teaching-guide[open]');
  assert.match(await page.$eval('.teaching-health-help',e=>e.textContent),/charging Fang can hurt by contact.*at 0/i);
  assert.match(await page.$eval('.teaching-stats',e=>e.textContent),/HEALTH 3\/3/);
  await page.click('.teaching-close');await page.waitForFunction(()=>!document.querySelector('.teaching-guide').open);
  await page.click('#manual-back');await page.evaluate(()=>{qaHealth.start();qaHealth.run.state.phase='playing';qaHealth.updateHUD();});
  assert.equal(await page.$eval('#health-value',e=>e.textContent),'3/3');
  assert.match(await page.$eval('#hull',e=>e.getAttribute('aria-label')),/Health: 3 of 3/);
  await page.screenshot({path:`.arena/health/full-${width}.png`});
  await page.evaluate(()=>{qaHealth.run.state.invul=0;qaHealth.run.hurt('Fang',{x:10,y:10});qaHealth.updateHUD();});
  assert.equal(await page.$eval('#health-value',e=>e.textContent),'2/3');
  assert.match(await page.$eval('#callout',e=>e.textContent),/HEALTH −1 \/ Fang rush/);
  await page.evaluate(()=>{const r=qaHealth.run;r.state.hp=1;r.state.invul=0;r.hurt('Prism needle');qaHealth.updateHUD();for(let i=0;i<28;i++)r.tick();});
  await page.waitForFunction(()=>document.querySelector('#cause').textContent.includes('Last hit:'));
  assert.equal(await page.$eval('#cause',e=>e.textContent),'Health 0/3 · Run over. Last hit: Prism needle.');
  await page.screenshot({path:`.arena/health/result-${width}.png`});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS health onboarding, count, contact feedback and true fatal cause at three viewport sizes.');
} finally {await browser.close()}
