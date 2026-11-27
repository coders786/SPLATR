import {playerText} from '../src/shop-language.js';
// Chunk S1: real shop/discovery/preset flows; correctness, not an FPS benchmark.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS, DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {HYBRIDS, MUTATIONS} from '../src/hybrids.js';
import {swordProfile} from '../src/swords.js';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5180';
const out = process.env.QA_OUT_DIR || '.arena/harmony-chunk1/browser';
mkdirSync(out, {recursive: true});
const parts = id => HYBRIDS.find(r => r.id === id).parts;
const cases = [
  {ids: ['briar', 'razoredge'], winner: 'razoredge'},
  {ids: ['phantom', 'arcade'], winner: 'arcade'},
  {ids: ['phantom', 'wraith'], winner: 'wraith'},
  {ids: ['reaper', 'arcade'], winner: 'arcade'},
].map(c => ({...c, eq: {...DEFAULT_EQUIPMENT, ...parts(c.ids[0]), ...parts(c.ids[1])}}));
const equipment = {version: 1, owned: ITEMS.map(r => r.id), discovered: MUTATIONS.map(r => r.id), equipped: cases[0].eq, presets: cases.slice(1).map(c => c.eq)};
const wallet = {version: 1, coins: 1234, owned: ITEMS.map(r => r.id)};
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/tmp/chromium', headless: true,
  protocolTimeout: 60000,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const results = [];
