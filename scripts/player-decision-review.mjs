// Player-task regression: understand a comparison, buy once, then explicitly equip.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {DEFAULT_EQUIPMENT} from '../src/equipment.js';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',phase=process.env.QA_PHASE||'after';
const out=process.env.QA_OUT_DIR||'docs/player-decision-review';mkdirSync(out,{recursive:true});
const b=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
try{
 for(const [width,height,touch,reduced] of [[390,844,true,false],[320,568,true,false],[640,360,false,false],[1440,900,false,false],[390,844,true,true]]){
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,hasTouch:touch});
  await p.evaluateOnNewDocument(({defaults,reduced})=>{
   localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');
   localStorage.setItem('riot.equipment',JSON.stringify({version:1,owned:[],equipped:defaults,discovered:[],presets:[defaults,null,null]}));localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));
   let id=0,clock=0;const q=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};
  },{defaults:DEFAULT_EQUIPMENT,reduced});
  await p.goto(base+'/?shopItem=coil&debug',{waitUntil:'load'});await p.waitForSelector('.shape-lab[open]');await p.evaluate(()=>{qaFrames(4);return document.fonts.ready;});
  const advance=()=>p.evaluate(()=>qaFrames(6));
  const click=async s=>{await p.$eval(s,n=>n.scrollIntoView({block:'nearest'}));if(touch)await p.tap(s);else await p.click(s);await advance();};
  const snapshot=()=>p.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));
  const shot=async name=>{const file=`${phase}-${name}-${width}x${height}${reduced?'-reduced':''}.jpg`;await p.screenshot({path:`${out}/${file}`,type:'jpeg',quality:83});return file;};
  const before=await snapshot();await click('.compare-part');const file=await shot('comparison');assert.deepEqual(await snapshot(),before);
  if(phase==='before'){results.push({width,height,touch,reduced,file,errors});await p.close();continue;}
  assert.match(await p.$eval('.compare-summary',n=>n.textContent),/Bare Head/);assert.match(await p.$eval('.compare-summary',n=>n.textContent),/Lightning Coil/);
  const summary=await p.$eval('.compare-summary',n=>n.textContent);await p.evaluate(()=>qaFrames(90));assert.equal(await p.$eval('.compare-summary',n=>n.textContent),summary);assert.deepEqual(await snapshot(),before);
  const dock=width<=700||height<=540,action=dock?'.preview-purchase':'.equip-part';
  if(dock){const r=await p.$eval(action,n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:innerHeight,width:innerWidth};});assert.ok(r.top>=0&&r.bottom<=r.height&&r.left>=0&&r.right<=r.width,JSON.stringify(r));}
  await click(action);const bought=await snapshot();assert.equal(bought.wallet.coins,1100);assert.equal(bought.equipment.equipped.head,DEFAULT_EQUIPMENT.head);assert.ok(bought.equipment.owned.includes('coil'));assert.equal(await p.$eval('.shop-demo-mode',n=>n.value),'compare');
  if(dock){assert.match(await p.$eval('.preview-decision',n=>n.textContent),/OWNED · NOT EQUIPPED/);assert.equal(await p.$eval(action,n=>n===document.activeElement),true);}
  const boughtFile=await shot('bought');await click(action);const equipped=await snapshot();assert.equal(equipped.wallet.coins,1100);assert.equal(equipped.equipment.equipped.head,'coil');assert.deepEqual(equipped.equipment.presets,before.equipment.presets);assert.equal(await p.$eval(action,n=>n.disabled),true);
  const equippedFile=await shot('equipped');
  const finalSaved=await snapshot();await click('.compare-part');assert.equal(await p.$eval('.shop-demo-mode',n=>n.value),'story');assert.deepEqual(await snapshot(),finalSaved);
  // A new zero-credit profile explains the shortfall and cannot mutate ownership.
  await p.evaluateOnNewDocument(()=>localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:0,owned:[]})));
  await p.goto(base+'/?shopItem=halo&debug',{waitUntil:'load'});await p.waitForSelector('.shape-lab[open]');await advance();await click('.compare-part');
  assert.equal(await p.$eval('.preview-purchase',n=>n.disabled),true);assert.match(await p.$eval('.preview-decision',n=>n.textContent),/Earn credits by playing runs/);const emptyBefore=await snapshot();await p.$eval('.preview-purchase',n=>n.click());await advance();assert.deepEqual(await snapshot(),emptyBefore);
  const emptyFile=await shot('shortfall');assert.deepEqual(errors,[]);results.push({width,height,touch,reduced,file,boughtFile,equippedFile,emptyFile,errors,readOnly:true,buyDidNotEquip:true,equipDidNotChargeAgain:true});await p.close();
 }
}finally{await b.close();writeFileSync(`${out}/${phase}-results.json`,JSON.stringify({method:'Scripted player tasks in Chromium with controlled animation time. Touch emulation where marked, not a human/physical-phone study.',results},null,2));}
console.log(`${phase.toUpperCase()}: ${results.length} layout/motion cases captured and checked.`);
