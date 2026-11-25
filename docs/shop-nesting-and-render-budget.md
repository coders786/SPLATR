# Nested shop and bounded rendering

## Shop navigation

Four top-level families replace the flat eleven-slot strip:

- **Cube** → Head, Eyes, Shell, Core, Tail
- **Attack** → Blade FX, Dash FX
- **Aim & Scan** → Aim mark, Radar, Flight path
- **World** → Arena

Only the current family's slots are visible. Availability filters are All items,
Owned, Can afford (excludes challenges/already-owned parts), and Challenges.
Breadcrumbs show family, slot, and owned count. Each item retains its actual
benefit, trigger, credit price, and explicit Buy/Equip action. Wallets, unlocks,
purchases and equipment saves are unchanged.

The default preview is one large, three-second READY → TRIGGER → RESULT study,
not many competing animations. It uses the selected item's material/silhouette
and labelled benefit gauges. Blade/dash/aim/sensor slots retain specialized
studies. These are explanatory illustrations, not measured combat replays.
Practice remains optional. Reduced motion displays a stable result pose.

Thumbnails use a 20-entry/1.6-million-pixel LRU cache. The visible shop paints at
most 30 times/second; the closed shop and closed sword desk stop their RAFs.
The idle demonstration no longer ticks the sandbox simulation. Cache surfaces,
ResizeObservers and owned dialogs are released by dispose().

## Engine adaptation, not a Phaser migration

The game uses Canvas2D and Matter, not Phaser. There is no camera PostFXPipeline,
Phaser Group, WebGL sprite batch, or Scene shutdown event to configure. Adding
Phaser only for those API names would require an unrelated renderer/lifecycle
migration. This implementation keeps the existing simulation and portable art
engine, with an optional browser-boundary WebGL compositor.

### Single-pass lens

`UberPostFX` owns one texture, one quad and one draw call, with **exactly three
texture2D calls** per fragment. No offscreen framebuffer chain or stacked
bloom/vignette/chromatic passes. One Canvas-to-texture upload is needed per
rendered gameplay frame. Controls include scanline tears, radial RGB split,
shadow desaturation, highlight amplification and player-focused vignette.
Highlight amplification is not spatial bloom. Small additive halos are separate,
pre-baked radial sprites around equipment projectiles/echoes.

`triggerImpactFrame(durationMs)` drives thresholded inverted/normal black and
white. The default is four **60Hz simulation ticks** (2 inverse, 2 normal), with a
90-tick retrigger lockout. This is not a guarantee of four displayed refreshes on
an overloaded device. Existing qualifying dimension impacts invoke it. Reduced
motion and Low/Off shake suppress the shader impact/glitch. DOM HUD stays crisp
and outside postprocessing. Unsupported/failed GL falls back to the original
Canvas, and forced context loss/restore rebuilds resources.

Options: **Auto / On / Off**. Auto requires both deviceMemory > 2GB and
hardwareConcurrency > 2; missing hints conservatively disable it. Explicit On
allows comparison. Off releases the GL surface/resources. This is intentionally
not enabled on the target 2GB Android by default: a Canvas upload has a real cost.

### Pixel, cache and cosmetic budgets

- Main Canvas backing store: DPR <= 1, at most 921,600 pixels, independent of
  CSS dimensions, world coordinates, input mapping and DOM text.
- GL requests high-performance power preference, antialias/depth/stencil off.
  Canvas vector antialiasing remains browser-managed; this is not a Phaser
  antialias/roundPixels/batchSize setting.
- Distant towers and near gantries are raster baked at half art resolution into
  a 24-entry/2-million-pixel LRU. The middle freight machinery retains its existing
  fine-grained viewport checks/vector rendering. Not all scenery is baked.
- Real stationary view regression: 13 surfaces allocated on warmup, no new ones
  on repeated draws, 1,086,552 cached pixels (960×540, seed 19). Full-size initial
  tiles thrashed the cache; half-size bakes fixed that specific issue.
- Cosmetic spark/dash-dust pools preallocate 30/90 primitive-only objects with
  stable shapes. Reset/dispose reclaims them. Pool exhaustion replaces oldest
  cosmetics, never drops a gameplay attack. Existing other effect caps remain;
  this is not a claim that all game allocations have been removed.
- Render-only visibility metadata refreshes at 100ms with 100-world-pixel
  padding. Moving entities/camera and large bosses receive immediate bounds
  validation, so fast entrants do not disappear between refreshes. Offscreen
  enemy art does not run. Existing larger warning margins remain intact.
- **Physics, AI, enemy IDs and gameplay projectiles are NOT frozen or pooled.**
  Offscreen suspension/body reuse could change pursuit, collisions, sensor
  warnings, timers and wave progression. Those need a separate simulation-owned
  design, not a render-loop optimization. The 100ms helper is not a promise that
  all moving-entity bounds checks now run only every 100ms.

## Browser lifecycle

Hidden tabs stop the main frame loop and suspend audio. Suspension reasons
(hidden tab, page lifecycle, GL context) compose so clearing one does not override
another. User gesture unlock is retained. Queued hit cues are discarded while
suspended/disposed. Context loss pauses gameplay safely, with the 2D fallback
still visible; restored graphics do not auto-resume a player's paused run.

Non-BFCache pagehide disposes main input/run, shop, practice/teaching renderers,
wave UI, receipts, audio and GL/cache resources, and clears tracked feedback
timers. BFCache pagehide preserves objects; pageshow resets clock debt. The main
module is still a page-lifetime singleton, not an embeddable remountable Scene.

## Validation and remaining performance work

- Unit coverage: taxonomy partition/icons, exact filters, classification,
  reduced motion, every item study, LRU bounds/release, shader sample count,
  capability gate, impact timing, resolution limits, pool reuse, moving-entry
  culling, cache no-thrash, audio suspension and gameplay-state immutability.
- `scripts/shop-release-qa.mjs`: native purchase/equip/persist/run/end/retry flow
  at 960×540, 640×360, 390×844 and 844×390.
- `scripts/shop-nested-qa.mjs`: every family/slot, filters, optional GL gameplay,
  pixel orientation, four-tick uniforms, forced GL loss/restore and cleanup.
- Browser captures/results are generated under ignored `.arena/`, not shipped.
  Browser harnesses use controlled RAF and SwiftShader for correctness, **not
  performance evidence**. Initial high-DPR software screenshot capture timed
  out; repeatable captures use deviceScaleFactor 1. DPR limits also have unit tests.

**No locked-60-FPS claim.** Real 2GB Android and low-end Chromebook CPU/GPU,
thermal throttling, frame-time percentiles, GC, and memory still require on-device
profiling. This change does not establish Poki Inspector compliance or release
approval; see `platform-readiness.md` for the remaining platform work.

### Recorded validation for this change

- Full Node suite: **966/966 passed** (115.9 seconds).
- Standard and Poki-mode production builds passed single-file bundle checks:
  1,004.87 kB raw / 371.39 kB gzip each.
- Both four-viewport native-input browser harnesses passed. The expanded harness
  also checked mobile Preview panes, zero main RAF callbacks while hidden,
  exactly one on return, BFCache object preservation, and zero callbacks/owned
  dialogs after permanent pagehide. No page errors were captured.
- Software WebGL readback verified top/bottom orientation (red top, blue bottom),
  GL error 0, impact sequence `[2,2,1,1]`, forced lost/restored notifications and
  surface cleanup. These results validate behavior, not hardware frame rate.
