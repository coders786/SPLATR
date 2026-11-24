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
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.fracturePct', '100'); localStorage.setItem('riot.motion', '1'); localStorage.setItem('riot.debug', '1'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 700));
  console.log('t+' + (i + 1) * 0.7 + 's', JSON.stringify(await page.evaluate(() => ({
    screen: document.getElementById('game')?.dataset?.screen,
    phase: window.__riot?.state?.phase,
    opening: window.__riot?.state?.opening ? { racks: window.__riot.state.opening.racks?.length, finishing: window.__riot.state.opening.finishing ?? null, done: window.__riot.state.opening.done ?? null } : null,
    skipVisible: (() => { const el = document.getElementById('skip-room'); return el ? !el.hidden && getComputedStyle(el).visibility !== 'hidden' : 'missing'; })(),
    arenaMode: window.__riot?.state?.arenaMode,
    pct: window.__riot?.state?.fracture?.pct,
  }))));
}
console.log('errors:', JSON.stringify(errors));
await browser.close();
