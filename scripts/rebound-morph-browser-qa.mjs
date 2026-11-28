import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='docs/inverted-controls/rebound';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM||'/tmp/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const rows=[],errors=[];
try{
 const p=await browser.newPage();await p.setViewport({width:960,height:540});p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));await p.setRequestInterception(true);p.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.abort():r.continue());await p.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5201',{waitUntil:'domcontentloaded'});
 for(const [element,motion,mode]of [['fire',true,'on'],['ice',true,'on'],['void',true,'on'],['fire',false,'on'],['fire',true,'off']]){
  const contact=await p.evaluate(async({element,motion,mode})=>{
   const [{createRun},{createRenderer},{placePlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js')]);
   const wrap=document.createElement('div');wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#171722';document.body.append(wrap);const canvas=document.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block';wrap.append(canvas);const renderer=createRenderer(canvas,{postfx:mode}),events=[];
   const run=createRun(41,(type,d)=>{events.push({type,...d});renderer.event(type,d,motion);},{waveMode:true,equipment:{dash:'dash-'+element}});run.state.invul=99999;run.state.wave.entry=0;for(const e of [...run.combat.enemies.values()])run.combat.remove(e);placePlayer(run.world,{x:1450,y:-450});renderer.field(run.world.player.position,false);run.dash({x:42,y:14,power:1});
   for(let i=0;i<100&&!events.some(e=>e.type==='bank');i++){run.tick();renderer.tick(run,motion);}
   renderer.draw(run,1,null,motion);window.bounceQA={run,renderer,canvas,wrap,motion,age:0};return events.find(e=>e.type==='bank');
  },{element,motion,mode});
  assert.ok(contact);assert.ok(contact.incomingX>0&&contact.outgoingX<0);assert.ok(contact.incomingY>0&&contact.outgoingY>0,'downward tangent is not replaced by an upward snap');
  for(const age of [0,4,12,28,52]){
   const state=await p.evaluate(age=>{const q=bounceQA;for(;q.age<age;q.age++){q.run.tick();q.renderer.tick(q.run,q.motion);}const capture=()=>{const seen=new WeakSet();return JSON.stringify({state:q.run.state,p:q.run.world.player.position,v:q.run.world.player.velocity},(_k,v)=>{if(v&&typeof v==='object'){if(seen.has(v))return '[reference]';seen.add(v);}return v;});};const before=capture();q.renderer.draw(q.run,1,null,q.motion);return {body:q.renderer.bodyEnvelope(),morph:q.renderer.effectState().reboundMorph,readOnly:before===capture(),post:q.renderer.postFXState(),shown:q.canvas.nextElementSibling?.style.display,opacity:q.canvas.style.opacity};},age);
   assert.equal(state.readOnly,true);for(const value of Object.values(state.body))assert.ok(value>=.8&&value<=1.25,'combined body deformation stays bounded');if(!motion)assert.equal(state.morph.banks.length,0);if(mode==='off')assert.notEqual(state.opacity,'0');else{assert.equal(state.post.failed,false);assert.equal(state.opacity,'0');}
   if(motion&&age===0)assert.equal(state.morph.banks.length,1);
   rows.push({element,motion,mode,age,contact,state});
   if(mode==='on'&&(motion||age===0))await p.screenshot({path:`${out}/${element}-${motion?'motion':'reduced'}-${age}.jpg`,type:'jpeg',quality:88});
  }
  await p.evaluate(()=>{bounceQA.renderer.dispose();bounceQA.run.dispose();bounceQA.wrap.remove();delete window.bounceQA;});
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({method:'Controlled actual run/physics → admitted bank event → standalone art renderer → real software WebGL. Setup near right rail and invulnerability are test fixtures, not ordinary progression. Incoming/outgoing vectors, visible output, reduced motion, Off and draw read-only verified.',rows,errors},null,2));console.log(`PASS ${rows.length} real-physics rebound/morph browser frames`);
}finally{await browser.close();}
