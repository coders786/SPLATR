# Fang anticipation visual chunk

Fang triangles now stage their existing attack through a small loaded body compression, then a brief forward release. Presentation derives directly from the real tell span/clock and 24-tick rush clock. It does not create a second timing state, translate the physics body, change hitboxes or change aim/attack eligibility/damage/speed.

## Visual language

- Late tell compresses along attack aim by at most 10%, expands across it by 6.5%, and pulls the drawn center back at most two world pixels. Rush releases with at most 13% stretch and two-pixel forward offset, decaying exponentially. Idle restores the ordinary silhouette.
- Replaced overlapping Fang cone, dashed center ray, repeated chevrons and marching arrows with one quiet tapered lane, three fixed pressure gates and a rear loading bracket. Lane keeps the previous 24×lunge-speed extent plus body radius. This is an intent illustration, not a new collision boundary.
- Gates fill from actual tell progress; no looping flash or time-driven oscillation. Reduced motion leaves body shape unchanged while retaining a stationary lane and clock-based readiness gates.
- Other enemy warnings, actual attack movement, enemy materials and contact treatments unchanged. Shared portable engine owns all drawing.

## Validation

- 553/553 full Node tests passed.
- Two new tests cover load/release/idle/reduced/other-kind projection; directional deterministic clock-sensitive drawing and context restoration.
- 18 actual AI scenes from production run/combat: early tell, late tell and first rush across three sizes × full/reduced. Test waits for real AI transitions rather than assigning mode/clock. Player velocity is held still by the fixture to isolate the warning. Both actors visible and no page errors. Phone late-tell capture inspected.
- Eight zero-cut platform mouse/touch regression scenes passed.
- Single-file production build passed: 734.72 kB / gzip 288.11 kB.
- Script scripts/fang-anticipation-browser-qa.mjs; captures .arena/fang-anticipation/; logs .arena/icons/fang-anticipation-{tests,build,browser,pull}.log.

Physical-device performance/comfort and unfamiliar-player threat recognition remain unverified. Tiny render-only deformation is not a hitbox change; pressure gates are attack readiness, not health or armor.
