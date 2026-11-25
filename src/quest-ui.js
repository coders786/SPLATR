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
  LANES,
  boardSummary,
  streakHolds,
} from './quests.js';
import { ARENA } from './levels.js';

export function createQuestUI({
  getRun,
  unlimited = false,
  practice=null,
  startTutorial=null,
  teaching=null,
  storage,
  audio,
  resetInput,
  home,
  resume,
  view,
  motion = () => true,
}) {
  const profile = loadProfile(storage.get('quests', '{}'));
  let offerNonce=0;
  const newOffers=()=>learningOffers({seed:Math.imul(profile.rounds+1,2654435761)+offerNonce,learned:profile.learned});
  let choices = newOffers(),
    selected = choices.map(c=>c[0].id),
    prize = nextPrize(profile).id;
  let questsEnabled = storage.get('optional-quests', 'on') !== 'off';
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
  if(teaching){const trainingButton=el('button','control-practice-entry','LIVE ENEMY TRAINING');trainingButton.type='button';trainingButton.onclick=()=>{boardDialog.close();teaching();};boardDialog.append(trainingButton);}
  if(practice){const controlButton=el('button','control-practice-entry control-drill-entry','CONTROL PRACTICE');controlButton.type='button';prependIcon(controlButton,'practice');controlButton.onclick=()=>{boardDialog.close();practice();};boardDialog.append(controlButton,el('p','control-entry-note','Safe arena. Actual controls. No damage or rewards.'));}
  boardDialog.append(picker);document.querySelector('#game').append(boardDialog);
  // CHUNK 1: the title used to show BOTH 'Learn' and 'Field manual', and both
  // opened the same panel (startTutorial resolves to open('manual')). One door
  // now: QUESTS, which is a different thing, sitting beside the single
  // practice/help door. Nothing on the menu is a synonym for anything else.
  const questButton=el('button','choice quiet','Quests');questButton.id='quests-btn';questButton.type='button';
  questButton.onclick=()=>{resetInput();boardDialog.showModal();};
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
  /**
   * CHUNK 5: THE BOUNTY BOARD.
   *
   * What was here was three columns x three tiers = nine near-identical
   * `GOAL · 2` buttons, with the only part that answers "why?" — the prize —
   * folded inside <details>Optional rewards</details>, under a switch already
   * labelled GUIDED QUESTS ON. The board asked for work and hid the pay.
   *
   * It is now three lanes, one contract each, every contract carrying its own
   * credit value on its face, and the prize ladder visible above it. One
   * contract per lane is deliberate: a choice between nine is not a choice, it
   * is a menu, and this screen is the last thing a player reads before a run.
   */
  function drawPicker() {
    picker.replaceChildren();
    const sum = boardSummary({ rows: choices.map((c) => c[0]), streak: profile.streak || 0 });

    /* ── the header: what this screen is, and what it pays ── */
    const head = el('div', 'bounty-head');
    const title = el('div', 'bounty-title');
    title.append(el('b', '', 'BOUNTY BOARD'));
    title.append(el('small', '', sum.line));
    head.append(title);
    const toggle = el('button', 'quest-toggle', questsEnabled ? 'BOUNTIES · ON' : 'BOUNTIES · OFF');
    toggle.type = 'button';
    toggle.setAttribute('aria-pressed', String(questsEnabled));
    toggle.onclick = () => { questsEnabled = !questsEnabled; storage.set('optional-quests', questsEnabled ? 'on' : 'off'); drawPicker(); };
    head.append(toggle);
    picker.append(head);

    /* ── the streak: the one number that outlives a run ── */
    if ((profile.streak || 0) > 0 || (profile.bestStreak || 0) > 0) {
      const streak = el('div', 'bounty-streak');
      streak.append(el('b', '', `STREAK ${profile.streak || 0}`));
      streak.append(el('small', '', profile.streak > 0
        ? 'Complete every contract in a run to keep it. One short and it resets.'
        : `Your best was ${profile.bestStreak || 0}. Clear a full board to start again.`));
      picker.append(streak);
    }

    if (!questsEnabled) {
      picker.append(el('p', 'quest-total', 'Free play. No contracts, no credit bounties — the run pays its round reward only.'));
      return;
    }

    /* ── the three contracts ── */
    const lanes = el('div', 'bounty-lanes');
    choices.forEach((col, i) => {
      const lane = LANES[i];
      const q = col[0];
      const box = el('div', 'bounty-lane');
      box.dataset.lane = lane.id;
      const promise = el('div', 'bounty-promise');
      promise.append(el('b', '', lane.name), el('span', '', lane.promise));
      box.append(promise);

      const b = el('button', 'bounty-card');
      b.type = 'button';
      b.dataset.tier = q.lesson ? 'practice' : ['quick', 'skill', 'mastery'][q.tier];
      b.setAttribute('aria-pressed', 'true');
      b.setAttribute('aria-label', `${q.label}. ${questInstruction(q)} Pays ${q.points} credits.`);

      const top = el('div', 'bounty-top');
      top.append(el('small', 'bounty-tier', q.lesson ? 'PRACTICE' : ['QUICK', 'SKILL', 'MASTERY'][q.tier]));
      top.append(el('b', 'bounty-pay', `+${q.points}`));
      b.append(top);
      b.append(el('strong', '', q.label));
      b.append(el('span', 'bounty-how', questInstruction(q)));

      // The contract's own progress, if this one has been worked before.
      const kept = profile.heads[q.id] || 0;
      if (kept > 0) {
        const pips = el('div', 'bounty-progress');
        const track = el('div', 'bounty-track');
        const fill = el('i', 'bounty-fill');
        fill.style.width = `${(100 * kept) / q.goal}%`;
        track.append(fill);
        pips.append(track, el('small', '', `${kept}/${q.goal} CARRIED OVER`));
        b.append(pips);
      }
      b.append(el('em', 'bounty-detail', lane.detail));
      b.onpointerenter = () => { for (const c of picker.querySelectorAll('.bounty-card')) c.classList.remove('pointer-hover'); b.classList.add('pointer-hover'); };
      b.onpointerleave = () => b.classList.remove('pointer-hover');
      box.append(b);
      lanes.append(box);
    });
    picker.append(lanes);

    /* ── the reward ladder, ON the board, not behind a fold ── */
    const prizes = el('div', 'bounty-prizes');
    const phead = el('div', 'bounty-prizes-head');
    phead.append(el('b', '', 'WHAT IT PAYS OUT'));
    const wallet = el('span', 'menu-credit-wallet', unlimited ? '◈ ∞ SANDBOX' : `◈ ${profile.coins.toLocaleString()}`);
    phead.append(wallet);
    prizes.append(phead);
    const row = el('div', 'bounty-prize-row');
    for (const p of PARTS) {
      const owned = profile.owned.includes(p.id);
      const b = el('button', 'prize-option');
      b.type = 'button';
      b.disabled = owned;
      b.dataset.owned = String(owned);
      b.setAttribute('aria-label', owned ? `${p.label}, owned` : `${p.label}, ${p.cost} credits`);
      const preview = el('canvas', 'prize-preview');
      preview.width = 100; preview.height = 85; preview.dataset.part = p.id;
      b.append(preview, el('small', '', p.label), el('b', '', owned ? 'OWNED' : `◈ ${p.cost}`));
      row.append(b);
    }
    prizes.append(row);
    picker.append(prizes);

    picker.append(el('p', 'quest-total', 'Press Q during a run to check these off. Contracts pay once each.'));
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
        // CHUNK 5: THE STREAK. A full board extends it, one short contract
        // resets it — the only state in this system that outlives a run, and
        // the reason to protect a board instead of abandoning it.
        if (roundQuests) {
          const held = streakHolds(ticket);
          profile.streak = held ? (profile.streak || 0) + 1 : 0;
          profile.bestStreak = Math.max(profile.bestStreak || 0, profile.streak);
        }
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
