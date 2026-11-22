import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.arena/clean-banks',{recursive:true});const report=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height]of [[1280,720],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);
 for(const steer of [false,true]){
 const data=await page.evaluate(async({width,height,steer})=>{
 const{createRun}=await import('/src/run.js'),{placePlayer}=await import('/src/physics.js'),{createArtRenderer}=await import('/src/art/splatr-art-engine.js'),{createWaveUI}=await import('/src/wave-ui.js');
 window.bankFixture?.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.style.cssText='position:relative;width:100vw;height:100vh';game.innerHTML=`<canvas id="arena" tabindex="0" width="${width}" height="${height}" style="width:100%;height:100%;display:block"></canvas>`;document.body.append(game);
 const art=createArtRenderer(document.querySelector('canvas').getContext('2d'),{width,height,top:32,gutter:20}),events=[];const run=window.bankFixture=createRun(41,(type,d)=>{events.push({type,...d});art.event(type,d,false)},{waveMode:true});art.reset(41);run.setViewport(width,height);run.state.invul=99999;run.state.wave.entry=0;placePlayer(run.world,{x:820,y:-450});art.field(run.world.player.position);run.dash({x:42,y:0,power:1});if(steer){run.setAim({x:-1,y:-.6});run.focus(true);}
 for(let i=0;i<90&&!events.some(e=>e.type==='cleanBank');i++){run.tick();art.tick(run,false);}
 art.draw(run,1,null,false);createWaveUI({getRun:()=>run,resetInput(){}}).update();const box=document.querySelector('.wave-hud').getBoundingClientRect(),view=art.viewSnapshot(),position=run.world.player.position;return{actor:{x:(position.x-view.x)*view.scale,y:(position.y-view.y)*view.scale},event:events.find(e=>e.type==='cleanBank'),bank:run.state.wave.cleanBanks,hud:document.querySelector('.bank-feedback').textContent,velocity:{...run.world.player.velocity},box:{x:box.x,y:box.y,right:box.right,bottom:box.bottom}};
 },{width,height,steer});
 assert.ok(data.actor.x>0&&data.actor.x<width&&data.actor.y>0&&data.actor.y<height,JSON.stringify(data.actor));assert.ok(data.event);assert.equal(data.event.steered,steer);assert.equal(data.bank.total,1);assert.match(data.hud,steer?/STEERED BANK/:/CLEAN BANK/);assert.ok(data.velocity.x<0);assert.ok(data.box.x>=0&&data.box.y>=0&&data.box.right<=width&&data.box.bottom<=height);await page.screenshot({path:`.arena/clean-banks/${steer?'steered':'clean'}-${width}.png`});report.push({width,height,steer,...data});
 }assert.deepEqual(errors,[]);await page.close();
}console.log('PASS eight real-physics normal/steered bank scenes at four sizes; inward exit, one event, readable HUD bounds, no JS errors');}finally{writeFileSync('.arena/clean-banks/browser.json',JSON.stringify(report,null,2));await browser.close()}
