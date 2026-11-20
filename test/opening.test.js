import test from 'node:test';
import assert from 'node:assert/strict';
import { firstStart } from '../src/opening.js';
import { createRun, DRIVE_REACH } from '../src/run.js';
import { makeCell, openingFacing } from '../src/levels.js';
import { createCamera, toScreen } from '../src/camera.js';
import { impactFor } from '../src/stroke.js';
import { sceneFor } from '../src/storyboard.js';

const tick = (g, n) => {
  while (n-- > 0) g.tick();
};
const press = (g) => assert.equal(g.dash(g.suggestion()), true);
const room = () => {
  const events = [];
  const g = createRun(42, (k, d) => events.push([k, d]), { warmup: true });
  return { g, events, s: g.state };
};
const rows = (g) => {
  for (let i = 0; i < 4; i++) {
    press(g);
    tick(g, 44);
  }
};

test('the first Start consumes the guide, independently of points, completion, and choice of field', () => {
  const entries=new Map(),store={get:(k,d)=>entries.get(k)??d,set:(k,v)=>entries.set(k,String(v))};
  const start=firstStart(store);
  assert.equal(entries.has('started'),false,'browsing the title does not count');
  assert.deepEqual(start(),{warmup:true,staged:true});
  assert.equal(entries.get('started'),'1');
  assert.deepEqual(start(),{warmup:false,staged:true});
  assert.deepEqual(firstStart(store)('full'),{warmup:false,staged:false});
  assert.equal(firstStart(store)().warmup,false,'new document, same storage');
  entries.clear();assert.equal(firstStart(store)('full').warmup,false);assert.equal(firstStart(store)().warmup,false);
  entries.clear();entries.set('rackClears','1');assert.equal(firstStart(store)().warmup,false,'existing player');
  entries.clear();entries.set('best','900');assert.equal(firstStart(store)().warmup,false);
  const opaque=firstStart({get:(k,d)=>d,set:()=>{}});assert.ok(opaque().warmup);assert.ok(!opaque().warmup);
});

test('128 seeds: all three flags fit on phone, landscape and embed; either end of a rack can start the cut', () => {
  for (let seed = 0; seed < 128; seed++) {
    const g = createRun(seed, () => {}, { warmup: true }),
      s = g.state;
    try {
      const flags = [...g.combat.enemies.values()];
      assert.equal(g.stream.live.size, 0);
      assert.equal(flags.length, 3);
      assert.ok(flags.every((e) => e.pinned && e.paper && e.kind === 'fang' && e.hp === 1));
      for (const [w, h] of [
        [320, 568],
        [844, 390],
        [880, 710],
      ]) {
        const c = createCamera();
        c.resize(w, h);
        c.reset(g.world.player.position, openingFacing(seed), true);
        for (const e of flags) {
          const v = c.view(),
            q = toScreen(v, e),
            r = e.r * v.scale;
          assert.ok(q.x >= r && q.x <= w - r && q.y >= r && q.y <= h - r);
        }
      }
      g.dash(g.aimAt(flags[seed % 3]));
      tick(g, 38);
      assert.deepEqual(
        [s.shots, s.kills, s.score, s.throughcuts, s.hp, s.opening.row, s.opening.rest],
        [1, 3, 900, 1, 3, 1, true],
      );
      assert.equal(g.combat.enemies.size, 2);
      assert.ok(s.bestStroke.marks.every((m) => m.paper));
      const a = s.stroke.angle,
        flag = [...g.combat.enemies.values()][seed % 2];
      g.dash(g.aimAt(flag));
      tick(g, 40);
      assert.ok(Math.cos(a - s.stroke.angle) < 0.85, 'next rack needs a turn');
      assert.deepEqual(
        [s.kills, s.score, s.throughcuts, s.opening.row, g.combat.enemies.size],
        [5, 2100, 2, 2, 1],
      );
      assert.equal(g.nearest().hp, 2);
    } finally {
      g.dispose();
    }
  }
});

