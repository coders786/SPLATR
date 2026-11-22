# Comic graphics upgrade

Implemented directly in `src/art/splatr-art-engine.js` on 2026-11-17. This is
an artwork-only revision, not a replacement of the game renderer or its API.

## Visible changes

- Cube: inset top and side planes, four cel values, heavier silhouette ink,
  fine bevel highlights and a cached procedural screen-tone lattice. All depth
  is inside the original collision-readable contour, preserving squash and jelly.
- Materials: paper shadow planes, obsidian edge catches, crystal/metal face
  depth, and shared bloodline lighting. Time CORE now uses #7ceeff.
- Equipment: outward-sweeping sculpted Viper horns, faceted crown, ear fasteners,
  five separate crystalline wing feathers and a mechanical wing root.
- Face/core: clipped moving visor reflection and a beveled recessed core socket.
- Slashes: wider length-aware crescents, stronger directional curvature,
  secondary brush arcs and style-colored endpoint shards. No broomstick bars.
- Backdrops: Void black-hole/accretion ring, stars and drifting fragments;
  Manga radial printing lines and screen tone; Tokyo moving light trails;
  Foundry hanging chains and molten channels; Twilight a glowing distant moon.
  Synthwave retains its distinct striped sun, mountains and perspective grid.
- Preview: contact shadow and a restrained perspective floor; no layout changes.

The complete export list, catalogue metadata/prices, slot IDs and recipe
metadata were compared to the pre-upgrade engine and are unchanged. The live
renderer, saves, purchases, quest rules, toy controls and physics were retained.
The engine is still standalone and import-free; all drawing remains in it.

## Verification of this revision

- `npm test`: 366 passed, zero failures/skips (90.33 s).
- `npm run build`: 507.67 kB, gzip 218.51 kB; single-file verifier passed.
- Chromium dev AND immutable-production layout gate: seven tabs, two full card
  rows, recipes, compact controls and footer; zero overflow at 1280x720,
  1024x720, 550x720 and 860x440.
- Chromium recipe/world/mode matrix: 390 renders, zero page errors or context
  transform/alpha leaks. This supplements visual inspection; it is not itself
  a judgment of visual quality.
- Manual input QA: dummy cut, reduced motion, Space, cancellation, origin lock,
  focus and explicit try-on semantics passed.
- Actual Field Manual entries and Best Stroke adapter fixture passed in
  Chromium; live game captured with both player and Fang visible.
- Result/retry layout passed at 1280x720, 550x720 and 860x440.
- Portal/Vault controller capture passed; no new endurance soak claimed.
- `git diff --check`: clean.

The first full test run found three recording-harness issues: the eye-height
measurement counted new side-plane quadrilaterals as eyes, and two minimal
contexts lacked `clip`. The eye test now selects actual eye paint while keeping
its flattening assertion; the two contexts implement the new clipping call.
The complete suite was then rerun successfully. No tests were skipped.

## Screenshots inspected

Local captures under `.arena/comic-gate/`: head, eyes, body, core, tail, slash,
world and mid-slash. Final horn/wing captures were reopened after refinement.
Also inspected the native live-game capture and the seven Apex compositions
under `.arena/art-engine-browser/` and `.arena/mutation-matrix/`.
These are QA screenshots, not imported game assets.
