import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.arena/encounter-upgrade',{recursive:true});const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1280,height:720});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
await page.evaluate(async()=>{
 const{createRun}=await import('/src/run.js'),{SWORD_BUILDS}=await import('/src/swords.js'),{createArtRenderer}=await import('/src/art/splatr-art-engine.js'),{createWaveUI}=await import('/src/wave-ui.js'),{placePlayer,stopPlayer}=await import('/src/physics.js');
 document.body.replaceChildren();document.body.style.cssText='margin:0';const game=document.createElement('div');game.id='game';game.style.cssText='position:relative;width:100vw;height:100vh';const canvas=document.createElement('canvas');canvas.id='arena';canvas.tabIndex=0;canvas.width=1280;canvas.height=720;canvas.style.cssText='display:block;width:100%;height:100%';game.append(canvas);document.body.append(game);
 const art=createArtRenderer(canvas.getContext('2d'),{width:1280,height:720,top:32,gutter:20});const run=createRun(41,(t,d)=>art.event(t,d,false),{waveMode:true,equipment:SWORD_BUILDS.find(b=>b.id==='wraith').parts});run.state.phase='playing';run.state.invul=999999;art.reset(41);const ui=createWaveUI({getRun:()=>run,resetInput:()=>{}});
 const draw=()=>{art.tick(run,false);art.draw(run,1,null,false);ui.update();};
 window.encounterStudy={read:()=>({number:run.state.wave.number,phase:run.state.wave.phase,report:run.state.wave.report,links:run.combat.links.length}),clear(){for(let i=0;i<3000&&run.state.wave.phase==='combat';i++){if(i%24===0&&run.state.edge>0){const e=run.nearest();if(e)run.dash(run.aimAt(e,false));}run.tick();}if(run.state.wave.phase!=='return')throw Error('bot stalled');const q=run.state.wave.platform;placePlayer(run.world,{x:q.x+150,y:q.y-24});stopPlayer(run.world);for(let i=0;i<30&&run.state.wave.phase!=='choose';i++)run.tick();draw();return this.read();},showCombat(){for(let i=0;i<240;i++){run.tick();art.tick(run,false);if(run.combat.links.length)break;}draw();}};draw();
});
// Hold Space before the platform opens: its release must not choose a newly focused option.
await page.keyboard.down('Space');const first=await page.evaluate(()=>window.encounterStudy.clear());assert.equal(first.phase,'choose');assert.equal(first.report.cuts,12);await page.keyboard.up('Space');assert.equal((await page.evaluate(()=>window.encounterStudy.read())).number,1);await page.screenshot({path:'.arena/encounter-upgrade/earned-rest-1.png'});
for(let number=1;number<=4;number++){
 if(number>1){const result=await page.evaluate(()=>window.encounterStudy.clear());assert.equal(result.phase,'choose');}
 if(number===4)await page.screenshot({path:'.arena/encounter-upgrade/milestone-brief.png'});
 await page.click('.wave-upgrades[open] [data-fit=true]');assert.equal((await page.evaluate(()=>window.encounterStudy.read())).number,number+1);
 if(number===1){await page.evaluate(()=>window.encounterStudy.showCombat());await page.screenshot({path:'.arena/encounter-upgrade/live-crossfire.png'});}
}
await page.evaluate(()=>window.encounterStudy.showCombat());await page.screenshot({path:'.arena/encounter-upgrade/live-regent.png'});assert.deepEqual(errors,[]);console.log('PASS actual protected combat clears / rest reports / next-wave choices / live links / milestone / held-Space release swallowed');
}finally{await browser.close();}
