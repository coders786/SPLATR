# Power animation / mechanical correlation pass

This is a combat-art pass, not an Armory reskin. The five migrated elemental dash powers now have different temporal stories, in addition to their existing launch and material effects. No damage, selection, timing, ownership, price or save rules were changed. Tide's separate unresolved mechanical migration is untouched.

## What changed in play

| Power | New movement / timing language | Authority and limits |
| --- | --- | --- |
| Ember | Three target-attached flame curls swell toward the next burn deadline. Two small wick cells drain on the actual two-deadline schedule. Each real burn hit produces curling combustion fragments and a one-/two-flare receipt; the second hit remains visible even after the burn status disappears. | `emberBurn.born/expires/next/lastHit` and `emberHit`; a passed deadline alone never causes the actual-hit response. No trail damage or invented spread. |
| Frost | The stop collar assembles on entry. Rigid stop teeth distinguish frozen Fangs from open drag teeth on slowed heavies. A short drain seam represents remaining control; quiet broken teeth remain during actual cold immunity. Existing real-thaw breakup is retained. Combat no longer stacks FROZEN/SLOWED text over overlapping bodies. | Actual target `frostCold` phase/kind/born/until/thawedAt/immunityUntil; no active tail after thaw and no recoloring emitted hazards as safe. |
| Volt | A traveling kink and two brief beads energize only the accepted conduction lines. The damaged recipient gets detached electrical fractures plus a small backed bolt receipt. | Real `volt.conduction.arc` origin, accepted links and born/expires; maximum two endpoints including Coil. Empty links paint nothing; no recursive chain or extra target search. |
| Void | A three-part shutter folds inside the real small core as collapse approaches. Short inward folds beside actually displaced selected victims follow the latest movement receipt. A real core-hit callback adds inward-contracting shards, not an expanding damage ring. | `voidWell` fixed origin/core and actual field clock; target folds require positive cumulative **and latest-step** displacement. The outer pull boundary never becomes the damaging boundary. Empty fields may still count down, but never fabricate a hit payoff. |
| Reprise | Up to six measured path stitches light in recorded order while the delayed cut is pending. Actual replay hits produce paired torn contours at the damaged target. | The real pending path and due time; no smoothed shortcut through a wall, clone, extra blade, homing path or fabricated success on a miss. |

## Implementation

All drawing remains in the standalone import-free `src/art/splatr-art-engine.js`.

- `powerChoreography`: read-only projection of existing simulation ledgers; copies primitive positions, interpolates actor pose, culls target statuses, caps ten burn and ten cold presentations, two accepted electrical links, three moved well targets, six recorded replay vertices.
- `drawPowerClockwork`: shape-coded, screen-legible timing cues. Functional reserve/timing information remains with reduced motion; traveling beads, hit contraction and cycling motion are disabled.
- Existing `drawEmberBurn`, `drawFrostStatus`, `drawVoltArc`, `drawVoidField`: authored animation added to existing authoritative painters rather than replacing powers with a universal glow.
- `createPowerPayoffs`: renderer-owned queue, maximum **eight** receipts, **24 presentation ticks** of life. Admits only `emberHit`, `voltHit`, `voidHit`, `repriseHit` with finite copied coordinates. Launch/contact/field-open/replay-fired events alone cannot manufacture secondary-hit success. Tick, not draw, ages entries; reset/dispose clear them. Main game pause stops renderer ticks; inactive run phases do not advance the queue.
- `drawPowerPayoff`: distinct curling fire, electrical fragments, inward Void folds and paired Reprise tears, plus small shape-coded receipts. Detached fragments do not form additional hitboxes. A dark backing stroke and slight above-body offset preserve the receipt on pale armor. Reduced motion retains only the static receipt with finite fade.
- These cues paint above bodies but **below slice-safe marks and hazards**. Existing launch particles, measured wakes, build harmony, sharp focus/aim marks, post-processing modes and enemy-warning hierarchy remain in place.

There are no new imports, dependencies, retained full-screen surfaces or shader reads. The lens pipeline is unchanged.

## Visual review and corrections

The first native captures exposed two real presentation weaknesses: Frost words collided over tightly packed enemies; pale hit marks disappeared inside bright Bastion armor. Combat text was removed in favor of the new control silhouettes, and damage receipts gained an outside-body placement and dark keyline. Actual secondary hits also gained larger, element-specific rim fragments instead of relying only on tiny counter-like marks.

Candid remaining limitations: packed enemies still occlude each other's silhouettes; small timing marks are supporting cues, not giant hero effects. Actors remain relatively small against the industrial background. This pass makes timing and consequences more specific; it does not claim every effect is readable in every dense fight. The native setup deliberately places close targets and is not a difficulty or progression test.

## Reproduction / evidence

- `node --test test/power-correlation.test.js`: 12 new ledger/projection/painter/queue tests. Includes real burn, frost, conduction, well and traveled-path authorities, deadline-versus-hit distinction, boundedness, copying, expiry, reduced-motion painting and read-only draw.
- Focused regression group: new tests plus art portability, elemental stage, Ember, Frost, Reprise, Volt and Void suites.
- `scripts/power-correlation-browser-qa.mjs`: 20 controlled native run/physics/renderer timelines: five powers × desktop/portrait × motion/reduced. Seeded actors/equipment and an admitted primary contact (except Reprise's actual traveled path and a deliberately placed late actor). Reprise's late actor uses the director-placement flag so viewport safe-spawn does not move the fixture off its intended path; target eligibility and real ray-query/replay damage are unchanged. Requires actual callbacks and visible finite payoff state, read-only draw and reset. Thirty native JPGs under `native/`; `native/results.json` preserves receipt/state observations. This is not ordinary progression.
- `scripts/power-correlation-play-qa.mjs`: normal `main.js` Start Run with real pointer/Shift inputs. Default free equipment at desktop and portrait. Optional `POWER_ID` seeds only an owned/equipped save **before navigation** to review a specific purchased power without forging gameplay outcomes; `QA_VIEWPORT=desktop` limits that review; `QA_SHOTS` and `QA_GAP` bound input count and pacing. Run/actors/HP/power state are never injected during play. Equipment saves are asserted unchanged during each recording. Actual WebGL output is recorded; screenshots include DOM HUD. Power observations are read-only samples, not proc counts or assertions that every launch succeeded.
- `play/`: default-equipment regression. `play-fire/`, `play-echo/`: explicitly seeded-loadout normal gameplay, separate from the native fixtures. A natural run can miss or kill the primary before a surviving status is visible; the fixture matrix verifies those timelines rather than inventing ordinary-play observations.
- `validation.json`: final test/build and browser/play results. Browser checks use automated software Chromium, not human playtesting or real-device FPS certification.

No commit or push.

## Final results

1510/1510 full tests passed (0 failures, 385745.070519 ms); 157/157 focused tests passed (7905.578083 ms). Single-file build: 1333.8 KiB; whitespace check passed. All 20 native scenarios passed with real required callbacks, bounded finite aftermath, read-only draw, cleanup and no page errors.

Normal free-equipment Start Run: desktop 7 shots / 3 kills, portrait 8 shots / 4 kills, both still playing and three actual held-focus samples each. Seeded-owned Ember normal play: 14 shots / 8 kills, no live burn status sampled; do not confuse that with confirmed secondary burn hits. Seeded-owned Reprise normal play: 5 shots / 1 kill, 9 pending-frame and 5 replay-frame observations (not distinct hit counts). All four recordings had visible WebGL output, no page/frame errors and unchanged equipment saves during play. Precise observations are retained in `validation.json` and each play directory.
