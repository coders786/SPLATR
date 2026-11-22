/** Deterministic base pay for every ended round. Quests are extra, never a gate.
 * Uses active simulation outcomes only (no wall time / pause farming). Existing
 * coin storage is retained so older wallets migrate without losing balances. */
export const CURRENCY = 'CREDITS';
export function roundReward(state = {}) {
  if(state.practice)return Object.freeze({base:0,cuts:0,score:0,sectors:0,total:0});
  const safe = v => Number.isFinite(v) ? Math.max(0,Math.floor(v)) : 0;
  const base = 10;
  const cuts = state.killLedger?Math.min(10000,safe(state.killLedger.credits)):Math.min(100,safe(state.kills)*2);
  const score = Math.min(150,Math.floor(safe(state.score)/250));
  const sectors = Math.min(60,Math.max(0,safe(state.band)-1)*5);
  return Object.freeze({base,cuts,score,sectors,total:base+cuts+score+sectors});
}
