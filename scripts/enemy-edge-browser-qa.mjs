import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';import{mkdirSync}from'node:fs';mkdirSync('.arena/enemy-edge',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const [width,height] of [[390,680],[960,640]]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width,height});await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'text/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 const notices=await page.evaluate(async()=>{
  const {createTeachingSession}=await import('/src/teaching.js'),{createRenderer}=await import('/src/renderer.js'),{enemyThreatIndicators}=await import('/src/art/splatr-art-engine.js'),Matter=(await import('/node_modules/.vite/deps/matter-js.js')).default;
  document.body.replaceChildren();const game=document.createElement('div');game.id='game';game.dataset.screen='run';game.innerHTML='<canvas id="arena" style="width:100vw;height:100vh"></canvas>';document.body.append(game);
  const s=createTeachingSession({scenario:'fang'}),r=s.run,e=[...r.combat.enemies.values()][0];e.x=e.px=e.postX=-260;e.y=e.py=e.postY=-20;e.cool=0;Matter.Body.setPosition(e.body,e);
  for(let i=0;i<120&&!s.waiting;i++)s.tick();if(!s.waiting)throw Error('no real Fang tell');
  const renderer=createRenderer(document.querySelector('canvas'));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);// Pan the presentation after the genuine in-range tell; camera position never gates AI.
  renderer.field({x:1000,y:0});renderer.draw(r,1,null,false);
  window.edgeQA={s,renderer};return enemyThreatIndicators(renderer.questView(),r.combat);
 });assert.ok(notices.some(n=>n.label==='FANG'&&n.state==='TELL'));await page.screenshot({path:`.arena/enemy-edge/${width}.png`});assert.deepEqual(errors,[]);await page.close();
}console.log('PASS real off-screen Fang warning at mobile and desktop.');}finally{await browser.close();}
