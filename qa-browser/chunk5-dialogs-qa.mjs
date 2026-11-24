/* CHUNK 5 — dialog QA only. The combat scene wedges the headless SwiftShader
 * renderer, so the LIVE dialogs (which are light DOM) get their own run.
 *
 *   node qa-browser/chunk5-dialogs-qa.mjs
 */
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const BASE = process.env.CHUNK5_BASE || 'http://127.0.0.1:5173/';
const IMG = (name) => `/home/user/SPLATR/docs/img/training-after-${name}.png`;
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const errors = [];
const page = await browser.newPage();
page.on('dialog', d => d.accept());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.setDefaultTimeout(15000);
await page.setViewport({ width: 1280, height: 800 });
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '1'); localStorage.setItem('riot.debug', '1'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#manual-btn');
await page.waitForFunction(() => !document.getElementById('manual-page')?.hidden, { timeout: 8000 });
await new Promise(r => setTimeout(r, 300));

// ── ENEMY LESSONS ───────────────────────────────────────────────────────
await page.click('.training-door[data-door="lessons"]');
await new Promise(r => setTimeout(r, 700));
const lessons = await page.evaluate(() => ({
  open: !!document.querySelector('dialog[open]'),
  options: [...document.querySelectorAll('select[aria-label="Choose live training lesson"] option')].map(o => o.value),
}));
console.log('lessons dialog:', JSON.stringify(lessons));
await page.screenshot({ path: IMG('lessons') });

await page.select('select[aria-label="Choose live training lesson"]', 'rift');
await new Promise(r => setTimeout(r, 700));
const riftStep = await page.evaluate(() => ({ watch: document.querySelector('.teaching-step-label')?.textContent?.trim(), action: document.querySelector('.teaching-step-action')?.textContent?.trim() }));
console.log('rift lesson opens on:', JSON.stringify(riftStep));
await page.screenshot({ path: IMG('lesson-rift') });

await page.select('select[aria-label="Choose live training lesson"]', 'monolith');
await new Promise(r => setTimeout(r, 700));
const monolithStep = await page.evaluate(() => ({ watch: document.querySelector('.teaching-step-label')?.textContent?.trim(), action: document.querySelector('.teaching-step-action')?.textContent?.trim() }));
console.log('monolith lesson opens on:', JSON.stringify(monolithStep));
await page.screenshot({ path: IMG('lesson-monolith') });
await page.click('.teaching-close');
await new Promise(r => setTimeout(r, 300));

// ── CONTROL DRILLS ─────────────────────────────────────────────────────
await page.click('.training-door[data-door="drills"]');
await new Promise(r => setTimeout(r, 700));
const drills = await page.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160) }));
console.log('drills dialog:', JSON.stringify(drills));
await page.screenshot({ path: IMG('drills') });
console.log('errors:', errors.length ? errors.join('\n') : '(none)');
await browser.close();
