import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox']});
try{for(const [width,height]of [[1280,720],[390,680],[860,440]]){
const p=await browser.newPage();await p.setViewport({width,height});await p.goto('http://localhost:3000');await p.evaluate(async()=>{
for(const d of document.querySelectorAll('dialog[open]'))d.close();const {createInput}=await import('/src/input.js'),{createRun}=await import('/src/run.js');const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:999;touch-action:none';document.body.append(c);const r=createRun(102,()=>{},{waveMode:true});for(const e of [...r.combat.enemies.values()])r.combat.remove(e);
window.pullFixture={r,input:createInput(c,{get:()=>r,active:()=>true,point:(x,y)=>({x,y}),assist:()=>false,engage(){},commit:v=>r.dash(v),lock:{tick(){}}})};
});
await p.mouse.move(150,200);await p.mouse.down();await p.mouse.move(150,220,{steps:4});await p.mouse.up();const result=await p.evaluate(()=>{const {r}=pullFixture;const before={...r.world.player.position};const speed=Math.hypot(r.world.player.velocity.x,r.world.player.velocity.y);for(let i=0;i<8;i++)r.tick();return{shots:r.state.shots,speed,dy:r.world.player.position.y-before.y};});assert.equal(result.shots,1);assert.ok(result.speed>=11);assert.ok(result.dy<-10,JSON.stringify(result));await p.close();
}console.log('PASS real captured short pull/release launches the production cube at three viewport sizes');}finally{await browser.close()}
