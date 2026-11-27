import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { readFileSync } from 'node:fs';
import { createShopWallet } from '../src/shop-wallet.js';
import { createRoundRewardUI } from '../src/round-reward-ui.js';
const storage = values => ({ get: (k, d) => values.get(k) ?? d, set: (k, v) => values.set(k, v) });

test('migrates credits and valid ownership once without touching the old ledger', () => {
  const old = JSON.stringify({coins:450,owned:['halo','fake'],board:{grid:['old']}}), m = new Map([['quests',old]]);
  let w = createShopWallet(storage(m));
  assert.equal(w.wallet(),450); assert.deepEqual(w.ownedParts(),['halo']);
  assert.equal(w.purchase('visor',0),false); assert.equal(w.purchase('oni',null),false);
  assert.equal(w.purchase('visor',200),true); assert.equal(w.wallet(),250);
  assert.equal(w.purchase('visor',200),false); assert.equal(w.wallet(),250);
  m.set('quests',JSON.stringify({coins:9999}));
  w=createShopWallet(storage(m));assert.equal(w.wallet(),250);assert.ok(w.ownedParts().includes('visor'));
  assert.equal(JSON.parse(old).board.grid[0],'old');
});
test('corrupt wallet and insufficient funds fail safely; sandbox does not spend', () => {
  const m=new Map([['quests','{']]);const w=createShopWallet(storage(m));
  assert.equal(w.wallet(),0);assert.equal(w.purchase('halo',250),false);
  const dev=createShopWallet(storage(new Map()),{unlimited:true});
  assert.equal(dev.purchase('halo',250),true);assert.equal(dev.wallet(),Number.MAX_SAFE_INTEGER);
});
test('pays only an ended active run, once; practice and stale events pay nothing', () => {
  const w=createShopWallet(storage(new Map()));const run={state:{phase:'playing',kills:3,score:500,band:2}};
  w.begin(run); assert.equal(w.settle(run),null);run.state.phase='over';
  const receipt=w.settle(run);assert.equal(receipt.total,23);assert.equal(w.wallet(),23);
  assert.equal(w.settle(run),null);assert.equal(w.settle({state:run.state}),null);
  const practice={state:{phase:'over',practice:true,kills:100}};w.begin(practice);assert.equal(w.settle(practice),null);
});
test('credit UI keeps end-card actions, shows exact pay and no quest interface', () => {
  const win=new Window(),doc=win.document;
  doc.body.innerHTML='<div class="score-lock"></div><section id="result-page"><div class="bank"><button id="retry-btn">Retry</button><button id="home-btn">Home</button></div></section>';
  const wallet=createShopWallet(storage(new Map())),ui=createRoundRewardUI({wallet,host:doc});
  const run={state:{phase:'playing',kills:3,score:500,band:2}};wallet.begin(run);ui.tick(run);
  assert.equal(doc.querySelector('.round-pay').textContent,'ROUND +23 CREDITS');
  run.state.phase='over';ui.over(run);assert.match(doc.querySelector('.round-receipt').textContent,/\+23 CREDITS/);
  assert.equal(doc.querySelectorAll('#retry-btn,#home-btn').length,2);assert.equal(doc.querySelectorAll('.quest-hud,.quest-board-dialog').length,0);
  win.happyDOM.abort();
});
test('entry module never imports or instantiates the retired system', () => {
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.doesNotMatch(main,/quest-ui|deed-tracker|questUI|questReveal/);
  assert.match(main,/shopWallet.begin\(run\)/);assert.match(main,/rewardUI\?\.over\(run\)/);
});
