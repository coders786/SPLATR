# Quest → Portal → Vault loop

## Implemented

- A pre-run 3-column picker with one choice per tier per category. Defaults are
  already selected; Space starts immediately. New menu visits roll new offers;
  death retries keep the same ticket selection and bypass the picker.
- 14 short quest definitions, 10/25/60 points, 360 for three hard selections.
- Prize previews use the same cube and part geometry as the Vault/live renderer.
  Prizes are cosmetic: GOLD HALO, PRISM WINGS, CUBE CROWN, then INK CHEST.
- Three compact bars are appended below the score's existing form readout.
  Individual completions chime and flash locally; the final unfinished bar pulses.
- All-complete opens one permanent portal in the current view's upper-middle,
  refills three cuts and slows simulation for a half-second reveal. Portal radius
  is 134 world units (twice Crown radius), with a clamped radar ring and edge arrow.
- Existing enemies/hazards are cleared near the doorway. The central combat spawn
  path relocates new enemies away; damage is refused within the doorstep circle.
- Touch enters a full-screen canvas sanctuary, with geometric guardian, shared
  cube art, beam, descending selected part, sparks and chime. No claim dialog.
- Bestowal persists the exact chosen part and quest-point currency once only.
  KEEP GOING advances to the next band, refills cuts/focus, and gives return grace.
  BANK & END returns to the menu. No second portal is possible on the same ticket.
- A two-column result page separates the existing recap from quest bars, animated
  count-ups, near-complete badges, striped Head Starts, spill sparks, NEXT PRIZE,
  RETRY SAME QUESTS and CHANGE QUESTS.
- Save data is under `riot.quests`. Head Starts are keyed by quest ID, never slot.
  Each keeps half the best result, capped at floor(goal/2), never accumulated.
  One-step quests consequently keep zero: carrying their only step would finish
  them automatically. Inherited progress cannot be repeatedly cashed out.
- Tutorial events are excluded; timers advance only on live, unpaused game ticks.
  Double/triple cuts count once per stroke. Bounce pairs must share a 30-tick
  bounce window. Timed/streak Head Starts reduce the work in the next run too.
- Selected SMASH species are replenished every 240 live ticks if insufficient
  targets are nearby, including hard species before sector 04.
- Menu transitions reset input; Vault return restores keyboard focus to the arena.

## Explicit economy choices where the blueprint left amounts unspecified

- INK CHEST: 100 ink. All-hard bonus chest: another 100 ink, on top of 360 points.
- Cosmetic unlock thresholds from death spill: 180 / 300 / 480 points. Successful
  portal entry grants the selected cosmetic immediately, irrespective of threshold.
- Death spill is proportional to newly earned progress and tier points, rounded
  down with a minimum of one point for any positive newly earned progress.
  Previously carried progress yields no additional spill.
- With all parts owned, each 100 accumulated spill points yields 100 ink.
- Cosmetics are automatically equipped; there are no hidden combat stat changes.

## Verification and limits

`test/quests.test.js` tests the pure ledger, payout idempotence, exclusions, clocks,
carry limits, streak carry, hard bonus and real-run doorstep/continuation behavior.
`test/quest-ui.test.js` uses Happy DOM to exercise picker → HUD → repeated deaths →
portal → Vault → KEEP GOING. Canvas and Web Animations are stubbed in that test.

This is NOT real browser visual verification. Chromium is not installed here.
Two-column fit, half-screen/fullscreen spacing, portal readability, animation
quality and audio still need eyes-on playtesting. No claim of zero overflow or
sub-500ms restart latency is made from DOM tests. The old fast-fall test used
invalid direct body-position mutation; see the correction in `docs/fix-round-status.md`.

Live development preview uses only port **3000**. Ports 5180 and 5181 were stopped.

Latest Master QA evidence and remaining limitations are recorded at the top of
`docs/fix-round-status.md`: 289 passing tests and a fresh 401.77 kB production
build. `node scripts/capture-vault-qa.mjs` additionally captures the real Vault
canvas and verifies BANK & END after a permanent halo grant; it does not verify
browser layout.


## Current verification update

See `docs/master-qa-checklist.md` for the authoritative current evidence. The
full suite now has 298 passing tests; the single-file build is 405.28 kB. Real
Chromium end-card layout checks now pass at 1280×720, 550×720 and 860×440. Earlier
notes about unavailable Chromium are historical and superseded. Sector counters
format as AT 01/03, including fresh runs with no credited sector progress.
