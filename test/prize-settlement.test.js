import test from 'node:test';
import assert from 'node:assert/strict';
import { settlePrizeTrack } from '../src/prize-settlement.js';

const base = (saved = 0) =>
  Object.freeze({ saved, coins: 0, owned: Object.freeze([]) });
test('prize receipt captures exact progress without mutating its input', () => {
  // CHUNK 5: the ladder was repriced (halo 100 -> 40) so the tutorial can pay
  // for it. The property is unchanged: the receipt must record exact progress.
  const input = base(20),
    result = settlePrizeTrack(input, 'halo', 15);
  assert.equal(result.saved, 35);
  assert.equal(input.saved, 20);
  // 20 + 15 = 35 has NOT crossed halo's 40, so the meter stays on halo and
  // records exact progress. (Deliberately not crossing: the rollover case is
  // the next test.) The point of this one is the receipt's numbers.
  assert.deepEqual(result.receipt.meter, {
    id: 'halo',
    label: 'GOLD HALO',
    cost: 40,
    from: 20,
    to: 35,
  });
  assert.equal(result.receipt.earned, 15);
  assert.equal(result.receipt.walletDelta, 0);
  assert.ok(Object.isFrozen(result.receipt));
  assert.ok(Object.isFrozen(result.receipt.meter));
});
test('rollover records 32 to 40, grants only selected prize and carries twelve forward', () => {
  const result = settlePrizeTrack(base(32), 'halo', 20);
  assert.deepEqual(result.owned, ['halo']);
  assert.equal(result.saved, 12);
  assert.deepEqual(result.receipt.stages, [
    {
      id: 'halo',
      label: 'GOLD HALO',
      cost: 40,
      from: 32,
      to: 40,
      unlocked: true,
    },
  ]);
  assert.deepEqual(result.receipt.meter, {
    id: 'wings',
    label: 'PRISM WINGS',
    cost: 75,
    from: 0,
    to: 12,
  });
  assert.deepEqual(result.receipt.unlocked, ['GOLD HALO']);
});
test('large progress does not silently purchase subsequent cosmetics', () => {
  // CHUNK 5: prices dropped 100/150/200 -> 40/75/120, so the old 92+220 would
  // legitimately cross two thresholds. What this test is about is that a big
  // balance grants exactly ONE prize; it now starts below halo and ends above
  // it, so the property is still what is being measured.
  const result = settlePrizeTrack(base(10), 'halo', 220);
  assert.deepEqual(result.owned, ['halo']);
  assert.equal(result.saved, 190);
});
test('chest settlement preserves wallet/remainder rules and zero earnings remain exact', () => {
  const chest = settlePrizeTrack(base(92), 'chest', 220);
  assert.equal(chest.coins, 300);
  assert.equal(chest.saved, 12);
  assert.equal(chest.receipt.walletDelta, 300);
  const zero = settlePrizeTrack(base(32), 'halo', 0);
  assert.equal(zero.saved, 32);
  assert.equal(zero.receipt.meter.from, 32);
  assert.equal(zero.receipt.meter.to, 32);
});
test('invalid fractional/negative earnings are rejected rather than rounded into currency', () => {
  assert.throws(() => settlePrizeTrack(base(0), 'halo', -0.5), RangeError);
  assert.throws(() => settlePrizeTrack(base(0), 'halo', 1.5), RangeError);
});