try {
  for (const [width, height] of JSON.parse(process.env.QA_VIEWPORTS || '[[960,540],[640,360],[390,844],[844,390]]')) {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(10000);
    await page.setViewport({width, height, deviceScaleFactor: 1});
    await page.evaluateOnNewDocument(({equipment, wallet}) => {
      localStorage.clear();
      localStorage.setItem('riot.equipment', JSON.stringify(equipment));
      localStorage.setItem('riot.shop-wallet', JSON.stringify(wallet));
      localStorage.setItem('riot.tutorialCompleted', '1');
      localStorage.setItem('riot.postfx', 'off');
      // Explicitly advance a bounded number of frames for deterministic captures.
      let stamp = performance.now(), id = 0;
      const queue = new Map();
      window.requestAnimationFrame = fn => (queue.set(++id, fn), id);
      window.cancelAnimationFrame = id => queue.delete(id);
      window.qaFrames = n => {
        for (let i = 0; i < n; i++) {
          stamp += 1000 / 60;
          const callbacks = [...queue.values()]; queue.clear();
          callbacks.forEach(fn => fn(stamp));
        }
      };
    }, {equipment, wallet});
    await page.goto(base, {waitUntil: 'networkidle0'});
    await page.click('#customize-btn');
    await page.evaluate(() => qaFrames(4));
    if (width < 700) await page.click('.custom-view-switch button:last-child');
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i], expected = swordProfile(c.eq);
      // Advanced presets are intentionally hidden until practice tools open.
      // Exercise their real handler without asserting small-screen visibility.
      if (i) await page.$eval(`.preset-chip[data-preset="${i - 1}"]`, n => n.click());
      await page.evaluate(() => qaFrames(4));
      assert.ok((await page.$eval('.custom-hybrid', n => n.textContent)).includes(expected.buildTitle));
      assert.equal(await page.$eval('.shape-lab', n => n.dataset.sword), expected.family);
      const resolved = await page.evaluate(async eq => {
        const art = await import('/src/art/splatr-art-engine.js');
        const {swordProfile} = await import('/src/swords.js');
        const {hybridHint, mutationTitle} = await import('/src/hybrids.js');
        return {art: art.resolveArtDirection(eq).family, hint: hybridHint(eq), title: mutationTitle(eq), sword: swordProfile(eq).build};
      }, c.eq);
      assert.deepEqual(resolved, {art: c.winner, hint: expected.buildTitle, title: expected.buildTitle, sword: c.winner});
      await page.click('.destination-discoveries');
      for (const id of c.ids) {
        const ownProfile = swordProfile(parts(id));
        assert.equal(await page.$eval(`[data-mutation="${id}"] .build-behavior`, n => n.textContent), playerText(ownProfile.strength));
        assert.equal(await page.$eval(`[data-mutation="${id}"] .build-tradeoff`, n => n.textContent), playerText(ownProfile.cost));
        assert.ok(await page.$(`[data-mutation="${id}"].discovered`));
      }
      await page.click('.codex-close');
      await page.click('.destination-sword');
      assert.equal(await page.$eval('.sword-desk', n => n.dataset.family), expected.family);
      await page.click('.sword-desk-close');
    }
    // One real equip breaks Arcade and exposes Phantom, without another purchase.
    await page.$eval('.preset-chip[data-preset="0"]', n => n.click());
    if (width < 700) await page.click('.custom-view-switch button:first-child');
    await page.click('.shop-slots [data-slot="core"]');
    // Native pointer selection is required even at 640x360: no handler bypass.
    await page.click('[data-item="standard"]');
    await page.waitForFunction(() => document.querySelector('[data-item="standard"]').getAttribute('aria-pressed') === 'true');
    assert.match(await page.$eval('.shop-swap-warning', n => n.textContent), /SIGNATURE SWAP/);
    await page.click('.equip-part');
    assert.match(await page.$eval('.shop-receipt', n => n.textContent), /EQUIPPED.*SIGNATURE SWAP/);
    await page.evaluate(() => qaFrames(4));
    const fallbackLabel = await page.$eval('.custom-hybrid', n => n.textContent);
    if (!fallbackLabel.includes('CYBER PHANTOM')) {
      if (process.env.QA_CAPTURE === '1') await page.screenshot({path: `${out}/failed-equip-${width}x${height}.png`});
      console.log('Failed equip state', width, height, await page.evaluate(() => ({label: document.querySelector('.custom-hybrid').textContent, detail: document.querySelector('.custom-detail').textContent, eq: JSON.parse(localStorage.getItem('riot.equipment')).equipped})));
    }
    assert.ok(fallbackLabel.includes('CYBER PHANTOM'), `${width}x${height}: ${fallbackLabel}`);
    const saved = await page.evaluate(() => ({eq: JSON.parse(localStorage.getItem('riot.equipment')), wallet: JSON.parse(localStorage.getItem('riot.shop-wallet'))}));
    assert.deepEqual(saved.wallet, wallet);
    assert.deepEqual(saved.eq.owned, equipment.owned);
    assert.deepEqual(saved.eq.presets, equipment.presets);
    assert.ok(equipment.discovered.every(id => saved.eq.discovered.includes(id)));
    assert.equal(saved.eq.equipped.core, 'standard');
    assert.equal(swordProfile(saved.eq.equipped).build, 'phantom');
    if (width < 700) await page.click('.custom-view-switch button:last-child');
    await page.evaluate(() => qaFrames(4));
    // Optional: full-page screenshots can stall on the software GPU under load.
    if (process.env.QA_CAPTURE === '1') await page.screenshot({path: `${out}/phantom-fallback-${width}x${height}.png`});
    assert.deepEqual(errors, []);
    results.push({width, height, overlapFixtures: 4, fallback: 'arcade -> phantom', equipInput: 'native pointer', presetInput: 'handler activation: advanced controls hidden', walletUnchanged: true, discoveriesRetained: true, errors});
    await page.close();
  }
  writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2) + '\n');
  console.log(`PASS: ${results.length} viewports, four overlaps each, distinct discovery descriptions, preset-handler/equip fallback, unchanged wallet/ownership/presets. See results.json for native-input limitations.`);
} finally {
  for (const page of await browser.pages()) await page.close().catch(() => {});
  let timer;
  try {
    await Promise.race([browser.close(), new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('Browser close timed out')), 5000);})]);
  } catch (error) {
    browser.process()?.kill('SIGKILL');
    console.warn(error.message);
  } finally {
    clearTimeout(timer);
  }
}
