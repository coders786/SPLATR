import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.arena/speed-foundation',{recursive:true});const report=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [width,height]of [[1280,720],[960,640],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1')});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#start-btn');await new Promise(r=>setTimeout(r,300));
 assert.ok(await page.$eval('.speed-pace',e=>!e.hidden));assert.equal(await page.$eval('#speedo',e=>getComputedStyle(e).display),'none');
 await page.screenshot({path:`.arena/speed-foundation/ready-${width}.png`});
 await page.keyboard.press('Space');await new Promise(r=>setTimeout(r,1250));
 const box=await page.$eval('.wave-hud',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,scroll:e.scrollWidth-e.clientWidth,text:e.textContent}});assert.ok(box.x>=0&&box.y>=0&&box.right<=width&&box.bottom<=height&&box.scroll<=1,JSON.stringify(box));assert.match(box.text,/TARGET 1080/);
 await page.screenshot({path:`.arena/speed-foundation/live-${width}.png`});assert.deepEqual(errors,[]);report.push({width,height,...box});await page.close();
 }
 // Isolated production modules: actual simulated launch + pause/grace model + immediate retry state.
 const page=await browser.newPage();await page.goto('http://localhost:3000');const mechanics=await page.evaluate(async()=>{
 const{createRun}=await import('/src/run.js');const{stepSpeedPace}=await import('/src/speed-pace.js');
 const r=createRun(41,()=>{},{waveMode:true});r.state.invul=99999;r.state.wave.entry=0;r.dash({x:-42,y:0,power:1});for(let i=0;i<12;i++)r.tick();
 const result={left:r.world.player.position.x,pace:{...r.state.wave.pace}};const before=JSON.stringify(r.state.wave.pace); // no tick = paused / background.
 for(let i=0;i<100;i++)stepSpeedPace(r.state.wave.pace,{speed:99,active:false});result.frozen=before===JSON.stringify(r.state.wave.pace);r.dispose();
 const fresh=createRun(42,()=>{},{waveMode:true});result.retry={phase:fresh.state.phase,progress:fresh.state.wave.pace.progress,target:fresh.state.wave.pace.target};fresh.dispose();return result;
 });assert.ok(mechanics.pace.progress>0);assert.equal(mechanics.frozen,true);assert.equal(mechanics.retry.progress,0);await page.close();report.push(mechanics);
 console.log('PASS five-size real app speed HUD/bounds/no duplicate dial/Space start; production-module real launch, frozen inactive pace and fresh retry');
}finally{writeFileSync('.arena/speed-foundation/browser.json',JSON.stringify(report,null,2));await browser.close()}
