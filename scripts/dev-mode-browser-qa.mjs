import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/dev-mode',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height] of [[1280,720],[390,680],[860,440]]) {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width,height});
  await page.evaluateOnNewDocument(()=>{window.sdkCalls=[];window.PokiSDK={init(){window.sdkCalls.push('init');return Promise.resolve()},gameLoadingStart(){window.sdkCalls.push('loading')},gameLoadingFinished(){window.sdkCalls.push('loaded')},gameplayStart(){window.sdkCalls.push('play')},gameplayStop(){window.sdkCalls.push('stop')}};});
  await page.setRequestInterception(true);
  page.on('request',async r=>{
   if(new URL(r.url()).pathname==='/src/main.js'){
    const res=await fetch(r.url()),body=await res.text();
    await r.respond({status:200,contentType:'text/javascript',body:body+'\nwindow.devQA={get run(){return run},get trace(){return combatTrace}, event};'});
   }else await r.continue();
  });
  await page.goto('http://localhost:3000');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.best','123');localStorage.setItem('riot.quests',JSON.stringify({coins:7}));localStorage.setItem('splatr.muted','1');});
  await page.reload();
  const snapshot=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await page.click('#options-btn');
  assert.equal(await page.$eval('#dev-opt b',e=>e.textContent),'Off');
  await Promise.all([page.waitForNavigation(),page.click('#dev-opt')]);
  assert.equal(new URL(page.url()).searchParams.get('dev'),'1');
  await page.waitForFunction(()=>!document.querySelector('#title-screen').hidden);
  assert.equal(await page.$eval('#dev-badge',e=>e.hidden),false);
  assert.deepEqual(await page.evaluate(()=>window.sdkCalls),[],'sandbox must not initialize the portal SDK');
  await page.click('#options-btn');await page.click('#audio-opt');await page.click('#options-page .back');
  await page.click('#customize-btn');
  assert.match(await page.$eval('.custom-wallet',e=>e.textContent),/∞ SANDBOX CREDITS/);
  for(const id of ['halo','neko']){
   await page.click(`.custom-card[data-item="${id}"]`);
   assert.equal(await page.$eval('.equip-part',e=>e.disabled),false);
   await page.click('.equip-part');
   assert.match(await page.$eval(`.custom-card[data-item="${id}"]`,e=>e.getAttribute('aria-label')),/owned/);
  }
  await page.click('.custom-card[data-item="oni"]');
  assert.equal(await page.$eval('.equip-part',e=>e.disabled),true);
  await page.click('.custom-card[data-item="halo"]');await page.click('.equip-part');
  await page.click('.lab-exit');
  await page.reload();await page.click('#customize-btn');
  assert.match(await page.$eval('.custom-card[data-item="halo"]',e=>e.getAttribute('aria-label')),/owned/);
  await page.click('.lab-exit');
  await page.click('#manual-btn');await page.click('.manual-drill[data-lesson="rift"]');
  await page.waitForSelector('.teaching-guide[open]');
  assert.equal(await page.$eval('.teaching-guide',e=>e.dataset.lesson),'rift');
  await page.click('.teaching-close');await page.click('#manual-back');
  await page.click('#start-btn');
  await page.waitForFunction(()=>window.devQA.run?.state.wave);
  assert.equal(await page.evaluate(()=>devQA.run.state.equipment.head),'halo');
  await page.evaluate(()=>{devQA.run.state.hp=1;devQA.run.state.edge=0;devQA.run.state.focus=0;});
  await page.click('#pause-btn');await page.click('#dev-refill');
  assert.deepEqual(await page.evaluate(()=>{const s=devQA.run.state;return [s.hp,s.hpMax,s.edge,s.edgeMax,s.focus]}),[3,3,3,3,1]);
  assert.equal(await page.$eval('#dev-trace',e=>e.hidden),false);
  await page.evaluate(()=>{devQA.run.hurt('test attack');const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.traceText=blob.text();return original(blob)};});
  await page.click('#dev-trace');
  const trace=JSON.parse(await page.evaluate(()=>window.traceText));
  assert.ok(trace.events.some(e=>e.type==='damage'||e.type==='damage-blocked'));
  assert.equal(trace.version,1);
  await page.screenshot({path:`.arena/dev-mode/pause-${width}.png`});
  await page.evaluate(()=>{devQA.run.state.score=9999;devQA.event('challenge',{id:'oni'});});
  await page.click('#end-btn');await page.waitForFunction(()=>!document.querySelector('#result-page').hidden);
  assert.equal(await page.evaluate(()=>localStorage.getItem('riot.dev.best')),'9999');
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.dev.equipment')).owned.includes('oni')));
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.dev.quests')).rounds>=1));
  await page.click('#retry-btn');await page.waitForFunction(()=>window.devQA.run?.state.wave);
  await page.click('#pause-btn');await page.click('#pause-options');
  page.once('dialog',d=>d.dismiss());await page.click('#dev-opt');
  assert.equal(new URL(page.url()).searchParams.get('dev'),'1');
  page.once('dialog',d=>d.accept());await Promise.all([page.waitForNavigation(),page.click('#dev-opt')]);
  assert.equal(new URL(page.url()).searchParams.has('dev'),false);
  assert.equal(await page.$eval('#dev-badge',e=>e.hidden),true);
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith('riot.dev.')&&k!=='splatr.dev.muted'))),snapshot);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('PASS desktop, mobile and landscape: explicit mode switch, isolated persisted purchases and equipped build, challenge lock, real training, refill, trace control, cancel/exit mid-run and intact normal save');
} finally {await browser.close();}
