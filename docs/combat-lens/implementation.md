# Combat lens, focus and streak presentation

## Changes in actual play

- Baseline contrast raised to **1.085**, with a small saturation lift and controlled highlight bloom. Shadows use less desaturation/crushing than the former Gloom treatment.
- Restrained **chromatic aberration**, expressed in backing-store pixels rather than a resolution-dependent UV offset. Baseline 0.32 px; combined focus, release, streak and old impact contribution capped at 1.8 px.
- **Slight peripheral softening** using the same scene samples as the chromatic split. Baseline blur control 0.14, focus adds up to 0.42. This is a small three-sample softening, not full-scene Gaussian depth of field or motion blur.
- Focus eases into the lens; usable focus and actual held state gate it. Actual release into a new shot adds a brief finite optical kick. Cancelling focus does not pretend a shot happened.
- Earned, unexpired kill chains of **3+** add warm grading, contrast, small bloom and finite milestone accents at 3/5/7/10. No separate artificial streak counter. Chain expiry fades the treatment rather than leaving a permanent filter.
- World-space focus brackets, reserve arc accents and directional facets follow the real aim and focus reserve. Small trailing chevrons require a real live chain and actual movement. These vector accents work even when GPU post-processing is Off/unavailable.
- The old held-focus dark wash was reduced so the new processing does not stack into an unreadable black edge.

## Readability and rendering budget

The shader still has **exactly three scene texture reads**, one upload, one draw, no extra framebuffers and no shader loops. Chromatic splitting and mild softening share those reads.

The hero's vicinity, active aim segment and up to eight prioritized visible actors/hazards receive spatial protection from blur/fringe. Red/pink danger and bright projectile pixels have an additional color/value protection gate, including outside those eight actor masks. Protection is a readability heuristic, not a proof every possible attack telegraph pixel is untouched. Peripheral scenery gets the strongest effect; central action gets little or none.

DOM HUD and SVG input graphics are outside the pass and remain sharp/ungraded. Canvas-rendered widgets such as the minimap remain part of scene grading. The presentation is not a promise of cinematic blur selectively reconstructed behind every actor.

`Auto / On / Off` remains the existing setting. Low-memory/low-core Auto and unavailable WebGL preserve the raw 2D canvas. Off restores source opacity and clears lens state. Context failures preserve the source and expose a diagnostic failure reason. No new dependencies or external image assets.

Reduced motion retains a modest static grade but removes the new chromatic split, softening, grain, focus/streak pulses and streak movement accents. Legacy impact/flash permission still follows its existing motion/shake gate. Focus/streak lens grading is not coupled to the full-shake setting. No added full-screen flashes or camera shake.

## Ownership and clocks

`src/combat-postfx.js` projects read-only run state into bounded uniforms. State changes occur on renderer ticks; reads/draws do not change envelopes. All run mechanics, focus drain, aim prediction, chain scoring/windows, damage, ownership, settings persistence and saves retain their existing authority. Reset/field transition clears both impact and combat-lens envelopes. Menus/title do not receive the gameplay lens pass.

Protected actor projection copies positions into eight vec3 uniforms, prioritizing hazards and telling/rushing enemies. Aim protection is based on the actual input vector, not a fabricated target or hit. The new canvas painters remain in the standalone import-free art engine.

## Verification and evidence

- `test/combat-lens.test.js`: bounds, contrast, focus entry/cancel/release, true live-chain gating, finite milestones/decay, reduced motion, actor/aim projection, shader read budget, Off/unsupported fallback, vector painter gates and canvas-state restoration.
- Existing portability and performance tests remain intact, including the three-source-read shader contract.
- `play/`: **ordinary main.js Start Run**, free starter gear, actual mouse/Shift inputs. Read-only debug/trace aids aim and timing; tutorial completion and PostFX On preferences are seeded. Equipment saves are asserted unchanged. Video captures the actual WebGL output canvas; screenshots include the DOM HUD. This is automated play plus visual review, not human playtesting.
- `gpu-checks/*-off/idle/focus/release/streak.jpg` and `gpu-checks/browser-results.json` (additional full-resolution reviewed captures also at the root): **controlled native createRun/createRenderer** fixtures exercising actual WebGL compilation, pixel readback, mode fallback, focus API, native accepted kills, reduced motion, draw immutability and cleanup. Focus envelope samples use presentation ticks with the simulation held fixed; chain is earned through accepted primary-contact fixtures, not by assigning a chain scalar. The fixture page blocks the main entry module to avoid running a second game loop behind the test; it still imports and exercises the real run, renderer and WebGL pass. Final matrix uses full backing resolution (`backingScale: 1`). Not ordinary progression or a mobile-device performance benchmark.
- Shader tests use software WebGL in headless Chromium. Shader validation and slow software rendering are not hardware FPS certification. See `validation.json` for executed results and any remaining limits.

Reviewed frames include desktop idle/focus/streak and portrait ordinary-focus captures. Scenery edges visibly separate during focus; actor/aim silhouettes remain legible. Existing stacked hit effects can still be busy during multi-kills; the optical pass does not solve every combat VFX issue.

## Reproduce

```sh
node --test test/combat-lens.test.js test/web-performance.test.js test/art-engine.test.js
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/combat-lens-play-qa.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/combat-lens-browser-qa.mjs
npm test
npm run build
```

Browser scripts default to port 5201 and the environment's test Chromium binary. Software-GPU fixture captures can be slow. No commits or pushes were made.
