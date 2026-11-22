# Effects Chunk C: Wake Separation

Replaced repetitive high-speed field dust threads with two unequal background laminations. Low-speed movement retains one quiet crease rather than three threads and an extra reflection seam. This is not an additional actor ribbon, actor copy, camera warp or screen-copy effect.

## Bounds and comfort

- Separation requires measured speed >=28 world pixels/tick. Field sampling now uses min(velocity magnitude, actual displacement / simulation time), preventing blocked velocity from producing a fast wake.
- Only the newest three samples render; existing emission interval and capped simulation buffers remain. Each separation expires after 18 ticks and stays at least 32 world pixels behind its sample, in two narrow lanes beside the travel axis.
- Unequal lengths, a dark underside and a restrained paper edge unify with Frame Bite without resembling another cube or a combat hit.
- Reduced motion draws no wake separation. Screen Shake Off disables it explicitly through a render option. Other event feedback is unchanged.
- No imported art, pixel readback, canvas copy, filters, RNG, gameplay mutation or new resource/reward mechanics. All drawing remains inside the portable shared engine.

## Validation

- 541/541 full Node tests pass.
- Five new tests cover speed/direction/local bounds, context restoration, reduced/disabled/expired/invalid samples, no emission from blocked velocity or pause, newest-three limit, immutable data and explicit field-render suppression.
- 16 actual-run movement browser scenes: low/fast × four sizes × full/reduced. Measured fast wake samples, visible actors, immutable drawing and zero page errors. Phone fast/full capture inspected; narrow background laminations stay behind the cube rather than covering its silhouette. Script: scripts/wake-separation-browser-qa.mjs. Captures: .arena/wake-separation/.
- 24 clean-bank regression scenes and eight zero-cut platform mouse/touch release regression scenes pass.
- Single-file build passes: 729.67 kB, gzip 286.61 kB.
- Logs: .arena/icons/wake-separation-{tests,build,browser,banks,pulls}.log.

No physical-device performance/comfort or human recognition claim. The effect is intentionally subtle; browser captures are deterministic QA scenes, not live user sessions.
