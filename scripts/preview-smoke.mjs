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
  // A new save starts directly in the arcade, even when storage is denied.
  await frame.click('#start-btn');
  await frame.waitForFunction(() => document.querySelector('#game').dataset.learning === 'false');
  await frame.waitForSelector('#hud', { visible: true });
  assert.equal(await frame.$('#story-chip'), null);
  // Combat starts immediately; a launch, pause and resume remain available.
  await page.keyboard.press('Space');
  await frame.waitForFunction(() => !document.querySelector('.wave-hud')?.hidden, { timeout: 8000 });
  await page.keyboard.press('p');
  await frame.waitForSelector('#resume-btn', { visible: true });
  await frame.click('#resume-btn');
  await frame.waitForSelector('#hud', { visible: true });
  assert.deepEqual(dependencies, [], 'Preview tried to fetch assets outside its HTML');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: scripts-only opaque preview starts directly in arcade combat, launches, pauses and resumes using only its HTML.',
  );
} finally {
  await browser.close();
}
