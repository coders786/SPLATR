import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.PREVIEW_BASE||'http://localhost:4173',out='.arena/sensors';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [width,height] of [[1280,720],[390,680],[860,440]])for(const reduced of [false,true]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height,hasTouch:width===390,isMobile:width===390});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
  await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.sensorQA={get run(){return run},get renderer(){return renderer},get input(){return input},stop(){cancelAnimationFrame(raf)}};'});}else await req.continue();});
  await page.goto(base);await page.evaluate(reduced=>{localStorage.clear();localStorage.setItem('riot.started','1');localStorage.setItem('riot.quests',JSON.stringify({coins:1000}));if(reduced)localStorage.setItem('riot.motion','0');},reduced);await page.reload();await page.waitForSelector('#customize-btn',{visible:true});await page.click('#customize-btn');
  await page.click('[data-slot="radar"]');await page.click('[data-item="radar-1"]');assert.equal(await page.$eval('.equip-part',b=>b.disabled),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),1000);
  await page.reload();await page.evaluate(()=>localStorage.setItem('riot.quests',JSON.stringify({coins:20000})));await page.reload();await page.waitForSelector('#customize-btn',{visible:true});await page.click('#customize-btn');
  await page.click('[data-slot="radar"]');assert.equal(await page.$$eval('.custom-card',es=>es.length),4);await page.click('[data-item="radar-3"]');
  assert.match(await page.$eval('.equip-part',b=>b.textContent),/6500/);await page.screenshot({path:`${out}/shop-radar-${width}-${reduced}.png`});
  await page.click('.equip-part');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),13500);await page.click('.equip-part');
  await page.click('[data-slot="trajectory"]');assert.equal(await page.$$eval('.custom-card',es=>es.length),4);await page.click('[data-item="trajectory-3"]');await page.screenshot({path:`${out}/shop-vector-${width}-${reduced}.png`});
  await page.click('.equip-part');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.quests')).coins),7000);await page.click('.equip-part');
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.equipment')));assert.equal(saved.equipped.radar,'radar-3');assert.equal(saved.equipped.trajectory,'trajectory-3');assert.ok(saved.owned.includes('radar-3')&&saved.owned.includes('trajectory-3'));
  await page.click('.lab-exit');await page.reload();await page.waitForSelector('#start-btn',{visible:true});await page.click('#start-btn');await page.waitForFunction(()=>sensorQA.run);await page.evaluate(async()=>{sensorQA.stop();const {placePlayer,stopPlayer}=await import('/src/physics.js'),r=sensorQA.run;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);placePlayer(r.world,{x:0,y:-450});stopPlayer(r.world);Object.assign(r.world.player.plugin.previous,{x:0,y:-450,angle:r.world.player.angle});r.state.phase='playing';r.state.wave.entry=0;r.combat.add({id:'test-contact',kind:'fang',x:350,y:-620,pinned:true,wavePlaced:true});r.combat.hazards.push({kind:'needle',source:'prism',x:180,y:-570,px:180,py:-570,angle:0,age:0,life:99});sensorQA.renderer.field(r.world.player.position);sensorQA.renderer.tick(r,false);sensorQA.renderer.draw(r,1,null,false);});
  const fixture=await page.evaluate(()=>{const r=sensorQA.run,v=sensorQA.renderer.questView(),p=r.world.player.position;return {x:(p.x-v.x)*v.scale,y:(p.y-v.y)*v.scale,radar:r.state.equipment.radar,trajectory:r.state.equipment.trajectory};});assert.equal(fixture.radar,'radar-3');assert.equal(fixture.trajectory,'trajectory-3');
  // Physical pointer events exercise the production input overlay and the live
  // canvas trajectory together. The launch vector is only inspected, not fired.
  let touch;if(width===390){touch=await page.createCDPSession();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fixture.x,y:fixture.y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:fixture.x-70,y:fixture.y+35}]});}else{await page.mouse.move(fixture.x,fixture.y);await page.mouse.down();await page.mouse.move(fixture.x-70,fixture.y+35,{steps:4});}
  const captured=await page.evaluate(()=>{const ctx=CanvasRenderingContext2D.prototype,old=ctx.fillText,text=[];ctx.fillText=function(s,...args){text.push(String(s));return old.call(this,s,...args)};try{sensorQA.renderer.draw(sensorQA.run,1,sensorQA.input.aim,false);}finally{ctx.fillText=old;}const a=sensorQA.input.aim;return {texts:text.filter(s=>/^SPD |SNAPSHOT/.test(s)),x:a.x,y:a.y,power:a.power,arrow:document.querySelector('.drag-design').getAttribute('transform')};});
  assert.ok(captured.texts.some(x=>x.startsWith('SPD ')),`oracle receipt missing: ${width} ${JSON.stringify(captured)}`);assert.ok(captured.power>0);assert.ok(captured.arrow.includes('rotate'));
  await page.screenshot({path:`${out}/game-aim-${width}-${reduced}.png`});if(touch)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  assert.deepEqual(errors,[],`page errors on ${width}x${height}`);await page.close();
 }
 console.log('PASS: purchase/equip/persistence, insufficient funds, live native pointer trajectory and radar at desktop/phone/landscape with reduced motion.');
}finally{await browser.close();}
