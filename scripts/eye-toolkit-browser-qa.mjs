// Native seven-eye shop flows + controlled real-run power contacts.
// Correctness evidence; not an uncontrolled playthrough or a device FPS test.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
const eyes=ITEMS.filter(i=>i.slot==='eyes'),base=process.env.PREVIEW_URL||'http://127.0.0.1:5187',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk14/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000}),results=[];
try{
 const layouts=process.env.QA_DESKTOP_ONLY?[[1280,720,false,false]]:[[1280,720,false,false],[640,360,false,false],[390,844,true,false],[390,844,true,true]],selected=process.env.QA_EYE?eyes.filter(t=>t.id===process.env.QA_EYE):eyes;assert.ok(selected.length);
 for(const [width,height,touch,reduced]of layouts)for(const eye of selected){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?shopItem=${eye.id}&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));await page.evaluate(()=>document.fonts.ready);
  const saved=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))})),before=await saved();
  const click=async selector=>{if(touch){const n=await page.$(selector);await n.scrollIntoView();await n.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});assert.ok(bounds.visible,JSON.stringify({eye:eye.id,width,height,bounds}));
  const pixels=()=>page.$eval('.custom-lab>canvas',n=>n.toDataURL()),a=await pixels();await page.evaluate(()=>qaFrames(100));const b=await pixels();if(reduced)assert.equal(a,b);else if(eye.id!=='ninja')assert.notEqual(a,b);
  if(!reduced){await click('.shop-demo-play');const paused=await pixels();await page.evaluate(()=>qaFrames(40));assert.equal(await pixels(),paused);await click('.shop-demo-play');}
  await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.hits),'0');assert.deepEqual(await saved(),before);
  await page.screenshot({path:`${out}/${eye.id}-shop-${width}x${height}${reduced?'-reduced':''}.png`});
  if(await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none'))await click('.custom-view-switch button:first-child');
  if(eye.price){await click('.equip-part');const bought=await saved();assert.equal(bought.equipment.equipped.eyes,'ninja');assert.equal(bought.wallet.coins,1500-eye.price);await click('.equip-part');}
  const after=await saved();assert.equal(after.equipment.equipped.eyes,eye.id);assert.equal(after.wallet.coins,1500-eye.price);assert.deepEqual(after.equipment.presets,before.equipment.presets);assert.deepEqual(after.equipment.discovered,before.equipment.discovered);
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));
  const actual=await page.evaluate(async eye=>{
   const {placePlayer,stopPlayer}=await import('/src/physics.js'),r=__riot,s=r.state,events=[];
   for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   // Removing the authored formation would otherwise trigger its half-clear story.
   // This fixture isolates combat, not narrative/input-lock coverage.
   Object.assign(s,{phase:'playing',opening:null,visualTutorial:null,tutorialActive:false,inputLock:false,invul:99999});s.wave.entry=0;
   const v=r.world.viewport,p={x:v.x+v.w*.5,y:v.y+v.h*.55};placePlayer(r.world,p);stopPlayer(r.world);r.world.grounded=false;
   r.combat.add({id:'sentinel',kind:'fang',x:p.x+1000,y:p.y-900,pinned:true,delay:999999});
   const step=()=>{s.stop=1;r.tick();};let proof={};
   if(eye==='hypno'){
    const e=r.combat.add({id:'hypno-proof',kind:'fang',x:p.x+110,y:p.y,delay:999999,wavePlaced:true});r.focus(true);
    for(let i=0;i<17;i++){s.stop=0;r.tick();}const before={view:{...s.eyeAbility},until:e.hypnoUntil};s.stop=0;r.tick();
    proof={before,view:{...s.eyeAbility},until:e.hypnoUntil,now:r.world.clock,mode:e.mode};
   }else if(eye==='blaze'){
    s.chain=5;s.chainTime=100;s.edge=1;if(!r.dash({x:24,y:0,power:24/42}))throw Error('Blaze launch refused');
    const p=r.world.player.position,e=r.combat.add({id:'entry-proof',kind:'fang',x:p.x+30,y:p.y,pinned:true,delay:999999});r.combat.contacts.add(e);step();
    proof={edge:s.edge,drive:s.drive,view:{...s.eyeAbility}};
   }else if(eye==='glitch'){
    r.focus(false);s.focus=.5;const before=s.focus;step();proof={before,focus:s.focus,recovering:s.focusRecoveryActive};
   }else if(eye==='visor'){
    s.focus=.5;r.focus(true);const before=s.focus;step();proof={drain:before-s.focus,view:{...s.eyeAbility},held:s.held,lock:s.inputLock,phase:s.wave.phase,stun:s.stun,depleted:s.depleted,focus:s.focus};
   }else if(eye==='smug'){
    s.chain=5;s.chainTime=100;s.drive=100;step();proof={drive:s.drive,chain:s.chain};
   }else{step();proof={view:{...s.eyeAbility}};}
   s.stop=99999;return {eye:s.equipment.eyes,...proof};
  },eye.id);
  assert.equal(actual.eye,eye.id);
  if(eye.id==='blaze'){assert.equal(actual.edge,2);assert.ok(actual.drive>0);assert.ok(actual.view.flash>0);}
  if(eye.id==='hypno'){assert.equal(actual.before.view.age,17);assert.equal(actual.before.until,undefined);assert.equal(actual.view.age,18);assert.equal(actual.view.spent,true);assert.ok(actual.view.remaining>11&&actual.view.remaining<12);assert.equal(actual.mode,'idle');}
  if(eye.id==='visor'){assert.ok(Math.abs(actual.drain-.9/165)<1e-9);assert.equal(actual.view.active,true,JSON.stringify(actual));}
  if(eye.id==='glitch'){assert.ok(actual.focus>actual.before);assert.equal(actual.recovering,true);}
  await page.evaluate(()=>qaFrames(4));await page.screenshot({path:`${out}/${eye.id}-live-${width}x${height}${reduced?'-reduced':''}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);results.push({eye:eye.id,width,height,touch,reduced,bounds,actual,errors});await page.close();
 }
 console.log(`PASS ${selected.length} eyes x${layouts.length} layouts/motion cases: free readonly studies, pause/stills, native buy/equip, actual Blaze entry +1 EDGE and Hypno18th-aim-update daze, Visor drain and Glitch recovery; saved presets/discoveries unchanged; no page/frame errors.`);
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
