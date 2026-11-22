import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import{mkdirSync}from'node:fs';
const out='.arena/visual-motion';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:640,height:440});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
for(const id of ['reach','cleaver','bastion']){
await page.evaluate(async id=>{const{createRun}=await import('/src/run.js'),{createRenderer}=await import('/src/renderer.js'),{WAVE_BUFFS}=await import('/src/waves.js');window.review?.renderer.dispose();window.review?.run.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.innerHTML='<canvas id="arena" style="width:100vw;height:100vh"></canvas>';document.body.append(game);let renderer;const run=createRun(73,(type,data)=>renderer?.event(type,data,true),{waveMode:true});renderer=createRenderer(document.querySelector('#arena'));run.state.phase='playing';run.state.waveBuff=WAVE_BUFFS.find(b=>b.id===id);run.state.waveShield=run.state.waveBuff.shield||0;run.state.invul=0;run.state.wave.entry=0;run.dash({x:30,y:-4,power:1});window.review={run,renderer};renderer.field(run.world.player.position);renderer.draw(run,1,null,true);},id);
for(let frame=0;frame<18;frame++){
await page.evaluate(({id,frame})=>{const{run,renderer}=review;if(id==='bastion'&&[5,11].includes(frame)){run.state.invul=0;run.hurt('visual-review');}for(let i=0;i<2;i++){run.tick();renderer.tick(run,true);}renderer.field(run.world.player.position);renderer.draw(run,1,null,true);},{id,frame});
await page.screenshot({path:`${out}/${id}-${String(frame).padStart(2,'0')}.png`});
}
}
assert.deepEqual(errors,[]);console.log('PASS 54 production-rendered motion frames: real run dash/ticks, extended/heavy weapons, two real ward impacts; no page errors');
}finally{await browser.close()}
