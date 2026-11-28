// Controlled combat fixtures through actual createRun/createRenderer, separate
// from the unmodified Start Run recordings. Does not alter ownership/save data.
import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT_DIR||'docs/object-overhaul';mkdirSync(out,{recursive:true});const b=await puppeteer.launch({executablePath:'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),rows=[],errors=[];
try{const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setViewport({width:960,height:600});await p.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5201',{waitUntil:'domcontentloaded'});
 const catalog=await p.evaluate(async()=>{const {ITEMS}=await import('/src/equipment.js'),{UPGRADE_CATALOG}=await import('/src/upgrades.js'),{TYPES}=await import('/src/shapes.js');return [...ITEMS.map(x=>({id:x.id,slot:x.slot,source:'gear'})),...UPGRADE_CATALOG.map(x=>({id:x.id,source:'upgrade'})),...Object.keys(TYPES).map(id=>({id,source:'enemy'}))];});
 for(const item of catalog){const row=await p.evaluate(async item=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer},{UPGRADE_CATALOG}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js'),import('/src/upgrades.js')]);
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:999999});document.body.append(canvas);let renderer;const receipts=[];
  const run=createRun(81,(type,data)=>{receipts.push({type,id:data?.id,kind:data?.kind});renderer?.event(type,data,true);},{waveMode:true,catalogRewards:true,equipment:item.source==='gear'?{[item.slot]:item.id}:undefined});renderer=createRenderer(canvas);renderer.setShakeLevel('off');
  try{Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);run.state.wave.entry=0;
   placePlayer(run.world,{x:-100,y:-350});stopPlayer(run.world);renderer.field({x:-100,y:-350},false);renderer.tick(run,true);
   let chosen=null;if(item.source==='upgrade'){run.state.wave.phase='choose';run.state.wave.offers=[UPGRADE_CATALOG.find(x=>x.id===item.id)];chosen=run.chooseWaveBuff(item.id);}
   run.dash({x:30,y:0,power:.7});renderer.tick(run,true);const q=run.world.player.position,kind=item.source==='enemy'?item.id:'fang';
   const e=run.combat.add({id:'identity-target',kind,x:q.x+18,y:q.y,r:28,hp:1,pinned:true,delay:99999});e.hp=1;run.state.blade=12;run.state.stop=1;run.combat.contacts.add(e);run.tick();renderer.tick(run,true);
   // Sample dissipation without moving authority again, a controlled seek of
   // presentation ticks only. Never presented as ordinary unmodified gameplay.
   for(let i=0;i<45;i++)renderer.tick(run,true);renderer.draw(run,1,null,true);
   return {item,chosen,kills:run.state.kills,effects:renderer.effectState().objectJuice,receipts,frame:canvas.toDataURL('image/jpeg',.82)};
  }finally{renderer.dispose();run.dispose();canvas.remove();}
 },item);assert.ok(row.kills>=1,item.id+' admitted kill');if(item.source==='gear')assert.ok(row.effects.gear.includes('gear:'+item.id));if(item.source==='upgrade'){assert.equal(row.chosen,true);assert.ok(row.effects.upgrades.includes(item.id));assert.ok(row.receipts.some(x=>x.type==='upgradeApplied'&&x.id===item.id));}if(item.source==='enemy')assert.ok(row.effects.echoes.some(e=>e.key==='enemy:'+item.id));
 const selected=['coil','riot','time','dash-lightning','laser','foundry','fleet','cleaver','glassorbit','kingmaker','ghostlash','theending','fang','rift','crown'];if(selected.includes(item.id))writeFileSync(`${out}/fixture-${item.source}-${item.id}.jpg`,Buffer.from(row.frame.split(',')[1],'base64'));delete row.frame;rows.push(row);
 }assert.deepEqual(errors,[]);console.log(`PASS ${rows.length} controlled native run/render fixtures with admitted contacts, real reward application, live item projections and no browser errors.`);
}finally{await b.close();writeFileSync(`${out}/fixture-results.json`,JSON.stringify({method:'Controlled native createRun/createRenderer fixtures, seeded equipment; run card offers supplied as a fixture then admitted by chooseWaveBuff; native dash/contact; 45 presentation ticks sampled after contact. Separate from normal Start Run recordings. Not human or device performance testing.',errors,rows},null,2));}
