import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/encounter-upgrade';mkdirSync(out,{recursive:true});const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const report=[];
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);
for(const [width,height]of [[1280,720],[960,640],[550,720],[860,440],[390,680]])for(const [wave,build]of [[1,'wraith'],[4,'forge'],[14,'orbit']]){
 await page.setViewport({width,height});const data=await page.evaluate(async({wave,build})=>{
  const{createRun}=await import('/src/run.js'),{waveOffers}=await import('/src/waves.js'),{SWORD_BUILDS}=await import('/src/swords.js'),{placePlayer,stopPlayer}=await import('/src/physics.js'),{createWaveUI}=await import('/src/wave-ui.js');
  window.restFixture?.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.style.cssText='position:relative;width:100vw;height:100vh;background:#151521';game.innerHTML='<canvas id="arena" tabindex="0"></canvas>';document.body.append(game);
  const seed=Array.from({length:100},(_,i)=>i).find(i=>waveOffers(i,wave).some(b=>b.id==='barrier'));
  const r=window.restFixture=createRun(seed,()=>{},{waveMode:true,equipment:SWORD_BUILDS.find(b=>b.id===build).parts});r.state.phase='playing';r.state.hp=1;r.state.wave.number=wave;for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.tick();const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<25&&r.state.wave.phase!=='choose';i++)r.tick();const ui=createWaveUI({getRun:()=>r,resetInput:()=>{}});ui.update();
  const d=document.querySelector('.wave-upgrades[open]'),box=d.getBoundingClientRect();return{wave,build,scroll:d.scrollHeight-d.clientHeight,x:box.x,y:box.y,right:box.right,bottom:box.bottom,choices:[...d.querySelectorAll('button')].map(b=>({id:b.dataset.buff,bottom:b.getBoundingClientRect().bottom}))};
 },{wave,build});
 assert.equal(data.choices.length,3);assert.ok(data.scroll<=1,JSON.stringify({width,height,...data}));assert.ok(data.x>=0&&data.y>=0&&data.right<=width&&data.bottom<=height);for(const b of data.choices)assert.ok(b.bottom<=data.bottom);if(wave===14)await page.screenshot({path:`${out}/rest-stress-${width}.png`});report.push({width,height,...data});
}assert.deepEqual(errors,[]);console.log('PASS 15 rest-layout fixtures including ward/long receipts/milestone roster; five sizes, all choices visible without dialog scroll');
}finally{writeFileSync(`${out}/rest-layout.json`,JSON.stringify(report,null,2));await browser.close();}
