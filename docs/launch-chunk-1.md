# Launch fix — Chunk 1: clear sightlines, title polish, obvious health, clean HUD

Scope: **Module 1** of the unified launch fix doc, plus the pieces of Modules 2–5
that are the same code path (the safety window behind the health bar, and the
plain-English copy for the world meter). Everything here is measurable in a
960×540 embed; nothing here changes controls, scoring or wave rules.

## What the player can now see

| Report complaint | Now |
| --- | --- |
| No obvious health bar; tiny pips buried in the top-centre box | A **24px segmented ruby bar directly under the score**, one block per point, with the block that broke cracking once. At one point left, the bar pulses and the screen corners glow. |
| Cut charges were 8px diamonds in the top-centre box, and running out printed `NO CUTS / RECHARGING` 900px away | The charges are **on the cube**: three chunky blocks under the player, at the player's own scale, with a white recharge fill in the next block and a red pulse when empty. A refused click **shakes a red reticle** instead of printing a sentence. |
| `2525 px/s` / `TARGET 2837+` / `HOLD PACE` / `PACE READY` / `OVERCHARGED — LETHAL` — three names for one meter in three corners | **One `RUSH` bar** with four honest states: `RUSH`, `RUSH 12%`, `RUSH READY`, `RUSH 1.5s`, plus `OVERDRIVE`. The speed figures stay in the DOM for assistive tech and the headless checks and are never painted. |
| `SHATTER EVENT` / `FAULT LINES` / `CRITICAL COLLAPSE` | **`BOSS CHARGE`**, with plain steps: *calm → stirring → unstable → collapsing*. The internal tier ids (and everything art/sound keys off them) are untouched. |
| Players cannot tell what hit them | A **red line from the cube to the exact body** that hit it, an impact ring on that body, a 25%-opacity screen-edge flash, and a 1.2s safety window (`SAFE_BLINK_TICKS = 72`) that makes a second hit inside one second impossible. The corner line is now four words: `RING HIT`, `LANDLORD HIT`. |
| Story lines and wave callouts popped dead centre over live fights | The story chip is a **bottom-edge ticker**, 13px minimum, out of the arena. The starter hint (`AIM & CLICK TO CUT`) is the same kind of ticker and retires on the first kill. |
| The OS crosshair was the aim marker | The arena hides the system cursor during a run and draws a **20px targeting ring** that pinches as the pull loads, turns red with an X when it cannot cut, and never appears on touch. |
| Title had `+300` on the key art and two doors that both opened the manual | The sticker is gone. **One practice door** (`Practice & help`), plus `Quests` (which is a different thing), `Shop` and `Options`. |

## Files

New, pure, headless-tested:

- `src/pointer-reticle.js` — the ring's geometry (pinch, refusal shake, reduced
  motion). No canvas, no DOM.
- `src/damage-feedback.js` — the hit reaction: direction to the attacker, the
  freeze/slow window, the 1.2s safety promise, the health segment model.
- `src/hud-copy.js` — every word the HUD says during a run: the RUSH states,
  the boss-charge steps, the four-word damage line, the starter hint.

Changed:

- `index.html` — hull block under the score, `#reticle`, `#damage-rim`,
  `#start-hint`, plain-English fracture mounts, one practice door.
- `src/style.css` — the hull, the rim, the ring, the RUSH bar's legibility, the
  edge tickers, and the retirement of the far-corner cut meter (kept in the DOM
  for assistive tech).
- `src/main.js` — paints the ring from live pointer + charge state, records the
  attacker of every real hit, cracks the right health block, drives the hint.
- `src/wave-ui.js` — the pace bar reads `rushReadout()`; no telemetry, no
  second vocabulary.
- `src/art/splatr-art-engine.js` — the on-cube charge readout (drawn at the
  player's scale), the screen-space hit line, and the removal of the `+300`
  title sticker.
- `src/input.js` — reports every pointer move (canvas-local CSS px) so the drawn
  ring can replace the hidden system cursor.
- `src/quest-ui.js` — `Learn` became `Quests`; the duplicate door is gone.
- `src/breakthrough.js` — the pace labels speak RUSH.

## Verification

- `npm test` — **801 passed, 0 failed**, including the new
  `test/chunk1-launch.test.js` (12 checks).
- `npm run build` — single-file build verified, 963.6 kB / 360.6 kB gzip.
- `node scripts/chunk1-frames.mjs` — rasterises the real renderer headlessly:
  charges full, charges empty (red), the hit line to a real Fang, the same
  arena after the reaction expires (nothing lingers), and reduced motion.
  Frames in `.arena/chunk1/` (git-ignored, regenerate on demand).

Not claimed: no browser was available in this sandbox, so the DOM side (the
health bar's exact rendering at 960×540, the ring over a live window) is
asserted from markup/CSS and the pure models, not from a screenshot. The
existing browser suite (`scripts/*-browser-qa.mjs`) is unchanged and still
needs a Chromium run before launch.
