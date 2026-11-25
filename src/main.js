import {installIconSprite,prependIcon} from './ui-icons.js';
import {isDevMode,modeURL,createProfileStorage,refillForTesting} from './dev-mode.js';
import {createCombatTrace} from './combat-trace.js';
import {createVisualTutorial,tutorialObjective,tutorialAnnouncement,tutorialWhy,TUTORIAL_LINES} from './visual-tutorial.js';
import {createControlPracticeUI} from './control-practice-ui.js';
import {createTeachingUI} from './teaching-ui.js';
import {createTrainingHub} from './training-hub.js';
import {healthDamageLabel,healthDeathMessage} from './health-ui.js';
import {healthSegments,damageFeedback,dmgLabel,bearingWord,SAFE_BLINK_TICKS,HIT_RIM_TICKS} from './damage-feedback.js';
// CHUNK 2: the live "safe to slice" set, measured against the blade's own sweep.
import {sliceStates,sweepGeometry} from './slice-safe.js';
import {lawHintVisible} from './color-law.js';
import {reticleFor} from './pointer-reticle.js';
import {OVERDRIVE} from './flow.js';
import {bossChargeReadout,shortDamageLine,damageBearing,hintVisible} from './hud-copy.js';
import {combatStatus} from './combat-status.js';
import {runCoaching} from './run-coach.js';
import {createWaveUI} from './wave-ui.js';
import './lab.css';
import { activeHybrid, activeSparks } from './hybrids.js';
import { createCustomize } from './customize.js';
import { overlapsHUD } from './radar.js';
import { createQuestUI } from './quest-ui.js';
import { createRun, CHAIN_TIME, HYPER } from './run.js';
import { readForm, formLabel, GRADE_AT, GRADE_MARK, nextRank } from './form.js';
import { createClock } from './clock.js';
import { createRenderer } from './renderer.js';
import { createInput, enableMenuTaps } from './input.js';
import { createAudio } from './audio.js';
import { createPokiBridge } from './poki.js';
import { freshSeed, openingFacing } from './levels.js';
import { TYPES, SPECIES } from './shapes.js';
import { drawStrokePrint } from './print.js';
import { SPEEDS, setSpeed, speedIndexOf, speed } from './pace.js';
import { TIERS } from './motion.js';
import { speedReadout, meterReadout, dialGeometry } from './motion.js';
import { MAX_SPEED } from './physics.js';
import { FRACTURE_TIERS, FRACTURE_KEY, clampPct, persistFracture, fractureTier } from './fracture.js';
import { createCutscene, coldOpenOnce } from './cutscene.js';
import { COLD_OPEN_BEATS, midWaveBeats, sectorBeats, SHATTER_BEATS, lockTicks } from './cinematics.js';
import { LANDLORD_STORY, storyChipForWave } from './story-arc.js';
let questUI, customize, waveUI, controlPractice, teaching;let learningGround=false,tutorial=null,lastTutorialHint=null,lastRiftObjective='',lastTutorialWhy='';
const tutorialHintSpeech=Object.freeze({
 slice:'Slice the highlighted target. Tap it, or pull away and release toward it.',
 bank:'Launch into the glowing wall. Pull away from the wall and release.',
 approach:'Move closer to the Rift, then wait for its warning.',
 watch:'Wait for the Rift warning to cover you, then launch out of it.',
 dodge:'The Rift warning is on you. Pull back and release to launch out of it.',
 gate:'The glowing gate can be broken. Launch into it.',
 cross:'Travel through the open doorway.'
});
const devMode = isDevMode(location.href);
const storage = createProfileStorage(() => localStorage, devMode);
let combatTrace = null,
  nextFractureRumble = 0;
const $ = (id) => document.getElementById(id),
  game = $('game'),
  canvas = $('arena'),
  dialog = $('panel'),
  hud = $('hud'),
  clock = createClock(),
  renderer = createRenderer(canvas),
  audio = createAudio({ muteKey: devMode ? 'splatr.dev.muted' : 'splatr.muted' }),
  poki = createPokiBridge({ getSDK: devMode ? () => null : undefined, fetchSDK: !devMode && __LOAD_POKI_SDK__ });
void poki.init();
enableMenuTaps();
const setText = (id, txt) => {
  const el = $(id);
  if (el.textContent !== String(txt)) el.textContent = txt;
};
let tutorialSeenThisSession=false;
// A first visit is consumed when the course opens, not when it is finished.
// Retry and interrupted reloads must not force players back into the course.
const needsTutorial=()=>!tutorialSeenThisSession&&storage.get('tutorialStarted','0')!=='1'&&storage.get('tutorialCompleted','0')!=='1'&&storage.get('started','0')!=='1'&&!(Number(storage.get('best',0))>0)&&!(Number(storage.get('rackClears',0))>0);
const coarse=matchMedia('(pointer:coarse)');
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
// CHUNK 2: the persistent Dimension Fracture. The shell owns its storage
// home; the run owns the live meter (run.state.fracture); this mirror is
// what the menu and debrief bars paint from when no run is live.
let fractureMirror = clampPct(Number(storage.get(FRACTURE_KEY, 0)) || 0);
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
  noticePriority = 0,
  receiptTicks = 0,
  noticeTicks = 0;
const active = () =>
  run && !teaching?.isOpen && !controlPractice?.isOpen && !waveUI?.open && !customize?.isOpen && !questUI?.vault && !dialog.open && !document.hidden && ['ready', 'playing'].includes(run.state.phase) && !run.state.inputLock;
// ── CHUNK 6A: THE CUTSCENE DRIVER ─────────────────────────────────────────
// Pure time; the art lives in the engine keyed off s.cutscene. The shell
// owns input lock, the freeze, and the chip.
const coldOpenGate = coldOpenOnce();
let activeCutscene = null,
  cutsceneOnDone = null,
  cutsceneOwnsStop = false;
