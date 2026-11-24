/* Live Chromium QA for CHUNK 4 — THE MONOLITH.
 * Targets the preview server on :5173. Two passes over the live game:
 *
 *   PASS A (BEFORE — ordinary arena): break the three anchor locks, cross the
 *     seam. The sector advances, no boss. This is the behavior the tear
 *     replaces.
 *
 *   PASS B (AFTER — torn arena): fracture at 100% fires the tear on field
 *     entry (SHATTERED). Break the locks the same way, cross the seam: no
 *     sector advances — THE MONOLITH seats in the seam instead. Five banked
 *     OVERCHARGED cuts fell it; the seam opens, the sector lifts, and the
 *     fracture debrief carries the +12 tribute.
 *
 * Writes qa-browser/shot4-*.png for docs/monolith.md.
 */
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

async function boot(pct) {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
  await page.evaluate((p) => {
    localStorage.clear();
    localStorage.setItem('riot.started', '1');
    localStorage.setItem('riot.fracturePct', String(p));
    localStorage.setItem('riot.motion', '1');
    localStorage.setItem('riot.debug', '1');
  }, pct);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.getElementById('game')?.hasAttribute('inert'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 250));
}
const fastDrag = async (fx, fy, tx, ty) => {
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps);
    await new Promise(r => setTimeout(r, 12));
  }
  await page.mouse.up();
};
async function toField() {
  await page.click('#start-btn');
  await page.waitForFunction(() => document.getElementById('game')?.dataset?.screen === 'run', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));
  await fastDrag(640, 470, 430, 645);
  await page.waitForFunction(() => window.__riot?.state?.phase === 'playing', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 500));
}
const snap = () => page.evaluate(() => {
  const s = window.__riot?.state;
  if (!s) return { error: 'no __riot' };
  const enemies = [...window.__riot.combat.enemies.values()];
  return {
    phase: s.phase,
    arenaMode: s.arenaMode,
    sector: s.narrative?.sector,
    arenaY: window.__riot.world.arena.y,
    locksBroken: s.narrative?.locks?.filter(l => l.broken).length,
    sealReady: s.narrative?.seal?.ready,
    monolith: s.monolith ?? false,
    monolithEnemy: enemies.find(e => e.kind === 'monolith') ? { hp: enemies.find(e => e.kind === 'monolith').hp } : null,
    monoliths: s.monoliths ?? 0,
    pct: Number(s.fracture?.pct?.toFixed?.(2) ?? s.fracture?.pct),
    kineticStage: s.kineticStage,
    stored: localStorage.getItem('riot.fracturePct'),
    hud: document.getElementById('fracture-hud')?.textContent?.replace(/\s+/g, ' ').trim(),
  };
});
// Teleport the cube under a target and dash upward through it, blade live.
async function dashThrough(x, yOffset, { stage } = {}) {
  await page.evaluate(([tx, dy, st]) => {
    const r = window.__riot;
    r.world.player.position.x = tx;
    r.world.player.position.y = r.world.player.position.y; // keep, offset passed in via y
    r.world.player.plugin.previous.x = tx;
    r.world.player.plugin.previous.y = r.world.player.position.y;
    r.state.edge = r.state.edgeMax;
    r.state.invul = 10000;
    if (st != null) r.state.kineticStage = st;
  }, [x, yOffset, stage ?? null]);
  // Position exactly yOffset below the target for a clean upward cut.
  await page.evaluate(([tx, ty]) => {
    const r = window.__riot;
    r.world.player.position.x = tx;
    r.world.player.position.y = ty;
    r.world.player.plugin.previous.x = tx;
    r.world.player.plugin.previous.y = ty;
    r.state.edge = r.state.edgeMax;
    r.state.invul = 10000;
  }, [x, yOffset]);
  await page.evaluate(() => window.__riot.dash({ x: 0, y: -42, power: 1 }));
  await new Promise(r => setTimeout(r, 1100));
}
const breakLocksAndCross = async () => {
  const locks = await page.evaluate(() => window.__riot.state.narrative.locks.map(l => ({ x: l.x, y: l.y })));
  for (const lock of locks) await dashThrough(lock.x, lock.y + 130);
  const seal = await page.evaluate(() => ({ x: window.__riot.state.narrative.seal.x, y: window.__riot.state.narrative.seal.y }));
  await dashThrough(seal.x, seal.y + 130);
};

// ── PASS A — BEFORE: the ordinary seam ────────────────────────────────────
await boot(0);
await toField();
console.log('A field:   ', JSON.stringify(await snap()));
const arenaYBefore = (await snap()).arenaY;
await breakLocksAndCross();
await new Promise(r => setTimeout(r, 1200));
const aAfter = await snap();
console.log('A after:   ', JSON.stringify(aAfter));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-before-seam.png' });

// ── PASS B — AFTER: the SHATTERED seam seats the Monolith ─────────────────
await boot(100);
await toField();
await new Promise(r => setTimeout(r, 400));
console.log('B field:   ', JSON.stringify(await snap()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-before-tear.png' });
await breakLocksAndCross();
await new Promise(r => setTimeout(r, 900));
const bMonolith = await snap();
console.log('B monolith:', JSON.stringify(bMonolith));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-after-monolith.png' });
// Five banked OVERCHARGED cuts. One plate per launch.
for (let i = 0; i < 6; i++) {
  const target = await page.evaluate(() => {
    const m = window.__riot.combat.enemies.get('monolith/core');
    return m ? { x: m.x, y: m.y, hp: m.hp } : null;
  });
  if (!target) break;
  await dashThrough(target.x, target.y + 130, { stage: 4 });
  console.log('B cut', i + 1, JSON.stringify(await snap()));
}
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-after-fall.png' });
console.log('B fell:    ', JSON.stringify(await snap()));
await new Promise(r => setTimeout(r, 1200));
console.log('B settle:  ', JSON.stringify(await snap()));
await page.screenshot({ path: '/home/user/SPLATR/qa-browser/shot4-after-sector.png' });

console.log('\nPASS A arenaY:', arenaYBefore, '→ sector see above');
console.log('errors:', JSON.stringify(errors));
await browser.close();
process.exit(errors.length ? 1 : 0);
