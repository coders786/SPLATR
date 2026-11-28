// Current desktop contract. Historical direct-aim evidence stays in
// docs/pc-controls; this inverted-spring pass writes a separate evidence set.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='docs/inverted-controls/input';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM||'/tmp/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const rows=[],errors=[];
try{
 const page=await browser.newPage();await page.setViewport({width:960,height:540});page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.abort():r.continue());
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5201',{waitUntil:'domcontentloaded'});
 const cases=[
  ['stationary',0,0],['jitter',2,0],['seven',7,0],['nine',9,0],
  ['right',140,0],['left',-140,0],['down',0,140],['up',0,-140],
  ['down-right',100,100],['down-left',-100,100],['up-right',100,-100],['up-left',-100,-100],
  ['half',60,0],['return',140,0],['camera-pan',140,0],['escape',140,0],['right-cancel',140,0],['outside',600,-300],['capture-loss',140,0],['shift-direct',0,0]
 ];
 for(const [name,dx,dy]of cases){
  await page.evaluate(async()=>{
   const [{createRun},{createRenderer},{createInput},{placePlayer,stopPlayer}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/input.js'),import('/src/physics.js')]);
   const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:999999';document.body.append(canvas);
   const run=createRun(77,()=>{},{waveMode:true});Object.assign(run.state,{phase:'playing',opening:null,inputLock:false});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;
   const renderer=createRenderer(canvas);renderer.field(run.world.player.position,false);renderer.tick(run,true);renderer.draw(run,1,null,true);const attempts=[];
   const input=createInput(canvas,{get:()=>run,active:()=>true,point:renderer.worldPoint,assist:()=>false,engage(){},lock:{once:null,tick(){}},commit(v){const accepted=run.dash(v);attempts.push({v:{...v},accepted});return accepted;}});
   canvas.parentElement.lastElementChild.style.zIndex='1000000';window.qa={canvas,run,renderer,input,attempts};canvas.addEventListener('pointerdown',e=>qa.pointerId=e.pointerId);
  });
  const start={x:480,y:250};if(name==='shift-direct')await page.keyboard.down('Shift');
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+dx,start.y+dy,{steps:4});
  if(name==='shift-direct')await page.keyboard.up('Shift');
  if(name==='return')await page.mouse.move(start.x,start.y,{steps:4});
  if(name==='camera-pan')await page.evaluate(()=>{const q=qa,p=q.run.world.player.position;q.renderer.field({x:p.x+180,y:p.y-110},false);});
  const held=await page.evaluate(()=>{const q=qa;q.input.tick();q.renderer.draw(q.run,1,q.input.aim,true);return {aim:q.input.aim,mode:document.querySelector('svg[data-control="mouse"]')?.dataset.mode,label:document.querySelector('.mouse-power')?.textContent};});
  if(['right','half','shift-direct'].includes(name))await page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:88});
  if(name==='escape')await page.keyboard.press('Escape');
  if(name==='right-cancel'){await page.mouse.down({button:'right'});await page.mouse.up({button:'right'});}
  if(name==='capture-loss'){await page.evaluate(()=>qa.canvas.releasePointerCapture(qa.pointerId));await page.mouse.move(start.x+dx+1,start.y+dy);}
  await page.mouse.up();
  const after=await page.evaluate(()=>({attempts:qa.attempts,shots:qa.run.state.shots,aim:qa.input.aim,engaged:qa.input.engaged}));
  const cancel=['stationary','jitter','return','escape','right-cancel','capture-loss'].includes(name);
  assert.equal(after.shots,cancel?0:1,name);assert.equal(after.engaged,false);assert.equal(after.aim,null);
  if(!cancel){assert.deepEqual(after.attempts[0].v,held.aim,name+' preview/release');assert.equal(after.attempts[0].accepted,true);}
  if(name==='shift-direct'){assert.equal(held.mode,'direct');assert.match(held.label,/SHIFT/);assert.ok(Math.abs(held.aim.power-31.7/42)<1e-8);}
  else if(held.aim){if(dx)assert.equal(Math.sign(held.aim.x),-Math.sign(dx),name);if(dy)assert.equal(Math.sign(held.aim.y),-Math.sign(dy),name);}
  rows.push({name,delta:{x:dx,y:dy},held,after});
  await page.evaluate(()=>{qa.input.dispose();qa.renderer.dispose();qa.run.dispose();qa.canvas.remove();delete window.qa;});
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({method:'Controlled real createInput/createRun/createRenderer, actual browser events. No simulation steps between preview/release measurement. Not ordinary gameplay.',rows,errors},null,2));
 console.log(`PASS ${rows.length} inverted desktop browser cases`);
}finally{await browser.close();}
