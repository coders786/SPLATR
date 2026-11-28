// Ordinary Start Run, current inverted controls. Preferences only are seeded;
// all run/health/resource/actor state is observed, never injected.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='docs/inverted-controls/play';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM||'/tmp/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const rows=[],errors=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const p=await browser.newPage();await p.setViewport({width:960,height:540});p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
 await p.evaluateOnNewDocument(()=>{if(location.protocol==='about:')return;localStorage.clear();for(const [key,value]of Object.entries({tutorialCompleted:'1',motion:'1',postfx:'on'}))localStorage.setItem('riot.'+key,value);});
 await p.goto((process.env.PREVIEW_URL||'http://127.0.0.1:5201')+'/?debug',{waitUntil:'domcontentloaded'});await p.click('#start-btn');await p.waitForFunction(()=>!!window.__riot&&!__riot.state.inputLock);await wait(3000);
 await p.keyboard.down('Shift');await p.mouse.click(650,240);await p.keyboard.up('Shift');
 await p.waitForFunction(()=>document.querySelector('.uber-postfx')?.style.display==='block'&&document.querySelector('#arena')?.style.opacity==='0');
 const equipment=await p.evaluate(()=>localStorage.getItem('riot.equipment'));
 await p.evaluate(()=>{window.pcChunks=[];window.pcStream=document.querySelector('.uber-postfx').captureStream(24);window.pcRecorder=new MediaRecorder(pcStream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1800000});pcRecorder.ondataavailable=e=>e.data.size&&pcChunks.push(e.data);pcRecorder.start();});
 const snapshot=()=>p.evaluate(()=>({shots:__riot.state.shots,kills:__riot.state.kills,phase:__riot.state.phase,held:__riot.state.held,edge:__riot.state.edge,power:__riot.state.stroke?.power,angle:__riot.state.slashAngle,label:document.querySelector('.mouse-power')?.textContent,overlay:document.querySelector('svg[data-control="mouse"]')?.style.display,postFX:document.querySelector('.uber-postfx')?.style.display,sourceOpacity:document.querySelector('#arena').style.opacity,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id)}));
 for(const action of ['stationary','pull-right','pull-down','return-cancel','right-cancel','escape-cancel','shift-direct']){
  await p.waitForFunction(()=>__riot.state.phase==='playing'&&!__riot.state.inputLock&&__riot.state.edge>0);
  const before=await snapshot(),start={x:480,y:250};
  if(action==='shift-direct')await p.keyboard.down('Shift');
  await p.mouse.move(start.x,start.y);await p.mouse.down();
  if(action!=='stationary'&&action!=='shift-direct')await p.mouse.move(start.x+(action==='pull-down'?0:145),start.y+(action==='pull-down'?145:0),{steps:8});
  if(action==='return-cancel')await p.mouse.move(start.x,start.y,{steps:8});
  // A long stationary hold must NOT secretly charge or become a direct shot.
  await wait(300);const held=await snapshot();
  if(action==='stationary'||action==='return-cancel')assert.equal(held.label,'PULL BACK');
  else if(action!=='shift-direct')assert.match(held.label,/100%/);
  await p.screenshot({path:`${out}/${action}-held.jpg`,type:'jpeg',quality:86});
  if(action==='right-cancel'){await p.mouse.down({button:'right'});await p.mouse.up({button:'right'});}
  if(action==='escape-cancel')await p.keyboard.press('Escape');
  await p.mouse.up();if(action==='shift-direct')await p.keyboard.up('Shift');
  const launches=['pull-right','pull-down','shift-direct'].includes(action);
  if(launches)await p.waitForFunction(n=>__riot.state.shots===n+1,{},before.shots);else await wait(250);
  const after=await snapshot();assert.equal(after.shots,before.shots+(launches?1:0),action);assert.equal(after.held,false);assert.equal(after.overlay,'none');assert.deepEqual(after.dialogs,[]);assert.equal(after.postFX,'block');assert.equal(after.sourceOpacity,'0');
  if(launches&&action!=='shift-direct')assert.equal(after.power,1);
  rows.push({action,before,held,after});await p.screenshot({path:`${out}/${action}-after.jpg`,type:'jpeg',quality:86});
 }
 const result=await p.evaluate(async()=>{const done=new Promise(r=>pcRecorder.onstop=r);pcRecorder.stop();await done;pcStream.getTracks().forEach(t=>t.stop());const video=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(new Blob(pcChunks,{type:'video/webm'}));});return {video,equipment:localStorage.getItem('riot.equipment'),shots:__riot.state.shots,kills:__riot.state.kills,hp:__riot.state.hp,phase:__riot.state.phase,frameErrors:window.__splatrFrameErrors||[]};});
 assert.equal(result.equipment,equipment);assert.deepEqual(result.frameErrors,[]);assert.deepEqual(errors,[]);assert.equal(rows.length,7);
 writeFileSync(`${out}/gameplay.webm`,Buffer.from(result.video,'base64'));delete result.video;delete result.equipment;
 writeFileSync(`${out}/results.json`,JSON.stringify({method:'Normal main.js Start Run and real mouse/Shift events. Only tutorial-completion, motion, PostFX On preferences seeded. No run, actor, health, resources or renderer injection. Software GPU, not hardware latency/FPS certification. Screenshots include DOM; video is canvas-only.',rows,result,errors},null,2));
 await p.goto('about:blank');console.log('PASS 7 ordinary Start Run inverted-control cases');
}finally{await browser.close();}
