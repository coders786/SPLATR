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
// CHUNK 8: THE DEED BOOK replaces the riot contract board.
//
// The board was three cards of "slice N things" and the player could not tell
// you why any of them existed. Every deed in deeds.js now carries its own
// argument (`why`), what it does to your hands (`pays`), and which of the five
// lanes of play it belongs to. The board deals from 120 of them with distinct
// lanes and axes, weighted toward the lane you finish least often.
import {
  LANES, LANE_BY_ID, DEEDS, DEED_BY_ID, dealDeeds, boardState as deedBoardState, deedById,
  deedMetrics, deedProgress, deedLabel, rerollCost, focusLanes, unlockLine,
  SWEEP_BONUS, EMPTY_BOARD,
} from './deeds.js';

/** Local alias: `deedProgress` is already a function name in this file. */
const DEED_BY_ID_LOCAL = DEED_BY_ID;
import { createDeedTracker } from './deed-tracker.js';
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
  /* ── CHUNK 8: the deed ledger ──────────────────────────────────────────
     `tracker` owns the two ledgers (this run's peaks, lifetime totals) and is
     the ONLY thing that turns a run event into a number. Everything the board
     shows is `deedMetrics(tracker.snapshot())`. */
  const tracker = createDeedTracker(storage, audio);
  // Which deeds have already been announced as claimable this run, so the toast
  // does not repeat on every subsequent tick.
  const announced = new Set();
  const metricsNow = () => {
    const snap = tracker.snapshot();
    return deedMetrics({ run: snap.run, total: snap.total });
  };
  /**
   * CHUNK 8: how much of the book has been finished, and where. This is what
   * the unlock ladder reads — a tier 2 deed is never asked of a player who has
   * not finished six deeds AND at least one in that lane.
   */
  function deedProgressBook() {
    const done = new Set(profile.doneIds || []);
    const lanes = {};
    for (const id of done) {
      const deed = DEED_BY_ID_LOCAL[id];
      if (deed) lanes[deed.lane] = (lanes[deed.lane] || 0) + 1;
    }
    return { done: done.size, lanes };
  }
  // The board is readable BEFORE a run exists (it is opened from the title
  // screen), so the lifetime ledger is loaded up front rather than waiting for
  // `start()`. A run then resets only the per-run half.
  tracker.begin(profile);
  function resetRunTally() { /* superseded by tracker.begin() */ }
  let prize = nextPrize(profile).id;
  // CHUNK 6: contracts are ALWAYS ON. The old switch read
  // `optional-quests` and let a saved profile turn the reward system off — a
  // setting no player wants and one that made the board's purpose unclear.
  // The stored key is no longer read; a profile that still has `off` in it
  // simply cannot switch rewards off any more.
  const questsEnabled = true;
  let roundQuests = questsEnabled;
  let vaultDone = false,
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
  const questButton=el('button','choice quiet','Deeds');questButton.id='quests-btn';questButton.type='button';
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
      roundQuests &&
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
  /* ══ CHUNK 8: THE DEED BOOK (replaces the chunk-6 contract board) ═════════
     What was here was three cards of "slice N things" with no answer to the
     only question that matters: why this quest and not another. This board
     deals three deeds from a book of 120, one per lane, each carrying its own
     argument (`why`) and what it leaves you with (`pays`).

     Deliberately NOT here (moved by request):
       · LIVE ENEMY TRAINING / CONTROL PRACTICE -> `practice()` (Practice & help)
       · the mini-shop -> one `SHOP ->` button in the header, which opens the
         real shop
       · the on/off toggle -> rewards are always on
       · grey flavour footnotes -> the objective is one line, and that is all */

  /* ══ CHUNK 8: THE DEED BOARD ══════════════════════════════════════════════
     Three deeds, one per lane, each with its argument on the card. The board is
     not a list of numbers: every slot answers "why this and not something else".

       · `why`  is printed. It is the point of the design, not a footnote.
       · `pays` is printed under it — what the player keeps afterwards.
       · a lane never repeats on one board, and axes never repeat either, so a
         board is always three different QUESTIONS rather than three kill counts.
       · the deal is weighted toward the lane you finish least often.           */

  /** Give the board a grid if it has none, or if it has been swept. */
  function ensureBoard() {
    const b = profile.board;
    const metrics = metricsNow();
    const st = deedBoardState({ grid: b.grid, claimed: b.claimed, rerolls: b.rerolls }, metrics);
    if (b.grid.length !== 3 || st.sweep) {
      const swept = b.grid.length === 3 && st.sweep;
      const nextBoard = swept ? b.board + 1 : b.board;
      const grid = dealDeeds({
        seed: profile.rounds + 1,
        board: nextBoard,
        metrics,
        recent: profile.recent,
        focus: focusLanes(profile.board.lanes, 2),
        progress: deedProgressBook(),
      });
      profile.board = {
        ...profile.board,
        grid: grid.map((x) => x.id),
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

  /** The dealt deeds, with the lane metadata the card needs attached. */
  function boardDeeds() {
    const board = ensureBoard();
    const metrics = metricsNow();
    const grid = board.grid.map((id) => {
      const deed = deedById(id);
      if (!deed) return null;
      return { ...deed, lane: LANE_BY_ID[deed.lane] };
    }).filter(Boolean);
    const st = deedBoardState({ grid, claimed: board.claimed, rerolls: board.rerolls }, metrics);
    return { board, grid, st, metrics };
  }

  /* ── CHUNK 8: the READ WHY disclosure ────────────────────────────────────
     The argument is the point, but three paragraphs at once turns a game panel
     into a policy document. So the shape is:
        lead   — always visible, one line, imperative
        why    — behind one disclosure per card
        pays   — always visible, one line, what you keep
     The test suite holds that `why` exists for every deed and that pressing
     READ WHY reveals it. It does not hold the page height. */
  function reasoning(deed) {
    const toggle = el('button', 'deed-read', 'READ WHY ▾');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    const body = el('div', 'deed-argument');
    body.hidden = true;
    const why = el('p', 'deed-reason');
    why.append(el('b', '', 'WHY THIS DEED '), document.createTextNode(deed.why));
    const pays = el('p', 'deed-pays');
    pays.append(el('b', '', 'WHAT YOU KEEP '), document.createTextNode(deed.pays));
    body.append(why, pays);
    toggle.onclick = () => {
      const open = body.hidden;
      body.hidden = !open;
      toggle.textContent = open ? 'READ WHY ▴' : 'READ WHY ▾';
      toggle.setAttribute('aria-expanded', String(open));
    };
    return { body, toggle };
  }

  function drawPicker() {
    picker.replaceChildren();
    const { board, grid, st, metrics } = boardDeeds();

    /* ── header ───────────────────────────────────────────────────────── */
    const head = el('div', 'riot-head');
    const title = el('div', 'riot-title');
    title.append(el('b', '', '/// THE DEED BOOK'));
    const laneWord = grid.map((g) => g.lane.id).join(' · ');
    title.append(el('small', '', st.sweep
      ? 'BOARD SWEPT — three fresh deeds dealt'
      : `${st.done}/3 DONE · SWEEPS ${board.sweeps}${laneWord ? ' · ' + laneWord : ''}`));
    head.append(title);
    const wallet = el('div', 'riot-wallet');
    wallet.append(el('b', '', unlimited ? '♦ ∞' : `♦ ${profile.coins.toLocaleString()}`));
    const shop = el('button', 'riot-shop', 'SHOP →');
    shop.type = 'button';
    shop.onclick = () => { boardDialog.close(); openShop?.(); };
    wallet.append(shop);
    head.append(wallet);
    picker.append(head);

    /* ── the three deeds ─────────────────────────────────────────────── */
    const rowEl = el('div', 'riot-contracts deed-row');
    for (const deed of grid) {
      const p = deedProgress(deed, metrics);
      const claimed = board.claimed.includes(deed.id);
      const lane = deed.lane;
      const card = el('article', 'riot-card deed-card');
      card.dataset.lane = lane.id.toLowerCase();
      card.dataset.axis = deed.axis;
      card.dataset.tier = String(deed.tier);
      card.dataset.accent = lane.accent;
      card.style.setProperty('--accent', lane.accent);
      card.dataset.done = String(p.done);
      card.dataset.claimed = String(claimed);

      const top = el('div', 'riot-card-top');
      top.append(el('span', 'riot-tag', lane.tag));
      const tierChip = el('span', 'deed-tier', ['WARM-UP', 'SKILL', 'PERFORMANCE'][deed.tier] || '');
      top.append(tierChip);
      const re = el('button', 'riot-reroll', '↻');
      re.type = 'button';
      const free = rerollCost(board) === 0;
      re.title = free ? 'Reroll this deed (free)' : `Reroll this deed (♦${rerollCost(board)})`;
      // The button states its price on its face, not only in a tooltip: the
      // board's one economy decision should not need a hover to read.
      re.dataset.free = String(free);
      re.textContent = free ? '↻' : `↻${rerollCost(board)}`;
      re.setAttribute('aria-label', re.title);
      re.disabled = claimed || p.done;
      re.onclick = () => {
        const cost = rerollCost(board);
        if (cost > 0 && !unlimited && profile.coins < cost) return;
        if (cost > 0 && !unlimited) profile.coins -= cost;
        const dealt = dealDeeds({
          seed: profile.rounds + 1 + board.rerolls + 31,
          board: board.board,
          avoid: [deed.id],
          metrics,
          recent: profile.recent,
          focus: [deed.lane],
          progress: deedProgressBook(),
        });
        // Prefer the same lane so the board keeps its spread — but a reroll that
        // silently does nothing is worse than one that changes lane. Measured:
        // after a session of normal play, whole lanes can be finished, and the
        // old `|| null` made the ↻ button a no-op that still looked live.
        const fresh = dealt.find((c) => c.lane === deed.lane) || dealt[0] || null;
        if (!fresh) return;
        // Re-read the board: `board` is a snapshot taken before this handler, and
        // writing `profile.board.rerolls + 1` from a stale copy would silently
        // drop the spend (and, if the card was already claimed, the claim).
        profile.board = {
          ...profile.board,
          grid: profile.board.grid.map((id) => (id === deed.id ? fresh.id : id)),
          rerolls: (Number(profile.board.rerolls) || 0) + 1,
        };
        save();
        drawPicker();
      };
      top.append(re);
      card.append(top);

      card.append(el('strong', 'riot-card-title', deed.title));

      /* the argument */
      card.append(el('p', 'deed-lead', deed.lead));
      const r = reasoning(deed);
      card.append(r.body);

      /* the numbers */
      const meter = el('div', 'riot-meter');
      meter.append(el('b', 'riot-count', deedLabel(deed, metrics)));
      const track = el('div', 'riot-track');
      const fill = el('i', 'riot-fill');
      fill.style.width = `${Math.round(p.fraction * 100)}%`;
      track.append(fill);
      meter.append(track);
      card.append(meter);

      /* what you keep — always visible, because it is why the deed is worth doing */
      card.append(el('p', 'deed-keeps', deed.pays));

        const foot = el('div', 'deed-foot');
      foot.append(r.toggle);
      if (p.done && !claimed) {
        const claim = el('button', 'riot-claim deed-claim', `CLAIM ♦ +${deed.pay}`);
        claim.type = 'button';
        claim.onclick = () => {
          profile.coins += deed.pay;
          profile.board = { ...profile.board, claimed: [...profile.board.claimed, deed.id] };
          const row = (profile.board.lanes[deed.lane] ||= { dealt: 0, done: 0 });
          row.done += 1;
          // The lifetime record of what has been finished. It gates the unlock
          // ladder and it is what makes "120 deeds" a book rather than a pile.
          profile.doneIds = [...new Set([...(profile.doneIds || []), deed.id])];
          tracker.note(deed.lane, true);
          save();
          audio?.lock();
          drawPicker();
        };
        card.append(claim);
      } else if (claimed) {
        foot.append(el('b', 'deed-paid', 'CLAIMED ✓'));
      } else {
        foot.append(el('b', 'deed-worth', `♦ +${deed.pay}`));
      }
      card.append(foot);
      rowEl.append(card);
    }
    picker.append(rowEl);

    /* ── the sweep track ─────────────────────────────────────────────── */
    const sweep = el('div', 'riot-sweep');
    sweep.dataset.ready = String(st.sweep);
    const sLeft = el('div', 'riot-sweep-copy');
    sLeft.append(el('b', '', '/// BOARD SWEEP'));
    sLeft.append(el('small', '', st.sweep
      ? 'Swept. Three fresh deeds dealt, sweeps climbing.'
      : `Finish all three to earn ♦ +${SWEEP_BONUS} and deal a fresh board.`));
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
      profile.coins += SWEEP_BONUS;
      profile.board = { ...profile.board, claimed: [] };
      save();
      goalToast(`BOARD SWEPT ✓ +${SWEEP_BONUS} CREDITS`);
    }

    /* ── the lane legend, which is the actual explanation of the board ── */
    const legend = el('div', 'deed-lanes');
    for (const lane of LANES) {
      const chip = el('span', 'deed-lane');
      chip.dataset.lane = lane.id.toLowerCase();
      chip.style.setProperty('--accent', lane.accent);
      chip.append(el('b', '', lane.tag), el('small', '', lane.teaches));
      legend.append(chip);
    }
    picker.append(legend);
    picker.append(el('p', 'riot-note', `${DEEDS.length} deeds. Progress carries between runs. Press Q in a run to check the three you hold.`));
  }

  /* CHUNK 8: one held deed, for the Q drawer and the pause panel. Same three
     facts as the card — what it asks, how close it is, why it exists — at a
     size that fits a HUD. */
  function deedRow(h) {
    const e = el('div', 'quest-row deed-row-item');
    e.dataset.id = h.deed.id;
    e.dataset.lane = h.deed.lane;
    e.style.setProperty('--accent', h.deed.accent);
    e.append(el('span', 'quest-label', h.deed.title));
    e.append(el('b', 'quest-count', `${Math.min(h.value, h.target)}/${h.target}`));
    const track = el('div', 'quest-track');
    const fill = el('i', 'quest-fill');
    fill.style.width = `${Math.round(h.fraction * 100)}%`;
    track.append(fill);
    e.append(track);
    e.append(el('small', 'deed-lead-small', h.deed.lead));
    e.classList.toggle('complete', h.done);
    if (h.done) e.append(el('strong', 'quest-done', h.claimed ? 'CLAIMED' : `CLEAR — ♦ +${h.deed.pay}`));
    return e;
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
    if (!roundQuests) {
      pipButton.replaceChildren();drawer.hidden=true;
      pauseQuests.replaceChildren(el('h3','','FREE PLAY'),el('p','','Deeds are off. Every round earns CREDITS.'));
      return;
    }
    /* CHUNK 8: the HUD reads the BOARD, not the old ticket. A player holding
       three deeds should be able to see which three, and how close the nearest
       one is, without opening anything. */
    const metrics = metricsNow();
    const held = profile.board.grid.map(deedById).filter(Boolean).map((deed) => ({
      deed, ...deedProgress(deed, metrics), claimed: profile.board.claimed.includes(deed.id),
    }));
    const signature =
      held.map((h) => `${h.deed.id}:${h.value}:${h.done}`).join('|') +
      `:${profile.unlock}`;
    if (signature === lastHUD) return;
    lastHUD = signature;
    pipButton.replaceChildren();
    const next = held.filter((h) => !h.done).sort((a, b) => b.fraction - a.fraction)[0];
    if (next) {
      const text = el('span', 'quest-next', `${next.deed.title} · ${next.value}/${next.target}`);
      pipButton.append(text);
    } else {
      pipButton.append(el('span', 'quest-next', held.length ? 'ALL THREE CLEAR — CLAIM IN DEEDS' : 'BOARD OPEN'));
    }
    for (const h of held) {
      const pip = el('i', 'quest-pip');
      pip.dataset.lane = h.deed.lane;
      pip.dataset.on = String(h.done);
      pip.style.setProperty('--accent', h.deed.accent);
      pipButton.append(pip);
    }
    const cleared = held.filter((h) => h.done).length;
    pipButton.setAttribute(
      'aria-label',
      `${cleared} of ${held.length} deeds complete. Press Q or tap for details.`,
    );
    /* The drawer and the pause panel both show the held deeds, with the
       argument one tap away — that is the whole point of the book. */
    for (const panel of [drawer, pauseQuests]) {
      panel.replaceChildren(el('h3', '', 'YOUR DEEDS'));
      for (const h of held) panel.append(deedRow(h));
      panel.append(el('p', 'deed-drawer-note', 'Open DEEDS on the title screen to claim and reroll.'));
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
  /**
   * CHUNK 8: the vault is the board's own prize track.
   *
   * It used to open when three lesson rows finished, which is not a thing the
   * shipped mode can do any more. It now opens on a SWEEP: three deeds, one
   * board, all three clear. The reward is the same governed settlement
   * (`settlePrizeTrack`) — this only changes what earns the door.
   */
  function collectPrize() {
    const before = profile.unlock;
    const reward = PARTS.find((p) => p.id === prize);
    const settlement = settlePrizeTrack(
      { saved: before, coins: profile.coins, owned: profile.owned },
      prize,
      Math.min(reward?.cost || 100, before + SWEEP_BONUS),
    );
    profile.unlock = settlement.saved;
    profile.coins = settlement.coins;
    profile.owned = [...settlement.owned];
    save();
    return { reward, settlement };
  }
  function enter() {
    if (vault) return;
    save();
    vault = true;
    // The board's door opens ONCE per completed board. Without this the sweep is
    // still true on the next tick (the board is only re-dealt when it is read),
    // so the door reopened the moment the player left the vault.
    vaultDone = true;
    age = 0;
    resetInput();
    scene.hidden = false;
    resume(false);
    const reward = PARTS.find((p) => p.id === prize)?.label || 'CREDIT CHEST';
    receipt.textContent = `${reward} · BOUNTY CLAIMED`;
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
    drawVaultScene(c,w,h,{time:now,age,ticket:null});
  }
  requestAnimationFrame(forceFrame);
  drawPicker();
  return {
    wallet: () => unlimited ? Number.MAX_SAFE_INTEGER : profile.coins,
    ownedParts: () => [...profile.owned],
    /**
     * CHUNK 8 (§3.1 of the chunk-7 plan): the pause screen gets a read on the
     * run, in the same three-slot language as the board. A pause is the moment
     * a player wants to know where they stand, and it used to be the thinnest
     * panel in the game.
     */
    pauseRead() {
      const metrics = metricsNow();
      return profile.board.grid
        .map(deedById)
        .filter(Boolean)
        .map((deed) => ({
          id: deed.id,
          title: deed.title,
          lane: deed.lane,
          accent: deed.accent,
          label: deedLabel(deed, metrics),
          done: deedProgress(deed, metrics).done,
        }));
    },
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
      prize = nextPrize(profile).id;
      ensureBoard();
      drawPicker();
    },
    start() {
      // CHUNK 8: a run starts with a fresh per-run ledger and the lifetime one
      // intact. The board is READ, not re-dealt, so the three deeds you were
      // given before the run are the three you are asked to prove during it.
      tracker.begin(profile);
      announced.clear();
      vaultDone = false;
      for (const deed of profile.board.grid.map(deedById).filter(Boolean)) tracker.note(deed.lane, false);
      ensureBoard();
      drawPicker();
      if (profile.owned.includes(prize)) prize = nextPrize(profile).id;
      roundQuests=questsEnabled;
      hud.hidden=!roundQuests;
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
      // a practice or dev session has no deed ledger, so this check sits before
      // the ledger gate. It is a run event, not a quest event.
      if (type === 'goalPaid' && d) goalToast(`BONUS ${d.label} ✓ +${d.credits} CREDITS`);
      // CHUNK 4: a post arrives on a clear with no picker, so it says so.
      if (type === 'postPaid' && d) goalToast(`POST · ${String(d.name || d.id).toUpperCase()}`);
      if (!run || run.state.practice || (type === 'over' && death)) return;
      // ── CHUNK 8: FEED THE DEED LEDGER ────────────────────────────────
      // One call. `deed-tracker.js` owns every rule about what a run event
      // means; this file only forwards it, with the two things the run cannot
      // tell the tracker on its own: where in the arena the cut happened
      // (height) and whether the victim was a fork's child.
      {
        const enemy = d?.entityId != null ? run.combat?.enemies?.get?.(d.entityId) : null;
        const top = run.world?.arena ? run.world.arena.y + run.world.arena.h * 0.66 : null;
        const bottom = run.world?.arena ? run.world.arena.y + run.world.arena.h * 0.34 : null;
        const y = Number(d?.y);
        const height =
          !run.world?.arena || !Number.isFinite(y) ? null
            : y >= top ? 'top'
              : y <= bottom ? 'bottom'
                : 'middle';
        tracker.event(type, {
          ...d,
          height,
          heir: typeof d?.entityId === 'string' && /^kid-/.test(d.entityId),
          heirOf: enemy?.kind === 'fang' && enemy?.small ? true : undefined,
        });
      }
      liveKills.textContent=`KILLS ${run.state.kills||0}`;
      // Every deed number comes from `tracker` (fed above). What is recorded
      // here is the ROUND RECEIPT's peaks, which the end card reads — keeping
      // the two separate is why a stale counter can never make a deed look
      // finished.
      if(type==='waveClear'||type==='dimensionBreak'){
        profile.records.paceTicks=Math.max(profile.records.paceTicks,Math.floor(run.state.bestPace||0));
        profile.records.banks=Math.max(profile.records.banks,run.state.bestCleanBankChain||0,run.state.wave?.cleanBanks.best||0);
        profile.records.shatters=Math.max(profile.records.shatters,run.state.shatters||0);save();
      }
      const payText=`ROUND +${roundReward(run.state).total} CREDITS`;
      if(livePay.textContent!==payText)livePay.textContent=payText;
      if (type === 'over') {
        peek(false);
        toast.hidden = true;
        clearTimeout(toastTimer);
        // CHUNK 8: the lifetime ledger is folded in once, at the end of the run.
        // Depth counts RUNS THAT GOT THIS FAR, so it is banked here and not per
        // tick — banking per tick would count one deep run a thousand times.
        const settled = tracker.settle();
        profile.total = { ...profile.total, ...settled.total };
        const previousSaved = profile.unlock;
        // The prize track is paid from the run's own depth, on the same
        // governed settlement the vault uses.
        const earned = Math.min(100, 10 + run.state.band * 6 + (run.state.flawless || 0) * 8);
        death = { saved: earned, heads: {} };
        const settlement = settlePrizeTrack(
          { saved: previousSaved, coins: profile.coins, owned: profile.owned },
          prize,
          earned,
        );
        profile.unlock = settlement.saved;
        profile.records.paceTicks=Math.max(profile.records.paceTicks,Math.floor(run.state.bestPace||0));profile.records.shatters=Math.max(profile.records.shatters,run.state.shatters||0);profile.records.banks=Math.max(profile.records.banks,run.state.bestCleanBankChain||0,run.state.wave?.cleanBanks.best||0);
        const pay=roundReward(run.state);
        profile.coins = settlement.coins + pay.total;
        profile.rounds++;
        profile.bestBand=Math.max(profile.bestBand,Number.isFinite(run.state.band)?run.state.band:1);
        if (roundQuests) profile.recent = [...profile.recent, ...profile.board.grid].slice(-12);
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
        // CHUNK 8: the end card reports the BOARD, not a lesson ladder: the
        // three deeds you held, what each has left, and why it exists.
        const bonus = el('details', 'result-bonuses');
        bonus.append(el('summary', '', roundQuests ? 'YOUR THREE DEEDS' : 'DEEDS OFF · FREE PLAY'));
        if (roundQuests) {
          const metrics = metricsNow();
          for (const deed of profile.board.grid.map(deedById).filter(Boolean)) {
            bonus.append(deedRow({ deed, ...deedProgress(deed, metrics), claimed: profile.board.claimed.includes(deed.id) }));
          }
        }
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
        // CHUNK 8: the end card's one door is the board itself. It used to
        // re-roll a lesson hand; a deed board is already live, so this reads it.
        const change = el('button', 'choice', 'THE DEED BOOK');
        change.onclick = () => {
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
        !run ||
        run.state.opening ||
        run.state.tutorialActive ||
        run.state.phase !== 'playing' ||
        vault
      )
        return;
      // CHUNK 8: the tracker needs the things only the simulation knows —
      // whether the cube is on the floor, whether it is in Hyper, how fast it
      // is going, the pace director's own reading, and the sector number.
      // All optional: a missing field means "unknown", never a silent zero.
      tracker.step({
        grounded: !!run.world.grounded,
        hyping: !!run.state.hyper,
        speed: Number.isFinite(run.state.moved) ? run.state.moved : undefined,
        pace: run.state.wave?.pace,
        band: run.state.band,
        holding: !!run.state.held,
      });
      /* CHUNK 8: A SWEPT BOARD OPENS THE VAULT.
         The board is read here rather than only on the title screen, so a
         player who finishes the third deed mid-run gets the door in the run —
         the moment they earned it — instead of on a menu they have to go find.
         `enter()` is idempotent through `vault`, and the board is swept again
         the next time it is read, so this cannot fire twice. */
      if (roundQuests && !vault && !vaultDone && !run.state.questPortal) {
        const st = deedBoardState({ grid: profile.board.grid, claimed: profile.board.claimed, rerolls: profile.board.rerolls }, metricsNow());
        if (st.sweep) {
          announced.clear();
          openPortal(run);
        }
      }
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
      /* CHUNK 8: THE BOARD REPLENISHES ITS OWN TARGETS.
         A deed that names a species must not depend on the spawn stream being
         kind. The old board did this for `kind: 'cut'` rows; this one does it
         for the SPECIES deeds (fang / prism / fork / bastion), and only for
         those, because a deed about pace or height has nothing to spawn. Twenty
         ticks is a slow drip: it tops a field up, it does not deliver kills. */
      if (++spawnClock % 240 === 0) {
        const metrics = metricsNow();
        const hungry = profile.board.grid
          .map((id) => DEED_BY_ID_LOCAL[id])
          .filter((deed) => deed && ['fang', 'prism', 'fork', 'bastion'].includes(deed.metric))
          .filter((deed) => !deedProgress(deed, metrics).done)
          .sort((a, b) => deedProgress(a, metrics).fraction - deedProgress(b, metrics).fraction)[0];
        if (hungry) {
          const pos = run.world.player.position;
          const near = [...run.combat.enemies.values()].filter(
            (e) => e.kind === hungry.metric && !e.small && Math.hypot(e.x - pos.x, e.y - pos.y) < 900,
          ).length;
          const want = Math.min(3, Math.max(1, Math.ceil(hungry.target / 6)) - near);
          for (let i = 0; i < want; i++)
            run.combat.add({
              id: `deed/${spawnClock}/${i}`,
              kind: hungry.metric,
              x: Math.max(ARENA.x + 120, Math.min(ARENA.x + ARENA.w - 120, pos.x + (i - 1) * 160)),
              y: Math.max(ARENA.y + 120, pos.y - 240),
              home: 'deed',
              slot: -1,
            });
        }
      }
      hudDraw();
    },
  };
}
