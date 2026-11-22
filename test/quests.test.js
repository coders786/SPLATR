import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTS,
  offers,
  createTicket,
  loadProfile,
  nextPrize,
  PARTS,
} from '../src/quests.js';
const profile = () => loadProfile('{}');
const ticket = (
  ids = ['fang5', 'double2', 'sector3'],
  p = profile(),
  prize = 'halo',
) => createTicket(ids, prize, p);
const kill = (t, kind = 'fang', strokeKills = 1) =>
  t.event('cut', { kind, strokeKills });
function complete(t) {
  for (const q of t.rows) q.value = q.goal - 1;
  t.event('sector', { band: 7 });
  for (let i = 0; i < 5; i++) {
    t.event('dash');
    kill(t, 'fang', 3);
    kill(t, 'bastion', 3);
    t.event('drive');
  }
}
test('quest catalog: short labels and 3 categories × 3 tiers', () => {
  for (const q of QUESTS) assert.ok(q.label.split(' ').length <= 4);
  for (let i = 0; i < 100; i++) {
    const roll = offers();
    assert.equal(roll.length, 3);
    for (const col of roll)
      assert.deepEqual(
        col.map((q) => q.tier),
        [0, 1, 2],
      );
  }
});
test('quest points: 30 easy, 95 mixed, 360 all hard', () => {
  assert.equal(ticket().points, 30);
  assert.equal(ticket(['fang5', 'triple1', 'sector7']).points, 95);
  assert.equal(ticket(['bastion2', 'drive1', 'sector7']).points, 360);
});
test('tutorial, fragments and paper never count', () => {
  const t = ticket();
  t.event('cut', { kind: 'fang' }, false);
  t.event('cut', { kind: 'fang', small: true });
  t.event('cut', { kind: 'fang', paper: true });
  assert.equal(t.rows[0].value, 0);
});
test('double/triple milestones count once per dash, not once per victim', () => {
  const t = ticket();
  t.event('dash');
  kill(t, 'fang', 2);
  kill(t, 'fang', 3);
  kill(t, 'fang', 4);
  assert.equal(t.rows[1].value, 1);
  t.event('dash');
  kill(t, 'fang', 2);
  assert.equal(t.rows[1].value, 2);
});
test('Head Starts keyed by ID, capped, and never accumulate on instant deaths', () => {
  const p = profile();
  let t = ticket(undefined, p);
  for (let i = 0; i < 4; i++) kill(t);
  let d = t.die();
  assert.equal(d.heads.fang5, 2);
  assert.equal(d.saved, 8);
  for (let i = 0; i < 8; i++) {
    t = ticket(undefined, p);
    assert.equal(t.rows[0].value, 2);
    assert.equal(t.die().saved, 0);
    assert.equal(p.heads.fang5, 2);
  }
  assert.equal(ticket(['prism4', 'double2', 'sector3'], p).rows[0].value, 0);
});
test('death settlement and Vault bestowal are idempotent', () => {
  const p = profile(),
    t = ticket(undefined, p);
  for (let i = 0; i < 4; i++) kill(t);
  t.die();
  const before = p.unlock;
  t.die();
  assert.equal(p.unlock, before);
  assert.equal(t.grant(), false);
  const win = ticket(undefined, p);
  complete(win);
  assert.equal(win.opened, true);
  assert.equal(win.grant(), true);
  assert.ok(p.owned.includes('halo'));
  const coins = p.coins;
  assert.equal(win.grant(), false);
  assert.equal(p.coins, coins);
});
test('one portal per run: completed ticket stops accepting events', () => {
  const t = ticket();
  complete(t);
  const values = t.rows.map((q) => q.value);
  t.event('sector', { band: 100 });
  assert.deepEqual(
    t.rows.map((q) => q.value),
    values,
  );
  assert.equal(t.opened, true);
});
test('air timer advances only live airborne ticks and resets on floor', () => {
  const t = ticket(['fang5', 'double2', 'air20']);
  for (let i = 0; i < 600; i++) t.tick(true, true);
  for (let i = 0; i < 5000; i++) t.tick(false, true);
  assert.equal(t.rows[2].value, 600);
  t.event('floorKick');
  for (let i = 0; i < 600; i++) t.tick(true, true);
  assert.equal(t.rows[2].done, false);
  for (let i = 0; i < 600; i++) t.tick(true, true);
  assert.equal(t.rows[2].done, true);
});
test('bounce cut window expires after 30 live ticks', () => {
  const t = ticket(['fang5', 'bounce2', 'sector3']);
  t.event('bank');
  kill(t);
  assert.equal(t.rows[1].value, 1);
  for (let i = 0; i < 31; i++) t.tick(true, true);
  kill(t);
  assert.equal(t.rows[1].value, 1);
  t.event('floorKick');
  kill(t);
  assert.equal(t.rows[1].done, false);
  kill(t);
  assert.equal(t.rows[1].done, true);
});
test('clean sector streak resets on damage', () => {
  const t = ticket(['fang5', 'double2', 'clean2']);
  t.event('sector', { band: 2 });
  assert.equal(t.rows[2].value, 1);
  t.event('hurt');
  t.event('sector', { band: 3 });
  t.event('sector', { band: 4 });
  assert.equal(t.rows[2].done, false);
  t.event('sector', { band: 5 });
  assert.equal(t.rows[2].done, true);
});
test('profile sanitizes corrupt progress, owned rewards fall back to chest', () => {
  const p = loadProfile(
    '{"heads":{"fang5":1000},"coins":-3,"owned":["halo","fake"]}',
  );
  assert.equal(p.heads.fang5, 2);
  assert.equal(p.coins, 0);
  assert.deepEqual(p.owned, ['halo']);
  assert.equal(nextPrize(p).id, 'wings');
  p.owned = PARTS.map((p) => p.id);
  assert.equal(nextPrize(p).id, 'chest');
});

test('real run: portal doorstep is safe and Vault return advances one area only', async () => {
  const { createRun } = await import('../src/run.js');
  const run = createRun(123, () => {}, { warmup: false });
  try {
    run.state.phase = 'playing';
    run.state.invul = 0;
    const p = run.world.player.position,
      hp = run.state.hp,
      y = p.y;
    run.state.questPortal = { x: p.x, y: p.y, r: 134 };
    assert.equal(run.hurt('fang'), false);
    assert.equal(run.state.hp, hp);
    assert.equal(run.leaveQuestVault(), true);
    assert.ok(run.world.player.position.y < y);
    assert.equal(run.state.edge, 3);
    assert.ok(run.state.invul >= 90);
    assert.equal(run.leaveQuestVault(), false);
  } finally {
    run.dispose();
  }
});

test('all-hard currency chest pays 360 points plus both chests once', () => {
  const p = profile(),
    t = ticket(['bastion2', 'drive1', 'sector7'], p, 'chest');
  complete(t);
  assert.equal(t.grant(), true);
  assert.equal(p.coins, 560);
  assert.equal(t.grant(), false);
  assert.equal(p.coins, 560);
});

test('Head Starts shorten timed and streak goals, not only kill goals', () => {
  const p = profile();
  p.heads.air20 = 600;
  const t = ticket(['fang5', 'double2', 'air20'], p);
  for (let i = 0; i < 599; i++) t.tick(true, true);
  assert.equal(t.rows[2].done, false);
  t.tick(true, true);
  assert.equal(t.rows[2].done, true);
  p.heads.clean2 = 1;
  const clean = ticket(['fang5', 'double2', 'clean2'], p);
  clean.event('sector', { band: 2 });
  assert.equal(clean.rows[2].done, true);
});
