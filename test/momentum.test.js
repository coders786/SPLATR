import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOMENTUM,
  createMomentum,
  stepMomentum,
  gainMomentum,
  pipCeilingScale,
  hyperChainFor,
  diminishingRebound,
} from '../src/momentum.js';

test('fresh ledger is empty and finite', () => {
  const m = createMomentum();
  assert.equal(m.count, 0);
  assert.equal(m.idle, 0);
  assert.equal(m.total, 0);
});

test('fills cap at three pips and refresh the decay clock', () => {
  const m = createMomentum();
  for (let i = 0; i < 5; i++) gainMomentum(m, 'cut');
  assert.equal(m.count, 3);
  assert.equal(m.total, 5, 'total counts fills, count caps');
  assert.equal(m.idle, 0, 'a fill always resets the clock');
});

test('one pip withers per 14 s of silence, never below zero', () => {
  const m = createMomentum();
  gainMomentum(m);
  gainMomentum(m);
  gainMomentum(m);
  for (let i = 0; i < MOMENTUM.decayTicks - 1; i++) stepMomentum(m, { dt: 1 });
  assert.equal(m.count, 3);
  stepMomentum(m, { dt: 1 });
  assert.equal(m.count, 2, 'exactly one pip withers per window');
  for (let i = 0; i < MOMENTUM.decayTicks * 2 + 10; i++) stepMomentum(m, { dt: 1 });
  assert.equal(m.count, 0, 'the ledger empties, never goes negative');
  assert.equal(m.idle, 0);
});

test('a mid-window fill saves the pip and the clock', () => {
  const m = createMomentum();
  gainMomentum(m);
  for (let i = 0; i < 400; i++) stepMomentum(m, { dt: 1 });
  gainMomentum(m);
  assert.equal(m.idle, 0);
  for (let i = 0; i < MOMENTUM.decayTicks - 1; i++) stepMomentum(m, { dt: 1 });
  assert.equal(m.count, 2, 'neither pip withered inside one clean window');
});

test('inactive ticks never wither pips', () => {
  const m = createMomentum();
  gainMomentum(m);
  const copy = { ...m };
  for (let i = 0; i < 5000; i++) stepMomentum(m, { dt: 1, active: false });
  assert.deepEqual(m, copy);
});

test('slow time advances the clock proportionally', () => {
  const a = createMomentum();
  const b = createMomentum();
  gainMomentum(a);
  gainMomentum(b);
  for (let i = 0; i < MOMENTUM.decayTicks; i++) stepMomentum(a, { dt: 1 });
  for (let i = 0; i < MOMENTUM.decayTicks * 10; i++) stepMomentum(b, { dt: 0.1 });
  assert.equal(a.count, 0);
  assert.equal(b.count, 0);
});

test('garbage input is clamped, never throws', () => {
  const m = createMomentum();
  gainMomentum(m);
  stepMomentum(m, { dt: NaN });
  assert.equal(m.count, 1);
  stepMomentum(m, { dt: -4 });
  assert.equal(m.count, 1);
  stepMomentum(m, { dt: 99 }); // clamped to a single tick, like ordinary dt
  assert.ok(m.count <= 1);
});

test('the ceiling boost needs two pips and only the boost, not speed', () => {
  assert.equal(pipCeilingScale(0), 1);
  assert.equal(pipCeilingScale(1), 1);
  assert.equal(pipCeilingScale(2), MOMENTUM.ceilingBoost);
  assert.equal(pipCeilingScale(3), MOMENTUM.ceilingBoost);
  assert.equal(pipCeilingScale(undefined), 1);
});

test('the hyper gate drops to 5 at full pips only', () => {
  assert.equal(hyperChainFor(0, 7), 7);
  assert.equal(hyperChainFor(1, 7), 7);
  assert.equal(hyperChainFor(2, 7), 7);
  assert.equal(hyperChainFor(3, 7), 5);
  assert.equal(hyperChainFor(99, 7), 5);
  assert.equal(hyperChainFor(undefined, 7), 7);
});

test('high-speed rebound diminishes instead of compounding at a flat multiplier', () => {
  assert.equal(diminishingRebound(0), 1.35);
  assert.equal(diminishingRebound(160), 1.35);
  assert.equal(diminishingRebound(320), 1.175);
  assert.ok(diminishingRebound(320) < diminishingRebound(160));
  assert.ok(diminishingRebound(900) > 1);
});

test('the ledger constants keep their promises', () => {
  assert.equal(MOMENTUM.max, 3);
  assert.equal(MOMENTUM.decayTicks, 840);
  assert.equal(MOMENTUM.fullPips, 3);
  assert.ok(MOMENTUM.paceRatio > 0.5 && MOMENTUM.paceRatio < 1, 'a cut must be genuinely at pace');
});
