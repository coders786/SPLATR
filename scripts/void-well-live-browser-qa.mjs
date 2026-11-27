// Real run/physics force path, true field world lifetime and native renderer.
// Seeded telling actors isolate force from ordinary walking, not real-device FPS.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk20/live-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const motion of [true,false])for(const core of ['standard','time','grav','riot']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5187',{waitUntil:'networkidle0'});
 const result=await page.evaluate(async({motion,core})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);const renderer=createRenderer(canvas);renderer.setShakeLevel('off');const events=[];
  const run=createRun(77,(type,data)=>{events.push({type,data});renderer.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-void',core}});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});run.state.wave.entry=0;placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;
  run.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const add=(id,kind,x,y,hp)=>run.combat.add({id,kind,x,y,hp,delay:999999});const center=add('armor','crown',-320,-400,3),inner=add('inner','fang',-320,-345,1),outer=add('outer','fang',-320,-495,1),boss=run.combat.add({id:'boss',kind:'monolith',x:400,y:-1000,pinned:true,hp:10});
  run.dash({x:30,y:0,power:30/42});run.combat.contacts.add(center);run.state.stop=1;run.tick();run.state.blade=0;
  for(const e of [center,inner,outer])Object.assign(e,{mode:'tell',clock:200,span:200,aim:Math.PI});
  const field=run.voidStatus();placePlayer(run.world,{x:-475,y:-330});stopPlayer(run.world);renderer.field({x:-400,y:-400},false);
  if(core==='grav')run.focus(true);
  const needle={kind:'needle',source:'prism',sourceId:'already-fired',x:-280,y:-550,px:-280,py:-550,vx:-2,vy:0,angle:Math.PI,life:200,age:0};run.combat.hazards.push(needle);
  const states=[],frames=[];const snap=at=>{renderer.tick(run,motion);renderer.draw(run,1,null,motion);frames.push(canvas.toDataURL());states.push({at,clock:run.world.clock,phase:run.voidStatus().phase,centerHp:center.hp,innerHp:inner.hp,outerHp:outer.hp,innerY:inner.y,outerY:outer.y,bossHp:boss.hp,needleX:needle.x,readyIn:run.voidStatus().readyIn,targets:run.voidStatus().targets});};snap(0);
  const milestones=[6,12,18,24,36];let index=0;
  for(let i=0;i<600&&index<milestones.length;i++){
   run.state.blade=0;run.state.stop=0;run.tick();if(run.world.clock-field.born>=milestones[index]){snap(milestones[index++]);}
  }
  const result={states,frames,opens:events.filter(e=>e.type==='voidOpen').length,hits:events.filter(e=>e.type==='voidHit').map(e=>e.data.entityId),collapses:events.filter(e=>e.type==='voidCollapse').length};renderer.dispose();run.dispose();return result;
 },{motion,core});
 const at=n=>result.states.find(s=>s.at===n);assert.ok(at(36),'actual world clock reached cooldown');assert.equal(result.opens,1);assert.equal(result.collapses,1);assert.deepEqual([...result.hits].sort(),['armor','inner']);assert.equal(at(0).centerHp,2);assert.equal(at(18).centerHp,1);assert.equal(at(18).innerHp,0);assert.ok(result.states.every(s=>s.outerHp===1&&s.bossHp===10));assert.ok(at(12).innerY<at(0).innerY);assert.ok(at(12).outerY>at(0).outerY);assert.ok(at(6).needleX<at(0).needleX);assert.ok(at(12).targets.every(t=>t.moved<=32+1e-8));assert.equal(at(36).phase,'ready');assert.deepEqual(errors,[]);
 for(const [i,frame]of result.frames.slice(0,4).entries())writeFileSync(`${out}/${core}-${width}x${height}${motion?'':'-reduced'}-stage${i}.png`,Buffer.from(frame.split(',')[1],'base64'));delete result.frames;results.push({width,height,motion,core,...result,errors});await page.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} native Void real-run/physics/render sequences:4 cores,2 sizes,2 motion modes; actual pull/core-only hits, outer/boss safety, moving shot, one collapse and ready cooldown.`);}finally{await browser.close();}
