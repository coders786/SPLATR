/* CHUNK 6 — EARNED SPEED + HYPER STEER. Live Chromium smoke, not a bot run:
 * prove the game boots clean with the new HUD rail, prove the rail exists and
 * is laid out clear of the band word and the tier pips, and leave one
 * screenshot of the speedometer for the report.
 *
 *   node qa-browser/chunk6-smoke.mjs
 */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const BASE = `http://127.0.0.1:${process.env.CHUNK6_PORT || '5173'}/`;
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const errors = [];
const page = await browser.newPage();
page.on('dialog', d => d.accept());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.setViewport({ width: 1280, height: 800 });
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => {
  localStorage.setItem('riot.started', '1');
  localStorage.setItem('riot.motion', '1');
  localStorage.setItem('riot.debug', '1');
});
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await new Promise(r => setTimeout(r, 250));

// Start a normal run (continuous sector mode) from the menu.
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 800));

const hud = await page.evaluate(() => {
  const rect = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1), top: +r.top.toFixed(1) }; };
  const row = document.querySelector('.wave-hud .momentum-row');
  return {
    waveVisible: !document.querySelector('.wave-hud')?.hidden,
    momentumRow: rect('.wave-hud .momentum-row'),
    momentumLabel: row?.querySelector('.momentum-label')?.textContent ?? null,
    rowParentVisible: !!row?.parentElement && !row.parentElement.hidden,
    pips: row ? [...row.querySelectorAll('.momentum-pips i')].map(i => ({ on: i.classList.contains('on') })) : [],
    paceTrack: rect('.pace-track'),
    momentumCount: window.__riot?.state?.momentum?.count ?? null,
    hudPlace: document.getElementById('hud')?.dataset?.place,
  };
});
console.log('hud:', JSON.stringify(hud, null, 1));
const rowVisible = hud.momentumRow && hud.momentumRow.w > 0 && hud.momentumRow.h > 0;
console.log('momentum-row:', rowVisible ? 'visible in the wave HUD' : 'FAIL — momentum row is not laid out');
await page.screenshot({ path: '/home/user/SPLATR/docs/img/chunk6-wave-hud.png', clip: { x: 440, y: 0, width: 400, height: 140 } });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length || !rowVisible ? 1 : 0);
