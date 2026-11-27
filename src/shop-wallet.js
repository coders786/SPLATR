import { ITEMS } from './equipment.js';
import { roundReward } from './round-rewards.js';

const amount = v => Number.isSafeInteger(v) && v >= 0 ? v : 0;
const parse = raw => { try { return JSON.parse(raw) || {}; } catch { return {}; } };
/** Standalone economy. Old quest saves are read once, never advanced or overwritten. */
export function createShopWallet(storage, { unlimited = false } = {}) {
  const raw = storage.get('shop-wallet', null);
  const saved = parse(raw ?? storage.get('quests', '{}'));
  const owned = new Set((Array.isArray(saved.owned) ? saved.owned : []).filter(id => ITEMS.some(x => x.id === id)));
  let coins = amount(saved.coins), activeRun = null, settled = false;
  const save = () => storage.set('shop-wallet', JSON.stringify({ version: 1, coins, owned: [...owned] }));
  save();
  return {
    wallet: () => unlimited ? Number.MAX_SAFE_INTEGER : coins,
    ownedParts: () => [...owned],
    begin(run) { activeRun = run; settled = false; },
    purchase(id, cost) {
      const item = ITEMS.find(x => x.id === id);
      // Never trust a UI-supplied price, or permit challenge unlocks to be bought.
      if (!item || item.price === null || cost !== item.price || owned.has(id) || (!unlimited && coins < cost)) return false;
      if (!unlimited) coins -= cost;
      owned.add(id); save(); return true;
    },
    settle(run) {
      if (!run || run !== activeRun || settled || run.state.practice || run.state.phase !== 'over') return null;
      settled = true;
      const pay = roundReward(run.state);
      coins = Math.min(Number.MAX_SAFE_INTEGER, coins + pay.total);
      save();
      return { ...pay, wallet: coins };
    },
  };
}
