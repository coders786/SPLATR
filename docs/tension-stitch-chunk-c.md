# Roadmap Chunk C — Tension Stitch / Rejected Cut

Implemented the embedded seam and reason-specific rejection portion of the printed-world roadmap. Earlier documents used “Chunk C” for Wake Separation; this document uses the user's roadmap naming. Successful Release Cut and Settling World remain Chunk D, not part of this change.

## Embedded construction

Replaced the sealed/ready hexagonal pane with unequal low-contrast local surface patches meeting along a tall jagged cut. Dark undersides, short folded edges, fixed halftone flecks and bridging stitches connect it to the existing printed scenery. No enclosing crystal silhouette, particles, pulsing, swirling layer, global warp or new collision boundary.

`resolveTensionStitch` reads existing ready/cue.step state only. Full field strain/progress cannot independently open a stitch. Step zero is sealed; the actual first milestone releases one stitch; ready parts the lips and releases all stitches. Inward fixed chevrons indicate traversal through the vertical seam. No new hidden charge or readiness mechanic.

## Rejected Cut

The existing rejection lifecycle now carries an explicit presentation-only reason in its feedback/event metadata; kind text and gameplay conditions are unchanged.

- sealed: stitches remain connected and resist a small contact flex.
- slow: a short directional crease starts and stops; local lips flex slightly.
- fresh: opening remains geometrically identical to ready. Only NEW DASH input copy changes. No false resistance animation.

Full-motion flex uses only the real 24-tick feedback age. Reduced motion uses a fixed contact shape with existing opacity expiry. Player motion never pauses or snaps. Enemy contact colors and existing HUD instructions are unchanged.

## Checks

- 558/558 full Node tests pass.
- Five new tests: authoritative milestone/static idle projection; distinct reasons and pixel-identical ready opening under fresh warning; immutable/context-safe reduced artwork; actual crossings produce all three reason records with no damage/reward/shatter; three consecutive slow launches emit exactly once each and cannot auto-shatter.
- New scripts/tension-stitch-browser-qa.mjs: 48 scenes = sealed/earned/ready + sealed/slow/fresh rejection × four sizes × full/reduced. Rejections use actual run launches/crossings; milestone flags are deterministic fixture setup. Checks visible actors/seam, unchanged breach data during render, reason, no shatter and no page errors. Phone ready/full and sealed-hit/reduced captures inspected. Captures .arena/tension-stitch/.
- Existing dimension-finish browser QA: 48 stage fixtures pass, including unchanged successful-shatter path and skip affordance.
- Eight production-art zero-cut platform mouse/touch release regressions pass.
- Production single-file build: 736.20 kB / gzip 288.46 kB, passes.
- Logs .arena/icons/tension-stitch-{focused,tests,build,browser,finish,pull}.log.

No change to skill thresholds, accepted crossing radius, speed/fresh-launch requirements, collision geometry, scores, rewards, movement or platform behavior. Current successful burst still uses its previous pane construction until Chunk D. Physical-phone performance/comfort and unfamiliar-player recognition are not established by these deterministic checks.
