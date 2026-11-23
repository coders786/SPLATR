import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out='.arena/training-attacks';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 let count=0;
 for(const [width,height] of [[390,680],[1280,720]])for(const reduced of [false,true]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width,height,hasTouch:width<600,isMobile:width<600});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
  await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1')});await page.reload();await page.click('#manual-btn');await page.click('.manual-drill[data-lesson=fang]');await page.waitForSelector('.teaching-guide[open]');
  for(const [id,warning,attack] of [['fang','WATCH THE WARNING','WATCH THE CHARGE'],['pulse','WATCH THE WIND-UP','WATCH THE RING'],['prism','WATCH THE SIGHTLINE','WATCH THE SHOT'],['link','WATCH THE LINK','WATCH THE BEAM'],['fork','WATCH THE CROSS','WATCH THE SWIPE'],['bastion','WATCH THE WEDGE','WATCH THE SLAM'],['rift','WATCH THE MARKER','WATCH THE LANDING'],['well','WATCH THE COMPRESSION','WATCH THE STRIKE'],['crown','WATCH THE SPOKES','WATCH THE VOLLEY']]){
   await page.click('.teaching-menu summary');await page.select('.teaching-guide select',id);await page.waitForSelector('.teaching-step-next:not([hidden])',{timeout:10000});
   assert.match(await page.$eval('.teaching-step-label',e=>e.textContent),new RegExp(warning));
   await page.screenshot({path:`${out}/${id}-tell-${width}-${reduced}.png`});
   await page.click('.teaching-step-next');await page.waitForFunction(()=>document.querySelector('.teaching-guide').dataset.step==='2'&&!document.querySelector('.teaching-step-next').hidden,{timeout:10000});
   assert.match(await page.$eval('.teaching-step-label',e=>e.textContent),new RegExp(attack));
   const b=await page.$eval('.teaching-stage canvas',e=>e.getBoundingClientRect().toJSON());assert.ok(b.width>100&&b.height>100);
   await page.screenshot({path:`${out}/${id}-attack-${width}-${reduced}.png`});count++;
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(`PASS ${count} real tell-to-attack training checkpoints: phone/desktop, motion and reduced motion.`);
}finally{await browser.close();}
