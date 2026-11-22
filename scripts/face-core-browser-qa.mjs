import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out='.arena/face-core';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1200,height:950});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 const report=await page.evaluate(async()=>{
  const {drawCubeHero}=await import('/src/art/splatr-art-engine.js');document.body.replaceChildren();document.documentElement.style.cssText='overflow:auto;height:auto';document.body.style.cssText='overflow:auto;height:auto;margin:12px;background:#100e18;color:#eee;font:14px monospace';
  let renders=0;for(const [title,ids,slot]of [['EYES / IDLE → AIM → ATTACK',['ninja','smug','blaze','visor','hypno','glitch','sniper'],'eyes'],['CORE / CARVED INTO SHELL',['grav','time','magnet','riot','echo','glass'],'core']]){
   const section=document.createElement('section');section.id=slot;const h=document.createElement('h2');h.textContent=title;section.append(h);
   for(const id of ids){const row=document.createElement('div');row.style.cssText='display:flex;gap:10px;margin-bottom:10px';for(let i=0;i<3;i++){
    const card=document.createElement('div'),label=document.createElement('p'),canvas=document.createElement('canvas');canvas.width=380;canvas.height=245;canvas.style.background='#292132';label.textContent=id.toUpperCase()+' / '+['IDLE','AIM','ATTACK'][i];
    const c=canvas.getContext('2d'),eq={body:slot==='eyes'?'paper':['paper','segmented','chamfer'][i],eyes:slot==='eyes'?id:'visor',core:slot==='core'?id:'echo',tail:'ribbon'};
    drawCubeHero(c,{x:220,y:130,radius:74,time:18+i*21,equipment:eq,pose:{aiming:i===1,attack:i===2?1:0,speed:i===2?28:0,look:[i===1?.8:0,i===1?-.3:0],blink:1}});
    const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');card.append(label,canvas);row.append(card);renders++;
   }section.append(row);}document.body.append(section);
  }return {renders};
 });
 for(const id of ['eyes','core'])await(await page.$('#'+id)).screenshot({path:out+'/'+id+'.png'});assert.equal(report.renders,39);assert.deepEqual(errors,[]);console.log({...report,errors});
}finally{await browser.close();}
