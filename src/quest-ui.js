import {prependIcon} from './ui-icons.js';
import {ENEMY_NAMES} from './kill-rewards.js';
import {drawVaultScene,drawForcePreview} from './art/splatr-art-engine.js';
import { roundReward } from './round-rewards.js';
import { settlePrizeTrack } from './prize-settlement.js';
import {
  learningOffers,
  questInstruction,
  nextPrize,
  PARTS,
  loadProfile,
  createTicket,
} from './quests.js';
// CHUNK 6: the contract board is its own pure system (see contracts.js for why
// it is not a re-skin of the old tutorial quests).
import {
  PILLARS, PILLAR_BY_ID, dealBoard, boardState as contractBoardState, contractById,
  contractMetrics, contractProgress, progressLabel, rerollCost, SWEEP_BONUS, EMPTY_BOARD,
} from './contracts.js';
import { ARENA } from './levels.js';

export function createQuestUI({
  getRun,
  unlimited = false,
  practice=null,
  startTutorial=null,
  teaching=null,
  openShop=null,
  storage,
  audio,
  resetInput,
  home,
  resume,
  view,
  motion = () => true,
}) {
  const profile = loadProfile(storage.get('quests', '{}'));
  // CHUNK 6: this run's peaks, for the STYLE and SURVIVAL pillars. Reset when a
  // run starts; CARNAGE reads profile.tally instead and never resets.
  const runTally = { doubles: 0, triples: 0, power: 0, banks: 0, overdrive: false, sector: 1, seals: 0, flawless: 0, hits: 0 };
  function resetRunTally() {
    for (const k of Object.keys(runTally)) runTally[k] = k === 'sector' ? 1 : k === 'overdrive' ? false : 0;
  }
  function contractMetricsNow() {
    return contractMetrics({ run: runTally, tally: profile.tally });
  }
  let offerNonce=0;
  const newOffers=()=>learningOffers({seed:Math.imul(profile.rounds+1,2654435761)+offerNonce,learned:profile.learned});
  let choices = newOffers(),
    selected = choices.map(c=>c[0].id),
    prize = nextPrize(profile).id;
  // CHUNK 6: contracts are ALWAYS ON. The old switch read
  // `optional-quests` and let a saved profile turn the reward system off — a
  // setting no player wants and one that made the board's purpose unclear.
  // The stored key is no longer read; a profile that still has `off` in it
  // simply cannot switch rewards off any more.
  const questsEnabled = true;
  let roundQuests = questsEnabled;
  let ticket = null,
    vault = false,
    age = 0,
    spawnClock = 0,
    death = null;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    e.className = cls || '';
    if (text) e.textContent = text;
    return e;
  };
  const picker = el('section', 'quest-picker');
  picker.setAttribute('aria-label', 'Run quests');
  const boardDialog=el('dialog','quest-board-dialog');boardDialog.setAttribute('aria-label','Optional quests');
  const closeBoard=el('button','quest-board-close','BACK');closeBoard.type='button';prependIcon(closeBoard,'back');closeBoard.onclick=()=>boardDialog.close();
  boardDialog.append(closeBoard);
  // CHUNK 6: LIVE ENEMY TRAINING and CONTROL PRACTICE were in here, next to a
  // list of rewards, while PRACTICE & HELP was already a separate door on the
  // main menu. They live there now (`practice` is passed to that page); this
  // modal is contracts and nothing else.
  boardDialog.append(picker);document.querySelector('#game').append(boardDialog);
  // CHUNK 1: the title used to show BOTH 'Learn' and 'Field manual', and both
  // opened the same panel (startTutorial resolves to open('manual')). One door
  // now: QUESTS, which is a different thing, sitting beside the single
  // practice/help door. Nothing on the menu is a synonym for anything else.
  // CHUNK 6: 'Quests' was a graduation-cap word for a slasher. These are
  // contracts, and the button says so. The icon is a target/reticle, not a cap.
  const questButton=el('button','choice quiet','Contracts');questButton.id='quests-btn';questButton.type='button';
  prependIcon(questButton,'target');
  questButton.onclick=()=>{resetInput();drawPicker();boardDialog.showModal();};
  // The practice modes moved onto the PRACTICE & HELP page (see index.html).
  const teachBtn=document.querySelector('#manual-teaching'),drillBtn=document.querySelector('#manual-drill');
  if(teachBtn){if(teaching)teachBtn.onclick=()=>{home();teaching();};else teachBtn.remove();}
  if(drillBtn){if(practice)drillBtn.onclick=()=>{home();practice();};else drillBtn.remove();}
  // The manual button is the practice door now; its label is set in index.html.
  void startTutorial;
  document.querySelector('#manual-btn').after(questButton);
  boardDialog.addEventListener('close',resetInput);
  boardDialog.addEventListener('keydown',e=>e.stopPropagation());boardDialog.addEventListener('keyup',e=>e.stopPropagation());
  const liveKills=el('div','live-kills','KILLS 0');document.querySelector('.score-lock').append(liveKills);
  const livePay=el('div','round-pay','ROUND +10 CREDITS');
  livePay.setAttribute('aria-label','Projected round credits, paid when the round ends');
  document.querySelector('.score-lock').append(livePay);
  const hud = el('div', 'quest-mini');
  document.querySelector('.score-lock').append(hud);
  const pipButton = el('button', 'quest-pips');
  pipButton.type = 'button';
  pipButton.setAttribute(
    'aria-label',
    'Quest progress. Press Q or tap to inspect.',
  );
  pipButton.setAttribute('aria-expanded', 'false');
  hud.append(pipButton);
  const drawer = el('section', 'quest-peek');
  drawer.hidden = true;
  drawer.setAttribute('aria-label', 'Live quests');
  document.querySelector('#game').append(drawer);
  const pause = document.querySelector('#pause-page'),
    menu = el('div', 'pause-menu'),
    pauseQuests = el('section', 'pause-quests');
  for (const child of [...pause.children]) menu.append(child);
  pause.append(menu, pauseQuests);
  if(practice){const shortcut=el('button','choice quiet','Control practice');shortcut.id='pause-practice';shortcut.type='button';shortcut.onclick=()=>{resetInput();practice();};menu.querySelector('#resume-btn').after(shortcut);}
  let lastHUD = '',
    lastToast = -Infinity,
    toastTimer;
  const toast = el('div', 'quest-toast');
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  document.querySelector('#game').append(toast);
  function peek(on) {
    const run = getRun();
    const allowed =
      on &&
      roundQuests &&
      ticket &&
      !vault &&
      run &&
      ['ready', 'playing'].includes(run.state.phase) &&
      !document.querySelector('dialog[open]');
    drawer.hidden = !allowed;
    pipButton.setAttribute('aria-expanded', String(!!allowed));
  }
  pipButton.addEventListener('click', () => peek(drawer.hidden));
  // CHUNK 3: the bonus goal is the one payment in a run that is NOT a kill, so
  // it cannot ride the kill receipt. It gets the same toast the skill rows use,
  // because that is the toast the player has already learned to read.
  function goalToast(text) {
    toast.textContent = text;
    toast.hidden = false;
    lastToast = performance.now();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 1600);
  }
  let qPressedAt = null;
  document.addEventListener('keydown', (e) => {
    if (
      e.code === 'KeyQ' &&
      !e.repeat &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')
    ) {
      e.preventDefault();
      qPressedAt = performance.now();
      peek(drawer.hidden);
    }
    if (e.code === 'Escape' && !drawer.hidden) {
      e.preventDefault();
      e.stopPropagation();
      peek(false);
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyQ' && qPressedAt !== null) {
      if (performance.now() - qPressedAt >= 250) peek(false);
      qPressedAt = null;
    }
  });
  document.defaultView?.addEventListener('blur', () => {
    qPressedAt = null;
    peek(false);
  });

  const retryButton = document.querySelector('#retry-btn');
  const result = el('section', 'quest-results');
  const recap = document.querySelector('#result-page .recap');
  const oldBank = document.querySelector('#result-page .bank');
  const homeButton = document.querySelector('#home-btn');
  for (const child of [...oldBank.children])
    if (child !== retryButton && child !== homeButton) recap.append(child);
  oldBank.remove();
  document.querySelector('#result-page').append(result);
  const scene = el('section', 'vault-scene');
  scene.hidden = true;
  scene.setAttribute('aria-label', 'The Vault');
  scene.setAttribute('role', 'dialog');
  scene.setAttribute('aria-modal', 'true');
  const canvas = el('canvas'),
    title = el('h1', '', 'THE VAULT'),
    stamp = el('h2', '', 'PRIZE GRANTED'),
    receipt = el('p');
  const buttons = el('div', 'vault-actions');
  const keep = el('button', 'choice primary', 'KEEP GOING'),
    bank = el('button', 'choice', 'BANK & END');
  buttons.append(keep, bank);
  scene.append(canvas, title, stamp, receipt, buttons);
  document.querySelector('#game').append(scene);
  const save = () => storage.set('quests', JSON.stringify(profile));
  function prizeMeter(saved, cost, before = saved) {
    const meter = el('div', 'prize-meter');
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-valuenow', saved);
    meter.setAttribute('aria-valuemin', 0);
    meter.setAttribute('aria-valuemax', cost);
    meter.append(el('b', 'prize-ratio', `${saved} / ${cost}`));
    const track = el('div', 'prize-track'),
      fill = el('i', 'prize-fill');
    const pct = Math.min(100, (100 * saved) / cost);
    fill.style.width = `${pct}%`;
    track.append(fill);
    meter.append(track);
    if (before !== saved && motion())
      fill.animate(
        [{ width: `${(100 * before) / cost}%` }, { width: `${pct}%` }],
        { delay: 150, duration: 500, fill: 'backwards', easing: 'ease-out' },
      );
    return meter;
  }
  /* ══ CHUNK 6: RIOT CONTRACTS ══════════════════════════════════════════════
     Ground-up rebuild. What was here had an identity crisis: a practice venue,
     a duplicate shop, tutorial tooltips and an on/off switch for rewards, in
     one modal. This is only a board: three contracts, colour-coded by pillar,
     live numbers, and a sweep bonus for clearing all three.

     Deliberately NOT here (moved by request):
       · LIVE ENEMY TRAINING / CONTROL PRACTICE -> `practice()` (Practice & help)
       · the mini-shop -> one `SHOP ->` button in the header, which opens the
         real shop
       · the on/off toggle -> rewards are always on
       · grey flavour footnotes -> the objective is one line, and that is all */

  /** Give the board a grid if it has none, or if it has been cleared. */
  function ensureBoard() {
    const b = profile.board;
    const metrics = contractMetricsNow();
    const st = contractBoardState({ grid: b.grid.map(contractById).filter(Boolean), claimed: b.claimed, rerolls: b.rerolls }, metrics);
    if (b.grid.length !== 3 || st.sweep) {
      // A swept board (or a first one) deals fresh. Sweeps climb, so the next
      // board is richer — that is the loop.
      const swept = b.grid.length === 3 && st.sweep;
      const nextBoard = swept ? b.board + 1 : b.board;
      const grid = dealBoard({ seed: profile.rounds + 1, board: nextBoard, metrics });
      profile.board = {
        grid: grid.map((c) => c.id),
        board: nextBoard,
        sweeps: swept ? b.sweeps + 1 : b.sweeps,
        rerolls: 0,
        claimed: [],
      };
      save();
      if (swept) goalToast(`BOARD SWEPT ✓ +${SWEEP_BONUS} CREDITS`);
    }
    return profile.board;
  }

  function drawPicker() {
    picker.replaceChildren();
    const board = ensureBoard();
    const metrics = contractMetricsNow();
    const grid = board.grid.map(contractById).filter(Boolean);
    const st = contractBoardState({ grid, claimed: board.claimed, rerolls: board.rerolls }, metrics);

    /* ── header ────────────────────────────────────────────────────────── */
    const head = el('div', 'riot-head');
    const title = el('div', 'riot-title');
    title.append(el('b', '', '/// RIOT CONTRACTS'));
    title.append(el('small', '', st.sweep
      ? 'BOARD SWEPT — fresh contracts dealt'
      : `${st.done}/3 COMPLETE · SWEEPS ${board.sweeps}`));
    head.append(title);
    const wallet = el('div', 'riot-wallet');
    wallet.append(el('b', '', unlimited ? '♦ ∞' : `♦ ${profile.coins.toLocaleString()}`));
    const shop = el('button', 'riot-shop', 'SHOP →');
    shop.type = 'button';
    // The real shop, not a copy of it. This button is the entire reason the
    // old mini-shop at the bottom of this modal could be deleted.
    shop.onclick = () => { boardDialog.close(); openShop?.(); };
    wallet.append(shop);
    head.append(wallet);
    picker.append(head);

    /* ── the three contracts ───────────────────────────────────────────── */
    const row = el('div', 'riot-contracts');
    for (const [i, contract] of grid.entries()) {
      const pillar = PILLAR_BY_ID[contract.pillar];
      const p = contractProgress(contract, metrics);
      const claimed = board.claimed.includes(contract.id);
      const card = el('div', 'riot-card');
      card.dataset.pillar = contract.pillar.toLowerCase();
      card.dataset.accent = pillar.accent;
      card.style.setProperty('--accent', pillar.accent);
      card.dataset.done = String(p.done);
      card.dataset.claimed = String(claimed);

      const top = el('div', 'riot-card-top');
      top.append(el('span', 'riot-tag', pillar.tag));
      const re = el('button', 'riot-reroll', '↻');
      re.type = 'button';
      re.title = rerollCost(board) === 0 ? 'Reroll this contract (free)' : `Reroll this contract (♦${rerollCost(board)})`;
      re.setAttribute('aria-label', re.title);
      re.disabled = claimed || p.done;
      re.onclick = () => {
        const cost = rerollCost(board);
        if (cost > 0 && (unlimited === false && profile.coins < cost)) return;
        if (cost > 0 && unlimited === false) profile.coins -= cost;
        const fresh = dealBoard({
          seed: profile.rounds + 1 + profile.board.rerolls + 31,
          board: board.board,
          avoid: { [contract.pillar]: [contract.id] },
          metrics,
        }).find((c) => c.pillar === contract.pillar);
        if (!fresh) return;
        profile.board = { ...profile.board, grid: profile.board.grid.map((id) => (id === contract.id ? fresh.id : id)), rerolls: profile.board.rerolls + 1 };
        save(); drawPicker();
      };
      top.append(re);
      card.append(top);

      card.append(el('strong', 'riot-card-title', contract.title));
      card.append(el('p', 'riot-objective', contract.objective));

      const meter = el('div', 'riot-meter');
      const label = el('b', 'riot-count', progressLabel(contract, metrics));
      const track = el('div', 'riot-track');
      const fill = el('i', 'riot-fill');
      fill.style.width = `${Math.round(p.fraction * 100)}%`;
      track.append(fill);
      meter.append(label, track);
      card.append(meter);

      if (p.done && !claimed) {
        const claim = el('button', 'riot-claim', `CLAIM ♦ +${contract.pay}`);
        claim.type = 'button';
        claim.onclick = () => {
          profile.coins += contract.pay;
          profile.board = { ...profile.board, claimed: [...profile.board.claimed, contract.id] };
          save();
          audio?.lock();
          drawPicker();
        };
        card.append(claim);
      } else if (claimed) {
        card.append(el('div', 'riot-footer', 'CLAIMED ✓'));
      } else {
        const foot = el('div', 'riot-footer');
        foot.append(el('span', '', 'REWARD'), el('b', '', `♦ +${contract.pay}`));
        card.append(foot);
      }
      row.append(card);
    }
    picker.append(row);

    /* ── the sweep track ───────────────────────────────────────────────── */
    const sweep = el('div', 'riot-sweep');
    sweep.dataset.ready = String(st.sweep);
    const sLeft = el('div', 'riot-sweep-copy');
    sLeft.append(el('b', '', '/// BOARD SWEEP BONUS'));
    sLeft.append(el('small', '', st.sweep
      ? 'Swept. Fresh contracts dealt, sweeps climbing.'
      : `Complete all 3 contracts to claim ♦ +${SWEEP_BONUS} and deal a fresh board.`));
    sweep.append(sLeft);
    const pips = el('div', 'riot-pips');
    for (const done of st.pips) {
      const pip = el('i');
      pip.dataset.on = String(done);
      pips.append(pip);
    }
    sweep.append(pips);
    sweep.append(el('b', 'riot-sweep-pay', `♦ +${SWEEP_BONUS}`));
    picker.append(sweep);
    if (st.sweep) {
      // The board is cleared: pay it, then the deck is fresh on next open.
      profile.coins += SWEEP_BONUS;
      profile.board = { ...profile.board, claimed: [] };
      save();
      goalToast(`BOARD SWEPT ✓ +${SWEEP_BONUS} CREDITS`);
    }

    picker.append(el('p', 'riot-note', 'Contracts pay once. Progress carries between runs. Press Q in a run to check them.'));
  }

  function row(q, end = false, index = 0) {
    const e = el('div', 'quest-row');
    e.dataset.id = q.id;
    const num = q.kind === 'air' ? Math.floor(q.value / 60) : q.value,
      goal = q.kind === 'air' ? Math.ceil(q.goal / 60) : q.goal;
    e.append(
      el('span', 'quest-label', q.label),
      el(
        'b',
        'quest-count',
        q.kind === 'sector'
          ? `AT ${String(Math.max(1, num)).padStart(2, '0')}/${String(goal).padStart(2, '0')}`
          : `${num}/${goal}`,
      ),
    );
    const track = el('div', 'quest-track'),
      fill = el('i', 'quest-fill'),
      head = el('i', 'quest-head');
    track.append(fill, head);
    e.append(track);
    if(q.lesson&&!q.done)e.append(el('small','lesson-hint',questInstruction(q)));
    fill.style.width = `${(100 * q.value) / q.goal}%`;
    head.style.width = `${(100 * (q.done ? 0 : profile.heads[q.id] || 0)) / q.goal}%`;
    e.classList.toggle('complete', q.done);
    e.classList.toggle('almost', end && !q.done && q.value / q.goal >= 0.5);
    if (end) {
      fill.animate(
        [{ width: '0%' }, { width: `${(100 * q.value) / q.goal}%` }],
        {
          duration: motion() ? 500 : 0,
          delay: motion() ? index * 500 : 0,
          fill: 'both',
          easing: 'ease-out',
        },
      );
      const counter = e.querySelector('.quest-count'),
        start = performance.now() + index * 500;
      const count = (now) => {
        if (!e.isConnected) return;
        const t = Math.max(0, Math.min(1, (now - start) / 500));
        counter.textContent =
          q.kind === 'sector'
            ? `AT ${String(Math.max(1, Math.floor(num * (1 - (1 - t) ** 3)))).padStart(2, '0')}/${String(goal).padStart(2, '0')}`
            : `${Math.floor(num * (1 - (1 - t) ** 3))}/${goal}`;
        if (t < 1) requestAnimationFrame(count);
      };
      if (motion() && !q.done) requestAnimationFrame(count);
      if (q.value / q.goal >= 0.5 && !q.done)
        e.append(
          el(
            'strong',
            'almost-badge',
            `${goal - num} ${goal - num === 1 ? 'LEFT!' : 'MORE!'}`,
          ),
        );
      if (q.done)
        e.append(el('strong', 'quest-done', `DONE! +${q.points} TO PRIZE`));
      if (!q.done && death?.heads[q.id])
        e.append(el('small', 'kept', `${death.heads[q.id]}/${q.goal} KEPT!`));
    }
    return e;
  }
  function hudDraw() {
    if (!ticket) return;
    if (!roundQuests) {
      pipButton.replaceChildren();drawer.hidden=true;
      pauseQuests.replaceChildren(el('h3','','FREE PLAY'),el('p','','Quests are off. Every round earns CREDITS.'));
      return;
    }
    const signature =
      ticket.rows.map((q) => `${q.id}:${q.value}:${q.done}`).join('|') +
      `:${profile.unlock}`;
    if (signature === lastHUD) return;
    lastHUD = signature;
    pipButton.replaceChildren();
    const next=ticket.rows.filter(q=>!q.done).sort((a,b)=>b.value/b.goal-a.value/a.goal)[0];
    if(next){const text=el('span','quest-next',`${next.label} · ${next.kind==='air'?Math.floor(next.value/60):next.value}/${next.kind==='air'?Math.ceil(next.goal/60):next.goal}`);pipButton.append(text);}else pipButton.append(el('span','quest-next','VAULT OPEN'));
    for (const q of ticket.rows) {
      const pip = el('i', 'quest-pip');
      pip.dataset.state = q.done ? 'done' : q.value > 0 ? 'progress' : 'empty';
      pip.textContent = q.done ? '✓' : q.value > 0 ? '−' : '';
      pipButton.append(pip);
    }
    pipButton.setAttribute(
      'aria-label',
      `${ticket.rows.filter((q) => q.done).length} of 3 quests complete. Press Q or tap for details.`,
    );
    for (const panel of [drawer, pauseQuests]) {
      panel.replaceChildren(el('h3', '', 'YOUR QUESTS'));
      for (const q of ticket.rows) panel.append(row(q));
      const p = nextPrize(profile);
      panel.append(
        el('p', '', p.label),
        prizeMeter(profile.unlock, p.cost || 100),
      );
    }
    if (!drawer.hidden) peek(true);
  }
  function openPortal(run) {
    const v = view(),
      pos = run.world.player.position;
    const x = v ? v.x + v.w * 0.5 : pos.x,
      y = v ? v.y + v.h * 0.32 : pos.y - 180;
    run.state.questPortal = {
      x: Math.max(ARENA.x + 150, Math.min(ARENA.x + ARENA.w - 150, x)),
      y: Math.max(ARENA.y + 150, Math.min(ARENA.y + ARENA.h - 150, y)),
      r: 134,
      age: 0,
    };
    run.world.questDoor = run.state.questPortal;
    run.state.edge = run.state.edgeMax || 3;
    run.state.questReveal = 30;
    audio.zone();
    document.querySelector('#quest-portal-notice')?.remove();
    const n = el('div', 'portal-notice', 'PORTAL OPEN');
    n.id = 'quest-portal-notice';
    document.querySelector('#game').append(n);
    setTimeout(() => n.remove(), 1500);
    clearDoor(run);
  }
  function clearDoor(run) {
    const p = run.state.questPortal;
    if (!p) return;
    for (const e of run.combat.enemies.values())
      if (Math.hypot(e.x - p.x, e.y - p.y) < p.r + 220) run.combat.remove(e);
    for (let i = run.combat.hazards.length - 1; i >= 0; i--) {
      const h = run.combat.hazards[i];
      if (Math.hypot(h.x - p.x, h.y - p.y) < p.r + 220)
        run.combat.hazards.splice(i, 1);
    }
  }
  function enter() {
    if (vault || !ticket.grant()) return;
    save();
    vault = true;
    age = 0;
    resetInput();
    scene.hidden = false;
    resume(false);
    const reward =
      PARTS.find((p) => p.id === ticket.prize)?.label || 'CREDIT CHEST';
    receipt.textContent = `${reward} · +${ticket.points} CREDITS${ticket.bonus ? ' · BONUS CHEST' : ''}`;
    keep.focus();
    audio.zone();
  }
  keep.onclick = () => {
    vault = false;
    scene.hidden = true;
    const run = getRun();
    if (run) {
      run.world.questDoor = null;
      if (run.leaveQuestVault) run.leaveQuestVault();
      else run.state.questPortal = null;
      run.state.questPart = profile.owned.at(-1) || null;
      run.state.edge = run.state.edgeMax || 3;
    }
    resetInput();
    resume(true);
  };
  bank.onclick = () => {
    vault = false;
    scene.hidden = true;
    resetInput();
    home();
    drawPicker();
  };
  scene.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      (document.activeElement === keep ? bank : keep).focus();
    }
    e.stopPropagation();
  });
  function forceFrame(now) {
    requestAnimationFrame(forceFrame);
    const moving = motion();
    document.querySelector('#game').dataset.questMotion = moving ? 'on' : 'off';
    if (!moving) now = 0;
    if (!document.querySelector('#title-screen').hidden)
      for (const preview of picker.querySelectorAll('canvas')) {
        const pc = preview.getContext('2d');
        drawForcePreview(pc,preview.dataset.part,now);
      }
    if (!vault) return;
    age = moving ? age + 1 / 60 : 2;
    const c = canvas.getContext('2d'),
      w = (canvas.width = scene.clientWidth),
      h = (canvas.height = scene.clientHeight);
    drawVaultScene(c,w,h,{time:now,age,ticket});
  }
  requestAnimationFrame(forceFrame);
  drawPicker();
  return {
    wallet: () => unlimited ? Number.MAX_SAFE_INTEGER : profile.coins,
    ownedParts: () => [...profile.owned],
    purchasePart(id, cost) {
      if (!Number.isSafeInteger(cost) || cost < 0 || (!unlimited && profile.coins < cost)) return false;
      if (PARTS.some(p=>p.id===id) && profile.owned.includes(id)) return false;
      if (!unlimited) profile.coins -= cost;
      if(PARTS.some(p=>p.id===id)) profile.owned.push(id);
      save(); drawPicker(); return true;
    },
    closePeek: () => {
      qPressedAt = null;
      peek(false);
    },
    get vault() {
      return vault;
    },
    refresh() {
      offerNonce++;choices = newOffers();
      selected = choices.map((c, i) => c[0].id);
      prize = nextPrize(profile).id;
      drawPicker();
    },
    start() {
      choices=newOffers();selected=choices.map(c=>c[0].id);drawPicker();
      if (profile.owned.includes(prize)) prize = nextPrize(profile).id;
      roundQuests=questsEnabled;
      hud.hidden=!roundQuests;
      ticket = createTicket(selected, prize, profile);
      death = null;
      livePay.textContent='ROUND +10 CREDITS';liveKills.textContent='KILLS 0';
      spawnClock = 0;
      lastHUD = '';
      lastToast = -Infinity;
      qPressedAt = null;
      peek(false);
      toast.hidden = true;
      clearTimeout(toastTimer);
      hudDraw();
      const run = getRun();
      if (run) run.state.questPart = profile.owned.at(-1) || null;
    },
    event(type, d) {
      const run = getRun();
      // CHUNK 3: the bonus goal is announced even in a run with no quest
      // ticket (a practice or dev session has none), so this check sits before
      // the ticket gate. It is a run event, not a quest event.
      if (type === 'goalPaid' && d) goalToast(`BONUS ${d.label} ✓ +${d.credits} CREDITS`);
      // CHUNK 4: a post arrives on a clear with no picker, so it says so.
      if (type === 'postPaid' && d) goalToast(`POST · ${String(d.name || d.id).toUpperCase()}`);
      if (!ticket || !run || run.state.practice || (type === 'over' && death)) return;
      liveKills.textContent=`KILLS ${run.state.kills||0}`;
      // ── CHUNK 6: FEED THE CONTRACTS ────────────────────────────────────
      // CARNAGE is cumulative and reads profile.tally, so it accumulates here
      // and is saved with the profile; STYLE and SURVIVAL read this run's peaks
      // and reset when a run starts.
      // Launch power rides the `dash` event (`d.power`, 0..1); the cut has no
      // such field. A power cut is therefore "a full-pull dash that cut".
      let lastPower = 0;
      if (type === 'dash' && d) lastPower = Number.isFinite(d.power) ? d.power : 0;
      if (type === 'cut' && d && !d.small && !d.paper) {
        const kind = d.kind;
        profile.tally.kills = (profile.tally.kills || 0) + 1;
        if (profile.tally[kind] != null) profile.tally[kind] += 1;
        if ((d.strokeKills || 0) >= 2) runTally.doubles += 1;
        if ((d.strokeKills || 0) >= 3) runTally.triples += 1;
        if (lastPower >= .75) runTally.power += 1;
      }
      if (type === 'monolithDown') profile.tally.monoliths = (profile.tally.monoliths || 0) + 1;
      if (type === 'cleanBank') runTally.banks += 1;
      if (type === 'drive') runTally.overdrive = true;
      if (type === 'hurt') runTally.hits += 1;
      if (type === 'sector' && d) {
        runTally.sector = Math.max(runTally.sector, Number(d.band) || 1);
        runTally.seals += 1;
        // A sector sealed with no hits taken is a flawless seal.
        if (runTally.hits === 0) runTally.flawless += 1;
      }
      if(type==='waveClear'||type==='dimensionBreak'){
        profile.records.paceTicks=Math.max(profile.records.paceTicks,Math.floor(run.state.bestPace||0));
        profile.records.banks=Math.max(profile.records.banks,run.state.bestCleanBankChain||0,run.state.wave?.cleanBanks.best||0);
        profile.records.shatters=Math.max(profile.records.shatters,run.state.shatters||0);save();
      }
      const payText=`ROUND +${roundReward(run.state).total} CREDITS`;
      if(livePay.textContent!==payText)livePay.textContent=payText;
      const live = roundQuests && !run.state.opening && !run.state.tutorialActive && (!run.state.wave||['combat','breach'].includes(run.state.wave.phase)||type==='waveClear'&&run.state.wave.phase==='return'||type==='waveRest'&&run.state.wave.phase==='choose');
      const opened = ticket.opened;
      const previous = ticket.rows.map((q) => q.value);
      const fresh = ticket.event(type, d, live);
      if(fresh.length)storage.set('quests',JSON.stringify(profile));
      const changed = ticket.rows.find(
        (q, i) => q.value > previous[i] && (q.done || previous[i]===q.start || previous[i]/q.goal<.5 && q.value/q.goal>=.5 || q.value/q.goal>=.75),
      );
      if (
        live &&
        changed &&
        type !== 'over' &&
        (changed.done || performance.now() - lastToast >= 6000)
      ) {
        toast.textContent = changed.done
          ? `${changed.label} ✓ SKILL LEARNED`
          : `${changed.label} · ${changed.value}/${changed.goal}`;
        toast.hidden = false;
        lastToast = performance.now();
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toast.hidden = true;
        }, 1200);
      }
      if (fresh.length) audio.lock();
      if (!opened && ticket.opened) {if(run.state.wave){if(ticket.grant())save();}else openPortal(run);}
      if (type === 'over') {
        peek(false);
        toast.hidden = true;
        clearTimeout(toastTimer);
        const previousSaved = profile.unlock;
        death = ticket.die();
        const settlement = settlePrizeTrack(
          { saved: previousSaved, coins: profile.coins, owned: profile.owned },
          ticket.prize,
          death.saved,
        );
        profile.unlock = settlement.saved;
        profile.records.paceTicks=Math.max(profile.records.paceTicks,Math.floor(run.state.bestPace||0));profile.records.shatters=Math.max(profile.records.shatters,run.state.shatters||0);profile.records.banks=Math.max(profile.records.banks,run.state.bestCleanBankChain||0,run.state.wave?.cleanBanks.best||0);
        const pay=roundReward(run.state);
        profile.coins = settlement.coins + pay.total;
        profile.rounds++;
        profile.bestBand=Math.max(profile.bestBand,Number.isFinite(run.state.band)?run.state.band:1);
        if(roundQuests)profile.recent=[...profile.recent,...ticket.rows.map(q=>q.id)].slice(-9);
        // CHUNK 6: the run-long hook is the SWEEP COUNTER now (a cleared board
        // deals a richer one and climbs), so the chunk-5 streak is gone rather
        // than left fighting it for the same screen space.
        profile.owned = [...settlement.owned];
        const receipt = settlement.receipt;
        save();
        result.replaceChildren(el('h3', '', 'ROUND REWARDS'));
        const payout=el('div','round-payout');payout.setAttribute('role','status');
        payout.append(el('strong','',`+${pay.total}`),el('b','','CREDITS'),el('small','',unlimited ? 'WALLET · ∞ SANDBOX CREDITS' : `WALLET · ${profile.coins.toLocaleString()} CREDITS`));
        prependIcon(payout.querySelector('b'),'coin');
        result.append(payout,el('p','reward-breakdown',`ROUND ${pay.base} · CUTS ${pay.cuts} · SCORE ${pay.score} · ${run.state.wave&&!run.state.narrative?'WAVES':'SECTORS'} ${pay.sectors}`));
        if(run.state.killLedger){
          const breakdown=el('details','kill-breakdown');breakdown.append(el('summary','',`ENEMY REWARDS · ${run.state.killLedger.kills} KILLS`));
          const table=el('div','kill-table');for(const [kind,row]of Object.entries(run.state.killLedger.rows)){const line=el('p','');line.append(el('b','',`${ENEMY_NAMES[kind]||kind} ×${row.kills}`),el('span','',`${row.points} PTS · ${row.credits} CREDITS`));table.append(line);}breakdown.append(table);result.append(breakdown);
          result.append(el('p','shatter-receipt',`CONTROL BEST ${(profile.records.paceTicks/60).toFixed(1)}s · SHATTERS ${run.state.shatters||0}`));
        }
        const bonus=el('details','result-bonuses');bonus.append(el('summary','',roundQuests?'OPTIONAL QUEST BONUSES':'QUESTS OFF · FREE PLAY'));
        if(roundQuests)ticket.rows.forEach((q,i)=>bonus.append(row(q,true,i)));
        result.append(bonus);
        const p = {
            id: receipt.meter.id,
            label: receipt.meter.label,
            cost: receipt.meter.cost,
          },
          progress = el(
            'div',
            'next-prize',
            `BONUS TRACK · ${p.label} · +${death.saved} POINTS`,
          );
        progress.append(
          prizeMeter(profile.unlock, p.cost || 100, receipt.meter.from),
        );
        if (receipt.unlocked.length) {
          const unlock = el(
            'strong',
            'prize-unlocked',
            `${receipt.unlocked.join(' · ')} UNLOCKED`,
          );
          progress.prepend(unlock);
          progress.dataset.rollover = 'true';
        }
        progress.append(
          el(
            'b',
            'prize-remaining',
            `${Math.max(0, (p.cost || 100) - profile.unlock)} POINTS LEFT`,
          ),
        );
        progress.classList.toggle(
          'prize-close',
          profile.unlock / (p.cost || 100) >= 0.65,
        );
        if(roundQuests)result.append(progress);
        const retry = retryButton;
        retry.textContent = 'PLAY AGAIN [SPACE]';
        result.append(retry);
        const change = el('button', 'choice', 'BONUS QUESTS');
        change.onclick = () => {
          offerNonce++;choices = newOffers();
          selected = choices.map((c) => c[0].id);
          drawPicker();
          home();
          boardDialog.showModal();
        };
        const footer = el('div', 'quest-footer');
        footer.append(change, homeButton);
        result.append(footer);
        if (motion() && receipt.earned > 0)
          requestAnimationFrame(() => {
            if (death === null || !progress.isConnected) return;
            const destination = progress.querySelector('.prize-track');
            const end = destination.getBoundingClientRect();
            const sources = [
              ...result.querySelectorAll('.quest-row.complete .quest-done'),
            ];
            for (const [i, source] of sources.entries()) {
              const start = source.getBoundingClientRect();
              for (let j = 0; j < 3; j++) {
                const spark = el('i', 'prize-transfer');
                result.append(spark);
                spark.style.left = `${start.left + start.width / 2}px`;
                spark.style.top = `${start.top + start.height / 2}px`;
                const animation = spark.animate(
                  [
                    { transform: 'translate(0,0)', opacity: 1 },
                    {
                      transform: `translate(${end.left + end.width * 0.5 - start.left - start.width / 2}px,${end.top - start.top - start.height / 2}px)`,
                      opacity: 0,
                    },
                  ],
                  { duration: 450, delay: i * 70 + j * 40, easing: 'ease-in' },
                );
                if (animation) animation.onfinish = () => spark.remove();
              }
            }
          });
      }
      hudDraw();
    },
    tick() {
      const run = getRun();
      if (
        !roundQuests ||
        (run?.state.wave && run.state.wave.phase!=='combat') ||
        !ticket ||
        !run ||
        run.state.opening ||
        run.state.tutorialActive ||
        run.state.phase !== 'playing' ||
        vault
      )
        return;
      const opened = ticket.opened;
      const fresh = ticket.tick(true, !run.world.grounded);
      if (fresh.length) audio.lock();
      if (!opened && ticket.opened) {if(run.state.wave){if(ticket.grant())save();}else openPortal(run);}
      const p = run.state.questPortal;
      if (p) {
        p.age++;
        clearDoor(run);
        if (
          p.age > 30 &&
          Math.hypot(
            run.world.player.position.x - p.x,
            run.world.player.position.y - p.y,
          ) < p.r
        )
          enter();
      }
      // Selected species are replenished near the player, not left to stream luck.
      if (!run.state.wave && ++spawnClock % 240 === 0 && !ticket.opened) {
        const q = ticket.rows.find((q) => q.kind === 'cut' && !q.done);
        if (q) {
          const pos = run.world.player.position;
          const nearby = [...run.combat.enemies.values()].filter(
            (e) =>
              e.kind === q.target &&
              !e.small &&
              Math.hypot(e.x - pos.x, e.y - pos.y) < 900,
          ).length;
          for (let i = 0; i < Math.min(3, q.goal - q.value - nearby); i++)
            run.combat.add({
              id: `quest/${spawnClock}/${i}`,
              kind: q.target,
              x: Math.max(
                ARENA.x + 120,
                Math.min(ARENA.x + ARENA.w - 120, pos.x + (i - 1) * 160),
              ),
              y: Math.max(ARENA.y + 120, pos.y - 240),
              home: 'quest',
              slot: -1,
            });
        }
      }
      hudDraw();
    },
  };
}
