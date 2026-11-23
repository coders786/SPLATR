import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS} from '../src/equipment.js';
import {SPARKS, HYBRIDS} from '../src/hybrids.js';
import {swordProfile} from '../src/swords.js';

const audit = readFileSync(new URL('../docs/shop-item-audit.md', import.meta.url), 'utf8');

test('shop audit covers each catalogue item exactly once', () => {
  const headings = [...audit.matchAll(/^### .* \(`([^`]+)`\)$/gm)].map(match => match[1]);
  assert.equal(headings.length, ITEMS.length);
  assert.deepEqual(new Set(headings), new Set(ITEMS.map(item => item.id)));
  for (const item of ITEMS) {
    const section = audit.split(`(\`${item.id}\`)\n`)[1]?.split('\n### ')[0];
    assert.ok(section?.includes('**Appearance and motion:**'), item.id);
    assert.ok(section?.includes('**Works:**'), item.id);
    assert.ok(section?.includes('**Harmony:**'), item.id);
  }
});

test('shop audit covers named fusions and current Apex sword receipts', () => {
  for (const recipe of [...SPARKS, ...HYBRIDS]) {
    const line = audit.split('\n').find(text => text.startsWith(`- **${recipe.title}:**`));
    assert.ok(line, recipe.id);
    for (const [slot, id] of Object.entries(recipe.parts)) {
      const item = ITEMS.find(candidate => candidate.slot === slot && candidate.id === id);
      assert.ok(item && line.includes(`${slot}: ${item.name}`), `${recipe.id}: ${slot}`);
    }
    if (HYBRIDS.includes(recipe)) assert.ok(line.includes(swordProfile(recipe.parts).receipt), recipe.id);
  }
});
