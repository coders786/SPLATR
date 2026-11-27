// Native world selection/buy/equip, actual run rendering, controlled RAF fixtures.
// Correctness/readability captures, not a device FPS or uncontrolled play test.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
const worlds=ITEMS.filter(i=>i.slot==='world'),base=process.env.PREVIEW_URL||'http://127.0.0.1:5186',out=process.env.QA_OUT_DIR||'.arena/harmony-chunk12/browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:30000}),results=[];
try{
 for(const [width,height,touch,reduced]of [[1280,720,false,false],[640,360,false,false],[390,844,true,false],[390,844,true,true]])for(const world of worlds){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await page.goto(`${base}/?shopItem=${world.id}&debug`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>qaFrames(4));await page.evaluate(()=>document.fonts.ready);
  const saved=()=>page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));const before=await saved();
  const click=async selector=>{if(touch){const n=await page.$(selector);await n.scrollIntoView();await n.dispose();await page.tap(selector);}else await page.click(selector);await page.evaluate(()=>qaFrames(4));};
  assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'world');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const bounds=await page.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};});assert.ok(bounds.visible,JSON.stringify({world:world.id,width,height,bounds}));
  const pixels=()=>page.$eval('.custom-lab>canvas',n=>n.toDataURL());const a=await pixels();await page.evaluate(()=>qaFrames(40));const b=await pixels();if(reduced)assert.equal(a,b);else assert.notEqual(a,b);
  if(!reduced){await click('.shop-demo-play');const paused=await pixels();await page.evaluate(()=>qaFrames(40));assert.equal(await pixels(),paused);await click('.shop-demo-play');}
  await page.focus('.custom-lab>canvas');await page.keyboard.press('Space');await page.evaluate(()=>qaFrames(4));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.dataset.hits),'0');assert.deepEqual(await saved(),before);
  await page.screenshot({path:`${out}/${world.id}-shop-${width}x${height}${reduced?'-reduced':''}.png`});
  if(await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none'))await click('.custom-view-switch button:first-child');
  if(world.price){await click('.equip-part');const bought=await saved();assert.equal(bought.equipment.equipped.world,'twilight');assert.equal(bought.wallet.coins,1500-world.price);await click('.equip-part');}
  const after=await saved();assert.equal(after.equipment.equipped.world,world.id);assert.equal(after.wallet.coins,1500-world.price);assert.deepEqual(after.equipment.presets,before.equipment.presets);assert.deepEqual(after.equipment.discovered,before.equipment.discovered);
  await click('.lab-exit');await click('#start-btn');await page.evaluate(()=>qaFrames(40));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(80));await page.keyboard.press('q');await page.evaluate(()=>qaFrames(4));
  const actual=await page.evaluate(async()=>{
   const {placePlayer,stopPlayer}=await import('/src/physics.js'),r=__riot,s=r.state;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
   Object.assign(s,{phase:'playing',opening:null,inputLock:false,invul:99999});s.wave.entry=0;
   const v=r.world.viewport,p={x:v.x+v.w*.5,y:v.y+v.h*.55};placePlayer(r.world,p);stopPlayer(r.world);r.world.grounded=false;
   r.combat.add({id:'world-fang',kind:'fang',x:p.x+v.w*.23,y:p.y-v.h*.18,pinned:true,delay:999999});r.combat.add({id:'world-prism',kind:'prism',x:p.x-v.w*.22,y:p.y-v.h*.25,pinned:true,delay:999999});
   s.stop=99999;return {world:s.equipment.world,hp:s.hp,arena:{...r.world.arena}};
  });assert.equal(actual.world,world.id);await page.evaluate(()=>qaFrames(8));
  const chip=await page.$eval('#story-chip',n=>{const r=n.getBoundingClientRect();return {visible:!n.hidden,w:r.width,h:r.height};});if(chip.visible)assert.ok(chip.h<40&&chip.w<width,JSON.stringify(chip));
  await page.screenshot({path:`${out}/${world.id}-live-${width}x${height}${reduced?'-reduced':''}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__splatrFrameErrors||[]),[]);results.push({world:world.id,width,height,touch,reduced,bounds,actual,errors});await page.close();
 }
 console.log('PASS 6 worlds x4 layouts/motion cases: native free panorama/buy/equip, pause/still behavior, read-only input, unchanged presets/discoveries, real run backdrop, no page/frame errors.');
}finally{writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();}
