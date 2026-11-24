/**
 * CHUNK 5 — THE LEARNING GROUND.
 *
 * The training redesign, headless rules under test:
 *  - the hub door data is visual-first (three doors, three concise actions);
 *  - every room of the course has an action line and a why line (TUTORIAL_LINES);
 *  - tutorialWhy() reads the same state the gates read;
 *  - stall escalation: objective text gains the directive prefix when a room
 *    has made no objective-relevant progress for STALL_TICKS;
 *  - the Rift"s lesson opens with the wake step; the Monolith lesson exists,
 *    is SHATTERED, and completes end-to-end with banked stage-4 cuts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRAINING_DOORS, createTrainingHub } from '../src/training-hub.js';
import {
  TUTORIAL_LINES,
  STALL_TICKS,
  tutorialWhy,
  tutorialObjective,
  tutorialAnnouncement,
} from '../src/visual-tutorial.js';
import { placePlayer, stopPlayer } from '../src/physics.js';
import {
  createTeachingSession,
  TEACHING_SCENARIOS,
} from '../src/teaching.js';

// ── THE HUB ───────────────────────────────────────────────────────────────
test('CHUNK 5 hub: three visual doors, each with a concise action', () => {
  assert.equal(TRAINING_DOORS.length, 3);
  assert.deepEqual(TRAINING_DOORS.map(d => d.id), ['course', 'lessons', 'drills']);
  for (const door of TRAINING_DOORS) {
    assert.ok(door.name && door.tag && door.action, `${door.id} has a visible label and action`);
    assert.ok(!door.body && !door.detail, `${door.id} has no old prose payload`);
    assert.ok(door.tag.split(/\s+/).length <= 5, `${door.id} tag stays concise`);
    assert.match(door.action, /COURSE|ENEMY|DRILLS/, `${door.id}'s action is not a mystery`);
  }
});

test('CHUNK 5 hub: every door is disabled (never a silent no-op) when unwired', () => {
  // Node has no DOM — drive the factory's data branch directly: createTrainingHub
  // throws without a host. The disabled-door contract lives in the factory and
  // is exercised in the browser QA pass; here we assert the invariant the
  // factory depends on: actions map 1:1 to doors.
  for (const door of TRAINING_DOORS) assert.ok(['course', 'lessons', 'drills'].includes(door.id));
  assert.throws(() => createTrainingHub(), /host element/);
});

// ── THE COURSE BANNERS ─────────────────────────────────────────────────────
test('CHUNK 5 course: every room has an action line and a why line', () => {
  for (const stage of [0, 1, 2, 3]) {
    const line = TUTORIAL_LINES[stage];
    assert.ok(line, `room ${stage} exists`);
    assert.ok(line.title && line.why, `room ${stage} is fully written`);
    assert.notEqual(line.title, line.why);
  }
  assert.ok(STALL_TICKS >= 240, 'stall escalation is patient, not jumpy');
});

test('CHUNK 5 course: tutorialWhy reads the live rift, not a script', () => {
  const visual = (over) => ({ stage: 2, dodged: false, gateReady: false, gateBroken: false, ...over });
  assert.match(tutorialWhy(visual({})), /sleeps beyond its ring/i);
  const telling = tutorialWhy(visual({}), new Map([['tutorial/rift', { mode: 'tell' }]]));
  assert.match(telling, /red circle/i);
  assert.match(tutorialWhy(visual({ dodged: true })), /cut the Rift/i);
  assert.match(tutorialWhy({ stage: 0 }), /blade is short/i);
  assert.match(tutorialWhy({ stage: 1 }), /bank sets up everything/i);
});

test('CHUNK 5 course: stall escalation turns instructions into directives', () => {
  const stallVisual = (over) => ({
    stage: 2, stall: true, dodged: false, gateReady: false, gateBroken: false,
    guide: { kind: 'approach' }, ...over,
  });
  const enemies = new Map([['tutorial/rift', { mode: 'idle' }]]);
  assert.match(tutorialObjective(stallVisual({}), enemies, 'touch'), /^GO — STEP INTO THE RING/);
  assert.match(tutorialObjective(stallVisual({ guide: { kind: 'watch' } }), enemies, 'touch'), /^GO — WAIT FOR THE CIRCLE/);
  const calm = tutorialObjective({ ...stallVisual({}), stall: false }, enemies, 'touch');
  assert.match(calm, /IT WAKES WHEN YOU GET CLOSE/);
  assert.match(tutorialObjective({ stage: 0, stall: true }, new Map([['tutorial/rack/0', {}], ['tutorial/rack/1', {}]]), 'touch'), /IT CANNOT HIT BACK/);
  assert.match(tutorialObjective({ stage: 1, stall: true }, new Map(), 'touch'), /^GO — THE WALL/);
  assert.match(tutorialObjective({ stage: 3, stall: true }, new Map([['tutorial/crown', { hp: 2 }]]), 'touch'), /^GO — 2 HITS LEFT/);
});

test('CHUNK 5 course: announcing stays the same shape the speech engine expects', () => {
  const v = { stage: 2, guide: { kind: 'approach' } };
  assert.equal(tutorialAnnouncement(v, 'fallback', 'touch'), 'fallback');
  assert.equal(tutorialAnnouncement(v, 'fallback', 'mouse'), 'fallback');
});

// ── LIVE TRAINING: THE RIFT OPENER ─────────────────────────────────────────
test('CHUNK 5 lessons: the Rift opens with the wake step', () => {
  const rift = TEACHING_SCENARIOS.find(s => s.id === 'rift');
  assert.equal(rift.kind, 'rift');
  const s = createTeachingSession({ scenario: 'rift' });
  try {
    assert.equal(s.step[0], 'approach');
    assert.match(s.step[2], /sleeps/i);
  } finally {
    s.dispose();
  }
});

// ── LIVE TRAINING: THE MONOLITH ────────────────────────────────────────────
test('CHUNK 5 lessons: the Monolith lesson exists and is a torn-arena room', () => {
  const monolith = TEACHING_SCENARIOS.find(s => s.id === 'monolith');
  assert.equal(monolith.kind, 'monolith');
  const s = createTeachingSession({ scenario: 'monolith' });
  try {
    assert.equal(s.run.state.arenaMode, 'SHATTERED');
    assert.equal(s.run.world.arenaMode, 'SHATTERED');
    const m = [...s.run.combat.enemies.values()][0];
    assert.equal(m.kind, 'monolith');
    assert.equal(m.pinned, true);
    assert.equal(m.hp, 10);
    assert.equal(s.step[0], 'approach');
  } finally {
    s.dispose();
  }
});

test('CHUNK 5 lessons: the Monolith lesson completes end to end', () => {
  const s = createTeachingSession({ scenario: 'monolith' });
  const r = s.run;
  const monolith = () => r.combat.enemies.get('lesson-0');
  try {
    // Step 1 — APPROACH: get within its reach.
    placePlayer(r.world, { x: 30, y: -130 });
    stopPlayer(r.world);
    r.state.shots = 1;
    s.tick();
    assert.equal(s.step[0], 'approach');
    assert.equal(s.waiting, true, 'wake step observed in the ring');
    assert.equal(s.continueStep(), true);

    // Step 2 — CHARGE: bank the rails to stage 4.
    r.state.kineticStage = 4;
    s.tick();
    assert.equal(s.step[0], 'charge');
    assert.equal(s.waiting, true, 'stage 4 observed');
    assert.equal(s.continueStep(), true);

    // Step 3 — CLEAR: five banked OVERCHARGED cuts, one plate each.
    for (let i = 0; i < 5; i++) {
      const m = monolith();
      assert.ok(m, `plate ${i + 1}: the Monolith still stands`);
      placePlayer(r.world, { x: m.x, y: m.y + 130 });
      stopPlayer(r.world);
      r.state.shots += 1;
      r.state.kineticStage = 4;
      r.state.blade = 12;
      s.tick();
    }
    assert.equal(monolith(), undefined, 'the Monolith falls');
    assert.equal(s.complete, true);
    assert.equal(s.waiting, true, 'clear step observed');
    assert.equal(s.continueStep(), true);
    assert.equal(s.objectivesComplete, true);
  } finally {
    s.dispose();
  }
});
