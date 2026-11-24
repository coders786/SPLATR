/* CHUNK 6 — prove the earned pips render lit, not just present. DEBUG-only
 * inspection handle; no game rules are touched. */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const BASE = 'http://127.0.0.1:5173/';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.setViewport({ width: 1280, height: 800 });
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.setItem('riot.started','1'); localStorage.setItem('riot.debug','1'); });
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 800));
await page.evaluate(() => { const s = window.__riot?.state?.momentum; if (s) { s.count = 2; s.idle = 0; s.total = 2; } });
await new Promise(r => setTimeout(r, 400));
const lit = await page.evaluate(() => [...document.querySelectorAll('.wave-hud .momentum-pips i')].map(i => i.classList.contains('on')));
console.log('pips after 2 earned fills:', JSON.stringify(lit));
await page.screenshot({ path: '/home/user/SPLATR/docs/img/chunk6-momentum-lit.png', clip: { x: 500, y: 30, width: 280, height: 80 } });
if (!(lit[0] && lit[1] && !lit[2])) { console.log('FAIL — lit state did not render'); process.exit(1); }
console.log('lit-state: OK');
await browser.close();
