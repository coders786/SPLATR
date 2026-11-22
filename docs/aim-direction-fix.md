# Direct aiming direction fix

The reported left/right reversal came from gameplay using a backward-pull/slingshot mapping. The sandbox already used direct targeting, making the gameplay mapping especially surprising. The preceding aim/reward upgrade preserved that legacy mapping; this correction intentionally replaces it.

## Behavior

- Drag left → launch left; right → right; up → up; down → down.
- Diagonals preserve both signs. The shared final vector still feeds preview and release.
- Retains the existing dead zone, power curve, display-size normalization, optional assistance, captured primary pointer, return-to-origin cancellation and short refused-shot buffer.
- Kept the legacy physics `dragVector` helper contract unchanged. Production input reverses its arguments to reuse the power curve without reversing player intent.
- Updated the arena accessibility label, field-manual copy, spoken tutorial description, static gesture drawing, and animated tutorial hand/arrow to teach direct aiming.
- Does not change automatic floor/wall rebounds, collision, assisted tap targeting, or ready-state upward launch correction.

## Verification

- Full suite: 402/402 passing.
- Added eight-direction preview/release regression to `test/input.test.js` and corrected its old slingshot expectation.
- New `scripts/aim-direction-browser-qa.mjs`: 16 native Chromium gestures (eight directions × mouse/touch), through production `createInput`, production `run.dash`, and actual Matter velocity. Asserts velocity signs, preview/release equality and exactly one shot. This isolated fixture disables assistance and uses an airborne playing state to isolate directional mapping from target snaps and surface rebounds; it is not a touch-device combat soak.
- Existing rewards/aim real-game browser fixture passes at four viewport sizes.
- Build and single-file verifier pass: 522.76 kB, gzip 224.72 kB.
- `git diff --check` passes.

```sh
node --test test/input.test.js test/launch-agreement.test.js test/physics.test.js
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/aim-direction-browser-qa.mjs
```

Use the existing united server at port 3000. Local detailed gesture evidence: `.arena/aim-direction/report.json`.
