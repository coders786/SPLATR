// Bounding-box + screenshot gate for the actual UI, including the single-file build.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const dir='.arena/comic-gate';mkdirSync(dir,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),reports=[];
try{
 for(const built of [false,true]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  if(built){const html=readFileSync('dist/index.html','utf8');await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/__comic_build__'?r.respond({status:200,contentType:'text/html',body:html}):r.continue());}
  await page.setViewport({width:1280,height:720});await page.goto('http://localhost:3000'+(built?'/__comic_build__':''));await page.evaluate(async()=>{const {ITEMS}=await import('/src/equipment.js');localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(x=>x.id),equipped:{head:'oni',eyes:'visor',body:'paper',core:'standard',tail:'ribbon',slash:'katana',world:'tokyo'}}));});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#customize-btn');await page.click('.destination-parts');await pause(150);
  for(const slot of ['head','eyes','body','core','tail','slash','world']){
   await page.click(`[data-slot="${slot}"]`);await pause(120);
   const box=await page.evaluate(()=>{
    const r=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom,right:b.right};},root=document.querySelector('.shape-lab'),grid=document.querySelector('.custom-grid'),right=document.querySelector('.custom-lab'),tabs=[...document.querySelectorAll('[data-slot]')].map(r),cards=[...grid.children].slice(0,6).map(r);
    return {tabs,grid:r(grid),cards,canvas:r(right.querySelector('canvas')),sidebar:r(right),sidebarScroll:right.scrollHeight-right.clientHeight,actions:[...document.querySelectorAll('.custom-actions button')].map(r),presets:[...document.querySelector('.custom-presets').children].map(r),recipes:r(document.querySelector('.custom-recipes')),footer:r(root.querySelector('footer')),name:r(document.querySelector('.inspection-name')),status:r(document.querySelector('.custom-status')),badge:r(document.querySelector('.inspection-tag')),footerText:root.querySelector('footer').innerText,outerScroll:root.scrollHeight-root.clientHeight,navInShop:!!root.querySelector('.custom-shop>nav'),columns:getComputedStyle(document.querySelector('.custom-presets')).flexDirection};
   });
   await page.screenshot({path:`${dir}/latest-layout.png`});
   assert.equal(box.tabs.length,7);assert.ok(box.navInShop);for(let i=0;i<7;i++){assert.ok(box.tabs[i].h>=32);assert.ok(box.tabs[i].bottom<=box.grid.y);if(i)assert.ok(box.tabs[i].x>=box.tabs[i-1].right-1);}
   assert.ok(box.canvas.w>=260&&box.canvas.h>=190,JSON.stringify(box.canvas));assert.ok(Math.abs(box.canvas.w/box.canvas.h-1.6)<.03);
   assert.ok(box.cards[0].y>=box.grid.y-1,'first row cropped');for(const card of box.cards)assert.ok(card.bottom<=box.grid.bottom+1,'two full rows do not fit');
   assert.ok(box.recipes.bottom<=box.sidebar.bottom&&box.recipes.bottom<=720);assert.ok(box.sidebarScroll<=1,'sidebar scroll/clipping '+JSON.stringify(box));assert.ok(box.outerScroll<=1);assert.equal(box.columns,'row');
   assert.ok(box.actions.every(x=>Math.abs(x.y-box.actions[0].y)<1));assert.ok(box.presets.every(x=>Math.abs(x.y-box.presets[0].y)<1));assert.ok(box.name.x>box.badge.right&&box.status.x>box.name.right);assert.ok(!box.footerText.includes('rounded down'));assert.ok(box.footerText.includes('•'));
   reports.push({built,slot,...box});await page.screenshot({path:`${dir}/${built?'build':'dev'}-${slot}.png`});
  }
  await page.click('[data-slot="head"]');await page.$eval('.custom-grid',n=>n.scrollTop=n.scrollHeight);await pause(150);await page.screenshot({path:`${dir}/${built?'build':'dev'}-head-lower.png`});await page.click('[data-item="coil"]');await pause(150);assert.ok(await page.$eval('[data-item="coil"]',n=>{const r=n.getBoundingClientRect(),g=n.parentElement.getBoundingClientRect();return r.y>=g.y-1&&r.bottom<=g.bottom+1;}),'selected lower-row card must remain visible');
  await page.click('[data-action="slice"]');await pause(890);await page.screenshot({path:`${dir}/${built?'build':'dev'}-mid-slash.png`});
  for(const [width,height] of [[1024,720],[550,720],[860,440]]){
   await page.setViewport({width,height});if(width<700)await page.click('.custom-view-switch button:nth-child(2)');await pause(120);
   const fit=await page.evaluate(()=>{const root=document.querySelector('.shape-lab'),lab=document.querySelector('.custom-lab'),c=lab.querySelector('canvas').getBoundingClientRect(),r=lab.getBoundingClientRect(),b=document.querySelector('.custom-recipes').getBoundingClientRect();return {w:c.width,h:c.height,canvasRatio:c.width/c.height,sidebarScroll:lab.scrollHeight-lab.clientHeight,outerScroll:root.scrollHeight-root.clientHeight,recipesBottom:b.bottom,sidebarBottom:r.bottom};});
   assert.ok(fit.w>=260&&fit.h>=170);assert.ok(fit.sidebarScroll<=1&&fit.outerScroll<=1,JSON.stringify({width,height,...fit}));assert.ok(fit.recipesBottom<=height&&fit.recipesBottom<=fit.sidebarBottom);await page.screenshot({path:`${dir}/${built?'build':'dev'}-${width}x${height}.png`});reports.push({built,width,height,...fit});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${built?'single-file production':'dev'}: seven tabs, canvas size/aspect, two full card rows, compact actions/presets, sidebar bounds, spaced footer`);
 }
 writeFileSync(`${dir}/report.json`,JSON.stringify(reports,null,2));
}finally{await browser.close();}
