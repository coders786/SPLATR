// Test the actual shared server, not a file:// copy or a top-level tab.
// Point PREVIEW_URL at another instance if npm start isn't on its default port.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const url = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:5173/').href;
const args = JSON.parse(process.env.CHROME_ARGS || '[]');
assert.ok(!args.includes('--disable-web-security'), 'Keep browser origin checks on for this test');
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: 'chrome' }),
  args,
});
try {
  const page = await browser.newPage();
  const errors = [],
    dependencies = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 900, height: 730 });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !(r.isNavigationRequest() && r.url() === url)) {
      dependencies.push(r.url());
      return r.abort();
    }
    return r.continue();
  });
  await page.evaluate((src) => {
    const f = document.createElement('iframe');
    f.width = '880';
    f.height = '710';
    f.setAttribute('sandbox', 'allow-scripts');
    f.src = src;
    document.body.append(f);
  }, url);
  const frame = await (await page.waitForSelector('iframe')).contentFrame();
  await frame.waitForSelector('#start-btn', { visible: true, timeout: 8000 });
  assert.deepEqual(
    await frame.evaluate(() => {
      const canvas = document.getElementById('arena');
      return [
        self.origin,
        getComputedStyle(canvas).position,
        canvas.clientWidth,
        canvas.clientHeight,
        document.getElementById('boot') === null,
      ];
    }),
    ['null', 'absolute', 880, 710, true],
  );
  const place = (where) => frame.waitForSelector(`#hud[data-place="${where}"]`, { visible: true });
  const scene=k=>frame.waitForFunction(key=>document.querySelector('#arena').dataset.scene===key,{timeout:9000},k);
  const press = () => page.keyboard.press('Space');
  const bank = async () => {
    await page.keyboard.press('p');
    await frame.click('#end-btn');
  };
  await frame.click('#start-btn');
  await place('room');
  // Storage is denied here. Complete the actual wordless room. A retry in
  // the SAME document must go straight to the field, with no proof strip.
  await scene('tap');
  for(const next of ['pull','shell','crack','lane']){await press();await scene(next);}
  await place('field');
  assert.equal(await frame.$eval('#score',n=>Number(n.textContent)),5700);
  await bank();await frame.click('#retry-btn');await place('field');
  assert.equal(await frame.$eval('#arena',n=>n.hasAttribute('data-scene')),false);
  await bank();await frame.click('#home-btn');await frame.click('#options-btn');await frame.click('#opening-opt');
  await frame.click('#options-page .back');await frame.click('#start-btn');await place('field');await press();
  await frame.waitForFunction(
    () =>
      Number(document.getElementById('stroke-award').textContent.replace(/[^0-9]/g, '')) >= 1500 &&
      !document.getElementById('imprint').hidden,
    { timeout: 6000 },
  );
  await page.keyboard.press('p');
  await frame.waitForSelector('#resume-btn', { visible: true });
  assert.deepEqual(dependencies, [], 'Preview tried to fetch assets outside its HTML');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: scripts-only opaque preview played the wordless room, remembered first Start without storage, and scored a full-field Throughcut using only its HTML.',
  );
} finally {
  await browser.close();
}
