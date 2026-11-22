# Standalone art engine and layout verification

Verified 2026-11-17 on the active Arena branch.

**Later artwork revision:** see [graphics-upgrade.md](graphics-upgrade.md) for
the current visual changes, fresh screenshot inspection and final build/test
evidence. The measurements and contract documented below remain applicable.

## Source of truth

`src/art/splatr-art-engine.js` is the complete, readable, standalone ES module.
Its opening JSDoc defines contract v1, coordinate systems, clock units, each
public spec, preview snapshots and returned objects. Edit this file directly;
there is no build-time dependency on the former art modules or extraction
scratch files. Consolidated section headings identify the original concerns.

The file has **no imports**, DOM measurements, browser globals, storage access,
asset loading, networking, Matter dependency, or writes to gameplay physics.
It can be imported from a `data:` URL without any adjacent files. Stateful
controllers own visual history only: camera, shake, particles and the isolated
preview toy. `evaluatePreviewPose` copies input snapshots before commands or
stepping; it never advances the real game.

### Public drawing contract

- `drawCubeHero(ctx, spec)` — shared comic hero, all equipment, Spark/Apex
  layers, shared CORE hues, chain/overdrive intensity, cloth/chain/gaze/blink.
- `drawShopCardArt(ctx, width, height, spec)` — tab-specific framing, selected /
  hovered motion, reduced motion, optional locked Codex silhouette.
- `drawSlashEffect(ctx, spec)` / `drawEnemyShape(ctx, spec)`.
- `drawWorldBackdrop(ctx, width, height, worldId, time, camera)`.
- `drawBestStrokeMini(ctx, width, height, strokeSpec)` — returns the accessible
  stroke description; it does not set attributes.
- `evaluatePreviewPose(mode, time, pointerState, spec)` — pure autoplay pose,
  dummy target and optional copied manual state after aim/fire/reset/step.
- `drawPreviewScene`, `drawFieldSpecimen`, `drawVaultScene`, `drawForcePreview`.
- `createArtRenderer(ctx, viewport)` — complete live-game Canvas composition
  with a per-surface visual controller.
- `ITEMS`, `SLOTS`, `HYBRIDS`, `SPARKS`, `MUTATIONS`, `corePalette` — shared
  catalogue/recipe/palette data. Catalogue prices are display data only;
  ownership, purchases, saves and combat rules remain outside the engine.

`legacy_*` namespaces preserve existing imports/tests without duplicate
implementations. Old art files are re-export adapters. All Canvas path/paint
instructions now live in the engine, including title scenery, quest parts,
Vault composition, best-stroke prints, manual specimens, live arena effects,
forge/fusion overlays and locked recipe art.

## Browser/game boundary

- `renderer.js`: context acquisition, bounding boxes, DPR/backing dimensions,
  ResizeObserver, CSS HUD inset measurements, scene dataset and disposal.
- Viewport publication to `run.setView` was moved OUT of the renderer core and
  into this browser adapter. The engine returns `viewSnapshot()` instead.
- `customize.js`: DOM, wallet/save actions, selection, browser pointer delivery
  and clocks. Drawing routes directly through the engine facade. Preview
  choreography and the manual toy implementation live inside the engine.
- `field-guide.js`: gets the context/size and delegates to `drawFieldSpecimen`.
- `print.js`: delegates to `drawBestStrokeMini`, then sets its returned aria-label.
- `quest-ui.js`: owns quest transactions and UI, delegates all Canvas drawing.
- `aim.js`: retains gameplay-owned panic/slow-time state changes; read-only
  prediction and speed colors are supplied by `aimVisuals` in the engine.
- Browser DOM/CSS UI layout and SVG button/connection markup remain UI-owned.

The engine carries read-only analytic launch sampling and visual normalization
constants, not a physics simulator. A parity test compares its predicted path
with gameplay `releaseSamples` for multiple velocities and clamp/ceiling modes,
so future gameplay changes cannot silently drift the standalone picture.

## Layout gate and direct screenshot inspection

The real seven 38 px slot buttons are above the left grid on desktop; compact
landscape uses 32 px buttons. First row is not cropped, and two complete rows
fit the measured desktop grid. Recipes, actions and preset/save/randomize
controls remain in bounds and on their intended rows. Footer reads
`INSPECT • ITEM NAME — Short tag`; no rounded-down formula is used there.

Chromium measurements from the final single-file production artifact:

| Viewport | Live canvas CSS px | Sidebar overflow | Outer overflow |
| --- | --- | --- | --- |
| 1280 × 720 | 447.203 × 279.5 | 0 | 0 |
| 1024 × 720 | 349.609 × 218.5 | 0 | 0 |
| 550 × 720, preview pane | 482 × 301.25 | 0 | 0 |
| 860 × 440 | 314 × 195 | 0 | 0 |

Phone portrait intentionally keeps the existing Shop / Live Preview pane
switch rather than squeezing both columns into an unusable width. The 16:10
canvas and all preview controls are visible in its preview pane.

Read directly after extraction: production desktop/head, portrait preview,
compact landscape, mid-slash, live-game cube/Fang, Crown Field Manual specimen,
and the real Best Stroke adapter fixture. Evidence is regenerated under
`.arena/comic-gate/`, `.arena/art-engine-browser/`, `.arena/master-browser/`.
These screenshots are local QA artifacts, not checked-in game assets.

## Current verification, not historical totals

- `npm test`: **366 passed, 0 failed** (83.24 s). Includes floor/trampoline,
  single-portal/Vault/quest settlement and the named master acceptance tests.
- Five new standalone-engine tests cover portable data-URL import, absence of
  Canvas drawing outside the engine, deterministic immutable preview
  transitions, every catalogue item, context/spec preservation, main-game
  snapshot preservation and real launch-sampling parity.
- The source-location font/clip/floor-flash guards now inspect the engine, not
  the browser adapter; HUD measurement guards still inspect the adapter.
  Assertions were retained, not skipped.
- `npm run build`: **502.43 kB**, gzip **216.23 kB**; single-file check passed.
- `scripts/comic-layout-gate.mjs`: dev AND immutable production, all seven tabs
  plus 1024×720 / 550×720 / 860×440 responsive cases passed.
- `scripts/lab-input-browser-qa.mjs`: reduced-motion manual dummy cut, origin
  lock, Space from visible pose, cancellation, focus and try-on behavior passed.
- `scripts/master-browser-qa.mjs`: end card / buttons / retry / zero panel
  scrolling at 1280×720, 550×720, 860×440; zero page errors.
- `scripts/art-engine-browser-qa.mjs`: eight actual Field Manual specimens,
  native live-game capture, and real Best Stroke drawing/aria-label adapter;
  zero page errors. Best Stroke is an explicitly labeled rendering fixture,
  not a claim of an organically earned run.
- `node scripts/capture-vault-qa.mjs`: real controller/canvas flow 3/3 → portal
  → Vault → permanent halo +30 ink → BANK & END passed. This is not a native
  browser pointer playthrough.
- `git diff --check`: clean.

No new 20-minute soak or exhaustive native-pointer floor/portal playthrough is
claimed for this extraction. Earlier endurance totals are historical only.

## Reproduce

Use the one united Vite server on port 3000. Do not start extra servers.

```sh
npm test
npm run build
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib CHROME_BIN=/tmp/chromium node scripts/comic-layout-gate.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib CHROME_BIN=/tmp/chromium node scripts/lab-input-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib CHROME_BIN=/tmp/chromium node scripts/master-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib CHROME_BIN=/tmp/chromium node scripts/art-engine-browser-qa.mjs
node scripts/capture-vault-qa.mjs
```
