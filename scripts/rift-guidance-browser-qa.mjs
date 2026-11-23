// Exercises the marked destination through real mouse, touch and keyboard input.
// Earlier rooms use a deterministic bot; this is not a novice usability study.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.PREVIEW_BASE||'http://localhost:5173';
mkdirSync('.arena/rift-guidance',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const [width,height,device,reduced,x,y] of [[390,680,'touch',false,650,-700],[390,680,'touch',true,100,-900],[390,680,'touch',false,800,-650],[390,680,'touch',false,100,-600],[390,680,'touch',false,877,-513],[390,680,'touch',false,38,-513],[1280,720,'mouse',false,800,-1000],[1280,720,'mouse',false,450,-800],[860,440,'keys',false,650,-700],[860,440,'keys',false,100,-900]]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width,height,hasTouch:device==='touch',isMobile:device==='touch'});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]);
  await page.setRequestInterception(true);page.on('request',async req=>{if(new URL(req.url()).pathname==='/src/main.js'){const res=await fetch(req.url());await req.respond({status:200,contentType:'text/javascript',body:await res.text()+'\nwindow.riftQA={get run(){return run},get course(){return tutorial},get renderer(){return renderer},stop(){cancelAnimationFrame(raf)},resume(){raf=requestAnimationFrame(frame)}};'});}else await req.continue();});
  await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();if(device==='touch')await page.tap('#start-btn');else await page.click('#start-btn');await page.evaluate(()=>riftQA.stop());
  await page.evaluate(async({x,y})=>{const {placePlayer,stopPlayer}=await import('/src/physics.js');const r=riftQA.run,t=riftQA.course;
   const exit=()=>{const q=t.visual.gateTarget,p=r.world.player.position,aligned=Math.abs(q.axis==='x'?p.y-q.y:p.x-q.x)<85;return t.visual.gateBroken&&aligned?{x:q.x+(q.axis==='x'?q.direction*200:0),y:q.y+(q.axis==='y'?q.direction*200:0)}:q;};
   for(let i=0;i<4000&&t.stage<2;i++){
    if(i%35===0){let target;if(t.stage===0)target=t.visual.gateReady?exit():[...r.combat.enemies.values()][1]||[...r.combat.enemies.values()][0];else if(t.stage===1){if(t.visual.gateReady)target=exit();else r.dash({x:42,y:0,power:1});}if(target)r.dash(r.aimAt(target,false));}
    r.tick();t.tick();riftQA.renderer.tick(r,false);
   }
   if(t.stage!==2)throw Error('failed to reach real Rift room');
   placePlayer(r.world,{x,y});stopPlayer(r.world);r.state.edge=3;r.state.blade=0;riftQA.renderer.field(r.world.player.position);r.setView(riftQA.renderer.questView());
   // Wait for an actual enemy tell while holding a reproducible starting position.
   for(let i=0;i<1500;i++){stopPlayer(r.world);r.tick();t.tick();riftQA.renderer.tick(r,false);if(t.visual.guide?.kind==='dodge')break;}
   if(t.visual.guide?.kind!=='dodge')throw Error('real warning did not target the player');
   riftQA.renderer.draw(r,1,null,!matchMedia('(prefers-reduced-motion: reduce)').matches);
  },{x,y});
  if(device==='keys')await page.keyboard.press('ArrowUp');
  await page.evaluate(()=>riftQA.resume());await page.waitForFunction(device=>document.querySelector('#tutorial-objective').textContent.includes(device==='keys'?'ARROW':device==='touch'?'TAP':'CLICK'),{},device);await page.evaluate(()=>riftQA.stop());
  const marker=await page.evaluate(()=>{const r=riftQA.run,t=riftQA.course,v=riftQA.renderer.questView(),g=t.visual.guide;return {x:(g.x-v.x)*v.scale,y:(g.y-v.y)*v.scale,dx:g.dx,dy:g.dy,kind:g.kind,player:{...r.world.player.position},clock:r.combat.enemies.get('tutorial/rift').clock,objective:document.querySelector('#tutorial-objective').textContent,announcement:document.querySelector('#announcement').textContent};});
  assert.equal(marker.kind,'dodge',JSON.stringify(marker));assert.match(marker.announcement,/red circle/);assert.ok(marker.x>25&&marker.x<width-25&&marker.y>55&&marker.y<height-25,JSON.stringify(marker));
  await page.screenshot({path:`.arena/rift-guidance/${device}-${width}-${reduced}.png`});
  if(device==='touch'){const c=await page.createCDPSession();await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:marker.x,y:marker.y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else if(device==='mouse')await page.mouse.click(marker.x,marker.y);
  else {const key=marker.dx<0?'ArrowLeft':marker.dx>0?'ArrowRight':marker.dy<0?'ArrowUp':'ArrowDown';await page.keyboard.down(key);await page.keyboard.press('Space');await page.keyboard.up(key);}
  const result=await page.evaluate(()=>{const r=riftQA.run,t=riftQA.course;const trace=[];for(let i=0;i<250&&!t.visual.dodged;i++){r.tick();t.tick();if(i<30||i%20===0)trace.push({i,p:{...r.world.player.position},bumps:t.visual.bumpAttempts,def:r.state.lastDefense,guide:t.visual.guide?.kind,mode:r.combat.enemies.get('tutorial/rift')?.mode});}const e=r.combat.enemies.get('tutorial/rift');return {trace,dodged:t.visual.dodged,shots:r.state.shots,bumps:t.visual.bumpAttempts,guide:t.visual.guide?.kind,mode:e?.mode,position:{...r.world.player.position},marker:t.visual.guide,feedback:t.visual.dodgeFeedback};});
  assert.ok(result.dodged,`${device} ${width} ${x},${y} ${JSON.stringify(marker)} ${JSON.stringify(result)}`);await page.evaluate(()=>riftQA.resume());await page.waitForFunction(()=>{const text=document.querySelector('#tutorial-objective').textContent;return text.includes('2/3')&&document.querySelector('#announcement').textContent===text;});if(device==='touch'&&!reduced&&x===650)await page.screenshot({path:'.arena/rift-guidance/success-touch.png'});await page.evaluate(()=>riftQA.stop());assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS real touch, click and keyboard escape using the marked safe destination, including reduced motion.');
} finally {await browser.close();}
