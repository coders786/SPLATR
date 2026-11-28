import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import {
  HYBRIDS, SPARKS, activeHybrid, activeSparks, hybridHint,
  hybridMatches, mutationMatches, mutationTitle, drawHybridAura,
} from '../src/hybrids.js';
import {resolveArtDirection} from '../src/art/splatr-art-engine.js';
import {ITEMS, SLOTS, DEFAULT_EQUIPMENT, equipmentRules, loadEquipment} from '../src/equipment.js';
import {swordProfile} from '../src/swords.js';
import {isCosmeticSlot} from '../src/cosmetic-slots.js';

// Captured before the shared-family change, not generated from current swordProfile.
const baseline = JSON.parse(readFileSync(new URL('./support/sword-profile-baseline.json', import.meta.url), 'utf8'));
const recipe = id => HYBRIDS.find(r => r.id === id);
const combine = (...ids) => Object.assign({}, ...ids.map(id => recipe(id).parts));

// Independent specification of the pre-existing functional priority. Strictly
// greater specificity wins; ties keep catalogue order, not object/equip order.
function expectedRecipe(eq) {
  let selected = null;
  for (const r of HYBRIDS) {
    if (!Object.entries(r.parts).every(([slot, id]) => eq[slot] === id)) continue;
    if (!selected || Object.keys(r.parts).length > Object.keys(selected.parts).length) selected = r;
  }
  return selected;
}
function expectedGearRecipe(eq) {
 let selected=null, specificity=0;
 for(const r of HYBRIDS){
  const parts=Object.entries(r.parts).filter(([slot])=>!isCosmeticSlot(slot));
  if(parts.length>=2 && parts.every(([slot,id])=>eq[slot]===id) && parts.length>specificity){selected=r;specificity=parts.length;}
 }
 return selected;
}
function assertSelection(eq) {
  const expected = expectedRecipe(eq);
  const selected = activeHybrid(eq);
  assert.equal(selected?.id ?? null, expected?.id ?? null);
  assert.deepEqual(swordProfile(eq), baseline[expectedGearRecipe(eq)?.id ?? 'standard']);
  assert.equal(resolveArtDirection(eq).family, expected?.id ?? null);
  if (expected) {
    assert.equal(hybridHint(eq), expected.title);
    assert.equal(mutationTitle(eq), expected.title);
    // Retain the legacy public match descriptor, not just the selected ID.
    assert.deepEqual(selected, hybridMatches(eq).find(r => r.id === expected.id));
  }
}

for (const [a, b, winner] of [
  ['phantom', 'arcade', 'arcade'],
  ['phantom', 'wraith', 'wraith'],
  ['reaper', 'arcade', 'arcade'],
  ['briar', 'razoredge', 'razoredge'],
]) {
  test(`overlap ${a} + ${b}: visual family selects ${winner}; combat follows gear only`, () => {
    const eq = Object.freeze(combine(a, b));
    assert.equal(activeHybrid(eq)?.id, winner);
    assertSelection(eq);
    assertSelection(Object.freeze(Object.fromEntries(Object.entries(eq).reverse())));
    const completed = mutationMatches(eq).filter(r => r.layer === 'APEX' && r.complete).map(r => r.id);
    assert.ok(completed.includes(a));
    assert.ok(completed.includes(b), 'nonselected complete recipe remains a discovery');
  });
}

test('all visual recipes preserve art selection and gear-only sword tuning', () => {
  let checked = 0;
  function visit(start, eq) {
    assertSelection(Object.freeze(eq));
    checked++;
    for (let i = start; i < HYBRIDS.length; i++) {
      const r = HYBRIDS[i];
      if (Object.entries(r.parts).some(([slot, id]) => eq[slot] && eq[slot] !== id)) continue;
      visit(i + 1, {...eq, ...r.parts});
    }
  }
  visit(0, {});
  // Current catalogue has 17 single recipes and 7 compatible pairs, no triples.
  assert.equal(checked, 25);
  assert.equal(Object.keys(baseline).length, 18);
});

test('equal specificity keeps catalogue priority independent of equip/object order', () => {
  for (const [a, b, winner] of [['wyrm', 'eater', 'wyrm'], ['eater', 'sun', 'eater']]) {
    for (const eq of [combine(a, b), combine(b, a)]) {
      assert.equal(activeHybrid(eq)?.id, winner);
      assertSelection(eq);
    }
  }
});

