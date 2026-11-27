// Native pointer/keyboard/touch regression checks. No .click() handler bypasses.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
import {ITEMS, DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {SHOP_GROUPS} from '../src/shop-catalog.js';

const out = process.env.QA_OUT_DIR || '.arena/harmony-chunk5/browser';
mkdirSync(out, {recursive: true});
const browser = await puppeteer.launch({executablePath: process.env.CHROME_BIN || '/tmp/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 30000});
const results = [];
const afterPurchase = 1500 - ITEMS.find(i => i.id === 'neko').price;
async function pageFor(width, height, {allOwned = false, reduced = false, touch = false} = {}) {
  const page = await browser.newPage(), errors = [];
  await page.setViewport({width, height, deviceScaleFactor: 1, hasTouch: touch});
  page.on('pageerror', e => errors.push(e.message));
  await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference'}]);
  await page.evaluateOnNewDocument(({allOwned, reduced, items, defaults}) => {
    localStorage.setItem('riot.postfx', 'off'); localStorage.setItem('riot.tutorialCompleted', '1');
    localStorage.setItem('riot.motion', reduced ? '0' : '1');
    localStorage.setItem('riot.equipment', JSON.stringify({version: 1, owned: allOwned ? items : [],
      equipped: defaults, discovered: [], presets: [defaults, null, null]}));
    localStorage.setItem('riot.shop-wallet', JSON.stringify({version: 1, coins: 1500, owned: allOwned ? items : []}));
    let id = 0, stamp = performance.now(); const queue = new Map();
    window.requestAnimationFrame = fn => (queue.set(++id, fn), id);
    window.cancelAnimationFrame = id => queue.delete(id);
    window.qaFrames = n => {for (let i = 0; i < n; i++) {stamp += 1000 / 60; const q = [...queue.values()]; queue.clear(); q.forEach(fn => fn(stamp));}};
  }, {allOwned, reduced, items: ITEMS.map(i => i.id), defaults: DEFAULT_EQUIPMENT});
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5180', {waitUntil: 'networkidle0'});
  await page.click('#customize-btn'); await page.evaluate(() => qaFrames(4));
  return {page, errors};
}
const read = page => page.evaluate(() => ({equipment: JSON.parse(localStorage.getItem('riot.equipment')),
  wallet: JSON.parse(localStorage.getItem('riot.shop-wallet')), receipt: document.querySelector('.shop-receipt').textContent}));
try {
  for (const [width, height, touch] of [[1280,720,false], [960,540,false], [640,360,false], [390,844,true], [844,390,false], [320,568,true]]) {
    const {page, errors} = await pageFor(width, height, {touch});
    const nativeClick = async selector => {
      if (!touch) return page.click(selector);
      const target = await page.$(selector); await target.scrollIntoView(); await target.dispose(); await page.tap(selector);
    };
    const before = await read(page);
    const switches = await page.$eval('.custom-view-switch', n => getComputedStyle(n).display !== 'none');
    if (switches) {
      await nativeClick('.custom-view-switch button:last-child');
      const bounds = await page.$eval('.custom-lab', n => ({height: n.clientHeight, display: getComputedStyle(n).display}));
      assert.notEqual(bounds.display, 'none'); assert.ok(bounds.height >= 100);
      await nativeClick('.custom-view-switch button:first-child');
    }
    const gridHeight = await page.$eval('.custom-grid', n => n.clientHeight);
    assert.ok(gridHeight >= 100, `${width}x${height} collapsed grid: ${gridHeight}`);
    await nativeClick('[data-item="neko"]');
    assert.equal(await page.$eval('[data-item="neko"]', n => n.getAttribute('aria-pressed')), 'true');
    assert.deepEqual((await read(page)).equipment.equipped, before.equipment.equipped, 'try-on must not equip');
    assert.equal((await read(page)).wallet.coins, 1500);
    await nativeClick('.equip-part');
    let saved = await read(page);
    assert.equal(saved.wallet.coins, afterPurchase);
    assert.equal(saved.equipment.equipped.head, 'none', 'buy is not equip');
    assert.match(saved.receipt, /BOUGHT.*Owned, not equipped/);
    await nativeClick('.equip-part'); saved = await read(page);
    assert.equal(saved.equipment.equipped.head, 'neko'); assert.match(saved.receipt, /EQUIPPED.*Bare Head → Cyber Ears/);
    assert.equal(saved.wallet.coins, afterPurchase);
    assert.deepEqual(saved.equipment.presets, before.equipment.presets);
    await page.click('.shop-search'); await page.type('.shop-search', 'unmatched-part');
    assert.equal(await page.$$('.custom-card').then(a => a.length), 0);
    assert.ok(await page.$('.shop-empty'));
    await page.click('.shop-search', {clickCount: 3}); await page.keyboard.press('Backspace'); await page.type('.shop-search', 'gold halo');
    assert.deepEqual(await page.$$eval('.custom-card', nodes => nodes.map(n => n.dataset.item)), ['halo']);
    await nativeClick('[data-item="halo"]');
    await page.keyboard.press('Enter'); // Native keyboard activation must still only preview the card.
    assert.equal((await read(page)).equipment.equipped.head, 'neko');
    await page.click('.shop-search', {clickCount: 3}); await page.keyboard.press('Backspace');
    await nativeClick('[data-item="oni"]');
    assert.equal(await page.$eval('.equip-part', n => n.disabled), true);
    assert.equal((await read(page)).wallet.coins, afterPurchase);
    await nativeClick('.lab-exit');
    assert.equal(await page.$eval('.shape-lab', n => n.getAnimations({subtree: true}).length), 0, 'close releases all feedback');
    await page.click('#customize-btn');
    assert.equal((await read(page)).equipment.equipped.head, 'neko');
    if (process.env.QA_CAPTURE === '1' && width === 640) await page.screenshot({path: `${out}/shop-${width}x${height}.png`, timeout: 15000});
    assert.deepEqual(errors, []);
    results.push({width, height, nativeInput: touch ? 'touch + keyboard' : 'pointer + keyboard', gridHeight,
      previewNoSpend: true, buyThenEquip: true, presetsRetained: true, challengeLocked: true, search: true, closeCleanup: true, errors});
    await page.close();
  }
  // Walk every item with native input, checking the actual DOM identity and
  // matching details/power-sheet icon. Browsing cannot change saved equipment.
  const {page, errors} = await pageFor(960, 540, {allOwned: true});
  const before = await read(page), seen = [];
  for (const group of SHOP_GROUPS) {
    await page.click(`[data-group="${group.id}"]`);
    for (const slot of group.slots) {
      await page.click(`.shop-slots [data-slot="${slot}"]`);
      for (const item of ITEMS.filter(i => i.slot === slot)) {
        await page.click(`[data-item="${item.id}"]`);
        assert.equal(await page.$eval('.custom-card[aria-pressed=true]', n => n.dataset.item), item.id);
        assert.equal(await page.$eval('.custom-detail [data-item-icon]', n => n.dataset.itemIcon), item.id);
        seen.push(item.id);
      }
    }
  }
  assert.equal(new Set(seen).size, 73);
  assert.deepEqual((await read(page)).equipment.equipped, before.equipment.equipped);
  assert.deepEqual((await read(page)).wallet, before.wallet);
  await page.click('.power-info');
  assert.equal(await page.$eval('.power-sheet [data-item-icon]', n => n.dataset.itemIcon), 'void');
  await page.keyboard.press('Escape'); assert.equal(await page.$eval('.power-sheet', n => n.open), false);
  assert.deepEqual(errors, []); await page.close();
  results.push({all73NativeBrowse: true, matchingDetailIcons: true, powerSheetIcon: true, noSpendOrEquip: true, errors});
  const reduced = await pageFor(640, 360, {reduced: true});
  await reduced.page.click('[data-item="halo"]');
  assert.equal(await reduced.page.$eval('.shape-lab', n => n.dataset.motion), 'false');
  assert.equal(await reduced.page.$eval('.shape-lab', n => n.getAnimations({subtree: true}).length), 0);
  assert.deepEqual(reduced.errors, []); await reduced.page.close();
  results.push({reducedMotion: true, noAnimations: true});
  // Independent rejected-purchase boundary: an adapter failure must not grant
  // ownership/equipment, spend the wallet or leave active feedback on dispose.
  const failed = await pageFor(640, 360);
  await failed.page.keyboard.press('Escape');
  await failed.page.evaluate(async () => {
    const {createCustomize} = await import('/src/customize.js');
    const values = new Map();
    window.qaRejectedShop = createCustomize({storage: {get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v)},
      wallet: () => 1500, ownedParts: () => [], purchase: () => false, resetInput() {}, motion: () => false});
    document.querySelectorAll('.shape-lab').item(1).dataset.qa = 'rejected';
    window.qaRejectedShop.open();
  });
  await failed.page.click('[data-qa="rejected"] [data-item="halo"]');
  await failed.page.click('[data-qa="rejected"] .equip-part');
  assert.match(await failed.page.$eval('[data-qa="rejected"] .shop-receipt', n => n.textContent), /PURCHASE UNAVAILABLE/);
  assert.equal(await failed.page.evaluate(() => qaRejectedShop.snapshot().head), 'none');
  await failed.page.evaluate(() => qaRejectedShop.dispose());
  assert.equal(await failed.page.$$('[data-qa="rejected"]').then(a => a.length), 0);
  assert.deepEqual(failed.errors, []); await failed.page.close();
  results.push({rejectedPurchaseNoGrant: true, dispose: true});
  writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2) + '\n');
  console.log('PASS: 6 viewport transaction/search/input checks; native browsing of all 73 items; icon/detail parity; reduced motion; close cleanup; unchanged purchases/presets except explicit actions.');
} finally {
  let timer;
  try {await Promise.race([browser.close(), new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('Browser close timed out')), 5000);})]);}
  catch (error) {browser.process()?.kill('SIGKILL'); console.warn(error.message);}
  finally {clearTimeout(timer);}
}
