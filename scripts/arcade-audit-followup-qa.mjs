// Browser regression for the compact radar pass, one-step Garage purchases,
// and restarting from the pause overlay at desktop and phone sizes.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:5173/');base.searchParams.set('debug','1');
const browser=await puppeteer.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'}),args:JSON.parse(process.env.CHROME_ARGS||'[]')});
try{
 for(const [width,height] of [[1100,700],[390,844]]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height,hasTouch:width<600});
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('riot.shop-wallet',JSON.stringify({version:1,coins:1500,owned:[]}));localStorage.setItem('riot.postfx','off');});
  await page.goto(base.href);await page.waitForSelector('#customize-btn',{visible:true});await page.click('#customize-btn');
  assert.equal(await page.$eval('.shape-lab',e=>e.dataset.tools),'on');
  assert.equal(await page.$eval('.custom-lab>canvas',e=>e.getAttribute('role')),'application');
  await page.$eval('[data-item="coil"]',e=>e.click());
  if(width<600)await page.$eval('.custom-view-switch button:last-child',e=>e.click());
  await page.$eval('.preview-purchase',e=>e.click());
  const bought=await page.evaluate(()=>({equipment:JSON.parse(localStorage.getItem('riot.equipment')),wallet:JSON.parse(localStorage.getItem('riot.shop-wallet'))}));
  assert.equal(bought.equipment.equipped.head,'coil');assert.ok(bought.equipment.owned.includes('coil'));assert.ok(bought.wallet.coins<1500);
  const amount=bought.wallet.coins;await page.$eval('.preview-purchase',e=>e.click());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('riot.shop-wallet')).coins),amount);
  await page.$eval('.lab-exit',e=>e.click());await page.click('#start-btn');
  await page.waitForFunction(()=>window.__riot&&window.__riot.state.phase==='ready');
  await page.evaluate(()=>{window.__riot.state.invul=9999;window.__riot.state.shots=3;});
  await page.keyboard.press('Escape');await page.waitForSelector('#pause-restart',{visible:true});await page.click('#pause-restart');
  await page.waitForFunction(()=>window.__riot.state.phase==='ready'&&window.__riot.state.shots===0);
  assert.equal(await page.$eval('#panel',e=>e.open),false);assert.equal(await page.evaluate(()=>window.__riot.state.equipment.head),'coil');
  // Launch into live combat and exercise rendering with off-screen contacts.
  await page.mouse.move(width*.5,height*.55);await page.mouse.down();await page.mouse.move(width*.75,height*.4);await page.mouse.up();
  await page.waitForFunction(()=>window.__riot.state.shots===1);
  await new Promise(resolve=>setTimeout(resolve,600));assert.deepEqual(errors,[]);
  console.log(`PASS ${width}x${height}: live Garage, one-step purchase, no duplicate spend, fresh pause restart and render`);
  await context.close();
 }
}finally{await browser.close();}
