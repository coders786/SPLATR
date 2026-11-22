// Native browser pointers -> production createInput -> production run.dash -> Matter velocity.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.arena/sword-direction';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const reports=[];
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:900,height:650});
 await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/main.js'?r.respond({status:200,contentType:'application/javascript',body:''}):r.continue());await page.goto('http://localhost:3000');
 await page.evaluate(async()=>{
  const {createInput}=await import('/src/input.js'),{createRun}=await import('/src/run.js'),{SWORD_BUILDS}=await import('/src/swords.js');
  document.body.innerHTML='<canvas tabindex="0" width="900" height="650" style="display:block;width:900px;height:650px;touch-action:none"></canvas>';document.body.style.margin='0';
  const canvas=document.querySelector('canvas');let run=null,committed=null;
  const input=createInput(canvas,{get:()=>run,active:()=>!!run,point:(x,y)=>({x:run.world.player.position.x+x-450,y:run.world.player.position.y+y-325}),assist:()=>false,engage(){},lock:{tick(){}},commit:v=>{committed={...v};return run.dash(v);}});
  window.directionFixture={reset(build){input.reset();run?.dispose();run=createRun(41,()=>{},{waveMode:true,equipment:SWORD_BUILDS.find(b=>b.id===build).parts});run.state.phase='playing';committed=null;},preview(){return input.aim;},read(){return {committed,velocity:{...run.world.player.velocity},shots:run.state.shots};},dispose(){input.reset();run?.dispose();}};
 });
 const client=await page.createCDPSession();
 for(const build of ['sun','ronin','bulwark','reaper','wraith','storm'])for(const type of ['mouse','touch'])for(const [dx,dy] of [[-80,0],[80,0],[0,-80],[0,80],[-60,-60],[-60,60],[60,-60],[60,60]]){
  await page.evaluate(build=>window.directionFixture.reset(build),build);
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
  assert.equal(actual.shots,1);reports.push({build,type,dx,dy,preview,...actual});
 }
 await page.evaluate(()=>window.directionFixture.dispose());assert.deepEqual(errors,[]);
 console.log('PASS 96 native sword-family pointer gestures: six styles × eight directions × mouse/touch; preview = release; actual production dash velocity opposes the pull, one shot each');
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await browser.close();}
