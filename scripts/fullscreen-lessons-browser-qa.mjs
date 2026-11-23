// First-time and optional practice use actual DOM controls and real simulation.
// Captured viewports / reduced motion are browser emulation, not human testing.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/fullscreen-lessons',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const reduced of [false,true]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height,hasTouch:width<600,isMobile:width<600});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
  await page.setRequestInterception(true);page.on('request',async request=>{
   if(new URL(request.url()).pathname==='/src/teaching-ui.js'){const res=await fetch(request.url());let body=await res.text();body=body.replace(' function teardown(){',' Object.defineProperty(window,"qaLesson",{get:()=>session,configurable:true});\n function teardown(){');await request.respond({status:200,contentType:'text/javascript',body});}else await request.continue();
  });
  await page.goto('http://localhost:3000');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForFunction(()=>document.querySelector('#game').dataset.learning==='true');
  assert.equal(await page.$$eval('dialog[open]',e=>e.length),0);assert.equal(await page.$eval('#hud',e=>getComputedStyle(e).display),'none');
  assert.equal(await page.$eval('#rack-skip',e=>e.hidden),false);await page.screenshot({path:`.arena/fullscreen-lessons/first-${width}-${reduced}.png`});
  await page.click('#rack-skip');await page.waitForFunction(()=>document.querySelector('#game').dataset.learning==='false');
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#title-screen').hidden);assert.equal(await page.$$eval('dialog[open]',e=>e.length),0,'return visit does not auto-open a lesson');
  await page.click('#manual-btn');await page.click('.manual-drill[data-lesson=fang]');await page.waitForSelector('.teaching-guide[open]');
  const bounds=await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return {dialog:box(document.querySelector('.teaching-guide')),canvas:box(document.querySelector('.teaching-stage canvas')),card:box(document.querySelector('.teaching-directions')),menuOpen:document.querySelector('.teaching-menu').open,icons:document.querySelectorAll('.teaching-illustration svg').length,scroll:document.querySelector('.teaching-guide').scrollHeight-document.querySelector('.teaching-guide').clientHeight};});
  assert.deepEqual([bounds.canvas.x,bounds.canvas.y,bounds.canvas.w,bounds.canvas.h],[0,0,width,height]);assert.equal(bounds.menuOpen,false);assert.ok(bounds.icons>0);assert.ok(bounds.card.x>=0&&bounds.card.right<=width&&bounds.card.y>=0&&bounds.card.bottom<=height&&bounds.scroll<=1,JSON.stringify(bounds));
  await page.click('.teaching-menu summary');const before=await page.evaluate(()=>qaLesson.run.state.elapsed);await new Promise(r=>setTimeout(r,220));assert.equal(await page.evaluate(()=>qaLesson.run.state.elapsed),before,'opening options freezes the lesson');
  await page.select('.teaching-guide select','fang');await page.waitForFunction(()=>!document.querySelector('.teaching-menu').open);await page.waitForSelector('.teaching-step-next:not([hidden])',{timeout:8000});
  assert.match(await page.$eval('.teaching-step-label',e=>e.textContent),/WATCH THE WARNING/);await page.screenshot({path:`.arena/fullscreen-lessons/tell-${width}-${reduced}.png`});
  await page.click('.teaching-step-next');await page.waitForFunction(()=>document.querySelector('.teaching-guide').dataset.step==='2'&&!document.querySelector('.teaching-step-next').hidden,{timeout:8000});
  assert.match(await page.$eval('.teaching-step-label',e=>e.textContent),/WATCH THE CHARGE/);
  if(width===390&&!reduced){
   await page.click('.teaching-step-next');
   await page.evaluate(async()=>{const {placePlayer,stopPlayer}=await import('/src/physics.js');const s=qaLesson,r=s.run,e=[...r.combat.enemies.values()][0];placePlayer(r.world,{x:e.x-55,y:e.y});stopPlayer(r.world);if(!r.dash({x:30,y:0,power:1}))throw Error('finish launch failed');for(let i=0;i<15&&!s.waiting;i++)s.tick();});
   await page.waitForFunction(()=>!document.querySelector('.teaching-step-next').hidden&&document.querySelector('.teaching-step-next').textContent==='FINISH STEP');
   await page.click('.teaching-step-next');await page.waitForFunction(()=>document.querySelector('.teaching-step-next').textContent==='NEXT LESSON');
   await page.click('.teaching-step-next');await page.waitForFunction(()=>document.querySelector('.teaching-guide').dataset.lesson==='pulse');
  }
  await page.click('.teaching-close');assert.equal(await page.$eval('#manual-page',e=>e.hidden),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS first-time-only direct practice and fullscreen manual lessons: six viewport/motion cases; skip, options pause, real tell/attack, completed lesson progression, return to manual.');
}finally{await browser.close();}
