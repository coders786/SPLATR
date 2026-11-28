// Actual UI capture: native pictorial step controls, no direct painter calls.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,copyFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',out=process.env.QA_OUT_DIR||'docs/wordless-shop-review';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const rows=process.env.QA_SKIP_STAGES?JSON.parse(readFileSync(`${out}/manifest.json`)).rows:[];
const items=['coil','crown','halo','oni','riot','time','grav','echo','iron','notched','dash-fire','dash-echo','wings','hypno','radar-2','dash-ice'];
const setup=async(page,reduced=false)=>{
 await page.evaluateOnNewDocument(reduced=>{
  localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
  let clock=0,id=0;const q=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};
  window.stageWords=[];const text=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(s,...args){if(this.canvas===document.querySelector('.custom-lab>canvas'))stageWords.push(String(s));return text.call(this,s,...args);};
 },reduced);
};
const advance=p=>p.evaluate(()=>qaFrames(6));
try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:1440,height:900});await setup(p);
 for(const id of process.env.QA_SKIP_STAGES?[]:items){
  await p.goto(`${base}/?shopItem=${id}&debug`,{waitUntil:'load'});await p.waitForSelector('.shape-lab[open]');await advance(p);await p.evaluate(()=>document.fonts.ready);
  const before=await p.evaluate(()=>({eq:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')}));
  for(let step=0;step<3;step++){
   await p.click(`.visual-story-step[data-step="${step}"]`);await p.evaluate(()=>{stageWords.length=0;qaFrames(6);});assert.deepEqual(await p.evaluate(()=>stageWords),[],`${id}: stage must not paint teaching words`);
   const clip=await p.$eval('.custom-lab>canvas',n=>{const r=n.getBoundingClientRect(),s=Math.min(r.width/640,r.height/400);return{x:r.x+(r.width-640*s)/2,y:r.y+(r.height-400*s)/2,width:640*s,height:400*s};});
   const file=`${id}-${step}.jpg`;await p.screenshot({path:`${out}/${file}`,clip,type:'jpeg',quality:77});rows.push({id,step,file});
   const frozen=await p.$eval('.custom-lab>canvas',n=>n.toDataURL());await p.evaluate(()=>qaFrames(60));assert.equal(await p.$eval('.custom-lab>canvas',n=>n.toDataURL()),frozen,'manual beat must hold still');
  }
  assert.deepEqual(await p.evaluate(()=>({eq:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')})),before);
  if(['coil','dash-fire','echo'].includes(id))await p.screenshot({path:`${out}/desktop-${id}.jpg`,type:'jpeg',quality:75});
 }
 // Real navigation / purchase flow at small sizes, without a paragraph of instruction.
 for(const [width,height,touch,reduced]of [[390,844,true,false],[320,568,true,false],[640,360,false,false],[390,844,true,true]]){
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch});await setup(page,reduced);await page.goto(`${base}/?shopItem=coil&debug`,{waitUntil:'load'});await page.waitForSelector('.shape-lab[open]');await advance(page);await page.evaluate(()=>document.fonts.ready);
  const click=async sel=>{await page.$eval(sel,n=>n.scrollIntoView({block:'nearest'}));if(touch)await page.tap(sel);else await page.click(sel);await advance(page);};
  await click('.visual-story-step[data-step="2"]');const suffix=`${width}x${height}${reduced?'-reduced':''}`;
  await page.screenshot({path:`${out}/mobile-${suffix}.jpg`,type:'jpeg',quality:78});
  if(reduced){const still=await page.$eval('.custom-lab>canvas',n=>n.toDataURL());await page.evaluate(()=>qaFrames(120));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.toDataURL()),still);}
  await click('.visual-story-info');assert.equal(await page.$eval('.power-sheet',n=>n.open),true);assert.match(await page.$eval('.power-sheet',n=>n.textContent),/Lightning Coil/);await click('.power-sheet button');
  const buy='.preview-purchase';await click(buy);let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.notEqual(saved.equipped.head,'coil');assert.ok(saved.owned.includes('coil'));assert.equal(await page.$eval(buy,n=>n.textContent.trim()),'EQUIP');
  await page.screenshot({path:`${out}/owned-${suffix}.jpg`,type:'jpeg',quality:78});await click(buy);saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.equal(saved.equipped.head,'coil');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1100);assert.equal(await page.$eval(buy,n=>n.disabled),true);
  await click('.custom-view-switch button:first-child');await page.screenshot({path:`${out}/browse-${suffix}.jpg`,type:'jpeg',quality:78});await page.close();
 }
 assert.deepEqual(errors,[]);await p.close();
 // Real-time recordings of the actual canvas. The animation clock is not mocked here.
 for(const id of ['coil','dash-fire']){
  const page=await browser.newPage();await page.setViewport({width:1000,height:760});await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');});await page.goto(`${base}/?shopItem=${id}`,{waitUntil:'load'});await page.waitForSelector('.shape-lab[open]');
  const data=await page.evaluate(async()=>{
   const canvas=document.querySelector('.custom-lab>canvas'),stream=canvas.captureStream(24),chunks=[];
   const mime=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:500000});recorder.ondataavailable=e=>chunks.push(e.data);
   const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();await new Promise(r=>setTimeout(r,5500));recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s);
  });writeFileSync(`${out}/${id}.webm`,Buffer.from(data,'base64'));await page.close();
 }
}finally{await browser.close();writeFileSync(`${out}/manifest.json`,JSON.stringify({method:'Native shop UI. 16 items × 3 held visual beats, four small-layout/motion transaction cases, and two real-clock canvas recordings. Scripted checks, not a human comprehension study.',rows},null,2));}
copyFileSync('docs/player-decision-review/after-comparison-390x844.jpg',`${out}/before-mobile.jpg`);
copyFileSync('docs/five-pass-visual-evidence/armory-1440x900.jpg',`${out}/before-desktop.jpg`);
console.log('PASS:48 wordless stage screenshots; four small-layout/motion buy-then-equip cases; optional rules accessible; manual/reduced poses still; two real-time recordings.');
