import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'/tmp/chromium',headless:true,args:['--no-sandbox']});
try{const p=await b.newPage();await p.setViewport({width:1280,height:720});await p.goto('http://localhost:3000');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('riot.started','1')});await p.reload();await p.click('#customize-btn');await p.mouse.move(10,10);
const image=()=>p.$eval('.custom-lab>canvas',c=>c.toDataURL());const sleep=t=>new Promise(r=>setTimeout(r,t));
const moving=async()=>{const frames=new Set();for(let i=0;i<16;i++){frames.add(await image());await sleep(200);}assert.ok(frames.size>3,'loop must include multiple moving frames across its deliberate result hold');};await moving();await p.click('.shop-demo-play');await sleep(100);const paused=await image();await sleep(600);assert.equal(await image(),paused);await p.click('.shop-demo-play');await sleep(3300);await moving();
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await sleep(100);const still=await image();await sleep(500);assert.equal(await image(),still);assert.equal(await p.$eval('.shop-demo-play',e=>e.disabled),true);console.log('PASS side animation continues beyond first loop, pause freezes, resume works, reduced motion stays still');}finally{await b.close()}
