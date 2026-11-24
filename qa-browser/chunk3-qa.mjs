/* Live Chromium QA for CHUNK 3 — the SHATTER EVENT + SHATTERED arena.
 * Targets the preview server on :5173. Verifies:
 *   A. the meter at 100% fires the tear on the field (no prompt):
 *      meter spends to 0, arenaMode SHATTERED, hull +1, dash refilled,
 *      flash clock arms, shell persists riot.fracturePct = 0,
 *      HUD leaves SHATTER EVENT READY behind;
 *   B. the singularity flash + shard sky render without page errors;
 *   C. Reduce Motion / motion OFF boots and tears cleanly;
 *   D. a border bank in SHATTERED feeds the kinetic charge (>= x2);
 *   E. RUN ENDED debrief shows the spent meter, not a resurrected 100.
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

async function boot(pct, motion = true) {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(([p, m]) => {
    localStorage.clear();
    localStorage.setItem('riot.started', '1');
    localStorage.setItem('riot.fracturePct', String(p));
    localStorage.setItem('riot.motion', m ? '1' : '0');
    localStorage.setItem('riot.debug', '1');
  }, [pct, motion]);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 250));
}
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
async function toField() {
  await page.click('#start-btn');
  await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));
  // The field opens on the first launch: one ordinary drag starts play.
  await fastDrag(640, 470, 430, 645);
  await page.waitForFunction(() => window.__riot?.state?.phase === 'playing', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 400));
}
const snap = () => page.evaluate(() => {
  const s = window.__riot?.state;
  return s ? {
    phase: s.phase,
    arenaMode: s.arenaMode,
    shatterDone: s.shatterDone,
    pct: s.fracture?.pct,
    hp: s.hp,
    edge: s.edge,
    kineticStage: s.kineticStage,
    shatter: s.shatter,
    stored: localStorage.getItem('riot.fracturePct'),
    hud: document.getElementById('fracture-hud')?.textContent?.replace(/\s+/g, ' ').trim(),
  } : { error: 'no __riot' };
});
// ── Pass 1: motion ON, fracture at the brink ─────────────────────────────
await boot(100, true);
await toField();
console.log('P1 field before:', JSON.stringify(await snap()));
// The bar is already full; the tear fires on the next field tick by itself.
await new Promise(r => setTimeout(r, 350));
const atTear = await snap();
console.log('P1 at tear:    ', JSON.stringify(atTear));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot3-flash.png' });
await new Promise(r => setTimeout(r, 1600));
const after = await snap();
console.log('P1 after 1.6s: ', JSON.stringify(after));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot3-shattered.png' });
// D. a hard drag toward the side wall — the border bank should feed the charge.
for (let i = 0; i < 4 && (await snap()).kineticStage < 2; i++) {
  await fastDrag(640, 470, 210, 640); // pull down-left → launch up-right... vary side
  await new Promise(r => setTimeout(r, 1300));
  console.log('P1 drag', i + 1, JSON.stringify(await snap()));
}
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot3-charged.png' });
// E. end the run → the debrief shows the spent meter, stored 0.
await page.keyboard.press('Escape');
await page.waitForSelector('#end-btn', { visible: true, timeout: 8000 });
await page.click('#end-btn');
await page.waitForFunction(() => !document.getElementById('result-page')?.hidden, { timeout: 8000 });
await new Promise(r => setTimeout(r, 500));
console.log('P1 result:     ', JSON.stringify(await page.evaluate(() => ({
  result: document.getElementById('result-fracture')?.textContent?.replace(/\s+/g, ' ').trim(),
  stored: localStorage.getItem('riot.fracturePct'),
}))));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot3-result.png' });

// ── Pass 2: Reduce Motion — the tear still fires, nothing pulses ──────────
await boot(100, false);
await toField();
await new Promise(r => setTimeout(r, 350));
console.log('P2 motion-off at tear:', JSON.stringify(await snap()));
await new Promise(r => setTimeout(r, 1200));
console.log('P2 motion-off after:  ', JSON.stringify(await snap()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot3-shattered-reduced.png' });

// ── Pass 3: stored 0 — nothing tears ──────────────────────────────────────
await boot(0, true);
await toField();
await new Promise(r => setTimeout(r, 600));
console.log('P3 fresh run:  ', JSON.stringify(await snap()));

console.log('errors:', JSON.stringify(errors));
await browser.close();
process.exit(errors.length ? 1 : 0);
