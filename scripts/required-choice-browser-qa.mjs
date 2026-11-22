import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out='.arena/waves-chunk1';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[550,720],[860,440]]){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>localStorage.clear());await page.reload();await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});
 // Exercise real run + physical landing + production UI together, without cheats in app code.
 await page.evaluate(async()=>{
  const {createRun}=await import('/src/run.js');const {createWaveUI}=await import('/src/wave-ui.js');const {placePlayer,stopPlayer}=await import('/src/physics.js');
  const r=createRun(131,()=>{},{waveMode:true});r.state.phase='playing';r.state.invul=9999;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<25;i++)r.tick();window.qaWave=r;
  const ui=createWaveUI({getRun:()=>r,resetInput:()=>{}});window.qaUI=ui;ui.update();
 });assert.equal(await page.$eval('.wave-upgrades[open]',e=>e.querySelectorAll('button').length),3);
 for(let i=0;i<5;i++)await page.keyboard.press('Escape');assert.equal(await page.$eval('.wave-upgrades[open]',e=>e.open),true);assert.equal(await page.evaluate(()=>qaWave.state.wave.phase),'choose');
 await page.mouse.click(2,2);assert.equal(await page.$eval('.wave-upgrades[open]',e=>e.open),true);
 await page.evaluate(()=>document.querySelector('.wave-upgrades[open]').close());await page.waitForFunction(()=>document.querySelector('.wave-upgrades[open]'));assert.equal(await page.evaluate(()=>qaWave.state.wave.phase),'choose');
 const bounds=await page.$eval('.wave-upgrades[open]',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}});assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width&&bounds.bottom<=height);
 await page.screenshot({path:`${out}/buffs-${width}.png`});await page.click('.wave-upgrades[open] button');assert.equal(await page.evaluate(()=>window.qaWave.state.wave.number),2);assert.equal(await page.evaluate(()=>window.qaWave.combat.enemies.size),15);assert.equal(await page.evaluate(()=>window.qaWave.state.shots),0);assert.deepEqual(errors,[]);await page.close();
}console.log('PASS three sizes: repeated real Escape, outside click, unexpected close recovery, valid selection advances');}finally{await browser.close();}
