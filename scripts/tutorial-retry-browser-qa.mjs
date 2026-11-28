import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_BASE||'http://localhost:5173';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const blocked of [false,true]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  if(blocked)await page.evaluateOnNewDocument(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')};});
  await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.retryQA={get run(){return run},get course(){return tutorial},start,storage};'});}else await req.continue();});
  await page.goto(base);if(!blocked){await page.evaluate(()=>localStorage.clear());await page.reload();}
  await page.waitForSelector('#start-btn',{visible:true});
  await page.click('#start-btn');assert.equal(await page.$eval('#game',e=>e.dataset.learning),'true');
  assert.equal(await page.evaluate(()=>retryQA.storage.get('tutorialStarted','0')),'1');assert.equal(await page.evaluate(()=>retryQA.storage.get('tutorialCompleted','0')),'0');
  // Simulate the tutorial over callback: automatic restart must not replay it.
  await page.evaluate(()=>retryQA.start());assert.equal(await page.$eval('#game',e=>e.dataset.learning),'false');
  await page.keyboard.press('Escape');await page.click('#end-btn');await page.waitForSelector('#retry-btn',{visible:true});await page.click('#retry-btn');assert.equal(await page.$eval('#game',e=>e.dataset.learning),'false');assert.equal(await page.evaluate(()=>retryQA.storage.get('tutorialCompleted','0')),'0');
  await page.keyboard.press('Escape');await page.click('#end-btn');await page.waitForSelector('#home-btn',{visible:true});await page.click('#home-btn');await page.click('#quests-btn');assert.equal(await page.$eval('#game',e=>e.dataset.learning),'true');
  await page.click('#rack-skip');assert.equal(await page.$eval('#game',e=>e.dataset.learning),'false');assert.equal(await page.evaluate(()=>retryQA.storage.get('tutorialCompleted','0')),'1');assert.equal(await page.evaluate(()=>retryQA.run.state.arcade.sector),1);
  await page.keyboard.press('Escape');await page.click('#end-btn');await page.waitForSelector('#home-btn',{visible:true});await page.click('#home-btn');await page.click('#quests-btn');await page.click('#rack-skip');assert.equal(await page.evaluate(()=>retryQA.run.state.arcade.sector),1,'replay starts arcade play');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS interrupted tutorial, result Retry, deliberate Learn replay, skip and session-only blocked-storage fallback.');
} finally {await browser.close();}
