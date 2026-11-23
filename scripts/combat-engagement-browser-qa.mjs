// Real run, UI and renderer; stationarity after the first launch is a controlled fixture,
// not a claim about how people play or react. No combat timers are modified.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/engagement',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const motion of [true,false]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width,height});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:motion?'no-preference':'reduce'}]);
  await page.setRequestInterception(true);page.on('request',async request=>{if(new URL(request.url()).pathname==='/src/main.js'){const res=await fetch(request.url());await request.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.engagementQA={get run(){return run},get renderer(){return renderer},start,updateHUD,stop(){cancelAnimationFrame(raf)}};'});}else await request.continue();});
  await page.goto('http://localhost:3000/?dev=1');await page.waitForFunction(()=>!document.querySelector('#title-screen').hidden);
  await page.evaluate(()=>{engagementQA.start();engagementQA.stop();engagementQA.updateHUD();});
  assert.match(await page.$eval('#combat-status',e=>e.textContent),/ENEMIES WAITING.*Launch/);
  await page.evaluate(async()=>{const {stopPlayer}=await import('/src/physics.js');const r=engagementQA.run;if(!r.dash({x:0,y:-12,power:12/42}))throw Error('launch failed');stopPlayer(r.world);});
  const tell=await page.evaluate(async motion=>{
   const r=engagementQA.run;let e;for(let i=0;i<100&&!e;i++){r.tick();e=[...r.combat.enemies.values()].find(x=>x.mode==='tell');}
   engagementQA.renderer.field(r.world.player.position);engagementQA.renderer.draw(r,1,null,motion);engagementQA.updateHUD();await new Promise(requestAnimationFrame);
   const {enemyIntentBadges}=await import('/src/art/splatr-art-engine.js');return {tick:r.state.elapsed,kind:e?.kind,badges:enemyIntentBadges(engagementQA.renderer.questView(),r.combat,r.world.player.position)};
  },motion);
  assert.equal(tell.kind,'fang');assert.ok(tell.badges.some(b=>b.label==='FANG / RUSH'&&b.state==='WINDUP'));
  assert.equal(await page.$eval('#combat-status',e=>e.hidden),false);
  const box=await page.$eval('#combat-status',e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom}});assert.ok(box.x>=0&&box.y>=0&&box.right<=width&&box.bottom<=height,JSON.stringify(box));
  await page.screenshot({path:`.arena/engagement/tell-${width}-${motion}.png`});
  const result=await page.evaluate(async motion=>{
   const r=engagementQA.run;let rush=false;for(let i=0;i<200&&r.state.hp===3;i++){r.tick();if([...r.combat.enemies.values()].some(e=>e.mode==='rush'))rush=true;}
   engagementQA.renderer.field(r.world.player.position);engagementQA.renderer.draw(r,1,null,motion);engagementQA.updateHUD();await new Promise(requestAnimationFrame);
   return {rush,hp:r.state.hp,last:r.state.lastDamage,tick:r.state.elapsed};
  },motion);
  assert.equal(result.rush,true);assert.equal(result.hp,2);assert.equal(result.last.cause,'Fang');
  assert.match(await page.$eval('#combat-status',e=>e.textContent),/TEMPORARILY PROTECTED/);assert.equal(await page.$eval('#health-value',e=>e.textContent),'2/3');assert.equal(await page.$eval('#last-damage-cause',e=>e.textContent),'Fang rush');
  await page.screenshot({path:`.arena/engagement/hit-${width}-${motion}.png`});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS real ready, full opening tell, active rush, health loss and recovery HUD at desktop, phone and landscape, with motion on/off.');
}finally{await browser.close();}
