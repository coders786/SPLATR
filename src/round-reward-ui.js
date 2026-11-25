import { roundReward } from './round-rewards.js';
/** Credit receipts only. No goals, boards, prize meters, portals, or extra frame loop. */
export function createRoundRewardUI({ wallet, host = document }) {
  const make = (tag, cls, text) => { const n = host.createElement(tag); n.className = cls; n.textContent = text; return n; };
  const pay = make('div', 'round-pay', 'ROUND +10 CREDITS');
  const kills = make('div', 'live-kills', 'KILLS 0');
  host.querySelector('.score-lock').append(kills, pay);
  const bank = host.querySelector('#result-page .bank');
  const receipt = make('section', 'round-receipt', '');
  receipt.setAttribute('aria-label', 'Round credits');
  bank.insertBefore(receipt, host.querySelector('#retry-btn'));
  return {
    tick(run) {
      const s = run?.state;
      pay.hidden = kills.hidden = !s || !!s.practice;
      if (!s) return;
      pay.textContent = `ROUND +${roundReward(s).total} CREDITS`;
      kills.textContent = `KILLS ${s.kills || 0}`;
    },
    over(run) {
      const result = wallet.settle(run);
      receipt.replaceChildren();
      if (!result) return;
      receipt.append(make('strong', 'round-payout', `+${result.total} CREDITS`),
        make('p', 'reward-breakdown', `ROUND ${result.base} · CUTS ${result.cuts} · SCORE ${result.score} · SECTORS ${result.sectors}`),
        make('small', '', `WALLET · ${result.wallet.toLocaleString()} CREDITS`));
    },
  };
}
