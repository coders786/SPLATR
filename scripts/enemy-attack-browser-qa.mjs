import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import{mkdirSync}from'node:fs';
const out='.arena/enemy-attacks';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');let count=0;
for(const [width,height] of [[960,640],[390,680]])for(const motion of [true,false])for(const kind of ['fang-rush','pulse-ring','prism-needle','crown-needle','prism-link']){
 await page.setViewport({width,height});const result=await page.evaluate(async({kind,motion})=>{
  const {createTeachingSession}=await import('/src/teaching.js'),{createRenderer}=await import('/src/renderer.js'),{placePlayer,stopPlayer}=await import('/src/physics.js');const Matter=(await import('/node_modules/.vite/deps/matter-js.js')).default;
  window.hitQA?.session.dispose();window.hitQA?.renderer.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.innerHTML='<canvas id="arena" style="width:100vw;height:100vh"></canvas>';document.body.append(game);
  let renderer;const events=[],session=createTeachingSession({scenario:kind==='prism-link'?'link':'fang',emit:(type,data)=>{events.push({type,data});renderer?.event(type,data,motion);}}),run=session.run;renderer=createRenderer(document.querySelector('#arena'));run.state.invul=0;run.state.blade=0;run.state.parry=0;
  for(const e of run.combat.enemies.values())if(kind==='prism-link'){e.pinned=true;e.mode='idle';e.x=e.id==='lesson-0'?-200:200;e.y=0;Matter.Body.setPosition(e.body,{x:e.x,y:e.y});}else run.combat.remove(e);
  placePlayer(run.world,{x:0,y:0});stopPlayer(run.world);
  if(kind==='prism-link'){
   for(let i=0;i<200&&!events.some(e=>e.type==='hurt');i++){run.combat.hazards.length=0;run.state.invul=0;session.tick();if(session.waiting)session.continueStep();}
  }else{
   const e=run.combat.add({id:'target',kind:kind==='fang-rush'?'fang':'bastion',x:0,y:0,home:'wave',wave:true,pinned:true});
   if(kind==='fang-rush'){e.mode='rush';e.clock=24;e.aim=0;}
   else{const p=run.world.player.position;run.combat.hazards.push(kind==='pulse-ring'?{kind:'ring',source:'pulse',x:p.x-20,y:p.y,px:p.x-20,py:p.y,age:0,life:30,radius:20,previousRadius:20}:{kind:'needle',source:kind==='crown-needle'?'crown':'prism',x:p.x,y:p.y,px:p.x,py:p.y,vx:0,vy:0,angle:0,age:0,life:30});}
   run.tick();
  }
  const hit=events.find(e=>e.type==='hurt');if(!hit)throw Error('no real hit');
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);renderer.field(run.world.player.position);renderer.draw(run,1,null,motion);window.hitQA={session,renderer};const pixels=document.querySelector('#arena').getContext('2d').getImageData(0,0,60,60).data;if(!pixels.some((v,i)=>i%4!==3&&v>5))throw Error('blank impact canvas');return hit.data.attack;
 },{kind,motion});assert.equal(result.kind,kind);await page.screenshot({path:`${out}/${kind}-${width}-${motion}.png`});count++;
}assert.deepEqual(errors,[]);console.log(`PASS ${count} real enemy-hit effects on desktop/phone with motion on/off.`);
}finally{await browser.close();}
