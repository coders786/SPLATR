// Deterministic browser correctness checks, NOT a frame-rate benchmark.
// Use PREVIEW_URL=http://127.0.0.1:5174 (Vite dev, for the exported GL harness).
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5174',out='.arena/shop-nested';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:JSON.parse(process.env.CHROME_ARGS||'["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]')});
const results=[];
try{
 for(const [width,height]of [[960,540],[640,360],[390,844],[844,390]]){
  const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,deviceScaleFactor:1});
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('riot.postfx','on');localStorage.setItem('riot.tutorialCompleted','1');let stamp=performance.now(),id=0;const q=new Map();window.requestAnimationFrame=f=>(q.set(++id,f),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaPending=()=>q.size;window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const fs=[...q.values()];q.clear();fs.forEach(f=>f(stamp));}};});
  await p.goto(base,{waitUntil:'networkidle0'});await p.click('#customize-btn');await p.evaluate(()=>qaFrames(4));
  const slots=()=>p.$$eval('.shop-slots button:not([hidden])',ns=>ns.map(n=>n.dataset.slot));assert.deepEqual(await slots(),['head','eyes','body','core','tail']);
  await p.click('[data-item="neko"]');await p.mouse.move(1,1);await p.evaluate(()=>qaFrames(4));await p.screenshot({path:`${out}/shop-${width}x${height}.png`,captureBeyondViewport:false});console.log('shop captured',width,height);
  if(width<700){await p.click('.custom-view-switch button:last-child');await p.evaluate(()=>qaFrames(4));await p.screenshot({path:`${out}/preview-${width}x${height}.png`});await p.click('.custom-view-switch button:first-child');}
  for(const [group,expected]of [['attack',['slash','dash']],['sensors',['pointer','radar','trajectory']],['world',['world']],['cube',['head','eyes','body','core','tail']]]){
   console.log(width,height,group);await p.click(`[data-group="${group}"].shop-group`);assert.deepEqual(await slots(),expected);
   for(const slot of expected){await p.click(`.shop-slots [data-slot="${slot}"]`);await p.evaluate(()=>qaFrames(3));assert.ok(await p.$('.custom-grid canvas'));}
  }
  await p.click('.shop-slots [data-slot="head"]');await p.select('.shop-filter','challenge');assert.equal(await p.$$eval('[data-item]',ns=>ns.length),1);assert.ok(await p.$('[data-item="oni"]'));
  await p.select('.shop-filter','owned');assert.ok(await p.$$eval('[data-item]',ns=>ns.length)>0);
  console.log('launch',width,height);await p.click('.lab-exit');await p.click('#start-btn');await p.evaluate(()=>qaFrames(40));await p.keyboard.press('q');await p.mouse.click(width*.6,height*.5);await p.evaluate(()=>qaFrames(20));
  const gl=await p.evaluate(()=>{const source=document.querySelector('#arena'),output=source.parentNode.querySelector('.uber-postfx');return {source:{w:source.width,h:source.height,opacity:source.style.opacity},output:output&&{w:output.width,h:output.height,display:output.style.display}};});
  assert.ok(gl.source.w*gl.source.h<=921600);assert.equal(gl.output?.display,'block',JSON.stringify(gl));assert.equal(gl.source.opacity,'0');
  await p.screenshot({path:`${out}/game-${width}x${height}.png`});
  const lifecycle=await p.evaluate(async()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));const hiddenPending=qaPending();
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));const visiblePending=qaPending();delete document.hidden;
   dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));const kept=!!document.querySelector('.customize');dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));await Promise.resolve();return {hiddenPending,visiblePending,kept,clean:!document.querySelector('.customize,.uber-postfx,.wave-hud'),disposedPending:qaPending()};
  });assert.equal(lifecycle.hiddenPending,0);assert.equal(lifecycle.visiblePending,1);assert.equal(lifecycle.kept,true);assert.equal(lifecycle.clean,true);assert.equal(lifecycle.disposedPending,0);
  assert.deepEqual(errors,[]);results.push({width,height,gl,lifecycle,errors});await p.close();
 }
 const p=await browser.newPage();await p.goto(base,{waitUntil:'networkidle0'});
 const shader=await p.evaluate(async()=>{
  const {UberPostFX}=await import('/src/uber-postfx.js');
  const source=document.createElement('canvas');source.width=source.height=32;document.body.append(source);const c=source.getContext('2d');c.fillStyle='red';c.fillRect(0,0,32,16);c.fillStyle='blue';c.fillRect(0,16,32,16);
  const states=[],fx=new UberPostFX(source,{surface:()=>document.createElement('canvas'),onContextState:s=>states.push(s)});fx.setMode('on');const success=fx.present();const gl=fx.gl,pixels=new Uint8Array(4);
  const read=(x,y)=>{gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return [...pixels];};const top=read(16,28),bottom=read(16,4),glError=gl.getError();
  const modes=[];fx.triggerImpactFrame();for(let i=0;i<4;i++){fx.tick();fx.present();modes.push(fx.envelope.read().impact);}
  const ext=gl.getExtension('WEBGL_lose_context');if(ext){ext.loseContext();await new Promise(r=>setTimeout(r,80));ext.restoreContext();await new Promise(r=>setTimeout(r,200));fx.present();}
  const restored=!fx.lost&&!fx.failed,output=fx.output;fx.dispose();const clean=!output.isConnected&&source.style.opacity==='';source.remove();return {success,top,bottom,glError,modes,states,restored,clean};
 });assert.equal(shader.success,true);assert.equal(shader.glError,0);assert.ok(shader.top[0]>shader.top[2]);assert.ok(shader.bottom[2]>shader.bottom[0]);assert.deepEqual(shader.modes,[2,2,1,1]);assert.equal(shader.restored,true);assert.equal(shader.clean,true);
 results.push({shader});writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
