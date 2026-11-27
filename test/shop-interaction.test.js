import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {createCanvas, Path2D} from '@napi-rs/canvas';
import {ITEMS, DEFAULT_EQUIPMENT} from '../src/equipment.js';
import {swordProfile, SWORD_BUILDS} from '../src/swords.js';
import {shopItems, shopSwapNotice} from '../src/shop-catalog.js';
import {SHOP_ITEM_ICONS, shopItemIconMarkup, shopItemIconNode} from '../src/shop-item-icons.js';
import {createShopFeedback} from '../src/shop-feedback.js';

test('all 73 catalogue items have their own immutable original icon, with no orphan IDs', () => {
  assert.deepEqual(new Set(Object.keys(SHOP_ITEM_ICONS)), new Set(ITEMS.map(i => i.id)));
  assert.equal(ITEMS.length, 73); assert.ok(Object.isFrozen(SHOP_ITEM_ICONS));
  assert.equal(new Set(Object.values(SHOP_ITEM_ICONS)).size, 73);
  for (const item of ITEMS) {
    const markup = shopItemIconMarkup(item.id);
    assert.match(markup, /aria-hidden="true" focusable="false"/);
    assert.doesNotMatch(markup, /<text|<image|<filter|<animate|https:|<script|<foreignObject/);
  }
  for (const id of ['constructor', '__proto__', '<script>', 'missing', null]) assert.throws(() => shopItemIconMarkup(id), RangeError);
});

test('all icon paths rasterize distinctly and nonempty at 16px and 32px without leaking canvas state', () => {
  for (const size of [16, 32]) {
    const hashes = new Set();
    for (const [id, path] of Object.entries(SHOP_ITEM_ICONS)) {
      const c = createCanvas(size, size).getContext('2d'); c.save(); c.scale(size / 32, size / 32);
      c.strokeStyle = '#edf5ce'; c.lineWidth = 1.65; c.lineCap = c.lineJoin = 'round'; c.stroke(new Path2D(path)); c.restore();
      const pixels = c.getImageData(0, 0, size, size).data;
      assert.ok(pixels.some((v, i) => i % 4 === 3 && v > 0), id);
      hashes.add(createHash('sha256').update(pixels).digest('hex'));
      assert.equal(c.getTransform().a, 1);
    }
    assert.equal(hashes.size, 73, `${size}px raster identities`);
  }
});

test('decorative item icons preserve readable button labels and click behavior', () => {
  const w = new Window(), doc = w.document, b = doc.createElement('button');
  b.textContent = 'Gold Halo'; b.prepend(shopItemIconNode('halo', doc)); let clicks = 0; b.onclick = () => clicks++;
  b.click(); assert.equal(clicks, 1); assert.equal(b.textContent, 'Gold Halo');
  assert.equal(b.querySelector('svg').getAttribute('data-item-icon'), 'halo');
  w.happyDOM.abort();
});

test('search trims/casefolds literal names and composes with ownership and affordability filters', () => {
  assert.deepEqual(shopItems('head', {query: '  cYbEr EaRs  '}).map(i => i.id), ['neko']);
  assert.deepEqual(shopItems('head', {query: 'Cyber Ears', filter: 'owned', owned: []}), []);
  assert.deepEqual(shopItems('head', {query: 'Cyber Ears', filter: 'owned', owned: ['neko']}).map(i => i.id), ['neko']);
  assert.deepEqual(shopItems('head', {query: 'Cyber Ears', filter: 'affordable', wallet: 0}), []);
  assert.deepEqual(shopItems('head', {query: 'Cyber Ears', filter: 'affordable', wallet: 999}).map(i => i.id), ['neko']);
  assert.deepEqual(shopItems('head', {query: '<img onerror=x>'}), []);
  assert.deepEqual(shopItems('core', {query: 'Cyber Ears'}), []);
  assert.deepEqual(shopItems('head', {query: '   '}), shopItems('head'));
});

test('search discovers the literal current benefit, not unreleased powers', () => {
  const result = shopItems('head', {query: 'CHAIN'});
  assert.ok(result.length > 0); assert.ok(result.every(i => i.slot === 'head'));
});

