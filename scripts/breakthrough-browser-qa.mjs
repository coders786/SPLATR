import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.arena/breakthrough',{recursive:true});const report=[];
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[1280,720],[550,720],[390,680],[860,440]])for(const motion of [true,false]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);
 const data=await page.evaluate(async({width,height,motion})=>{
 const {createRun}=await import('/src/run.js'),{placePlayer,stopPlayer}=await import('/src/physics.js'),{createArtRenderer}=await import('/src/art/splatr-art-engine.js'),{createWaveUI}=await import('/src/wave-ui.js');
 document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.style.cssText='position:relative;width:100vw;height:100vh';game.innerHTML=`<canvas id="arena" tabindex="0" width="${width}" height="${height}" style="width:100%;height:100%"></canvas>`;document.body.append(game);
 const art=createArtRenderer(document.querySelector('canvas').getContext('2d'),{width,height,top:32,gutter:20}),events=[];const r=window.fixture=createRun(41,(type,d)=>{events.push(type);art.event(type,d,motion)},{waveMode:true});art.reset(41);art.setShakeLevel('off');r.setViewport(width,height);r.state.phase='playing';r.state.invul=99999;
 function land(){const q=r.state.wave.platform;placePlayer(r.world,{x:q.x+150,y:q.y-23});stopPlayer(r.world);for(let i=0;i<30&&r.state.wave.phase!=='choose';i++)r.tick();}
 for(let i=0;i<5;i++){for(const e of [...r.combat.enemies.values()])r.combat.remove(e);r.state.stop=0;r.tick();if(i<4){land();r.chooseWaveBuff(r.state.wave.offers[0].id);}}
 const initial=r.state.wave.phase;placePlayer(r.world,{x:0,y:-650});stopPlayer(r.world);r.state.wave.breach.previous={...r.world.player.position};
 for(let i=0;i<2000&&!r.state.wave.breach.ready;i++){if(i%24===0)r.dash({x:(Math.sign(r.world.player.velocity.x)||1)*41,y:-8,power:1});r.tick();art.tick(r,motion);}
 const sonic=r.state.breakthrough.sonic;for(let i=0;i<3;i++)r.tick();const before=r.state.shatters;art.field(r.world.player.position);art.draw(r,1,null,motion);const ui=createWaveUI({getRun:()=>r,resetInput(){}});ui.update();window.qa={r,art,ui,land,motion};
 const rect=document.querySelector('.wave-hud').getBoundingClientRect();return {initial,sonic,before,events,bounds:{x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom}};
 },{width,height,motion});
 assert.equal(data.initial,'breach');assert.equal(data.sonic,true);assert.equal(data.before,0);assert.ok(data.events.includes('hyperSurge')&&data.events.includes('sonicBank'));assert.ok(data.bounds.x>=0&&data.bounds.right<=width+1&&data.bounds.bottom<=height+1,JSON.stringify(data.bounds));
 await page.screenshot({path:`.arena/breakthrough/ready-${width}-${motion}.png`});
 const result=await page.evaluate(()=>{const {r,art,ui,land,motion}=qa;for(let i=0;i<300&&r.state.wave.phase==='breach';i++){if(i%12===0)r.dash(r.aimAt(r.state.wave.breach,false));r.tick();art.tick(r,motion);}const shattered=r.state.shatters;land();ui.update();art.draw(r,1,null,motion);return {shattered,phase:r.state.wave.phase};});assert.equal(result.shattered,1);assert.equal(result.phase,'choose');await page.screenshot({path:`.arena/breakthrough/rest-${width}-${motion}.png`});
 const reset=await page.evaluate(()=>{const {r}=qa;r.chooseWaveBuff(r.state.wave.offers[0].id);return {wave:r.state.wave.number,sonic:r.state.breakthrough.sonic,ready:r.state.breakthrough.paceReady};});assert.deepEqual(reset,{wave:6,sonic:false,ready:false});assert.deepEqual(errors,[]);report.push({width,height,motion,...data,...result,reset});await page.close();
}console.log('PASS eight Chromium milestone journeys: safe clear, real pace/surge/bank, deliberate shatter, physical rest, wave-six reset; four sizes/full+reduced.');}finally{writeFileSync('.arena/breakthrough/browser.json',JSON.stringify(report,null,2));await browser.close();}
