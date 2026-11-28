import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('boot screen is self-contained, accessible and does not invent a percentage',()=>{
 const boot=html.slice(html.indexOf('<aside id="boot"'),html.indexOf('<svg class="defs"'));
 assert.match(boot,/id="boot-status" role="status" aria-live="polite"/);
 assert.match(boot,/class="boot-track" aria-hidden="true"/);
 assert.match(boot,/<noscript>/);assert.match(boot,/id="boot-help" hidden/);
 assert.match(boot,/12000/);assert.doesNotMatch(boot,/\d+% (?:LOADED|COMPLETE)/i);
 assert.match(html,/#game\[inert\]/);assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(main,/game\.removeAttribute\('inert'\)/);assert.match(main,/\$\('boot'\)\.remove\(\)/);
});
test('post processing mode and intensity remain explicit persisted options',()=>{
 assert.match(html,/id="postfx-opt"/);assert.match(html,/id="postfx-strength-opt"/);
 assert.match(main,/storage\.set\('postfxStrength'/);assert.match(main,/setPostFXIntensity/);
 assert.match(main,/postfx-strength-opt'\)\.disabled=opts\.postfx==='off'/);
});
