// Native transactions + controlled real hazards/guard/bank in the live run.
// Correctness evidence, not an uncontrolled playthrough or device FPS test.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5184',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk11/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000}),results=[];
try{
 for(const [width,height,touch,reduced]of[[1280,720,false,false],[640,360,false,false],[390,844,true,false],[390,844,true,true]])for(const body of ['hologram','iron','prism']){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?shopItem=${body}&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));await page.evaluate(()=>document.fonts.ready);
  const saved=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));const before=await saved();assert.equal(before.equipment.equipped.body,'paper');assert.equal(before.wallet.coins,1500);assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story');
  // Freeze demonstration time only for a readable, labelled policy study.
  await page.evaluate(async({body,reduced})=>{const {drawShopItemStudy}=await import('/src/art/splatr-art-engine.js'),{shopStudy}=await import('/src/shop-catalog.js'),{ITEMS,DEFAULT_EQUIPMENT}=await import('/src/equipment.js');const eq={...DEFAULT_EQUIPMENT,body},canvas=document.querySelector('.custom-lab>canvas');drawShopItemStudy(canvas.getContext('2d'),640,400,{equipment:eq,study:shopStudy(ITEMS.find(i=>i.id===body),1850,!reduced,eq)});},{body,reduced});
  const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});assert.ok(bounds.visible,JSON.stringify({width,height,body,bounds}));
  await page.screenshot({path:`${out}/${body}-shop-${width}x${height}${reduced?'-reduced':''}.png`});assert.deepEqual(await saved(),before);
  const click=async selector=>{if(touch){const n=await page.$(selector);await n.scrollIntoView();await n.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  if(await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none'))await click('.custom-view-switch button:first-child');
  await click('.equip-part');let after=await saved();assert.equal(after.equipment.equipped.body,'paper');assert.equal(after.wallet.coins,1500-ITEMS.find(i=>i.id===body).price);
  await click('.equip-part');after=await saved();assert.equal(after.equipment.equipped.body,body);assert.deepEqual(after.equipment.presets,before.equipment.presets);assert.deepEqual(after.equipment.discovered,before.equipment.discovered);
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));
  const actual=await page.evaluate(async body=>{
   const {placePlayer,stopPlayer,setPlayerVelocity}=await import('/src/physics.js'),r=__riot,s=r.state;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   Object.assign(s,{phase:'playing',opening:null,inputLock:false,invul:0});s.wave.entry=0;const v=r.world.viewport,p={x:v.x+v.w*.5,y:v.y+v.h*.55};placePlayer(r.world,p);stopPlayer(r.world);r.world.grounded=false;
   r.combat.add({id:'shell-sentinel',kind:'fang',x:p.x+1000,y:p.y-900,pinned:true,delay:999999});
   const tick=()=>{s.stop=1;r.tick();},needle=()=>({kind:'needle',source:'prism',x:r.world.player.position.x,y:r.world.player.position.y,px:r.world.player.position.x,py:r.world.player.position.y,vx:0,vy:0,angle:0,life:110,age:0});
   if(body==='hologram'){
    if(!r.dash({x:24,y:0,power:24/42}))throw Error('fixture launch refused');s.blade=s.parry=0;const h=needle(),invul=s.invul;r.combat.hazards.push(h);tick();const pass={hp:s.hp,kept:r.combat.hazards.includes(h),spent:!!h.spent,invul:s.invul,wasInvul:invul,view:{...s.shellAbility}};
    window.__qaPhaseFirst=h;s.stop=9999;return {pass};
   }
   if(body==='iron'){
    tick();const before=s.hp,blocked=!r.hurt('Fang',null,{kind:'fang-rush'}),view={...s.shellAbility};s.hp=3;tick();const repaired={...s.shellAbility};s.stop=9999;return {before,blocked,hp:s.hp,view,repaired};
   }
   const a=r.world.arena;placePlayer(r.world,{x:a.x+27,y:p.y});setPlayerVelocity(r.world,-20,0);tick();
   for(let i=0;i<8&&s.shellAbility.ready;i++){s.stop=0;r.tick();}
   const fired={count:s.equipmentFx.projectiles.length,view:{...s.shellAbility}};placePlayer(r.world,p);stopPlayer(r.world);s.stop=9999;return {fired};
  },body);
  if(body==='hologram'){
   await page.evaluate(()=>qaFrames(4));await page.screenshot({path:`${out}/hologram-pass-${width}x${height}${reduced?'-reduced':''}.png`});
   actual.denied=await page.evaluate(()=>{const r=__riot,s=r.state,p=r.world.player.position,h={kind:'needle',source:'prism',x:p.x,y:p.y,px:p.x,py:p.y,vx:0,vy:0,angle:0,life:110,age:0};r.combat.hazards.push(h);s.stop=1;r.tick();s.stop=9999;return {hp:s.hp,keptSecond:r.combat.hazards.includes(h),keptFirst:r.combat.hazards.includes(window.__qaPhaseFirst)};});
  }
  if(body==='hologram'){assert.equal(actual.pass.hp,3);assert.equal(actual.pass.kept,true);assert.equal(actual.pass.spent,false);assert.equal(actual.pass.invul,actual.pass.wasInvul);assert.equal(actual.pass.view.ready,false);assert.equal(actual.denied.hp,2);assert.equal(actual.denied.keptSecond,false);assert.equal(actual.denied.keptFirst,true);}
  else if(body==='iron'){assert.equal(actual.blocked,true);assert.equal(actual.view.spent,true);assert.equal(actual.repaired.spent,true);}
  else{assert.equal(actual.fired.count,2);assert.equal(actual.fired.view.ready,false);assert.ok(actual.fired.view.remaining>0);}
  await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('#shell-ability',n=>n.hidden),false);const hud=await page.$eval('#shell-ability',n=>n.textContent);assert.match(hud,body==='hologram'?/PHASE RECHARGE/:body==='iron'?/GUARD SPENT/:/NEEDLES RELOAD/);
  await page.screenshot({path:`${out}/${body}-live-${width}x${height}${reduced?'-reduced':''}.png`});assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);
  results.push({width,height,touch,reduced,body,bounds,actual,hud,errors});await page.close();
 }
 console.log('PASS:3 reactive shells x4 layouts/motion cases; native free try-on/buy/equip; real phase preserves first needle and second hurts, actual spent guard, exactly2 wall needles, true HUD, no page/frame errors.');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
