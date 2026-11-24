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
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '0'); localStorage.setItem('riot.debug', '1'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
const snap = () => page.evaluate(() => { const r = window.__riot; const v = r.world.player.velocity; return { edge: r.state.edge, held: r.state.held, vx: +v.x.toFixed(2), vy: +v.y.toFixed(2), speed: +Math.hypot(v.x, v.y).toFixed(2) }; });
const drag = async (n, tx, ty, holdTicks) => {
  console.log(`── drag ${n} (press 640,470 → ${tx},${ty})`);
  console.log('before   ', JSON.stringify(await snap()));
  await page.mouse.move(640, 470); await page.mouse.down();
  for (let i = 1; i <= 4; i++) { await page.mouse.move(640 + (tx - 640) * i / 4, 470 + (ty - 470) * i / 4); await new Promise(r => setTimeout(r, 12)); }
  await new Promise(r => setTimeout(r, holdTicks * 16));
  console.log('during   ', JSON.stringify(await snap()));
  await page.mouse.up();
  console.log('release  ', JSON.stringify(await snap()));
  await new Promise(r => setTimeout(r, 250));
  console.log('+250ms   ', JSON.stringify(await snap()));
};
// Build speed toward a rail, then re-steer upward: the release must keep speed.
await drag(1, 400, 640, 40);            // up-right fast launch
await drag(2, 400, 640, 40);            // rally harder toward the right edge
await drag(3, 400, 640, 600);           // hold the aim a long time (aim-hold must not drain)
await drag(4, 430, 660, 40);            // steer again
console.log('errors:', JSON.stringify(errors));
await browser.close();
