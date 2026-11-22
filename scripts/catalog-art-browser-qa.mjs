// Visual QA gallery drawn in real Chromium by the exact shared game renderer.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/catalog-complete',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage();await page.setViewport({width:1500,height:1100,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:'// isolated art gallery'}):r.continue());await page.goto('http://localhost:3000');
 const result=await page.evaluate(async()=>{
  const {ITEMS,SLOTS,normalizeEquipment}=await import('/src/equipment.js'),{cube}=await import('/src/art.js'),{drawEquipmentWorld,drawEquipmentSlash}=await import('/src/equipment-art.js');
  const {createRun}=await import('/src/run.js'),{HYBRIDS,activeHybrid}=await import('/src/hybrids.js'),{drawStrokePrint}=await import('/src/print.js');
  document.body.innerHTML='<main id="gallery"></main>';document.documentElement.style.cssText='height:auto;overflow:visible';document.body.style.cssText='height:auto;overflow:visible;background:#17121f;color:#f5ecff;margin:0;padding:24px;font-family:monospace';const root=document.querySelector('#gallery'),hashes={};
  for(const slot of SLOTS){
   const section=document.createElement('section');section.id='art-'+slot;section.style.marginBottom='30px';const title=document.createElement('h2');title.textContent=slot.toUpperCase();section.append(title);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:12px';section.append(grid);hashes[slot]=[];
   for(const item of ITEMS.filter(x=>x.slot===slot)){
    const card=document.createElement('article');card.style.cssText='border:1px solid #61506d;border-radius:9px;overflow:hidden;background:#241b30';const canvas=document.createElement('canvas');canvas.width=280;canvas.height=190;canvas.style.cssText='width:100%;display:block';const eq=normalizeEquipment({[slot]:item.id}),c=canvas.getContext('2d');drawEquipmentWorld(c,280,190,eq.world,24);cube(c,155,100,32,0,24,1,{equipment:eq,aiming:true,combo:8,speed:30,overdrive:true,lift:1});if(slot==='slash')drawEquipmentSlash(c,45,145,235,60,item.id,.8);hashes[slot].push(canvas.toDataURL());const label=document.createElement('p');label.style.cssText='margin:10px;font-size:12px';label.textContent=item.name+' / '+(item.price===null?'CHALLENGE':item.price+' INK');card.append(canvas,label);grid.append(card);
   }root.append(section);
  }
  const prints=document.createElement('section');prints.id='prints';prints.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:12px';
  for(const h of HYBRIDS){const r=createRun(19,()=>{},{staged:false,equipment:h.parts});r.dash(r.suggestion());for(let i=0;i<30;i++)r.tick();if(!r.state.bestStroke)throw new Error('Missing seeded stroke: '+h.id);const card=document.createElement('article');card.style.background='#ecdfc4';const canvas=document.createElement('canvas');canvas.width=280;canvas.height=150;drawStrokePrint(canvas,r.state.bestStroke);const label=document.createElement('p');label.style.cssText='color:#292033;font-size:12px;padding:8px';label.textContent=activeHybrid(r.state.bestStroke.equipment).title;card.append(canvas,label);prints.append(card);r.dispose();}root.append(prints);
  return Object.fromEntries(Object.entries(hashes).map(([slot,values])=>[slot,{count:values.length,unique:new Set(values).size}]));
 });
 for(const [slot,{count,unique}] of Object.entries(result))assert.equal(unique,count,`distinct real-browser artwork for ${slot}`);
 for(const slot of Object.keys(result))await (await page.$('#art-'+slot)).screenshot({path:`.arena/catalog-complete/art-${slot}.png`});
 await page.screenshot({path:'.arena/catalog-complete/full-catalog.png',fullPage:true});await (await page.$('#prints')).screenshot({path:'.arena/catalog-complete/best-strokes.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({all50Items:result,actualSeededBestStrokes:7,errors}));
} finally {await browser.close();}
