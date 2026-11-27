// Native shop flows + controlled actual live-run armor contacts and rendering.
// Uses the existing ?debug handle to isolate armor from story locks/random hits.
// Not an uncontrolled playthrough, actual-device test or performance benchmark.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5181';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk8/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
 for(const [width,height,reduced] of [[1280,720,false],[640,360,false],[390,844,false],[390,844,true]])for(const body of ['chamfer','segmented']){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({owned:[],equipped:defaults,presets:[defaults,null,null]}));
   localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();
   window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);
   window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?shopItem=${body}&debug`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.customize[open]');await page.evaluate(()=>qaFrames(2));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.$eval(`[data-item="${body}"]`,n=>n.getAttribute('aria-pressed')),'true');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),'paper');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1500);
  // Pin only demo time for an inspectable contact/reserve screenshot.
  await page.evaluate(async({body,reduced})=>{
   const {drawShopItemStudy}=await import('/src/art/splatr-art-engine.js');const {shopStudy}=await import('/src/shop-catalog.js');const {ITEMS,DEFAULT_EQUIPMENT}=await import('/src/equipment.js');
   const c=document.querySelector('.custom-lab>canvas'),eq={...DEFAULT_EQUIPMENT,body};
   drawShopItemStudy(c.getContext('2d'),640,400,{study:shopStudy(ITEMS.find(i=>i.id===body),1050,!reduced,eq),equipment:eq});
  },{body,reduced});
  await page.screenshot({path:`${out}/${body}-shop-${width}x${height}${reduced?'-reduced':''}.png`});
  const switched=await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none');
  if(switched)await page.click('.custom-view-switch button:first-child');
  assert.match(await page.$eval('.custom-detail',n=>n.textContent),body==='chamfer'?/GLANCING RECOIL/:/COMPRESSION SPRING/);
  await page.click('.equip-part');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),'paper');
  await page.click('.equip-part');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),body);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1500-(body==='chamfer'?280:380));
  await page.click('.lab-exit');await page.click('#start-btn');
  // Finish/skip the real cold-open before the controlled contact capture so
  // the cinematic does not obscure the shell we are verifying.
  await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(3));
  const contact=await page.evaluate(async()=>{
   const {placePlayer,stopPlayer,setPlayerVelocity}=await import('/src/physics.js');const r=window.__riot,s=r.state;
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   s.phase='playing';s.opening=null;s.inputLock=false;s.invul=999999;s.wave.entry=0;
   const view=r.world.viewport,p={x:view.x+view.w*.5,y:view.y+view.h*.5};
   placePlayer(r.world,p);stopPlayer(r.world);r.world.grounded=false;
   r.combat.add({id:'shell-sentinel',kind:'fang',x:p.x+900,y:p.y-900,pinned:true,delay:999999});
   const e=r.combat.add({id:'shell-plate',kind:'bastion',x:p.x+75,y:p.y,pinned:true,delay:999999});e.hp=8;
   if(!r.dash({x:30,y:0,power:30/42}))throw Error('fixture launch refused');
   setPlayerVelocity(r.world,30,0);s.stop=1;r.combat.contacts.add(e);r.tick();s.stop=9999;
   return {velocity:{...r.world.player.velocity},spring:s.shellSpring,impact:s.shellImpact,hp:e.hp};
  });
  assert.equal(contact.hp,7);
  assert.ok(Math.abs(contact.velocity.x-(body==='chamfer'?24.4:23))<1e-10);
  if(body==='segmented')assert.ok(Math.abs(contact.spring.amount-1.4)<1e-10);else assert.equal(contact.impact.age,0);
  await page.evaluate(()=>qaFrames(4));
  if(body==='segmented'){
   assert.equal(await page.$eval('#shell-reserve',n=>n.hidden),false);
   assert.match(await page.$eval('#shell-reserve',n=>n.textContent),/SPRING \+1.4/);
  }
  await page.screenshot({path:`${out}/${body}-live-${width}x${height}${reduced?'-reduced':''}.png`});
  let released=null;
  if(body==='segmented'){
   released=await page.evaluate(()=>{const r=__riot;const plate=r.combat.enemies.get('shell-plate');if(plate)r.combat.remove(plate);r.state.inputLock=false;const accepted=r.dash({x:24,y:0,power:24/42});return {accepted,velocity:{...r.world.player.velocity},charge:r.state.shellSpring,release:r.state.shellRelease};});
   assert.equal(released.accepted,true);assert.equal(released.charge,null);assert.ok(released.release.amount>0);assert.ok(Math.abs(released.velocity.x-25.4)<1e-10);
   await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('#shell-reserve',n=>n.hidden),true);
  }
  assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);assert.deepEqual(errors,[]);
  results.push({body,width,height,reduced,contact,released,errors});await page.close();
 }
 console.log('PASS: both shells / 4 layouts (8 cases), native free-preview/buy/equip, actual primary armor contacts, live state/HUD, one accepted spring return, reduced motion, no frame/page errors');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
