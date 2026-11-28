# Five-pass visual upgrade — implemented

## Scope and boundaries
Five implementation passes on `arena/e465ea1b-splatr`, prioritizing the actual fresh-player handoff and visible world/shop changes. Existing local item-mechanics changes and profile fixtures were preserved. No commit or push was made.

## 1. The way through
- The first real run begins with an immediately playable gate.
- A real upward blade hit opens the gate and produces a local opening response.
- Fixed the missing-goal readout before Sector 01 starts.
- Verified the actual app handoff after the training bot completed all four rooms, without setting its completion flag or invoking `finishTutorial`. Both desktop and portrait captures stayed at the gate hands-off and entered play after one native upward mouse drag. No warning/error logs were recorded.

## 2. Worlds with recognizable identities
One shared landmark painter now serves actual arenas, world cards and panorama previews:

| World | Landmark |
|---|---|
| Twilight | Monumental turbine and suspended industrial bridges |
| Tokyo | Ringed moon, antenna towers and rain-lit rooftops |
| Foundry | Suspended crucible and glowing pour |
| Manga | Paper panels and an ink sun |
| Synth | Striped sunset and luminous arches |
| Void | Eclipse and broken orbital ribs |

Landmarks are decorative, not collision surfaces. Existing world-item perks remain intact: Tokyo’s high-speed score bonus, Foundry’s armored-kill bonus, Manga’s multikill bonus, Synth’s focus recovery and Void’s boss-score bonus. Default-world anchors/seals retain their real unlocking rules, with stronger gold/three-mark presentation.

During QA, the shared landmarks were moved into the common backdrop path so cached gameplay and public previews agree. Portrait composition now uses uniform scaling rather than stretching circles into tall ovals. The existing scenery draw-work budget still passes.

## 3. Armory storefront
- New gold/teal Field Supply identity, clearer category hierarchy and selected-product shelf.
- Larger item canvases, a fitted product portrait and explicit **TRY IT / OWNED / EQUIPPED** labels.
- Prominent **SEE IT IN ACTION** / **TOUR THIS WORLD** controls.
- District introductions give each world a destination name and a concise visual description.
- Portrait browsing preserves readable controls; short landscape puts the selected-item decision shelf beside the scrollable catalogue.

Screenshot review caught cropped item canvases and a broken short-landscape grid. Both were corrected. Catalogue art uses contain rather than cover; short-landscape inspection controls stay inside their panel.

## 4. Appearance → power
- The selected-item action control opens the correct existing ability/world study and exits manual practice mode.
- New **COMPARE** view shows the currently equipped part and selected preview side by side, fitted to the build, with factual short benefits.
- Comparison is stationary, noninteractive and read-only. Hovering another card cannot silently replace the selected comparison.
- Existing appearance/use/limit explanations remain visible. Comparison does not fabricate combat outcomes or grant new perks.
- Previewing, comparing, buying and equipping remain distinct operations. Buying still does not equip automatically.

## 5. Integration and visual evidence
Open [`five-pass-visual-evidence/index.html`](five-pass-visual-evidence/index.html) for the before/after gallery, all six worlds, mobile/landscape shop screens and selected training-handoff frames.

### Checks
- **Full suite: 1,405 passed, 0 failed.** The first full run exposed six backdrop parity/budget failures; those were fixed rather than relaxing thresholds.
- **Final focused regression: 85 passed, 0 failed**, covering shop, worlds, continuous sectors and the new presentation tests after the landmark composition correction.
- **Seven browser layout/motion cases passed:** 1280×720, 960×540, 640×360, 390×844, 844×390, 320×568, plus reduced-motion portrait. Each browses all 17 assembly examples, verifies read-only storage behavior, buys then separately equips Iron, and checks that saved equipment reaches an actual run. No page/frame errors.
- **Four additional visual QA cases passed:** desktop, portrait, short landscape and reduced-motion portrait. Verified action-preview routing; still comparison; hover-stable comparison; unchanged saved equipment and wallet. Captured **18 final shop/world screenshots**.
- **84 normal-clock post-training frames captured** across desktop and portrait. Eight representative frames and complete state/timing metadata are retained in the new gallery. The full capture remains in the local `.arena/five-pass-final-opening/` workspace output.
- Production build and single-file bundle check passed; `git diff --check` passed.

### Reproduce
```sh
npm test
npm run build
# With the dev server on 5192 and the sandbox Chromium installation:
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/five-pass-visual-qa.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib PREVIEW_URL=http://127.0.0.1:5192 node scripts/assembly-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib QA_OUT_DIR=.arena/five-pass-opening node scripts/post-training-player-review.mjs
```

### Honest limits
This is instrumented browser QA and screenshot inspection, not a human usability study. Training was completed by a deterministic bot. The normal-clock portrait handoff uses mouse input in a narrow viewport, not a physical phone; separate shop QA uses touch emulation. No audio assessment or FPS claim is made. The shop’s longer explanation/practice panels intentionally scroll, and comparison captions are small on narrow screens; the larger DOM ability explanation remains available below them. Existing unrelated local item upgrades are not attributed to these five passes.
