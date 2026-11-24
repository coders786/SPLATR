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
const fastDrag = async (fx, fy, tx, ty) => {
  await page.mouse.move(fx, fy); await page.mouse.down();
  for (let i = 1; i <= 4; i++) { await page.mouse.move(fx + (tx - fx) * i / 4, fy + (ty - fy) * i / 4); await new Promise(r => setTimeout(r, 12)); }
  await page.mouse.up();
};
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.fracturePct', '100'); localStorage.setItem('riot.motion', '1'); localStorage.setItem('riot.debug', '1'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#start-btn');
await new Promise(r => setTimeout(r, 600));
await fastDrag(640, 470, 430, 645);
await page.waitForFunction(() => window.__riot?.state?.phase === 'playing', { timeout: 8000 });
await new Promise(r => setTimeout(r, 400));
console.log('after start:', JSON.stringify(await page.evaluate(() => ({ arenaMode: window.__riot.state.arenaMode, pct: window.__riot.state.fracture.pct }))));
// Force wave 5 and clear the field.
await page.evaluate(() => { const r = window.__riot; r.state.wave.number = 5; for (const e of [...r.combat.enemies.values()]) r.combat.remove(e); });
await new Promise(r => setTimeout(r, 400));
console.log('after clear:', JSON.stringify(await page.evaluate(() => ({ phase: window.__riot.state.wave.phase, arenaMode: window.__riot.state.arenaMode, monolith: !!window.__riot.combat.enemies.get('monolith/core'), hp: window.__riot.combat.enemies.get('monolith/core')?.hp }))));
// Teleport the cube onto the Monolith with a live blade and watch a plate fall.
await page.evaluate(() => {
  const r = window.__riot, m = r.combat.enemies.get('monolith/core');
  r.state.shots++; r.state.kineticStage = 4; r.state.blade = 12;
  r.world.player.position.x = m.x; r.world.player.position.y = m.y;
  r.world.player.plugin.previous.x = m.x; r.world.player.plugin.previous.y = m.y;
});
await new Promise(r => setTimeout(r, 250));
console.log('after charged cut:', JSON.stringify(await page.evaluate(() => ({ hp: window.__riot.combat.enemies.get('monolith/core')?.hp, kin: window.__riot.state.kineticStage, arenaMode: window.__riot.state.arenaMode }))));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-monolith.png' });
console.log('errors:', JSON.stringify(errors));
await browser.close();
