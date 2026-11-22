// Exercise the real quest controller and draw its real sanctuary canvas.
// This is a canvas capture, NOT a Chromium/CSS layout screenshot.
import { Window } from 'happy-dom';
import { createCanvas } from '@napi-rs/canvas';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import Matter from 'matter-js';
import { createRun } from '../src/run.js';
import { createQuestUI } from '../src/quest-ui.js';
import assert from 'node:assert/strict';
const window = new Window();
globalThis.document = window.document;
window.document.body.innerHTML = readFileSync(
  new URL('../index.html', import.meta.url),
  'utf8',
);
window.Element.prototype.animate = () => ({});
const backing = new WeakMap();
window.HTMLCanvasElement.prototype.getContext = function () {
  if (!backing.has(this)) backing.set(this, createCanvas(900, 730));
  return backing.get(this).getContext('2d');
};
const frames = [];
globalThis.requestAnimationFrame = (fn) => {
  frames.push(fn);
  return frames.length;
};
const run = createRun(19, () => {}, { staged: false });
run.state.phase = 'playing';
const storageMap = new Map();
let banked = false;
const ui = createQuestUI({
  getRun: () => run,
  storage: {
    get: (k, d) => storageMap.get(k) || d,
    set: (k, v) => storageMap.set(k, v),
  },
  audio: { lock() {}, zone() {} },
  resetInput() {},
  home() {
    banked = true;
  },
  resume() {},
  view: () => ({ x: -500, y: -500, w: 1000, h: 800 }),
});
const scene = document.querySelector('.vault-scene');
Object.defineProperties(scene, {
  clientWidth: { value: 900 },
  clientHeight: { value: 730 },
});
document
  .querySelectorAll('.quest-columns>div')[1]
  .querySelector('button')
  .click();
ui.start();
for (let i = 0; i < 5; i++) {
  ui.event('dash');
  ui.event('cut', { kind: 'fang', strokeKills: 2 });
}
ui.event('sector', { band: 3 });
assert.ok(run.state.questPortal);
Matter.Body.setPosition(run.world.player, run.state.questPortal);
for (let i = 0; i < 31; i++) ui.tick();
assert.equal(ui.vault, true);
document.querySelector('#title-screen').hidden = true;
for (let i = 0; i < 100; i++) {
  const batch = frames.splice(0);
  for (const fn of batch) fn((i * 1000) / 60);
}
const out = '.arena/master-qa';
mkdirSync(out, { recursive: true });
writeFileSync(
  `${out}/vault-bestowal.png`,
  backing.get(scene.querySelector('canvas')).toBuffer('image/png'),
);
const saved = JSON.parse(storageMap.get('quests'));
assert.ok(saved.owned.includes('halo'));
assert.equal(saved.coins, 30);
document.querySelectorAll('.vault-actions button')[1].click();
assert.ok(banked);
assert.equal(ui.vault, false);
console.log(
  `PASS: 3/3 → portal → Vault → halo +30 ink → BANK & END; canvas ${out}/vault-bestowal.png`,
);
run.dispose();
await window.happyDOM.abort();
