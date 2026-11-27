// Native seven-tail shop flows + controlled real-run power contacts.
// Correctness evidence; not an uncontrolled playthrough or a device FPS test.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
const tails=ITEMS.filter(i=>i.slot==='tail'),base=process.env.PREVIEW_URL||'http://127.0.0.1:5187',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk13/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000}),results=[];
try{
 const layouts=process.env.QA_DESKTOP_ONLY?[[1280,720,false,false]]:[[1280,720,false,false],[640,360,false,false],[390,844,true,false],[390,844,true,true]],selected=process.env.QA_TAIL?tails.filter(t=>t.id===process.env.QA_TAIL):tails;assert.ok(selected.length);
 for(const [width,height,touch,reduced]of layouts)for(const tail of selected){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?shopItem=${tail.id}&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));await page.evaluate(()=>document.fonts.ready);
  const saved=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))})),before=await saved();
  const click=async selector=>{if(touch){const n=await page.$(selector);await n.scrollIntoView();await n.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});assert.ok(bounds.visible,JSON.stringify({tail:tail.id,width,height,bounds}));
  const pixels=()=>page.$eval('.custom-lab>canvas',n=>n.toDataURL()),a=await pixels();await page.evaluate(()=>qaFrames(100));const b=await pixels();if(reduced)assert.equal(a,b);else if(tail.id!=='ribbon')assert.notEqual(a,b);
  if(!reduced){await click('.shop-demo-play');const paused=await pixels();await page.evaluate(()=>qaFrames(40));assert.equal(await pixels(),paused);await click('.shop-demo-play');}
  await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.hits),'0');assert.deepEqual(await saved(),before);
  await page.screenshot({path:`${out}/${tail.id}-shop-${width}x${height}${reduced?'-reduced':''}.png`});
  if(await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none'))await click('.custom-view-switch button:first-child');
  if(tail.price){await click('.equip-part');const bought=await saved();assert.equal(bought.equipment.equipped.tail,'ribbon');assert.equal(bought.wallet.coins,1500-tail.price);await click('.equip-part');}
  const after=await saved();assert.equal(after.equipment.equipped.tail,tail.id);assert.equal(after.wallet.coins,1500-tail.price);assert.deepEqual(after.equipment.presets,before.equipment.presets);assert.deepEqual(after.equipment.discovered,before.equipment.discovered);
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));
  const actual=await page.evaluate(async tail=>{
   const {placePlayer,stopPlayer,setPlayerVelocity}=await import('/src/physics.js'),r=__riot,s=r.state;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   Object.assign(s,{phase:'playing',opening:null,visualTutorial:null,tutorialActive:false,inputLock:false,invul:99999});s.wave.entry=0;
   const v=r.world.viewport,p={x:v.x+v.w*.5,y:v.y+v.h*.55};placePlayer(r.world,p);stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:p.x+1000,y:p.y-900,pinned:true,delay:999999});
   const step=()=>{s.stop=1;r.tick();};let proof={};
   if(tail==='viper-tails'){
    setPlayerVelocity(r.world,80,0);if(!r.dash({x:-24,y:0,power:24/42}))throw Error('Viper launch refused');proof={vx:r.world.player.velocity.x,vy:r.world.player.velocity.y,view:{...s.tailAbility}};
   }else if(tail==='spectrum'){
    s.edge=1;const stages=[];
    for(let i=0;i<3;i++){if(!r.dash({x:24,y:0,power:24/42}))throw Error('Spectrum launch refused');const p=r.world.player.position,e=r.combat.add({id:'primary-'+i,kind:'fang',x:p.x+30,y:p.y,pinned:true,delay:999999});e.hp=1;r.combat.contacts.add(e);step();stages.push({edge:s.edge,count:s.tailAbility.count,remaining:s.tailAbility.remaining});}
    proof={stages,view:{...s.tailAbility}};
   }else if(tail==='wings'){
    s.edge=0;const a=r.world.arena;placePlayer(r.world,{x:a.x+27,y:p.y});setPlayerVelocity(r.world,-20,0);step();for(let i=0;i<8&&s.tailAbility.ready;i++){s.stop=0;r.tick();}proof={edge:s.edge,view:{...s.tailAbility}};
   }else if(tail==='anchor'){
    r.world.floorKick={vy:-22,rescue:true};step();proof={view:{...s.tailAbility}};
   }else if(tail==='thrusters'){
    step();const idle={...s.tailAbility};
    // The idle tick can schedule the narrative input lock; this controlled
    // combat fixture, like its initial setup, explicitly exits that lock.
    s.inputLock=false;if(!r.dash({x:24,y:0,power:24/42}))throw Error('Thruster fixture launch refused '+JSON.stringify({edge:s.edge,phase:s.phase,wavePhase:s.wave.phase,inputLock:s.inputLock,opening:s.opening}));
    // Isolate an airborne bank, not an unconsumed floor-kick receipt from start.
    s.floorTouched=false;r.world.floorKick=null;setPlayerVelocity(r.world,20,0);
    r.world.struck={surface:'rail',nx:-1,ny:0,x:p.x+30,y:p.y,depth:10,arrivalSpeed:20};step();proof={idle,vx:r.world.player.velocity.x,view:{...s.tailAbility}};
   }else{
    if(tail==='ghost')r.dash({x:24,y:0,power:24/42});step();proof={blade:s.blade,view:{...s.tailAbility}};
   }
   if(tail==='wings'){placePlayer(r.world,p);stopPlayer(r.world);s.splat=null;}
   s.stop=99999;return {tail:s.equipment.tail,...proof};
  },tail.id);
  assert.equal(actual.tail,tail.id);
  if(tail.id==='viper-tails'){assert.ok(Math.abs(actual.vx+69.8)<1e-8);assert.equal(actual.view.action,'retention');}
  if(tail.id==='spectrum'){assert.deepEqual(actual.stages.map(s=>s.edge),[1,1,2]);assert.deepEqual(actual.stages.map(s=>s.count),[1,2,0]);assert.equal(actual.view.remaining,120);}
  if(tail.id==='wings'){assert.equal(actual.edge,1);assert.equal(actual.view.ready,false);}
  if(tail.id==='anchor')assert.equal(actual.view.action,'floor');
  if(tail.id==='ghost')assert.equal(actual.view.active,true);
  if(tail.id==='thrusters'){assert.equal(actual.idle.action,undefined,'idle jets cannot pretend a bank boost occurred');assert.equal(actual.view.action,'jet',JSON.stringify(actual));assert.ok(Math.abs(actual.vx-24.624)<1e-8);}
  await page.evaluate(()=>qaFrames(4));const hud=await page.$eval('#tail-ability',n=>({hidden:n.hidden,text:n.textContent}));
  if(['spectrum','wings','viper-tails'].includes(tail.id))assert.equal(hud.hidden,false);
  await page.screenshot({path:`${out}/${tail.id}-live-${width}x${height}${reduced?'-reduced':''}.png`});assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);results.push({tail:tail.id,width,height,touch,reduced,bounds,actual,hud,errors});await page.close();
 }
 console.log(`PASS ${selected.length} tails x${layouts.length} layouts/motion cases: free readonly studies, pause/stills, native buy/equip, real Viper80→69.8, Spectrum primary counts/refund, spent Wings, floor Anchor, active Ghost, idle dry jets and accepted marginal jet boost; saved presets/discoveries unchanged; no page/frame errors.`);
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
