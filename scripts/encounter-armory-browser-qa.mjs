import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/encounter-upgrade';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const reports=[];
try{
 for(const [width,height]of [[1280,720],[960,640],[550,720],[860,440]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:5000}));});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#customize-btn');
  assert.equal(await page.$eval('.shape-lab',e=>e.dataset.section),'builds');await page.screenshot({path:`${out}/builds-${width}.png`});
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped);await page.click('[data-build="wraith"]');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped),initial);await page.screenshot({path:`${out}/try-wraith-${width}.png`});
  await page.click('.build-home-equip');assert.equal(await page.$$eval('[data-missing-part]',e=>e.length),4);let spent=0;
  for(let i=0;i<4;i++){
   const id=await page.$eval('[data-missing-part]',e=>e.dataset.missingPart);spent+=await page.evaluate(async id=>{const{ITEMS}=await import('/src/equipment.js');return ITEMS.find(i=>i.id===id).price;},id);
   await page.click(`[data-missing-part="${id}"]`);assert.equal(await page.$eval('.shape-lab',e=>e.dataset.section),'parts');await page.click('.equip-part');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped),initial,'buy is not equip');await page.click('.destination-builds');
  }
  assert.match(await page.$eval('.build-home-equip',e=>e.textContent),/EQUIP BUILD/);await page.click('.build-home-equip');const eq=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped);assert.equal(eq.head,'neko');assert.equal(eq.core,'time');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),5000-spent);
  await page.click('[data-build-filter="owned"]');assert.equal(await page.$$eval('.build-home-card',e=>e.length),1);await page.screenshot({path:`${out}/owned-${width}.png`});
  const bounds=await page.$eval('.shape-lab',root=>{const box=root.getBoundingClientRect(),panel=root.querySelector('.armory-builds'),detail=root.querySelector('.build-home-detail').getBoundingClientRect();return{outerScroll:root.scrollHeight-root.clientHeight,panelScroll:panel.scrollHeight-panel.clientHeight,right:box.right,bottom:box.bottom,detailBottom:detail.bottom};});assert.ok(bounds.outerScroll<=1&&bounds.panelScroll<=1);assert.ok(bounds.right<=width&&bounds.bottom<=height&&bounds.detailBottom<=height);
  await page.click('.lab-exit');await page.click('#start-btn');await new Promise(r=>setTimeout(r,180));await page.screenshot({path:`${out}/entry-${width}.png`});assert.match(await page.$eval('.wave-announcement',e=>e.textContent),/OPENING CUT/);assert.deepEqual(errors,[]);reports.push({width,height,...bounds,errors});await page.close();
 }
 console.log('PASS four-size Builds-first / try-on / missing-part acquisition / buy != equip / owned filter / wallet / entry briefing');
}finally{writeFileSync(`${out}/browser-report.json`,JSON.stringify(reports,null,2));await browser.close();}
