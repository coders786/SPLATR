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
const snap = () => page.evaluate(() => { const r = window.__riot; return { phase: r.state.phase, edge: r.state.edge, recharge: +r.state.recharge.toFixed(1), held: r.state.held, stop: r.state.stop, wave: r.state.wave?.phase, grounded: r.world.grounded, kmh: Number(document.getElementById('speedo-value')?.textContent || 0), hidden: document.hidden, focus: +(r.state.focus ?? -1).toFixed?.(2) ?? r.state.focus, depleted: r.state.depleted }; });
const drag = async (n) => {
  console.log(`── drag ${n}`);
  console.log('before press   ', JSON.stringify(await snap()));
  await page.mouse.move(640, 470); await page.mouse.down();
  for (let i = 1; i <= 4; i++) { await page.mouse.move(640 - 210 * i / 4, 470 + 175 * i / 4); await new Promise(r => setTimeout(r, 12)); }
  console.log('during hold    ', JSON.stringify(await snap()));
  await page.mouse.up();
  console.log('release +0ms   ', JSON.stringify(await snap()));
  for (const ms of [80, 200, 500, 1000]) { await new Promise(r => setTimeout(r, ms === 80 ? 80 : ms - [80, 200, 500, 1000][[80, 200, 500, 1000].indexOf(ms) - 1])); console.log(`release +${ms}ms`.padEnd(16), JSON.stringify(await snap())); }
};
await drag(1);
await drag(2);
await drag(3);
console.log('errors:', JSON.stringify(errors));
await browser.close();
