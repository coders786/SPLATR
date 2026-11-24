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
page.on('pageerror', e => errors.push(String(e)));
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.setItem('riot.started', '1'); });
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// Wave-clear -> rest -> choose offers -> wave 2 with +1 WAVE bonus in the HUD receipt.
const result = await page.evaluate(async () => {
  const { createRun } = await import('/src/run.js');
  const { createWaveUI } = await import('/src/wave-ui.js');
  const { placePlayer, stopPlayer } = await import('/src/physics.js');
  const events = [];
  const r = createRun(131, (t, d) => events.push({ t, d }), { waveMode: true });
  r.state.phase = 'playing';
  r.state.invul = 99999;
  const ui = createWaveUI({ getRun: () => r, resetInput: () => {} });
  ui.update();
  const hudText = () => [...document.querySelectorAll('.wave-hud')].at(-1)?.textContent?.replace(/\s+/g, ' ').trim();
  const offersIn = () => [...document.querySelectorAll('.wave-upgrades')].at(-1)?.querySelectorAll('button')?.length ?? 0;
  const before = hudText();
  // Clear wave 1 the way the game does.
  for (const e of [...r.combat.enemies.values()]) r.combat.remove(e);
  r.state.stop = 0; r.tick();
  const q = r.state.wave.platform;
  placePlayer(r.world, { x: q.x + q.w / 2, y: q.y - 23 }); stopPlayer(r.world);
  for (let i = 0; i < 25 && r.state.wave.phase !== 'choose'; i++) { r.state.stop = 0; r.tick(); }
  ui.update();
  const offers = offersIn();
  const clearEvent = events.find(e => e.t === 'waveClear');
  const hudAtRest = hudText();
  // Choose the first offer -> wave 2.
  const buff = r.state.wave.offers[0];
  r.chooseWaveBuff(buff.id);
  ui.update();
  const hudWave2 = hudText();
  const pips = [...[...document.querySelectorAll('.wave-hud')].at(-1)?.querySelectorAll('.wave-pips i') ?? []].length;
  r.dispose();
  return { before, offers, clearMult: clearEvent?.d?.waveMult, hudAtRest, hudWave2, pips, wave: r.state.wave.number };
});
console.log('WAVE FLOW:', JSON.stringify(result, null, 1));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot-buffs.png' });
console.log('errors:', JSON.stringify(errors));
await browser.close();