function launchCutscene(beats, { reducedMotion = !opts.motion, onDone = null, preserveInput = false } = {}) {
  if (activeCutscene) return;
  const cs = createCutscene({ beats, reducedMotion, onDone: () => endCutscene() });
  activeCutscene = cs;
  cutsceneOnDone = onDone;
  const lockedTicks = lockTicks(beats, reducedMotion);
  cutsceneOwnsStop = lockedTicks > 0;
  if (run) {
    // A mid-wave story pulse owns only its short reveal lock; the release beat
    // hands control back before the afterimage clears. Locked cutscenes claim
    // the stop window before their first tick so no frame slips through.
    run.state.inputLock = cutsceneOwnsStop;
    run.state.cutscene = null;
    run.state.stop = cutsceneOwnsStop
      ? Math.max(run.state.stop || 0, lockedTicks)
      : run.state.stop || 0;
  }
  if (!preserveInput) input.reset();
  dirty = true;
}
function tickCutscene() {
  if (!activeCutscene) return;
  const snap = activeCutscene.tick(1);
  if (run) {
    run.state.cutscene = {
      beatId: snap.beatId,
      beatIndex: snap.beatIndex,
      t: snap.t,
      elapsedTotal: snap.elapsedTotal,
      totalTicks: snap.totalTicks,
      lockInput: snap.lockInput,
      reducedMotion: snap.reducedMotion,
    };
    // The beat table owns the handoff: locked shots hold the live run, while
    // the final release shot lets the player move again before the visual
    // sentence fully fades. `endCutscene` still clears this on skip/finish.
    run.state.inputLock = !!snap.lockInput;
  }
  // The chip is DOM, owned here; the engine never writes text.
  if (snap.chip && snap.t >= (snap.chip.at ?? 0)) {
    const chip = $('story-chip');
    if (chip && chip.textContent !== snap.chip.text) {
      chip.textContent = snap.chip.text;
      chip.hidden = false;
      void chip.offsetWidth;
      chip.classList.add('on');
    }
  } else hideStoryChip();
  if (snap.phase !== 'playing') endCutscene();
}
function endCutscene() {
  const onDone = cutsceneOnDone;
  cutsceneOnDone = null;
  activeCutscene = null;
  hideStoryChip();
  const ownsStop = cutsceneOwnsStop;
  cutsceneOwnsStop = false;
  if (run) {
    // A skipped locked cutscene may end before its pre-applied stop expires.
    // The mid-wave pulse owns only its short reveal window; release or skip
    // clears that window without leaving the live run frozen.
    if (ownsStop) run.state.stop = 0;
    run.state.cutscene = null;
    run.state.inputLock = false;
    run.state.storyMoment = null;
  }
  onDone?.();
}
// Any key or tap after the 0.5s gate ends the cutscene. Capture runs before
// the game's own input handlers, so the skip is never swallowed.
window.addEventListener('keydown', (e) => {
  if (!activeCutscene?.skippable) return;
  e.preventDefault(); e.stopPropagation();
  activeCutscene.skip();
}, true);
for (const type of ['pointerdown', 'touchstart'])
  window.addEventListener(type, (e) => {
    if (!activeCutscene?.skippable) return;
    e.preventDefault(); e.stopPropagation();
    activeCutscene.skip();
  }, true);
