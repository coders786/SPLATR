# Encounter and Builds-first upgrade

## Delivered

- Five encounter themes: Opening Cut, Crossfire, Iron Line, Fracture, Regent Guard. The initial population grows from 12 to a capped 30; Regent appears every fifth wave. Later cycles introduce limited Rifts and Wells.
- Seeded ladder, chevron and split formations use safe placement cells with player clearance and pair separation. Entry grace and staggered activation precede actual mobile enemy AI; these are not pinned display enemies.
- Wave-owned Prism links cancel when their anchors die. Fork children count toward the clear condition. Clearing removes wave hazards and creates the physical rest opportunity.
- Between-wave briefings show the earned clear report, upcoming roster/count and a short tactical lesson. Three seeded choices contain one Attack, one Handling and one Stakes modifier. Contextual advice highlights a useful choice without changing the offers.
- Seven temporary modifiers, including a one-hit ward. Ward blocks one otherwise damaging hit without healing. All temporary effects expire at clear, including dash-speed changes; the receipt says what ended. Holding Space/Enter across dialog opening cannot accidentally choose a modifier.
- Shop opens on Builds: current saved kit, Owned/Apex/Zenith filters, unsaved try-on, missing-parts acquisition and explicit equip. Buying a missing part does not silently equip the recipe. The Parts view and full recipe archive remain accessible.
- Existing seventeen signature swords and six sword families remain intact. Live sword testing remains separate from run progress and currency.
- Wave-aware results and pause text, clearer next-wave count, readable roster labels, and responsive rest layouts down to 390 × 680.

## Verification

Final full Node suite: **429 passed, zero failures**, 92.2 seconds. Final production build passes single-file verification: **600.62 kB**, gzip **248.05 kB**, self-contained artifact **586.5 KiB**.

Deterministic encounter coverage includes safe placement across seeds, waves and player positions; role composition; category-balanced offers; actual tell/rush AI; live Prism cancellation; ward behavior; Fork child clear gating; and expiry at clear.

`scripts/encounter-combat-audit.mjs` completed **150/150 protected combat fixtures**, five builds × three seeds × ten waves, with zero stalls. It checks containment, effect caps and clear cleanup. Protection makes this an operability audit, not a difficulty or survivability benchmark.

Chromium checks:

- `encounter-armory-browser-qa.mjs`: four viewport sizes; try-on does not save; missing-part purchase flow; buy is not equip; explicit equip; Owned filter; wallet accounting; entry briefing; DOM bounds and JavaScript errors.
- `encounter-world-browser-qa.mjs`: actual protected combat, earned report, physical rest, next-wave selection, live links, Regent scene and held-Space release protection.
- `rest-choice-layout-browser-qa.mjs`: fifteen fixtures across five viewport sizes including 390 × 680, long receipts, ward and milestone rosters; all three choices fit without dialog scrolling. An initial narrow-phone overflow was found and fixed before the passing rerun.
- `swords-browser-qa.mjs`: final rerun passed four-size Shop/build filters/try-on/equip/real sword desk/live build and six-family visual matrix.
- Additional passing regression runs during this chunk: waves (three sizes), power UI (four), rewards/direct aim (four), master results/retry (three), and comic layout against development and single-file production.

Screenshots were visually inspected, not just generated: desktop/mobile Builds, mobile try-on, landscape Owned, entry announcement, mobile/landscape choice screens, earned-rest report, milestone briefing, Crossfire and Regent combat, and narrow-phone stress layout. Inspection caught and corrected equipment buttons attaching to the build-filter navigation, roster legibility and narrow-phone rest overflow.

Scratch images/logs are under `.arena/encounter-upgrade/` and intentionally excluded from durable repository snapshots. Reproducible QA scripts and this record are durable. Browser scripts expect the local united Vite server on port 3000 and Chromium; adjust executable/environment paths for your machine.

## Limits and next work

No fresh twenty-minute soak, native-device proof, human difficulty calibration or engagement study is claimed. Protected bots cannot establish that an encounter is fair or enjoyable. The next useful validation is unprotected human play across sword families, particularly later Regent encounters and the ward-versus-score tradeoff. Permanent XP, paid levels and buy-all were not introduced.
