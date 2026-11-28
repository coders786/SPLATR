// Native real-run/physics/render evidence. Only actor placement is controlled;
// recorded segments, delay, source selection, damage and art are production.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const out=process.env.QA_OUT_DIR||'.arena/harmony-chunk21/live-browser';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{for(const [width,height]of [[1280,720],[390,844]])for(const motion of [true,false])for(const core of ['standard','time','echo','grav']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5187',{waitUntil:'domcontentloaded',timeout:60000});
 const result=await page.evaluate(async({motion,core})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer},{default:Matter}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js'),import('/node_modules/.vite/deps/matter-js.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);const renderer=createRenderer(canvas);renderer.setShakeLevel('off');const events=[];
  const run=createRun(77,(type,data)=>{events.push({type,data});renderer.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-echo',core}});
  for(const e of [...run.combat.enemies.values()])run.combat.remove(e);Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});run.state.wave.entry=0;placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;
  run.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
  const add=(id,x,y,hp=3)=>run.combat.add({id,kind:'bastion',x,y,hp,delay:999999});
  run.dash({x:30,y:0,power:30/42});run.state.blade=0;
  for(let i=0;i<5;i++){run.state.stop=0;run.tick();}
  const stored=run.repriseStatus().pending,origin=stored.path[0],end=stored.path.at(-1),middle=stored.path[Math.floor(stored.path.length/2)];
  const armor=add('survivor',middle.x,middle.y),late=add('late',end.x-8,end.y+90,1),safe=add('safe',origin.x+110,origin.y-100,1);
  // Move the hero away without extending its old path. This also exercises
  // discontinuity protection and two further legal-launch saturation attempts.
  placePlayer(run.world,{x:origin.x+150,y:origin.y-100});stopPlayer(run.world);
  for(let i=0;i<2;i++){run.state.inputLock=false;run.state.edge=3;run.dash({x:0,y:-20,power:.5});}
  run.state.blade=0;stopPlayer(run.world);
  for(const e of [armor,late,safe])Object.assign(e,{mode:'tell',clock:200,span:200});
  const needle={kind:'needle',source:'prism',sourceId:'already-fired',x:origin.x+15,y:origin.y-150,px:origin.x+15,py:origin.y-150,vx:-2,vy:0,angle:Math.PI,life:200,age:0};run.combat.hazards.push(needle);
  renderer.field({x:origin.x+70,y:origin.y-25},false);
  const frames=[],states=[],snap=at=>{renderer.tick(run,motion);renderer.draw(run,1,null,motion);frames.push(canvas.toDataURL());states.push({at,clock:run.world.clock,ledger:run.repriseStatus(),armor:armor.hp,late:late.hp,safe:safe.hp,needleX:needle.x});};snap('pending');
  // Late entry is body-authoritative and occurs only after recording ended.
  late.x=end.x-8;late.y=end.y;Matter.Body.setPosition(late.body,late);
  for(let i=0;i<30&&!run.repriseStatus().replay;i++){run.state.blade=0;run.state.stop=0;run.tick();}
  snap('replay');
  for(let i=0;i<4;i++){run.state.blade=0;run.state.stop=0;run.tick();}snap('dissolve');
  for(let i=0;i<4;i++){run.state.blade=0;run.state.stop=0;run.tick();}snap('gone');
  const result={frames,states,stored:events.filter(e=>e.type==='repriseStored').length,busy:events.filter(e=>e.type==='repriseBusy').length,fired:events.filter(e=>e.type==='repriseFired').length,hits:events.filter(e=>e.type==='repriseHit').map(e=>e.data.entityId),coreEchoes:run.state.equipmentFx.echoes.length};renderer.dispose();run.dispose();return result;
 },{motion,core});
 const state=at=>result.states.find(s=>s.at===at);assert.equal(result.stored,1);assert.equal(result.busy,2);assert.equal(result.fired,1);assert.deepEqual([...result.hits].sort(),['late','survivor']);assert.equal(state('replay').armor,2);assert.equal(state('replay').late,0);assert.ok(result.states.every(s=>s.safe===1));assert.ok(state('replay').needleX<state('pending').needleX);assert.equal(state('replay').ledger.replay.phase,'replay');assert.equal(state('dissolve').ledger.replay.phase,'dissolve');assert.equal(state('gone').ledger.replay,null);assert.equal(result.coreEchoes,0);assert.deepEqual(errors,[]);
 for(const [i,frame]of result.frames.entries())writeFileSync(`${out}/${core}-${width}x${height}${motion?'':'-reduced'}-stage${i}.png`,Buffer.from(frame.split(',')[1],'base64'));delete result.frames;results.push({width,height,motion,core,...result,errors});await page.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`PASS ${results.length} native Reprise real-run/physics/render sequences:4 cores,2 sizes,2 motion modes; measured old path, two busy launches, late hit, current-player neighbor safety, exact damage, moving hazard and one replay/dissolve.`);}finally{await browser.close();}
