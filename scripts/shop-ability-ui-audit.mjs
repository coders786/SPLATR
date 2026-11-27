// Full-shop comparison from four genuine pre-edit snapshots, never reconstructed.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';
const dir=process.env.QA_SNAPSHOT_DIR||'.arena/harmony-chunk15',out=process.env.QA_OUT_DIR||`${dir}/ui-audit`,base=process.env.PREVIEW_URL||'http://127.0.0.1:5187';mkdirSync(out,{recursive:true});
const files={'/src/customize.js':'customize-before.js','/src/art/splatr-art-engine.js':'art-before.js','/src/power-readout.js':'power-before.js'};for(const f of [...Object.values(files),'lab-before.css'])assert.ok(existsSync(`${dir}/${f}`),'Genuine pre-edit snapshot required');
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{
 for(const before of [true,false]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1280,height:720,deviceScaleFactor:1});
  if(before){await page.setRequestInterception(true);page.on('request',request=>{const path=new URL(request.url()).pathname;return files[path]?request.respond({status:200,contentType:'application/javascript',body:readFileSync(`${dir}/${files[path]}`,'utf8')}):request.continue();});}
  await page.evaluateOnNewDocument(defaults=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion','1');localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));let id=0,stamp=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){stamp+=1000/60;const work=[...queue.values()];queue.clear();work.forEach(fn=>fn(stamp));}};},DEFAULT_EQUIPMENT);
  await page.goto(`${base}/?shopItem=coil`,{waitUntil:'networkidle0'});await page.waitForSelector('.shape-lab[open]');if(before)await page.evaluate(css=>{const style=[...document.querySelectorAll('style[data-vite-dev-id]')].find(n=>n.dataset.viteDevId.endsWith('/src/lab.css'));if(!style)throw Error('Lab stylesheet missing');style.textContent=css;},readFileSync(`${dir}/lab-before.css`,'utf8'));
  await page.evaluate(()=>qaFrames(115));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${before?'before':'after'}.png`});assert.deepEqual(errors,[]);const state=await page.evaluate(()=>[localStorage.getItem('riot.equipment'),localStorage.getItem('riot.shop-wallet')]);results.push({before,state,errors});await page.close();
 }
 assert.deepEqual(results[0].state,results[1].state);const cv=createCanvas(2560,770),c=cv.getContext('2d');c.fillStyle='#0c1821';c.fillRect(0,0,2560,770);c.fillStyle='#e1ead1';c.font='bold 21px sans-serif';c.fillText('BEFORE / GENUINE PRE-CHUNK SHOP',24,32);c.fillText('NOW / APPEARANCE → ABILITY',1304,32);c.drawImage(await loadImage(`${out}/before.png`),0,50);c.drawImage(await loadImage(`${out}/after.png`),1280,50);writeFileSync(`${out}/shop-before-after.png`,cv.toBuffer('image/png'));writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS genuine before/after shop UI and copy capture; identical seed storage, no purchases or page errors.');
}finally{await browser.close();}
