// Source migration correctness: original baselines and diagnostic on/off
// equivalence, NOT FPS measurement. Includes the adversarial echo lifecycle.
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';

const baseline = JSON.parse(readFileSync(new URL('../test/support/combat-source-baseline.json', import.meta.url), 'utf8'));
const shellBaseline=JSON.parse(readFileSync(new URL('../test/support/armor-shell-source-baseline.json',import.meta.url),'utf8'));
const echoBaseline = JSON.parse(readFileSync(new URL('../test/support/echo-source-baseline.json', import.meta.url), 'utf8'));
const boundaryBaseline = JSON.parse(readFileSync(new URL('../test/support/source-boundary-baseline.json', import.meta.url), 'utf8'));
const out = process.env.QA_OUT_DIR || '.arena/harmony-chunk2/browser';
mkdirSync(out, {recursive: true});
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/tmp/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 30000,
});
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({width: 960, height: 540, deviceScaleFactor: 1});
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('riot.postfx', 'off'); localStorage.setItem('riot.tutorialCompleted', '1');
    let id = 0, stamp = performance.now(); const queue = new Map();
    window.requestAnimationFrame = fn => (queue.set(++id, fn), id);
    window.cancelAnimationFrame = id => queue.delete(id);
    window.qaFrames = n => {for (let i = 0; i < n; i++) {stamp += 1000 / 60; const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach(fn => fn(stamp));}};
  });
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5180', {waitUntil: 'networkidle0'});
  const report = await page.evaluate(async ({baseline, shellBaseline, echoBaseline, boundaryBaseline}) => {
    const {BOUNDARY_SCENARIOS, runBoundaryScenario} = await import('/test/support/source-boundary-scenarios.js');
    const {SOURCE_SCENARIOS, runSourceScenario} = await import('/test/support/combat-source-scenarios.js');
    const {ECHO_SCENARIOS, runEchoScenario} = await import('/test/support/echo-source-scenarios.js');
    const {createCombatSourceTrace} = await import('/src/combat-source-trace.js');
    const before = JSON.stringify({...localStorage}), cases = [];
    const scenarios = [
      ...SOURCE_SCENARIOS.map(name => ({name, suite: 'sources', run: runSourceScenario, expected: name==='sword-pulse'?shellBaseline[name]:baseline[name]})),
      ...ECHO_SCENARIOS.map(name => ({name, suite: 'echoes', run: runEchoScenario, expected: echoBaseline[name].snapshot,
        expectedSources: echoBaseline[name].sources})),
      ...BOUNDARY_SCENARIOS.map(name => ({name, suite: 'boundary', run: runBoundaryScenario, expected: boundaryBaseline[name].snapshot,
        expectedSources: boundaryBaseline[name].sources})),
    ];
    for (const {name, suite, run, expected, expectedSources} of scenarios) {
      const trace = createCombatSourceTrace(4096);
      const off = run(name), on = run(name, trace);
      let crossEngineRoundoff = 0;
      const roundoffDetails = [];
      if (JSON.stringify(off) !== JSON.stringify(expected)) {
        const diffs = [];
        const compare = (a, b, path = '') => {
          if (a && b && typeof a === 'object' && typeof b === 'object') for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) compare(a[k], b[k], `${path}.${k}`);
          else if (a !== b) {
            // Chromium/Node Math.atan2 differ at the final bit (observed delta
            // 5.6e-17 in a cut angle). Discrete results stay exact. Crucially,
            // browser observation on/off below is also still byte-for-byte exact.
            if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b) &&
                !(Number.isInteger(a) && Number.isInteger(b)) && Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b))) {
              crossEngineRoundoff++; roundoffDetails.push({path, actual: a, expected: b, delta: a - b});
            } else diffs.push({path, actual: a, expected: b});
          }
        };
        compare(off, expected);
        if (diffs.length) throw new Error(`${name}: browser baseline changed: ${JSON.stringify(diffs.slice(0, 8))}`);
      }
      if (JSON.stringify(on) !== JSON.stringify(off)) throw new Error(`${name}: observing changed gameplay`);
      const hits = trace.entries().filter(e => e.type === 'cut-result');
      if (suite === 'sources' && !hits.some(e => e.accepted)) throw new Error(`${name}: no accepted contact`);
      if (expectedSources && JSON.stringify(trace.entries()) !== JSON.stringify(expectedSources)) {
        throw new Error(`${name}: source identities, parentage or contact history changed`);
      }
      cases.push({name, suite, equal: true, diagnosticHistoryEqual: expectedSources ? true : null,
        crossEngineRoundoff, roundoffDetails, sourceKinds: [...new Set(hits.map(e => e.sourceKind))]});
    }
    return {cases, storageUnchanged: before === JSON.stringify({...localStorage})};
  }, {baseline, shellBaseline, echoBaseline, boundaryBaseline});
  assert.equal(report.cases.filter(c => c.suite === 'sources').length, 10);
  assert.equal(report.cases.filter(c => c.suite === 'echoes').length, 14);
  assert.equal(report.cases.filter(c => c.suite === 'boundary').length, 15);
  assert.equal(report.storageUnchanged, true);
  await page.click('#customize-btn'); await page.evaluate(() => qaFrames(4));
  assert.ok(await page.$('.shape-lab[open]'));
  await page.click('.lab-exit'); await page.click('#start-btn'); await page.evaluate(() => qaFrames(30));
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/results.json`, JSON.stringify({...report, errors}, null, 2) + '\n');
  console.log('PASS: 39 browser fixtures (10 source + 14 echo + 15 boundary) match baselines with observation off/on (38 original,1 explicit Chamfer/Storm replacement); echo/boundary diagnostic histories exact; storage unchanged; native shop open/close/start smoke; no page errors.');
  await page.close();
} finally {
  let timer;
  try {await Promise.race([browser.close(), new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('Browser close timed out')), 5000);})]);}
  catch (error) {browser.process()?.kill('SIGKILL'); console.warn(error.message);}
  finally {clearTimeout(timer);}
}
