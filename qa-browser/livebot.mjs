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
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('riot.started', '1');
  localStorage.setItem('riot.fracturePct', '24.4');
  localStorage.setItem('riot.motion', '0');
});
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
const before = await page.evaluate(() => Number(localStorage.getItem('riot.fracturePct')));
console.log('fracture at start:', before);
const keys = ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
for (let i = 0; i < 36; i++) {
  const key = keys[i % keys.length];
  await page.keyboard.down(key);
  await new Promise(r => setTimeout(r, 90));
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 120));
  await page.keyboard.up(key);
  await new Promise(r => setTimeout(r, 1050));
  const pct = await page.evaluate(() => Number(localStorage.getItem('riot.fracturePct')));
  const tierText = await page.evaluate(() => document.getElementById('fracture-hud')?.querySelector('.fracture-tier')?.textContent);
  const callout = await page.evaluate(() => { const c = document.getElementById('callout'); return c?.hidden ? '' : c?.textContent; });
  if (i % 6 === 5 || callout) console.log(`after ${i + 1} launches: pct=${pct} tier=${tierText} callout=${JSON.stringify(callout)}`);
}
const after = await page.evaluate(() => ({
  stored: Number(localStorage.getItem('riot.fracturePct')),
  hud: document.getElementById('fracture-hud')?.textContent?.replace(/\s+/g, ' ').trim(),
}));
console.log('after bot run:', JSON.stringify(after));
console.log(after.stored > before ? 'PASS: live play grew the meter and persisted it' : 'NO GROWTH (bot landed no cuts)');
console.log('errors:', JSON.stringify(errors));
await browser.close();