test('a whiff comes back to the same peg. Holding, mashing and waiting cannot cost hull, points, or a free swing', (t) => {
  const { g, s, events } = room();
  t.after(() => g.dispose());
  const start = { ...g.world.player.position },
    line = s.line,
    positions = [...g.combat.enemies.values()].map((e) => [e.x, e.y]);
  tick(g, 600);
  const miss = { x: -openingFacing(42) * 30, y: -13, power: 1 };
  g.dash(miss);
  assert.equal(s.edge, 3);
  tick(g, 1);
  g.focus(true);
  for (let i = 0; i < 300 && !s.opening.returning; i++) {
    assert.equal(g.dash(miss), false);
    g.tick();
  }
  assert.equal(s.opening.returning, 16);
  assert.equal(g.hurt('Fang'), false);
  assert.equal(s.stop, 0);
  assert.equal(s.held, false);
  const far = { ...g.world.player.position };
  tick(g, 8);
  assert.notDeepEqual(far, g.world.player.position);
  assert.notDeepEqual(start, g.world.player.position);
  tick(g, 1600);
  assert.deepEqual(g.world.player.position, start);
  assert.deepEqual(
    [...g.combat.enemies.values()].map((e) => [e.x, e.y]),
    positions,
  );
  assert.deepEqual(
    [s.opening.rest, s.score, s.hp, s.edge, s.line, s.shots],
    [true, 0, 3, 3, line, 1],
  );
  assert.equal(
    events.some(([k]) => ['cut', 'armor', 'tell', 'field', 'racksCleared'].includes(k)),
    false,
  );
  press(g);
  tick(g, 45);
  assert.equal(s.kills, 3);
});

test('paper swings are free; spending cuts on the shell teaches recharge without a death', (t) => {
    const { g, s } = room();
    t.after(() => g.dispose());
    press(g);
    assert.equal(s.reach, 1.9);
    tick(g, 45);
    press(g);
    assert.equal(s.edge, 3);
    assert.equal(s.reach, 1.9);
    tick(g, 45);
    assert.equal(s.opening.free, false);
    const v = { x: openingFacing(42) * -26, y: -14, power: 0.84 };
    for (let n = 0; n < 3; n++) {
      assert.ok(g.dash(v));
      for (let i = 0; i < 45 && !s.opening.rest; i++) g.tick();
    }
    assert.equal(s.kills, 5);
    // Wait and try each available charge rather than artificially writing edge=0.
    for (let i = 0; s.edge && i < 5; i++) {
      g.dash(v);
      for (let n = 0; n < 48 && !s.opening.rest; n++) g.tick();
    }
    assert.equal(g.dash(v), false);
    tick(g, 240);
    assert.equal(s.edge, 3);
    assert.equal(s.hp, 3);
    assert.equal(s.chain, 5, 'there is no ticking chain to read on the bench');
});

test('the bolted shell stops the blade and keeps its crack. No phantom refund; the real sixth kill goes into the field', (t) => {
  // NOTE: this test used to assert `score: 5700` and `drive > 170` at the
  // hand-off -- i.e. it asserted that the Cutting Room's points and Overdrive
  // LEAK into Sector 01. It was encoding the bug as the contract. The bench
  // rewards below (`drive > 170` INSIDE the room) still hold; what changed is
  // that the house rules zero the tally on the way out.

  const { g, s, events } = room();
  t.after(() => g.dispose());
  press(g);
  tick(g, 50);
  press(g);
  tick(g, 50);
  const shell = g.nearest();
  press(g);
  tick(g, 20);
  assert.equal(s.opening.rest, true);
  assert.equal(shell.hp, 1);
  assert.ok(Number.isFinite(shell.fault));
  assert.deepEqual([s.kills, s.score, s.edge, s.drive], [5, 2100, 2, 0]);
  assert.ok(Math.hypot(g.world.player.velocity.x, g.world.player.velocity.y) < 0.01);
  tick(g, 900);
  assert.equal(shell.hp, 1);
  press(g);
  tick(g, 60);
  // `drive` is zero here on purpose. The room used to hand the live field a
  // full Overdrive meter earned by slicing stationary racks, which is the
  // "start Round 1 up six knockdowns" problem. The bench still pays during
  // the room; the house rules zero the tally on the way out.
  assert.equal(s.drive, 0, 'no free Overdrive on the way in');
  assert.deepEqual(
    [s.opening, s.phase, s.shots, s.score, s.kills, s.throughcuts, s.hp, s.edge],
    [null, 'ready', 4, 0, 6, 2, 3, 3],
  );
  assert.equal(events.filter(([k]) => k === 'racksCleared').length, 1);
  assert.deepEqual(
    events.filter(([k]) => k === 'field'),
    [['field', { cleared: true }]],
  );
  assert.equal(g.combat.enemies.size, 1);
  assert.equal(g.nearest().mode, 'tell');
  assert.equal(g.combat.hazards.length, 0);
  assert.equal(g.combat.links.length, 0);
  const line = s.line,
    timer = g.nearest().clock;
  tick(g, 900);
  assert.equal(s.line, line);
  assert.equal(g.nearest().clock, timer);
  press(g);
  // `DRIVE_REACH` was reachable here only because the room's Overdrive
  // survived the hand-off. With the tally zeroed the first live shot is a
  // normal one; the long reach is still earned inside the field.
  assert.equal(s.reach, 1);
  tick(g, 10);
  assert.ok(g.combat.enemies.size > 1);
  assert.ok(s.kills > 6);
  assert.ok(!g.combat.enemies.has('0:0/0'));
});

