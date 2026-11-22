import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/performance';mkdirSync(out+'/frames',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:960,height:460});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 await page.evaluate(async()=>{
  const art=await import('/src/art/splatr-art-engine.js');document.body.replaceChildren();document.body.style.cssText='margin:0;background:#17131f;color:#f6eddd;overflow:hidden';
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=460;document.body.append(canvas);
  globalThis.renderPerformance=(frame)=>{
   const c=canvas.getContext('2d'),stage=frame<8?'IDLE':frame<16?'AIM':frame<27?'RELEASE':'RECOVER',progress=frame<16?-1:(frame-16)/23;
   c.clearRect(0,0,960,460);c.fillStyle='#17131f';c.fillRect(0,0,960,460);c.fillStyle='#f6eddd';c.font='bold 18px monospace';c.fillText('ONE PERFORMANCE / '+stage,20,30);
   for(const [i,id]of ['razor','katana','laser','pixel'].entries()){
    const x=(i%2)*480,y=Math.floor(i/2)*205+48;c.save();c.translate(x,y);c.fillStyle='#292331';c.fillRect(8,0,464,195);c.fillStyle='#d4c9de';c.font='12px monospace';c.fillText(id.toUpperCase()+' / '+stage,20,20);
    const eq={body:i%2?'segmented':'paper',core:i%2?'time':'echo',eyes:i%2?'visor':'ninja',tail:i%2?'thrusters':'ribbon',slash:id};
    art.drawCubeHero(c,{x:105,y:104,radius:38,time:frame*3,equipment:eq,pose:{blink:1,aiming:stage==='AIM',attackProgress:progress,speed:stage==='RELEASE'?24:0,look:stage==='AIM'?[.9,-.2]:[0,0]}});
    // Miss sequence by design: no target and no invented endpoint explosion.
    if(progress>=0)art.drawSlashEffect(c,{x:151,y:139,endX:438,endY:74,id,strength:.9,progress,time:frame*3,equipment:eq});
    c.restore();
   }
   const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');
   return {stage,progress};
  };
 });
 const samples=[];for(let i=0;i<40;i++){const state=await page.evaluate(i=>globalThis.renderPerformance(i),i);await page.screenshot({path:`${out}/frames/${String(i).padStart(3,'0')}.png`});if([4,12,18,23,30,36].includes(i)){await page.screenshot({path:`${out}/${state.stage.toLowerCase()}-${i}.png`});samples.push({frame:i,...state});}}
 assert.deepEqual(errors,[]);writeFileSync(out+'/report.json',JSON.stringify({frames:40,styles:4,samples,errors},null,2));console.log('PASS 40-frame Chromium sequence: idle, aim, release, recovery; 4 slash styles; miss has no impact burst');
}finally{await browser.close();}
