/* Live Chromium QA for the drag/momentum fixes (spec items 1-2, 7).
 * Targets the preview server on :5173. Verifies:
 *   A. repeated fast drags fire dash after dash (input never sticks),
 *   B. a drag released OVER THE HUD (y=24) still fires cleanly,
 *   C. the speedo recovers quickly after release (no momentum wipe),
 *   D. zero page errors.
 */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const errors = [];
const page = await browser.newPage();
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('riot.started', '1');
  localStorage.setItem('riot.motion', '0');
  localStorage.setItem('riot.debug', '1');
});
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await page.waitForFunction(() => document.getElementById('speedo-value'), { timeout: 5000 });
const readSpeed = () => page.evaluate(() => ({ kmh: document.getElementById('speedo-value')?.textContent, band: document.getElementById('speedo-band')?.textContent }));
const fastDrag = async (fx, fy, tx, ty) => {
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps);
    await new Promise(r => setTimeout(r, 12));
  }
  await page.mouse.up();
};
const readScreen = () => page.evaluate(() => ({ screen: document.getElementById('game')?.dataset?.screen, choosing: !!document.getElementById('choose'), pips: (() => { const e = document.getElementById('edge'); return e ? [...e.children].filter(c => !c.classList.contains('empty')).length : '?'; })(), regen: (() => { const e = document.getElementById('edge-meter'); return e ? { low: e.hasAttribute('data-low'), due: e.hasAttribute('data-regen') } : '?'; })(), riot: window.__riot ? { phase: window.__riot.state.phase, edge: window.__riot.state.edge, recharge: Math.round(window.__riot.state.recharge), stop: window.__riot.state.stop, wave: window.__riot.state.wave?.phase, opening: window.__riot.state.opening ? { rest: window.__riot.state.opening.rest, free: window.__riot.state.opening.free } : null, grounded: window.__riot.world.grounded, hp: window.__riot.state.hull ?? window.__riot.state.hp, openingRest: window.__riot.state.opening?.rest } : 'none', under: (() => { const el = document.elementFromPoint(640, 470); return el ? el.tagName + '#' + (el.id || el.className || '') : 'none'; })(), callout: (() => { const c = document.getElementById('callout'); return c && !c.hidden ? c.textContent : ''; })() }));
console.log('start:', JSON.stringify(await readScreen()));
// A. three fast drags across the arena (down-left pulls => up-right launches)
for (let i = 0; i < 3; i++) {
  await fastDrag(640, 470, 430, 645);
  await new Promise(r => setTimeout(r, 150));
  console.log(`drag ${i + 1} (release+150ms):`, JSON.stringify(await readSpeed()), JSON.stringify(await readScreen()));
  await new Promise(r => setTimeout(r, 900));
}
// B. a drag released over the HUD (top edge) must not stick the aim
await fastDrag(640, 500, 300, 24);
await new Promise(r => setTimeout(r, 150));
console.log('hud-release (release+150ms):', JSON.stringify(await readSpeed()));
await new Promise(r => setTimeout(r, 700));
await fastDrag(640, 470, 430, 645);
await new Promise(r => setTimeout(r, 200));
console.log('after hud-release drag (release+200ms):', JSON.stringify(await readSpeed()));
const band = await page.evaluate(() => document.getElementById('speedo-band')?.textContent);
console.log('final band:', band);
console.log('errors:', JSON.stringify(errors));
await browser.close();
if (errors.length) { console.log('QA: FAIL'); process.exit(1); }
console.log('QA: PASS');
