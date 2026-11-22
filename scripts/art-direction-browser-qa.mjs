// Art-direction review: same equipment/time/scale in BEFORE / AFTER columns.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const out='.arena/art-direction';mkdirSync(out,{recursive:true});
const baseline=process.env.ART_BASELINE;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1400,height:960});await page.setRequestInterception(true);page.on('request',r=>{const path=new URL(r.url()).pathname;if(path==='/src/main.js')return r.respond({status:200,contentType:'application/javascript',body:''});if(path==='/__direction_baseline.js'&&baseline)return r.respond({status:200,contentType:'application/javascript',body:readFileSync(baseline,'utf8')});r.continue();});await page.goto('http://localhost:3000');
 const report=await page.evaluate(async(hasBaseline)=>{
  const art=await import('/src/art/splatr-art-engine.js'),old=hasBaseline?await import('/__direction_baseline.js'):null;
  document.body.replaceChildren();document.documentElement.style.cssText='height:auto;overflow:auto';document.body.style.cssText='margin:16px;background:#17131d;color:#e9e0cf;font:13px monospace;overflow:auto;height:auto';
  let renders=0;const variants=[['apex',art.HYBRIDS.map(h=>({name:h.title,equipment:{...h.parts,world:h.parts.world||'tokyo'}}))],['mixed',[
   {name:'DARK / DARK',equipment:{body:'obsidian',eyes:'glitch',core:'grav',head:'viper',tail:'wings',world:'void'}},
   {name:'PALE / BRIGHT',equipment:{body:'paper',eyes:'ninja',core:'glass',head:'halo',tail:'ghost',world:'manga'}},
   {name:'WARM / COOL',equipment:{body:'chamfer',eyes:'visor',core:'riot',head:'crown',tail:'thrusters',world:'foundry'}},
   {name:'LARGE HEAD / TAIL',equipment:{body:'segmented',eyes:'hypno',core:'echo',head:'samurai',tail:'wings',world:'synth'}},
   {name:'REFLECTION / COLOR',equipment:{body:'gold',eyes:'smug',core:'time',head:'neko',tail:'spectrum',world:'tokyo'}}
  ]]];
  for(const [sectionId,builds] of variants){const section=document.createElement('section');section.id=sectionId;const title=document.createElement('h2');title.textContent=sectionId.toUpperCase()+' / '+(old?'BEFORE → AFTER':'CURRENT');section.append(title);
   for(const b of builds){const row=document.createElement('article');row.style.cssText='display:flex;gap:12px;margin:12px 0';for(const [label,engine]of old?[['BEFORE',old],['AFTER',art]]:[['CURRENT',art]]){
    const card=document.createElement('div'),h=document.createElement('h3'),canvas=document.createElement('canvas');canvas.width=670;canvas.height=340;h.textContent=b.name+' / '+label;card.append(h,canvas);const c=canvas.getContext('2d');engine.drawWorldBackdrop(c,670,340,b.equipment.world,28);
    // Same logical geometry and phase; larger study + actual gameplay + shop crop.
    engine.drawCubeHero(c,{x:245,y:170,radius:53,time:28,equipment:b.equipment,pose:{blink:1}});
    engine.drawCubeHero(c,{x:110,y:290,radius:23,time:28,equipment:b.equipment,pose:{blink:1}});
    c.save();c.translate(420,205);engine.drawShopCardArt(c,230,122,{equipment:b.equipment,slot:sectionId==='apex'?'body':'head',time:28,motion:false});c.restore();
    const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');renders++;row.append(card);
   }section.append(row);}document.body.append(section);
  }
  return {renders,apex:art.HYBRIDS.length,mixed:5,baseline:!!old};
 },!!baseline);
 for(const [index,name]of [[4,'reaper'],[7,'glacier'],[8,'briar'],[9,'sentinel'],[10,'arcade']]){const rows=await page.$$('#apex article');await rows[index].screenshot({path:`${out}/${name}-detail.png`});}
 for(const id of ['apex','mixed'])await(await page.$('#'+id)).screenshot({path:`${out}/${id}-comparison.png`});await page.screenshot({path:out+'/comparison-top.png'});assert.equal(report.apex,11);assert.deepEqual(errors,[]);writeFileSync(out+'/report.json',JSON.stringify({...report,errors},null,2));console.log(report);
}finally{await browser.close();}
