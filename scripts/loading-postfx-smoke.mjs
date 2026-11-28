// Exercise the shipped single-file build, including a stalled module and the
// GPU fallback. PREVIEW_URL points at the same server as test:preview.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const url = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:5173/').href;
const html = await (await fetch(url)).text();
assert.match(html, /<script type="module"/);
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {channel: 'chrome'}),
  args: JSON.parse(process.env.CHROME_ARGS || '[]'),
});
try {
  // Deliberately prevent the game module from executing, but leave the inline
  // bootstrap intact. Shorten only the watchdog timer in this test response.
  for (const [width, height] of [[1280,720], [390,844]]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    await page.setViewport({width,height});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.setRequestInterception(true);
    page.on('request', req => req.isNavigationRequest()
      ? req.respond({status:200,contentType:'text/html',body:html.replace('<script type="module"', '<script type="text/plain"').replace('},12000);','},20);')})
      : req.continue());
    await page.goto(url, {waitUntil:'domcontentloaded'});
    await page.waitForSelector('#boot-help', {visible:true});
    assert.equal(await page.$eval('#game', el => el.hasAttribute('inert')), true);
    assert.match(await page.$eval('#boot-status', el => el.textContent), /Still preparing/);
    assert.equal(await page.$eval('.boot-ring', el => getComputedStyle(el).animationName), 'none');
    const rect = await page.$eval('.boot-shell', el => {const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
    assert.ok(rect.left>=0 && rect.right<=width && rect.top>=0 && rect.bottom<=height, JSON.stringify(rect));
    await context.close();
  }

  const noJS = await browser.createBrowserContext(), staticPage = await noJS.newPage();
  await staticPage.setJavaScriptEnabled(false);await staticPage.goto(url);
  assert.match(await staticPage.$eval('noscript', el=>el.textContent), /JavaScript is required/);
  assert.equal(await staticPage.$eval('#game', el=>getComputedStyle(el).visibility), 'hidden');
  await noJS.close();

  // Exercise the actual shader at a portrait mobile viewport as well.
  const mobile = await browser.createBrowserContext(), phone = await mobile.newPage(), mobileErrors=[];
  phone.on('pageerror', e=>mobileErrors.push(e.message));
  await phone.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await phone.goto(url);await phone.waitForSelector('#start-btn',{visible:true});
  await phone.click('#options-btn');await phone.click('#postfx-opt');await phone.click('#options-page .back');
  await phone.click('#start-btn');await phone.keyboard.press('Space');
  await phone.waitForFunction(() => getComputedStyle(document.querySelector('#arena')).opacity === '0',{timeout:10000});
  assert.deepEqual(mobileErrors,[]);await mobile.close();

  // The real WebGL shader compiles and displays, preferences survive reload,
  // and Off restores the original Canvas immediately.
  const context = await browser.createBrowserContext(), page = await context.newPage(), errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({width:1000,height:700});
  await page.goto(url); await page.waitForSelector('#start-btn',{visible:true});
  await page.click('#options-btn'); await page.click('#postfx-opt');
  assert.match(await page.$eval('#postfx-opt', el=>el.textContent), /On/);
  await page.click('#postfx-strength-opt');
  assert.match(await page.$eval('#postfx-strength-opt', el=>el.textContent), /Vivid/);
  await page.reload(); await page.waitForSelector('#options-btn',{visible:true}); await page.click('#options-btn');
  assert.match(await page.$eval('#postfx-opt', el=>el.textContent), /On/);
  assert.match(await page.$eval('#postfx-strength-opt', el=>el.textContent), /Vivid/);
  await page.click('#options-page .back'); await page.click('#start-btn'); await page.keyboard.press('Space');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.uber-postfx') || document.body).display === 'block' && getComputedStyle(document.querySelector('#arena')).opacity === '0', {timeout:10000});
  await page.keyboard.press('p'); await page.waitForSelector('#pause-options',{visible:true}); await page.click('#pause-options');
  await page.click('#postfx-opt'); // On -> Off
  assert.equal(await page.$eval('#postfx-strength-opt', el=>el.disabled), true);
  assert.equal(await page.$('.uber-postfx'), null);
  assert.notEqual(await page.$eval('#arena', el=>getComputedStyle(el).opacity), '0');
  assert.deepEqual(errors,[]); await context.close();

  const fallback = await browser.createBrowserContext(), p = await fallback.newPage();
  const fallbackErrors=[];p.on('pageerror', e=>fallbackErrors.push(e.message));
  await p.evaluateOnNewDocument(() => {const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};});
  await p.goto(url);await p.waitForSelector('#start-btn',{visible:true});await p.click('#options-btn');await p.click('#postfx-opt');await p.click('#options-page .back');await p.click('#start-btn');await p.keyboard.press('Space');
  await p.waitForSelector('#hud',{visible:true});
  assert.equal(await p.$('.uber-postfx'),null);assert.notEqual(await p.$eval('#arena',el=>getComputedStyle(el).opacity),'0');
  assert.deepEqual(fallbackErrors,[]);await fallback.close();
  console.log('PASS: responsive reduced-motion loader, recovery help, WebGL intensity/persistence, Off and Canvas fallback.');
} finally { await browser.close(); }
