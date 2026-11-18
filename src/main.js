import { createRun, CHAIN_TIME } from './run.js';
import { firstStart } from './opening.js';
import { createClock } from './clock.js';
import { createRenderer } from './renderer.js';
import { createInput, enableMenuTaps } from './input.js';
import { createAudio } from './audio.js';
import { createPokiBridge } from './poki.js';
import { freshSeed, district, openingFacing } from './levels.js';
import { TYPES, SPECIES } from './shapes.js';
import { drawSpecimen } from './field-guide.js';
import { drawStrokePrint } from './print.js';
import { SPEEDS, setSpeed, speedIndexOf, speed } from './pace.js';
import { TIERS } from './motion.js';
import { speedReadout } from './motion.js';
import { MAX_SPEED } from './physics.js';
const $ = (id) => document.getElementById(id),
  game = $('game'),
  canvas = $('arena'),
  dialog = $('panel'),
  hud = $('hud'),
  clock = createClock(),
  renderer = createRenderer(canvas),
  audio = createAudio(),
  poki = createPokiBridge({ fetchSDK: __LOAD_POKI_SDK__ });
void poki.init();
enableMenuTaps();
const setText = (id, txt) => {
  const el = $(id);
  if (el.textContent !== String(txt)) el.textContent = txt;
};
const storage = {
  get(k, otherwise) {
    try {
      return localStorage.getItem(`riot.${k}`) ?? otherwise;
    } catch {
      return otherwise;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`riot.${k}`, String(v));
    } catch {
      /* optional in embeds */
    }
  },
};
const begin=firstStart(storage),coarse=matchMedia('(pointer:coarse)');
let mix=storage.get('fieldMix',storage.get('opening','auto')==='off'?'full':'gradual');
if(mix!=='full')mix='gradual';
let lastDevice=coarse.matches?'touch':'mouse';
// Native touch menu activation may synthesize click() with detail=0, just
// like a keyboard click. Remember the actual input, not that ambiguous click.
window.addEventListener('pointerdown',e=>{lastDevice=e.pointerType==='touch'?'touch':'mouse';},true);
window.addEventListener('keydown',()=>{lastDevice='keys';},true);
const pref = matchMedia('(prefers-reduced-motion: reduce)'),
  opts = {
    motion: storage.get('motion', pref.matches ? '0' : '1') === '1',
    music: storage.get('music', '1') === '1',
    assist: storage.get('assist', '1') === '1',
  };
// The picked speed is a real preference: it survives a reload and can be
// changed between runs without touching a designer constant.
setSpeed(storage.get('pace', 'fast'));
const score = (n) => String(n).padStart(6, '0'),
  two = (n) => String(n).padStart(2, '0');
let best = Math.max(0, Math.floor(Number(storage.get('best', 0)) || 0));
if (!Number.isSafeInteger(best)) best = 0;
let run = null,
  page = null,
  returnTo = 'title',
  seed,
  raf = 0,
  nextHUD = 0,
  lastBeat = -1,
  dirty = true,
  lastRevision = -1,
  manualIndex = 0,
  noticePriority = 0,
  receiptTicks = 0,
  noticeTicks = 0;
const active = () =>
  run && !dialog.open && !document.hidden && ['ready', 'playing'].includes(run.state.phase);
