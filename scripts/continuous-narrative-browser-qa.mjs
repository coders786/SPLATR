import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.PREVIEW_BASE||'http://localhost:5174';mkdirSync('.arena/continuous-narrative',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const reduced of [false,true]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width,height,hasTouch:width===390,isMobile:width===390});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
 await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.storyQA={get run(){return run},get renderer(){return renderer},get input(){return input},stop(){cancelAnimationFrame(raf)}};'});}else await req.continue();});
 await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForSelector('#start-btn',{visible:true});await page.click('#start-btn');await page.waitForFunction(()=>document.querySelector('#game').dataset.learning==='true');
 // Full course is independently exercised in pure-tutorial-browser-qa.mjs.
 await page.click('#rack-skip');await page.waitForFunction(()=>storyQA.run?.state.narrative?.intro);await page.evaluate(()=>storyQA.stop());
 const initial=await page.evaluate(()=>{const r=storyQA.run,v=storyQA.renderer.questView(),p=r.world.player.position;return {x:(p.x-v.x)*v.scale,y:(p.y-v.y)*v.scale,phase:r.state.phase,done:localStorage.getItem('riot.tutorialCompleted'),dialogs:document.querySelectorAll('dialog[open]').length};});
 assert.equal(initial.phase,'ready');assert.equal(initial.done,'1');assert.equal(initial.dialogs,0);await page.screenshot({path:`.arena/continuous-narrative/intro-${width}-${reduced}.png`});
 // Native mouse/touch immediately pulls down and releases upward through the fracture.
 let touch;if(width===390){touch=await page.createCDPSession();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:initial.x,y:initial.y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:initial.x,y:Math.min(height-12,initial.y+90)}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else{await page.mouse.move(initial.x,initial.y);await page.mouse.down();await page.mouse.move(initial.x,Math.min(height-12,initial.y+90),{steps:4});await page.mouse.up();}
 const first=await page.evaluate(()=>{const r=storyQA.run;for(let i=0;i<15;i++)r.tick();return {shots:r.state.shots,intro:r.state.narrative.intro,phase:r.state.phase};});
 assert.ok(first.shots>=1,JSON.stringify(first));assert.equal(first.intro,false,JSON.stringify(first));assert.equal(first.phase,'playing');
 // Bot uses the actual aim and dash APIs and physics; no teleports, forced
 // breaks, invulnerability or direct state edits. Not a human usability study.
 await page.evaluate(()=>{window.storyCounter=0;window.storyStep=()=>{const r=storyQA.run,n=r.state.narrative,p=r.world.player.position;if(storyCounter++%30===0){const target=n.locks.filter(l=>!l.broken).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||{x:n.seal.x,y:n.seal.y-100};r.dash(r.aimAt(target,false));}r.tick();};});
 for(let sector=2;sector<=4;sector++){
  const result=await page.evaluate(sector=>{const r=storyQA.run;for(let i=0;i<4500&&r.state.narrative.sector<sector&&r.state.phase!=='over';i++)storyStep();storyQA.renderer.field(r.world.player.position);storyQA.renderer.tick(r,false);storyQA.renderer.draw(r,1,null,false);const n=r.state.narrative;return {sector:n.sector,phase:r.state.phase,wave:r.state.wave.phase,shatters:r.state.shatters,locks:n.locks.map(x=>x.broken),reaction:n.reaction?.kind,shots:r.state.shots,hp:r.state.hp,dialogs:document.querySelectorAll('dialog[open]').length,y:r.world.player.position.y};},sector);
  assert.equal(result.sector,sector,JSON.stringify(result));assert.equal(result.phase,'playing');assert.equal(result.wave,'combat');assert.equal(result.shatters,sector-1);assert.equal(result.dialogs,0);assert.equal(result.reaction,sector===2?'smug':sector===3?'alarm':'split');
  await page.screenshot({path:`.arena/continuous-narrative/sector-${sector}-${width}-${reduced}.png`});
 }
 assert.deepEqual(errors,[]);await page.close();
}console.log('PASS native first launch and unassisted simulation bot through sectors 01–04 on desktop, phone and landscape, normal/reduced motion. Tutorial completion is covered separately.');}finally{await browser.close();}
