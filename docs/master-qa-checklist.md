# Master QA implementation and evidence

## Current standalone-engine verification (2026-11-17)

See [standalone-art-engine.md](standalone-art-engine.md) for the current extraction,
366/366 passing suite, four-size Chromium layout measurements, rendering-surface
captures and evidence boundaries. The checklist areas below were re-exercised by
the complete suite; portal/Vault controller capture and browser result/retry gates
were rerun. No new long-run native-pointer portal soak is claimed.

## Historical pre-extraction verification (2026-11-17)

- `npm test`: **298 passed, 0 failed** (59.7s).
- `npm run build`: **405.28 kB**, gzip **181.33 kB**, single-file verifier passed.
- `git diff --check`: clean.
- Real Chromium 153 through Puppeteer, not Playwright: end-card layout at
  **1280×720**, **550×720**, **860×440** passes viewport/button bounds, no panel
  scrolling, Retry transition, and zero page JavaScript errors.
- Browser layout test additionally makes the stroke panel visible and inserts a
  six-digit score. This is a layout stress fixture, not an earned gameplay score.
- `node scripts/capture-vault-qa.mjs`: 3/3 → portal → Vault → permanent halo,
  +30 ink → BANK & END passes. This controller/canvas check is not a native
  browser mouse-driven portal playthrough.

## Checklist and evidence boundaries

| Area | Implemented | Evidence |
| --- | --- | --- |
| Two-column, zero-scroll result | Score/rank/stroke left; quests/prize/actions right | Real-browser bounds/scroll/retry checks at the three sizes above; inspected captures |
| Quest and prize accounting | Completed = DONE + points, no KEPT; unfinished per-ID half carry; saved meter; picker stripes; four prize options | `test_end_card_quest_and_prize_math`, quest ledger and UI tests |
| Practice reset / sectors | Clears run history, best stroke, counters, velocity/speed history; stable numbered sectors; quest text starts AT 01/03 | Run/quest tests; browser result captures |
| Local radar | Compact range, player at 75%, camera footprint, typed/color contacts, clamped portal, HUD-aware overlays | `test_minimap_enemies_and_portal_bounds`, radar and pixel tests |
| Spawns | Radius+28 inset, HUD/player/enemy clearance, side containment, watchdog, long sector bands; unsafe first camera entries recycled without teleporting | `test_spawn_safe_zones_and_side_containment`, first-entry regression, frame-jump checks |
| Aim and combat readability | Post-magnet vector retained; Matter-order free-flight integration including launch/speed limits; solid cutting part and dotted tail; target immunity; shield/Crown separation; 27-tick fatal spotlight; subdued scenery | Launch integration, combat, pixel, overlay and named acceptance tests |
| Movement | −22 floor kick, one edge, 12-tick cooldown; Matter API enforces fall/ascent caps; deliberate aim at 10% time; launch zeroes old velocity; bounded airborne dash and five-tick recovery; 8-tick wall cooldown; displacement speed average | `test_floor_trampoline_and_speedo`, physics, drawn-body and run tests |
| Impact feedback | Multi/boss beam; entity-only stop; world-only trauma² shake below .6°; pentatonic C–D–E–G–A chain notes | Impact-limit, shake, audio and existing combat/render tests |
| Portal / Vault | Single portal, current view placement, dash refill, cleared doorway, local radar/arrow; Force scene bestows selected permanent item; Keep/Bank resets input | `test_portal_to_vault_bestowal`, Vault capture/controller exercise |

### Important qualifications

- Preview/launch error was below **1e-6 px** for four magnetized free-flight
  launches over 30 physics ticks (measured worst: **9.481e-11 px**). A separate
  30-tick test covers ordinary post-tick speed limits. Moving enemies, gravity
  wells, future hitstop, automatic breath/panic pacing and later rewards are
  dynamic events; the preview does not promise their future outcomes.
- Spawn evidence is deterministic coverage, not a proof over every possible
  procedural seed. Tutorial's pinned teaching targets are intentionally exempt
  from live-arena spawn exclusion rules.
- Airborne dash deformation is bounded; deliberate landing and wall-impact
  splats remain distinct animations, not a permanently stretched travel pose.
- Frame-test hyper coverage now uses an explicit fixture rather than depending
  on a bot organically earning hyper under each spawn policy. Mixed idle/lunge
  p95/p50 is not a smoothness metric; frame regressions bound actual jumps and
  separately verify interpolation and camera pinning.
- Browser verification closes the previously reported missing-library blocker.
  It does not substitute for human audio/feel playtesting or exhaustive mobile
  device testing. No full native-pointer portal-to-Vault browser run is claimed.
- Optional DimensionShatter remains deferred per the earlier core-first scope.

## Reproduction

```sh
npm test
npm run build
CHROME_BIN=/path/to/chromium node scripts/master-browser-qa.mjs
node scripts/capture-vault-qa.mjs
```

Browser requirements are an installed Chromium executable and its shared
libraries. This sandbox used Chromium's packaged AL2023 NSS/NSPR libraries via
`LD_LIBRARY_PATH`; no system packages or persistent browser dependencies were
added to package.json. Captures and metrics are ignored under
`.arena/master-browser/`. Only the unified development server on port **3000**
remains running.
