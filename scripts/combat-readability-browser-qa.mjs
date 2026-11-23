import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
mkdirSync('.arena/readability',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const motion of [true,false]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.setRequestInterception(true);
 page.on('request',async r=>{if(new URL(r.url()).pathname==='/src/main.js'){const res=await fetch(r.url());await r.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.readQA={get run(){return run},get renderer(){return renderer},stop(){cancelAnimationFrame(raf)},start,updateHUD};'});}else await r.continue();});
 await page.goto('http://localhost:3000/?dev=1');await page.waitForFunction(()=>!document.querySelector('#title-screen').hidden);
 await page.evaluate(()=>{readQA.start();readQA.stop();});
 const info=await page.evaluate(async(motion)=>{
  const {placePlayer,stopPlayer}=await import('/src/physics.js'),{enemyIntentBadges}=await import('/src/art/splatr-art-engine.js');
  const r=readQA.run;r.state.phase='playing';r.state.wave.entry=0;
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
  placePlayer(r.world,{x:0,y:-600});stopPlayer(r.world);
  const e=r.combat.add({id:'qa-fang',kind:'fang',x:100,y:-800,home:'wave',wave:true,wavePlaced:true,delay:0});
  r.combat.move(1,1);if(e.mode!=='tell')throw Error('no real windup');
  readQA.renderer.field(r.world.player.position);readQA.renderer.draw(r,1,null,motion);readQA.updateHUD();
  return enemyIntentBadges(readQA.renderer.questView(),r.combat,r.world.player.position);
 },motion);
 assert.ok(info.some(x=>x.label==='FANG / RUSH'&&x.state==='WINDUP'&&x.progress>=0));
 await page.screenshot({path:`.arena/readability/windup-${width}-${motion}.png`});
 await page.evaluate(async(motion)=>{
  const r=readQA.run,p=r.world.player.position;r.state.invul=0;r.state.blade=0;r.state.parry=0;
  r.combat.hazards.push({kind:'ring',source:'pulse',sourceId:'test',attackId:'real-pulse',x:p.x-20,y:p.y,px:p.x-20,py:p.y,age:0,life:30,radius:20,previousRadius:20});
  r.tick();if(r.state.lastDamage?.cause!=='Pulse wave')throw Error('real Pulse collision did not damage');
  readQA.renderer.draw(r,1,null,motion);readQA.updateHUD();
 },motion);
 assert.equal(await page.$eval('#health-value',e=>e.textContent),'2/3');
 assert.equal(await page.$eval('#last-damage-cause',e=>e.textContent),'Pulse wave');
 assert.equal(await page.$eval('#last-damage',e=>e.hidden),false);
 await page.screenshot({path:`.arena/readability/hit-${width}-${motion}.png`});
 await page.evaluate(()=>{const r=readQA.run;r.state.invul=0;r.hurt('Prism needle');readQA.updateHUD();});
 assert.equal(await page.$eval('#health-value',e=>e.textContent),'1/3');
 assert.equal(await page.$eval('#last-damage-cause',e=>e.textContent),'Prism needle');
 assert.equal(await page.$eval('.hull',e=>e.hasAttribute('data-critical')),true);
 await page.evaluate(()=>{const r=readQA.run;r.hurt('Fang');readQA.updateHUD();});
 assert.equal(await page.$eval('#last-damage-cause',e=>e.textContent),'Prism needle','protected damage does not overwrite real cause');
 assert.deepEqual(errors,[]);await page.close();
}console.log('PASS real Fang windup, real Pulse hit, persistent source and low-health state at three sizes with motion on/off.');}finally{await browser.close();}
