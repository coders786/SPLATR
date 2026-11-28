// Controlled native run/physics/render checks, not a device-FPS claim.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk22/live-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const motion of [true,false])for(const head of ['none','coil'])for(const core of ['standard','time']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5187',{waitUntil:'domcontentloaded',timeout:60000});
 const result=await page.evaluate(async({motion,head,core})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);const renderer=createRenderer(canvas);renderer.setShakeLevel('off');const events=[];
  const r=createRun(77,(type,data)=>{events.push({type,data});renderer.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-lightning',head,core}});
  for(const e of [...r.combat.enemies.values()])r.combat.remove(e);Object.assign(r.state,{phase:'playing',opening:null,inputLock:false,invul:99999});r.state.wave.entry=0;placePlayer(r.world,{x:-350,y:-400});stopPlayer(r.world);r.world.grounded=false;r.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const add=(id,x,y,hp=5,kind='bastion',pinned=false)=>r.combat.add({id,kind,x,y,hp,pinned,wavePlaced:true,delay:999999});r.dash({x:30,y:0,power:30/42});renderer.field({x:-290,y:-390},false);
  const frames=[],states=[],snap=at=>{renderer.tick(r,motion);renderer.draw(r,1,null,motion);frames.push(canvas.toDataURL());states.push({at,clock:r.world.clock,volt:r.voltStatus(),x:r.world.player.position.x});};
  r.state.blade=0;r.state.stop=0;r.tick();snap('launch');
  // Keep actors outside accidental blade sweeps; explicit real primary contact
  // below isolates source admission while real physics supplied the burst.
  const e=add('direct',-300,-400),near=add('near',-300,-485,3),far=add('far',-300,-550,3),safe=add('outside',-300,-620,3),boss=add('boss',400,-1000,10,'monolith',true);
  for(const a of [e,near,far,safe])Object.assign(a,{mode:'tell',clock:200,span:200});
  placePlayer(r.world,{x:-450,y:-250});stopPlayer(r.world);Object.assign(r.world.player.plugin.previous,r.world.player.position);
  r.state.blade=12;r.combat.contacts.add(e);r.state.stop=1;r.tick();snap('contact');
  const initial={direct:e.hp,near:near.hp,far:far.hp,safe:safe.hp,boss:boss.hp};
  const needle={kind:'needle',source:'prism',sourceId:'already-fired',x:-400,y:-580,px:-400,py:-580,vx:2,vy:0,angle:0,life:200,age:0};r.combat.hazards.push(needle);const startNeedle=needle.x;
  for(let i=0;i<12;i++){r.state.stop=0;r.state.blade=0;r.tick();}snap('gone');
  const result={frames,states,initial,final:{near:near.hp,far:far.hp,safe:safe.hp,boss:boss.hp},hits:events.filter(e=>e.type==='voltHit').map(e=>e.data.entityId),contacts:events.filter(e=>e.type==='voltContact').length,needleMoved:needle.x>startNeedle};renderer.dispose();r.dispose();return result;
 },{motion,head,core});
 assert.equal(result.contacts,1);assert.deepEqual(result.hits,head==='coil'?['near','far']:['near']);assert.equal(result.initial.near,2);assert.equal(result.initial.far,head==='coil'?2:3);assert.equal(result.initial.safe,3);assert.equal(result.initial.boss,10);assert.equal(result.final.near,2);assert.equal(result.final.safe,3);assert.equal(result.final.boss,10);assert.ok(result.needleMoved);assert.ok(result.states[0].volt.burst.initial>0);assert.equal(result.states.at(-1).volt.conduction.arc,null);assert.equal(result.states.at(-1).volt.burst.amount,0);assert.deepEqual(errors,[]);
 for(const [i,frame]of result.frames.entries())writeFileSync(`${out}/${head}-${core}-${width}x${height}${motion?'':'-reduced'}-stage${i}.png`,Buffer.from(frame.split(',')[1],'base64'));delete result.frames;results.push({width,height,motion,head,core,...result,errors});await page.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} native Volt real-run/physics/render sequences:solo/Coil,Standard/Time,two sizes/two motion modes; actual burst, distinct exact relay victims, range/boss safety, advancing shot and finite arc.`);}finally{await browser.close();}
