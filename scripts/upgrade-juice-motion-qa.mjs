import assert from 'node:assert/strict';import puppeteer from 'puppeteer-core';import {writeFileSync,mkdirSync} from 'node:fs';
const out='docs/upgrade-juice';mkdirSync(`${out}/motion`,{recursive:true});const b=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']}),errors=[],rows=[];
try{const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:1280,height:1000});await p.goto((process.env.PREVIEW_URL||'http://127.0.0.1:5192')+'/docs/upgrade-juice/',{waitUntil:'networkidle0'});await p.waitForFunction(()=>window.juice);
const cases=await p.evaluate(async()=>{const {ITEMS}=await import('/src/equipment.js');return ITEMS.filter(i=>['slash','dash','core','body'].includes(i.slot)).map(i=>({mode:i.slot==='body'?'body':i.slot,id:i.id}));});
for(const item of cases){await p.evaluate(({mode,id})=>juice.set(mode,id,30),item);await p.screenshot({path:`${out}/motion/${item.mode}-${item.id}.jpg`,type:'jpeg',quality:85});rows.push(item);}
// Native Canvas recording of the labeled art study, not a gameplay video.
const clip=await p.evaluate(async cases=>{
 const canvas=juice.canvas,stream=canvas.captureStream(20),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1800000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const done=new Promise(r=>recorder.onstop=r);recorder.start();let start=performance.now();
 await new Promise(resolve=>{const timer=setInterval(()=>{const elapsed=performance.now()-start,index=Math.floor(elapsed/800);if(index>=cases.length){clearInterval(timer);resolve();return;}const q=cases[index];juice.set(q.mode,q.id,(elapsed%800)/16.667);},50);});recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
 return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
},cases.filter(i=>i.mode!=='body').concat(cases.filter(i=>i.mode==='body').slice(0,4)));writeFileSync(`${out}/signature-motion.webm`,Buffer.from(clip,'base64'));
assert.deepEqual(errors,[]);console.log('PASS',rows.length,'motion-study screenshots and finite production-art WebM');
}finally{await b.close();writeFileSync(`${out}/motion/results.json`,JSON.stringify({rows,errors,method:'Native browser captures and MediaRecorder Canvas recording of a labeled production-art study. Not a gameplay video or a physical-device performance test.'},null,2));}
