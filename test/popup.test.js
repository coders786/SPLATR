import test from 'node:test';
import assert from 'node:assert/strict';
import { recordPopup, MERGE_R, MERGE_AGE } from '../src/renderer.js';

const cut = (x, y, points = 100) => ({ x, y, r: 20, points, cut: 0, small: false });
const age = (pops, dt = 1) => { for (const p of pops) p.age += dt; };

test('a second cut on the same spot folds into the first number', () => {
  const pops = [];
  recordPopup(pops, cut(100, 100, 100));
  age(pops);
  recordPopup(pops, cut(104, 98, 200));
  assert.equal(pops.length, 1, 'one popup, not two');
  assert.equal(pops[0].text, '+300', 'and it carries the true total');
  assert.equal(pops[0].beat, 1, 'merge snaps the number so the eye catches it');
});

test('a merged popup gets its full life back', () => {
  const pops = [];
  recordPopup(pops, cut(100, 100));
  pops[0].life = 6;
  age(pops);
  recordPopup(pops, cut(100, 100));
  assert.equal(pops[0].life, 40);
});

test('a merge is refused once the popup is older than the window', () => {
  const pops = [];
  recordPopup(pops, cut(100, 100));
  age(pops, MERGE_AGE + 1);
  recordPopup(pops, cut(100, 100));
  assert.equal(pops.length, 2, 'stale numbers do not absorb new ones');
});

test('cuts far apart stay separate', () => {
  const pops = [];
  recordPopup(pops, cut(0, 0));
  recordPopup(pops, cut(MERGE_R + 1, 0));
  assert.equal(pops.length, 2);
});

test('a throughcut is always drawn big, even when small points', () => {
  const pops = [];
  recordPopup(pops, { ...cut(0, 0, 10), throughcut: true });
  assert.equal(pops[0].big, true);
});

test('sibling popups never share a row', () => {
  const pops = [];
  // Same x, 10 px apart vertically: inside the offset band but outside MERGE_R
  // when measured from baseY after the first has been nudged.
  recordPopup(pops, cut(0, 0));
  recordPopup(pops, cut(0, 20));
  recordPopup(pops, cut(0, 40));
  const rows = pops.map((p) => Math.round(p.baseY));
  assert.equal(new Set(rows).size, rows.length, `rows must differ: ${rows}`);
  for (let i = 1; i < pops.length; i++) {
    assert.ok(Math.abs(pops[i].baseY - pops[i - 1].baseY) >= 14, 'min row gap');
  }
});
