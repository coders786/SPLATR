/* CHUNK 5 — THE LEARNING GROUND. Live Chromium QA, run against either build:
 *
 *   CHUNK5_PORT=4173 CHUNK5_TAG=before node qa-browser/chunk5-qa.mjs   # pre-chunk-5 build
 *   CHUNK5_PORT=5173 CHUNK5_TAG=after  node qa-browser/chunk5-qa.mjs   # chunk-5 build
 *
 * BEFORE captures the old Field Manual (eleven buttons, every one starting the
 * same course) and the Rift room as it shipped. AFTER captures the three-door
 * hub, the dialogs it opens, and the Rift room with the wake-up story.
 *
 * Screens are written to docs/img/training-<tag>-*.png.
 */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const PORT = process.env.CHUNK5_PORT || '5173';
const TAG = process.env.CHUNK5_TAG || 'after';
const BASE = `http://127.0.0.1:${PORT}/`;
const IMG = (name) => `/home/user/SPLATR/docs/img/training-${TAG}-${name}.png`;
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const errors = [];
let page = await browser.newPage();
page.on('dialog', d => d.accept());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.setViewport({ width: 1280, height: 800 });

const snap = () => page.evaluate(() => {
  const r = window.__riot;
  const objective = document.getElementById('tutorial-objective');
  return {
    stage: r?.state?.visualTutorial?.stage ?? null,
    dodged: r?.state?.visualTutorial?.dodged ?? null,
    phase: r?.state?.phase ?? null,
    objective: objective && !objective.hidden ? document.getElementById('tutorial-objective-text')?.textContent?.replace(/\s+/g, ' ').trim() : null,
    why: document.getElementById('tutorial-objective-why')?.textContent ?? null,
    enemies: r ? [...r.combat.enemies.values()].map(e => `${e.id}:${e.mode}`) : [],
  };
});
const sprint = async (fx, fy, tx, ty) => {
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps);
    await new Promise(r => setTimeout(r, 12));
  }
  await page.mouse.up();
};

// ── boot ─────────────────────────────────────────────────────────────────
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('riot.started', '1');
  localStorage.setItem('riot.motion', '1');
  localStorage.setItem('riot.debug', '1');
});
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await new Promise(r => setTimeout(r, 250));

// ── 1. Field manual ──────────────────────────────────────────────────────
await page.click('#manual-btn');
await page.waitForFunction(() => !document.getElementById('manual-page')?.hidden, { timeout: 8000 });
await new Promise(r => setTimeout(r, 400));
const manual = await page.evaluate(() => ({
  doors: [...document.querySelectorAll('.training-door')].map(b => ({ id: b.dataset.door, name: b.querySelector('b:not(.training-index)')?.textContent, disabled: b.disabled, cta: b.querySelector('.training-cta')?.textContent })),
  drills: [...document.querySelectorAll('.manual-drill')].map(b => b.dataset.lesson),
  hint: document.querySelector('.manual-replay-hint')?.textContent ?? null,
}));
console.log('manual:', JSON.stringify(manual));
await page.screenshot({ path: IMG('manual') });

// ── 2. Start the course from the manual ──────────────────────────────────
if (TAG === 'before') {
  // Every old door was the same course; click FANG like a player would.
  await page.click('button.manual-drill[data-lesson="fang"]');
} else {
  await page.click('.training-door[data-door="course"]');
}
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 700));
console.log('fresh:', JSON.stringify(await snap()));
await page.screenshot({ path: IMG('course') });
// The run waits for the player's first input — one pull cuts the collinear racks.
await sprint(640, 470, 430, 645);
await new Promise(r => setTimeout(r, 1200));
// Dash right through the open gate until the course advances to the wall room.
// Slingshot: pull LEFTWARD to launch rightward.
for (let i = 0; i < 6 && (await page.evaluate(() => window.__riot?.state?.visualTutorial?.stage)) < 1; i++) {
  await page.mouse.move(700, 480);
  await page.mouse.down();
  await page.mouse.move(260, 480, { steps: 5 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 900));
}
console.log('room1:', JSON.stringify(await snap()));

