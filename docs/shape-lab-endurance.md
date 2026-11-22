# Shape Lab endurance and improvement pass

## Measured sustained run

The active Chromium test completed **1203.315 seconds (20m 3s)**, not a simulated-time substitute:

- 116 completed interaction cycles / 3,828 scripted interactions.
- Zero browser page errors or crashes.
- Viewports repeatedly rotated through 1280×800, 860×440 and 550×720.
- Every cycle exercised seven slot previews/equips, five sandbox modes, native pointer aiming/release and a confirmed dummy hit, Codex opening/scrolling, randomization and reopening.
- Quest/wallet storage remained byte-for-byte unchanged.
- Collected JS heap samples: 2,568,936–3,084,744 bytes (about 2.45–2.94 MiB). These are periodic post-GC JS heap samples, not total browser memory or a proof of zero leaks.
- Sampled DOM node count stayed at 1,114 except one 1,115 sample; one document throughout.

An immutable production HTML snapshot was used so development hot-reloads would not invalidate the sustained test. Further visual/edge-case improvements were validated in a **separate final-production-build run lasting 305.103 seconds**, with 22 cycles / 748 interactions. That final run additionally exercised numbered preset save/recall. The two runs overlapped; their durations are not being added together as elapsed session time.

The initial dev-page harness was intentionally stopped after one cycle to isolate the production snapshot. The successful 20-minute report is `.arena/lab-soak/report.json`; the final-build report is `.arena/lab-soak-final/report.json`.

## Improvements made

### Input and accessibility

- Holding a pointer drag now adopts and freezes the visible automatic pose. The aim origin no longer drifts away during a long hold.
- Reduced-motion mode still runs deliberate manual dash physics, while suppressing forge animation and CSS circuit motion.
- Pointer presses focus the sandbox for Space-key firing. Space uses the visible automatic pose rather than stale simulation coordinates; key-repeat does not spam launches.
- Only the primary pointer/button can start aiming. Lost capture and cancellation clear drag state without firing.
- Letterbox-aware coordinate mapping moved into a tested pure helper; bars and zero-size canvases are not actionable.
- Non-finite coordinates are rejected and gaze/lean remain bounded when captured pointers leave the canvas.
- Late cuts now finish their hit-stop and impact lifetime even if manual motion expires on the impact frame.

### Clarity and rendering

- Explicit **TRY-ON PREVIEW** state distinguishes previewing from equipping. Switching tabs returns to the saved equipped part; previewing never silently equips or purchases.
- Selecting a card preserves keyboard focus after its DOM is rebuilt.
- Selected card borders remain core-colored while hovered, distinct from unselected hover.
- Cached preview equipment avoids rebuilding the loadout every frame. Hidden mobile shop cards and offscreen Codex studies no longer redraw unnecessarily.
- Mecha Reaper shoulder/scythe geometry extends beyond the body silhouette, fixing previously obscured mutation geometry.
- Star Eater has a dark, star-filled wing interior and constellation contour.
- Metallic materials use hard two-tone cel boundaries instead of smooth multi-stop gradients.
- No floating hologram head scanlines when the head slot is bare.
- Body, eyes and core equip snaps now participate alongside head/tail snaps.

## Verification

- Latest `npm test`: **361/361 passing**, 154.12s while concurrent endurance browsers were active. Includes the existing floor/portal deterministic tests; not a claim of a fresh manual portal playthrough.
- Latest production build: **487.38 kB**, gzip **210.70 kB**; one-file validation passes.
- `git diff --check`: clean.
- Chromium mutation matrix: **13 recipes × 6 worlds × 5 modes = 390 renders**, no transform/alpha leaks or page errors.
- Chromium catalog: all 50 choices retain unique artwork; seven actual seeded Best Stroke prints generated without page errors.
- Dedicated native-input browser checks pass: long hold, reduced-motion dummy hit, keyboard launch, pointer cancel, secondary button ignore, clean reopen, try-on distinction, focus retention and no silent equip.
- Purchase/Vault ownership/preset and end-card/retry browser checks passed at desktop, portrait and compact landscape during this pass.
- Final Harmony browser pass: main menu, seven tabs, four requested mutation slice views, Codex, Manga lab/run, manual dummy hit and responsive bounds all pass.

## Visual evidence

Opened and directly inspected the Spark/Apex mutation studies, including before/after Reaper visibility; material gallery; seeded prints; reduced-motion held aim; final-build lab and Codex; and regenerated menu/tab/compact-landscape views. Captures are under `.arena/mutation-matrix/`, `.arena/lab-input/`, `.arena/lab-soak-final/` and `.arena/harmony/`; scripts recreate them without committing large binary artifacts.

Only the existing united Vite app server on port 3000 was used. Browser automation runs have exited. Shop extras remain paused; no combat power multipliers or currency rewards were added.
