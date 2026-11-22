# Hit effects — Chunk A

Implemented the first chunk of the planned printed-world effect language. No changes to damage, hitstop, collision shapes, attack windows, scores or dimension progress.

## Four outcomes
`resolveCombatHit` projects actual event type, target kind, survival, armor removal, secondary status and normal-relative speed:
- Pressure Bite: ordinary contact; a short compression notch and two perpendicular fragments.
- Shear Release: fast primary cut (normal-relative speed >=28); narrow separating strokes and a brief background registration slip. Secondary/shear follow-up hits do not qualify for the fast primary treatment.
- Plate Buckle: surviving armor event; local concave plate, short fracture and actual removed-plate chip count (capped at three). Existing target reaction now compresses immediately and settles exponentially, rather than swelling late. Reduced armor flash preserves its material color.
- Hollow Break: confirmed death of Bastion/Crown; asymmetric shell lips expose dark undersides and separate around the real cutting plane.

Target determines debris material (metal armor, spectral Rift/Prism, paper baseline). Attacker construction supplies restrained energy/shadow accents; paper-equipped players do not turn enemy metal armor into paper.

## Integration / removal, not stacking
Captured target kind/radius/cut direction/HP in the existing bounded contact buffer. New outcome artwork owns enemy cut/armor contact; player damage, death and ward feedback retain their existing specialized paths. Generic upgraded armor overlay is no longer stacked over these actual outcome cues; actual removed plate count still differentiates heavier hits. The old upgrade helper remains for its authored preview/reference uses.

Removed routine ordinary-kill long beams and duplicate contact imprints. Large beam retained only for genuine throughcut/multi-cut events. Existing bisected enemy halves remain. Loose spark cap reduced to three ordinary / six strong hits. The old circular spring ring is suppressed for enemy-cut impact records, but surface rings, squash and hitstop remain. `noteImpact.source` is presentation metadata only.

## Background registration
Before drawing foreground actors, copy only a small existing background patch along the cutting direction. No pixel readback, DOM, imported textures, filters or full-screen warp. At most three patches; <7 ticks; <=2 backing pixels offset; offscreen events skipped. Reduced motion and Screen Shake Off disable the registration slip. Other hit geometry remains local and motion-aware.

## Timing and inspection
Force at 0–3 ticks, separation at 3–11, subdued evidence until tick 18. Reduced motion uses stationary geometry, no travelling chips or background copy; event opacity still expires normally.

Inspected real phone-scale armor survival, final shell break and desktop fast cut. Initial captures exposed an old kill ring overwhelming the new result; corrected and reinspected. Phone snapshots at 3/8/15 ticks follow actual simulation rather than enlarged standalone glyphs. The surviving gold armor target remains visible after contact; the final-break target is gone and separated debris remains. No claim that unfamiliar players have validated recognition.

## Checks
- Four added deterministic tests: actual outcome classification and target material, distinct alpha silhouettes, timing/expiry/immutability/context restoration/local bounds, background-copy suppression for secondary/expired/offscreen/motion-off events.
- Full suite: 522/522 PASS (188.3s).
- New browser QA: 24 actual-run fixtures = four outcomes × three viewport sizes × full/reduced motion; verifies real cut/armor event classification, survival/death, visible canvas and no JS errors. Final armor fixture explicitly starts with one remaining plate. Additional phone timing captures at 8/15 ticks.
- Existing dimension-field browser: 32 real simulation scenes PASS (normal/fast hits, bank scars, movement wakes, full/reduced, visible actors, immutable draw).
- Final self-contained build: 721.77 kB, gzip 284.56 kB.

## Remaining
Next chunk: Frame Bite (wall-bank force into arena construction) and a restrained, optional Wake Separation. Do not implement a continuous global distortion just to amplify spectacle. Real-phone frame pacing/comfort and human recognition tests remain release gates.
