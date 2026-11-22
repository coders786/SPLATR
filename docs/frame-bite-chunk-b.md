# Effects Chunk B: Frame Bite

## Scope

Confirmed clean-bank force now enters a narrow rail bevel rather than a floating bowed arc. Local wall compression, unequal rail-parallel delamination cuts and a subdued lasting seam share the existing printed-material palette. Ordinary rail/floor behavior and unsuccessful contacts retain their existing cues. Optional Wake Separation remains deferred; no persistent distortion added.

## Integration

- Added portable, import-free `drawFrameBite` inside the shared art engine. Draws behind gameplay actors; saves/restores context, no filters, readbacks, copies, added camera shake, RNG or simulation writes.
- Replaces the dimension-field bank arc and the old generic bank scar. Transient expires at 18 ticks; evidence takes over after that, using the existing capped scar lifecycle. Existing buffers remain eight impulses/fourteen scars.
- Clean-bank metadata includes normal closing speed from the real pre-response contact, rather than total speed alone. That controls intensity, so a glancing collision cannot get head-on force merely from tangential motion.
- Physics bank coordinates are the cube-center clamp point. The visual call projects half a cube outward along the normal to mount the bite on the actual wall plane. Mechanics/event coordinates remain unchanged.
- Matching impact/boom records are tagged as bank presentation sources; renderer suppresses their old circular ring/rebound ellipse instead of layering it over Frame Bite. Other impacts keep their specialized feedback.
- Reduced motion uses stationary compact geometry with opacity expiry, no compression travel. Shake Off has no added displacement to suppress.

## Inspection

Initial phone captures revealed the old rebound ellipse dominating the cue and the center-plane anchoring error. Both corrected, browser fixtures rerun, phone right-wall/full and ceiling/reduced captures inspected. The hero remains visible and the local seam stays close to the wall instead of cutting through the arena. This is an intentionally quiet cue, not a new full-screen spectacle.

## Validation

- 536/536 full Node tests passed.
- Four new tests: direction/force/local bounds/context restoration; reduced/expiry/evidence/immutable input; normal-vs-grazing intensity; actual physics bank metadata/inward exit/ring replacement.
- 24 real clean-bank browser scenes: left/right/top × four sizes × full/reduced. Visible actor, real bank count, immutable drawing and zero page errors. `scripts/frame-bite-browser-qa.mjs`; captures `.arena/frame-bite/`.
- 32 real dimension-field scenes passed (wake, normal/fast cuts, bank; full/reduced; four sizes).
- Eight production-renderer zero-cut platform-release regressions passed (four sizes × mouse/touch).
- Single-file build passed: 728.87 kB, gzip 286.42 kB.
- Logs `.arena/icons/frame-bite-{tests,build,browser,field,pull}.log`.

No changes to rebound speed, collision geometry, scoring, rewards, clean-bank eligibility, strain amount, movement or progression. Physical-phone performance/comfort and human recognition remain unverified.
