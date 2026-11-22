import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const executablePath = process.env.CHROME_BIN;
if (!executablePath)
  throw new Error('Set CHROME_BIN to an installed Chromium executable');
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const out = '.arena/master-browser';
mkdirSync(out, { recursive: true });
const metrics = [];
try {
  for (const [width, height] of [
    [1280, 720],
    [550, 720],
    [860, 440],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(process.env.QA_URL || 'http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();localStorage.setItem('riot.started','1');
    });
    await page.reload();
    await page.click('#start-btn');
    assert.equal(
      await page.$$eval('.quest-mini .quest-row', (n) => n.length),
      0,
    );
    assert.equal(await page.$$eval('.quest-pip', (n) => n.length), 3);
    await page.keyboard.press('q');
    assert.equal(await page.$eval('.quest-peek', (n) => n.hidden), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('.quest-peek', (n) => n.hidden), true);
    assert.equal(
      await page.$eval('#game', (n) => n.dataset.screen),
      'run',
      'closing peek must not pause',
    );
    await page.keyboard.down('q');
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 300)),
    );
    await page.keyboard.up('q');
    assert.equal(
      await page.$eval('.quest-peek', (n) => n.hidden),
      true,
      'held peek must close on release',
    );
    assert.equal(await page.$eval('.quest-mini',n=>getComputedStyle(n).display),'none','quest pips intentionally moved off the arena');
    await page.keyboard.press('q');
    assert.equal(
      await page.$eval('.quest-peek', (n) => n.hidden),
      false,
      'Q still opens optional quest detail',
    );
    await page.keyboard.press('Escape');
    await page.keyboard.press('p');
    assert.equal(
      await page.$$eval('.pause-quests .quest-row', (n) => n.length),
      3,
    );
    await page.screenshot({ path: `${out}/pause-${width}x${height}.png` });
    if (await page.$eval('#skip-room', (n) => !n.hidden)) {
      await page.click('#skip-room');
      await page.keyboard.press('p');
    }
    await page.click('#end-btn');
    await page.waitForSelector('#result-page:not([hidden])');
    await page.evaluate(() => document.fonts.ready);
    // Stress the same card with a visible stroke and maximal-length metadata;
    // this is a layout fixture, not evidence that a player earned this score.
    await page.evaluate(() => {
      document.getElementById('best-print').hidden = false;
      document.getElementById('stroke-map').hidden = false;
      document.getElementById('result-score').textContent = '999999';
    });
    const result = await page.evaluate(() => {
      const ids = [
        'panel',
        'result-page',
        'retry-btn',
        'best-print',
        'stroke-map',
      ];
      const nodes = [
        ...ids.map((id) => document.getElementById(id)),
        ...document.querySelectorAll('#result-page button'),
      ];
      return {
        width: innerWidth,
        height: innerHeight,
        screen: document.getElementById('game').dataset.screen,
        elements: nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return {
            id: n.id || n.textContent.trim(),
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            scrollHeight: n.scrollHeight,
            clientHeight: n.clientHeight,
          };
        }),
      };
    });
    await page.screenshot({ path: `${out}/result-${width}x${height}.png` });
    metrics.push({ ...result, errors });
    for (const n of result.elements) {
      assert.ok(
        n.x >= -1 &&
          n.y >= -1 &&
          n.x + n.w <= width + 1 &&
          n.y + n.h <= height + 1,
        `offscreen ${width}x${height}: ${JSON.stringify(n)}`,
      );
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.ok(result.elements[3].h > 0, 'stroke fixture must be visible');
    const panel = result.elements[0];
    assert.ok(
      panel.scrollHeight <= panel.clientHeight + 1,
      `scrolling result at ${width}x${height}`,
    );
    await page.click('#retry-btn');
    assert.equal(await page.$eval('#game', (n) => n.dataset.screen), 'run');
    console.log(
      `PASS real browser ${width}x${height}: end-card/buttons in bounds, zero panel scroll, retry, zero JS errors`,
    );
    await page.close();
  }
} finally {
  writeFileSync(`${out}/metrics.json`, JSON.stringify(metrics, null, 2));
  await browser.close();
}
