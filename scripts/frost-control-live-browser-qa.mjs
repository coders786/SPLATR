// Controlled real-run admission + actual AI/hazards/native renderer. Not FPS QA.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk19/live-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const motion of [true,false])for(const core of ['standard','time','grav','riot']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5187',{waitUntil:'networkidle0'});
 const result=await page.evaluate(async({motion,core})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer},{enemyIntent}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js'),import('/src/art/splatr-art-engine.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);const renderer=createRenderer(canvas);renderer.setShakeLevel('off');const events=[];
  const run=createRun(77,(type,data)=>{events.push({type,data});renderer.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-ice',core,radar:'radar-3'}});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});run.state.wave.entry=0;placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;
  run.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const add=(id,kind,x,y,hp=10)=>run.combat.add({id,kind,x,y,hp,delay:999999});
  const heavy=add('heavy','bastion',-320,-400),fang=add('fang','fang',-320,-455,1),boss=run.combat.add({id:'boss',kind:'monolith',x:400,y:-1000,pinned:true,hp:10});Object.assign(fang,{mode:'tell',clock:30,span:66,aim:Math.PI,lungeSpeed:10.8});
  run.dash({x:30,y:0,power:30/42});run.combat.contacts.add(heavy);run.state.stop=1;run.tick();run.state.blade=0;
  placePlayer(run.world,{x:-430,y:-350});stopPlayer(run.world);renderer.field({x:-400,y:-400},false);
  const needle={kind:'needle',source:'prism',sourceId:'already-fired',x:-260,y:-540,px:-260,py:-540,vx:-3,vy:0,angle:Math.PI,life:200,age:0};run.combat.hazards.push(needle);
  const states=[],frames=[];const snap=at=>{renderer.tick(run,motion);renderer.draw(run,1,null,motion);frames.push(canvas.toDataURL());states.push({at,hp:heavy.hp,heavyCold:heavy.frostCold?.phase||null,fangCold:fang.frostCold?.phase||null,fangClock:fang.clock,bossHp:boss.hp,needleX:needle.x,fangIntent:enemyIntent(fang)?.state});};snap(0);
  const starts={x:heavy.x,y:heavy.y};let firstMotion=null;
  for(let now=0;now<114;now++){
   run.world.clock=now;run.combat.move(1,1);if(now===0)firstMotion=Math.hypot(heavy.x-starts.x,heavy.y-starts.y);run.world.clock=now+1;run.state.stop=1;run.combat.contacts.clear();run.tick();if([10,18,24,108,114].includes(now+1))snap(now+1);
  }
  const result={states,frames,firstMotion,contacts:events.filter(e=>e.type==='frostContact').length,thaws:events.filter(e=>e.type==='frostThaw').map(e=>e.data.entityId)};renderer.dispose();run.dispose();return result;
 },{motion,core});
 assert.equal(result.contacts,1);assert.equal(result.thaws.length,2);assert.deepEqual([...result.thaws].sort(),['fang','heavy']);assert.ok(result.firstMotion>0);assert.ok(result.states.every(s=>s.hp===9&&s.bossHp===10));
 const at=n=>result.states.find(s=>s.at===n);assert.equal(at(10).fangClock,30);assert.equal(at(10).fangIntent,'FROZEN');assert.equal(at(18).fangCold,'immune');assert.equal(at(18).heavyCold,'active');assert.equal(at(18).fangClock,30);assert.equal(at(24).fangClock,24);assert.equal(at(24).heavyCold,'immune');assert.equal(at(108).fangCold,null);assert.equal(at(114).heavyCold,null);assert.ok(at(10).needleX<at(0).needleX);assert.deepEqual(errors,[]);
 // First four stages keep evidence compact; JSON retains full expiry states.
 for(const [i,frame]of result.frames.slice(0,4).entries())writeFileSync(`${out}/${core}-${width}x${height}${motion?'':'-reduced'}-stage${i}.png`,Buffer.from(frame.split(',')[1],'base64'));delete result.frames;
 results.push({width,height,motion,core,...result,errors});await page.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} native Frost real-run/AI/render sequences:4 cores,2 viewports,2 motion modes; freeze/thaw/immunity, heavy slow, dangerous moving shot, boss resistance and unchanged HP.`);}finally{await browser.close();}
