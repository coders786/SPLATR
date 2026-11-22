// Continuous industrial-world inspection. Single existing port-3000 server.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const out='.arena/world-redesign';mkdirSync(out+'/frames',{recursive:true});
const baseline=process.env.ART_BASELINE;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1200,height:675});await page.setRequestInterception(true);page.on('request',r=>{const path=new URL(r.url()).pathname;if(path==='/src/main.js')return r.respond({status:200,contentType:'application/javascript',body:''});if(path==='/__world_baseline.js'&&baseline)return r.respond({status:200,contentType:'application/javascript',body:readFileSync(baseline,'utf8')});r.continue();});await page.goto('http://localhost:3000');
 await page.evaluate(async(hasBaseline)=>{
  const art=await import('/src/art/splatr-art-engine.js'),old=hasBaseline?await import('/__world_baseline.js'):null;
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#10141d;overflow:hidden';const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=675;document.body.append(canvas);const c=canvas.getContext('2d'),background=art.legacy_atmosphere.createBackdrop(c),previous=old?.legacy_atmosphere.createBackdrop(c);
  globalThis.drawWorldStudy=(panX=0,panY=0,band=1,before=false)=>{
   const v={width:1200,height:675,scale:.95,panX,panY};(before&&previous?previous:background).world(v,41,band);
   // Same actor silhouettes and aim segment for honest contrast inspection.
   art.drawCubeHero(c,{x:520,y:455,radius:23,time:28,equipment:{body:'paper',eyes:'ninja',tail:'ribbon'}});
   art.drawEnemyShape(c,{x:730,y:280,radius:27,kind:'fang',angle:.3});
   c.strokeStyle='#cc597488';c.lineWidth=1.5;c.setLineDash([6,9]);c.beginPath();c.moveTo(520,430);c.lineTo(724,307);c.stroke();c.setLineDash([]);
   c.fillStyle='#10141dcc';c.fillRect(16,16,342,39);c.fillStyle='#e9e5d4';c.font='13px monospace';c.fillText((before?'BEFORE':'CURRENT')+' / DISTRICT '+band+' / CAMERA '+Math.round(panY),28,40);
   const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');return canvas.toDataURL();
  };
 },!!baseline);
 const captures=[];for(const [name,x,y,band] of [['origin',0,0,1],['rise',170,-1300,1],['deep',-430,-4700,1],['warm',0,-1800,2],['cool',0,-2700,3],['steel',0,-3400,4]]){
  if(baseline){await page.evaluate(({x,y,band})=>globalThis.drawWorldStudy(x,y,band,true),{x,y,band});await page.screenshot({path:`${out}/before-${name}.png`});}
  const first=await page.evaluate(({x,y,band})=>globalThis.drawWorldStudy(x,y,band),{x,y,band});const second=await page.evaluate(({x,y,band})=>globalThis.drawWorldStudy(x,y,band),{x,y,band});assert.equal(first,second);await page.screenshot({path:`${out}/${name}.png`});captures.push({name,x,y,band});
 }
 for(let frame=0;frame<36;frame++){await page.evaluate(f=>globalThis.drawWorldStudy(f*7,-f*34,1),frame);await page.screenshot({path:`${out}/frames/${String(frame).padStart(3,'0')}.png`});}
 assert.deepEqual(errors,[]);writeFileSync(out+'/report.json',JSON.stringify({captures,frames:36,errors},null,2));console.log('PASS deterministic Chromium districts / six camera-palette captures / 36 continuous parallax frames / no Canvas or page errors');
}finally{await browser.close();}
