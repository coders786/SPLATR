import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',out='docs/shop-exhibit';mkdirSync(out,{recursive:true});
const catalogueCases=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),rows=[],errors=[];
const step=p=>p.evaluate(()=>qaFrames(8));
async function click(p,sel){const detail=await p.$eval(sel,n=>!!n.closest('details.preview-tools:not([open])'));if(detail){await p.click('.preview-tools>summary');await step(p);}await p.$eval(sel,n=>n.scrollIntoView({block:'nearest'}));await p.click(sel);await step(p);}
async function snap(p,file){await p.evaluate(()=>{for(const a of document.getAnimations())try{a.finish();}catch{}});await p.screenshot({path:`${out}/${file}.jpg`,type:'jpeg',quality:85});}
async function open(width,height,reduced=false,coins=0){const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width,height,hasTouch:width<900});await p.evaluateOnNewDocument(({coins,reduced})=>{localStorage.clear();localStorage.setItem('riot.tutorialCompleted','1');localStorage.setItem('riot.postfx','off');localStorage.setItem('riot.motion',reduced?'0':'1');if(coins)localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins,owned:[]}));let clock=performance.now(),id=0;const q=new Map();window.requestAnimationFrame=fn=>(q.set(++id,fn),id);window.cancelAnimationFrame=id=>q.delete(id);window.qaFrames=n=>{for(let i=0;i<n;i++){clock+=1000/60;const work=[...q.values()];q.clear();work.forEach(fn=>fn(clock));}};},{coins,reduced});await p.goto(base,{waitUntil:'domcontentloaded'});await step(p);await click(p,'#customize-btn');await p.evaluate(()=>document.fonts.ready);return p;}
const save=p=>p.evaluate(()=>({equipment:localStorage.getItem('riot.equipment'),wallet:localStorage.getItem('riot.shop-wallet')}));
try{
 for(const [w,h,reduced]of [[1440,900,false],[960,540,false],[640,360,false],[390,844,false],[844,390,false],[320,568,false],[390,844,true]]){
  const p=await open(w,h,reduced),tag=`${w}x${h}${reduced?'-reduced':''}`,before=await save(p);
  const firstCardY=await p.$eval('.custom-card',n=>n.getBoundingClientRect().top);if(w===320||w===390)assert.ok(firstCardY<300,`first cards at ${firstCardY}`);
  await snap(p,`${tag}-entry`);assert.equal(await p.$eval('.preview-tools',n=>n.open),false);
  await click(p,'[data-item="coil"]');await snap(p,`${tag}-selected`);await click(p,'.watch-part');
  assert.match(await p.$eval('.preview-context',n=>n.textContent),/Head · Trying/);await snap(p,`${tag}-preview`);
  await click(p,'.visual-story-step[data-step="2"]');const frozen=await p.$eval('.custom-lab>canvas',n=>n.toDataURL());await p.evaluate(()=>qaFrames(90));assert.equal(await p.$eval('.custom-lab>canvas',n=>n.toDataURL()),frozen,'manual/reduced story holds');
  await p.focus('.preview-tools>summary');await p.keyboard.press('Enter');await step(p);assert.equal(await p.$eval('.preview-tools',n=>n.open),true);
  const bounds=await p.$$eval('.preview-tools-panel>button',ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,x:r.x,y:r.y,w:r.width,h:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n};}));for(const r of bounds){assert.ok(r.w>=44&&r.h>=44,JSON.stringify(r));assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=w+1&&r.y+r.h<=h+1,tag+JSON.stringify(r));assert.ok(r.hit,tag+': covered tool '+r.text);}
  await snap(p,`${tag}-tools`);await p.keyboard.press('Escape');await step(p);assert.equal(await p.$eval('.preview-tools',n=>n.open),false);assert.equal(await p.$eval('.shape-lab',n=>n.open),true);await click(p,'.visual-story-info');assert.equal(await p.$eval('.power-sheet',n=>n.open),true);await click(p,'.power-sheet button');
  await click(p,'.compare-part');assert.equal(await p.$eval('.preview-tools',n=>n.open),false);await snap(p,`${tag}-compare`);await click(p,'.compare-view[data-view=power]');assert.equal(await p.$eval('.shape-lab',n=>n.dataset.compareView),'power');
  if(w>=560&&h<=540){await click(p,'.shop-demo-play');await p.evaluate(()=>qaFrames(240));await click(p,'.shop-demo-play');}else await click(p,'.visual-story-step[data-step="2"]');
  await snap(p,`${tag}-compare-power`);const held=await p.$eval('.custom-lab>canvas',n=>n.toDataURL());await p.evaluate(()=>qaFrames(90));assert.equal(await p.$eval('.custom-lab>canvas',n=>n.toDataURL()),held,'comparison holds at the same story beat');
  for(const selector of ['.compare-view[data-view=look]','.compare-view[data-view=power]','.shop-demo-play']){const hit=await p.$eval(selector,n=>{const r=n.getBoundingClientRect();return r.height>=44&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n;});assert.ok(hit,tag+' comparison control '+selector);}
  await click(p,'.compare-part');
  await click(p,'.assembly-inspect');assert.equal(await p.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily),'standard');await click(p,'.assembly-next');assert.notEqual(await p.$eval('.custom-lab>canvas',n=>n.dataset.assemblyFamily),'standard');await snap(p,`${tag}-build`);
  await click(p,'.shop-preview-toggle');assert.equal(await p.$eval('.shape-lab',n=>n.dataset.tools),'on');assert.equal(await p.$eval('.preview-tools',n=>n.open),false,'tool action closes menu even when its icon is replaced');assert.equal(await p.$eval('.custom-lab>canvas',n=>n.getAttribute('role')),'application');await snap(p,`${tag}-practice`);await click(p,'.shop-preview-toggle');
  assert.deepEqual(await save(p),before,'all previews leave purchases/equipment unchanged');
  if(w<=700||h<=540)await click(p,'.custom-view-switch button:first-child');await click(p,'.shop-slots [data-slot="core"]');await p.select('.shop-filter','affordable');await step(p);assert.ok(await p.$('.shop-show-all'));await click(p,'.shop-show-all');assert.equal(await p.$eval('.shop-filter',n=>n.value),'all');assert.ok(await p.$('[data-item="time"]'));await snap(p,`${tag}-core-shelf`);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);rows.push({w,h,reduced,firstCardY,bounds,saveRetained:true});await p.close();
 }
 // Explicit buying remains separate from equipping on mobile and desktop.
 for(const [w,h]of [[1440,900],[390,844],[320,568]]){const p=await open(w,h,false,1500);await click(p,'[data-item="coil"]');await click(p,'.watch-part');
 const purchase=w>700?'.equip-part':'.preview-purchase';await click(p,purchase);let state=await p.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.ok(state.owned.includes('coil'));assert.notEqual(state.equipped.head,'coil');assert.match(await p.$eval('.preview-context',n=>n.textContent),/Owned/);await snap(p,`${w}-owned`);await click(p,purchase);state=await p.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.equal(state.equipped.head,'coil');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),1100);assert.match(await p.$eval('.preview-context',n=>n.textContent),/Equipped/);await snap(p,`${w}-equipped`);await p.close();}
 // Catalogue review: native shelves, not a generated contact sheet.
 for(const [w,h]of [[1440,900],[390,844]]){const p=await open(w,h),before=await save(p);
 for(const [group,slots]of [['cube',['head','eyes','body','core','tail']],['attack',['slash','dash']],['sensors',['pointer','radar','trajectory']],['world',['world']]]){
  await click(p,`.shop-groups [data-group="${group}"]`);
  for(const slot of slots){await click(p,`.shop-slots [data-slot="${slot}"]`);await snap(p,`${w}-shelf-${slot}`);
   assert.equal(await p.$$eval('.card-caption',ns=>ns.some(n=>n.textContent.includes('✓'))),false,'literal shelf states replace ticks');
  }
 }
 assert.deepEqual(await save(p),before);catalogueCases.push({w,h,slots:11,saveRetained:true});await p.close();}
 assert.deepEqual(errors,[]);console.log('PASS:7 layouts/motion cases; <300px first mobile card; all four tools and comparison controls hit-testable >=44px; 22 catalogue shelves; keyboard disclosure; story hold; compare/build/practice/details; no save mutation; empty filter recovery; three buy/equip flows; no page errors.');
}finally{await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify({rows,catalogueCases,errors,method:'Native Home → Shop browser interactions; fixed RAF for comparable screenshots. Seven layouts/motion cases plus three funded transaction flows and all eleven shelves at desktop/mobile. CSS animations settled before capture. Short landscape comparison uses Play/Pause in place of the three step buttons. Scripted checks, not human comprehension validation.'},null,2));}
