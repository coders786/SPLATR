import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
const out='.arena/pull-deck';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');let count=0;
for(const [width,height]of [[1100,720],[550,720],[390,680],[860,440]])for(const touch of [false,true]){
 await page.setViewport({width,height,hasTouch:touch,isMobile:touch});
 await page.evaluate(async()=>{
 window.deckQA?.input.dispose();window.deckQA?.run.dispose();window.deckQA?.renderer.dispose();document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.innerHTML='<canvas id="arena" tabindex="0" style="width:100vw;height:100vh;touch-action:none"></canvas>';document.body.append(game);
 const {createRun}=await import('/src/run.js'),{createInput}=await import('/src/input.js'),{createRenderer}=await import('/src/renderer.js');
 let renderer;const run=createRun(17,(type,data)=>renderer?.event(type,data,true),{waveMode:true});renderer=createRenderer(document.querySelector('canvas'));renderer.reset(17);run.state.phase='playing';run.state.invul=999999;
 const enemies=[...run.combat.enemies.values()];for(const enemy of enemies.slice(1))run.combat.remove(enemy);run.state.edge=0;
 // Actual grounded pad, one target left, no airborne refill or fake launch.
 for(let i=0;i<180;i++){run.tick();renderer.tick(run,true);}if(!run.world.grounded)throw Error('fixture left pad');
 const canvas=document.querySelector('canvas'),input=createInput(canvas,{get:()=>run,active:()=>true,point:renderer.worldPoint,assist:()=>true,engage(){},commit:v=>run.dash(v),lock:{tick(){}}});
 window.deckQA={run,renderer,input};await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);renderer.field(run.world.player.position);renderer.draw(run,1,null,true);
 });
 assert.equal(await page.evaluate(()=>deckQA.run.state.edge),1);await page.evaluate(()=>{deckQA.run.state.edge=0;deckQA.run.state.deckRecovery=0;});await page.screenshot({path:`${out}/ready-${width}-${touch}.png`});
 const x=Math.round(width*.45),y=Math.round(height*.58),session=touch?await page.createCDPSession():null;
 if(touch){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+85,id:1}]});}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y+85,{steps:8});}
 await page.evaluate(()=>{const{renderer,run,input}=deckQA;renderer.draw(run,1,input.aim,true);});await page.screenshot({path:`${out}/aim-${width}-${touch}.png`});
 if(touch)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
 const result=await page.evaluate(()=>{const{run,renderer}=deckQA,y=run.world.player.position.y;for(let i=0;i<8;i++){run.tick();renderer.tick(run,true);}renderer.draw(run,1,null,true);return{shots:run.state.shots,dy:run.world.player.position.y-y,edge:run.state.edge,remaining:run.combat.enemies.size};});
 assert.equal(result.shots,1);assert.ok(result.dy<-30,JSON.stringify(result));assert.equal(result.remaining,1);await page.screenshot({path:`${out}/released-${width}-${touch}.png`});count++;
}assert.deepEqual(errors,[]);console.log(`PASS ${count} visible production-renderer platform softlock regressions: zero-cut deck recovers one and immediate zero-cut escape release moves cube with one enemy still alive; zero page errors`);
}finally{await browser.close()}
