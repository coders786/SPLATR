// Isolated real-browser quest UI fixture, not a claim of earned gameplay.
// Load the real HTML/CSS/controller but replace main.js with an empty entry.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const output = '.arena/prize-browser';
mkdirSync(output, { recursive: true });
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
    await page.setRequestInterception(true);
    page.on('request', (r) =>
      new URL(r.url()).pathname === '/src/main.js'
        ? r.respond({
            status: 200,
            contentType: 'application/javascript',
            body: '// isolated quest fixture',
          })
        : r.continue(),
    );
    await page.goto(process.env.QA_URL || 'http://localhost:3000');
    await page.evaluate(async () => {
      const { createQuestUI } = await import('/src/quest-ui.js');
      const { createRun } = await import('/src/run.js');
      const values = new Map([
        [
          'quests',
          JSON.stringify({ unlock: 92, coins: 0, owned: [], heads: {} }),
        ],
      ]);
      const run = createRun(19, () => {}, { staged: false });
      run.state.phase = 'playing';
      document.querySelector('#boot')?.remove();
      document.querySelector('#game').removeAttribute('inert');
      document.querySelector('#title-screen').hidden = true;
      const ui = createQuestUI({
        getRun: () => run,
        storage: {
          get: (k, d) => values.get(k) || d,
          set: (k, v) => values.set(k, v),
        },
        audio: { lock() {}, zone() {} },
        resetInput() {},
        home() {},
        resume() {},
        view: () => ({ x: -500, y: -400, w: 1000, h: 800 }),
      });
      ui.start();
      for (let i = 0; i < 5; i++)
        ui.event('cut', { kind: 'fang', strokeKills: 1 });
      ui.event('sector', { band: 3 });
      ui.event('over');
      const before = values.get('quests');
      ui.event('over');
      if (values.get('quests') !== before)
        throw new Error('duplicate settlement');
      window.__prizeFixture = { profile: JSON.parse(before) };
      for (const id of ['pause', 'manual', 'options', 'result'])
        document.getElementById(id + '-page').hidden = id !== 'result';
      document.querySelector('#panel-heading').textContent = 'Run ended';
      document.querySelector('#panel').showModal();
      document.querySelector('#game').dataset.screen = 'result';
      await document.fonts.ready;
      await new Promise(requestAnimationFrame);
    });
    const result = await page.evaluate(() => {
      const panel = document.querySelector('#panel');
      const controls = [
        ...document.querySelectorAll(
          '#result-page button,.prize-unlocked,.prize-remaining',
        ),
      ].map((n) => {
        const r = n.getBoundingClientRect();
        return { text: n.textContent, x: r.x, y: r.y, w: r.width, h: r.height };
      });
      return {
        panel: panel.getBoundingClientRect().toJSON(),
        profile: window.__prizeFixture.profile,
        text: document.querySelector('.next-prize').textContent,
        controls,
        scroll: panel.scrollHeight - panel.clientHeight,
        particles: document.querySelectorAll('.prize-transfer').length,
      };
    });
    assert.equal(result.profile.unlock, 12);
    assert.deepEqual(result.profile.owned, ['halo']);
    assert.match(result.text, /GOLD HALO UNLOCKED/);
    assert.match(result.text, /12 \/ 150/);
    assert.match(result.text, /138 POINTS LEFT/);
    assert.ok(!result.text.includes('0 INK'));
    assert.ok(result.particles > 0, 'earned rows must emit transfer feedback');
    for (const r of result.controls)
      assert.ok(
        r.y >= 0 &&
          r.y + r.h <= height &&
          r.x >= 0 &&
          r.x + r.w <= width &&
          r.y + r.h <= result.panel.bottom &&
          r.y >= result.panel.top,
        `clipped rollover control: ${JSON.stringify(r)}`,
      );
    await page.screenshot({
      path: `${output}/rollover-${width}x${height}.png`,
    });
    assert.ok(
      result.scroll <= 1,
      `rollover result scrolls: ${JSON.stringify(result)}`,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: `${output}/rollover-${width}x${height}.png`,
    });
    console.log(
      `PASS rollover ${width}x${height}: 92+20 → Halo +12/150 Wings; feedback, idempotence and bounds`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
