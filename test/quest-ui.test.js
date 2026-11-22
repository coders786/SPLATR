import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { createQuestUI } from '../src/quest-ui.js';

// DOM integration, not a browser layout test. Canvas/animations are deliberately stubbed.
test('test_portal_to_vault_bestowal', () => {
  const window = new Window();
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = () => 1;
  window.document.body.innerHTML = readFileSync(
    new URL('../index.html', import.meta.url),
    'utf8',
  );
  window.Element.prototype.animate = () => ({});
  const values = new Map(),
    storage = {
      get: (k, d) => values.get(k) || d,
      set: (k, v) => values.set(k, v),
    };
  let resets = 0,
    homes = 0;
  const enemies = new Map(),
    hazards = [];
  const run = {
    state: { phase: 'playing', opening: null, tutorialActive: false },
    world: { player: { position: { x: 0, y: 0 } }, grounded: false },
    combat: {
      enemies,
      hazards,
      remove: (e) => enemies.delete(e.id),
      add: (e) => enemies.set(e.id, e),
    },
  };
  const ui = createQuestUI({
    getRun: () => run,
    storage,
    audio: { lock() {}, zone() {} },
    resetInput: () => resets++,
    home: () => homes++,
    resume() {},
    view: () => ({ x: -400, y: -500, w: 800, h: 600 }),
  });
  assert.equal(document.querySelectorAll('.quest-option').length, 3);
  assert.equal(
    document.querySelectorAll('.quest-option[aria-pressed=true]').length,
    3,
  );
  assert.equal(
    document.querySelectorAll('.prize-option[aria-pressed=true]').length,
    1,
  );
  // Choose easy STYLE; default is balanced, not all easy.
  document
    .querySelectorAll('.quest-columns>div')[1]
    .querySelector('button')
    .click();
  ui.start();
  assert.equal(document.querySelectorAll('.quest-mini .quest-row').length, 0);
  assert.equal(document.querySelectorAll('.quest-pip').length, 3);
  assert.equal(document.querySelectorAll('.pause-quests .quest-row').length, 3);
  document.querySelector('.quest-pips').click();
  assert.equal(document.querySelector('.quest-peek').hidden, false);
  document.querySelector('.quest-pips').click();
  assert.equal(
    document.querySelector('#result-page').children.length,
    2,
    'end card must have exactly two columns',
  );
  for (let i = 0; i < 5; i++) {
    ui.event('dash', {power:1});
    ui.event('cut', { kind: 'fang', strokeKills: 2 });
  }
  ui.event('waveClear', { number: 1 });
  assert.ok(run.state.questPortal);
  assert.equal(run.state.edge, 3);
  const portal = run.state.questPortal;
  run.world.player.position = { x: portal.x, y: portal.y };
  for (let i = 0; i < 31; i++) ui.tick();
  assert.equal(ui.vault, true);
  assert.equal(document.querySelector('.vault-scene').hidden, false);
  const p = JSON.parse(values.get('quests'));
  assert.ok(p.owned.includes('halo'));
  assert.equal(p.coins, 9, 'teaching rewards are modest; skills, not a credit grind');
  document.querySelector('.vault-actions button').click();
  assert.equal(ui.vault, false);
  assert.equal(run.state.questPortal, null);
  assert.equal(run.state.questPart, 'halo');
  for (let i = 0; i < 60; i++) ui.tick();
  assert.equal(run.state.questPortal, null, 'no second portal');
  console.log(
    'QA portal: 3/3 → portal → Vault → halo granted once → continue; input resets=' +
      resets,
  );
  assert.ok(resets >= 2);
  assert.equal(homes, 0);
  window.happyDOM.abort();
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
});

test('quests can be disabled; free-play pays once without progress, spawns or portals',()=>{
 const window=new Window();globalThis.document=window.document;globalThis.requestAnimationFrame=()=>1;
 document.body.innerHTML=readFileSync(new URL('../index.html',import.meta.url),'utf8');window.Element.prototype.animate=()=>({});
 const values=new Map([['optional-quests','off']]);let spawns=0;
 const run={state:{phase:'playing',opening:null,tutorialActive:false,kills:11,score:2700,band:3},world:{grounded:false,player:{position:{x:0,y:0}}},combat:{enemies:new Map(),hazards:[],add(){spawns++;}}};
 try{
 const ui=createQuestUI({getRun:()=>run,storage:{get:(k,d)=>values.get(k)??d,set:(k,v)=>values.set(k,v)},audio:{lock(){}},resetInput(){},home(){},resume(){},motion:()=>false,view:()=>({x:0,y:0,w:800,h:600})});
 assert.equal(document.querySelector('.quest-toggle').getAttribute('aria-pressed'),'false');ui.start();
 for(let i=0;i<1300;i++){ui.tick();ui.event('cut',{kind:'fang',strokeKills:3});}
 ui.event('sector',{band:7});assert.equal(spawns,0);assert.equal(run.state.questPortal,undefined);
 document.querySelector('.quest-pips').click();assert.equal(document.querySelector('.quest-peek').hidden,true);
 ui.event('over');assert.equal(ui.wallet(),52);assert.equal(JSON.parse(values.get('quests')).unlock,0);
 assert.match(document.querySelector('.round-payout').textContent,/52CREDITS/);assert.equal(document.querySelectorAll('.quest-results .quest-row').length,0);
 ui.event('over');assert.equal(ui.wallet(),52,'rerenders never double pay');
 ui.start();ui.event('over');assert.equal(ui.wallet(),104,'each new round settles independently');
 }finally{window.happyDOM.abort();delete globalThis.document;delete globalThis.requestAnimationFrame;}
});
