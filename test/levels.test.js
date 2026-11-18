import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bandAt,
  CELL_W,
  CELL_H,
  cellAt,
  createStream,
  district,
  freshSeed,
  makeCell,
} from '../src/levels.js';
import { TYPES } from '../src/shapes.js';
test('seed and address reproduce a cell independently of visit order; reroll changes the opening', () => {
  const a = makeCell(54, -420, 651);
  makeCell(54, -421, 651);
  assert.deepEqual(a, makeCell(54, -420, 651));
  assert.notDeepEqual(a, makeCell(55, -420, 651));
  assert.notDeepEqual(makeCell(54, 0, 0), makeCell(55, 0, 0));
  assert.notEqual(freshSeed(77), 77);
  assert.equal(a.id, '-420:651');
  assert.deepEqual(cellAt({ x: -1.74*CELL_W, y: -5.12*CELL_H }), { cx: -2, cy: 5 });
});
test('encounters draw from all non-boss species in bounded, addressed formations with interruptible linked sentries', () => {
  const kinds = new Set(),
    forms = new Set(),
    names = new Set();
  let links = 0;
  for (let row = 0; row < 75; row++) {
    const band = bandAt(-row * CELL_H);
    if (band > 1) names.add(district(71, band));
    for (let x = -2; x <= 2; x++) {
      const c = makeCell(71, x, row);
      if (typeof c.pattern === 'number') forms.add(c.pattern);
      for (const [i, s] of c.spawns.entries()) {
        assert.ok(TYPES[s.kind]);
        kinds.add(s.kind);
        assert.equal(s.slot, i);
        assert.equal(s.home, c.id);
        assert.deepEqual(cellAt(s), { cx: x, cy: row });
      }
      if (c.link) {
        links++;
        for (const id of [c.link.a, c.link.b])
          assert.ok(c.spawns.some((s) => s.id === id && s.kind === 'prism'));
      }
    }
  }
  assert.equal(kinds.size, 7);
  assert.equal(forms.size, 5);
  assert.equal(names.size, 5);
  assert.ok(links > 10);
});
test('stream visits at most a 3×3 neighbourhood, remembers defeated slots on return, prunes below tide', () => {
  const active = new Map(),
    s = createStream(
      71,
      (e) => active.set(e.id, e),
      (id) => {
        for (const [k, e] of active) if (e.home === id) active.delete(k);
      },
    );
  s.sync({ x: 0, y: 0 }, 730);
  const down = active.get('0:0/1');
  assert.ok(down);
  s.mark(down);
  active.delete(down.id);
  s.sync({ x: 3 * CELL_W, y: 0 }, 730);
  assert.ok(!s.live.has('0:0'));
  s.sync({ x: 0, y: 0 }, 730);
  assert.ok(s.live.has('0:0'));
  assert.ok(!active.has(down.id));
  assert.ok(active.has('0:0/0'));
  for (let i = 1; i < 250; i++) {
    s.sync({ x: i * 150, y: -i * CELL_H }, 730 - i * CELL_H);
    assert.ok(s.live.size <= 9);
    assert.ok(active.size <= 60);
  }
  assert.ok(!s.cleared.has('0:0'));
});
test('a new opening can change lane, initial foe and follow-up composition, not just jitter coordinates', () => {
  const sides = new Set(),
    first = new Set(),
    sequences = new Set();
  for (let seed = 0; seed < 120; seed++) {
    const { spawns } = makeCell(seed, 0, 0);
    sides.add(Math.sign(spawns[0].x));
    first.add(spawns[0].kind);
    sequences.add(spawns.map((e) => e.kind).join('/'));
    assert.equal(TYPES[spawns[0].kind].hp, 1);
  }
  assert.equal(sides.size, 2);
  assert.ok(first.size >= 3);
  assert.ok(sequences.size >= 4);
});
