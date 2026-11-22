import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// Packaging regression guard. It intentionally inspects the actual output,
// not just the inline-limit setting. Run after either supported build mode.
const dir = new URL('../dist/', import.meta.url);
assert.deepEqual(
  await readdir(dir),
  ['index.html'],
  'The distribution must be exactly one HTML file',
);
const html = await readFile(new URL('index.html', dir), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script>/gi)];
assert.ok(
  scripts.some((s) => /type="module"/.test(s[1])),
  'No bundled game module',
);
for (const [, attrs] of scripts) assert.ok(!/\bsrc\s*=/.test(attrs), 'Non-inline script found');
for (const [, css] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  for (const [, url] of css.matchAll(/url\(["']?([^\s)"']+)/gi))
    assert.ok(url.startsWith('data:'), `Non-inline CSS asset: ${url}`);
}
// Arena and title art are geometry. A hidden/unused raster plate would still bloat the
// standalone download, so protect this property of the production artifact.
assert.doesNotMatch(
  html,
  /data:image\/(?:webp|png|jpe?g|gif|avif);base64,/i,
  'Unexpected raster payload',
);
for (const [, url] of html.matchAll(/<(?:img|source|link)\b[^>]*?\b(?:src|href)="([^"]+)"/gi))
  assert.ok(url.startsWith('data:') || url.startsWith('#'), `Non-inline asset: ${url}`);
assert.equal(
  (html.match(/data:font\/woff2;base64,/g) || []).length,
  4,
  'Expected all four embedded Latin font subsets',
);
const notices =
  html.match(/<script[^>]*\bid="third-party-notices"[^>]*>([\s\S]*?)<\/script>/i)?.[1] || '';
for (const credit of [
  'Liam Brummitt',
  'Barlow Project Authors',
  'Space Grotesk Project Authors',
  'Space Mono Project Authors',
  'SIL Open Font License',
])
  assert.ok(notices.includes(credit), `Missing bundled notice: ${credit}`);
console.log(
  `Verified dist/index.html: one file, vector art, embedded fonts/scripts, ${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB.`,
);
