/**
 * CHUNK 1 — CLEAR SIGHTLINES, TITLE POLISH, OBVIOUS HEALTH, CLEAN HUD.
 *
 * Every assertion here is about a thing the launch report could SEE:
 *
 *   1. health is a chunky bar under the score, never the tiny corner pips
 *   2. cut charges are on the cube, and the far-right warnings are gone
 *   3. `px/s`, `TARGET`, `HOLD PACE`, `OVERCHARGED — LETHAL` and
 *      `SHATTER EVENT / FAULT LINES` no longer reach a player
 *   4. the title screen has ONE practice door and no `+300` sticker
 *   5. a hit gives a direction to the exact attacker, and a 1.2s safe window
 *   6. the story chip and the starter hint are EDGE tickers, not centre modals
 *   7. the aiming ring is drawn, pinchable, and refuses in red
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { healthSegments, damageFeedback, hitDirection, dmgLabel, SAFE_BLINK_TICKS, HIT_RIM_TICKS } from '../src/damage-feedback.js';
import { reticleFor, RETICLE } from '../src/pointer-reticle.js';
import { rushReadout, bossChargeReadout, shortDamageLine, hintVisible, RANK_WORDS, DAMAGE_LINE_MAX_WORDS } from '../src/hud-copy.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const waveUi = readFileSync(new URL('../src/wave-ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../src/art/splatr-art-engine.js', import.meta.url), 'utf8');

// ── 1. HEALTH ────────────────────────────────────────────────────────────
test('CHUNK 1: health is a chunky segmented bar directly under the score', () => {
  const score = html.indexOf('class="score-lock"');
  const block = html.indexOf('id="hull-block"');
  const nav = html.indexOf('id="combat-status"');
  assert.ok(score > 0 && block > score && block < nav, 'the hull block sits inside .score-lock');
  assert.ok(html.includes('id="health-bar"'), 'the bar has a real element');
  assert.ok(!/id="hull"/.test(html), 'the old 7px pip strip is gone');

  // Every `#health-bar` rule, so a second declaration (the hit animation, the
  // critical pulse) cannot hide the box's own metrics from this check.
  const rules = [...css.matchAll(/#health-bar\s*\{[^}]*\}/g)].map((m) => m[0]);
  assert.ok(rules.length, '#health-bar needs its own rule');
  const height = +(rules.map((r) => (r.match(/\bheight:\s*(\d+)px/) || [])[1]).find(Boolean) || 0);
  assert.ok(height >= 20, `the hull must be readable at 960x540, got ${height}px`);
  assert.ok(/#health-bar i\.broke\s*\{[^}]*animation/.test(css), 'a broken segment cracks');
  assert.ok(/data-critical/.test(css) && /@keyframes hull-rim/.test(css), 'one health left glows the corners');
});

test('CHUNK 1: health segments name the block that broke, and low health is a state', () => {
  const drop = healthSegments(2, 3, 3);
  assert.deepEqual({ max: drop.max, now: drop.now, lost: drop.lost, brokeAt: drop.brokeAt }, { max: 3, now: 2, lost: 1, brokeAt: 2 });
  assert.equal(drop.critical, false);
  assert.equal(healthSegments(1, 3, 2).critical, true, 'one left is critical');
  assert.equal(healthSegments(0, 3, 1).empty, true, 'zero left is empty');
  assert.equal(healthSegments(4, 4, null).brokeAt, -1, 'no previous total means nothing broke');
  assert.equal(healthSegments(9, 3, 9).now, 3, 'never paints past the bar');
});

// ── 2. CUT CHARGES ───────────────────────────────────────────────────────
test('CHUNK 1: cut charges are drawn on the cube and the far-corner warnings are deleted', () => {
  assert.ok(engine.includes('CHUNK 1: THE CUT CHARGES, ON THE CUBE'), 'the on-cube charge readout exists');
  assert.ok(/NO CUTS \/ RECHARGING/.test(engine) === false, 'the engine never printed it anyway');
  assert.ok(!/pop\('NO CUTS/.test(main), 'the far-right NO CUTS pill is gone');
  assert.ok(!/OVERCHARGED — LETHAL/.test(main), 'the far-right OVERCHARGED pill is gone');
  assert.ok(/refuseTicks/.test(main), 'a refused shot arms the reticle instead');
  // The DOM copy stays for assistive tech, but is not painted.
  assert.ok(/\.meter\.edge\s*\{[\s\S]{0,200}clip:\s*rect\(0, 0, 0, 0\)/.test(css), 'the corner cut meter is visually retired');
  assert.ok(/id="edge"/.test(html), 'the live count stays in the DOM for the headless checks');
});

// ── 3. THE HUD'S WORDS ───────────────────────────────────────────────────
test('CHUNK 1: raw telemetry and the second vocabulary for pace are gone', () => {
  assert.ok(!/px\/s`/.test(waveUi.replace(/paceSpeed\.textContent=`\$\{display\} px\/s`/, '')), 'px/s is kept in the DOM only');
  assert.ok(/pace-speed\s*\{[\s\S]{0,200}visibility:\s*hidden/.test(css), 'the px/s readout is never painted');
  assert.ok(/pace-target-label\s*\{[\s\S]{0,80}display:\s*none/.test(css), 'TARGET is never painted');
  // Comments may name the retired words (that is how a reader learns what was
  // removed); the CODE may not contain them.
  const waveCode = waveUi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/HOLD PACE/.test(waveCode), 'the pace bar no longer says HOLD PACE');
  assert.ok(!/PACE READY/.test(waveCode), 'nor PACE READY');
  assert.ok(/rushReadout/.test(waveUi), 'one RUSH readout drives the bar');
});

test('CHUNK 1: RUSH is one label with four honest states', () => {
  assert.equal(rushReadout({ progress: 0.4 }).label, 'RUSH');
  assert.equal(rushReadout({ progress: 1 }, { paceReady: true }).label, 'RUSH READY');
  assert.equal(rushReadout({ progress: 1 }, { surgeTicks: 90 }).label, 'RUSH 1.5s');
  assert.equal(rushReadout({ progress: 1 }, { sonic: true }).label, 'RUSH HELD');
  assert.equal(rushReadout({ progress: 0.4 }, null, 20).label, 'OVERDRIVE');
  assert.equal(rushReadout({ progress: 0.4 }).fill, 0.4, 'the bar is the progress');
  assert.equal(rushReadout({ progress: 0.4 }, { paceReady: true }).fill, 1, 'a ready bar is full');
});

test('CHUNK 1: the world meter reads as the next boss, not as world mood jargon', () => {
  const low = bossChargeReadout(0, 0), mid = bossChargeReadout(63, 2);
  assert.equal(low.label, 'BOSS CHARGE');
  assert.equal(mid.pct, '63%');
  assert.equal(mid.tier, 'NEXT BOSS · UNSTABLE');
  assert.match(mid.speech, /Boss charge 63 percent/);
  assert.equal(RANK_WORDS.length, 4);
  for (const mount of ['title-fracture', 'fracture-hud', 'result-fracture']) {
    const at = html.indexOf(`id="${mount}"`);
    assert.ok(at > 0, `${mount} still exists`);
    const nearby = html.slice(at, at + 700);
    assert.ok(!/SHATTER EVENT|FAULT LINES|CRITICAL COLLAPSE|DIMENSION FRACTURE/.test(nearby), `${mount} speaks plain English`);
  }
});

// ── 4. TITLE ─────────────────────────────────────────────────────────────
test('CHUNK 1: the title has one practice door and no stray score sticker', () => {
  const nav = html.slice(html.indexOf('id="main-nav"'), html.indexOf('</nav>', html.indexOf('id="main-nav"')));
  assert.equal((nav.match(/class="choice/g) || []).length, 3, 'the authored nav is three doors: run, practice, options');
  assert.ok(/Practice &amp; help/.test(nav), 'the practice door is named for what it does');
  assert.ok(!/Field manual/.test(nav), 'the duplicate manual door is renamed, not repeated');
  assert.ok(!html.includes('fillText("+300"'), 'the stray +300 sticker is removed from the title key art');
  assert.ok(engine.includes('CHUNK 1: the stray "+300"'), 'and the removal is documented where it happened');
  // CHUNK 8: the deed book appends DEEDS beside the practice door
  // instead of a second Learn. (It said 'Quests', with a graduation cap, which
  // was the identity problem this chunk fixed.)
  const quest = readFileSync(new URL('../src/quest-ui.js', import.meta.url), 'utf8');
  assert.ok(/'choice quiet','Deeds'/.test(quest), 'the deed book has its own door');
  assert.ok(!/el\('button','choice quiet','Learn'\)/.test(quest), 'LEARN is not a synonym for the manual any more');
  assert.ok(!/'choice quiet','Quests'/.test(quest), 'the word Quests is gone from the menu');
  assert.ok(!/'choice quiet','Contracts'/.test(quest), 'and the contract-era label is gone too');
});

// ── 5. DAMAGE ────────────────────────────────────────────────────────────
test('CHUNK 1: a hit points at the exact attacker and cannot double-hit inside 1.2s', () => {
  const player = { x: 100, y: 100 };
  const dir = hitDirection(player, { x: 40, y: 20 });
  assert.ok(dir && dir.distance > 60, 'a real distance');
  assert.equal(Math.round((dir.angle * 180) / Math.PI), -127, 'the bearing points AT the attacker');
  assert.equal(hitDirection(player, null), null, 'no source means no invented line');
  assert.equal(hitDirection(player, { x: 100, y: 100 }), null, 'a zero-distance source has no bearing');

  assert.ok(SAFE_BLINK_TICKS >= 72, 'the safety window is at least 1.2s at 60 Hz');
  assert.ok(HIT_RIM_TICKS > 0);

  const at = damageFeedback({ age: 0, player, source: { x: 40, y: 20 }, cause: 'Pulse' });
  assert.equal(at.live, true);
  assert.equal(at.freeze, true, 'the impact frame is a hard freeze');
  assert.equal(at.label, 'RING HIT', 'the ring is named, not "Pulse wave"');
  assert.ok(at.rim > 0 && at.rim <= 0.25, 'the rim flash is capped at 25% by design');
  assert.equal(damageFeedback({ age: 2 }).timeScale, 0.15, 'the slow-mo opens at a fifteenth of real time');
  assert.equal(damageFeedback({ age: 1 }).timeScale, 1, 'and the freeze frame is not slowed');
  assert.equal(damageFeedback({ age: 8 }).timeScale < 1, true, 'and it ramps, it does not cut');
  assert.equal(damageFeedback({ age: 99, player }).live, false, 'nothing lingers');
  assert.equal(damageFeedback({ age: 99, player }).rim, 0);

  for (const [cause, word] of [['Fang', 'FANG'], ['Pulse', 'RING'], ['monolith', 'LANDLORD'], ['Prism', 'SHARD']])   assert.equal(dmgLabel(cause), word);
  assert.equal(shortDamageLine('LANDLORD HEAVY BODY HIT'), 'LANDLORD HEAVY BODY HIT', 'exactly four words is allowed');
  assert.equal(shortDamageLine('LANDLORD HEAVY BODY SLAM HIT'), 'LANDLORD HEAVY BODY SLAM', 'the corner line never becomes a sentence');
  assert.equal(DAMAGE_LINE_MAX_WORDS, 4);
});

test('CHUNK 1: the damage reaction is painted in screen space with a real rim flash', () => {
  assert.ok(/function drawHitFeedback/.test(engine), 'the painter exists');
  assert.ok(/drawHitFeedback\(/.test(engine), 'and is called from draw()');
  assert.ok(/setAimFeedback/.test(engine) && /setAimFeedback\?\./.test(main), 'the shell pushes it every frame');
  assert.ok(/id="damage-rim"/.test(html) && /#damage-rim\.on/.test(css), 'the rim is a real element');
  assert.ok(/HIT_RIM_TICKS/.test(main), 'and it expires on the game clock, not a stray timer');
});

// ── 6. EDGE TICKERS, NOT CENTRE MODALS ───────────────────────────────────
test('CHUNK 1: story callouts and the starter hint hang off the bottom edge', () => {
  const chip = css.match(/\.story-chip\s*\{[^}]*\}/);
  assert.ok(chip, '.story-chip needs a rule');
  assert.ok(/top:\s*auto/.test(chip[0]) && /bottom:/.test(chip[0]), 'the chip is a bottom ticker');
  assert.ok(!/top:\s*60%/.test(chip[0]), 'it is no longer at 60% height, over live combat');
  const size = +(chip[0].match(/font:\s*800 (\d+)px/) || [])[1];
  assert.ok(size >= 13, `the chip must stay legible in an embed (got ${size}px)`);

  assert.ok(/id="start-hint"/.test(html), 'the four-word starter hint exists');
  assert.ok(/AIM &amp; CLICK TO CUT/.test(html), 'and says what to do');
  assert.equal(hintVisible(0, 0), true);
  assert.equal(hintVisible(1, 0), false, 'the first kill retires it');
  assert.equal(hintVisible(0, 999), false, 'and it cannot outstay its welcome');
});

// ── 7. THE AIM RING ──────────────────────────────────────────────────────
test('CHUNK 1: the aiming ring replaces the OS cursor and refuses in red', () => {
  assert.equal(reticleFor({ pointer: null }), null, 'no pointer, no ring');
  const idle = reticleFor({ pointer: { x: 10, y: 10 }, cuts: 2, tick: 0 });
  assert.equal(Math.round(idle.r), RETICLE.radius);
  assert.equal(idle.warn, false);
  const loaded = reticleFor({ pointer: { x: 10, y: 10 }, cuts: 2, charging: true, power: 1 });
  assert.ok(loaded.r < idle.r, 'a pull pinches the ring');
  const spent = reticleFor({ pointer: { x: 10, y: 10 }, cuts: 0 });
  assert.equal(spent.warn, true, 'no cuts arms the red warning');
  const refused = reticleFor({ pointer: { x: 10, y: 10 }, cuts: 0, refuseAge: 2, motion: true });
  const still = reticleFor({ pointer: { x: 10, y: 10 }, cuts: 0, refuseAge: 2, motion: false });
  assert.notEqual(refused.x, 10, 'a refused click shakes');
  assert.equal(still.x, 10, 'reduced motion keeps the state, drops the shake');
  assert.equal(reticleFor({ pointer: { x: 10, y: 10 }, refuseAge: 40 }).refused, false, 'the refusal expires');

  assert.ok(/id="reticle"/.test(html), 'the ring is a real element');
  assert.ok(/#game\[data-screen='run'\] #arena\s*\{[^}]*cursor:\s*none/.test(css), 'the OS cursor is hidden over the arena');
  assert.ok(/@media \(pointer: coarse\)[\s\S]{0,120}#reticle\s*\{\s*display:\s*none/.test(css), 'touch never gets a ring');
});

// ── 8. THE SHELL WIRES IT ALL ────────────────────────────────────────────
test('CHUNK 1: the shell paints the ring, the hull and the reaction from live state', () => {
  assert.ok(/function paintReticle/.test(main), 'the ring is painted per frame');
  assert.ok(/onPointerMove/.test(main), 'pointer moves reach the shell');
  assert.ok(/hitSource = damageSource\(run\?\.state, d\)/.test(main), 'the hit line names a real body');
  assert.ok(/healthSegments\(meters\.hp, s\.hpMax/.test(main), 'the bar is driven by the meter readout');
  assert.ok(!/HEALTH −1 \//.test(main), 'the old paragraph call-out is gone');
  assert.ok(/\$\('reticle'\)\.hidden = true/.test(main), 'leaving the field hides the ring');
});
