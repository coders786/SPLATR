/**
 * CHUNK 6A — THE CUTSCENE DRIVER.
 *
 * The pure reducer behind both cutscenes. Tick bookkeeping, the 0.5s skip
 * gate, the reduced-motion tick scale, the onDone-once guarantee, and the
 * one-shot session gate for the cold open.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCutscene,
  coldOpenOnce,
  scaledTicks,
  beatTotalTicks,
  MIN_SKIP_TICKS,
} from '../src/cutscene.js';

const beats = [
  { id: 'a', ticks: 10, lockInput: true },
  { id: 'b', ticks: 10 },
  { id: 'c', ticks: 10, chip: { text: 'IT HOLDS.', at: 0 } },
];

test('the driver rejects empty and malformed beat tables', () => {
  assert.throws(() => createCutscene({}), RangeError);
  assert.throws(() => createCutscene({ beats: [] }), RangeError);
  assert.throws(() => createCutscene({ beats: [{ id: '', ticks: 10 }] }), TypeError);
  assert.throws(() => createCutscene({ beats: [{ id: 'x', ticks: 0 }] }), RangeError);
  assert.throws(() => createCutscene({ beats: [{ id: 'x' }] }), RangeError);
});

test('beats advance on ticks only; the last beat ending calls onDone exactly once', () => {
  let done = 0;
  const cs = createCutscene({ beats, onDone: () => done++ });
  const start = cs.snapshot();
  assert.equal(start.phase, 'playing');
  assert.equal(start.beatId, 'a');
  assert.equal(start.lockInput, true);
  assert.equal(start.t, 0);
  for (let i = 0; i < 9; i++) cs.tick();
  assert.equal(cs.snapshot().beatId, 'a', 'nine ticks into a ten-tick beat');
  cs.tick();
  assert.equal(cs.snapshot().beatId, 'b');
  assert.equal(cs.snapshot().t, 0);
  for (let i = 0; i < 9; i++) cs.tick();
  assert.equal(cs.snapshot().beatId, 'b');
  cs.tick();
  assert.equal(cs.snapshot().beatId, 'c');
  for (let i = 0; i < 9; i++) cs.tick();
  assert.equal(cs.snapshot().phase, 'playing');
  cs.tick();
  const end = cs.snapshot();
  assert.equal(end.phase, 'done');
  assert.equal(end.finished, true);
  assert.equal(done, 1);
  cs.tick(); cs.tick(); cs.tick();
  assert.equal(done, 1, 'onDone is a one-shot');
});

test('lockInput is true only while a locking beat is live', () => {
  const cs = createCutscene({ beats });
  assert.equal(cs.snapshot().lockInput, true);
  for (let i = 0; i < 10; i++) cs.tick();
  assert.equal(cs.snapshot().lockInput, false, 'the middle beat never locks');
  for (let i = 0; i < 10; i++) cs.tick();
  assert.equal(cs.snapshot().lockInput, false);
});

test('skip is refused before the 0.5s gate and honored after it', () => {
  let done = 0, skipped = 0;
  const long = [{ id: 'long', ticks: 240, lockInput: true }];
  const cs = createCutscene({ beats: long, onDone: () => done++, onSkip: () => skipped++ });
  assert.equal(cs.skippable, false);
  for (let i = 0; i < MIN_SKIP_TICKS - 1; i++) cs.tick();
  cs.skip();
  assert.equal(cs.snapshot().skipped, false, 'the gate holds');
  assert.equal(done + skipped, 0);
  assert.equal(cs.skippable, false);
  cs.tick();
  assert.equal(cs.skippable, true);
  cs.skip();
  const end = cs.snapshot();
  assert.equal(end.phase, 'skipped');
  assert.equal(skipped, 1);
  assert.equal(done, 0, 'the skip path does not also fire onDone');
});

test('without onSkip, a skip lands in onDone exactly once', () => {
  let done = 0;
  const long = [{ id: 'long', ticks: 240, lockInput: true }];
  const cs = createCutscene({ beats: long, onDone: () => done++ });
  for (let i = 0; i < MIN_SKIP_TICKS; i++) cs.tick();
  cs.skip();
  assert.equal(cs.snapshot().phase, 'skipped');
  assert.equal(done, 1);
  cs.skip(); cs.tick();
  assert.equal(done, 1);
});

test('reducedMotion scales every beat by 0.6', () => {
  assert.equal(scaledTicks(50, true), 30);
  assert.equal(scaledTicks(1, true), 1, 'a beat never vanishes');
  assert.equal(beatTotalTicks(beats), 30);
  assert.equal(beatTotalTicks(beats, true), 18);
  const cs = createCutscene({ beats, reducedMotion: true });
  assert.equal(cs.table[0].ticks, 6);
  assert.equal(cs.snapshot().totalTicks, 18);
});

test('the beat table is frozen against later mutation', () => {
  const arr = [{ id: 'x', ticks: 10 }];
  const cs = createCutscene({ beats: arr });
  arr[0].ticks = 9999;
  assert.equal(cs.table[0].ticks, 10);
  assert.throws(() => { cs.table[0].ticks = 5; }, TypeError);
});

test('tick(dt) advances whole ticks and clamps at the final beat', () => {
  const cs = createCutscene({ beats });
  cs.tick(1000);
  assert.equal(cs.snapshot().phase, 'done');
});

test('the cold open gate fires exactly once per session instance', () => {
  const gate = coldOpenOnce();
  assert.equal(gate.should(), true);
  assert.equal(gate.should(), false);
  assert.equal(gate.should(), false);
  assert.equal(gate.shown, true);
  const fresh = coldOpenOnce();
  assert.equal(fresh.should(), true, 'a new session gets its open again');
});
