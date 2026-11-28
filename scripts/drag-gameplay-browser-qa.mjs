// Native pointer playtest against the shipped game, not an isolated fixture.
// Start the built preview first; Chrome needs WebGL (SwiftShader works).
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const url=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');url.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try{
 for(const mobile of [false,true]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport(mobile?{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}:{width:1100,height:700});
  await page.goto(url.href);await page.waitForSelector('#start-btn',{visible:true});await page.click('#start-btn');
  // Keep natural combat and movement running, but prevent a random death from
  // ending the deliberate long hold before focus has had time to empty.
  await page.evaluate(()=>{window.__riot.state.invul=10000;});
  const cdp=mobile?await page.createCDPSession():null;
  const touch=async(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y,id:1,radiusX:3,radiusY:3,force:1}))});
  const start=mobile?{x:230,y:380}:{x:550,y:320};
  async function down(x,y){if(mobile)await touch('touchStart',[[x,y]]);else{await page.mouse.move(x,y);await page.mouse.down();}}
  async function move(x,y){if(mobile)await touch('touchMove',[[x,y]]);else await page.mouse.move(x,y,{steps:5});}
  async function up(){if(mobile)await touch('touchEnd');else await page.mouse.up();}
  const shotCount=()=>page.evaluate(()=>window.__riot.state.shots);
  const data=()=>page.evaluate(()=>{const r=window.__riot,el=document.querySelector('svg[data-control]'),design=el?.querySelector('.drag-design');return {shots:r.state.shots,phase:r.state.phase,held:r.state.held,depleted:r.state.depleted,slow:r.world.slow,scale:r.world.focusScale,edge:r.state.edge,visible:el?.style.display,arrow:design?.getAttribute('transform'),wave:r.state.wave.number};});
  // A real first pull from the title-to-arcade path, then a held redirect.
  await down(start.x,start.y);await move(start.x,start.y+110);
  assert.equal(await shotCount(),0,'no launch while holding the first pull');await up();
  await page.waitForFunction(()=>window.__riot.state.shots===1);
  await new Promise(r=>setTimeout(r,350));
  await down(start.x,start.y);await move(start.x-95,start.y+75);
  await page.waitForFunction(()=>window.__riot.state.held);
  const initial=await data();assert.equal(initial.shots,1);assert.equal(initial.visible,'block');assert.ok(initial.arrow);
  await page.waitForFunction(()=>window.__riot.state.depleted,{timeout:20000});
  const spent=await data();assert.equal(spent.shots,1,'empty focus must not fire');assert.equal(spent.held,true);assert.equal(spent.slow,true,'slow aim remains engaged');assert.equal(spent.arrow,initial.arrow,'stationary pointer does not drift with enemies');
  await new Promise(r=>setTimeout(r,250));const steady=await data();assert.equal(steady.shots,1);assert.ok(steady.scale<.2,JSON.stringify(steady));
  await up();await page.waitForFunction(()=>window.__riot.state.shots===2,{timeout:3000});
  const after=await data(),angle=Number(initial.arrow.match(/rotate\(([-.\d]+)/)[1])*Math.PI/180;
  const actual=await page.evaluate(()=>window.__riot.state.launchAngle);
  assert.ok(Math.abs(Math.atan2(Math.sin(actual-angle),Math.cos(actual-angle)))<1e-6,`preview ${angle}, fired ${actual}`);
  assert.notEqual(after.visible,'block');assert.equal(after.held,false);
  // Returning a pulled pointer to its origin cancels instead of firing a tap.
  await down(start.x,start.y);await move(start.x-70,start.y+50);await move(start.x,start.y);
  const cancelled=await data();assert.equal(cancelled.shots,2);await up();
  await new Promise(r=>setTimeout(r,200));assert.equal(await shotCount(),2);
  // A live continuous-wave transition and a browser viewport resize must not
  // cancel or silently fire an in-progress drag.
  await down(start.x,start.y);await move(start.x-80,start.y+60);
  const waveBefore=await page.evaluate(()=>window.__riot.state.wave.number);
  await page.evaluate(()=>{const r=window.__riot;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);});
  await page.waitForFunction(n=>window.__riot.state.wave.number>n,{timeout:5000},waveBefore);
  assert.equal((await data()).visible,'block');assert.equal(await shotCount(),2);
  await page.setViewport(mobile?{width:390,height:810,isMobile:true,hasTouch:true,deviceScaleFactor:2}:{width:1100,height:680});
  assert.equal((await data()).visible,'block');assert.equal(await shotCount(),2);
  await up();await page.waitForFunction(()=>window.__riot.state.shots===3,{timeout:3000});
  assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'touch':'mouse'}: real arcade launch, long held redirect past empty focus, stable preview and exact release`);
  await context.close();
 }
}finally{await browser.close();}
