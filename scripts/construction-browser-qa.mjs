// Same-build static art-direction gate. Requires the existing port-3000 server.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const out='.arena/construction';mkdirSync(out,{recursive:true});
const baseline=process.env.ART_BASELINE; // Optional pre-change engine, kept outside source.
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1440,height:950});
 await page.setRequestInterception(true);page.on('request',r=>{
  const path=new URL(r.url()).pathname;
  if(path==='/src/main.js')return r.respond({status:200,contentType:'application/javascript',body:''});
  if(path==='/__construction_before.js'&&baseline)return r.respond({status:200,contentType:'application/javascript',body:readFileSync(baseline,'utf8')});r.continue();
 });await page.goto('http://localhost:3000');
 const result=await page.evaluate(async(hasBaseline)=>{
  const art=await import('/src/art/splatr-art-engine.js'),before=hasBaseline?await import('/__construction_before.js'):null;
  document.body.replaceChildren();document.documentElement.style.cssText='height:auto;overflow:auto';document.body.style.cssText='height:auto;overflow:auto;margin:16px;background:#16131d;color:#eae5d9;font:13px monospace';
  const specs=[['Paper / cloth + horns',{body:'paper',head:'viper',tail:'ribbon',eyes:'ninja',core:'echo'}],['Segmented / twin thrusters',{body:'segmented',head:'coil',tail:'thrusters',eyes:'visor',core:'magnet'}],['Chamfer / crown + chain',{body:'chamfer',head:'crown',tail:'anchor',eyes:'sniper',core:'time'}],['Notched / wing root',{body:'notched',head:'halo',tail:'wings',eyes:'hypno',core:'riot'}],['Obsidian / dark reflection',{body:'obsidian',head:'neko',tail:'ghost',eyes:'glitch',core:'glass'}],['Prism / facets',{body:'prism',head:'samurai',tail:'spectrum',eyes:'smug',core:'grav'}],['Iron / planted roots',{body:'iron',head:'oni',tail:'thrusters',eyes:'blaze',core:'echo'}],['Gold / bright material',{body:'gold',head:'halo',tail:'ribbon',eyes:'ninja',core:'magnet'}],['Lava / fissures',{body:'lava',head:'viper',tail:'ribbon',eyes:'visor',core:'riot'}],['Hologram / layered planes',{body:'hologram',head:'coil',tail:'ghost',eyes:'visor',core:'time'}]];
  const signatures=[];let renders=0;
  for(const [title,eq] of specs){const row=document.createElement('section');row.style.cssText='margin-bottom:14px';const h=document.createElement('h3');h.textContent=title+' | '+(before?'BEFORE / AFTER / GRAYSCALE / CORE UNLIT':'CURRENT / GRAYSCALE / CORE UNLIT');row.append(h);const strip=document.createElement('div');strip.style.cssText='display:flex;gap:8px';
   for(const mode of before?['before','after','gray','unlit']:['after','gray','unlit']){
    const canvas=document.createElement('canvas');canvas.width=344;canvas.height=280;canvas.style.background='#2b2634';if(mode==='gray')canvas.style.filter='grayscale(1)';
    const c=canvas.getContext('2d');(mode==='before'?before:art).drawCubeHero(c,{x:219,y:151,radius:57,time:28,equipment:eq,pose:{blink:1,emission:mode==='unlit'?0:1}});
    // Actual gameplay body diameter: 46 px. Same equipment, same phase.
    (mode==='before'?before:art).drawCubeHero(c,{x:100,y:241,radius:23,time:28,equipment:eq,pose:{blink:1,emission:mode==='unlit'?0:1}});
    const m=c.getTransform();if(m.a!==1||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)throw Error('Canvas state leak');
    if(mode==='after')signatures.push(canvas.toDataURL());strip.append(canvas);renders++;
   }row.append(strip);document.body.append(row);
  }
  return {renders,bodies:specs.length,distinctBodies:new Set(signatures).size,baseline:!!before};
 },!!baseline);
 assert.equal(result.bodies,10);assert.equal(result.distinctBodies,10);assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/construction.png',fullPage:true});await page.screenshot({path:out+'/construction-top.png'});writeFileSync(out+'/report.json',JSON.stringify({...result,errors},null,2));console.log({...result,errors});
}finally{await browser.close();}
