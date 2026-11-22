// Exhaustive recipe/world visual matrix in Chromium, using shared production art.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const output='.arena/mutation-matrix';mkdirSync(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1500,height:1100});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:'// isolated mutation art study'}):r.continue());await page.goto('http://localhost:3000');
 const report=await page.evaluate(async()=>{
  const {MUTATIONS,SPARKS,HYBRIDS}=await import('/src/hybrids.js'),{ITEMS,normalizeEquipment}=await import('/src/equipment.js'),{drawLabScene,drawLabCard}=await import('/src/lab-art.js'),{createLabScene}=await import('/src/lab-scene.js');
  document.documentElement.style.cssText='height:auto;overflow:visible';document.body.style.cssText='height:auto;overflow:visible;background:#16101e;padding:20px;margin:0;color:#f7f0dc;font-family:Body,sans-serif';document.body.replaceChildren();const worlds=ITEMS.filter(x=>x.slot==='world').map(x=>x.id),modes=['slice','aim','dash','bounce','hit'];let renderCount=0;
  const scratch=document.createElement('canvas');scratch.width=640;scratch.height=400;const c=scratch.getContext('2d');
  for(const h of MUTATIONS)for(const world of worlds)for(const mode of modes){const eq=normalizeEquipment({...h.parts,world}),scene=createLabScene(),before=c.getTransform();drawLabScene(c,eq,48,mode,scene,{now:1000});const after=c.getTransform();if(['a','b','c','d','e','f'].some(k=>before[k]!==after[k]))throw Error(`Transform leak ${h.id}/${world}/${mode}`);if(c.globalAlpha!==1)throw Error('Alpha leak '+h.id);renderCount++;}
  for(const [id,recipes]of [['sparks',SPARKS],['apex',HYBRIDS]]){const section=document.createElement('section');section.id=id;section.style.cssText='padding:8px 0 20px';const title=document.createElement('h2');title.textContent=id.toUpperCase()+' / LIVING DNA STUDIES';section.append(title);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px';section.append(grid);
   for(const h of recipes){const article=document.createElement('article');article.style.cssText='border:1px solid #735187;background:#251b31;padding:6px';const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;canvas.style.cssText='display:block;width:100%';const eq=normalizeEquipment({...h.parts,world:h.parts.world||(h.id==='ronin'?'manga':'tokyo')});drawLabScene(canvas.getContext('2d'),eq,55,'slice',createLabScene(),{now:1000});const label=document.createElement('p');label.style.cssText='font:11px Mono,monospace;line-height:1.6;margin:6px';label.textContent=h.title+' / '+Object.values(h.parts).join(' + ');article.append(canvas,label);grid.append(article);}document.body.append(section);
  }
  return {recipes:MUTATIONS.length,worlds:worlds.length,modes:modes.length,renderCount};
 });
 assert.equal(report.renderCount,report.recipes*report.worlds*report.modes);assert.equal(report.recipes,35);for(const id of ['sparks','apex'])await(await page.$('#'+id)).screenshot({path:`${output}/${id}.png`});assert.deepEqual(errors,[]);writeFileSync(`${output}/report.json`,JSON.stringify({...report,errors},null,2));console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();}
