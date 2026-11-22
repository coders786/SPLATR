# Visual polish: physical materials, motion identity and impact

## Changes
- Upgrade attachments now use solid cel-shaded faces, a dark separating contour and a clean light edge instead of wireframe-like outlines. Removed generic surrounding brackets from most mounted forms to let the physical silhouette lead.
- Long Edge blade has visible extension seams; Heavy Cleaver has a broad toothed face; Glass Edge has a bright crystalline ridge. Existing equipment identity/face is retained.
- Cleaver slash uses a thick crescent, Glass Edge a thin one, and Lasting Edge a trailing secondary curve. These are bounded cosmetic accents, not extra hitboxes.
- Ward consumption emits six readable plate fragments with a short broken impact arc. Renderer owns at most four bursts; simulation ticks age them, reset clears them, reduced motion uses a stationary fracture state that fades. No timer, random gameplay change or added damage.
- Upgrade previews now have shaded miniature stages and contact shadows. Heavy attacks load more deeply and run on a slower demonstration cycle, fast forms travel farther on a quicker cycle, and defensive forms demonstrate a projectile striking a ward instead of performing the same generic slash.
- Hover/focus replays a card demonstration; idle previews are slightly staggered. All reuse the existing wave UI loop and reduced-motion settings.
- Upgrade cards have improved material/focus states and colored benefit text. Trade-off cost is on a separate quieter line, visible at mobile size.

## Validation
- Full suite after renderer/preview changes: 486 tests pass, zero failures, 187s. New fracture test checks age bounds, deterministic frames and canvas-state restoration.
- Final build after card/replay polish: 682.41 kB, gzip 271.34 kB; self-contained single-file validation passes.
- Final rest browser QA: 15 fixtures at five sizes, all three cards fit without dialog scrolling.
- Final active-upgrade browser QA: 33 fixtures, badges fit, expiry and spent ward correct.
- Final control-practice browser QA: eight native-input journeys across four sizes and motion settings, no save/reward leakage or page errors.
- `scripts/visual-motion-review.mjs` captures 54 production-renderer frames using real run dash/ticks and two real hurt calls consumed by Twin Ward. Modifier selection is fixture-injected; not a complete natural run. No page errors.
- Inspected production-rendered heavy attack and ward-fracture frames plus the final 390px rest screen. Cost text is separate, physical previews match choice identities, and the ward's fracture remains local rather than covering the actor/enemies.
- Review frame sequences and derived GIFs are ignored artifacts in `.arena/visual-motion/`. GIF encoder was installed only in excluded `.cache/visual-tools`, not project dependencies. Frame inspection is not a native-device performance or retention playtest.

No changes to credits, reward settlement, buff expiry/stacking, input direction, collision geometry, encounter layout or audio. Impact sound/hit-stop and human playtesting remain outside this pass.