test('skipping, retiring and restarting do not clear the racks or grant a net; ignoring the first Fang does not gate exploration', (t) => {
  const { g, s, events } = room();
  t.after(() => g.dispose());
  press(g);
  tick(g, 40);
  assert.equal(g.skipOpening(), true);
  assert.equal(g.skipOpening(), false);
  assert.equal(s.score, 900);
  assert.equal(s.net, false);
  assert.equal(s.drive, 0);
  assert.equal(g.combat.enemies.size, 1);
  g.dash({ x: -openingFacing(42) * 33, y: -4, power: 1 });
  tick(g, 20);
  assert.ok(g.combat.enemies.size > 1);
  assert.ok(g.combat.enemies.has('0:0/0'));
  assert.ok(!events.some(([k]) => k === 'racksCleared'));
  const r = room();
  t.after(() => r.g.dispose());
  r.g.retire();
  assert.equal(r.g.skipOpening(), false);
  tick(r.g, 100);
  assert.ok(!r.events.some(([k]) => k === 'field' || k === 'racksCleared'));
});

test('nothing catches you any more: a fall is not a rescue and not a death', (t) => {
  // The cut-room safety net existed for ONE job -- catching you before the
  // lethal Redline. With the Redline gone there is nothing to be caught from,
  // so the net branch was removed. This test replaces the old one that asserted
  // a catch; it now asserts the opposite, which is the current truth.
  const { g, s } = room();
  t.after(() => g.dispose());
  rows(g);
  const start = { ...g.world.player.position };
  assert.equal(s.line, start.y + 650, 'the spawn frontier still starts below you');
  press(g);
  tick(g, 550);
  // You are NOT rescued, and you are NOT killed.
  assert.equal(s.caught, false, 'no catch: the net no longer fires');
  assert.ok(!['over', 'dying'].includes(s.phase), 'falling does not end the run');
  assert.equal(s.hp, 3, 'and it does not cost hull either');
});

test('staged cells add at most one new species per row including adjacent cells, with no early prism links', () => {
  const allowed = new Set(['fang', 'bastion']),
    intro = [null, null, 'pulse', 'prism', null, 'fork', 'well', 'rift'];
  for (const [row, newKind] of intro.entries()) {
    if (newKind) allowed.add(newKind);
    for (let seed = 0; seed < 30; seed++)
      for (let x = -2; x <= 2; x++) {
        const c = makeCell(seed, x, row, true);
        assert.ok(!c.link);
        assert.ok(c.spawns.every((e) => allowed.has(e.kind)));
        if (newKind) assert.ok(c.spawns.some((e) => e.kind === newKind));
      }
  }
  for (let i = 8; i < 40; i++)
    assert.deepEqual(makeCell(19, 1, i, true), makeCell(19, 1, i, false));
});

test('the long blade reaches a real sensor that the normal blade misses; a sheet and an empty swing have different budgets', (t) => {
  const { g, s } = room();
  t.after(() => g.dispose());
  for (const e of g.combat.enemies.values()) g.combat.remove(e);
  const flag = g.combat.add({
    id: 'sample',
    kind: 'fang',
    x: 125,
    y: 0,
    angle: Math.PI,
    pinned: true,
  });
  g.combat.sweepBlade(0, 1);
  assert.equal(g.combat.contacts.size, 0);
  g.combat.sweepBlade(0, 1.9);
  assert.ok(g.combat.contacts.has(flag));
  assert.ok(impactFor('fang', false, false, true).gap > impactFor('fang').gap);
  assert.equal(impactFor('fang', false, false, true).cue, 'stock');
  assert.equal(s.stop, 0);
});