test('signature notice distinguishes breaking, preserving and variant-to-variant swaps', () => {
  const standard = swordProfile(DEFAULT_EQUIPMENT);
  const arcade = swordProfile(SWORD_BUILDS.find(b => b.id === 'arcade').parts);
  const phantom = swordProfile(SWORD_BUILDS.find(b => b.id === 'phantom').parts);
  assert.equal(shopSwapNotice(standard, arcade), '');
  assert.equal(shopSwapNotice(arcade, arcade), '');
  assert.match(shopSwapNotice(arcade, standard), /^BREAKS .*STANDARD BLADE$/);
  assert.match(shopSwapNotice(arcade, phantom), /^SIGNATURE SWAP/);
  assert.ok(shopSwapNotice({...arcade, build: 'a'}, {...arcade, build: 'b'}), 'same family is not same build identity');
});

function fixture(motion = () => true) {
  const w = new Window(), root = w.document.createElement('dialog'), animations = [];
  w.document.body.append(root); root.setAttribute('open', '');
  function node(tag = 'button') {
    const n = w.document.createElement(tag); root.append(n);
    n.animate = (frames, options) => {
      let resolve, reject;
      const finished = new Promise((a, b) => {resolve = a; reject = b;});
      const a = {frames, options, finished, cancelled: false, cancel() {this.cancelled = true; reject(new Error('cancelled'));}, resolve};
      animations.push(a); return a;
    };
    return n;
  }
  const feedback = createShopFeedback(root, motion);
  return {w, root, animations, node, feedback, close() {feedback.dispose(); w.happyDOM.abort();}};
}

test('feedback has at most three active node animations, replaces old work and cancels on close', async () => {
  const f = fixture();
  try {
    const n = f.node(); f.feedback.pulse(n); f.feedback.pulse(n);
    assert.equal(f.animations[0].cancelled, true);
    for (let i = 0; i < 6; i++) f.feedback.pulse(f.node(), 'reveal');
    assert.equal(f.animations.filter(a => !a.cancelled).length, 3);
    assert.ok(f.animations.every(a => a.options.duration <= 220));
    f.root.dispatchEvent(new f.w.Event('close'));
    assert.ok(f.animations.every(a => a.cancelled)); await Promise.resolve();
  } finally {f.close();}
});

test('completion of an old cancelled animation cannot delete a replacement', async () => {
  const f = fixture();
  try {
    const n = f.node(); f.feedback.pulse(n); f.feedback.pulse(n); await Promise.resolve();
    f.feedback.stop(); assert.equal(f.animations[1].cancelled, true);
  } finally {f.close();}
});

test('finished animations release bookkeeping, disposal is idempotent and removes listeners', async () => {
  const f = fixture();
  try {
    const n = f.node(); n.textContent = 'Go'; n.click();
    assert.equal(f.animations.length, 1); f.animations[0].resolve(); await Promise.resolve();
    f.feedback.stop(); assert.equal(f.animations[0].cancelled, false);
    f.feedback.dispose(); f.feedback.dispose(); n.click(); f.feedback.pulse(n);
    assert.equal(f.animations.length, 1);
  } finally {f.close();}
});

test('reduced motion and missing Web Animations keep controls functional without effects', () => {
  const f = fixture(() => false);
  try {
    const n = f.node(); let clicks = 0; n.onclick = () => clicks++;
    n.click(); f.feedback.pulse(n); assert.equal(clicks, 1); assert.equal(f.animations.length, 0);
    const noAPI = f.w.document.createElement('div'); f.feedback.pulse(noAPI);
  } finally {f.close();}
});

test('a close inside the button handler cannot restart feedback while close dispatch is pending', () => {
  const f = fixture();
  try {
    const n = f.node(); f.feedback.pulse(n);
    n.onclick = () => f.root.removeAttribute('open'); n.click();
    assert.equal(f.animations.length, 1); assert.equal(f.animations[0].cancelled, true);
  } finally {f.close();}
});