const say = (s) => setText('announcement', s);
function portal() {
  poki.setPlaying(!!active());
}
function pop(text, ticks = 65, priority = 1) {
  if (noticeTicks && priority < noticePriority) return;
  noticePriority = priority;
  setText('callout', text);
  $('callout').hidden = false;
  noticeTicks = ticks;
  say(text);
}
function buzz(ms) {
  if (opts.motion && navigator.userActivation?.hasBeenActive && navigator.vibrate)
    navigator.vibrate(ms);
}
function record() {
  const s = run.state,
    record = s.score > best;
  if (record) {
    best = s.score;
    storage.set('best', best);
  }
  setText('verdict', record ? 'New personal best' : 'Final score');
  setText('result-score', score(s.score));
  setText('result-kills', s.kills);
  setText('result-chain', `${s.maxChain} hit${s.maxChain === 1 ? '' : 's'}`);
  setText('result-sector', s.opening ? '—' : two(s.band));
  setText(
    'cause',
    s.cause === 'Retired'
      ? s.shots
        ? 'You banked this run.'
        : 'No stroke taken.'
      : s.cause === 'Redline'
        ? 'Caught by the Redline.'
        : `Broken by ${s.cause}.`,
  );
  setText('debrief', s.throughcuts?`${s.throughcuts} throughcut${s.throughcuts===1?'':'s'} in ${s.shots} dash${s.shots===1?'':'es'}.`:s.shots?`${s.shots} dash${s.shots===1?'':'es'} · ${s.kills} slashed.`:'');
  const print = s.bestStroke;
  $('best-print').hidden = !print;
  if (print) {
    drawStrokePrint($('stroke-map'), print);
    setText('print-points', `+${print.points.toLocaleString('en-US')}`);
    setText(
      'print-type',
      `${print.released ? 'Throughcut' : 'Slash'} · ${print.kills} ${print.kills === 1 ? 'shape' : 'shapes'}`,
    );
    setText('print-shot', `No. ${two(print.shot)}`);
  }
  setText(
    'run-record',
    `BEST ${score(best)}   /   SEED ${s.seed.toString(16).padStart(8, '0').toUpperCase()}`,
  );
  open('result');
  say(`Run over. ${s.score} points. Best ${best}.`);
}
function event(type, d) {
  renderer.event(type, d, opts.motion);
  switch (type) {
    case 'field':
      renderer.field(run.world.player.position, openingFacing(seed));
      input.reset(); audio.zone();
      break;
    case 'catch':
      input.reset();audio.catchNet();
      break;
    case 'dash':
      audio.launch(d.power);
      break;
    case 'cut':
      audio.strike(d.impact.cue, d.chain);
      if (d.kind === 'crown') pop('Crown split', 48, 2);
      if (d.throughcut) {
        $('imprint').hidden = false;
        setText('stroke-name','Throughcut');
        setText('stroke-award', `+${d.strokePoints.toLocaleString('en-US')}`);
        receiptTicks = 60;
      }
      break;
    case 'shear':
      buzz(17);
      say('Throughcut.');
      break;
    case 'armor':
      audio.strike('armor');
      buzz(9);
      break;
    case 'parry':
      audio.strike('parry');
      break;
    case 'hurt':
      audio.strike('hurt');
      buzz(24);
      pop(`Hull hit  /  ${d.cause}`, 48, 3);
      break;
    case 'break':
      input.cancel();
      audio.strike('break');
      buzz(38);
      portal();
      break;
    case 'sector':
      audio.zone();
      if (d.band % 3 === 0) pop('Crown incoming', 72);
      else say(`Sector ${d.band}: ${d.name}`);
      break;
    case 'drive':
      audio.strike('drive');
      say('Overdrive.');
      break;
    case 'bank': {
      // ── THE SONIC BOOM ──────────────────────────────────────────────────
      //
      // A rail bounce at speed is the most satisfying thing a billiard game
      // does, and it was silent. This turns the event the physics already
      // produces into a moment: a ring at the contact point, a burst of
      // tapered speed lines, a hard camera-free flash, and -- above all -- a
      // NAMED, COUNTED rally. "BANK ×4" tells the player they are building
      // something, which is the difference between a bounce and a run.
      const hard = d.speed >= MAX_SPEED * 0.86;
      audio.strike(hard ? 'drive' : 'parry');
      if (d.combo) say(`BANK ×${d.banks}`);
      else if (hard) say('BANK');
      break;
    }
    case 'tier':
      // Crossing into a new speed tier is the mastery moment this game was
      // missing: the player did something right, and until now the only reward
      // was a slightly longer smear. Naming the tier out loud turns a
      // continuous variable into an achievement.
      audio.strike(d.id === 'redline' ? 'drive' : 'armor');
      say(`${d.label}  ·  ×${d.multiplier}`);
      break;
    case 'repair':
      pop('Crown split · Hull +1', 55, 3);
      break;
    case 'over':
      record();
      break;
  }
  nextHUD = 0;
}
const input = createInput(canvas, {
  get: () => run,
  active,
  point: renderer.worldPoint,
  assist: () => opts.assist,
  engage(device) {
    lastDevice = device;
    audio.unlock();
    audio.focus(false);
  },
  lock: {
    once: null,
    at: -1e9,
    tick() {
      // One quiet chirp per acquisition; wiggling across shapes cannot
      // machine-gun the sound.
      const now = performance.now();
      if (now - this.at < 140) return;
      this.at = now;
      audio.lock();
    },
  },
  commit(v) {
    // A magnetised release really is a touch wider along that corridor. Only
    // this launch; the next unassisted shot is ordinary reach again.
    const ok = run.dash(v);
    if (!ok && !run.state.opening && run.state.edge <= 0) say('Out of cuts.');
    return ok;
  },
});
function syncSettings() {
  for (const [id, on] of [
    ['audio-opt', audio.enabled],
    ['music-opt', opts.music],
    ['motion-opt', opts.motion],
    ['assist-opt', opts.assist],
  ]) {
    const b = $(id);
    b.querySelector('b').textContent = on ? 'On' : 'Off';
    b.setAttribute('aria-pressed', on);
  }
  $('pace-opt').querySelector('b').textContent=speed().label;
  setText('pace-note',speed().note);
  $('opening-opt').querySelector('b').textContent=mix==='full'?'Full field':'Gradual';
  setText('opening-note',mix==='full'?'Start among mixed enemies, without the opening scene.':'Start with a single Fang. The paper racks appear only on your very first run.');
  for (const b of document.querySelectorAll('.sound')) {
    b.querySelector('use').setAttribute('href', audio.enabled ? '#i-sound' : '#i-mute');
    b.setAttribute('aria-label', audio.enabled ? 'Mute audio' : 'Enable audio');
    b.setAttribute('aria-pressed', audio.enabled);
  }
  for (const b of document.querySelectorAll('.full')) b.disabled = !document.fullscreenEnabled;
  $('full-opt').querySelector('b').textContent = document.fullscreenEnabled
    ? document.fullscreenElement
      ? 'Exit'
      : 'Enter'
    : 'Unavailable';
}
$('pace-opt').onclick = () => {
  const next = SPEEDS[(speedIndexOf(speed().id) + 1) % SPEEDS.length];
  setSpeed(next.id);
  storage.set('pace', next.id);
  dirty = true;
  syncSettings();
  audio.menu();
};
$('opening-opt').onclick = () => {
  mix=mix==='full'?'gradual':'full';
  storage.set('fieldMix',mix);
  syncSettings();
  audio.menu();
};
function mute() {
  audio.toggle();
  syncSettings();
}
document.querySelector('.sound').onclick = mute;
$('audio-opt').onclick = mute;
for (const k of ['music', 'motion', 'assist'])
  $(k + '-opt').onclick = () => {
    opts[k] = !opts[k];
    storage.set(k, +opts[k]);
    dirty = true;
    syncSettings();
    audio.menu();
  };
