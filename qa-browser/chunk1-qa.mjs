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
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('riot.started', '1'); } catch {} });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#start-btn', { visible: true, timeout: 15000 });
  await page.click('#start-btn');
  await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2500));
  const hud = await page.evaluate(() => {
    const hud = document.querySelector('.wave-hud');
    return {
      hudText: hud?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80),
      pips: hud?.querySelectorAll('.wave-pips i')?.length ?? -1,
      livePips: hud?.querySelectorAll('.wave-pips i[data-live=true]')?.length ?? -1,
      announcement: document.getElementById('announcement')?.textContent,
    };
  });
  console.log('HUD:', JSON.stringify(hud));
  await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot-hud.png' });
  // Pause and end the run to reach the result screen.
  await page.keyboard.press('Escape');
  await page.waitForSelector('#end-btn', { visible: true, timeout: 8000 });
  await page.click('#end-btn');
  await page.waitForFunction(() => !document.getElementById('result-page')?.hidden, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 600));
  const result = await page.evaluate(() => ({
    bestWave: document.getElementById('result-best-wave')?.textContent,
    waveReached: document.getElementById('result-sector')?.textContent,
    stageLabel: document.getElementById('result-stage-label')?.textContent,
    storedBestWave: (() => { try { return localStorage.getItem('riot.bestWave'); } catch { return 'denied'; } })(),
    score: document.getElementById('result-score')?.textContent,
  }));
  console.log('RESULT:', JSON.stringify(result));
  await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot-result.png' });
  console.log('errors:', JSON.stringify(errors));
} finally { await browser.close(); }
