# Procedural wave / release chunk

- Classified gameplay pulls have a 28% launch-speed floor before adjustment/magnetism. This addresses short drags spending cuts on near-zero velocity, not all possible input failures. Tap targeting, drag-back cancellation, pointer cancellation, resource limits and overlay fresh-press guards remain.
- Actual captured mouse pointer browser checks use the production input/run/physics at 1280×720, 390×680, 860×440 and assert a consumed shot plus physical upward movement. These are not physical touchscreen tests.
- Run seeds already change at run start. Seeded encounter drafts now replace bounded numbers of light enemies with unlocked roles; baseline teaching roles, 30-body cap, five-wave Crown/breach cadence, entry grace and safe spawn spacing remain. Safe spawn cells are shuffled rather than always filling the same first rows. Next-wave brief and actual spawn use the same seeded draft.
- Offers retain three distinct category choices. Eligible simple modifiers can receive a seeded lucky improvement: speed 25%, reach 30%, blade/guard +12 ticks or score 40%. No increased drawbacks, shield inflation, permanent stacking, reroll on reopen, or paid randomness. Lucky stats are explicit both on choice cards and the active HUD. Base catalogue and IDs stay unchanged.
- Regression found canvas operations introduced by the preceding Shop pass outside the pure art engine. Moved letterboxing/fade drawing into exported drawShopDemo; customize only supplies timing/data.

## Validation

527/527 full Node tests passed. Production single-file build passed. New procedural tests cover 6,000 seeded wave drafts, actual-brief agreement, bounded counts, milestone cadence, reproducibility, 4,500 offer sets and catalogue immutability. Short-pull browser QA and required-choice browser QA passed at three viewport sizes. New short-pull unit checks cover five directions and preview/release agreement. No real-device touch/FPS or human difficulty claims.

Scripts: scripts/pull-release-browser-qa.mjs, scripts/required-choice-browser-qa.mjs.
Tests: test/procedural-wave.test.js, test/input.test.js.
Logs: .arena/icons/procedural-{full-tests,build,final-focused}.log.
