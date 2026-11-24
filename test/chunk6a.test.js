/**
 * CHUNK 6A — THE HOOK.
 *
 * The story cutscenes as content: chip budgets (§4), the cinematic clocks
 * (§3, §5.4), the SHATTER event's new 140-tick singularity and rung
 * escalation (§5.3), the input lock in the sim (§5.1), and a headless
 * smoke pass over every beat painter.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { createRenderer } from '../src/renderer.js';
import { installDom, createDisplay } from './support/display.js';
import {
  COLD_OPEN_BEATS,
  CUTSCENE_PACING,
  MID_WAVE_BEATS,
  midWaveBeats,
  SECTOR_BEATS,
  sectorBeats,
  SHATTER_BEATS,
  lockTicks,
  chipBudget,
} from '../src/cinematics.js';

test('6A: the cold open spends exactly two chips, ≤4 words each', () => {
  assert.deepEqual(chipBudget(COLD_OPEN_BEATS), ['CUT.', 'CUT THE WORLD.']);
  for (const chip of COLD_OPEN_BEATS.filter(b => b.chip).map(b => b.chip.text))
    assert.ok(chip.split(/\s+/).length <= 4, `${chip} is four words or fewer`);
});

test('6A: the sector crossing is visual-only, with no briefing text', () => {
  assert.deepEqual(chipBudget(SECTOR_BEATS), []);
  assert.deepEqual(SECTOR_BEATS.map(beat => beat.id), ['sector-locks', 'sector-seam', 'sector-rise', 'sector-release']);
  assert.equal(SECTOR_BEATS.at(-1).lockInput, false);
});

test('6A: each wave can carry one short story chip without changing the shot order', () => {
  const beats=sectorBeats('IT SEES YOU.');
  assert.deepEqual(beats.map(beat => beat.id), SECTOR_BEATS.map(beat => beat.id));
  assert.deepEqual(chipBudget(beats), ['IT SEES YOU.']);
  assert.equal(beats[1].chip.at,.2,'the chapter lands just after the seam opens');
});

test('6A: the mid-wave lesson is a brief animated cutscene with a release handoff', () => {
  const beats=midWaveBeats('LET IT PASS.');
  assert.deepEqual(beats.map(beat=>beat.id),MID_WAVE_BEATS.map(beat=>beat.id));
  assert.equal(chipBudget(beats)[0],'LET IT PASS.');
  assert.deepEqual(beats.map(beat=>!!beat.lockInput),[true,true,true,false]);
  assert.equal(lockTicks(beats),48,'the read window is brief');
  assert.equal(beats[1].chip.at,.15);
});

test('6A: the SHATTER cinematic spends exactly one chip', () => {
  assert.deepEqual(chipBudget(SHATTER_BEATS), ['IT HOLDS.']);
});

test('6A: the cinematic clocks match the shot lists at 60 tps', () => {
  assert.equal(COLD_OPEN_BEATS.reduce((n, b) => n + b.ticks, 0), 144, 'two point four seconds');
  assert.equal(SHATTER_BEATS.reduce((n, b) => n + b.ticks, 0), 150, 'two point five seconds');
  assert.equal(SECTOR_BEATS.reduce((n, b) => n + b.ticks, 0), 60, 'one second');
  assert.equal(lockTicks(SECTOR_BEATS), 50, 'the crossing hands back control before the last ember clears');
  assert.equal(lockTicks(COLD_OPEN_BEATS), 120, 'the open releases on the handoff beat');
  assert.equal(lockTicks(SHATTER_BEATS), 120, 'control returns at the 2.0s mark');
  assert.equal(lockTicks(SHATTER_BEATS, true), 72, 'reduced motion shrinks the lock, not the order');
  assert.deepEqual(CUTSCENE_PACING,{
    coldOpen:{totalTicks:144,lockedTicks:120,releaseTicks:24,totalSeconds:2.4,lockedSeconds:2},
    sector:{totalTicks:60,lockedTicks:50,releaseTicks:10,totalSeconds:1,lockedSeconds:50/60},
    midWave:{totalTicks:72,lockedTicks:48,releaseTicks:24,totalSeconds:1.2,lockedSeconds:.8},
    shatter:{totalTicks:150,lockedTicks:120,releaseTicks:30,totalSeconds:2.5,lockedSeconds:2},
  });
});

test('6A: the release beat of the SHATTER cinematic never locks input', () => {
  const last = SHATTER_BEATS[SHATTER_BEATS.length - 1];
  assert.equal(last.id, 'shatter-release');
  assert.equal(!!last.lockInput, false);
  for (const beat of SHATTER_BEATS.slice(0, -1))
    assert.equal(!!beat.lockInput, true, `${beat.id} locks`);
});

function forceShatter(r) {
  r.state.phase = 'playing';
  r.state.fracture.pct = 100;
  r.state.invul = 99999;
  for (let i = 0; i < 400 && !r.state.shatterDone; i++) r.tick();
}

test('6A: the SHATTER event — 140-tick singularity, +1 hull, rung 1', () => {
  const r = createRun(71, () => {}, { waveMode: true });
  try {
    forceShatter(r);
    assert.equal(r.state.shatterDone, true, 'the tear fired at 100');
    assert.equal(r.state.arenaMode, 'SHATTERED');
    assert.equal(r.state.shatters, 1);
    assert.equal(r.state.shatterRung, 1);
    assert.ok(r.state.shatter <= 140 && r.state.shatter > 130,
      `the flash clock runs 140 ticks (got ${r.state.shatter})`);
    assert.ok(r.state.hp >= 2, 'the hull floor holds on the way out');
    assert.equal(r.state.kineticStage, 1, 'the ladder starts at x1');
  } finally { r.dispose(); }
});

test('6A: a second SHATTER in the same run escalates the rung, never the rules', () => {
  const r = createRun(72, () => {}, { waveMode: true });
  try {
    forceShatter(r);
    const hpAfterFirst = r.state.hp;
    // A fresh tear: the wave director resets shatterDone per cycle; the meter
    // going full again earns the next one.
    r.state.shatterDone = false;
    r.state.arenaMode = 'SHATTERED';
    forceShatter(r);
    assert.equal(r.state.shatters, 2);
    assert.equal(r.state.shatterRung, 2, 'rung 2: more light, same law');
    assert.ok(r.state.hp >= hpAfterFirst, 'the hull refill is never a penalty');
  } finally { r.dispose(); }
});

test('6A: the input lock kills dash and focus outright', () => {
  const r = createRun(73, () => {}, { waveMode: true });
  try {
    r.state.phase = 'playing';
    r.state.invul = 99999;
    r.state.inputLock = true;
    const edgeBefore = r.state.edge;
    const dashed = r.dash({ x: 1, y: 0, power: 1 });
    assert.equal(dashed, false, 'no launch through a tear');
    assert.equal(r.state.edge, edgeBefore, 'no edge is spent');
    r.focus(true);
    assert.equal(r.state.held, false, 'no held aim under the lock');
    r.state.inputLock = false;
    r.focus(true);
    assert.equal(r.state.held, false, 'still grounded/... airborne gates apply after release — held may legitimately stay false');
  } finally { r.dispose(); }
});

test('6A: every cutscene beat painter renders headlessly, both motion modes, without throwing', () => {
  const dom = installDom();
  try {
    const { canvas } = createDisplay(880, 710);
    const renderer = createRenderer(canvas);
    const run = createRun(77, () => {}, { waveMode: true, fracturePct: 65 });
    run.state.storyMoment={emotion:'friendship',mechanic:'pulse',chip:'LET IT PASS.',lesson:'Dodge the expanding rim.'};
    for (const beat of [...COLD_OPEN_BEATS, ...SECTOR_BEATS, ...MID_WAVE_BEATS, ...SHATTER_BEATS]) {
      for (const motion of [true, false]) {
        for (const t of [0.02, 0.5, 0.98]) {
          run.state.cutscene = {
            beatId: beat.id,
            beatIndex: 0,
            t,
            elapsedTotal: 10,
            totalTicks: 100,
            lockInput: !!beat.lockInput,
            reducedMotion: !motion,
          };
          renderer.tick(run, motion);
          renderer.draw(run, 1, null, motion);
        }
      }
    }
    run.state.cutscene = null;
    renderer.tick(run, true);
    renderer.draw(run, 1, null, true);
    run.dispose();
  } finally {
    dom.uninstall();
  }
});
