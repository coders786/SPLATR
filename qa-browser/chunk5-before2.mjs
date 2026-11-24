import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const PORT=process.env.CHUNK5_PORT||'4173';
const TAG=process.env.CHUNK5_TAG||'before';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const page = await browser.newPage();
page.on('dialog', d => { console.log('dialog:', d.message()); d.accept(); });
page.on('pageerror', e => console.log('pageerror:', e.message));
page.on('error', e => console.log('PAGE CRASHED:', e.message));
page.setDefaultTimeout(15000);
await page.setViewport({ width: 1100, height: 700 });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const shot = async (name) => { try { await page.screenshot({ path: `/home/user/SPLATR/docs/img/training-${TAG}-${name}.png`, timeout: 15000 }); log('shot', name); } catch (e) { log('SHOT FAILED', name, e.message); } };
const objective = () => page.evaluate(() => document.getElementById('tutorial-objective')?.textContent?.replace(/\s+/g, ' ') ?? null).catch(() => 'DEAD');
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '0'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#manual-btn');
await page.waitForFunction(() => !document.getElementById('manual-page')?.hidden, { timeout: 8000 });
await new Promise(r => setTimeout(r, 300));
await shot('manual');
if (TAG === 'before') await page.click('button.manual-drill[data-lesson="fang"]');
else await page.click('.training-door[data-door="course"]');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await new Promise(r => setTimeout(r, 1000));
await shot('course');
if (process.env.EARLY_EXIT === '1') { console.log('early exit after course shot'); await browser.close(); process.exit(0); }
// Stage-0 racks (1100x700 viewport: recompute coords from a fresh screenshot).
log('objective:', await objective());
await shot('racks0');
for (const [i, [x, y]] of [[544, 472], [484, 504], [436, 535]].entries()) {
  await page.mouse.click(x, y); log('rack click', i + 1, x, y); await new Promise(r => setTimeout(r, 600));
  log('objective:', await objective());
}
// Slice the glowing gate: click directly on the seam.
for (const [i, [x, y]] of [[676, 430], [676, 500]].entries()) {
  await page.mouse.click(x, y); log('gate click', i + 1, x, y); await new Promise(r => setTimeout(r, 600));
  log('objective:', await objective());
}
// Dash right through the open gate.
for (let i = 0; i < 4; i++) {
  await page.mouse.move(300, 480);
  await page.mouse.down();
  await page.mouse.move(800, 480, { steps: 5 });
  await page.mouse.up();
  log('dash right', i + 1);
  await new Promise(r => setTimeout(r, 900));
  log('objective:', await objective());
}
await shot('wall');
// Stage-1: bank into the right boundary at speed.
for (let i = 0; i < 6; i++) {
  await page.mouse.move(280, 350);
  await page.mouse.down();
  await page.mouse.move(1050, 350, { steps: 4 });
  await page.mouse.up();
  log('bank attempt', i + 1);
  await new Promise(r => setTimeout(r, 900));
  log('objective:', await objective());
}
await shot('rift');
log('done');
await browser.close();
