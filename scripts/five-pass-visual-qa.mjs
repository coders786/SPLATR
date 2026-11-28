// Native-browser visual evidence and read-only preview regression checks.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192';
const out=process.env.QA_OUT_DIR||'docs/five-pass-visual-evidence';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[];
try{
 for(const [width,height,touch,reduced] of [[1440,900,false,false],[390,844,true,false],[640,360,false,false],[390,844,true,true]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,hasTouch:touch});
  if(reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluateOnNewDocument(reduced=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');let id=0,clock=0;const q=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};},reduced);
  await page.goto(base+'/?shopItem=coil&debug',{waitUntil:'load'});await page.waitForSelector('.shape-lab[open]');await page.evaluate(()=>{qaFrames(6);return document.fonts.ready;});
  const advance=()=>page.evaluate(()=>qaFrames(6));
  const click=async s=>{await page.$eval(s,n=>n.scrollIntoView({block:'nearest'}));if(touch)await page.tap(s);else await page.click(s);await advance();};
  const snapshot=()=>page.evaluate(()=>({equipment:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')}));const before=await snapshot();
  const shot=async name=>{const file=`${name}-${width}x${height}${reduced?'-reduced':''}.jpg`;await page.screenshot({path:`${out}/${file}`,type:'jpeg',quality:85});rows.push({name,file,width,height,touch,reduced});};
  const panes=await page.$eval('.custom-view-switch',n=>getComputedStyle(n).display!=='none');
  if(panes)await click('.custom-view-switch button:first-child');
  await shot('armory');
  await click('.watch-part');assert.equal(await page.$eval('.shape-lab',n=>n.dataset.pane),'preview');assert.equal(await page.$eval('.shop-demo-mode',n=>n.value),'story');
  await shot('coil-ability');
  await click('.compare-part');assert.equal(await page.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'img');
  const comparison=await page.$eval('.custom-lab>canvas',n=>n.toDataURL());
  await page.evaluate(()=>qaFrames(90));assert.equal(await page.$eval('.custom-lab>canvas',n=>n.toDataURL()),comparison,'comparison must remain still');
  await shot('compare');assert.deepEqual(await snapshot(),before,'preview and compare must not buy, equip or spend');
  if(width===1440){
   await page.hover('[data-item="neko"]');await advance();assert.equal(await page.$eval('.custom-lab>canvas',n=>n.toDataURL()),comparison,'hover must not replace selected comparison');
   for(const id of ['twilight','tokyo','foundry','manga','synth','void']){
    await page.goto(base+`/?shopItem=${id}&debug`,{waitUntil:'load'});await page.waitForSelector('.shape-lab[open]');await advance();await page.evaluate(()=>document.fonts.ready);await shot(`world-${id}`);
   }
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close();writeFileSync(`${out}/manifest.json`,JSON.stringify({method:'Native Chromium shop interactions; controlled animation clock for comparable images. Real training handoff captured separately. No human or physical-device usability claim.',frames:rows},null,2));}
for(const name of ['shop','world','mobile'])if(existsSync(`.arena/five-pass-before/${name}.jpg`))copyFileSync(`.arena/five-pass-before/${name}.jpg`,`${out}/before-${name}.jpg`);
console.log(`PASS: ${rows.length} browser images, four layouts/motion cases; compare is still, hover-stable and read-only; action previews do not mutate saved equipment or wallet.`);
