# Review guide: combat presentation and inverted PC controls

## Start here

- [Current inverted controls, rebounds and morphing review](inverted-controls/review.md)
- [Exact current validation results](inverted-controls/validation.json)
- [Ordinary production-game observations](inverted-controls/play/results.json)
- [Ordinary production-game recording](inverted-controls/play/gameplay.webm)
- [Previous direct-aim experiment, explicitly superseded](pc-controls/review.md)

## Scope

This branch accumulates the in-game item/build presentation, shop refinement,
combat/dash/power correlation, protected chromatic optics, onboarding and desktop
control work completed after the previous merged shop PR. The current mouse
contract is an inverted distance-powered left drag; Shift+click is the explicit
separate direct-shot shortcut. Holding a stationary left press does not charge
or fire. Touch and keyboard remain supported.

The rebound changes preserve downward tangent on side-wall arrivals and separate
physical reflection from reward cooldowns. Contact-driven material contours and
wall folds follow measured entry/exit velocities. Composed body deformation is
bounded, including overlapping splat and dash layers.

## Evidence packaging

All source changes, regression tests, QA scripts, written reports and structured
JSON results are included. The current `inverted-controls` evidence and previous
`pc-controls` comparison evidence include their screenshots and recordings.

The larger historical generated capture collections (thousands of images,
self-contained HTML exports, PDF exports, videos and compressed review packages)
are intentionally not added to Git. They remain in the development workspace;
the corresponding QA/capture scripts are included to regenerate them. Historical
reports and JSON files can reference assets from those local collections. Treat
historical reports as observations at their recorded stage, not acceptance
criteria for the current mouse contract.

Validation reports saying “no commit or push” describe the implementation stage
before the later explicit request to publish this pull request.

## Validation

- Latest full regression run: 1,538 passed; zero failed, cancelled or skipped.
- Final focused regression selection: 84 passed.
- Current desktop browser input fixture: 20 passed.
- Actual-physics rebound/morph browser frames: 25 passed, including reduced
  motion, PostFX Off, bounded body deformation and read-only drawing checks.
- Normal production Start Run controls: seven cases passed, no page/frame errors.
- `npm run build`: single-file output, 1,342.2 KiB, gzip 494.88 kB.
- `git diff --check`: passed.

The ordinary recording is a short controls check, not a human usability study or
performance benchmark. Its latest run has four shots and zero kills; successful
input admission is not represented as guaranteed target acquisition.
