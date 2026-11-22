import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const output='.arena/slash-integration';mkdirSync(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1200,height:980});
 await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 const report=await page.evaluate(async()=>{
  const {drawSlashEffect,drawCubeHero}=await import('/src/art/splatr-art-engine.js');
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#110e19;color:#eee;font:14px monospace;overflow:auto';document.documentElement.style.cssText='overflow:auto;height:auto';
  const title=document.createElement('h2');title.textContent='SLASH / LOADED EDGE → CUT → FOLLOW-THROUGH';document.body.append(title);
  let count=0;const signatures=[];
  for(const id of ['razor','katana','laser','pixel']){
   const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;margin:8px';
   for(const progress of [.08,.36,.72]){
    const card=document.createElement('div'),label=document.createElement('p'),canvas=document.createElement('canvas');canvas.width=380;canvas.height=180;
    label.textContent=id.toUpperCase()+' / '+progress;canvas.style.background='#251c30';const c=canvas.getContext('2d');
    drawSlashEffect(c,{x:45,y:143,endX:345,endY:64,id,progress,strength:.85,equipment:{core:'echo'}});
    assertState(c);signatures.push(canvas.toDataURL());card.append(label,canvas);row.append(card);count++;
   }document.body.append(row);
  }
  const mounts=document.createElement('section');mounts.id='mounts';const h=document.createElement('h2');h.textContent='INSET ROOTS / SHARED COLLARS';mounts.append(h);
  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px';
  for(const [body,tail,head]of [['chamfer','ribbon','viper'],['segmented','thrusters','coil'],['notched','wings','crown']]){
   const canvas=document.createElement('canvas');canvas.width=390;canvas.height=290;canvas.style.background='#251c30';drawCubeHero(canvas.getContext('2d'),{x:240,y:175,radius:52,time:42,equipment:{body,tail,head,core:'echo',eyes:'visor',world:'tokyo'}});row.append(canvas);count++;
  }mounts.append(row);document.body.append(mounts);
  function assertState(c){const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');}
  return {renders:count,distinctSlashFrames:new Set(signatures).size};
 });
 assert.equal(report.distinctSlashFrames,12);assert.equal(report.renders,15);assert.deepEqual(errors,[]);
 await page.screenshot({path:output+'/slash-phases.png',fullPage:true});await(await page.$('#mounts')).screenshot({path:output+'/mounts.png'});writeFileSync(output+'/browser-report.json',JSON.stringify({...report,errors},null,2));console.log(report);
}finally{await browser.close();}
