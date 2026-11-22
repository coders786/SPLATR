import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/art-direction/motion';mkdirSync(out+'/frames',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1000,height:720});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 await page.evaluate(async()=>{
  const art=await import('/src/art/splatr-art-engine.js');document.body.replaceChildren();document.body.style.cssText='margin:0;overflow:hidden;background:#16111d';const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=720;document.body.append(canvas);
  const recipes=['glacier','briar','sentinel','arcade','reaper','king'].map(id=>art.HYBRIDS.find(h=>h.id===id));
  globalThis.renderHybridFrame=frame=>{
   const c=canvas.getContext('2d'),aim=frame>=6&&frame<14,progress=frame<14?-1:(frame-14)/25,label=aim?'AIM':frame<6?'IDLE':progress<.55?'RELEASE':'RECOVER';
   c.fillStyle='#16111d';c.fillRect(0,0,1000,720);c.fillStyle='#f4ecd8';c.font='bold 17px monospace';c.fillText('HYBRID CONSTRUCTION / '+label+' / NO CONTACT',16,27);
   for(let i=0;i<recipes.length;i++){
    const h=recipes[i],eq={...h.parts,world:h.parts.world||['void','manga','foundry','synth','tokyo','void'][i]},x=i%2*500,y=40+Math.floor(i/2)*225;
    c.save();c.translate(x,y);c.beginPath();c.rect(8,0,484,215);c.clip();art.drawWorldBackdrop(c,500,215,eq.world,frame);
    art.drawCubeHero(c,{x:160,y:132,radius:37,time:frame*3,equipment:eq,pose:{blink:1,aiming:aim,attackProgress:progress,look:aim?[.8,-.15]:[0,0],speed:progress>=0&&progress<.5?20:0}});
    if(progress>=0)art.drawSlashEffect(c,{x:214,y:163,endX:461,endY:76,id:eq.slash||'razor',strength:.85,progress,time:frame*3,equipment:eq});
    c.fillStyle=eq.world==='manga'?'#302837':'#f4ecd8';c.font='12px monospace';c.fillText(h.title,18,21);c.restore();
   }
   const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas leak');return label;
  };
 });
 const samples=[];for(let frame=0;frame<40;frame++){const label=await page.evaluate(f=>globalThis.renderHybridFrame(f),frame);await page.screenshot({path:`${out}/frames/${String(frame).padStart(3,'0')}.png`});if([3,10,17,23,33,38].includes(frame)){await page.screenshot({path:`${out}/${label.toLowerCase()}-${frame}.png`});samples.push({frame,label});}}
 assert.deepEqual(errors,[]);writeFileSync(out+'/report.json',JSON.stringify({frames:40,hybrids:6,samples,errors},null,2));console.log('PASS 40 Chromium frames / 6 hybrids / 6 representative world assignments / idle-aim-release-recovery / no page errors');
}finally{await browser.close();}