test('the proof strip follows what was actually hit, stays out of committed swings, and never appears on a field-only run',t=>{
  const {g,s}=room();t.after(()=>g.dispose());
  const scene=()=>sceneFor(s,g.nearest(),g.world.player.velocity.y>0,s.line-g.world.player.position.y);
  assert.equal(scene(),'tap');tick(g,500);assert.equal(s.shots,0);assert.equal(scene(),'tap');
  // Three racks show cards; the FOURTH press is the transition out of the room,
  // and `lane` was never a room card -- it only appeared because the field was
  // still allowed to show one. That is the haunted card, and it is gone.
  for(const next of ['pull','shell','crack']){press(g);assert.equal(scene(),null);tick(g,46);assert.equal(scene(),next);}
  press(g);assert.equal(scene(),null);tick(g,46);
  assert.equal(s.opening,null,'the room is over');
  // ── THE STRIP IS CONFINED TO THE CUTTING ROOM ───────────────────────────
  //
  // This used to assert `lane` HAPPENED HERE, then a `focus` card after it.
  // Both were the live field showing tutorial cards -- exactly the strip the
  // review filmed popping up in Sector 32. `enterField()` lowers
  // `tutorialActive` for good, so the last card of the room is the last card
  // of the run.
  assert.equal(s.tutorialActive,false,'the room disarmed the banners');
  assert.equal(scene(),null,'no card leaks out of the room');
  tick(g,500);assert.equal(scene(),null,'and none appears later either');
  const plain=createRun(42,()=>{},{staged:true});t.after(()=>plain.dispose());
  assert.equal(sceneFor(plain.state,plain.nearest(),false,10),null);
  const skip=room().g;t.after(()=>skip.dispose());assert.ok(skip.skipOpening());assert.equal(sceneFor(skip.state,skip.nearest(),false,10),null);
});

test('a run from the bench keeps going through every species and into the normal endless formations', (t) => {
  const { g, s } = room();
  t.after(() => g.dispose());
  rows(g);
  press(g);
  const kinds = new Set();
  let before = s.kills;
  for (let i = 0; i < 2400; i++) {
    g.tick();
    assert.ok(
      g.stream.live.size <= 9 && g.combat.enemies.size < 80 && g.combat.hazards.length <= 72,
    );
    for (const e of g.combat.enemies.values()) kinds.add(e.kind);
    if (s.edge && (s.kills > before || i % 22 === 0)) {
      before = s.kills;
      press(g);
    }
  }
  assert.equal(s.phase, 'playing');
  assert.ok(s.band > 8);
  assert.equal(kinds.size, 8);
  assert.ok(s.score > 100000);
  assert.equal(s.opening, null);
});

/* ── A MISS MUST NOT BE A DEAD END ──────────────────────────────────────── */

test('a player who misses the paper rows is not stuck on them', () => {
  // THE BUG THIS PINS: on a miss, `advance` incremented `o.misses` and then did
  // nothing with it -- the row stayed up forever. Measured, a bot that aimed
  // away from the rack climbed to 17 misses on row 0 and the lesson never
  // advanced, so a player who could not aim was stuck in the tutorial.
  //
  // `misses` was counted and never read, which is the signature of an
  // unfinished branch. It now concedes a PAPER row after MAX_LESSON_MISSES.
  //
  // Row 2 (the shell) is deliberately NOT conceded: it teaches spending charges
  // and cannot be cleared without hitting it, so retrying is the lesson rather
  // than a failure. A player stuck there has the Skip control.
  const { g, s } = room();
  const seenRows = new Set();
  let fired = false;
  let missesBefore = 0;
  for (let i = 0; i < 1200 && s.opening && s.opening.row < 2; i++) {
    if (s.opening.rest && !fired) {
      seenRows.add(s.opening.row);
      g.dash({ x: 0, y: 42 }); // straight down, away from every shape
      fired = true;
    }
    g.tick();
    if (s.opening?.rest) fired = false;
    missesBefore = s.opening?.misses ?? missesBefore;
  }
  // Reaching the shell by missing is the whole point: the paper rows give way.
  assert.equal(s.opening?.row, 2, 'missing the paper rows never advanced the lesson');
  assert.deepEqual([...seenRows].sort(), [0, 1], 'not every paper row was reached');
  // And it must not have taken forever: three tries per row, not seventeen.
  assert.ok(missesBefore <= 3, `the concede took ${missesBefore} misses on one row`);
});

test('a successful run through the lesson is unchanged by the miss handling', () => {
  // The concession must not fire on a player who is hitting things. Three rows
  // at three strokes, with no misses recorded.
  const { g, s } = room();
  let fired = false;
  let strokes = 0;
  for (let i = 0; i < 400 && s.opening; i++) {
    if (s.opening.rest && !fired) {
      const before = s.shots;
      g.dash(g.suggestion());
      if (s.shots > before) strokes++;
      fired = true;
    }
    g.tick();
    if (s.opening?.rest) fired = false;
  }
  assert.equal(s.opening, null, 'a clean run did not finish the lesson');
  assert.ok(strokes <= 4, `a clean run took ${strokes} strokes`);
});