test('all 2,402 cross-slot pairs preserve independent art and gear selection without mutation', () => {
  let checked = 0;
  for (let i = 0; i < SLOTS.length; i++) for (let j = i + 1; j < SLOTS.length; j++) {
    for (const a of ITEMS.filter(r => r.slot === SLOTS[i])) for (const b of ITEMS.filter(r => r.slot === SLOTS[j])) {
      const eq = Object.freeze({...DEFAULT_EQUIPMENT, [a.slot]: a.id, [b.slot]: b.id});
      const before = JSON.stringify(eq), rules = equipmentRules(eq);
      assertSelection(eq);
      assert.equal(JSON.stringify(eq), before);
      assert.deepEqual(equipmentRules(eq), rules);
      checked++;
    }
  }
  assert.equal(checked, 2402);
});

test('breaking a winning recipe falls back to the remaining complete recipe, without stale family state', () => {
  const eq = combine('phantom', 'arcade');
  assert.equal(activeHybrid(eq).id, 'arcade');
  const swapped = {...eq, core: 'standard'};
  assert.equal(activeHybrid(swapped).id, 'phantom');
  assertSelection(swapped);
  assert.equal(activeHybrid({...swapped, body: 'paper'}), null);
  assertSelection({...swapped, body: 'paper'});
  assert.equal(activeHybrid(eq).id, 'arcade', 'other previews do not mutate the original selection');
});

test('Sparks and partial recipes retain discovery/hint behavior without gaining a sword', () => {
  assert.equal(activeHybrid(), null);
  assert.equal(hybridHint({}), 'HYBRID / MIX A RECIPE');
  for (const spark of SPARKS) {
    const eq = Object.freeze({...spark.parts});
    assert.equal(activeHybrid(eq), null);
    assert.deepEqual(swordProfile(eq), baseline[expectedGearRecipe(eq)?.id ?? 'standard']);
    assert.ok(activeSparks(eq).some(r => r.id === spark.id));
    assert.ok(mutationTitle(eq).includes(spark.title));
  }
  const partial = {...recipe('arcade').parts};
  delete partial.world;
  assert.equal(hybridHint(partial), '??? / 3 OF 4 PARTS');
});

test('loading owned equipment, discoveries and presets does not prune nonselected completed recipes', () => {
  const eq = {...DEFAULT_EQUIPMENT, ...combine('phantom', 'arcade')};
  const discovered = mutationMatches(eq).filter(r => r.complete).map(r => r.id);
  const raw = JSON.stringify({version: 1, owned: ITEMS.map(r => r.id), discovered, equipped: eq, presets: [eq, DEFAULT_EQUIPMENT, null]});
  const state = loadEquipment(raw), before = JSON.stringify(state);
  assertSelection(state.equipped);
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(state.discovered, discovered);
  assert.deepEqual(state.equipped, eq);
  assert.deepEqual(state.presets, [eq, DEFAULT_EQUIPMENT, null]);
  assert.deepEqual(loadEquipment(JSON.stringify(state)), state);
});

test('overlapping-family art is deterministic and preserves frozen specs and Canvas state at every detail tier', () => {
  for (const ids of [['phantom', 'arcade'], ['phantom', 'wraith'], ['reaper', 'arcade'], ['briar', 'razoredge']]) {
    const eq = Object.freeze(combine(...ids)), before = JSON.stringify(eq);
    for (const artRadius of [12, 23, 48, 60]) {
      const render = () => {
        const canvas = createCanvas(240, 240), c = canvas.getContext('2d');
        c.translate(120, 120); c.scale(artRadius, artRadius); c.globalAlpha = .75;
        const pose = Object.freeze({artRadius, motion: false}), transform = c.getTransform();
        drawHybridAura(c, eq, 18, pose);
        assert.deepEqual(c.getTransform(), transform);
        assert.equal(c.globalAlpha, .75);
        assert.deepEqual(c.getLineDash(), []);
        return canvas.toBuffer('image/png');
      };
      assert.deepEqual(render(), render());
    }
    assert.equal(JSON.stringify(eq), before);
  }
});
