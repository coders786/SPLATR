import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A canvas `font` string is parsed by the CSS font-shorthand grammar, and
// `var()` is ONLY substituted by the cascade for declaration values. A font
// assigned from script is not a declaration, so `var()` never resolves and the
// string is invalid -> the browser ignores the whole set and the previous font
// silently stands. That is how the score popups shipped at a stale 10px.
//
// This is a source-level guard because the failure is invisible in any test
// that stubs the context: the assignment "succeeds" and nothing throws.

const src = readFileSync(new URL('../src/art/splatr-art-engine.js', import.meta.url), 'utf8');

test('no canvas font is assigned with a CSS custom property', () => {
  const assignments = [...src.matchAll(/\.font\s*=\s*([`'"])([\s\S]*?)\1/g)];
  assert.ok(assignments.length > 0, 'expected at least one font assignment');
  for (const [, , value] of assignments) {
    assert.ok(
      !/var\(\s*--/.test(value),
      `canvas font must not use var(): ${JSON.stringify(value)}`,
    );
  }
});

test('popup type is drawn at a real size, not inherited', () => {
  assert.match(
    src,
    /800 \$\{m\.big \? 26 : 17\}px\/1 Riot, Impact, sans-serif/,
    'popup font should name a literal family stack and a size',
  );
});
