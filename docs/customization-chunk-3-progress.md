# Chunk 3 — first implementation slice (historical)

**Superseded by [completed chunk 3](customization-chunk-3-complete.md).**

Chunk 3 is **in progress**, not complete. The collection now contains 23 designed items plus empty head. Twenty-six of the original 49 items remain to implement.

## Implemented

- **Broken Oni** challenge reward. A non-practice/non-paper Crown defeat at 1 HULL emits the unlock before Crown repair. Equipped Oni gives 50% extra kill score while at 1 HULL, rounded down, with a red blade overlay and cracked bone mask/red horn artwork.
- **Glass Cannon** challenge reward. Reaching displayed Sector 05 emits the unlock (sector 04 does not). Equipped Glass starts at and caps Crown repair to 1 HULL; score is doubled, including Throughcut bonus. The HUD shows one HULL segment, not three misleading repairable segments. Star-core artwork is shared with preview and print.
- Challenge ownership is persisted in the versioned equipment save; repeated unlock events are idempotent. Neither challenge item is free during migration or buyable with INK. Unowned cards state the real challenge and disable purchase/equip; inspecting them does not unlock them.
- Five exact hybrid recipe definitions, correct partial-match denominators (INK RONIN requires four), deterministic first-complete selection, two-or-more-part hints. No hidden gameplay bonuses.
- **Cyber Phantom** can be assembled now: Cyber Visor + Hologram Wire + Ghost Scarf. Shared Cube artwork draws bounded cyan outline echoes. Title appears in preview, run HUD, and the actual stroke snapshot's BEST STROKE footer.
- Remaining four recipes are data groundwork; their required catalog parts are not yet implemented/purchasable. Their final distinct effects are not represented as completed. Generic drawing fallback is not final art approval.
- Slot collection badges require ownership of every currently catalogued item in that slot, including challenge rewards. Recipe details are available in the hybrid badge tooltip.

## Verification

- Full `npm test`: **328/328 PASS**, 66.63 seconds.
- Production build: **438.10 kB**, gzip **192.73 kB**, single-file check passed (427.8 KiB).
- Eight new deterministic tests: all recipe matches/partial matches and four-part Ronin denominator; challenge save migration/purchase exclusion; collection completeness; aura Canvas state; Crown kill at 1 versus 2 HULL; Glass score/repair/lethal hit; Oni conditional bonus; displayed Sector 04 versus 05 reward boundary.
- Existing all-catalog artwork test includes both new items at small and preview scale.
- `scripts/hybrids-browser-qa.mjs`: real Chromium, 1280×720 / 550×720 / 860×440; seeded ownership fixture, Cyber Phantom preview/title, locked Oni challenge card, Glass equip/HUD, zero JS errors. Screenshots are local `.arena/hybrids/preview-*` and `run-*`. Browser ownership is fixture setup, not claimed as naturally earned. Challenge eligibility is exercised by deterministic real-run combat/sector tests.
- Wave-2 seven-purchase/full-field/two-EDGE browser regression passes all three sizes. Master input/end-card/retry browser checks passed during this turn before the final static-markup correction.
- Full-suite HUD-id validation caught a dynamically injected title absent from index markup. Fixed by declaring the title in `index.html`; final suite passes without weakening the validation.
- `git diff --check` clean. The one unified server remains on port 3000.

## Next

Implement the remaining catalog in visually coordinated batches, including missing recipe parts and their real powers; then complete all five distinct auras and broader combination review. Capsules, rerolls, Run Shield and crash-atomic purchase receipts remain chunk 4. Human audio/art approval and native-pointer portal playthrough remain separate acceptance work.
