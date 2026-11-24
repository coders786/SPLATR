import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
import { fileURLToPath } from 'node:url';
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({
  headless: true,
  executablePath: await chromium.executablePath(),
  args: chromium.args,
});
try {
  const page = await browser.newPage();
  const errors = [], logs = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  await page.setViewport({ width: 900, height: 730 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
  const boot = await page.evaluate(() => ({
    startBtn: !!document.getElementById('start-btn'),
    titleHidden: document.getElementById('title-screen')?.hidden,
    boot: !!document.getElementById('boot'),
    gameDataset: { ...document.getElementById('game')?.dataset },
  }));
  console.log('boot:', JSON.stringify(boot));
  await page.click('#start-btn');
  await new Promise(r => setTimeout(r, 2500));
  const after = await page.evaluate(() => ({
    hudPlace: document.getElementById('hud')?.dataset?.place,
    hudHidden: document.getElementById('hud')?.hidden,
    learning: document.getElementById('game')?.dataset?.learning,
    scene: document.getElementById('arena')?.dataset?.scene,
    announcement: document.getElementById('announcement')?.textContent,
    callout: document.getElementById('callout')?.textContent,
    gameDataset: { ...document.getElementById('game')?.dataset },
  }));
  console.log('after start:', JSON.stringify(after));
  console.log('errors:', JSON.stringify(errors.slice(0, 5)));
  console.log('logs:', JSON.stringify(logs.slice(0, 10)));
} finally { await browser.close(); }
