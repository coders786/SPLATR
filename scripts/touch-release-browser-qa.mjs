import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let checks=0;
try{for(const [width,height]of [[390,680],[550,720],[860,440]]){
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.setViewport({width,height,hasTouch:true,isMobile:true});await p.goto('http://localhost:3000');
 await p.evaluate(async()=>{
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 const {createInput}=await import('/src/input.js'),{createRun}=await import('/src/run.js');
 const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:999;touch-action:none';document.body.append(c);
 window.touchFixture={reset(){this.input?.dispose();this.r?.dispose();const r=this.r=createRun(104,()=>{},{waveMode:true});this.input=createInput(c,{get:()=>r,active:()=>true,point:(x,y)=>({x,y}),assist:()=>false,engage(){},commit:v=>r.dash(v),lock:{tick(){}}});}};touchFixture.reset();
 });
 const session=await p.createCDPSession();
 const send=(type,points=[])=>session.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:4,radiusY:4,force:1}))});
 const reset=()=>p.evaluate(()=>touchFixture.reset());
 const shots=()=>p.evaluate(()=>touchFixture.r.state.shots);
 // Relax from 24px back to 13px, below acquisition but outside cancellation.
 await send('touchStart',[[1,150,200]]);await send('touchMove',[[1,150,224]]);await send('touchMove',[[1,150,213]]);
 assert.ok(await p.evaluate(()=>touchFixture.input.aim?.y<0));await send('touchEnd');assert.equal(await shots(),1);
 const movement=await p.evaluate(()=>{const r=touchFixture.r,y=r.world.player.position.y;for(let i=0;i<8;i++)r.tick();return r.world.player.position.y-y;});assert.ok(movement<-10);checks++;
 // Deliberately return into the cancellation ring.
 await reset();await send('touchStart',[[1,150,200]]);await send('touchMove',[[1,150,230]]);await send('touchMove',[[1,150,204]]);await send('touchEnd');assert.equal(await shots(),0);checks++;
 // Native touch cancellation must never launch later.
 await reset();await send('touchStart',[[1,150,200]]);await send('touchMove',[[1,150,240]]);await send('touchCancel');await p.evaluate(()=>touchFixture.input.retry());assert.equal(await shots(),0);checks++;
 // Secondary fingers do not hijack or double-commit the primary gesture.
 await reset();await send('touchStart',[[1,150,200]]);await send('touchStart',[[1,150,200],[2,250,200]]);await send('touchMove',[[1,150,240],[2,220,200]]);await send('touchEnd',[[2,220,200]]);assert.equal(await shots(),0);await send('touchEnd');assert.equal(await shots(),1);checks++;
 assert.deepEqual(errors,[]);await p.close();
}console.log(`PASS ${checks} browser-native touch scenarios: relaxed release moves production cube, intentional return cancels, touchCancel never fires, second finger cannot hijack/double-fire`);
}finally{await browser.close()}
