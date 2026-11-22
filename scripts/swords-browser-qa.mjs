import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/swords';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const report=[];
try{
 for(const [width,height]of [[1280,720],[960,640],[550,720],[860,440]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.goto('http://localhost:3000');await page.evaluate(async()=>{const{ITEMS}=await import('/src/equipment.js');localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:1234}));localStorage.setItem('riot.equipment',JSON.stringify({owned:ITEMS.map(i=>i.id)}));});await page.reload();await page.evaluate(()=>document.fonts.ready);await page.click('#customize-btn');await page.click('.destination-parts');
  await page.screenshot({path:`${out}/shop-${width}.png`});
  if(width<700)await page.click('.custom-view-switch button:nth-child(2)');await page.click('.custom-recipes');assert.equal(await page.$$eval('.codex-card',e=>e.length),35);
  await page.click('[data-filter="zenith"]');assert.equal(await page.$$eval('.codex-card',e=>e.length),6);await page.screenshot({path:`${out}/zenith-${width}.png`});
  await page.click('[data-mutation="wraith"] .recipe-try');assert.equal(await page.$eval('.shape-lab',e=>e.dataset.sword),'echo');
  if(width<700)await page.click('.custom-view-switch button:first-child');await page.click('.equip-part');
  const equipped=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')).equipped);assert.equal(equipped.head,'neko');assert.equal(equipped.core,'time');
  await page.click('.destination-sword');await new Promise(r=>setTimeout(r,700));assert.equal(await page.$eval('.sword-desk',e=>e.dataset.family),'echo');
  await page.screenshot({path:`${out}/desk-${width}.png`});
  const bounds=await page.$eval('.sword-desk',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,scroll:e.scrollHeight-e.clientHeight}});assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width&&bounds.bottom<=height);
  await page.click('.sword-desk-close');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),1234);
  await page.click('.lab-exit');await page.click('#start-btn');await new Promise(r=>setTimeout(r,350));await page.screenshot({path:`${out}/live-wraith-${width}.png`});assert.deepEqual(errors,[]);report.push({width,height,...bounds,errors});await page.close();
 }
 // Pure rendering harness: all six silhouettes / three phases / four world contrasts.
 const page=await browser.newPage();await page.setViewport({width:1400,height:1080});await page.goto('http://localhost:3000');
 await page.evaluate(async()=>{const{drawSwordWeapon,drawCubeHero}=await import('/src/art/splatr-art-engine.js');const{SWORD_STYLES}=await import('/src/swords.js');document.body.replaceChildren();document.body.style.cssText='margin:0;background:#10121c';const c=document.createElement('canvas');c.width=1400;c.height=1080;document.body.append(c);const x=c.getContext('2d');let i=0;for(const s of Object.values(SWORD_STYLES).filter(s=>s.id!=='standard')){const row=Math.floor(i/2),col=i%2,left=col*700,top=row*360;x.fillStyle=col?'#eee8df':'#211e2f';x.fillRect(left+8,top+8,684,344);x.fillStyle=col?'#302c40':'#f1ebdc';x.font='bold 20px monospace';x.fillText(s.name,left+28,top+42);x.font='11px monospace';x.fillText(s.receipt,left+28,top+65);for(let phase=0;phase<3;phase++){const px=left+85+phase*220,py=top+200;drawCubeHero(x,{x:px,y:py,radius:26,motion:false,equipment:{}});drawSwordWeapon(x,{x:px,y:py,radius:26,sword:{...s,tier:['echo','pulse'].includes(s.family)?'zenith':'apex'},active:phase===2,aiming:phase===1,angle:-.6,charge:3,motion:false});x.fillStyle=col?'#302c40':'#a99eb9';x.font='10px monospace';x.fillText(['REST','AIM','CUT'][phase],px-20,top+307);}i++;}});
 await page.screenshot({path:`${out}/sword-silhouettes.png`});await page.close();console.log('PASS four-size Shop/build filters/try-on/equip/real sword desk/live build; six-family visual matrix');
}finally{writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));await browser.close();}
