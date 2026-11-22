# Industrial district world redesign

## Scope

Rebuilt the default Undercut/Twilight environment inside the single pure art engine (`src/art/splatr-art-engine.js`). The other five equipped world treatments retain their existing art. No collision, level generation, progression, save data, equipment catalogue, rewards, or combat rules changed.

## Visible changes

- Three continuous, coordinate-hashed parallax layers: distant compression towers, recessed industrial facades, nearer service gantries and hanging cables.
- Freight shutters, inset five-blade turbines, and bent conduit bays, selected by stable spatial hashes rather than flickering randomness.
- Connected structural frames, bevels, vent grilles, maintenance lamps, and pipe collars give the scene scale and depth.
- Four muted sector palettes; broad low-opacity sidelight and restrained dust. Gameplay lime, cream, and threat pink remain the strongest visual signals.
- Default public backdrop and gameplay use the same environment geometry and camera coordinates. Gameplay passes its animation time; reduced-motion mode freezes machinery and dust motion.
- Viewport culling for entire tiles and individual machinery groups. Spatial hashing supports negative coordinates and continuous travel.

## Visual iteration

The first live Chromium capture established a much stronger setting but repeated identical recessed rectangles. The second pass introduced turbine/conduit/shutter variants and narrow maintenance recesses. Inspected the live combat capture plus elevated and warm-sector camera studies directly. Kept facade colors subdued rather than introducing competing bright signage or interactable-looking decorations.

The first complete regression run exposed excessive invisible draw work: the recording-based long frame test exhausted its Node heap. Fixed this in production drawing code, not by increasing memory or weakening tests. Sampled 880x710 district views now paint 158–206 primitives, compared with 691 in the first new implementation at the origin. An explicit draw-budget regression test caps these views below 260 primitives. This measures emitted primitives, not GPU frame time.

## Verification

- Full suite after production culling fix: 393/393 passing. Subsequently added the draw-budget regression; focused world suite 5/5 passing (the additional test was not part of the 393-test full run).
- Long real-renderer frame suite independently passes 18/18, including refresh-rate/interpolation fixtures.
- Production single-file build passes: 517.36 kB / 223.12 kB gzip.
- Chromium world fixture: six camera/palette captures, repeat-render determinism, Canvas state checks, 36 parallax frames, zero page errors.
- Chromium art-engine fixture: eight Manual specimens, live game, Best Stroke adapter.
- Comic layout gate passes both development and built single-file output.
- 630-render mutation/world/mode matrix passes with no errors.
- Harmony browser checks pass desktop, 550x720, and 860x440.
- Master endcard/retry browser checks pass 1280x720, 550x720, and 860x440.

## Reproduce

Use the existing united port-3000 server. No second app server is required.

```sh
node --test test/world-redesign.test.js
node --test test/frame.test.js
npm test
npm run build
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/world-redesign-browser-qa.mjs
```

The browser fixture writes screenshots, its JSON report, and 36 individual motion frames under `.arena/world-redesign/` (excluded from source snapshots). It can optionally compare a local baseline engine with `ART_BASELINE=/path/to/engine.js`; no baseline is required for normal use. Local motion preview: `.arena/world-redesign/world-parallax.gif`. These fixtures are deterministic render studies and short browser interaction checks, not a new twenty-minute live-combat soak.
