// Chromium verification of real adapter surfaces after standalone extraction.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/art-engine-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[],reports=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1280,height:720});await page.goto('http://localhost:3000');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');});await page.reload();
 await page.click('#manual-btn');await page.evaluate(()=>document.fonts.ready);
 for(let i=0;i<8;i++){
  const result=await page.evaluate(()=>{const canvas=document.querySelector('#specimen'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let painted=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])painted++;const r=canvas.getBoundingClientRect();return {name:document.querySelector('#foe-name').textContent,painted,x:r.x,y:r.y,w:r.width,h:r.height};});
  assert.ok(result.painted>400,result.name);assert.ok(result.x>=0&&result.y>=0&&result.x+result.w<=1280&&result.y+result.h<=720);reports.push(result);
  if(i===0||i===7)await page.screenshot({path:`${out}/manual-${i}.png`});
  await page.click('#next-foe');
 }
 await page.click('#manual-page .back');await page.click('#start-btn');
 await new Promise(r=>setTimeout(r,300));await page.screenshot({path:`${out}/game.png`});await page.keyboard.press('p');
 if(await page.$eval('#skip-room',n=>!n.hidden)){await page.click('#skip-room');await page.keyboard.press('p');}
 await page.click('#end-btn');await page.waitForSelector('#result-page:not([hidden])');
 const print=await page.evaluate(async()=>{
  const {drawStrokePrint}=await import('/src/print.js');
  const canvas=document.querySelector('#stroke-map');document.querySelector('#best-print').hidden=false;canvas.hidden=false;
  const stroke={origin:{x:0,y:0},angle:-.1,shot:4,kills:3,points:1500,equipment:{head:'samurai',eyes:'visor',body:'paper',core:'time',tail:'ribbon',slash:'katana',world:'manga'},marks:[{kind:'fang',x:85,y:-12,r:24,angle:0,cut:-.1,hpBefore:1},{kind:'prism',x:150,y:-20,r:27,angle:0,cut:-.1,hpBefore:1},{kind:'bastion',x:235,y:-29,r:38,angle:0,cut:-.1,hpBefore:1}]};
  document.querySelector('#print-points').textContent='1500 POINTS';document.querySelector('#print-type').textContent='3 CONTACTS / ADAPTER FIXTURE';document.querySelector('#print-shot').textContent='SHOT 04';document.querySelector('#cause').textContent='Rendering fixture — not an earned run.';
  drawStrokePrint(canvas,stroke);const r=canvas.getBoundingClientRect(),p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let painted=0;for(let i=3;i<p.length;i+=4)if(p[i])painted++;
  return {label:canvas.getAttribute('aria-label'),painted,x:r.x,y:r.y,w:r.width,h:r.height};
 });
 assert.match(print.label,/Stroke 4:.*1500 points/);assert.ok(print.painted>500);assert.ok(print.x>=0&&print.y>=0&&print.x+print.w<=1280&&print.y+print.h<=720);reports.push({surface:'best-stroke',fixture:true,...print});
 await page.screenshot({path:`${out}/best-stroke.png`});
 assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({reports,errors},null,2));
 console.log('PASS Chromium: eight FIELD MANUAL specimens, live game capture, real BEST STROKE adapter fixture, zero page errors');
}finally{await browser.close();}