pref.addEventListener('change', () => {
  if (storage.get('motion', null) === null) {
    opts.motion = !pref.matches;
    dirty = true;
    syncSettings();
  }
});
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.fullscreenEnabled) await game.parentElement.requestFullscreen();
  } catch {
    say('Browser fullscreen unavailable. The arena already fills this view.');
  }
}
for (const b of document.querySelectorAll('.full')) b.onclick = fullscreen;
document.addEventListener('fullscreenchange', syncSettings);
let lastHp = null,
  lastScore = null,
  lastChain = null,
  hitTimer = 0,
  kickTimer = 0,
  flareTimer = 0;
function updateHUD() {
  if (!run) return;
  const s = run.state;
  setText('score', score(s.score));
  hud.dataset.place = s.opening ? 'room' : 'field';
  $('chain').hidden = !!s.opening || s.chain < 2;
  setText('chain-text', `${s.chain} HIT CHAIN`);
  setText('multiplier', `×${Math.min(8, s.chain) * (s.drive > 0 ? 2 : 1)}`);
  $('chain-meter').style.transform = `scaleX(${s.chainTime / CHAIN_TIME})`;
  Array.from($('hull').children).forEach((n, i) => n.classList.toggle('empty', i >= s.hp));
  $('hull').setAttribute('aria-label', `${s.hp} hull remaining`);
  // Reactive HUD. Each of these is a one-frame attribute flip that a CSS
  // animation hooks, so the feedback costs no timers and cannot queue up
  // behind itself if the player is hit twice inside one animation.
  // `lastHp`/`lastScore`/`lastChain` live outside this function so a paused or
  // hidden tab resuming does not fire a false "you were hit".
  if (lastHp !== null && s.hp < lastHp) {
    const row = $('hull').closest('.hull');
    row.removeAttribute('data-hit');
    void row.offsetWidth; // force the animation to restart
    row.setAttribute('data-hit', '');
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => row.removeAttribute('data-hit'), 420);
  }
  if (lastScore !== null && s.score > lastScore) {
    const scoreEl = $('score');
    scoreEl.removeAttribute('data-kick');
    void scoreEl.offsetWidth;
    scoreEl.setAttribute('data-kick', '');
    clearTimeout(kickTimer);
    kickTimer = setTimeout(() => scoreEl.removeAttribute('data-kick'), 220);
  }
  if (lastChain !== null && s.chain > lastChain && s.chain >= 2) {
    const chainEl = $('chain');
    chainEl.removeAttribute('data-flare');
    void chainEl.offsetWidth;
    chainEl.setAttribute('data-flare', '');
    clearTimeout(flareTimer);
    flareTimer = setTimeout(() => chainEl.removeAttribute('data-flare'), 240);
  }
  lastHp = s.hp;
  lastScore = s.score;
  lastChain = s.chain;
  setText('sector', s.opening ? 'Cutting room' : `Sector ${two(s.band)}`);
  setText('district', s.opening ? `Rack ${two(s.opening.row + 1)} / 03` : district(seed, s.band));
  // Speedometer: the cube's own velocity, not the world's tempo, so the
  // number is about the player's flying rather than the game's difficulty.
  const vel = run.world.player.velocity,
    readout = speedReadout(Math.hypot(vel.x, vel.y), MAX_SPEED),
    dial = $('speedo');
  dial.dataset.band = readout.band;
  dial.setAttribute('aria-label', `Speed ${readout.kmh}, ${readout.band.toLowerCase()}`);
  setText('speedo-value', readout.kmh);
  setText('speedo-band', readout.band);
  // The dial has two encodings of the same number on purpose: an arc (a
  // length) and a needle (an angle). The needle is what a player actually
  // reads mid-flight, because angle is legible at a glance while length is
  // not. Both are mirrored from the same 0..100 so they cannot disagree.
  dial.querySelector('.speedo-fill').style.strokeDashoffset = 100 - readout.kmh;
  // -90deg is the needle at rest (pointing left across the dial); a full 0..100
  // sweep is 180deg. Written as one expression so the geometry lives here
  // rather than in two places that drift apart.
  const needle = dial.querySelector('.speedo-needle');
  if (needle) needle.style.transform = `rotate(${-90 + readout.kmh * 1.8}deg)`;
  // Speed tier pips. `readout.band` is already the tier name, so the pips and
  // the word under the dial can never disagree -- one source, two encodings.
  const tier = TIERS.find((t) => t.label === readout.band) || TIERS[0],
    pips = $('tier-pips');
  if (pips) {
    pips.style.setProperty('--tier', tier.tint);
    for (let i = 0; i < pips.children.length; i++) {
      pips.children[i].classList.toggle('on', i <= tier.index);
      pips.children[i].classList.toggle('now', i === tier.index);
    }
  }
  $('drive').hidden = !!s.opening || s.drive <= 0;
  $('drive-meter').style.transform = `scaleX(${s.drive / 175})`;
  // Nonvisual equivalents only. The proof strip itself never draws words.
  const desc={tap:'Tap a pennant, click it, or press Space to cut through the rack.',pull:'Pull back and release towards the next rack, or aim with arrows and press Space.',shell:'One plate over another. Cut the shell.',crack:'The first plate broke. Strike again.',rewind:'Returning to the launch point.',retry:'Try the marked shape again.',stock:'Wait for one cut to refill.',lane:'The triangle charges along the red lane. Cut it or cross its path.',focus:'Hold a target in flight, or hold Shift to focus. Choose a new line and slash.',rise:'The striped tide is rising. Slash up.',net:'One net caught you. Your cuts are full. Launch up.'};
  setText('story-alt',desc[canvas.dataset.scene]||'');
}
function restoreField() {
  page = null;
  if (dialog.open) dialog.close();
  clock.reset();
  dirty = true;
  if (run) {
    game.dataset.screen = 'run';
    canvas.focus({ preventScroll: true });
  }
  portal();
}
function start() {
  input.reset();
  poki.setPlaying(false);
  run?.dispose();
  seed = freshSeed(seed);
  const opening = begin(mix);
  renderer.reset(seed, opening.warmup);
  run = createRun(seed, event, opening);
  audio.unlock();
  audio.menu();
  lastBeat = -1;
  // A fresh run must not react to the previous run's hull, score or chain.
  lastHp = lastScore = lastChain = null;
  clearTimeout(hitTimer);
  clearTimeout(kickTimer);
  clearTimeout(flareTimer);
  noticeTicks = receiptTicks = 0;
  $('imprint').hidden = true;
  $('callout').hidden = true;
  $('title-screen').hidden = true;
  hud.hidden = false;
  restoreField();
  nextHUD = 0;
  renderer.draw(run, 1, null, opts.motion,lastDevice);
  updateHUD();
  say('New run.');
}
function home() {
  input.reset();
  run?.dispose();
  run = null;
  restoreField();
  hud.hidden = true;
  $('title-screen').hidden = false;
  game.dataset.screen = 'title';
  setText('title-best', score(best));
  $('start-btn').focus({ preventScroll: true });
  dirty = true;
  portal();
}
function manual(dir = 0) {
  manualIndex = (manualIndex + dir + SPECIES.length) % SPECIES.length;
  const k = SPECIES[manualIndex],
    t = TYPES[k];
  setText('foe-name', t.name);
  setText('foe-index', `${two(manualIndex + 1)} / ${two(SPECIES.length)} · ${t.form}`);
  setText('foe-tell', t.ability);
  setText('foe-counter', t.counter);
  drawSpecimen($('specimen'), k);
}
$('prev-foe').onclick = () => manual(-1);
$('next-foe').onclick = () => manual(1);
function open(next) {
  input.cancel();
  clock.reset();
  poki.setPlaying(false);
  if (next === 'manual' || next === 'options') returnTo = run ? 'pause' : 'title';
  for (const p of ['pause', 'manual', 'options', 'result']) $(p + '-page').hidden = p !== next;
  page = next;
  game.dataset.screen = next;
  setText(
    'panel-heading',
    { pause: 'Paused', manual: 'Field manual', options: 'Options', result: 'Run ended' }[next],
  );
  if (next === 'manual') manual();
  if (next === 'options') syncSettings();
  if (next === 'pause') {
    $('skip-room').hidden = !run.state.opening || !!run.state.opening.finishing;
    setText(
      'pause-info',
      `${score(run.state.score)} points  /  ${run.state.opening ? 'Cutting room' : `Sector ${two(run.state.band)}`}`,
    );
  }
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  const n = $(
    next === 'pause'
      ? 'resume-btn'
      : next === 'result'
        ? 'retry-btn'
        : next === 'manual'
          ? 'next-foe'
          : 'audio-opt',
  );
  n.focus({ preventScroll: true });
  dirty = true;
}
function back() {
  if (page === 'pause') restoreField();
  else if (page === 'result') home();
  else if (returnTo === 'pause' && run) open('pause');
  else {
    const from = page;
    restoreField();
    game.dataset.screen = 'title';
    $(from === 'manual' ? 'manual-btn' : 'options-btn').focus({ preventScroll: true });
  }
}
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  back();
});
document.querySelectorAll('.back').forEach((b) => (b.onclick = back));
$('start-btn').onclick = $('retry-btn').onclick = start;
$('home-btn').onclick = home;
$('resume-btn').onclick = restoreField;
$('skip-room').onclick = () => {
  if (run?.skipOpening()) {
    restoreField();
    updateHUD();
  }
};
$('pause-btn').onclick = () => {
  if (active()) open('pause');
};
$('manual-btn').onclick = $('pause-manual').onclick = () => open('manual');
$('options-btn').onclick = $('pause-options').onclick = () => open('options');
$('end-btn').onclick = () => run?.retire();
window.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  if (k === 'm' && !e.repeat) {
    mute();
    return;
  }
  if (k === 'f' && !e.repeat) {
    e.preventDefault();
    void fullscreen();
    return;
  }
  if (page || !run) {
    if (page === 'manual' && ['arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault();
      manual(k === 'arrowleft' ? -1 : 1);
      return;
    }
    if (['arrowup', 'arrowdown'].includes(k)) {
      e.preventDefault();
      const root = page ? $(page + '-page') : $('main-nav'),
        buttons = Array.from(root.querySelectorAll('button:not(:disabled):not([hidden])')),
        i = buttons.indexOf(document.activeElement);
      buttons[
        i === -1
          ? k === 'arrowdown'
            ? 0
            : buttons.length - 1
          : (i + (k === 'arrowdown' ? 1 : -1) + buttons.length) % buttons.length
      ]?.focus();
    } else if (
      !e.repeat &&
      ((k === 'enter' && document.activeElement.tagName !== 'BUTTON' && !page) ||
        (k === 'r' && page === 'result'))
    ) {
      e.preventDefault();
      start();
    } else if (k === 'p' && page === 'pause' && !e.repeat) restoreField();
    return;
  }
  if ((k === 'escape' || k === 'p') && active() && !e.repeat) {
    e.preventDefault();
    open('pause');
  }
});
function suspend() {
  if (run && ['playing', 'ready'].includes(run.state.phase) && !dialog.open) open('pause');
  input.cancel();
  clock.reset();
  portal();
}
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    suspend();
    cancelAnimationFrame(raf);
    raf = 0;
  } else {
    clock.reset();
    dirty = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }
});
function frame(now) {
  raf = 0;
  if (document.hidden) return;
  const redraw = dirty || renderer.revision !== lastRevision;
  if (!run) {
    if (redraw || (!page && opts.motion)) renderer.title(opts.motion ? now * 0.023 : 0);
  } else if (!dialog.open) {
    const a = clock.frame(now, () => {
      if (dialog.open) return;
      input.tick();
      run.tick(); // owns the panic ray, grace and every other tick rule
      audio.focus(run.state.phase === 'playing' && run.state.held && run.world.slow);
      audio.flush();
      renderer.tick(run, opts.motion);
      if (receiptTicks && !--receiptTicks) $('imprint').hidden = true;
      if (noticeTicks && !--noticeTicks) $('callout').hidden = true;
      const beat = Math.floor(run.world.clock / 15);
      if (opts.music && !run.state.opening && run.state.phase === 'playing' && beat !== lastBeat) {
        audio.beat(beat, run.state.drive > 0);
        lastBeat = beat;
      }
    });
    renderer.draw(run, a, input.aim, opts.motion,lastDevice);
    if (now >= nextHUD) {
      updateHUD();
      nextHUD = now + 65;
    }
  } else if (redraw) renderer.draw(run, 1, null, opts.motion,lastDevice);
  dirty = false;
  lastRevision = renderer.revision;
  raf = requestAnimationFrame(frame);
}
syncSettings();
setText('title-best', score(best));
renderer.title(0);
// Only reveal the menu once its artwork and action handlers are ready.
game.removeAttribute('inert');
$('boot').remove();
poki.loadingFinished();
if (!document.hidden) raf = requestAnimationFrame(frame);
