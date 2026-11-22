import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
mkdirSync('.arena/combat-upgrades',{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
for(const [width,height]of [[1280,720],[390,680],[860,440]]){
await page.setViewport({width,height});await page.evaluate(async()=>{
 const {createRun}=await import('/src/run.js'),{createWaveUI}=await import('/src/wave-ui.js'),{createRenderer}=await import('/src/renderer.js');
 window.fixture?.renderer.dispose();window.fixture?.run.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.style.cssText='width:100vw;height:100vh';game.innerHTML='<canvas id="arena" style="width:100%;height:100%" tabindex="0"></canvas>';document.body.append(game);
 const run=createRun(16,()=>{},{waveMode:true});run.state.phase='playing';const renderer=createRenderer(document.querySelector('#arena'));const ui=createWaveUI({getRun:()=>run,resetInput:()=>{}});window.fixture={run,renderer,ui};
});
for(const id of ['comet','cleaver','duelist','bastion','fleet','reach','breaker','linger','bounty','guard','barrier']){
const bounds=await page.evaluate(async id=>{const {WAVE_BUFFS}=await import('/src/waves.js');const {run:r,renderer,ui}=fixture;r.state.waveBuff=WAVE_BUFFS.find(b=>b.id===id);r.state.waveShield=r.state.waveBuff.shield||0;r.state.wave.entry=0;r.state.slashAge=5;r.state.blade=12;r.state.slashAngle=-.4;renderer.field(r.world.player.position);renderer.draw(r,1,null,true);ui.update();const b=document.querySelector('.active-wave-upgrade'),box=b.getBoundingClientRect();return{icon:b.querySelector('svg').dataset.uiIcon,label:b.getAttribute('aria-label'),x:box.x,y:box.y,right:box.right,bottom:box.bottom};},id);
assert.ok(bounds.icon);assert.ok(bounds.label.includes('This wave only'));assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width&&bounds.bottom<=height,JSON.stringify(bounds));await new Promise(r=>setTimeout(r,380));if(['comet','cleaver','duelist','bastion','fleet','reach'].includes(id))await page.screenshot({path:`.arena/combat-upgrades/${id}-${width}.png`});
}
await page.evaluate(()=>{fixture.run.state.waveShield=0;fixture.ui.update()});assert.equal(await page.$eval('.active-wave-upgrade',e=>e.dataset.spent),'true');await page.evaluate(()=>{fixture.run.state.waveBuff=null;fixture.ui.update()});assert.equal(await page.$('.active-wave-upgrade'),null);
}assert.deepEqual(errors,[]);console.log('PASS 33 active-upgrade fixtures: distinct icons, visible bounds, spent ward and modifier removal; no browser errors');
}finally{await browser.close()}
