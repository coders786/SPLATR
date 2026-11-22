// Native browser pointers -> production createInput -> production run.dash -> Matter velocity.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/aim-direction';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const reports=[];
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:900,height:650});
 await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 await page.evaluate(async()=>{
  const {createInput}=await import('/src/input.js'),{createRun}=await import('/src/run.js');
  document.body.innerHTML='<canvas tabindex="0" width="900" height="650" style="display:block;width:900px;height:650px;touch-action:none"></canvas>';document.body.style.margin='0';
  const canvas=document.querySelector('canvas');let run=null,committed=null;
  const input=createInput(canvas,{get:()=>run,active:()=>!!run,point:(x,y)=>({x:run.world.player.position.x+x-450,y:run.world.player.position.y+y-325}),assist:()=>false,engage(){},lock:{tick(){}},commit:v=>{committed={...v};return run.dash(v);}});
  window.directionFixture={reset(){input.reset();run?.dispose();run=createRun(41,()=>{},{staged:true});run.state.phase='playing';committed=null;},preview(){return input.aim;},read(){return {committed,velocity:{...run.world.player.velocity},shots:run.state.shots};},dispose(){input.dispose();run?.dispose();}};
 });
 const client=await page.createCDPSession();
 for(const type of ['mouse','touch'])for(const [dx,dy] of [[-80,0],[80,0],[0,-80],[0,80],[-60,-60],[-60,60],[60,-60],[60,60]]){
  await page.evaluate(()=>window.directionFixture.reset());
  if(type==='mouse'){await page.mouse.move(450,325);await page.mouse.down();await page.mouse.move(450+dx,325+dy,{steps:5});}
  else{await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:450,y:325,id:1}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:450+dx,y:325+dy,id:1}]});}
  const preview=await page.evaluate(()=>window.directionFixture.preview());
  if(type==='mouse')await page.mouse.up();else await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const actual=await page.evaluate(()=>window.directionFixture.read());
  for(const [axis,requested]of [['x',dx],['y',dy]]){
   assert.equal(Math.sign(preview[axis])||0,(-Math.sign(requested))||0,`${type} preview ${axis} ${dx},${dy}`);
   assert.equal(Math.sign(actual.velocity[axis])||0,(-Math.sign(requested))||0,`${type} physical launch ${axis} ${dx},${dy}`);
   assert.ok(Math.abs(actual.committed[axis]-preview[axis])<1e-9,'release must match preview');
  }
  assert.equal(actual.shots,1);reports.push({type,dx,dy,preview,...actual});
 }
 // Identical tap vectors despite sub-threshold jitter; a latched pull returned
 // to its origin cancels rather than silently reverting to a target tap.
 for(const type of ['mouse','touch']){
  const press=async()=>type==='mouse'?(await page.mouse.move(550,325),await page.mouse.down()):await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:550,y:325,id:1}]});
  const move=async(x,y)=>type==='mouse'?await page.mouse.move(x,y):await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y,id:1}]});
  const release=async()=>type==='mouse'?await page.mouse.up():await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  let baseline;
  for(const distance of [0,6,12,...(type==='touch'?[18]:[])]){await page.evaluate(()=>directionFixture.reset());await press();if(distance)await move(550+distance,325);const preview=await page.evaluate(()=>directionFixture.preview());if(!baseline)baseline=preview;else assert.deepEqual(preview,baseline,'jitter must not change a tap into a weak drag');assert.equal((await page.evaluate(()=>directionFixture.read())).shots,0);await release();assert.equal((await page.evaluate(()=>directionFixture.read())).shots,1);}
  await page.evaluate(()=>directionFixture.reset());await press();await move(630,325);await move(552,325);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.equal(await page.evaluate(()=>directionFixture.preview()),null);await release();assert.equal((await page.evaluate(()=>directionFixture.read())).shots,0);
 }
 await page.evaluate(()=>window.directionFixture.dispose());assert.deepEqual(errors,[]);
 console.log('PASS 16 native pointer gestures: eight directions × mouse/touch; preview = release; actual production dash velocity opposes the pull, one shot each; mouse/touch jitter remains a tap and returned pulls cancel');
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await browser.close();}
