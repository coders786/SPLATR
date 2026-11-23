import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.PREVIEW_BASE||'http://localhost:5175';mkdirSync('.arena/tutorial-guidance',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const reduced of [false,true]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width,height,hasTouch:width===390,isMobile:width===390});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
 await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.guideQA={get run(){return run},get course(){return tutorial},get input(){return input},get renderer(){return renderer},get device(){return lastDevice},stop(){cancelAnimationFrame(raf)}};'});}else await req.continue();});
 await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForSelector('#start-btn',{visible:true});
 if(width===390)await page.tap('#start-btn');else await page.click('#start-btn');await page.waitForFunction(()=>guideQA.course);await page.waitForFunction(()=>document.querySelector('#announcement').textContent.includes('A SHAPE'));await page.evaluate(()=>guideQA.stop());
 const first=await page.evaluate(()=>{const r=guideQA.run,c=guideQA.course,v=guideQA.renderer.questView(),p=r.world.player.position;return {device:guideQA.device,phase:r.state.phase,guide:c.visual.guide.kind,visible:c.visual.guideVisible,clock:c.visual.guideClock,world:r.world.clock,x:(p.x-v.x)*v.scale,y:(p.y-v.y)*v.scale,dialogs:document.querySelectorAll('dialog[open]').length};});
 assert.equal(first.guide,'slice');assert.equal(first.visible,true);assert.equal(first.phase,'ready');assert.equal(first.dialogs,0);if(width===390)assert.equal(first.device,'touch');
 for(const ticks of [0,30,65,110]){
  const result=await page.evaluate(({ticks,reduced})=>{const r=guideQA.run,c=guideQA.course;for(let i=0;i<ticks;i++){r.tick();c.tick(guideQA.input.engaged);}guideQA.renderer.draw(r,1,null,!reduced,guideQA.device);return {clock:c.visual.guideClock,world:r.world.clock,guide:c.visual.guide.kind};},{ticks,reduced});
  assert.equal(result.world,0);assert.equal(result.guide,'slice');await page.screenshot({path:`.arena/tutorial-guidance/opening-${width}-${reduced}-${ticks}.png`});
 }
 const x=Math.max(40,Math.min(width-40,first.x)),y=Math.max(60,Math.min(height-80,first.y));let touch;
 if(width===390){touch=await page.createCDPSession();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-55,y:y+30}]});}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-55,y+30,{steps:4});}
 const held=await page.evaluate(()=>{const r=guideQA.run,c=guideQA.course;for(let i=0;i<125;i++){r.tick();c.tick(guideQA.input.engaged);}return {engaged:guideQA.input.engaged,visible:c.visual.guideVisible};});assert.deepEqual(held,{engaged:true,visible:false});
 if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(x,y,{steps:4});await page.mouse.up();}
 const returned=await page.evaluate(()=>{const r=guideQA.run,c=guideQA.course;for(let i=0;i<110;i++){r.tick();c.tick(guideQA.input.engaged);}guideQA.renderer.draw(r,1,null,false,guideQA.device);return {engaged:guideQA.input.engaged,visible:c.visual.guideVisible,shots:r.state.shots};});
 assert.deepEqual(returned,{engaged:false,visible:true,shots:0},JSON.stringify(returned));assert.deepEqual(errors,[]);await page.close();
}console.log('PASS animated ready-state hints, native mouse/touch hold and cancel, idle recovery, and reduced-motion across desktop, phone and landscape.');}finally{await browser.close();}
