import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createRun} from '../src/run.js';
import {placePlayer, stopPlayer} from '../src/physics.js';
import {equipmentRules, ITEMS, loadEquipment} from '../src/equipment.js';
import {PART_PERKS} from '../src/part-perks.js';
import {powerReadout} from '../src/power-readout.js';
import {shopStudy} from '../src/shop-catalog.js';
import {recoverFocus, focusRecoveryStudy} from '../src/focus-recovery.js';
import {drawNotchedVents, drawShopItemStudy} from '../src/art/splatr-art-engine.js';

function setup(equipment = {}) {
  const r = createRun(77, () => {}, {waveMode: true, equipment});
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.combat.add({id: 'sentinel', kind: 'fang', x: 700, y: -900, pinned: true, delay: 999999});
  r.state.phase = 'playing'; r.state.invul = 999999; r.state.wave.entry = 0;
  placePlayer(r.world, {x: -350, y: -400}); stopPlayer(r.world); r.world.grounded = false;
  return r;
}
const tick = r => {r.state.stop = 1; r.tick();};

test('Notched replaces the old aim discount with exactly12% passive recovery under the shared cap', () => {
  const rule = equipmentRules({body: 'notched'});
  assert.equal(PART_PERKS.notched.stat, 'recovery'); assert.equal(PART_PERKS.notched.value, 12);
  assert.equal(rule.focusDrain, 1); assert.equal(rule.focusRegen, 1.12);
  const stacked = equipmentRules({body: 'notched', eyes: 'glitch', world: 'synth', pointer: 'pointer-orbit', dash: 'dash-water'});
  assert.equal(stacked.focusRegen, 1.4);
});

test('the real passive authority grants12% more; recovery never changes physics or EDGE', () => {
  const paper = setup(), notched = setup({body: 'notched'});
  try {
    for (const r of [paper, notched]) {r.state.focus = .3; tick(r);}
    assert.ok(Math.abs((notched.state.focus - .3) / (paper.state.focus - .3) - 1.12) < 1e-12);
    assert.deepEqual(notched.world.player.position, paper.world.player.position);
    assert.deepEqual(notched.world.player.velocity, paper.world.player.velocity);
    assert.equal(notched.state.edge, paper.state.edge);
    assert.equal(notched.state.focusRecoveryActive, true); assert.equal(notched.state.focusRecoveryAge, 0);
    assert.ok(Math.abs(notched.state.focusRecoveryAmount - 1.12 / 250) < 1e-14);
  } finally {paper.dispose(); notched.dispose();}
});

test('holding aim drains the same as Paper; vents close immediately on aim, with no old8% discount', () => {
  const paper = setup(), notched = setup({body: 'notched'});
  try {
    for (const r of [paper, notched]) {r.state.focus = .5; tick(r); r.state.focus = .5; r.focus(true);}
    assert.equal(notched.state.focusRecoveryActive, false);
    for (const r of [paper, notched]) tick(r);
    assert.equal(notched.state.focus, paper.state.focus);
    assert.equal(notched.state.focusRecoveryAmount, 0);
    assert.equal(notched.state.focusRecoveryActive, false);
  } finally {paper.dispose(); notched.dispose();}
});

test('cancel spam cannot mint FOCUS or emit recovery particles; entry occurs on a real recovery step only', () => {
  const r = setup({body: 'notched', eyes: 'glitch', world: 'synth'});
  try {
    r.state.focus = .4; r.focus(true); tick(r); r.focus(false);
    const focus = r.state.focus, bursts = r.state.equipmentFx.bursts.length;
    for (let i = 0; i < 50; i++) r.focus(false);
    assert.equal(r.state.focus, focus); assert.equal(r.state.focusRecoveryActive, false);
    assert.equal(r.state.equipmentFx.bursts.length, bursts); assert.equal(bursts, 0);
    tick(r); assert.equal(r.state.focusRecoveryAge, 0);
    r.focus(false); tick(r); assert.equal(r.state.focusRecoveryAge, 1, 'unchanged input does not restart the entry phrase');
    for (let i = 0; i < 12; i++) tick(r);
    assert.equal(r.state.focusRecoveryAge, 8, 'bounded steady state, not a repeating particle clock');
  } finally {r.dispose();}
});

test('near-full clamps once, closes immediately, stays quiet at full and clears on dispose', () => {
  const r = setup({body: 'notched'});
  r.state.focus = .9999; tick(r);
  assert.equal(r.state.focus, 1); assert.equal(r.state.focusRecoveryActive, false);
  assert.equal(r.state.focusRecoveryAge, -1); tick(r); assert.equal(r.state.focusRecoveryAmount, 0);
  r.state.focus = .5; tick(r); assert.equal(r.state.focusRecoveryActive, true);
  r.dispose(); assert.equal(r.state.focusRecoveryActive, false); assert.equal(r.state.focusRecoveryAge, -1);
});

