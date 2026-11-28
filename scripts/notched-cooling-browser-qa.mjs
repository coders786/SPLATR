// Visible item proof, native selection/equip and actual run recovery. Not an FPS benchmark.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5180';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk7/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
 for(const [width,height,reduced] of [[1280,720,false],[640,360,false],[390,844,false],[390,844,true]]){
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
  await page.goto(`${base}/?shopItem=notched&debug`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.customize[open]');await page.evaluate(()=>qaFrames(2));
  assert.equal(await page.$eval('[data-item="notched"]',n=>n.getAttribute('aria-pressed')),'true');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),'paper','free preview must not equip');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1500);
  await page.evaluate(()=>document.fonts.ready);
  // Pin demo time only; authority itself is tested in the run below and in node tests.
  await page.evaluate(async reduced=>{
   const {drawShopItemStudy}=await import('/src/art/splatr-art-engine.js');const {shopStudy}=await import('/src/shop-catalog.js');const {ITEMS,DEFAULT_EQUIPMENT}=await import('/src/equipment.js');
   const canvas=document.querySelector('.custom-lab>canvas'),eq={...DEFAULT_EQUIPMENT,body:'notched'};
   const item=ITEMS.find(i=>i.id==='notched');drawShopItemStudy(canvas.getContext('2d'),640,400,{study:shopStudy(item,1750,!reduced,eq),equipment:eq});
  },reduced);
  await page.screenshot({path:`${out}/shop-${width}x${height}${reduced?'-reduced':''}.png`});
  const switched=await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none');
  if(switched)await page.click('.custom-view-switch button:first-child');
  assert.match(await page.$eval('.custom-detail',n=>n.textContent),/VENT COOLING/);
  await page.click('.equip-part');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),'paper');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1180);
  await page.click('.equip-part');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped.body),'notched');
  await page.click('.lab-exit');await page.click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(2));
  // Launch through actual input, then hold Shift in flight to spend FOCUS.
  await page.mouse.click(width*.60,height*.32);await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(2));
  await page.evaluate(()=>qaFrames(240));
  // Isolate recovery from kill/full-refill and damage using the existing debug
  // run. Inputs below remain native; this is a controlled live-render fixture.
  await page.evaluate(async()=>{
   const {stopPlayer,placePlayer}=await import('/src/physics.js');const r=window.__riot;
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   const p={...r.world.player.position};r.combat.add({id:'cooling-sentinel',kind:'fang',x:p.x+900,y:p.y-900,pinned:true,delay:999999});
   placePlayer(r.world,{x:p.x,y:p.y-180});stopPlayer(r.world);r.world.grounded=false;r.state.blade=0;r.state.invul=999999;r.state.wave.entry=0;r.state.inputLock=false;
  });
  await page.evaluate(()=>qaFrames(80));
  await page.keyboard.down('Shift');await page.evaluate(()=>qaFrames(15));
  const held=await page.evaluate(()=>({held:__riot.state.held,focus:__riot.state.focus,phase:__riot.state.phase,open:!!__riot.state.opening}));
  assert.equal(held.open,false);assert.equal(held.held,true,JSON.stringify({held,extra:await page.evaluate(()=>({screen:document.querySelector('#game').dataset.screen,grounded:__riot.world.grounded,stun:__riot.state.stun,lock:__riot.state.inputLock,elapsed:__riot.state.elapsed,wave:__riot.state.wave.phase,clock:__riot.world.clock,errors:window.__splatrFrameErrors}))}));assert.ok(held.focus<1);
  assert.equal(await page.$eval('#focus-meter',n=>n.hasAttribute('data-cooling')),false);
  await page.keyboard.up('Shift');await page.evaluate(()=>qaFrames(5));
  const cooling=await page.evaluate(()=>({active:__riot.state.focusRecoveryActive,focus:__riot.state.focus,amount:__riot.state.focusRecoveryAmount}));
  assert.equal(cooling.active,true,JSON.stringify({held,cooling,run:await page.evaluate(()=>({phase:__riot.state.phase,held:__riot.state.held,screen:document.querySelector('#game').dataset.screen}))}));assert.ok(cooling.focus>held.focus);assert.ok(Math.abs(cooling.amount-1.12/250)<1e-12);
  assert.equal(await page.$eval('#focus-meter',n=>n.hasAttribute('data-cooling')),true);
  await page.screenshot({path:`${out}/live-${width}x${height}${reduced?'-reduced':''}.png`});
  await page.keyboard.down('Shift');await page.evaluate(()=>qaFrames(5));
  assert.equal(await page.evaluate(()=>__riot.state.focusRecoveryActive),false);
  await page.keyboard.up('Shift');
  assert.deepEqual(errors,[]);results.push({width,height,reduced,held,cooling,errors});await page.close();
 }
 const page=await browser.newPage();await page.goto(`${base}/?shopItem=not-a-real-item`,{waitUntil:'networkidle0'});assert.equal(await page.$('.customize[open]'),null);await page.close();
 console.log('PASS: free direct preview, buy != equip, real held/recovery/repress, HUD, desktop/short/mobile/reduced-motion, invalid item rejected');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
