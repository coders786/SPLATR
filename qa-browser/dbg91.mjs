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
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('riot.started', '1');
  localStorage.setItem('riot.fracturePct', '91');
  localStorage.setItem('riot.motion', '1');
});
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 500));
const diag = await page.evaluate(() => {
  const btn = document.getElementById('start-btn');
  const r = btn?.getBoundingClientRect();
  const el = document.elementFromPoint(r ? r.x + r.width / 2 : 0, r ? r.y + r.height / 2 : 0);
  return {
    screen: document.getElementById('game')?.dataset?.screen,
    btnRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
    btnVisible: !!(r && r.width && r.height) && getComputedStyle(btn).visibility !== 'hidden',
    atPoint: el ? el.tagName + '#' + (el.id || el.className) : 'none',
    titleHidden: document.getElementById('title-screen')?.hidden,
    panelOpen: document.getElementById('panel')?.open,
    inert: document.getElementById('game')?.hasAttribute('inert'),
  };
});
console.log('diag:', JSON.stringify(diag));
await page.click('#start-btn');
await new Promise(r => setTimeout(r, 1500));
const after = await page.evaluate(() => ({
  screen: document.getElementById('game')?.dataset?.screen,
  hudHidden: document.getElementById('hud')?.hidden,
  titleHidden: document.getElementById('title-screen')?.hidden,
}));
console.log('after click:', JSON.stringify(after));
console.log('errors:', JSON.stringify(errors));
await browser.close();