let lastSectorKey = null, sectorChipUntil = 0, lastFracturePaint = null, fractureGainTimer = 0, fractureSurgeTimer = 0, fractureHeartbeatArmed = false;
const wallNow = () => globalThis.performance?.now?.() ?? Date.now();
const say = (s) => setText('announcement', s);
// ── CHUNK 6A: THE STORY CHIP ─────────────────────────────────────────────
// One chip, ≤4 words, the only legible text allowed mid-play. Purely
// decorative; fades via CSS.
let storyChipTimer = 0;
function showStoryChip(text) {
  const chip = $('story-chip');
  if (!chip) return;
  chip.textContent = text;
  chip.hidden = false;
  // Force the transition to run from hidden → on.
  void chip.offsetWidth;
  chip.classList.add('on');
  clearTimeout(storyChipTimer);
  storyChipTimer = setTimeout(() => {
    chip.classList.remove('on');
    storyChipTimer = setTimeout(() => { chip.hidden = true; }, 750);
  }, 1400);
}
function hideStoryChip() {
  const chip = $('story-chip');
  clearTimeout(storyChipTimer);
  if (!chip) return;
  chip.classList.remove('on');
  chip.hidden = true;
}
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
  setText('result-stage-label',s.wave&&!s.narrative?'Wave reached':'Sector');
  setText('result-sector', s.opening ? '—' : two(s.band));
  // ── CHUNK 1: BEST WAVE, ALONGSIDE THE SCORE ─────────────────────────────
  // A run that dies on Wave 03 still has to say so, and the number has to
  // survive the run. `band` tracks the wave the player is fighting; the wave
  // director's own counter is the fallback for direct console/test runs.
  const reached = Math.max(1, s.band | 0, (s.wave?.number | 0) || 1);
  let bestWave = 0;
  try { bestWave = Math.max(0, Math.floor(Number(storage.get('bestWave', 0)) || 0)); } catch {}
  if (reached > bestWave) {
    bestWave = reached;
    try { storage.set('bestWave', bestWave); } catch {}
  }
  setText('result-best-wave', two(bestWave));
  // ── CHUNK 2: THE DEBRIEF BANKS THE FRACTURE ─────────────────────────────
  //
  // The meter never resets between runs; this only writes the run's final
  // value. The debrief mount shows it, and how much THIS run contributed.
  const fractureNow = persistFracture(s);
  persistFractureMirror(fractureNow);
  setFractureUI(fractureNow, s.fracture?.gained ?? 0);
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
        : healthDeathMessage(s.cause,s.hpMax),
  );
  setText('debrief', s.wave?runCoaching(s).text:s.throughcuts?`${s.throughcuts} throughcut${s.throughcuts===1?'':'s'} in ${s.shots} dash${s.shots===1?'':'es'}.`:s.shots?`${s.shots} dash${s.shots===1?'':'es'} · ${s.kills} slashed.`:'');
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
    setText('print-shot', (activeHybrid(print.equipment)||activeSparks(print.equipment)[0])?.title || `No. ${two(print.shot)}`);
  }
  setText(
    'run-record',
    `BEST ${score(best)}   /   SEED ${s.seed.toString(16).padStart(8, '0').toUpperCase()}`,
  );
  open('result');
  say(`Run over. ${s.score} points. Best ${best}. Best wave ${bestWave}. Dimension fracture ${Math.floor(fractureNow)} percent.`);
}
function event(type, d) {
  if(type==='challenge' && customize?.unlock(d.id)) say(d.id==='oni'?'Broken Oni unlocked.':'Glass Cannon unlocked.');
  questUI?.event(type, d);
  renderer.event(type, d, opts.motion);
  switch (type) {
    case 'breachOpen': input?.reset();audio.zone();break;
    case 'breachReady': audio.lock();break;
    case 'hyperSurge': audio.strike('drive');break;
    // CHUNK 3: the bonus goal's payout is a real beat, not a ledger row — it is
    // the one payment in a sector that arrives without a kill to punctuate it.
    case 'goalPaid': audio.lock();break;
    // CHUNK 4: the post is a card, not a kill — give it the upgrade beat so it
    // is audible over the sector-clear music sting it lands under.
    case 'postPaid': audio.strike('drive');break;
    case 'sonicBank': audio.strike('parry');break;
    case 'breachContact': audio.seamHit();break;
    case 'dimensionBreak': if(!run?.state.narrative)input?.reset();audio.shatter();break;
    case 'storyMoment':
      // Mid-wave story is a short gameplay cutscene: the opening image gets
      // a real read window, then the release beat hands the live formation
      // back before the emotional afterimage is gone.
      if (run && d && !activeCutscene) {
        launchCutscene(midWaveBeats(d.chip), { reducedMotion: !opts.motion });
      }
      break;
    case 'sector':
      audio.zone();
      // Continuous mode has a real room-to-room story beat. Legacy wave mode
      // also emits `sector` for its counter, but it must not inherit a cinematic
      // that belongs only to the Watcher/seal route.
      if (run?.state.narrative && (d?.band | 0) > 1) {
        input?.reset();
        audio.seamHit();
        launchCutscene(sectorBeats(storyChipForWave(d.band)), { reducedMotion: !opts.motion });
      }
      break;
    case 'waveStart':
      audio.zone();
      // Legacy finite waves do not have the continuous Watcher backdrop, so
      // give their first five formations the same short story cadence. The
      // encounter itself remains the picture; this is only the highlighted
      // chapter name.
      if (!run?.state.narrative && Number.isFinite(d?.number) && d.number <= 5)
        showStoryChip(storyChipForWave(d.number));
      break;
    // CHUNK 2: every fracture the run causes lands in storage immediately,
    // so an interrupted session never loses the seam it tore.
    case 'fractureGain':
      persistFractureMirror(d.pct);
      setFractureUI(d.pct, d.gained);
      audio.fractureGain(d.delta);
      if (d.pct >= 100 && !fractureHeartbeatArmed) { fractureHeartbeatArmed = true; audio.fractureHeartbeat(); }
      if (d.pct < 90) fractureHeartbeatArmed = false;
      break;
    case 'fractureTier':
      audio.fractureTier(d.tier);
      audio.tremor(Math.max(1, Math.min(3, d.tier | 0)));
      // CHUNK 6A (§8.2): no announcement — the ribbon itself surges via the
      // width/tier delta detected in setFractureUI. A chime, not a sentence.
      buzz(30);
      break;
    // CHUNK 6A: the fracture rumble cadence belongs to this run.
    case 'shatterEvent':
      fractureHeartbeatArmed = false;
      persistFractureMirror(0);
      setFractureUI(0);
      audio.shatter();
      buzz(70);
      // CHUNK 6A: the tear is a 2.5s visual sentence, not a banner.
      launchCutscene(SHATTER_BEATS, { reducedMotion: !opts.motion });
      break;
    case 'kineticOvercharge':
      // CHUNK 1: the old lethal-charge pill was a grey box in the far right
      // corner describing the RUSH bar in the top centre. The bar says RUSH
      // READY now; this beat keeps only what the bar cannot say.
      buzz(45);
      break;
    case 'monolithRise':
      // CHUNK 4/6A: a torn arena does not breach. It manifests — silent but
      // for the one chip the spec allows.
      audio.shatter();
      buzz(90);
      showStoryChip(LANDLORD_STORY.chip);
      break;
    case 'monolithDown':
      audio.strike('drive');
      buzz(120);
      showStoryChip(LANDLORD_STORY.finishChip);
      break;
    case 'waveClear': input?.reset();if(!d.shattered){audio.waveClear();pop('CLEAR',60,3);}break;
    case 'waveRest': input?.reset();break;
    case 'swordReady': audio.strike('parry');pop('READY',55,1);break;
    case 'swordPulse': audio.strike('parry');break;
    case 'waveBlock': audio.strike('parry');pop('BLOCK',45,1);break;
    case 'field':
      if(learningGround){const previous=run;queueMicrotask(()=>{if(run===previous&&learningGround)start();});}
      renderer.field(run.world.player.position, openingFacing(seed));
      input.reset(); audio.zone();
      lastHp = lastScore = lastChain = null; nextHUD = 0;
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
      audio.strike(d.impact.cue, d.chain, run?.state.equipment?.slash);
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
      // CHUNK 6B: when a plate boundary breaks on the landlord, the world
      // answers with something deeper than the armor tick.
      if (d.kind === 'monolith' && Math.ceil((d.hpBefore ?? 0) / 2) !== Math.ceil((d.hp ?? 0) / 2))
        audio.tremor(1);
      buzz(9);
      break;
    case 'bossCast':
      // CHUNK 6B: fired at the moment each telegraph unloads.
      if (d.kind === 'seismicLash') audio.tremor(2);
      else if (d.kind === 'plateSlam') { audio.tremor(3); buzz(80); }
      else if (d.kind === 'gravityLens') audio.seamHit();
      break;
    case 'slamShove':
      audio.tremor(1);
      buzz(60);
      break;
    case 'parry':
      audio.strike('parry');
      break;
    case 'hurt':
      audio.strike('hurt');
      buzz(24);
      // CHUNK 1: remember WHERE it came from so the canvas can draw one red
      // line to the exact body, orb or laser that did it. `pop` speaks the
      // short body-first name (`RING HIT`) instead of a health paragraph.
      hitAt = 0;
      hitCause = d.cause || null;
      hitSource = damageSource(run?.state, d);
      // CHUNK 2: a bearing word ONLY when the attacker is off the viewport.
      // On-screen, the drawn line already points at it and a compass would be
      // noise; off-screen, the word is the whole message.
      hitBearing = hitIsOffScreen() ? bearingWord(hitAngleFromPlayer()) : '';
      pop(shortDamageLine(`${dmgLabel(d.cause)} HIT${hitBearing ? ` ${hitBearing}` : ''}`), 55, 3);
      break;
    case 'break':
      input.cancel();
      audio.strike('break');
      buzz(38);
      portal();
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
    case 'cleanBank': {
      audio.strike('parry');
      break;
    }
    case 'bank': {
      if(run?.state.wave)break; // Wave feedback uses validated clean arrivals, not generic contacts.

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
      pop('Crown split · HEALTH +1', 55, 3);
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
  // CHUNK 1: the drawn reticle follows every pointer move, not just captured
  // pulls, because the OS cursor is hidden over the arena during a run.
  onPointerMove(e) {
    if (e.type === 'touch') { pointerPos = null; return; }
    pointerPos = { x: e.x, y: e.y };
  },
  assist: () => opts.assist,
  engage(device) {
    lastDevice = device;
    if(learningGround)tutorial?.interact();
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
    // CHUNK 1: a refused shot used to print `NO CUTS / RECHARGING` in the far
    // right corner, 900px from the cube that owns the charges. Nothing is
    // printed now: the reticle snaps red with an X and shakes, and the charge
    // arc under the cube is already pulsing red. Say it once for screen
    // readers, where a visual shake cannot reach.
    if (!ok && !run.state.opening && run.state.edge <= 0) {
      refuseTicks = 0;
      say('No cuts left. Cuts recharge.');
    }
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
  setText('pace-note','Changes automatic reaction windows, not launch direction or power.');
  $('dev-opt').querySelector('b').textContent=devMode?'On':'Off';
  $('dev-opt').setAttribute('aria-pressed',String(devMode));
  $('dev-note').textContent=devMode?'Sandbox saves separately. Priced shop items are free; challenge items still require their challenges. Switching ends the current run.':'Enable a separate sandbox with unlimited shop credits. Switching ends the current run.';
  $('opening-opt').querySelector('b').textContent=mix==='full'?'Full field':'Gradual';
  setText('opening-note',mix==='full'?'All enemy types from the start.':'New enemy types introduced gradually.');
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
$('dev-opt').onclick = () => {
  if (run && !confirm('Switching mode ends this run. Continue?')) return;
  location.assign(modeURL(location.href, !devMode));
};
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
  // Which health total the bar was last PAINTED with. `lastHp` is the damage
  // detector for the whole HUD; this one exists only so the bar can crack the
  // right block, and it is reset with the run beside it.
  lastHpOnly = null,
  lastScore = null,
  lastChain = null,
  lastFormSig = '',
  liveForm = null,
  lastForm = null,
  hitTimer = 0,
  kickTimer = 0,
  flareTimer = 0;
// ── CHUNK 2: ONE BAR, THREE MOUNTS ─────────────────────────────────────────
// The arena ribbon, the menu panel and the RUN ENDED debrief all render the
// same persistent `riot.fracturePct`. `gained` (optional) only feeds the
// debrief's "+x.x THIS RUN" line.
function setFractureUI(pct, gained = null) {
  fractureMirror = clampPct(pct);
  const tier = fractureTier(fractureMirror),
    tierDef = FRACTURE_TIERS[tier],
    ready = fractureMirror >= 100;
  for (const mount of [$('fracture-hud'), $('title-fracture'), $('result-fracture')]) {
    if (!mount) continue;
    mount.hidden = false;
    mount.dataset.tier = tierDef.id;
    mount.dataset.ready = String(ready && !!opts.motion);
    const fill = mount.querySelector('.fracture-fill');
    if (fill) fill.style.width = `${fractureMirror}%`;
    const pc = mount.querySelector('.fracture-pct');
    if (pc) pc.textContent = `${Math.floor(fractureMirror)}%`;
    // CHUNK 1: the meter is the player's goal, so its mounts say what it is
    // charging (a boss event) instead of describing the world's mood. The
    // internal tier id is untouched -- art, sound and difficulty still key off
    // `data-tier`; only the words a player reads changed.
    const copy = bossChargeReadout(fractureMirror, tier);
    const tr = mount.querySelector('.fracture-tier');
    if (tr) tr.textContent = mount.id === 'fracture-hud' ? copy.tier : copy.tier.replace('NEXT BOSS · ', '');
    mount.setAttribute('aria-label', copy.speech);
  }
  const gainedEl = $('result-fracture')?.querySelector('.fracture-gained');
  if (gainedEl && gained !== null && Number.isFinite(gained)) gainedEl.textContent = `+${gained.toFixed(1)} THIS RUN`;
  // CHUNK 6A §8.2: the ribbon fights for attention. Gains sweep the fill
  // bright; a tier change surges the frame edges inward. Projection of the
  // meter only — never of the fiction. Reduced motion keeps state, drops show.
  const ribbon = $('fracture-hud');
  if (ribbon && opts.motion && lastFracturePaint) {
    if (fractureMirror > lastFracturePaint.pct + 0.005) {
      ribbon.classList.remove('gain');
      void ribbon.offsetWidth;
      ribbon.classList.add('gain');
      clearTimeout(fractureGainTimer);
      fractureGainTimer = setTimeout(() => ribbon.classList.remove('gain'), 680);
    }
    if (tier !== lastFracturePaint.tier) {
      game.classList.remove('fracture-surge');
      void game.offsetWidth;
      game.classList.add('fracture-surge');
      clearTimeout(fractureSurgeTimer);
      fractureSurgeTimer = setTimeout(() => game.classList.remove('fracture-surge'), 760);
    }
  }
  if (opts.motion) lastFracturePaint = { pct: fractureMirror, tier };
}
function persistFractureMirror(pct) {
  fractureMirror = clampPct(pct);
  try { storage.set(FRACTURE_KEY, fractureMirror); } catch {}
}
// ── CHUNK 1: THE AIM RING, THE DAMAGE REACTION AND THE STARTER HINT ──────
//
// Three small view-time values owned by the shell. None of them is simulation
// state, so none of them may live on `run.state`: the engine reads them
// through `renderer.setAimFeedback` and the HUD reads the same objects.
let pointerPos = null,          // canvas-local CSS px, or null
  reticleArmed = true,
  refuseTicks = -1,             // ticks since a refused shot, -1 = none
  hintUntil = 0,                // wall clock the four-word hint retires
  hitAt = -1,                   // ticks since the last real health loss
  hitSource = null,             // where that hit came from, if anywhere
  hitCause = null,
  hitBearing = '',             // CHUNK 2: a compass word, only when off-screen
  hitRimTimer = 0;
// Which body is allowed to own the "what hit me" line: the run names the
// cause, the attack names the source, and the combat map turns an id into a
// position. Nothing here guesses.
function damageSource(s, d) {
  const attack = d?.attack || null;
  if (attack && Number.isFinite(attack.x) && Number.isFinite(attack.y)) return { x: attack.x, y: attack.y };
  const id = attack?.sourceId ?? d?.sourceId;
  const body = id != null ? run?.combat?.enemies?.get(id) : null;
  if (body) return { x: body.x, y: body.y };
  if (Number.isFinite(d?.x) && Number.isFinite(d?.y) && (d.x || d.y)) return { x: d.x, y: d.y };
  return null;
}
/** CHUNK 2: is the attacker outside the drawn field? Uses the renderer's own
 *  last view, which is the space the player is actually looking at. */
function hitIsOffScreen() {
  if (!hitSource) return false;
  const view = renderer?.viewSnapshot?.();
  if (!view) return false;
  return hitSource.x < view.x || hitSource.x > view.x + view.w || hitSource.y < view.y || hitSource.y > view.y + view.h;
}
/** Bearing from the cube to the attacker, or NaN when there is no attacker. */
function hitAngleFromPlayer() {
  if (!hitSource || !run?.world?.player?.position) return NaN;
  const p = run.world.player.position;
  return Math.atan2(hitSource.y - p.y, hitSource.x - p.x);
}
function paintReticle(now) {
  const el = $('reticle');
  if (!el) return;
  // Touch has no hover cursor; the ring is a mouse/keyboard instrument.
  const show = !!run && reticleArmed && lastDevice !== 'touch' && !!pointerPos &&
    ['ready', 'playing'].includes(run.state.phase) && !dialog.open && !document.hidden;
  if (!show) { el.hidden = true; return; }
  el.hidden = false;
  const aim = input.aim;
  const view = reticleFor({
    pointer: pointerPos,
    power: aim?.power || 0,
    charging: !!aim?.power,
    cuts: run.state.edge,
    refuseAge: refuseTicks,
    tick: run.world.clock,
    motion: opts.motion,
  });
  if (!view) { el.hidden = true; return; }
  el.style.left = `${view.x}px`;
  el.style.top = `${view.y}px`;
  el.dataset.charging = String(view.charging);
  el.dataset.warn = String(view.warn);
  el.dataset.refused = String(view.refused);
  const ring = el.querySelector('.reticle-ring');
  if (ring) ring.setAttribute('r', view.r.toFixed(1));
  const ticks = el.querySelector('.reticle-tick');
  if (ticks) ticks.setAttribute('transform', `rotate(${(view.spin * 57.2958).toFixed(1)} 22 22)`);
  const dot = el.querySelector('.reticle-dot');
  if (dot) dot.setAttribute('r', view.dot.toFixed(1));
  // Hand the same numbers to the canvas painter so the HTML ring and the
  // canvas effects can never disagree about where the aim is. The canvas
  // reticle is deliberately not drawn twice: the DOM ring IS the reticle.
  return view;
}
function updateHUD() {
  if (!run) return;
  const s = run.state;
  $('rack-skip').hidden=!learningGround;
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
  const status = s.narrative ? null : combatStatus(s);
  $('combat-status').hidden = !status;
  if(status){setText('combat-status-title',status.title);setText('combat-status-detail',status.detail);}
  // ── CHUNK 1: THE HULL, UNDER THE SCORE ────────────────────────────────
  // One 24px block per point, under the only big number on the screen. The
  // block that breaks cracks once (`.broke`), so losing health has a moment
  // instead of a silent style change.
  {
    const seg = healthSegments(meters.hp, s.hpMax || 3, lastHpOnly);
    const bar = $('health-bar');
    if (bar && bar.children.length !== seg.max)
      bar.replaceChildren(...Array.from({ length: seg.max }, () => document.createElement('i')));
    if (bar) {
      Array.from(bar.children).forEach((n, i) => n.classList.toggle('empty', i >= seg.now));
      if (seg.brokeAt >= 0) {
        const block = bar.children[seg.brokeAt];
        if (block) { block.classList.remove('broke'); void block.offsetWidth; block.classList.add('broke'); }
      }
      bar.setAttribute('aria-label', `Health: ${seg.now} of ${seg.max} remaining. The run ends at zero health.`);
    }
    setText('health-value', `${seg.now}/${seg.max}`);
    const block = $('hull-block');
    block?.toggleAttribute('data-critical', seg.critical);
    game.dataset.critical = String(seg.critical && !s.opening);
    lastHpOnly = seg.now;
  }
  // The corner line is now a four-word footnote under a bar that already
  // cracked; it never repeats the word HEALTH (the bar IS health).
  // CHUNK 1: the four-word starter hint retires on the first kill, not on a
  // timer, and never during practice (the practice ground has its own lesson).
  {
    const hint = $('start-hint');
    if (hint) {
      const show = hintVisible(s.kills, s.elapsed) && s.phase === 'playing' && !s.opening && !learningGround && !activeCutscene;
      hint.hidden = !show;
      hint.classList.toggle('on', show);
    }
    // CHUNK 2: the colour law, taught on the same ticker lane until the player
    // has cut three things. Never during practice (the practice ground teaches
    // its own lesson), never during a cutscene, never over a live fight.
    const law = $('law-hint');
    if (law) {
      const show = lawHintVisible(s.kills, s.elapsed) && s.phase === 'playing' && !s.opening && !learningGround && !activeCutscene;
      law.hidden = !show;
      law.classList.toggle('on', show);
    }
  }
  $('last-damage').hidden = !s.lastDamage || !!s.opening;
  if(s.lastDamage) setText('last-damage-cause', damageBearing(`${dmgLabel(s.lastDamage.cause)} HIT`, hitAt >= 0 ? hitBearing : ''));
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
  // CHUNK 1: the shake moved to the per-segment crack above (`#health-bar i`
  // `.broke`), which is a sharper read than a whole row wobbling: the block
  // that actually broke is the one that moves. The one-frame `data-hit` flip
  // stays as a hook for anything that wants the moment without the motion.
  if (lastHp !== null && s.hp < lastHp) {
    const row = $('hull-block');
    if (row) {
      row.removeAttribute('data-hit');
      void row.offsetWidth;
      row.setAttribute('data-hit', '');
      clearTimeout(hitTimer);
      hitTimer = setTimeout(() => row.removeAttribute('data-hit'), 420);
    }
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
  lastHpOnly = meters.hp;
  lastScore = s.score;
  lastChain = s.chain;
  // CHUNK 6A: the SECTOR/WAVE readout is a 1.4s chip on transition, then
  // gone — the persistent readouts were §4 text. The #district wall of
  // adjectives is deleted outright.
  {
    const sectorKey = s.narrative ? `SECTOR ${two(s.narrative.sector)}` : s.wave ? `WAVE ${two(s.wave.number)}` : s.opening ? 'CUTTING ROOM' : `SECTOR ${two(s.band)}`;
    if (sectorKey !== lastSectorKey) {
      lastSectorKey = sectorKey;
      setText('sector', sectorKey);
      const chip = $('sector');
      if (chip) {
        if (s.narrative) {
          // The chapter chip is the narrative line in continuous mode; do not
          // stack a second "SECTOR 02" label under it.
          chip.classList.remove('on');chip.hidden=true;sectorChipUntil=0;
        } else {
          chip.hidden = false; void chip.offsetWidth; chip.classList.add('on'); sectorChipUntil = wallNow() + 1400;
        }
      }
    }
    if (sectorChipUntil && wallNow() >= sectorChipUntil) {
      const chip = $('sector');
      if (chip) { chip.classList.remove('on'); chip.hidden = true; }
      sectorChipUntil = 0;
    }
  }
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
  dial.classList.toggle('wave-replaced',!!s.wave);
  // Yield the secondary dial to live actors, rather than hiding actors behind
  // a fixed HUD mask. Use actual DOM bounds so responsive layouts stay aligned.
  const view=renderer.questView(), bounds=dial.getBoundingClientRect(), arenaBounds=canvas.getBoundingClientRect();
  const dialRect={x:bounds.left-arenaBounds.left,y:bounds.top-arenaBounds.top,w:bounds.width,h:bounds.height};
  const covered=bounds.width>0 && (overlapsHUD(view,dialRect,run.world.player.position,24) ||
    [...run.combat.enemies.values()].some(e=>overlapsHUD(view,dialRect,e,e.r||30)));
  dial.classList.toggle('actor-overlap',covered);
  dial.dataset.band = readout.band;
  const momentumCount = s.momentum?.count ?? 0;
  dial.setAttribute('aria-label', `Speed ${readout.kmh}, ${readout.band.toLowerCase()}${momentumCount ? `, momentum ${momentumCount} of 3` : ''}`);
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
  // The MOMENTUM ledger, three diamonds under the dial's tier pips. Cyan on
  // the tier rail would read as a sixth tier; acid-on-dark cannot be mistaken
  // for one. Not announced separately — the dial's aria-label carries it.
  const momentumPips = dial ? dial.querySelector('.momentum-pips') : null;
  if (momentumPips) {
    for (let i = 0; i < momentumPips.children.length; i++) {
      momentumPips.children[i].classList.toggle('on', i < momentumCount);
    }
  }
  $('drive').hidden = !!s.opening || s.drive <= 0;
  // Overdrive's fill is a ::after driven by `--v`, so the bar and every other
  // continuous meter share one transform. Clamped: OVERDRIVE.ticks is the
  // bank it is filled from, and a stale larger value would draw past the end
  // of its own track. (CHUNK 3: this divisor used to be the literal 175 in two
  // files; the constant is now the only one.)
  $('drive').style.setProperty('--v', Math.min(1, Math.max(0, s.drive / OVERDRIVE.ticks)).toFixed(3));
  // The chain bar is a share of the window THIS chain was given, not of a
  // constant: the window shrinks as the chain grows (run.js: chainWindow), so
  // a fixed divisor drew a full bar when only a third of the window remained.
  $('chain').style.setProperty(
    '--v',
    (s.chainMax ? Math.min(1, Math.max(0, s.chainTime / s.chainMax)) : 0).toFixed(3),
  );
  // Nonvisual equivalents only. The proof strip itself never draws words.
  const desc={tap:'Tap a pennant, click it, or press Space to cut through the rack.',pull:'Pull back, release forward. Tap a target to cut directly.',shell:'One plate over another. Cut the shell.',crack:'The first plate broke. Strike again.',rewind:'Returning to the launch point.',retry:'Try the marked shape again. Two tries left before this rack is conceded.',stock:'Wait for one cut to refill.',lane:'The triangle charges along its marked lane. Cut it or cross its path.',focus:'Hold a target in flight, or hold Shift to focus. Choose a new line and slash.',rise:'The marked floor is rising. Slash up.',net:'One net caught you. Your cuts are full. Launch up.'};
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
function start({learningGround:learn=needsTutorial(), lockdown=false}={}) {
  if(customize?.isOpen||controlPractice?.isOpen||teaching?.isOpen) return;
  input.reset();
  poki.setPlaying(false);
  if(tutorial)tutorial.dispose();else run?.dispose();tutorial=null;
  seed = freshSeed(seed);
  const wasLearning=learningGround;learningGround=learn;lastTutorialHint=null;lastRiftObjective='';lastTutorialWhy='';$('tutorial-objective').hidden=true;game.dataset.learning=String(learn);game.dataset.tutorialReveal=String(wasLearning&&!learn);storage.set('started',1);if(learn){tutorialSeenThisSession=true;storage.set('tutorialStarted',1);}
  renderer.reset(seed, false);
  $('dev-refill').textContent='Refill health / Edge / focus';
  combatTrace = devMode ? createCombatTrace(4096) : null;
  if(learn){tutorial=createVisualTutorial(seed,(type,data)=>renderer.event(type,type==='cut'?{...data,points:0}:data,opts.motion));run=tutorial.run;}
  // CHUNK 4: the 40-card catalogue used to be unreachable here, because
  // `catalogRewards` gates the REST CHOOSER and the chooser is removed from
  // continuous play (by the earlier decision recorded in waves.js — flipping it
  // parks the run in `phase:'choose'` with no picker). `postRewards` is the
  // separate path: one auto-picked card per clear, no UI, no stop. Both flags
  // exist because one means "ask the player" and the other means "give it to
  // them". See src/post.js.
  else run = createRun(seed, event, {waveMode:true,continuous:true,catalogRewards:false,postRewards:true,lockdownIntro:lockdown,viewport:renderer.questView(),equipment:customize?.snapshot(),combatTrace,fracturePct:fractureMirror});
  // QA/debug handle: ?debug in the URL or riot.debug=1 in localStorage exposes
  // the live run to automated playtests. Never set for an ordinary player.
  if (new URLSearchParams(location.search).has('debug') || storage.get('debug', '0') === '1') window.__riot = run;
  renderer.setFieldScale?.(0.9);
  renderer.field(run.world.player.position);run.setView(renderer.questView());
  game.dataset.world=run.state.equipment.world;
  if(!learn)questUI.start();
  const hybrid=activeHybrid(run.state.equipment)||activeSparks(run.state.equipment)[0];
  $('hybrid-title').textContent=hybrid?.title || '';
  $('hybrid-title').hidden=!hybrid;
  audio.unlock();
  audio.menu();
  lastBeat = -1;
  // CHUNK 2: the fracture rumble cadence belongs to this run.
  nextFractureRumble = 0;
  fractureHeartbeatArmed = false;
  setFractureUI(fractureMirror);
  // A fresh run must not react to the previous run's hull, score or chain --
  // and must not inherit the previous run's FORM, or the readout would open
  // already showing the last run's identity.
  lastHp = lastScore = lastChain = lastHpOnly = null;
  lastSectorKey = null;
  sectorChipUntil = 0;
  lastFormSig = '';
  liveForm = null;
  $('form-read').hidden = true;
  clearTimeout(hitTimer);
  clearTimeout(kickTimer);
  clearTimeout(flareTimer);
  noticeTicks = receiptTicks = 0;
  $('imprint').hidden = true;
  $('callout').hidden = true;
  $('last-damage').hidden = true;
  $('title-screen').hidden = true;
  hud.hidden = false;
  restoreField();
  nextHUD = 0;
  // CHUNK 6A: the cold open — first real run of the session. 2.4 seconds,
  // skippable with any key after 0.5s, never again this session.
  if (!learn && coldOpenGate.should())
    launchCutscene(COLD_OPEN_BEATS, { reducedMotion: !opts.motion, onDone: () => {
      hud.classList.add('hud-fade-in');
      setTimeout(() => hud.classList.remove('hud-fade-in'), 740);
      if (run?.state.narrative) showStoryChip(storyChipForWave(run.state.narrative.sector));
    }});
  renderer.draw(run, 1, null, opts.motion,lastDevice);
  updateHUD();
  // The cold open is the first sentence. Do not put the retired ambient
  // announcement underneath it; practice still keeps its authored instruction.
  if (!activeCutscene) say(learn?'Practice: slice the targets, bank the wall, dodge and cut, then break the Crown.':'New run.');
}
function home() {
  questUI?.closePeek();
  renderer.setFieldScale?.(1);
  input.reset();
  if(tutorial)tutorial.dispose();else run?.dispose();
  run = null;tutorial=null;
  combatTrace = null;
  learningGround=false;game.dataset.learning='false';questUI?.refresh();
  restoreField();
  hud.hidden = true;
  $('rack-skip').hidden=true;$('tutorial-objective').hidden=true;
  $('title-screen').hidden = false;
  game.dataset.screen = 'title';
  $('reticle').hidden = true;
  $('start-hint').hidden = true;
  $('damage-rim').classList.remove('on');
  game.removeAttribute('data-critical');
  setText('title-best', score(best));
  // CHUNK 2: returning to the menu repaints the persistent meter too.
  setFractureUI(fractureMirror);
  $('start-btn').focus({ preventScroll: true });
  dirty = true;
  portal();
}
// ── CHUNK 5: THE LEARNING GROUND ───────────────────────────────────────────
// The manual used to be a wall of eleven buttons labeled like eleven different
// lessons, all of which started the same 4-room course. The hub tells the
// truth: three doors, each with the game it actually opens behind it.
function manual(){
 const host=document.querySelector('.visual-manual');if(!host)return;
 if(host.querySelector('.training-hub'))return;
 createTrainingHub({
  host,
  startCourse:()=>start({learningGround:true}),
  openLessons:()=>teaching?.open(),
  openDrills:()=>controlPractice?.open(),
 });
}
function open(next) {
  questUI?.closePeek();
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
      `${score(run.state.score)} points  /  ${run.state.wave?`Wave ${two(run.state.wave.number)} / ${run.state.wave.cleared} cleared`:run.state.opening ? 'Cutting room' : `Sector ${two(run.state.band)}`}`,
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
          ? 'manual-back'
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
$('start-btn').onclick = () => start();
$('retry-btn').onclick = () => start({learningGround:false});
$('home-btn').onclick = home;
$('resume-btn').onclick = restoreField;
$('dev-refill').hidden = $('dev-trace').hidden = !devMode;
$('dev-refill').onclick = () => { if (devMode && refillForTesting(run)) { updateHUD(); say('Health, Edge and focus refilled.'); $('dev-refill').textContent='Refilled health / Edge / focus'; } };
$('dev-trace').onclick = () => {
  if (!devMode || !combatTrace) return;
  const url = URL.createObjectURL(new Blob([combatTrace.json()], {type:'application/json'}));
  const a = document.createElement('a'); a.href=url; a.download='splatr-combat-trace.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
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
$('end-btn').onclick = () => learningGround?finishTutorial():run?.retire();
window.addEventListener('keydown', (e) => {
  if(customize?.isOpen||controlPractice?.isOpen||teaching?.isOpen) return;
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
  if (questUI.vault) return;
  if (!e.repeat && k === ' ' && ((!run && !page) || page === 'result')) { e.preventDefault(); start(); return; }
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
  if ((k === 'escape' || k === 'p') && active() && !e.repeat && !learningGround) {
    e.preventDefault();
    open('pause');
  }
});
function suspend() {
  if (run && !learningGround && !questUI.vault && ['playing', 'ready'].includes(run.state.phase) && !dialog.open) open('pause');
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
  waveUI?.update();
  raf = 0;
  if (document.hidden) return;
  const redraw = dirty || renderer.revision !== lastRevision;
  if (!run) {
    if (redraw || (!page && opts.motion)) renderer.title(opts.motion ? now * 0.023 : 0);
  } else if (!dialog.open && !questUI.vault && !controlPractice?.isOpen && !teaching?.isOpen) {
    const a = clock.frame(now, () => {
      if (dialog.open || questUI.vault || waveUI?.open || run.state.wave?.phase==='choose') return;
      // A refused shot gets one more chance before the tick consumes the frame.
      // Retried here rather than on the input event because the reason the shot
      // was refused is almost always a GAME state (recovery, hitstop) that only
      // changes on a tick.
      if (run.state.questReveal > 0) { run.state.questReveal--; if (run.state.questReveal % 2) return; }
      input.retry();
      run.setAim(input.aim);
      run.tick(); // owns the panic ray, grace and every other tick rule
      tickCutscene(); // CHUNK 6A: advances the cold open / mid-wave / sector / SHATTER cuts
      if(learningGround&&tutorial){tutorial.tick(input.engaged);const objective=tutorialObjective(tutorial.visual,run.combat.enemies,lastDevice),label=$('tutorial-objective');label.hidden=!objective;const speech=objective?tutorialAnnouncement(tutorial.visual,objective,lastDevice):'',objectiveKey=objective+'|'+speech;if(objectiveKey!==lastRiftObjective){if(!objective)lastTutorialHint=null;lastRiftObjective=objectiveKey;setText('tutorial-objective-text',objective);const room=TUTORIAL_LINES[Math.min(Math.max(tutorial.visual.stage|0,0),3)];if(room&&label.dataset.room!==room.title){label.dataset.room=room.title;}if(speech)say(speech);}const whyNow=objective?tutorialWhy(tutorial.visual,run.combat.enemies):'';if(whyNow!==lastTutorialWhy){lastTutorialWhy=whyNow;const why=$('tutorial-objective-why');if(why)why.textContent=whyNow;}const hint=tutorial.visual.guide?.kind;if(!objective&&hint&&hint!==lastTutorialHint){lastTutorialHint=hint;say(tutorialHintSpeech[hint]);}if(tutorial.finished){queueMicrotask(()=>{if(learningGround&&tutorial?.finished)finishTutorial();});}}
      else questUI.tick();
      audio.focus(run.state.phase === 'playing' && run.state.held && run.world.slow);
      audio.flush();
      // CHUNK 2: the ground keeps score. Tier 1 knocks every 8s of run time,
      // tier 2 every 4s, tier 3 every 2s — diegetic, tick-scheduled, inaudible
      // on the menu and silent at STABLE.
      {
        const tier = run.state.fracture?.tier | 0;
        if (tier > 0 && run.state.phase === 'playing' && !run.state.opening) {
          if (run.world.clock >= nextFractureRumble) {
            audio.tremor(tier);
            nextFractureRumble = run.world.clock + FRACTURE_TIERS[tier].rumble;
          }
        } else {
          nextFractureRumble = run.world.clock;
        }
      }
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
      // ── CHUNK 1: THE THREE VIEW-TIME REACTIONS ────────────────────────
      // Ticks, not milliseconds: the game's own clock, so a paused tab can
      // never advance a shake or a hint.
      if (refuseTicks >= 0 && ++refuseTicks > 26) refuseTicks = -1;
      if (hitAt >= 0 && ++hitAt > HIT_RIM_TICKS) { hitAt = -1; hitSource = null; hitCause = null; hitBearing = ''; }
      paintReticle(now);
      renderer.tick(run, opts.motion && opts.shake !== 'off');
      if (receiptTicks && !--receiptTicks) $('imprint').hidden = true;
      if (noticeTicks && !--noticeTicks) $('callout').hidden = true;
      const beat = Math.floor(run.world.clock / 15);
      if (opts.music && !learningGround && !run.state.opening && run.state.phase === 'playing' && beat !== lastBeat) {
        audio.beat(beat, run.state.drive > 0, run.state.equipment?.world);
        lastBeat = beat;
      }
    });
    // The screen-space damage reaction is read by the painter on this frame,
    // so it is pushed immediately before the draw, never a frame late.
    const feedback = hitAt >= 0
      ? damageFeedback({ age: hitAt, player: run.world.player.position, source: hitSource, cause: hitCause })
      : null;
    $('damage-rim')?.classList.toggle('on', !!feedback?.live && opts.motion);
    // CHUNK 2: which bodies the blade in the player's hand would reach on THIS
    // frame. The geometry is the run's own published sweep when a blade is out,
    // so the green brackets cannot promise a cut the hit test would refuse.
    const slices = run.state.blade > 0 && !feedback?.live
      ? sliceStates({
          player: run.world.player.position,
          enemies: run.combat.enemies.values(),
          state: run.state,
          // `state.sweep` is refreshed by the run on every tick a blade is out,
          // with exactly the multipliers it swept with. The fallback only runs
          // on the first frame of a blade, before that tick has published.
          geometry: run.state.sweep || sweepGeometry({
            reach: (run.state.reach || 1) * (run.state.sword?.reach || 1),
            width: run.state.sword?.width || 1,
          }),
        })
      : [];
    renderer.setAimFeedback?.({ hit: feedback, slices });
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
function finishTutorial(){const first=storage.get('tutorialCompleted','0')!=='1';storage.set('tutorialCompleted',1);start({learningGround:false,lockdown:first});}
$('rack-skip').onclick=()=>{if(learningGround)finishTutorial();};
// CHUNK 5: the "Learn" door in the quest board now opens THE LEARNING
// GROUND instead of force-starting the course; the two safe-practice dialogs
// it used to reference are real, wired and rendered below.
questUI = createQuestUI({unlimited:devMode,startTutorial:()=>{home();open('manual');},practice:()=>controlPractice?.open(),teaching:()=>teaching?.open(),getRun:()=>run, storage, audio, motion:()=>opts.motion && opts.shake !== 'off', resetInput:()=>input.reset(), home,
  resume:(playing)=>{clock.reset();dirty=true;if(playing)canvas.focus({preventScroll:true});portal();}, view:()=>renderer.questView()});
customize = createCustomize({storage,unlimited:devMode,wallet:()=>questUI.wallet(),ownedParts:()=>questUI.ownedParts(),purchase:(id,cost)=>questUI.purchasePart(id,cost),resetInput:()=>input.reset(),motion:()=>opts.motion,snap:()=>audio.menu()});
controlPractice = createControlPracticeUI({resetInput:()=>input.reset(),motion:()=>opts.motion&&opts.shake!=='off',onOpen:()=>{input.reset();poki.setPlaying(false);},onClose:()=>{input.reset();}});
teaching = createTeachingUI({resetInput:()=>input.reset(),motion:()=>opts.motion&&opts.shake!=='off',onOpen:()=>{input.reset();poki.setPlaying(false);},onClose:()=>{input.reset();},openControl:()=>controlPractice?.open()});
const customButton=document.createElement('button');customButton.id='customize-btn';customButton.className='choice quiet';customButton.textContent='Shop';customButton.onclick=()=>customize.open();$('main-nav').append(customButton);
waveUI=createWaveUI({getRun:()=>run,resetInput:()=>input.reset(),motion:()=>opts.motion});
installIconSprite();
for(const [id,name]of Object.entries({'start-btn':'play','manual-btn':'guide','options-btn':'settings','quests-btn':'learn','customize-btn':'shop','resume-btn':'play','pause-practice':'practice','pause-manual':'guide','pause-options':'settings','retry-btn':'retry','home-btn':'back','end-btn':'back'}))prependIcon($(id),name);
game.dataset.dev = String(devMode);
$('dev-badge').hidden = $('dev-panel-badge').hidden = !devMode;
syncSettings();
renderer.setShakeLevel(opts.shake);
setText('title-best', score(best));
// CHUNK 2: the menu always shows the persistent meter, even before the
// first run of the session.
setFractureUI(fractureMirror);
renderer.title(0);
// Only reveal the menu once its artwork and action handlers are ready.
game.removeAttribute('inert');
$('boot').remove();
poki.loadingFinished();
if (!document.hidden) raf = requestAnimationFrame(frame);
