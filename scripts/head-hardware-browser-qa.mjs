import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',out='docs/item-correlation';mkdirSync(out,{recursive:true});
const catalogueCases=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),rows=[],errors=[];
const step=p=>p.evaluate(()=>qaFrames(8));
async function click(p,sel){const detail=await p.$eval(sel,n=>!!n.closest('details.preview-tools:not([open])'));if(detail){await p.click('.preview-tools>summary');await step(p);}await p.$eval(sel,n=>n.scrollIntoView({block:'nearest'}));await p.click(sel);await step(p);}
async function snap(p,file){await p.evaluate(()=>{for(const a of document.getAnimations())try{a.finish();}catch{}});await p.screenshot({path:`${out}/${file}.jpg`,type:'jpeg',quality:85});}
async function open(width,height,reduced=false,coins=0){const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,hasTouch:width<900});await p.evaluateOnNewDocument(({coins,reduced})=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');if(coins)localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins,owned:[]}));let clock=performance.now(),id=0;const q=new Map();window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};},{coins,reduced});await p.goto(base,{waitUntil:'domcontentloaded'});await step(p);await click(p,'#customize-btn');await p.evaluate(()=>document.fonts.ready);return p;}
const save=p=>p.evaluate(()=>({equipment:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')}));
try{
 for(const [w,h,reduced]of [[1440,900,false],[390,844,false],[390,844,true]]){
  const p=await open(w,h,reduced),before=await save(p),tag=`${w}${reduced?'-reduced':''}`;
  await snap(p,`${tag}-shelf`);
  for(const id of ['halo','neko','viper','oni','crown','samurai','coil','beacon']){
   if(w<=700)await click(p,'.custom-view-switch button:first-child');
   await click(p,`[data-item="${id}"]`);await click(p,'.watch-part');
   for(let beat=0;beat<3;beat++){
    await click(p,`.visual-story-step[data-step="${beat}"]`);
    const canvas=await p.$eval('.custom-lab>canvas',n=>n.toDataURL());await p.evaluate(()=>qaFrames(50));assert.equal(await p.$eval('.custom-lab>canvas',n=>n.toDataURL()),canvas,'held head story');
    if(!reduced||beat===2)await snap(p,`${tag}-${id}-${['look','action','result'][beat]}`);
   }
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.deepEqual(await save(p),before);rows.push({w,h,reduced,heads:8,beats:24,saveRetained:true});await p.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: all 8 head systems, three beats, desktop/portrait/reduced motion; actual Home → Shop interactions, stable holds and no save changes.');
}finally{await browser.close();writeFileSync(`${out}/shop-results.json`,JSON.stringify({rows,errors,method:'Native Home → Shop; fixed RAF; CSS animation settled. All 8 upgraded heads, 3 held story beats, 3 layouts/motion settings. This is scripted visual review, not a recruited-player study.'},null,2));}
