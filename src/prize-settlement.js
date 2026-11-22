import { PARTS, nextPrize } from './quests.js';

/** Pure settlement calculation. UI commits this result once, then renders the
 * frozen receipt. Animation, re-rendering and fast Retry cannot move balances.
 * Preserves the existing rule: death may unlock the selected cosmetic once;
 * overflow carries to the next track rather than auto-buying other cosmetics.
 */
export function settlePrizeTrack({ saved, coins, owned }, selected, earned) {
  if (
    !Number.isSafeInteger(saved) ||
    saved < 0 ||
    !Number.isSafeInteger(earned) ||
    earned < 0
  )
    throw new RangeError('Prize progress must be nonnegative integer points');
  let balance = saved + earned,
    wallet = coins;
  const items = [...owned],
    stages = [],
    unlocked = [];
  const target = PARTS.find((p) => p.id === selected);
  if (target && !items.includes(selected)) {
    const reached = balance >= target.cost;
    stages.push(
      Object.freeze({
        id: target.id,
        label: target.label,
        cost: target.cost,
        from: Math.min(saved, target.cost),
        to: Math.min(balance, target.cost),
        unlocked: reached,
      }),
    );
    if (reached) {
      balance -= target.cost;
      items.push(selected);
      unlocked.push(target.label);
    }
  }
  if (selected === 'chest' && balance >= 100) {
    const count = Math.floor(balance / 100);
    wallet += count * 100;
    balance %= 100;
    unlocked.push(count === 1 ? 'CREDIT CHEST' : `${count} CREDIT CHESTS`);
  }
  const next = nextPrize({ owned: items }),
    cost = next.cost || 100;
  // An existing selected track may differ from nextPrize (e.g. Wings selected
  // while Halo remains unowned). Display the true destination of the balance.
  const current = stages.find((s) => s.id === next.id && !s.unlocked);
  const meter = Object.freeze({
    id: next.id,
    label: next.label,
    cost,
    from: current?.from ?? (unlocked.length ? 0 : Math.min(saved, cost)),
    to: balance,
  });
  const receipt = Object.freeze({
    earned,
    previousSaved: saved,
    saved: balance,
    walletDelta: wallet - coins,
    unlocked: Object.freeze(unlocked),
    stages: Object.freeze(stages),
    meter,
  });
  return Object.freeze({
    saved: balance,
    coins: wallet,
    owned: Object.freeze(items),
    receipt,
  });
}
