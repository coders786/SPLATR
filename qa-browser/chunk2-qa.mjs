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
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(([p, m]) => {
    localStorage.clear();
    localStorage.setItem('riot.started', '1');
    localStorage.setItem('riot.fracturePct', String(p));
    localStorage.setItem('riot.motion', m ? '1' : '0');
  }, [pct, motion]);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // The menu ships inert until its artwork and handlers are ready; wait for
  // the gate to lift, exactly like a real player's first click.
  await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 250));
}
const barText = () => page.evaluate(() => ({
  title: document.getElementById('title-fracture')?.textContent?.replace(/\s+/g, ' ').trim(),
  titleHidden: document.getElementById('title-fracture')?.hidden,
  hud: document.getElementById('fracture-hud')?.textContent?.replace(/\s+/g, ' ').trim(),
  hudHidden: document.getElementById('fracture-hud')?.hidden,
  result: document.getElementById('result-fracture')?.textContent?.replace(/\s+/g, ' ').trim(),
  stored: (() => { try { return localStorage.getItem('riot.fracturePct'); } catch { return 'denied'; } })(),
}));

// Pass 1: stored 42 -> menu bar shows TREMORS, sky stage 2 in the field.
await boot(42);
console.log('P1 menu @42:', JSON.stringify(await barText()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot2-menu-42.png' });
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 1200));
console.log('P1 run @42:', JSON.stringify(await barText()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot2-run-42.png' });
// End the run to reach RUN ENDED.
await page.keyboard.press('Escape');
await page.waitForSelector('#end-btn', { visible: true, timeout: 8000 });
await page.click('#end-btn');
await page.waitForFunction(() => !document.getElementById('result-page')?.hidden, { timeout: 8000 });
await new Promise(r => setTimeout(r, 600));
console.log('P1 result @42:', JSON.stringify(await barText()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot2-result-42.png' });

// Pass 2: stored 91 -> CRITICAL COLLAPSE, sky stage 4 (collapse sky).
await boot(91);
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 1200));
console.log('P2 run @91:', JSON.stringify(await barText()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot2-run-91.png' });

// Pass 3: fresh profile (0%) with motion OFF -> static cracks, no pulse errors.
await boot(91, false);
await page.click('#start-btn');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 900));
console.log('P3 run @91 motion-off:', JSON.stringify(await barText()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot2-run-91-reduced.png' });

// Pass 4: stored value survives a reload untouched (save-across-restart).
await page.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 500));
console.log('P4 after reload:', JSON.stringify(await barText()));

console.log('errors:', JSON.stringify(errors));
await browser.close();
