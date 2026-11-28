import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:5192',out=process.env.QA_OUT_DIR||'docs/action-harmony-review';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),errors=[],results=[];
try{
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:1280,height:800});await p.goto(base+'/docs/action-harmony-review/playground.html',{waitUntil:'networkidle0'});await p.waitForFunction(()=>window.studyReady);
 await p.click('#pause');
 for(const core of ['standard','grav','riot','time','glass','magnet','echo']){await p.select('#core',core);await p.evaluate(()=>setStudyTime(460));await p.screenshot({path:`${out}/workbench-${core}.jpg`,type:'jpeg',quality:83});}
 await p.select('#motion','off');await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const fixed=await p.$eval('canvas',c=>c.toDataURL());await new Promise(r=>setTimeout(r,120));assert.equal(await p.$eval('canvas',c=>c.toDataURL()),fixed,'still illustration is stable');
 await p.setViewport({width:390,height:844});await p.screenshot({path:`${out}/workbench-mobile.jpg`,type:'jpeg',quality:83,fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.setViewport({width:1280,height:800});await p.select('#motion','on');await p.click('#pause');
 const video=await p.evaluate(async()=>{
  const canvas=document.querySelector('canvas'),stream=canvas.captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:850000});recorder.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>recorder.onstop=r);recorder.start();
  for(const core of ['standard','grav','riot','time','glass','magnet','echo']){document.querySelector('#core').value=core;await new Promise(r=>setTimeout(r,1800));}
  recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);
 });writeFileSync(out+'/core-signatures.webm',Buffer.from(video,'base64'));await p.close();
 // Actual createRun + real physics + live game renderer. No painter substitutes.
 for(const [width,height,motion]of [[1280,720,true],[390,844,true],[390,844,false]]){
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height});await page.goto(base,{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async({motion})=>{
   const [{createRun},{createRenderer},{placePlayer,stopPlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js')]);
   const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);const renderer=createRenderer(canvas);renderer.setShakeLevel('off');let run;const shots=[];
   for(const [i,core]of ['standard','grav','riot','time','glass','magnet','echo'].entries()){
    const equipment={core,dash:['dash-ink','dash-void','dash-fire','dash-ice','dash-water','dash-lightning','dash-echo'][i],slash:['razor','katana','blood','laser','confetti','comic','pixel'][i]};
    run=createRun(77,(type,data)=>renderer.event(type,data,motion),{waveMode:true,equipment});renderer.reset();
    for(const e of [...run.combat.enemies.values()])run.combat.remove(e);Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});run.state.wave.entry=0;placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;run.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
    run.dash({x:30,y:-5,power:30/42});renderer.field({x:-290,y:-390},false);
    for(let t=0;t<4;t++){run.state.stop=0;run.tick();renderer.tick(run,motion);}renderer.draw(run,1,null,motion);
    shots.push({core,equipment,x:run.world.player.position.x,y:run.world.player.position.y,slashAge:run.state.slashAge,frame:canvas.toDataURL('image/jpeg',.83)});run.dispose();
   }renderer.dispose();return shots;
  },{motion});
  for(const r of result){assert.ok(Number.isFinite(r.x)&&Number.isFinite(r.y));assert.ok(r.slashAge>=0,'real launch clock');const file=`live-${r.core}-${width}x${height}${motion?'':'-reduced'}.jpg`;writeFileSync(`${out}/${file}`,Buffer.from(r.frame.split(',')[1],'base64'));delete r.frame;results.push({width,height,motion,file,...r});}await page.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/browser-results.json',JSON.stringify({errors,results,method:'21 real-run launch frames at desktop/mobile with motion on/off; seven workbench core stills, static reference stability/no horizontal overflow, 12.6-second production-art recording. Scripted browser checks, not a human usability/device FPS study.'},null,2));console.log('PASS:21 real-run frames; seven core workbench captures; mobile still/no-overflow; one seven-core motion recording; no page errors.');
}finally{await browser.close();}
