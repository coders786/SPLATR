/* Wall-rally momentum probe: ten fast launches at the same side of the arena,
 * tracking the speedo to see bank-rally speed carried through re-steers. */
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
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '0'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
const drag = async () => {
  await page.mouse.move(640, 460); await page.mouse.down();
  for (let i = 1; i <= 4; i++) { await page.mouse.move(640 - 190 * i / 4, 460 + 150 * i / 4); await new Promise(r => setTimeout(r, 12)); }
  await page.mouse.up();
};
let peak = 0;
for (let i = 0; i < 10; i++) {
  await drag();
  for (let k = 0; k < 12; k++) {
    await new Promise(r => setTimeout(r, 80));
    const v = await page.evaluate(() => Number(document.getElementById('speedo-value')?.textContent || 0));
    peak = Math.max(peak, v);
  }
  const band = await page.evaluate(() => document.getElementById('speedo-band')?.textContent);
  console.log(`launch ${i + 1}: peak-so-far=${peak} band=${band}`);
}
console.log('peak km/h over 10 launches:', peak);
console.log('errors:', JSON.stringify(errors));
await browser.close();
if (errors.length) process.exit(1);
console.log('QA: PASS');
