import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.arena/wake-separation',{recursive:true});const report=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height]of [[1280,720],[550,720],[390,680],[860,440]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);
 for(const mode of ['wake','fast-wake'])for(const motion of [true,false]){
 const data=await page.evaluate(async({width,height,mode,motion})=>{
 const{createRun}=await import('/src/run.js'),{placePlayer}=await import('/src/physics.js'),{createArtRenderer}=await import('/src/art/splatr-art-engine.js'),{createWaveUI}=await import('/src/wave-ui.js');
 window.dimensionFixture?.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.style.cssText='position:relative;width:100vw;height:100vh';game.innerHTML=`<canvas id="arena" tabindex="0" width="${width}" height="${height}" style="width:100%;height:100%;display:block"></canvas>`;document.body.append(game);
 const art=createArtRenderer(document.querySelector('canvas').getContext('2d'),{width,height,top:32,gutter:20}),events=[];const run=window.dimensionFixture=createRun(41,(type,d)=>{events.push({type,...d});art.event(type,d,motion)},{waveMode:true});art.reset(41);art.setShakeLevel('low');run.setViewport(width,height);run.state.invul=99999;run.state.wave.entry=0;
 const bank=mode==='bank',kill=mode.includes('cut');placePlayer(run.world,{x:bank?820:0,y:-450});art.field(run.world.player.position);
 if(kill){for(const e of [...run.combat.enemies.values()])run.combat.remove(e);run.combat.add({id:'sentinel',kind:'fang',x:-750,y:-1100,r:24,wavePlaced:true});run.combat.add({id:'study-target',kind:'fang',x:125,y:-450,r:24,wavePlaced:true});}
 const velocity=mode==='fast-wake'||bank?42:16;run.dash({x:velocity,y:0,power:velocity/42});
 for(let i=0;i<18;i++){run.tick();art.tick(run,motion);if(bank&&events.some(e=>e.type==='cleanBank'))break;if(kill&&events.some(e=>e.type==='cut'))break;}
 art.draw(run,1,null,motion);const ui=createWaveUI({getRun:()=>run,resetInput(){}});ui.update();const view=art.viewSnapshot(),p=run.world.player.position,field=run.state.dimension;
 const before=JSON.stringify(field);art.draw(run,1,null,motion);const unchanged=JSON.stringify(field)===before;
 return{mode,motion,field,unchanged,actor:{x:(p.x-view.x)*view.scale,y:(p.y-view.y)*view.scale},kills:events.filter(e=>e.type==='cut').length,cleanBanks:run.state.wave.cleanBanks.total};
 },{width,height,mode,motion});
 assert.equal(data.unchanged,true);assert.ok(data.actor.x>0&&data.actor.x<width&&data.actor.y>0&&data.actor.y<height,JSON.stringify(data));
 if(mode.includes('wake'))assert.ok(data.field.wakes.length>0);if(mode==='fast-wake')assert.ok(data.field.wakes.some(w=>w.speed>=28));if(mode==='bank'){assert.equal(data.cleanBanks,1);assert.ok(data.field.scars.some(s=>s.kind==='bank'));}if(mode.includes('cut')){assert.equal(data.kills,1);assert.ok(data.field.impulses.some(s=>s.kind==='cut'));}
 await page.screenshot({path:`.arena/wake-separation/${mode}-${motion?'full':'reduced'}-${width}.png`});report.push({width,height,...data});
 }
 assert.deepEqual(errors,[]);await page.close();
}console.log('PASS 16 actual low/fast movement scenes across four sizes, full/reduced, measured fast samples, visible actors and no page errors');
}finally{writeFileSync('.arena/wake-separation/browser.json',JSON.stringify(report,null,2));await browser.close()}
