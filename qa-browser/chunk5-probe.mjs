import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const PORT=process.env.CHUNK5_PORT||'5173';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
await inflate(join(bin, 'al2023.tar.br'));
await inflate(join(bin, 'fonts.tar.br'));
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({ headless: true, executablePath: await chromium.executablePath(), args: chromium.args });
const page = await browser.newPage();
page.on('pageerror', e => console.log('pageerror:', e.message));
page.setDefaultTimeout(10000);
await page.setViewport({ width: 1280, height: 800 });
const snap = () => page.evaluate(() => { const r = window.__riot; const v = r?.state?.visualTutorial; return { stage: v?.stage, gateBroken: v?.gateBroken, gateReady: v?.gateReady, blade: r?.state?.blade?.toFixed?.(1), py: r?.world?.player?.position?.y?.toFixed(0), px: r?.world?.player?.position?.x?.toFixed(0), phase: r?.state?.phase, wave: r?.state?.wave?.phase, hp: r?.state?.hp, gateBodies: r?.world?.engine?.world?.bodies?.filter?.(b => b.label === 'tutorial-gate').length }; });
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('riot.started', '1'); localStorage.setItem('riot.motion', '1'); localStorage.setItem('riot.debug', '1'); });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
await page.click('#manual-btn');
await page.waitForFunction(() => !document.getElementById('manual-page')?.hidden, { timeout: 8000 });
await page.click('.training-door[data-door="course"]');
await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
await page.mouse.move(640, 470); await page.mouse.down(); await page.mouse.move(430, 645, { steps: 6 }); await page.mouse.up();
await new Promise(r => setTimeout(r, 1500));
for (let i = 0; i < 6 && (await page.evaluate(() => window.__riot.state.visualTutorial.stage)) < 1; i++) {
  await page.mouse.move(700, 480); await page.mouse.down(); await page.mouse.move(260, 480, { steps: 5 }); await page.mouse.up();
  await new Promise(r => setTimeout(r, 900));
}
// Cross gate 0 (the rack room): drags launch the cube rightward through the
// broken gate until stage advances to 1.
for (let i = 0; i < 10 && (await page.evaluate(() => window.__riot.state.visualTutorial.stage)) < 1; i++) {
  await page.mouse.move(700, 480); await page.mouse.down(); await page.mouse.move(260, 480, { steps: 5 }); await page.mouse.up();
  await new Promise(r => setTimeout(r, 900));
}
console.log('stage1:', JSON.stringify(await snap()));
// Bank the right wall like the QA script does.
for (let i = 0; i < 10 && (await page.evaluate(() => window.__riot.state.visualTutorial.gateReady !== true)); i++) {
  await page.evaluate(() => { const r = window.__riot; r.world.player.position.x = 800; r.world.player.position.y = -245; r.world.player.plugin.previous.x = 800; r.world.player.plugin.previous.y = -245; r.state.edge = r.state.edgeMax; r.state.invul = 10000; });
  await page.evaluate(() => window.__riot.dash({ x: 42, y: 0, power: 1 }));
  await new Promise(r => setTimeout(r, 700));
}
console.log('after bank:', JSON.stringify(await snap()));
// Crux v2: teleport with the Matter positionPrev synced (kills the
// teleport-delta launch), blade forced, NO dash. A stationary cube inside
// the band must generate collisionActive every tick.
await page.evaluate(() => {
  const r = window.__riot; const p = r.world.player;
  p.position.x = 650; p.position.y = -475; p.positionPrev.x = 650; p.positionPrev.y = -475;
  r.state.edge = r.state.edgeMax; r.state.invul = 10000; r.state.blade = 40;
});
for (let t = 0; t < 24; t++) { await new Promise(r => setTimeout(r, 250)); const s = await snap(); console.log('t', (t * .25).toFixed(2), JSON.stringify(s)); if (s.stage >= 2) break; }
await browser.close();
