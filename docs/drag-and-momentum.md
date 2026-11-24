# Drag input & hyper-speed momentum — CHUNK 2 fixes

Two defects were fixed together: a drag system that could drop a release or
bend its vector while the camera/zoom moved, and steering at speed that
quietly spent the momentum it was supposed to redirect.

## 1. Drag input & the coordinate system

**Pointer capture is a convenience, never a requirement.** `pointerdown` now
calls `canvas.setPointerCapture` inside a try/catch, and the off-canvas net
fires from **window capture-phase** listeners for `pointermove`, `pointerup`,
`pointercancel` (both canvas and window) and `blur` (plus `orientationchange`
and `lostpointercapture`). A fast drag that ends over the HUD, outside the
window, or mid capture-loss runs the same release/cancel path — the aim never
sticks and `state.isAiming` always returns to `false`.

**The drag vector is CSS→canvas scaled screen delta.** At pointerdown the
canvas rect and its `clientWidth/rect.width` scale are measured once and
stored on the pull session; `readGesture` multiplies the raw client delta by
that factor. World coordinates are used only for the world anchor of the
tether, never for the drag vector. Camera pans and the 1.3x arena zoom
therefore cannot bend, jitter or stretch a hold — and the headless test
`test_drag_pointer_off_canvas_and_camera_pan` proves it by panning the camera
200px mid-drag and releasing off-canvas.

**8px minimum deadzone.** `gestureSlop()` returns a constant 8px screen space
for mouse and touch (mouse was 14, touch 20). Tiny clicks cannot misfire a
launch; deliberate flicks always register. `test/gesture.test.js` pins 8px.

**The 120ms pre-reload buffer.** A dash released when the *recharge* has
fewer than 7 ticks to run (`EDGE_BUFFER_TICKS = 7`, 120ms at 60 ticks/s) is
not refused — it is remembered (`s.edgeBuffer`) and **fired on the exact
tick the pip lands** (`flushEdgeBuffer()` is called from every edge-grant
site, including the pip completion itself). The shot never fires early and
is never dropped. A dry rack with a full pip cycle to go (>7 ticks) is
refused as before. This is pip-aligned and tick-based, not a wall-clock
window; `BUFFER_MS = 140` in input.js remains only the wall-clock retry for
post-refusal game-state (recovery/hitstop), which cannot complete a pip in
time and cannot double-fire because a buffered shot returns `true` from
`dash()`. Verified by `test_drag_reload_buffer` (57/60 recharge, release,
+5 ticks, auto-fire on completion).

## 2. Hyper-speed steering preserves momentum

**`launch()` owns preservation for every launch.** It computes

```
currentSpeed = max(storedSpeed, hypot(vx, vy))
launchSpeed  = clamp(max(baseDashSpeed, currentSpeed * steerRetention), …, MAX_PINBALL_SPEED)
```

and writes `dir * launchSpeed` — the aimed heading, never overwritten with a
lower value. `steerRetention`: **1.0** at ≤75°, **1.05** when the cube already
owns over-MAX_SPEED (a bank/hyper bank-steer — banking momentum is worth a
little extra), linear fall to **0.85** at 90°, floored at **0.85** beyond.

**`MAX_PINBALL_SPEED = 320`** is the absolute ceiling on any velocity (and
the restitution rail ceiling the SHATTERED arena will use). `BASE_DASH_SPEED`
aliases `MAX_SPEED` (42) for spec traceability.

**The aim-hold drain is gone at over-speed.** The 90% fall cut
(`AIM_FALL_KEEP`) still applies to ordinary falls (÷10 vy) but is skipped
entirely when the cube's total speed exceeds `MOVEMENT.maxSpeed` — a held aim
may slow an ordinary fall, it may never spend stored kinetic speed.

**The ascent cap** (`flightEnvelope`) exempts a body whose live total speed
exceeds `MOVEMENT.maxSpeed` (and any `state.arenaMode === 'SHATTERED'`), so
upward hyper-steers keep full kinetic energy; only `MAX_PINBALL_SPEED`
bounds them. The cap still applies in the ordinary chain.

**`s.isAiming`** mirrors `s.held` (set in `focus()` and on dash) and is the
public handle the brief's `isAiming` checks read.

## 3. Verification

- `npm test`: **676 passing** (3 new: `test/drag-input-spec.test.js`).
- Chromium live pass: `qa-browser/drag-qa.mjs`, `velocity-trace.mjs`,
  `momentum-qa.mjs` — ten consecutive fast launches at 60–68 km/h dial, HUB
  release at y=24 fires cleanly, velocity traced through holds (39.35 → 38.24
  px/tick over a hold) and releases, **zero page errors**.
- `window.__riot = run` is exposed only with `?debug` in the URL or
  `localStorage['riot.debug'] === '1'` (used by the QA bots); never for an
  ordinary player.
- Note: the HUD speedometer eases and is displacement-based, so during a held
  focus it reads near zero by design — read momentum through `__riot.world.player.velocity`, not the dial.

## Consumed by Chunk 3 (SHATTER EVENT)

The `MAX_PINBALL_SPEED` cap, `flightEnvelope`'s `arenaMode === 'SHATTERED'`
branch and the `dash()` ceiling ratchet were the seams; the SHATTERED
arena, its 1.30x bumper rails and the OVERCHARGED kinetic charge are built
on them. See `docs/shatter-event.md`.