test('death/retirement and a committed launch cannot carry an active recovery entry', () => {
  for (const action of ['dash', 'retire', 'death']) {
    const r = setup({body: 'notched'});
    try {
      r.state.focus = .5; tick(r); assert.equal(r.state.focusRecoveryActive, true);
      if (action === 'dash') assert.equal(r.dash({x: 24, y: 0, power: 24 / 42}), true);
      else if (action === 'death') {r.state.hp=1;r.state.invul=0;r.hurt('QA');assert.equal(r.state.phase,'dying');}
      else r.retire();
      assert.equal(r.state.focusRecoveryActive, false);
    } finally {r.dispose();}
  }
});

test('existing owners/price/IDs/presets survive this perk replacement', () => {
  const raw = JSON.stringify({owned: ['notched'], equipped: {body: 'notched'}, presets: [{body: 'notched'}, null, null]});
  const state = loadEquipment(raw);
  assert.equal(ITEMS.find(i => i.id === 'notched').price, 320);
  assert.equal(state.equipped.body, 'notched'); assert.equal(state.presets[0].body, 'notched');
});

test('receipts report actual marginal contribution at the shared cap, never the removed discount', () => {
  const plain = powerReadout('notched'); assert.equal(plain.title, 'VENT COOLING');
  assert.match(plain.chips[0], /\+12%/); assert.doesNotMatch(plain.detail, /8%|less FOCUS|efficiency/i);
  const almost = powerReadout('notched', {eyes: 'glitch', world: 'synth', pointer: 'pointer-orbit'});
  assert.equal(almost.chips[0], 'RECOVERY +3%');
  const capped = powerReadout('notched', {eyes: 'glitch', world: 'synth', pointer: 'pointer-orbit', dash: 'dash-water'});
  assert.equal(capped.chips[0], 'RECOVERY +0%'); assert.equal(capped.chips[1], 'TOTAL +40% / CAP 40%');
});

const ventImage = (pose, body = 'notched') => {
  const canvas = createCanvas(160,160), c = canvas.getContext('2d'); c.translate(80,50); c.scale(45,45);
  c.globalAlpha = .6; const before = c.getTransform();
  drawNotchedVents(c, Object.freeze({body, core: 'echo'}), Object.freeze(pose));
  assert.deepEqual(c.getTransform(), before); assert.equal(c.globalAlpha, .6);
  return canvas.toBuffer('image/png');
};
const recovering = {focusRecovering: true, focusLevel: .4, recoveryAge: 8};

test('vent gates read true recovery, stay dark at idle/aim/full and never style another shell', () => {
  const empty = ventImage({});
  assert.notDeepEqual(ventImage(recovering), empty);
  for (const p of [{...recovering, aiming: true}, {...recovering, focusLevel: 1}, {...recovering, focusRecovering: false}]) {
    assert.deepEqual(ventImage(p), empty);
  }
  assert.deepEqual(ventImage(recovering, 'paper'), empty);
});

test('entry adds only a short graphic pair; reduced motion retains static gates without entry motion', () => {
  assert.notDeepEqual(ventImage({...recovering, recoveryAge: 0}), ventImage(recovering));
  assert.deepEqual(ventImage({...recovering, recoveryAge: 0, reducedMotion: true}), ventImage({...recovering, reducedMotion: true}));
});

test('shop comparison uses the same real recovery step and reaches full without overfill', () => {
  const elapsed = 1550, demo = focusRecoveryStudy(elapsed);
  let expected = .2; for (let i = 0; i < 60; i++) expected = recoverFocus(expected, 1.12);
  assert.ok(Math.abs(demo.focus - expected) < 1e-12); assert.ok(demo.focus > demo.without);
  assert.equal(demo.active, true);
  assert.equal(focusRecoveryStudy(4200).active, false); assert.equal(focusRecoveryStudy(4200).focus, 1);
  assert.equal(focusRecoveryStudy(100).held, true);
  assert.deepEqual(focusRecoveryStudy(0, {motion: false}), focusRecoveryStudy(3000, {motion: false}));
  const capped = focusRecoveryStudy(1550, {rate: 1.4, withoutRate: 1.4});
  assert.equal(capped.focus, capped.without); assert.equal(capped.marginal, 0);
});

test('the shop draws a distinct hold/recover/full phrase, balances canvas state, and reduced motion is stable', () => {
  const item = ITEMS.find(i => i.id === 'notched');
  const image = (time, motion = true) => {
    const canvas = createCanvas(480,300), c = canvas.getContext('2d'); c.translate(1,2); c.globalAlpha = .7;
    const before = c.getTransform();
    drawShopItemStudy(c,480,300,{study: shopStudy(item,time,motion), equipment: {body: 'notched'}});
    assert.deepEqual(c.getTransform(),before); assert.equal(c.globalAlpha,.7);
    return canvas.toBuffer('image/png');
  };
  assert.notDeepEqual(image(100),image(1700)); assert.notDeepEqual(image(1700),image(4200));
  assert.deepEqual(image(0,false),image(3500,false));
});
