import { createRun, CHAIN_TIME, HYPER } from './run.js';
import { readForm, formLabel, GRADE_AT, GRADE_MARK, nextRank } from './form.js';
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
import { speedReadout, meterReadout, dialGeometry } from './motion.js';
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
    // OFF / LOW / FULL. A single reduced-motion flag is not enough for a
    // garnish: some players want the game's motion and not the screen moving
    // under them, which is a different complaint and deserves its own control.
    // Anyone who has asked for reduced motion starts at LOW rather than FULL.
    shake: storage.get('shake', pref.matches ? 'low' : 'full'),
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
      ? // ── QUITTING IS NOT AN ACHIEVEMENT ────────────────────────────────
        //
        // "You banked this run" was written for a different game, one where
        // stopping deliberately did something for you. Here, quitting early
        // from pause is just stopping, and congratulating the player for it
        // reads as if they had beaten something. An early exit gets the plain
        // fact; the score is already printed above this line and does not need
        // a euphemism beside it.
        s.shots
        ? 'Run ended early.'
        : 'No stroke taken.'
      : s.cause === 'Floor'
        ? 'The floor took your speed.'
        : `Broken by ${s.cause}.`,
  );
  setText('debrief', s.throughcuts?`${s.throughcuts} throughcut${s.throughcuts===1?'':'s'} in ${s.shots} dash${s.shots===1?'':'es'}.`:s.shots?`${s.shots} dash${s.shots===1?'':'es'} · ${s.kills} slashed.`:'');
  // ── THE FORM STAMP ──────────────────────────────────────────────────────
  //
  // The run is named for what it WAS, not for how much it scored. Every signal
  // feeding this was already tracked and every one was being discarded into a
  // single number, which is why two entirely different runs were previously
  // indistinguishable at the debrief.
  //
  // A run that died early still keeps its form: dying does not erase what you
  // were doing, and a short violent run is still a REDLINE. Only a run that
  // never cleared a single axis reads UNFORMED.
  {
    const input = {
      kills: s.kills,
      throughcuts: s.throughcuts,
      banks: s.banks || 0,
      dashes: s.shots,
      elapsedTicks: s.elapsed,
      hp: s.hp,
    };
    const read = readForm(input);
    lastForm = read;
    const stamp = $('form-stamp');
    stamp.hidden = false;
    stamp.dataset.form = read.key;
    setText('form-name', read.form);
    setText('form-grade', read.grade ? GRADE_MARK[read.grade] : '');
    // ── ONE MORE RUN ─────────────────────────────────────────────────────
    //
    // The stamp on its own is a verdict. A player who scored WEAVER II has no
    // way to know whether they were a single bank from III or nowhere near it,
    // and that difference decides whether the run gets replayed. So the debrief
    // also says the CHEAPEST remaining step, in the axis's own units.
    //
    // It is silent when it has nothing honest to say (unformed runs, top
    // grade), which is why this is a `hidden` toggle rather than an always-on
    // line with empty text.
    const nudge = nextRank(read, input),
      next = $('next-rank');
    if (next) {
      next.hidden = !nudge;
      if (nudge) {
        setText('next-rank-need', `+${nudge.need}`);
        setText('next-rank-mark', GRADE_MARK[nudge.to] || '');
        next.dataset.axis = nudge.axis;
        // The bar is the fraction of the line this run already reached, so a
        // near-miss looks like one and a distant one does not.
        const bar = $('next-rank-fill');
        if (bar) bar.style.setProperty('--fill', nudge.progress.toFixed(3));
        next.setAttribute(
          'aria-label',
          `${nudge.need} to reach grade ${GRADE_MARK[nudge.to] || nudge.to}`,
        );
      }
    }
  }
  const print = s.bestStroke;
  $('best-print').hidden = !print;
  if (print) {
    drawStrokePrint($('stroke-map'), print);
    setText('print-points', `+${print.points.toLocaleString('en-US')}`);
    // ── THE CARD MUST COUNT WHAT IT DRAWS ─────────────────────────────────
    //
    // The label read `print.kills` while `drawStrokePrint` draws
    // `print.marks`. Those are different numbers, and the picture is the one
    // the player is looking at: the report caught the card showing ONE shape
    // beside the words "3 SHAPES".
    //
    // A stroke can mark a shape without killing it (a plate cracked off a
    // Crown is a mark, not a kill), so kills is legitimately the smaller
    // number -- and `marks` is capped at 8 by the recorder, so the drawing has
    // an upper bound the label did not. Counting the marks makes the words
    // describe the picture exactly, which is the only thing this line has to do.
    const drawn = print.marks?.length ?? 0;
    setText(
      'print-type',
      `${print.released ? 'Throughcut' : 'Slash'} · ${drawn} ${drawn === 1 ? 'shape' : 'shapes'}`,
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
    case 'floorKick':
      // The trampoline was silent. `run.js` has emitted this since the floor
      // became a spring and there was no listener, so the one event that keeps
      // the player alive made no sound at all. Volume follows the kick's own
      // power so a full-height throw is louder than a save off a slow fall.
      audio.spring((d.vy || 13.5) / 15);
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
    case 'hyper': {
      // ── HYPER ────────────────────────────────────────────────────────────
      // The promotion is the single biggest moment the game can offer: the
      // speed limit is gone, the blade is permanent, the walls throw you back
      // harder. It gets the loudest cue in the game -- and then gets out of the
      // way, because the state itself is the reward.
      audio.strike('drive');
      audio.strike('armor');
      say(`HYPER  ·  ${d.speed}`);
      break;
    }
    case 'hyperEnd': {
      // Stated once, quietly. Losing hyper should feel like a wave receding,
      // not like a buzzer.
      if (d.peak > MAX_SPEED * 2) say(`Hyper spent  ·  ${d.peak}`);
      break;
    }
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
  $('shake-opt').querySelector('b').textContent =
    opts.shake === 'off' ? 'Off' : opts.shake === 'low' ? 'Low' : 'Full';
  $('pace-opt').querySelector('b').textContent=speed().label;
  setText('pace-note',speed().note);
  $('opening-opt').querySelector('b').textContent=mix==='full'?'Full field':'Gradual';
  setText('opening-note',mix==='full'?'Start among mixed enemies, without the opening scene.':'Start with a single Fang. The paper racks appear only on your very first run.');
  for (const b of document.querySelectorAll('.sound')) {
    b.querySelector('use').setAttribute('href', audio.enabled ? '#i-sound' : '#i-mute');
    b.setAttribute('aria-label', audio.enabled ? 'Mute audio' : 'Enable audio');
    b.setAttribute('aria-pressed', audio.enabled);
  }
  // ── IF FULLSCREEN IS UNAVAILABLE, IT IS NOT LISTED ────────────────────────
  //
  // This used to leave the row on screen reading "Fullscreen Unavailable", which
  // is an option the player cannot use, printed in the same list as the options
  // they can. The report is exact: it "sits in the options list even though you
  // can't click it". A disabled control that cannot ever be enabled is not a
  // control, it is clutter -- and on the browsers where this happens (iOS
  // Safari, most in-app webviews) it is clutter in every session.
  //
  // `hidden` rather than `display:none` so the row is also out of the
  // accessibility tree; a screen reader announcing an unusable option is the
  // same bug with a different reader.
  const fullOk = Boolean(document.fullscreenEnabled);
  for (const b of document.querySelectorAll('.full')) {
    b.hidden = !fullOk;
    b.disabled = !fullOk;
  }
  $('full-opt').hidden = !fullOk;
  if (fullOk)
    $('full-opt').querySelector('b').textContent = document.fullscreenElement ? 'Exit' : 'Enter';
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
$('shake-opt').onclick = () => {
  // Cycle OFF -> LOW -> FULL -> OFF. Stored as a word, not a number: a third
  // state is a third meaning, and `0/1/2` would need a legend to read.
  const order = ['off', 'low', 'full'];
  opts.shake = order[(order.indexOf(opts.shake) + 1) % order.length];
  storage.set('shake', opts.shake);
  dirty = true;
  syncSettings();
  renderer.setShakeLevel(opts.shake);
  audio.menu();
};
pref.addEventListener('change', () => {
  if (storage.get('motion', null) === null) {
    opts.motion = !pref.matches;
    // Reduced motion also drops the shake a notch. It does not force it OFF:
    // the player can still choose, and the OS preference is a default.
    if (storage.get('shake', null) === null) opts.shake = pref.matches ? 'low' : 'full';
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
// Build the grade pips from GRADE_AT so the ladder has one source of truth.
// If a fourth grade is ever added, the HUD grows a pip without being told.
$('form-pips').replaceChildren(
  ...GRADE_AT.map(() => document.createElement('i')),
);
let lastHp = null,
  lastScore = null,
  lastChain = null,
  lastFormSig = '',
  liveForm = null,
  lastForm = null,
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
  // ── FORM READOUT ────────────────────────────────────────────────────────
  //
  // The live half of the mastery read. It names what the run is BECOMING, and
  // it is allowed to change under the player's feet: start weaving, switch to
  // banking, and the word changes. That instability is the design, not a bug --
  // the run's identity is contested until it is over.
  //
  // Recomputed only when one of the four inputs can have changed. This runs on
  // every HUD update, and the four counters only move on a kill; there is no
  // reason to re-derive a division four ways several times a second.
  {
    const sig = `${s.kills}|${s.throughcuts}|${s.banks || 0}|${s.shots}|${s.elapsed | 0}|${s.hp}`;
    if (sig !== lastFormSig) {
      lastFormSig = sig;
      // `s.elapsed` is TICKS. Passed under the explicit name so the unit can
      // never be mistaken for milliseconds again -- that mistake read every run
      // as 1.8 seconds long and named all twenty test seeds GHOST.
      liveForm = readForm({
        kills: s.kills,
        throughcuts: s.throughcuts,
        banks: s.banks || 0,
        dashes: s.shots,
        elapsedTicks: s.elapsed,
        hp: s.hp,
      });
      const label = formLabel(liveForm, { live: true });
      const readout = $('form-read');
      // Hidden in the opening (it is a lesson, not a run), when the run is over
      // (the debrief stamps it properly), and while nothing has formed yet.
      const show = !s.opening && s.phase === 'playing' && !!label;
      readout.hidden = !show;
      if (show) {
        setText('form-word', label);
        readout.dataset.form = liveForm.key;
        const pips = $('form-pips').children;
        for (let i = 0; i < pips.length; i++)
          pips[i].classList.toggle('on', i < liveForm.grade);
      }
    }
  }
  // ── THE METERS ──────────────────────────────────────────────────────────
  //
  // Hull, Edge and Focus all come from one readout so they cannot disagree
  // about what is empty or how much is owed. See `meterReadout` in motion.js.
  const meters = meterReadout(s);
  Array.from($('hull').children).forEach((n, i) => n.classList.toggle('empty', i >= meters.hp));
  $('hull').setAttribute('aria-label', `${meters.hp} hull remaining`);
  // EDGE. The pip count and the recharge timer both matter: three pips tell
  // you whether you can cut, the timer tells you whether to bother lining one
  // up. Without the second, an empty meter is indistinguishable from a broken
  // one and the only feedback is the slash not happening.
  const edgeEl = $('edge');
  if (edgeEl.children.length !== meters.edgeMax)
    edgeEl.replaceChildren(...Array.from({ length: meters.edgeMax }, () => document.createElement('i')));
  Array.from(edgeEl.children).forEach((n, i) => {
    if (n.tagName !== 'I') return;
    n.classList.toggle('empty', i >= meters.edge);
  });
  edgeEl.setAttribute('aria-label', `${meters.edge} of ${meters.edgeMax} cuts remaining`);
  edgeEl.style.setProperty('--regen', meters.regen.toFixed(3));
  const edgeMeter = $('edge-meter');
  edgeMeter.toggleAttribute('data-low', meters.edgeEmpty);
  edgeMeter.toggleAttribute('data-regen', meters.regenDue);
  // FOCUS. Draining is a state the player needs to see BEFORE it runs out --
  // if the only signal is the slow-motion stopping, the resource has already
  // been spent.
  $('focus-fill').style.transform = `scaleX(${meters.focus.toFixed(3)})`;
  const focusEl = $('focus');
  focusEl.setAttribute('aria-label', `Focus ${meters.focusPct} percent`);
  const focusMeter = $('focus-meter');
  focusMeter.toggleAttribute('data-empty', meters.focusEmpty);
  focusMeter.toggleAttribute('data-live', meters.focusLive);
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
  // The ceiling only lifts while hyper is live. Passing HYPER.speed always
  // would make ordinary top-speed flight read as DRIFT and strip its stretch --
  // the effect must know the difference between "fast" and "off the scale".
  // ── THE NUMBER IS DISPLACEMENT, NOT VELOCITY ───────────────────────────
  //
  // Reading `velocity` here is what let a cube parked on the floor display
  // 70 CRUISE while its minimap dot sat still: the rail solver resolves every
  // tick, and the velocity it leaves behind at the END of that is not the same
  // as motion the player can see. `moved` is displacement over the tick, so a
  // body that did not move reads 0 no matter what the solver did.
  const vel = run.world.player.velocity,
    hyperCeiling = s.hyper ? HYPER.speed : MAX_SPEED,
    // The 0.2s mean, not this tick's sample: a hitstop skips physics and would
    // read 0 mid-impact, and floor jitter would read as flight. See run.js.
    seen = s.movedAvg ?? s.moved ?? Math.hypot(vel.x, vel.y),
    readout = speedReadout(seen, MAX_SPEED, hyperCeiling, s.hyper),
    dial = $('speedo');
  dial.dataset.band = readout.band;
  dial.setAttribute('aria-label', `Speed ${readout.kmh}, ${readout.band.toLowerCase()}`);
  setText('speedo-value', readout.kmh);
  setText('speedo-band', readout.band);
  // The dial has two encodings of the same number on purpose: an arc (a
  // length) and a needle (an angle). The needle is what a player actually
  // reads mid-flight, because angle is legible at a glance while length is
  // not. Both are mirrored from the same 0..100 so they cannot disagree.
  // `kmh` is allowed past 100 so the NUMBER says "off the scale", but the arc
  // and the needle are physical dials and must stop at their own end -- without
  // this clamp a 667 km/h hyper shot drove strokeDashoffset to -567 and spun the
  // needle twenty full turns.
  // Both encodings come from ONE function, so the arc and the needle cannot
  // drift apart -- and so a test can assert the relationship without a browser.
  const geo = dialGeometry(readout);
  dial.querySelector('.speedo-fill').style.strokeDashoffset = 100 - geo.arcPct;
  // The needle is NOT capped at the end of the scale. The arc stops at the top
  // (a bar that leaves its track is a drawing error); the pointer keeps going
  // for the top 15%, which is the only honest way to draw "past the end". The
  // published geometry caps it at 1.15 for exactly that reason.
  const needle = dial.querySelector('.speedo-needle');
  if (needle) needle.style.transform = `rotate(${geo.needleDeg}deg)`;
  dial.querySelector('.speedo-hub')?.classList.toggle('over', geo.over);
  // HYPER names itself on the tier rail. It is the one tier that is an event
  // rather than a reading, and the extra word is the only place the HUD says
  // so in the dial's own colour.
  const tierName = $('tier-name');
  if (tierName) {
    tierName.hidden = readout.band !== 'HYPER';
    tierName.textContent = 'PAST MAX';
  }
  // Speed tier pips. `readout.band` is already the tier name, so the pips and
  // the word under the dial can never disagree -- one source, two encodings.
  // The index comes from the ARRAY POSITION, not from the tier object: TIERS
  // entries carry `at` and `tint` but only `tierOf` ever stamps an `index` on
  // them, so looking one up by label left `index` undefined -- and
  // `i <= undefined` is false for every i, which turned all five pips DARK at
  // full hyper. Exactly the wrong signal for the loudest state in the game.
  const tierIndex = Math.max(
      0,
      TIERS.findIndex((t) => t.label === readout.band),
    ),
    tier = TIERS[tierIndex],
    pips = $('tier-pips');
  if (pips) {
    pips.style.setProperty('--tier', tier.tint);
    for (let i = 0; i < pips.children.length; i++) {
      pips.children[i].classList.toggle('on', i <= tierIndex);
      pips.children[i].classList.toggle('now', i === tierIndex);
    }
  }
  $('drive').hidden = !!s.opening || s.drive <= 0;
  // Overdrive's fill is a ::after driven by `--v`, so the bar and every other
  // continuous meter share one transform. Clamped: 175 is the bank it is
  // filled from, and a stale 190 would draw past the end of its own track.
  $('drive').style.setProperty('--v', Math.min(1, Math.max(0, s.drive / 175)).toFixed(3));
  // The chain bar is a share of the window THIS chain was given, not of a
  // constant: the window shrinks as the chain grows (run.js: chainWindow), so
  // a fixed divisor drew a full bar when only a third of the window remained.
  $('chain').style.setProperty(
    '--v',
    (s.chainMax ? Math.min(1, Math.max(0, s.chainTime / s.chainMax)) : 0).toFixed(3),
  );
  // Nonvisual equivalents only. The proof strip itself never draws words.
  const desc={tap:'Tap a pennant, click it, or press Space to cut through the rack.',pull:'Pull back and release towards the next rack, or aim with arrows and press Space.',shell:'One plate over another. Cut the shell.',crack:'The first plate broke. Strike again.',rewind:'Returning to the launch point.',retry:'Try the marked shape again. Two tries left before this rack is conceded.',stock:'Wait for one cut to refill.',lane:'The triangle charges along its marked lane. Cut it or cross its path.',focus:'Hold a target in flight, or hold Shift to focus. Choose a new line and slash.',rise:'The marked floor is rising. Slash up.',net:'One net caught you. Your cuts are full. Launch up.'};
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
  // A fresh run must not react to the previous run's hull, score or chain --
  // and must not inherit the previous run's FORM, or the readout would open
  // already showing the last run's identity.
  lastHp = lastScore = lastChain = null;
  lastFormSig = '';
  liveForm = null;
  $('form-read').hidden = true;
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
      // A refused shot gets one more chance before the tick consumes the frame.
      // Retried here rather than on the input event because the reason the shot
      // was refused is almost always a GAME state (recovery, hitstop) that only
      // changes on a tick.
      input.retry();
      run.tick(); // owns the panic ray, grace and every other tick rule
      audio.focus(run.state.phase === 'playing' && run.state.held && run.world.slow);
      audio.flush();
      // ── "SCREEN SHAKE: OFF" MUST MEAN OFF ────────────────────────────────
      //
      // `motion` is the flag that gates EVERY moving flourish in the renderer:
      // the speed field's streak lines, the hyper aura, the streak trail, the
      // impact rings, the whole lot. It was wired only to `opts.motion` -- the
      // separate Reduce Motion switch -- so turning Screen shake OFF zeroed the
      // camera's positional shake and left every line, flare and wobble running.
      // The report describes exactly that: "turning shake off still leaves
      // background lines flashing and the cube shaking on the floor."
      //
      // Both switches now feed it, because both mean the same thing to a player
      // with motion sensitivity: stop the movement.
      renderer.tick(run, opts.motion && opts.shake !== 'off');
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
renderer.setShakeLevel(opts.shake);
setText('title-best', score(best));
renderer.title(0);
// Only reveal the menu once its artwork and action handlers are ready.
game.removeAttribute('inert');
$('boot').remove();
poki.loadingFinished();
if (!document.hidden) raf = requestAnimationFrame(frame);