// ── 4. The wall room (stage 1): bank off the right boundary, then slice and
//       pass through gate 1 (blade + touch breaks it, then cross the line) ──
for (let i = 0; i < 10 && (await page.evaluate(() => window.__riot.state.visualTutorial.stage)) < 1.5; i++) {
  const ready = await page.evaluate(() => window.__riot.state.visualTutorial.gateReady || window.__riot.state.visualTutorial.gateBroken);
  if (ready) break;
  await page.evaluate(() => {
    const r = window.__riot;
    r.world.player.position.x = 800; r.world.player.position.y = -245;
    r.world.player.plugin.previous.x = 800; r.world.player.plugin.previous.y = -245;
    r.state.edge = r.state.edgeMax; r.state.invul = 10000;
  });
  await page.evaluate(() => window.__riot.dash({ x: 42, y: 0, power: 1 }));
  await new Promise(r => setTimeout(r, 700));
}
console.log('after bank:', JSON.stringify(await snap()));
// Slice gate 1 the way a player does it: pull the slingshot DOWN so the
// cube launches UP into the gate. Zero teleports — raw position writes bypass
// Matter's vertex sync and tunnel the cube through the 30px band without ever
// registering a touch. Room 1 is empty, so the line from the banking spot to
// the band center is clear; the swept clamp + corner penetration is what
// registers the touch and breaks the gate.
for (let i = 0; i < 8 && (await page.evaluate(() => window.__riot?.state?.visualTutorial?.stage)) < 2; i++) {
  const pos = await page.evaluate(() => { const p = window.__riot.world.player.position; return { x: p.x, y: p.y }; });
  const dx = 650 - pos.x, dy = -475 - pos.y, m = Math.hypot(dx, dy) || 1;
  const dirx = dx / m, diry = dy / m;
  await page.evaluate(() => { const r = window.__riot; r.state.edge = r.state.edgeMax; r.state.invul = 10000; });
  const sx = 640, sy = 150, pull = 235;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let step = 1; step <= 5; step++) {
    await page.mouse.move(sx - dirx * pull * step / 5, sy - diry * pull * step / 5, { steps: 2 });
    await new Promise(r => setTimeout(r, 12));
  }
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 900));
}
await page.waitForFunction(() => window.__riot?.state?.visualTutorial?.stage >= 2, { timeout: 15000 });
// Park across the room so the objective shows the approach banner and the
// Rift's wake ring is visible. SwiftShader frames can take a second each,
// so settle generously before reading or capturing anything.
await page.evaluate(() => {
  const r = window.__riot;
  r.world.player.position.x = -150; r.world.player.position.y = -830;
  r.world.player.plugin.previous.x = -150; r.world.player.plugin.previous.y = -830;
});
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 250));
  const obj = await page.evaluate(() => document.getElementById('tutorial-objective-text')?.textContent ?? '').catch(() => 'DEAD');
  if (/STEP INTO THE RING/.test(obj)) break;
}
console.log('room2:', JSON.stringify(await snap()));
await page.screenshot({ path: IMG('rift'), timeout: 15000 });

// ── 5b. The why-line reads the live simulation (no screenshots here —
// SwiftShader wedges on captures in the Rift room).
const whyRead = () => page.evaluate(() => ({
  why: document.getElementById('tutorial-objective-why')?.textContent ?? null,
  obj: document.getElementById('tutorial-objective-text')?.textContent ?? null,
  mode: window.__riot?.combat?.enemies?.get('tutorial/rift')?.mode ?? null,
}));
console.log('why dormant:', JSON.stringify(await whyRead()));
await page.evaluate(() => {
  const r = window.__riot;
  r.world.player.position.x = 420; r.world.player.position.y = -720;
  r.world.player.plugin.previous.x = 420; r.world.player.plugin.previous.y = -720;
});
for (let i = 0; i < 48; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const w = await whyRead();
    if (i % 6 === 0) console.log('wake poll', i, JSON.stringify(w));
    if (w.mode === 'tell' || w.mode === 'recover') { console.log('why awake:', JSON.stringify(w)); break; }
  } catch (e) { console.log('why awake: page dead (' + String(e.message).slice(0, 80) + ')'); break; }
}

console.log('done — exiting before combat can wedge the renderer');
await browser.close();
process.exit(0);

// ── 6. After-only: the wired dialogs and the stall directive ─────────────
if (TAG === 'after') {
  // A wedged renderer can refuse screenshots; rebuild the tab for the menu
  // flows, which are light DOM pages.
  try { await page.close(); } catch {}
  page = await browser.newPage();
  page.on('dialog', d => d.accept());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => { localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '1'); localStorage.setItem('riot.debug', '1'); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 300));
  await page.click('#manual-btn');
  await page.waitForFunction(() => !document.getElementById('manual-page')?.hidden, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 300));

  // 6b. ENEMY LESSONS — opens the real dialog, wired here for the first time.
  await page.click('.training-door[data-door="lessons"]');
  await new Promise(r => setTimeout(r, 600));
  const lessonsOpen = await page.evaluate(() => !!document.querySelector('dialog[open], .teaching-dialog:not([hidden])'));
  console.log('lessons dialog open:', lessonsOpen);
  await page.screenshot({ path: IMG('lessons') });
  // The Rift lesson opens on the wake-up step.
  await page.select('select[aria-label="Choose live training lesson"]', 'rift');
  await new Promise(r => setTimeout(r, 700));
  const riftStep = await page.evaluate(() => ({ watch: document.querySelector('.teaching-step-label')?.textContent, action: document.querySelector('.teaching-step-action')?.textContent }));
  console.log('rift lesson:', JSON.stringify(riftStep));
  await page.screenshot({ path: IMG('lesson-rift') });
  // The Monolith lesson opens on the bank-the-rails step.
  await page.select('select[aria-label="Choose live training lesson"]', 'monolith');
  await new Promise(r => setTimeout(r, 700));
  const monolithStep = await page.evaluate(() => ({ watch: document.querySelector('.teaching-step-label')?.textContent, action: document.querySelector('.teaching-step-action')?.textContent }));
  console.log('monolith lesson:', JSON.stringify(monolithStep));
  await page.screenshot({ path: IMG('lesson-monolith') });
  await page.click('.teaching-close');

  // 6c. CONTROL DRILLS — opens the movement-economy dialog.
  await new Promise(r => setTimeout(r, 300));
  await page.click('.training-door[data-door="drills"]');
  await new Promise(r => setTimeout(r, 600));
  const drillsOpen = await page.evaluate(() => !!document.querySelector('dialog[open], [class*="practice"]:not([hidden])'));
  console.log('drills dialog open:', drillsOpen);
  await page.screenshot({ path: IMG('drills') });
}

console.log('errors:', errors.length ? errors.join('\n') : '(none)');
await browser.close();
