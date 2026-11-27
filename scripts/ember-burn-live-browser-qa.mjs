// Native renderer + real run. Controlled contacts/world deadlines, not a FPS benchmark.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk18/live-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const motion of [true,false]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5187',{waitUntil:'networkidle0'});
 const result=await page.evaluate(async({motion})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);
  const renderer=createRenderer(canvas),events=[];renderer.setShakeLevel('off');
  const run=createRun(77,(type,data)=>{events.push({type,data});renderer.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-fire'}});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});run.state.wave.entry=0;
  placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;
  const add=(id,kind,x,y,hp)=>{const e=run.combat.add({id,kind,x,y,pinned:true,delay:999999});e.hp=hp;return e;};
  add('sentinel','fang',700,-900,1);const target=add('crown','crown',-320,-400,4),near=add('near','fang',-320,-450,1),boss=add('boss','monolith',400,-1000,10);
  renderer.field({x:-350,y:-400},false);run.dash({x:42,y:0,power:1});run.combat.contacts.add(target);run.state.stop=1;run.tick();
  // Separate the player after contact so the actual attached seam is inspectable.
  placePlayer(run.world,{x:-415,y:-370});stopPlayer(run.world);
  const born=target.emberBurn.born,states=[],frames=[];
  for(const offset of [0,18,36]){if(offset){run.state.blade=0;run.world.clock=born+offset;run.state.stop=1;run.combat.contacts.clear();run.tick();}renderer.tick(run,motion);renderer.draw(run,1,null,motion);frames.push(canvas.toDataURL());states.push({offset,hp:target.hp,burning:!!target.emberBurn,neighborAlive:run.combat.enemies.has(near.id),bossHp:boss.hp});}
  // Leave the completed, expired status visible in the delivered screenshot.
  window.emberNative={run,renderer,canvas};return {states,frames,hitCount:events.filter(e=>e.type==='emberHit').length};
 },{motion});
 for(const [index,data]of result.frames.entries())writeFileSync(`${out}/live-${width}x${height}${motion?'':'-reduced'}-stage${index}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.frames;
 assert.deepEqual(result.states.map(e=>e.hp),[3,2,1]);assert.deepEqual(result.states.map(e=>e.burning),[true,true,false]);assert.deepEqual(result.states.map(e=>e.neighborAlive),[true,false,false]);assert.ok(result.states.every(e=>e.bossHp===result.states[0].bossHp),JSON.stringify(result));assert.equal(result.hitCount,3);assert.deepEqual(errors,[]);
 await page.screenshot({path:`${out}/live-${width}x${height}${motion?'':'-reduced'}.png`});results.push({width,height,motion,...result,errors});await page.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS4 native live burn sequences: real renderer, delayed armor units, neighbor death, immune boss, status expiry, normal/reduced motion.');}finally{await browser.close();}
