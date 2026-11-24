/**
 * CHUNK 2 — the three-colour law, "safe to slice", and the damage slow-motion.
 *
 * These checks are deliberately adversarial towards the art: the palette test
 * re-reads the ENGINE'S OWN literals rather than trusting the copy in
 * `color-law.js`, and the slice tests compare the marker's answer against the
 * real hit test in `slasher.js` rather than against a hand-computed number.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import {
  LAW, LAW_INK, LAW_PIP, ENEMY_HUES, REWARD_KINDS, BAND,
  lawOf, hueOf, chromaOf, rgbOf, readsGreen, markFor, isRewardKind, LAW_HINT, lawHintVisible,
} from '../src/color-law.js';
import { sweepGeometry, sweepCovers, sliceStates, sliceHint, swingBearing } from '../src/slice-safe.js';
import { hitPace, damageFeedback, bearingWord, HIT_WINDOW_TICKS, HIT_SLOW_TICKS, HIT_FREEZE_TICKS } from '../src/damage-feedback.js';
import { damageBearing, DAMAGE_LINE_MAX_WORDS } from '../src/hud-copy.js';
import { drawSliceSafe, resolveSliceMark } from '../src/art/splatr-art-engine.js';
import { createRun } from '../src/run.js';
import { placePlayer, stopPlayer } from '../src/physics.js';

const engineSource = () => readFileSync(new URL('../src/art/splatr-art-engine.js', import.meta.url), 'utf8');
const ch1Source = readFileSync(new URL('./chunk1-launch.test.js', import.meta.url), 'utf8');

// ── the law itself ────────────────────────────────────────────────────────

test('the three voices are exactly three, and each reads as itself', () => {
  assert.deepEqual(Object.keys(LAW).sort(), ['lethal', 'reward', 'safe']);
  for (const [role, hex] of Object.entries(LAW)) {
    assert.equal(lawOf(hex), role, `${role} ${hex} must read as ${role}`);
  }
  // The STRONG inks carry the meaning; the pale cores are strokes, and are
  // deliberately below the chroma floor so they can never be the only signal.
  for (const [role, hex] of Object.entries(LAW_PIP)) assert.equal(lawOf(hex), role, `${role} pip`);
  for (const [role, ink] of Object.entries(LAW_INK)) {
    assert.equal(lawOf(ink.edge), role, `${role} edge`);
    assert.ok(chromaOf(ink.core) < 0.28, `${role} core is a highlight, not a signal`);
  }
});

test('hex maths is honest, and refuses garbage instead of guessing', () => {
  assert.deepEqual(rgbOf('#ff0000'), { r: 255, g: 0, b: 0 });
  assert.deepEqual(rgbOf('f0f'), { r: 255, g: 0, b: 255 });
  assert.equal(rgbOf('rebeccapurple'), null);
  assert.equal(rgbOf(null), null);
  assert.equal(Math.round(hueOf('#ff0000')), 0);
  assert.equal(Math.round(hueOf('#00ff00')), 120);
  assert.equal(Math.round(hueOf('#0000ff')), 240);
  assert.equal(chromaOf('#808080'), 0, 'a grey has no chroma');
  assert.equal(lawOf('#808080'), 'other', 'and a grey is scenery, not a signal');
});

test('the safe band is exclusive: nothing warm, nothing gold, nothing blue', () => {
  const mustNotBeSafe = ['#ff2b4a', '#ffd166', '#ff8f4d', '#b28cff', '#928bff', '#ffffff', '#000000'];
  for (const hex of mustNotBeSafe) assert.notEqual(lawOf(hex), 'safe', `${hex} must not read as safe`);
  // The lethal band straddles 0deg, so a 350deg rose can never be read as gold.
  assert.equal(lawOf('#ff4277'), 'lethal');
  assert.equal(lawOf('#e0123a'), 'lethal');
});

// ── the palette the art actually paints ────────────────────────────────────

test('every enemy BODY is off the safe band and off the gold band', () => {
  for (const [kind, hex] of Object.entries(ENEMY_HUES)) {
    assert.notEqual(lawOf(hex), 'safe', `${kind} ${hex} must never read as safe`);
    if (isRewardKind(kind)) {
      // Only the body that pays may wear gold. The Crown does.
      assert.equal(lawOf(hex), 'reward', `${kind} is a bounty and must read as reward`);
    } else {
      assert.notEqual(lawOf(hex), 'reward', `${kind} pays nothing and must not wear gold`);
    }
  }
  assert.deepEqual([...REWARD_KINDS], ['crown']);
});

test('the engine still paints the palette this module was checked against', () => {
  // The lock. The art engine has no imports by contract, so the copy above is
  // verified against the engine's own literals, not against itself.
  const src = engineSource();
  assert.match(src, new RegExp(`bastion:\\s*"${ENEMY_HUES.bastion}"`), 'COLORS.bastion must match');
  assert.match(src, new RegExp(`fang:\\s*"${ENEMY_HUES.fang}"`));
  assert.match(src, new RegExp(`crown:\\s*"${ENEMY_HUES.crown}"`));
  for (const hex of [ENEMY_HUES.fang, ENEMY_HUES.pulse, ENEMY_HUES.prism, ENEMY_HUES.fork, ENEMY_HUES.bastion, ENEMY_HUES.rift, ENEMY_HUES.well]) {
    assert.ok(src.includes(hex), `the engine still paints ${hex}`);
  }
});

test('no lethal mark in the engine is drawn in the safe voice', () => {
  const src = engineSource();
  // Hazards, tells, badges and the hit line all resolve to the lethal inks.
  assert.ok(src.includes('arc(c,LAW.lethalPale'), 'a wind-up rim uses the lethal ink');
  assert.ok(src.includes("c.strokeStyle = LAW.lethalPale"), 'the rush marker uses the lethal ink');
  assert.ok(/arc\(c, "#a3122f"/.test(src), 'the live ring is red-family, not rose-pink');
  assert.ok(!src.includes('"#b93863"'), 'the old pink ring core is gone');
  assert.ok(!src.includes("'#ffe4b3'"), 'the old amber shock core is gone');
  assert.ok(!src.includes('"#ffc35b"'), 'the Bastion no longer wears the gold body');
  assert.ok(!src.includes('"#ffba52"'), 'nor the original gold body');
  assert.ok(!src.includes("'#ffd2df'"), 'the Pulse tell is no longer a pale pink outlier');
});

test('green is claimed by the safe mark alone, and the reward mark is gold', () => {
  assert.equal(readsGreen(LAW.safe), true);
  assert.equal(readsGreen(LAW.reward), false);
  assert.equal(markFor('safe'), LAW.safe);
  assert.equal(markFor('lethal'), LAW.lethal);
  assert.equal(markFor('reward'), LAW.reward);
  assert.equal(markFor('nonsense'), LAW.lethal, 'an unknown role errs lethal, never safe');
  const src = engineSource();
  assert.ok(src.includes('safe: "#ddff89"'), 'the safe ink is the acid green the game already uses');
  assert.ok(src.includes('reward: "#ffd166"'), 'the reward ink is the pad gold');
});

test('the law is taught once, in three words, and retires on use', () => {
  assert.equal(LAW_HINT, 'GREEN CUTS · RED HURTS · GOLD PAYS');
  assert.equal(lawHintVisible(0, 0), true);
  assert.equal(lawHintVisible(3, 0), false, 'three cuts is enough teaching');
  assert.equal(lawHintVisible(0, 500), false, 'and it cannot outstay its welcome');
  assert.ok(ch1Source.includes('LAW_HINT') === false, 'chunk 1 is untouched');
});

// ── safe to slice ─────────────────────────────────────────────────────────

test('the sweep geometry is the blade the game actually swings', () => {
  const g = sweepGeometry({ reach: 1, width: 1 });
  assert.equal(g.span, 3.6 * 23, 'span is 3.6 body-radii, as sweepBlade has always used');
  assert.ok(Math.abs(g.halfWidth - 23 * 0.95) < 1e-9);
  const wide = sweepGeometry({ reach: 2, width: 1.5 });
  assert.ok(wide.span > g.span && wide.halfWidth > g.halfWidth, 'reach and width both widen it');
  assert.equal(Object.isFrozen(g), true, 'the geometry is a value, not a scratch pad');
});

test('the marker agrees with the real sweep, not with a guess', () => {
  const player = { x: 0, y: 0 }, geo = sweepGeometry({ reach: 1, width: 1 });
  // Dead ahead, comfortably inside.
  assert.equal(sweepCovers(player, 0, { x: 60, y: 0, r: 20 }, geo, { blade: 5 }).ok, true);
  // Behind the cube: the blade is a FORWARD ray, so this must fail.
  assert.equal(sweepCovers(player, 0, { x: -60, y: 0, r: 20 }, geo, { blade: 5 }).ok, false);
  // Off the line by more than the body radius plus the blade's half-width.
  assert.equal(sweepCovers(player, 0, { x: 40, y: 120, r: 20 }, geo, { blade: 5 }).ok, false);
  // Past the reach.
  assert.equal(sweepCovers(player, 0, { x: geo.span + 80, y: 0, r: 20 }, geo, { blade: 5 }).ok, false);
  // A body STRADDLING the tip is inside Matter's inflated ray, so the marker
  // must offer it: under-promising here would teach the wrong rule.
  assert.equal(sweepCovers(player, 0, { x: geo.span + 10, y: 0, r: 28 }, geo, { blade: 5 }).ok, true);
  // ...but not one whose edge is a hair beyond the lane.
  assert.equal(sweepCovers(player, 0, { x: 40, y: 20 + 22 + 10, r: 20 }, geo, { blade: 5 }).ok, false);
  // No blade, no promise.
  assert.equal(sweepCovers(player, 0, { x: 20, y: 0, r: 20 }, geo, { blade: 0 }).ok, false);
});

test('a live run with a blade out offers exactly the bodies its sweep reaches', () => {
  const run = createRun(21, () => {}, { waveMode: true });
  try {
    run.state.phase = 'playing';
    run.state.invul = 99;
    placePlayer(run.world, { x: 0, y: -120 });
    stopPlayer(run.world);
    // One body in the swing's path, one far beyond its reach, one behind it.
    const here = run.world.player.position;
    for (const [id, dx, dy] of [['ahead', 70, 0], ['far', 1200, 0], ['behind', -90, 0]])
      run.combat.add({ kind: 'fang', id, x: here.x + dx, y: here.y + dy, home: 'lab', delay: 0, wavePlaced: true });
    run.state.blade = 12;
    run.state.slashAngle = 0;
    const geo = sweepGeometry({ reach: 1, width: 1 });
    const slices = sliceStates({
      player: run.world.player.position,
      enemies: run.combat.enemies.values(),
      state: run.state,
      geometry: geo,
      limit: 12,
    });
    const ids = slices.map((s) => s.id);
    assert.ok(ids.includes('ahead'), 'the body in front is offered');
    assert.ok(!ids.includes('behind'), 'a body behind the swing is never marked');
    assert.ok(!ids.includes('far'), 'reach is respected');
    for (const s of slices) assert.ok(['reachable', 'lethal'].includes(s.state));
    // The REAL hit test, from the same place and bearing, must reach it too.
    run.combat.sweepBlade(0, 1, 1, 1);
    const touched = [...run.combat.contacts].map((e) => e.id);
    assert.ok(touched.includes('ahead'), 'the marker and sweepBlade agree');
    assert.ok(!touched.includes('behind'), 'and agree about what is behind');
  } finally {
    run.dispose();
  }
});

test('a winding-up body is marked lethal, and an armoured one is flagged', () => {
  const player = { x: 0, y: 0 }, geometry = sweepGeometry({ reach: 1, width: 1 });
  const enemies = [
    { id: 'tell', kind: 'fang', x: 60, y: 0, r: 22, mode: 'tell' },
    { id: 'rush', kind: 'fang', x: 70, y: 0, r: 22, mode: 'rush' },
    { id: 'idle', kind: 'fang', x: 80, y: 0, r: 22, mode: 'idle' },
    // A big body straddling the blade's tip: genuinely cuttable, so it must
    // be marked even though its centre is past the span.
    { id: 'plate', kind: 'bastion', x: 90, y: 0, r: 28, mode: 'idle' },
    { id: 'bounty', kind: 'crown', x: 40, y: 0, r: 30, mode: 'idle' },
  ];
  const slices = sliceStates({ player, enemies, state: { blade: 5, slashAngle: 0 }, geometry });
  const by = Object.fromEntries(slices.map((s) => [s.id, s]));
  assert.equal(by.tell.state, 'lethal');
  assert.equal(by.rush.state, 'lethal');
  assert.equal(by.idle.state, 'reachable');
  assert.equal(by.plate.shielded, true, 'plates are visible before the swing');
  assert.equal(by.bounty.shielded, true);
  assert.equal(by.bounty.reward, true, 'the bounty pays, and the mark says so');
  assert.equal(by.plate.reward, false, 'an armoured body pays nothing');
  // Reachable targets come first, then the shouting ones, nearest within each:
  // a crowded wave must never bury the body the player can actually cut.
  for (let i = 1; i < slices.length; i++) {
    const prev = slices[i - 1].state === 'lethal' ? 1 : 0, cur = slices[i].state === 'lethal' ? 1 : 0;
    assert.ok(cur > prev || (cur === prev && slices[i].along >= slices[i - 1].along));
  }
  assert.equal(slices[0].state, 'reachable', 'the cuttable body leads');
});

test('the marker resolves to the three voices and says one short line', () => {
  const base = { id: 1, kind: 'fang', x: 0, y: 0, r: 22, along: 40, armed: true };
  assert.equal(resolveSliceMark({ ...base }).color, LAW.safe);
  assert.equal(resolveSliceMark({ ...base, state: 'lethal' }).color, LAW.lethal);
  // The bracket is ALWAYS about the cut, so armour does not repaint it gold:
  // "you may cut this" and "this pays you" are different sentences and get
  // different glyphs (a red notch / a gold chevron) on the same green frame.
  assert.equal(resolveSliceMark({ ...base, shielded: true }).color, LAW.safe);
  assert.equal(resolveSliceMark({ ...base, shielded: true }).shielded, true);
  assert.equal(resolveSliceMark({ ...base, reward: true }).color, LAW.safe);
  assert.equal(resolveSliceMark({ ...base, reward: true }).reward, true);
  assert.equal(resolveSliceMark({ ...base, armed: false }), null, 'an unreachable body gets nothing');
  assert.equal(sliceHint([]), null);
  assert.equal(sliceHint([{ state: 'reachable', armed: true, shielded: false }]), 'GREEN = CUT · 1 IN REACH');
  assert.equal(sliceHint([{ state: 'reachable', armed: true, shielded: true }]), 'GREEN = CUT · PLATES STOP A KILL');
});

test('slice marks paint inside the canvas, obey state, and honour reduced motion', () => {
  const c = createCanvas(240, 200), ctx = c.getContext('2d'), before = ctx.getTransform();
  const slices = [
    { id: 1, kind: 'fang', x: 60, y: 60, r: 20, along: 30, armed: true },
    { id: 2, kind: 'fang', x: 140, y: 60, r: 20, along: 40, armed: true, state: 'lethal' },
    { id: 3, kind: 'bastion', x: 100, y: 140, r: 24, along: 50, armed: true, shielded: true },
    { id: 4, kind: 'fang', x: 240, y: 200, r: 20, along: 90, armed: false },
  ];
  const drawn = drawSliceSafe(ctx, slices, { scale: 1, motion: true, time: 0 });
  assert.equal(drawn, 3, 'only the armed marks are painted');
  assert.deepEqual(ctx.getTransform(), before, 'canvas state is restored');
  // Reduced motion freezes the pulse instead of dropping the mark.
  const calm = createCanvas(240, 200), cctx = calm.getContext('2d');
  assert.equal(drawSliceSafe(cctx, slices, { scale: 1, motion: false, time: 0 }), 3);
  assert.notDeepEqual(calm.toBuffer('image/png'), c.toBuffer('image/png'), 'motion changes the frame');
  const empty = createCanvas(240, 200), ectx = empty.getContext('2d');
  assert.equal(drawSliceSafe(ectx, [], {}), 0);
  assert.equal(drawSliceSafe(ectx, null, {}), 0);
});

test('the bearing used for the marker is the one the blade will use', () => {
  assert.equal(swingBearing({ slashAngle: 1.2 }), 1.2);
  assert.equal(swingBearing({ slashAngle: null, velocity: { x: 0, y: 5 } }), Math.PI / 2);
  assert.equal(swingBearing({}, 0.3), 0.3);
});

// ── the damage slow-motion ────────────────────────────────────────────────

test('the damage window is time, not skipped ticks', () => {
  assert.equal(hitPace(-1), 1, 'no hit, real time');
  assert.equal(hitPace(HIT_FREEZE_TICKS - 1), 1, 'the impact frame is the hitstop, not the slow-mo');
  assert.equal(hitPace(HIT_FREEZE_TICKS), 0.15, 'the window opens at a fifteenth of real time');
  let prev = hitPace(HIT_FREEZE_TICKS);
  for (let a = HIT_FREEZE_TICKS + 1; a <= HIT_WINDOW_TICKS; a++) {
    const next = hitPace(a);
    assert.ok(next >= prev, `the window eases back monotonically (tick ${a})`);
    prev = next;
  }
  assert.equal(hitPace(HIT_WINDOW_TICKS), 1, 'and lands exactly on real time');
  assert.equal(hitPace(999), 1);
  assert.equal(HIT_WINDOW_TICKS, HIT_FREEZE_TICKS + HIT_SLOW_TICKS);
});

test('a real hit slows the world through pace, and gravity stays coupled', () => {
  const run = createRun(31, () => {}, { waveMode: true });
  try {
    run.state.phase = 'playing';
    run.state.invul = 0;
    run.state.stop = 0;
    assert.equal(run.hurt('Pulse wave'), true, 'the hit lands');
    assert.equal(run.state.hitAge, 0, 'and the window starts on the same tick');
    // The run advances world time with the slow window; the physics timing and
    // its gravity must both have been scaled by `advanceTiming`, not by hand.
    // Tick past the impact frame (which is the hitstop, not the slow window)
    // and past the two ticks the stop holds physics for.
    for (let i = 0; i < HIT_FREEZE_TICKS + 4; i++) run.tick();
    assert.ok(run.state.hitAge > HIT_FREEZE_TICKS);
    const scale = run.world.engine.timing.timeScale;
    assert.ok(scale < 1, `the world runs slower: ${scale}`);
    const gravity = run.world.engine.gravity.scale;
    assert.ok(gravity > 0, 'gravity is still coupled to the clock');
    // Nothing was skipped: the clock advanced.
    const clock = run.world.clock;
    run.tick();
    assert.ok(run.world.clock > clock, 'ticks are spent, not swallowed');
    // And the window expires on its own.
    for (let i = 0; i < HIT_WINDOW_TICKS + 4; i++) run.tick();
    assert.equal(run.state.hitAge, -1, 'the window closes');
    assert.ok(run.world.engine.timing.timeScale >= 0.15, 'time returns');
  } finally {
    run.dispose();
  }
});

test('the reaction reports the window and the bearing word', () => {
  const fb = damageFeedback({ age: 4, player: { x: 0, y: 0 }, source: { x: 40, y: -40 }, cause: 'Fang' });
  assert.equal(fb.slow, true);
  assert.equal(fb.quiet === undefined, true);
  assert.equal(fb.bearing, 'UP-RIGHT');
  assert.equal(fb.label, 'FANG HIT');
  assert.equal(damageFeedback({ age: 40, player: { x: 0, y: 0 } }).slow, false);
  assert.equal(bearingWord(null), '');
  assert.equal(bearingWord(0), 'RIGHT');
  assert.equal(bearingWord(Math.PI), 'LEFT');
  assert.equal(bearingWord(Math.PI / 2), 'DOWN');
  assert.equal(bearingWord(-Math.PI / 2), 'UP');
});

test('the corner line gains a compass word and never becomes a sentence', () => {
  assert.equal(damageBearing('FANG HIT', 'LEFT'), 'FANG HIT LEFT');
  assert.equal(damageBearing('FANG HIT', ''), 'FANG HIT');
  assert.equal(damageBearing('FANG HIT', null), 'FANG HIT');
  const line = damageBearing('LANDLORD HEAVY BODY HIT', 'UP-RIGHT');
  assert.ok(line.split(/\s+/).length <= DAMAGE_LINE_MAX_WORDS, `four words: ${line}`);
});

// ── the painter the shell drives ──────────────────────────────────────────

test('the shell feeds the painter the run it is drawing, and only while a blade is out', () => {
  const src = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(src, /sliceStates\(\{/, 'main.js asks the pure module, it does not re-derive geometry');
  assert.match(src, /run\.state\.blade > 0/, 'no blade, no promise');
  assert.match(src, /setAimFeedback\?\.\(\{ hit: feedback, slices \}\)/, 'one payload, one call');
  assert.match(src, /hitIsOffScreen\(\)/, 'the compass word is only for off-screen attackers');
  const art = engineSource();
  assert.match(art, /setAimFeedback\(\{ hit = null, slices = null \} = \{\}\)/, 'the painter accepts slices');
  assert.match(art, /drawSliceSafe\(c, sliceMarkView/, 'and paints them');
});
