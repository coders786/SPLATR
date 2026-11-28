// Controlled native contacts exercise power timelines, not ordinary progression.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT_DIR||'docs/power-correlation/native';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
try{for(const [width,height]of [[960,540],[390,844]])for(const motion of [true,false])for(const id of ['fire','ice','lightning','void','echo']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(90000);await page.setViewport({width,height});await page.setRequestInterception(true);page.on('request',req=>new URL(req.url()).pathname==='/src/main.js'?req.abort():req.continue());await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5201',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async({id,motion})=>{
  const [{createRun},{createRenderer},{placePlayer,stopPlayer},{powerChoreography}]=await Promise.all([import('/src/run.js'),import('/src/renderer.js'),import('/src/physics.js'),import('/src/art/splatr-art-engine.js')]);
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:999999';document.body.append(canvas);let renderer;const events=[];
  const run=createRun(77,(type,data)=>{events.push({type,x:data?.x,y:data?.y});renderer?.event(type,data,motion);},{waveMode:true,equipment:{dash:'dash-'+id}});renderer=createRenderer(canvas);
  try{
   Object.assign(run.state,{phase:'playing',opening:null,inputLock:false,invul:99999});for(const e of [...run.combat.enemies.values()])run.combat.remove(e);run.state.wave.entry=0;placePlayer(run.world,{x:-350,y:-400});stopPlayer(run.world);run.world.grounded=false;run.combat.add({id:'sentinel',kind:'fang',x:700,y:-900,pinned:true,delay:999999});
   const center=run.combat.add({id:'center',kind:'bastion',x:-320,y:-400,hp:100,delay:999999});run.combat.add({id:'neighbor',kind:id==='ice'?'fang':'bastion',x:-280,y:-400,hp:100,delay:999999});if(id==='echo'){run.combat.remove(center);run.combat.remove(run.combat.enemies.get('neighbor'));}renderer.field({x:-350,y:-400},false);renderer.tick(run,motion);
   const accepted=run.dash({x:30,y:0,power:30/42});if(id!=='echo'){run.combat.contacts.add(center);run.state.stop=1;run.tick();renderer.tick(run,motion);}
   const frames=[],states=[];let added=false;
   for(let i=0;i<80;i++){
    const pending=run.state.reprise?.pending;if(id==='echo'&&!added&&pending?.path.length>1&&pending.due-run.world.clock<=1.1){const point=pending.path[Math.floor(pending.path.length/2)];run.combat.add({id:'late-arrival',wavePlaced:true,kind:'bastion',x:point.x,y:point.y,hp:100,delay:999999});added=true;}
    run.state.blade=0;run.state.stop=0;run.combat.contacts.clear();run.tick();renderer.tick(run,motion);
    if([0,3,8,17,19,35,39,79].includes(i)){
     renderer.draw(run,1,null,motion);const q=powerChoreography({state:run.state,enemies:run.combat.enemies.values(),now:run.world.clock});states.push({at:i,now:run.world.clock,projection:q,payoffs:renderer.effectState().powerPayoffs});
     if([3,19,39].includes(i))frames.push({at:i,image:canvas.toDataURL('image/jpeg',.88)});
    }
   }
   const before=JSON.stringify(renderer.effectState());renderer.draw(run,1,null,motion);renderer.draw(run,1,null,motion);const readOnly=before===JSON.stringify(renderer.effectState());renderer.reset(77);const reset=renderer.effectState().powerPayoffs.length===0;
   return {accepted,events,states,frames,readOnly,reset};
  }finally{renderer.dispose();run.dispose();canvas.remove();}
 },{id,motion});
 assert.equal(result.accepted,true);assert.ok(result.readOnly);assert.ok(result.reset);assert.deepEqual(errors,[]);
 const event={fire:'emberHit',ice:'frostContact',lightning:'voltHit',void:'voidHit',echo:'repriseHit'}[id];assert.ok(result.events.some(e=>e.type===event),id+' must exercise '+event);
 if(id==='ice')assert.ok(result.states.some(s=>s.projection.cold.length>0));
 else assert.ok(result.states.some(s=>s.payoffs.length>0),id+' real damage has visible aftermath');
 assert.ok(result.states.every(s=>s.payoffs.length<=8));assert.equal(result.states.at(-1).payoffs.length,0);
 for(const f of result.frames)if(motion)writeFileSync(`${out}/${width}-${id}-${f.at}.jpg`,Buffer.from(f.image.split(',')[1],'base64'));
 delete result.frames;rows.push({width,height,motion,id,errors,...result});writeFileSync(`${out}/results.json`,JSON.stringify({method:'Controlled real run/physics/renderer. Seeded equipped power and actors, admitted primary contact except Reprise (real traveled path and late actor). Actual scheduled damage callbacks, not fabricated proc events. Main entry blocked to avoid duplicate renderers. Software browser test, not device FPS certification.',rows},null,2));console.log('PASS',width,motion,id);await page.close();
}console.log('PASS 20 native power timelines.');}finally{await browser.close();}
