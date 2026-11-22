import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/mutation-upgrade';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const reports=[];
try{
 for(const [width,height]of [[1280,720],[960,640],[550,720],[860,440]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');
  await page.evaluate(async()=>{const {ITEMS}=await import('/src/equipment.js');localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:1234}));localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(x=>x.id)}));});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#customize-btn');await page.click('.destination-parts');
  await page.click('[data-slot="head"]');await page.click('[data-item="viper"]');
  const stats=await page.$eval('.power-quick',e=>e.textContent);assert.match(stats,/SPEED \+20%/);assert.match(stats,/WIDTH −15%/);
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped);
  await page.screenshot({path:`${out}/power-${width}x${height}.png`});await page.click('.power-info');assert.equal(await page.$eval('.power-sheet',e=>e.open),true);assert.match(await page.$eval('.power-sheet',e=>e.textContent),/20% faster launch/);await page.click('.power-sheet button');
  if(width<700)await page.click('.custom-view-switch button:nth-child(2)');
  await page.click('.custom-recipes');assert.equal(await page.$$eval('.codex-card',els=>els.length),35);await page.click('[data-mutation="storm"] .recipe-try');
  assert.match(await page.$eval('.custom-hybrid',e=>e.textContent),/STORM CONDUCTOR/);assert.match(await page.$eval('.custom-lab-label b',e=>e.textContent),/TRY-ON/);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped),initial,'recipe try-on cannot silently equip');
  if(width<700)await page.click('.custom-view-switch button:first-child');
  assert.match(await page.$eval('.equip-part',e=>e.textContent),/EQUIP BUILD/);await page.click('.equip-part');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));for(const [slot,id]of Object.entries({head:'coil',body:'chamfer',core:'echo',slash:'laser'}))assert.equal(saved.equipped[slot],id);
  assert.ok(saved.discovered.includes('storm'));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),1234);
  if(width<700)await page.click('.custom-view-switch button:nth-child(2)');
  await new Promise(r=>setTimeout(r,160));await page.screenshot({path:`${out}/storm-equipped-${width}x${height}.png`});
  const r=await page.$eval('.shape-lab',e=>({scroll:e.scrollHeight-e.clientHeight,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y}));assert.ok(r.scroll<=1);assert.ok(r.x>=0&&r.y>=0);
  assert.deepEqual(errors,[]);reports.push({width,height,stats,...r,errors});await page.close();
 }
 // A recipe containing locked/unowned ingredients must not grant them.
 const page=await browser.newPage();await page.goto('http://localhost:3000');await page.evaluate(()=>localStorage.clear());await page.reload();await page.click('#customize-btn');await page.click('.destination-parts');await page.click('.custom-recipes');await page.click('[data-mutation="storm"] .recipe-try');assert.match(await page.$eval('.equip-part',e=>e.textContent),/PARTS NEEDED/);await page.click('.equip-part');assert.match(await page.$eval('.equip-part',e=>e.textContent),/BUY|NEED \d+ MORE/);assert.equal(await page.$eval('.equip-part',e=>e.disabled),true);assert.ok(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).owned)).includes('coil'));await page.close();
 console.log('PASS four-size power receipts / optional details / 35-recipe browser / try-on vs confirmed equip / no free unlocks or wallet changes');
}finally{writeFileSync(`${out}/power-report.json`,JSON.stringify(reports,null,2));await browser.close();}
