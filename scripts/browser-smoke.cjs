// Exercise the actual built HTML through Chromium's mouse, keyboard and touch
// paths. A manual RAF clock makes snapshots reproducible, not a game backdoor.
const pp = require('puppeteer-core'),
  A = require('node:assert/strict');
const { resolve, join } = require('node:path'),
  { pathToFileURL } = require('node:url'),
  { mkdirSync } = require('node:fs');
const captures = process.env.CAPTURE_DIR;
if (captures) mkdirSync(captures, { recursive: true });
(async () => {
  const browser = await pp.launch({
    headless: true,
    ...(process.env.CHROME_BIN
      ? { executablePath: process.env.CHROME_BIN }
      : { channel: 'chrome' }),
    args: JSON.parse(process.env.CHROME_ARGS || '[]'),
  });
  const root = pathToFileURL(resolve(__dirname, '..') + '/').href,
    { createCamera, frameRun, toScreen } = await import(root + 'src/camera.js'),
    { createRun } = await import(root + 'src/run.js'),
    { sightPicture } = await import(root + 'src/guide.js'),
    { openingFacing, clamp } = await import(root + 'src/levels.js');
  const allErrors = [],
    allNetwork = [];
  try {
    async function page(w, h, touch = false, dpr = 1, fresh = false) {
      const pg = await browser.newPage();
      await pg.setViewport({
        width: w,
        height: h,
        deviceScaleFactor: dpr,
        isMobile: touch,
        hasTouch: touch,
      });
      pg.setDefaultTimeout(5000);
      pg.on('pageerror', (e) => {
        allErrors.push(String(e));
        console.log('PAGEERROR', String(e));
      });
      await pg.setRequestInterception(true);
      pg.on('request', (r) => {
        if (/^https?:\/\//.test(r.url())) {
          allNetwork.push(r.url());
          return r.abort();
        }
        return r.continue();
      });
      await pg.evaluateOnNewDocument(() => {
        let stamp = 0,
          id = 0,
          queue = new Map(),
          seed = 42;
        window.requestAnimationFrame = (fn) => (queue.set(++id, fn), id);
        window.cancelAnimationFrame = (k) => queue.delete(k);
        let advanced = 0;
        window.__advance = (n, d = 1000 / 60) => {
          for (let i = 0; i < n; i++) {
            stamp += d;
            const q = [...queue.values()];
            queue.clear();
            q.forEach((f) => f(stamp));
          }
          advanced += n;
          return advanced;
        };
        Object.defineProperty(crypto, 'getRandomValues', {
          value: (a) => {
            a[0] = seed++;
            return a;
          },
        });
        window.__calls = [];
        window.PokiSDK = {};
        for (const k of [
          'init',
          'gameLoadingStart',
          'gameLoadingFinished',
          'gameplayStart',
          'gameplayStop',
        ])
          PokiSDK[k] = () => window.__calls.push(k);
      });
      await pg.goto(root + 'dist/index.html');
      if(fresh){await pg.evaluate(()=>localStorage.clear());await pg.reload();} // new player, before starting anything
      await pg.evaluate(() => document.fonts.ready);
      await pg.evaluate(() => __advance(2));
      return pg;
    }
    const tick = (pg, n, d) => pg.evaluate(([n, d]) => __advance(n, d), [n, d || 1000 / 60]),
      text = (pg, id) => pg.$eval('#' + id, (n) => n.textContent),
      screen = (pg) => pg.$eval('#game', (n) => n.dataset.screen),
      scene=pg=>pg.$eval('#arena',n=>n.dataset.scene??null),
      place=pg=>pg.$eval('#hud',n=>n.dataset.place),
      focus = (pg) => pg.evaluate(() => document.activeElement.id),
      snap = (pg, n) =>
        captures ? pg.screenshot({ path: join(captures, n + '.png') }) : undefined;
    // Desktop, file origin: keyboard navigation & safe transitions, including loss.
    let pg = await page(1280, 800);
    A.deepEqual(await pg.evaluate(() => __calls), [
      'init',
      'gameLoadingStart',
      'gameLoadingFinished',
    ]);
    await snap(pg, 'final-title');
    await pg.keyboard.press('ArrowDown');
    A.equal(await focus(pg), 'start-btn');
    await pg.keyboard.press('ArrowDown');
    await pg.keyboard.press('Enter');
    A.equal(await screen(pg), 'manual');
    const species = new Set();
    for (let i = 0; i < 8; i++) {
      species.add(await text(pg, 'foe-name'));
      A.ok((await text(pg, 'foe-counter')).length > 12);
      await pg.keyboard.press('ArrowRight');
    }
    A.equal(species.size, 8);
    await pg.keyboard.press('Escape');
    A.equal(await screen(pg), 'title');
    A.equal(await focus(pg), 'manual-btn');
    await pg.click('#options-btn');
    // Exercise the full-strength layout too; it shouldn't get coverage by
    // accidentally playing the paper room and lowering the score assertion.
    await pg.click('#opening-opt');
    A.match(await text(pg, 'opening-opt'), /Full field/);
    await pg.click('#music-opt');
    A.equal(await pg.$eval('#music-opt', (n) => n.getAttribute('aria-pressed')), 'false');
    await pg.click('#options-page .back');
    await pg.click('#start-btn');
    A.equal(await focus(pg), 'arena');
    await tick(pg, 2);
    await pg.mouse.move(570, 407);
    await pg.mouse.down();
    await pg.mouse.move(500, 463);
    await pg.$eval('#arena', (el) =>
      el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })),
    );
    await pg.mouse.up();
    await tick(pg, 45);
    A.equal(await scene(pg),null);A.equal(await place(pg),'field');
    A.equal(Number(await text(pg, 'score')), 0);
    await snap(pg, 'ready-cut');
    await pg.keyboard.press('Space');
    await tick(pg, 1);
    A.ok(
      await pg.evaluate(() => {
        const canvas = document.getElementById('arena');
        const atTick = canvas.toDataURL();
        __advance(1, 1000 / 120); // half a tick: no new Matter step
        const between = canvas.toDataURL();
        __advance(1, 0); // identical instant must not advance pose or effects
        return atTick !== between && between === canvas.toDataURL();
      }),
      'the actual framebuffer interpolates between simulation ticks',
    );
    await tick(pg, 1, 1000 / 120);
    await tick(pg, 64);
    A.equal(Number(await text(pg, 'score')), 1660);
    A.equal(await text(pg, 'stroke-award'), '+1,660');
    A.equal(await pg.$eval('#imprint', (n) => n.hidden), false);
    await snap(pg, 'first-throughcut');
    await pg.keyboard.down('Shift');
    await pg.keyboard.down('ArrowLeft');
    await tick(pg, 17);
    await pg.keyboard.up('ArrowLeft');
    await pg.keyboard.press('p');
    A.equal(await screen(pg), 'pause');
    A.equal(await focus(pg), 'resume-btn');
    A.equal((await pg.evaluate(() => __calls)).at(-1), 'gameplayStop');
    let frozen = await text(pg, 'score');
    await tick(pg, 140);
    A.equal(await text(pg, 'score'), frozen);
    await pg.keyboard.up('Shift');
    await pg.click('#pause-options');
    await pg.click('#assist-opt');
    await pg.click('#options-page .back');
    A.equal(await focus(pg), 'resume-btn');
    await pg.keyboard.press('Enter');
    A.equal(await screen(pg), 'run');
    A.equal((await pg.evaluate(() => __calls)).at(-1), 'gameplayStart');
    await tick(pg, 360);
    A.equal(await screen(pg), 'result');
    A.equal(await focus(pg), 'retry-btn');
    A.ok(/Redline|Broken/.test(await text(pg, 'cause')));
    const best = Number(await text(pg, 'result-score'));
    A.ok(best >= 1660);
    A.match(
      await pg.$eval('#stroke-map', (n) => n.getAttribute('aria-label')),
      /Fang, Prism, Bastion \(forward cut\)/,
    );
    A.equal(await pg.$eval('#best-print', (n) => n.hidden), false);
    A.equal(await pg.evaluate(() => Number(localStorage.getItem('riot.best'))), best);
    const seed1 = (await text(pg, 'run-record')).split('SEED ')[1];
    await snap(pg, 'final-death');
    await pg.keyboard.press('Enter');
    A.equal(Number(await text(pg, 'score')), 0);
    A.equal(await screen(pg), 'run');
    await pg.click('#pause-btn');
    await pg.click('#end-btn');
    A.notEqual((await text(pg, 'run-record')).split('SEED ')[1], seed1);
    A.equal(
      await pg.$eval('#best-print', (n) => n.hidden),
      true,
      'no fabricated highlight on a zero-stroke run',
    );
    await pg.click('#home-btn');
    A.equal(Number(await text(pg, 'title-best')), best);
    await pg.reload();
    await pg.evaluate(() => document.fonts.ready);
    A.equal(Number(await text(pg, 'title-best')), best);
    await pg.click('#options-btn');
    A.equal(await pg.$eval('#music-opt', (n) => n.getAttribute('aria-pressed')), 'false');
    A.equal(await pg.$eval('#assist-opt', (n) => n.getAttribute('aria-pressed')), 'false');
    await pg.click('#assist-opt');
    await pg.click('#options-page .back');
    console.log(
      'PASS keyboard title/manual (8 unique counters), pause/default focus, SDK, settings, real Redline result, persisted best, distinct retry seed, pointercancel.',
    );
    await pg.close();
    // A deterministic reference run supplies click positions ONLY; the bundled
    // page receives ordinary mouse input, and must independently earn every point.
    pg = await page(1280, 800);
    await pg.click('#start-btn');
    await tick(pg, 1);
    const g = createRun(42),
      cam = createCamera();
    cam.resize(1280, 800);
    cam.reset({ x: 0, y: 0 }, openingFacing(42));
    let i = 0,
      shots = 0,
      bandSeen = 1,
      holdLineUntil = 0,
      gotDrive = false,
      crown = false,
      marks = new Set(),
      trace = [];
    // First pass: fly the reference simulation with no page input at all.
    // Remember the decision tick and screen point for each ordinary click.
    while (i < 3600) {
      const s = g.state,
        p = g.world.player.position;
      const view = cam.view(0);
      const cand = [...g.combat.enemies.values()]
        .map((e) => ({
          e,
          q: toScreen(view, e),
          d: Math.hypot(e.x - p.x, e.y - p.y) + (e.y > p.y + 35 ? 700 : 0),
        }))
        .filter(({ q,e }) => q.x > 12 && q.x < 1265 && q.y > 92 && q.y < 735 && e.y<s.line-200)
        .sort((a, b) => a.d - b.d);
      if (i >= holdLineUntil && s.edge > 0) {
        // Pick one of the VISIBLE two-target sights and let the first kill
        // pass. Instantly retapping on every refund misses the new move.
        const route = cand.find(
          ({ e, d }) =>
            d < 1170 &&
            sightPicture(
              p,
              g.aimAt(e),
              g.world.geometry,
              g.combat.enemies.values(),
              s.drive > 0 ? 3 : 1,
            ).pair.length === 2,
        );
        // One decision a second, not a tap on the exact impact tick. If the
        // only visible targets are below us, aim at open sky and keep climbing.
        const pick=route||(cand[0]?.e.y<p.y+80?cand[0]:null), n=g.nearest();
        const q=pick?.q??{x:clamp(n?toScreen(view,n).x:640,82,1198),y:106};
        holdLineUntil=i+(route?110:60);
        const aim=g.aimAt({x:view.x+q.x/view.scale,y:view.y+q.y/view.scale});
        trace.push([i, q.x, q.y, aim]);
        g.dash(aim);
        shots++;
      }
      const steps = 4;
      for (let j = 0; j < steps; j++) {
        g.tick();
        frameRun(cam,g);
      }
      i += steps;
      if (!(i % 80)) console.log('tick', i, s.band, s.kills, s.score);
      if (s.band !== bandSeen) {
        bandSeen = s.band;
        console.log('sector', s.band, 'score', s.score);
      }
      if (s.phase !== 'playing') break;
    }
    // Second pass: an ordinary browser player feeds real mouse clicks back
    // into the same bundled page at exactly those ticks.
    pg = await page(1280, 800);
    await pg.click('#start-btn');
    await tick(pg, 1);
    drive: {
      let at = 0,
        done = 0,
        seen = new Set();
      const again = createRun(42),
        mcam = createCamera();
      mcam.resize(1280, 800);
      mcam.reset({ x: 0, y: 0 }, openingFacing(42));
      for (let t = 0; t < 3600 && ['ready', 'playing'].includes(again.state.phase); t += 4) {
        for (; at < trace.length && trace[at][0] <= t; at++) {
          await pg.mouse.click(trace[at][1], trace[at][2]);
          again.dash(trace[at][3]);
          done++;
        }
        for (let j = 0; j < 4; j++) { again.tick(); frameRun(mcam, again); }
        await tick(pg, 4);
        const s = again.state;
        if (!gotDrive && s.drive > 0) {
          gotDrive = true;
          await snap(pg, 'final-drive');
        }
        if (s.band >= 3 && [...again.combat.enemies.values()].some((e) => e.kind === 'crown') && !crown) {
          crown = true;
          await snap(pg, 'final-hunt');
        }
        if (s.band >= 3 && s.kills > 22 && s.blade > 0 && !seen.has(s.band)) {
          seen.add(s.band);
          await snap(pg, 'chain-s' + s.band);
        }
        if (!(t % 400)) console.log('play', t, s.band, s.kills, s.score, 'page', await pg.$eval('#score', (n) => n.textContent));
      }
      A.equal(done, trace.length, 'every recorded decision was actually clicked');
    }
    await pg.keyboard.press('p');
    await pg.click('#end-btn');
    A.equal(
      Number(await text(pg, 'result-score')),
      g.state.score,
      'real bundled click-to-slash run must agree with reference',
    );
    A.equal(Number(await text(pg, 'result-kills')), g.state.kills);
    A.ok(gotDrive && crown && g.state.band >= 3);
    A.ok(g.state.throughcuts >= 1, 'an ordinary player can land a real Throughcut');
    A.equal(
      await text(pg, 'print-points'),
      `+${g.state.bestStroke.points.toLocaleString('en-US')}`,
    );
    A.match(
      await text(pg, 'debrief'),
      new RegExp(`^${g.state.throughcuts} throughcuts in ${shots} dashes`),
    );
    await snap(pg, 'final-record');
    console.log('PASS recorded real-pointer run (reference goal)', {
      shots,
      score: g.state.score,
      kills: g.state.kills,
      chain: g.state.maxChain,
      sectors: g.state.band,
      throughcuts: g.state.throughcuts,
      bestStroke: g.state.bestStroke.points,
    });
    g.dispose();
    await pg.close();
    // Native CDP mobile input, no synthetic JS pointer dispatch here.
    pg = await page(390, 844, true, 2,true);
    await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pg.goto(root + 'dist/index.html');
    await pg.evaluate(() => document.fonts.ready);
    await tick(pg, 2);
    await pg.tap('#options-btn');
    A.equal(await pg.$eval('#motion-opt', (n) => n.getAttribute('aria-pressed')), 'false');
    A.match(await text(pg,'opening-opt'),/Gradual/);
    await pg.tap('#options-page .back');
    await snap(pg, 'final-phone-title');
    await pg.tap('#start-btn');
    await tick(pg, 2);
    await snap(pg, 'phone-ready');
    const client = await pg.createCDPSession();
    const touch = (type, xy) =>
      client.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: xy ? [{ x: xy[0], y: xy[1], id: 2 }] : [],
      });
    await touch('touchStart', [250, 380]);
    await touch('touchMove', [195, 425]);
    await touch('touchCancel');
    await tick(pg, 20);
    A.equal(await scene(pg),'tap');A.equal(Number(await text(pg,'score')),0);
    const still=()=>pg.$eval('#arena',el=>el.toDataURL());
    const film=await still();await tick(pg,110);A.equal(await still(),film,'reduced motion has a static complete diagram');
    const sim = createRun(42, () => {}, { warmup: true }),
      mcam = createCamera();
    mcam.resize(390, 844);
    mcam.reset({ x: 0, y: 0 }, openingFacing(42), true);
    async function fly(n) {
      for (let i = 0; i < n; i++) {
        const had = !!sim.state.opening;
        sim.tick();
        const st = sim.state,
          p = sim.world.player;
        if (had && !st.opening) mcam.reset(p.position, openingFacing(42));
        frameRun(mcam,sim,false);
      }
      await tick(pg, n);
    }
    async function tapFoe() {
      const e = sim.nearest(),
        pos = toScreen(mcam.view(0), e);
      A.ok(pos.x > 12 && pos.x < 378 && pos.y > 90 && pos.y < 790, 'target is reachable');
      await touch('touchStart', [pos.x, pos.y]);
      await fly(3);
      await touch('touchEnd');
      A.ok(sim.dash(sim.aimAt(e)));
    }
    await tapFoe();
    await fly(20);
    A.equal(Number(await text(pg, 'score')), 900);
    A.equal(await pg.$eval('#stroke-name',n=>getComputedStyle(n).display),'none','no rack captions');
    A.equal(await pg.$eval('#imprint', (n) => n.hidden), false);
    await snap(pg, 'phone-throughcut');
    await fly(55);
    await tapFoe();
    await fly(60);
    A.equal(Number(await text(pg, 'score')), 2100);
    await tapFoe();
    await fly(46);
    A.equal(await scene(pg),'crack');
    await snap(pg, 'phone-crack');
    A.equal(await pg.evaluate(()=>localStorage.getItem('riot.started')),'1');
    await tapFoe();
    await fly(60);
    A.equal(Number(await text(pg, 'score')), 5700);
    A.equal(await pg.$eval('#hud', (n) => n.dataset.place), 'field');
    A.equal(await scene(pg),'lane');
    await snap(pg, 'phone-live');
    await tapFoe();
    await fly(18);
    sim.dispose();
    await touch('touchStart', [130, 390]);
    await tick(pg, 32);
    await touch('touchMove', [103, 453]);
    await snap(pg, 'final-phone-focus');
    await touch('touchEnd');
    await tick(pg, 8);
    await pg.evaluate(() => window.dispatchEvent(new Event('blur')));
    A.equal(await screen(pg), 'pause');
    await tick(pg, 260);
    await pg.tap('#resume-btn');
    A.equal(await screen(pg), 'run');
    await pg.tap('#pause-btn');
    await pg.tap('#pause-manual');
    await pg.tap('#next-foe');
    A.equal(await text(pg, 'foe-name'), 'Pulse');
    await snap(pg, 'final-phone-manual');
    A.deepEqual(
      await pg.evaluate(() => {
        const n = document.querySelector('#arena');
        return [
          n.clientWidth,
          n.clientHeight,
          n.width,
          n.height,
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ];
      }),
      [390, 844, 780, 1688, 390, 844],
    );
    await pg.setViewport({
      width: 844,
      height: 390,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await tick(pg, 2);
    await snap(pg, 'final-landscape-manual');
    await pg.tap('#manual-page .back');
    await pg.tap('#end-btn');
    await snap(pg, 'final-landscape-result');
    A.ok(
      await pg.$eval('#retry-btn', (n) => {
        const b = n.getBoundingClientRect();
        return b.top >= 0 && b.bottom <= innerHeight && b.height >= 44;
      }),
    );
    await pg.tap('#home-btn');
    await tick(pg, 2);
    await snap(pg, 'final-landscape-title');
    await pg.setViewport({
      width: 320,
      height: 568,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await tick(pg, 2);
    await snap(pg, 'final-small-title');
    console.log(
      'PASS native touch hit, backward pull, cancel, blur/pause/resume, reduced motion, DPR2 portrait and rotated manual/results at 844×390, 320×568 title.',
    );
    await pg.close();
    // Real fresh visits: no input is ever synthesized by the guide. A
    // keyboard Start uses keycaps. Ordinary retries get no automatic sights.
    pg=await page(880,710,false,1,true);
    const bank=async()=>{await pg.keyboard.press('p');await pg.click('#end-btn');};
    for (const keys of [true, false]) {
      const one = await page(880, 710, false, 1, true);
      if (keys) { await one.keyboard.press('ArrowDown'); await one.keyboard.press('Enter'); }
      else { const box = await one.$eval('#start-btn', (n) => n.getBoundingClientRect().toJSON()); await one.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
      await tick(one, 3);
      A.equal(await scene(one), 'tap', keys ? 'keyboard Start' : 'mouse Start');
      A.equal(await place(one), 'room');
      await snap(one, keys ? 'story-tap-keys' : 'story-tap-mouse');
      await one.close();
    }
    const retry=async()=>{await pg.click('#retry-btn');await tick(pg,2);A.equal(await place(pg),'field');A.equal(await scene(pg),null);};
    pg=await page(880,710,false,1,true); // first real player, intact ticket
    await pg.click('#start-btn');await tick(pg,1);
    A.equal(await scene(pg),'tap');
    await snap(pg,'story-tap');const moving=await pg.$eval('#arena',n=>n.toDataURL());
    await tick(pg,66);A.notEqual(await pg.$eval('#arena',n=>n.toDataURL()),moving,'the proof strip animates with motion on');A.equal(Number(await text(pg,'score')),0);
    await pg.mouse.click(820,540);await tick(pg,80);A.equal(await scene(pg),'retry');
    await pg.keyboard.press('Space');await tick(pg,17);await snap(pg,'story-rip');await tick(pg,57);A.equal(await scene(pg),'pull');
    await snap(pg,'story-turn');await pg.keyboard.press('Space');await tick(pg,46);A.equal(await scene(pg),'shell');
    await pg.keyboard.press('Space');await tick(pg,40);A.equal(await scene(pg),'crack');await snap(pg,'story-crack');
    await pg.keyboard.press('Space');await tick(pg,65);A.equal(await scene(pg),'lane');await snap(pg,'story-lane');
    await pg.keyboard.press('Space');await tick(pg,35);A.equal(await scene(pg),'focus');await snap(pg,'story-air');
    await tick(pg,550);A.equal(await scene(pg),'net');await snap(pg,'story-net');
    await bank();await retry();await bank();await pg.reload();await pg.click('#start-btn');await tick(pg,2);
    A.equal(await place(pg),'field');A.equal(await scene(pg),null);await snap(pg,'quiet-retry');await pg.close();
    // Punched at Start: a skip, abandonment before a single slash, and a
    // reload while the first rack is still untouched also spend the ticket.
    for(const how of ['skip','retire','reload']){
      pg=await page(880,710,false,1,true);await pg.keyboard.press('ArrowDown');await pg.keyboard.press('Enter');await tick(pg,3);A.equal(await scene(pg),'tap');
      if(how==='reload'){await pg.reload();await pg.click('#start-btn');await tick(pg,2);}
      else {if(how==='skip'){await pg.keyboard.press('p');await pg.click('#skip-room');await tick(pg,2);A.equal(await scene(pg),null);}await bank();await retry();}
      A.equal(await place(pg),'field');A.equal(await scene(pg),null);A.equal(Number(await text(pg,'score')),0);await pg.close();
    }
    console.log('PASS wordless gestures, silent reduced-motion proof strip, first-air redirect and one net; complete, skip, retire or reload never replay the guide.');
    A.deepEqual(allErrors, []);
    A.deepEqual(allNetwork, []);
    console.log('PASS file:// no remote requests or uncaught JS errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
