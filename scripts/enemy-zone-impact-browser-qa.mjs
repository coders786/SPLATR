import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import{mkdirSync}from'node:fs';
const out='.arena/zone-impacts';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');let count=0;
 for(const [width,height] of [[960,640],[390,680]])for(const motion of [true,false])for(const kind of ['fork','bastion','rift','well']){
  await page.setViewport({width,height});const result=await page.evaluate(async({kind,motion,width,height})=>{
   const {createTeachingSession}=await import('/src/teaching.js'),{createRenderer}=await import('/src/renderer.js'),{placePlayer,stopPlayer}=await import('/src/physics.js');
   window.zoneQA?.session.dispose();window.zoneQA?.renderer.dispose();window.zoneQA?.plain.dispose();document.body.replaceChildren();
   const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.innerHTML='<canvas id="arena" style="width:100vw;height:100vh"></canvas><canvas id="plain" style="width:100vw;height:100vh;position:absolute;left:-200vw"></canvas>';document.body.append(game);
   const renderer=createRenderer(document.querySelector('#arena')),plain=createRenderer(document.querySelector('#plain'));renderer.reset(841);plain.reset(841);const events=[];
   const session=createTeachingSession({scenario:kind,emit:(type,data)=>{events.push({type,data});renderer.event(type,data,motion);}}),r=session.run;
   for(let i=0;i<300&&!session.waiting;i++)session.tick();if(!session.waiting)throw Error('no tell');
   placePlayer(r.world,{x:-500,y:-500});stopPlayer(r.world);session.continueStep();for(let i=0;i<300&&!session.waiting;i++)session.tick();
   const h=r.combat.hazards.find(h=>h.kind==='zone');if(!h)throw Error('no active zone');const z=h.zone,pt=z.radius?{x:z.x,y:z.y}:{x:z.polygons[0].reduce((n,p)=>n+p.x,0)/z.polygons[0].length,y:z.polygons[0].reduce((n,p)=>n+p.y,0)/z.polygons[0].length};
   placePlayer(r.world,pt);stopPlayer(r.world);r.state.invul=0;r.state.stop=0;r.state.blade=0;r.state.parry=0;r.tick();const hit=events.find(e=>e.type==='hurt');if(!hit)throw Error('no genuine damage event');
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);renderer.field(r.world.player.position);plain.field(r.world.player.position);renderer.draw(r,1,null,motion);plain.draw(r,1,null,motion);
   const a=document.querySelector('#arena').getContext('2d').getImageData(0,0,width,height).data,b=document.querySelector('#plain').getContext('2d').getImageData(0,0,width,height).data;let changed=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)changed++;
   window.zoneQA={session,renderer,plain};return {attack:hit.data.attack,changed};
  },{kind,motion,width,height});assert.equal(result.attack.kind,({fork:'fork-swipe',bastion:'bastion-slam',rift:'rift-strike',well:'well-compression'})[kind]);assert.ok(result.changed>20,`${kind} impact visible (${result.changed} pixels)`);await page.screenshot({path:`${out}/${kind}-${width}-${motion}.png`});count++;
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${count} real zone-hit impact comparisons, desktop/phone, motion on/off.`);
}finally{await browser.close();}
