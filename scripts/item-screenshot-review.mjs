// Genuine production-browser evidence: all catalogue items, three timed frames.
// This does not call drawing functions directly or replace the item renderer.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ITEMS,DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {shopGroup} from '../src/shop-catalog.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5188',out=process.env.QA_OUT_DIR||'.arena/item-visual-review/before';
mkdirSync(`${out}/screenshots`,{recursive:true});mkdirSync(`${out}/sheets`,{recursive:true});
const items=process.env.QA_ITEMS?ITEMS.filter(i=>process.env.QA_ITEMS.split(',').includes(i.id)):ITEMS;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000}),rows=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
 for(const item of items){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(defaults=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion','1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let clock=0,id=0;const queue=new Map();Object.defineProperty(performance,'now',{value:()=>clock});
   window.requestAnimationFrame=fn=>(queue.set(++id,fn),id);window.cancelAnimationFrame=id=>queue.delete(id);
   window.qaAdvance=ms=>{const end=clock+ms;while(clock<end){clock=Math.min(end,clock+1000/60);const work=[...queue.values()];queue.clear();for(const fn of work)fn(clock);}};
   window.qaWords=[];const fillText=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(v,...args){qaWords.push(String(v));return fillText.call(this,v,...args);};
  },DEFAULT_EQUIPMENT);
  await page.goto(process.env.QA_BROWSE?`${base}/`:`${base}/?shopItem=${item.id}`,{waitUntil:'domcontentloaded',timeout:60000});
  if(process.env.QA_BROWSE){
   await page.waitForSelector('#customize-btn');await page.click('#customize-btn');
   await page.click(`.shop-group[data-group="${shopGroup(item.slot).id}"]`);
   await page.click(`.shop-slots [data-slot="${item.slot}"]`);
   const card=await page.$(`[data-item="${item.id}"]`);await card.scrollIntoView();await card.click();await card.dispose();
   if(await page.$eval('.custom-view-switch',e=>getComputedStyle(e).display!=='none'))await page.click('.custom-view-switch button:last-child');
   await page.mouse.move(1,1);
  }
  await page.waitForSelector('.shape-lab[open]',{timeout:60000});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.$eval('.shop-demo-mode',e=>e.value),item.slot==='world'?'world':item.slot==='slash'?'slash':'story',`${item.id}: ordinary browsing must show the selected ability, not assembly`);
  const saved=await page.evaluate(()=>[localStorage.getItem('riot.equipment'),localStorage.getItem('riot.shop-wallet')]);
  const mode=await page.$eval('.shop-demo-mode',e=>e.value),stages=[];let now=0;
  for(const at of [600,1800,4100]){
   await page.evaluate(ms=>{qaWords.length=0;qaAdvance(ms);},at-now);now=at;
   const words=await page.evaluate(()=>[...new Set(qaWords)]),canvas=await page.$('.custom-lab>canvas'),file=`screenshots/${item.id}-${at}ms.png`,png=await canvas.screenshot({path:`${out}/${file}`});
   const intrinsic=await page.$eval('.custom-lab>canvas',e=>({width:e.width,height:e.height,rect:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},motion:document.querySelector('.shape-lab').dataset.motion,state:document.querySelector('.shop-demo-state')?.textContent,role:e.getAttribute('role')}));
   stages.push({at,file,sha256:hash(png),words,intrinsic});
   if(at===1800)await page.screenshot({path:`${out}/screenshots/${item.id}-full.png`});
  }
  const images=await Promise.all(stages.map(s=>loadImage(`${out}/${s.file}`))),cv=createCanvas(images[0].width,images[0].height),c=cv.getContext('2d'),pixels=[];
  for(const im of images){c.clearRect(0,0,cv.width,cv.height);c.drawImage(im,0,0);pixels.push(c.getImageData(0,0,cv.width,cv.height).data);}
  const delta=(a,b)=>{let changed=0,subjectChanged=0,subjectTotal=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const p=(y*cv.width+x)*4,d=Math.abs(a[p]-b[p])+Math.abs(a[p+1]-b[p+1])+Math.abs(a[p+2]-b[p+2]),subject=y>cv.height*.28&&y<cv.height*.83;if(d>18){changed++;if(subject)subjectChanged++;}if(subject)subjectTotal++;}return {changedPixels:changed,percent:100*changed/(cv.width*cv.height),subjectPercent:100*subjectChanged/subjectTotal};};
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('riot.equipment'),localStorage.getItem('riot.shop-wallet')]),saved,'capturing cannot buy/equip');assert.deepEqual(errors,[],item.id);
  rows.push({id:item.id,name:item.name,slot:item.slot,mode,stages,deltas:[delta(pixels[0],pixels[1]),delta(pixels[1],pixels[2])],errors});
  writeFileSync(`${out}/results.json`,JSON.stringify({base,viewport:{width:1440,height:1000},count:rows.length,stageScreenshots:rows.length*3,fullScreenshots:rows.length,method:'Actual browser element screenshots at controlled 600/1800/4100ms. No direct renderer calls. Pixel changes are evidence of change, NOT an automatic animation quality verdict.',items:rows},null,2));
  console.log(`${rows.length}/${items.length} ${item.id} [${mode}] ${rows.at(-1).deltas.map(d=>d.subjectPercent.toFixed(1)+'%').join(' / ')} subject changed`);await page.close();
 }
 // Contact sheets are composites of the saved screenshots, not redrawn assets.
 for(let start=0;start<rows.length;start+=5){
  const batch=rows.slice(start,start+5),cv=createCanvas(1260,64+batch.length*300),c=cv.getContext('2d');c.fillStyle='#101c26';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#edf3da';c.font='bold 20px sans-serif';c.fillText(`ACTUAL BROWSER CAPTURES / ITEMS ${start+1}–${start+batch.length}`,18,28);c.font='13px sans-serif';c.fillText('600 ms                                             1800 ms                                            4100 ms',18,51);
  for(const [i,row]of batch.entries()){
   const y=64+i*300;c.fillStyle='#e4ecd1';c.font='bold 16px sans-serif';c.fillText(`${row.name}  /  ${row.id}  /  ${row.mode}`,18,y+22);
   for(const [j,stage]of row.stages.entries()){const im=await loadImage(`${out}/${stage.file}`);c.drawImage(im,18+j*414,y+36,400,250);}
  }
  writeFileSync(`${out}/sheets/${String(Math.floor(start/5)+1).padStart(2,'0')}.png`,cv.toBuffer('image/png'));
 }
 console.log(`CAPTURED ${rows.length*3} actual stage screenshots + ${rows.length} full browser screenshots; ${Math.ceil(rows.length/5)} review sheets.`);
}finally{await browser.close();}
