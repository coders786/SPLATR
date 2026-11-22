import test from 'node:test';
import assert from 'node:assert/strict';
import { settlePrizeTrack } from '../src/prize-settlement.js';

const base = (saved = 0) =>
  Object.freeze({ saved, coins: 0, owned: Object.freeze([]) });
test('prize receipt captures exact progress without mutating its input', () => {
  const input = base(52),
    result = settlePrizeTrack(input, 'halo', 20);
  assert.equal(result.saved, 72);
  assert.equal(input.saved, 52);
  assert.deepEqual(result.receipt.meter, {
    id: 'halo',
    label: 'GOLD HALO',
    cost: 100,
    from: 52,
    to: 72,
  });
  assert.equal(result.receipt.earned, 20);
  assert.equal(result.receipt.walletDelta, 0);
  assert.ok(Object.isFrozen(result.receipt));
  assert.ok(Object.isFrozen(result.receipt.meter));
});
test('rollover records 92 to 100, grants only selected prize and carries twelve forward', () => {
  const result = settlePrizeTrack(base(92), 'halo', 20);
  assert.deepEqual(result.owned, ['halo']);
  assert.equal(result.saved, 12);
  assert.deepEqual(result.receipt.stages, [
    {
      id: 'halo',
      label: 'GOLD HALO',
      cost: 100,
      from: 92,
      to: 100,
      unlocked: true,
    },
  ]);
  assert.deepEqual(result.receipt.meter, {
    id: 'wings',
    label: 'PRISM WINGS',
    cost: 150,
    from: 0,
    to: 12,
  });
  assert.deepEqual(result.receipt.unlocked, ['GOLD HALO']);
});
test('large progress does not silently purchase subsequent cosmetics', () => {
  const result = settlePrizeTrack(base(92), 'halo', 220);
  assert.deepEqual(result.owned, ['halo']);
  assert.equal(result.saved, 212);
});
test('chest settlement preserves wallet/remainder rules and zero earnings remain exact', () => {
  const chest = settlePrizeTrack(base(92), 'chest', 220);
  assert.equal(chest.coins, 300);
  assert.equal(chest.saved, 12);
  assert.equal(chest.receipt.walletDelta, 300);
  const zero = settlePrizeTrack(base(52), 'halo', 0);
  assert.equal(zero.saved, 52);
  assert.equal(zero.receipt.meter.from, 52);
  assert.equal(zero.receipt.meter.to, 52);
});
test('invalid fractional/negative earnings are rejected rather than rounded into currency', () => {
  assert.throws(() => settlePrizeTrack(base(0), 'halo', -0.5), RangeError);
  assert.throws(() => settlePrizeTrack(base(0), 'halo', 1.5), RangeError);
});
