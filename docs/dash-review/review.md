# Dash visual play-test: roast, revision, retest

## How I reviewed it

Used ordinary **main.js Start Run**, real browser pointer clicks, default/free equipment, desktop 1280×720 and portrait 390×844. The debug state and renderer trace were read only, used for aiming and timing receipts. Tutorial completion was seeded solely to skip training. No health, position, enemy, equipment, renderer or phase injection in these runs. This is automated browser play followed by visual inspection of captured frames — **not a human playtest or mobile-device FPS test**.

`before/` and `after/` contain actual canvas WebMs and timed frames at requested 16, 66, 133, 250, 600 and 1050 milliseconds after input. `results.json` records actual frame timing, accepted shot count and slash age: requested timing is not asserted to be exact. These clips capture the canvas; DOM HUD overlays are not composited into them. Runs are **not deterministic A/B pixel comparisons**: browser timing changes targets, collisions and camera paths.

## The roast

1. **“The dash is wearing a bag of tiny logos.”** Tiny repeated construction fragments were doing the job of a movement silhouette. Up close they had identity; at ordinary combat scale they looked like airborne lint.
2. **“An ambient emitter disguised as a dash trail.”** The old generic dash-item stamps emitted whenever velocity exceeded 4, including ordinary drift/fall. It made more marks but communicated less about the accepted action.
3. **“Several effects are trying to be the headline.”** Generic side fins, an attached elemental treatment, core FX, construction symbols and transient body ghosts overlapped. Adding another bright ribbon would be the wrong fix.
4. **“Launch shouts; recovery shrugs.”** The visual envelope did not have a clear, anchored finishing beat. An attached collar is not a substitute for punctuation in space.
5. **“Portrait turns filigree into lint.”** Screen-space fragments survived the scale change, but there were too many little things around a small hero.
6. **First revision self-roast: “Now it’s a shoelace.”** A continuous measured path showed travel, but its long, thin line could read as a wire or attack lane. That version was rejected during this turn’s frame review.

## What changed in the second revision

### Measured, dash-only wake

New renderer-owned `createDashWake` receives **real dash receipts**, snapshots the equipped element, and records actual physical positions only during the launch envelope. Ordinary drift/fall cannot create new dash-wake strokes. Existing elemental launch/contact powers remain untouched.

- **Ink / Adaptive:** uneven, tapered dry-brush laminations and split edge grain.
- **Ember:** separated tongues, rising hot flecks, warm secondary edge; not a long damaging fire strip.
- **Volt:** interrupted angular zigzags and short branches.
- **Frost:** sparse diamond-like facets with a brighter internal edge; no continuous ice rail in dissipation.
- **Tide:** paired curved lines and partial eddy strokes.
- **Void:** paired inward curls closing toward the sampled path; no persistent well or shield indication.
- **Echo:** staggered paired recording brackets; no extra full body copies and no additional attack-lane claim.

The line segments have **gaps and tapered ends**. All path geometry lies along sampled travel; side decoration does not project a hitbox downrange. Banks split the path; displacements above 90 world units split rather than bridge the scene. Committed launch bearing still owns the attached launch cue; measured segments follow actual motion after a bank.

### Less competing decoration

Production uses the new wake instead of drawing the generic dash-item stamps and hovering dash-item glyph. Generic launch-cloud intensity is lowered in this production mode. Item identity data and other equipment stories remain available; this is not a shop or ownership change. The generic attached fins/collar were replaced by a short compress → open cue so the element is the headline.

### Recovery punctuation

The first visual-recovery sample anchors a short pair of release flicks in world space. They do not follow the character and die in 24 ticks. **This indicates the animation’s recovery beat, not a claim that physics stopped or damage was dealt.**

### Limits

Three strokes maximum; 18 measured points per stroke; finite element lifetimes 72–100 ticks, then the stroke expires. No RNG, imported assets, full-screen flash or extra shake. Fades and path sampling advance only on simulation presentation ticks. Drawing is read only, world-view culled, and restores canvas state. Reset, field transition and run replacement clear it; reduced motion emits/draws no wake. No prices, saves, hitboxes, scoring or elemental mechanics changed.

## What I would still roast

- The existing player/sword/core effects can still get busy during overlapping attacks. The new path fixes the dash’s job; it does not magically solve every stacked effect.
- Quiet remnants are intentionally lower contrast than enemies. Some will vanish against similar-value world details; making them all glow would trade that problem for hazard readability.
- Paid elemental paths are easier to distinguish in a controlled comparison than in a one-second combat glance. Automated coverage is not a substitute for a fresh player identifying them without labels.
- Portrait HUD density and camera framing remain separate usability concerns. This pass does not redesign them.

## Evidence boundaries

`elements/` is a separate set of **controlled native createRun/createRenderer** checks across eight dash choices, two viewports and both motion modes. Equipment and safe setup are test fixtures; dash, physics ticks and presentation use production code. Captures at 4 and 30 ticks demonstrate launch and dissipation, not ordinary store progression. Tests check draw-only determinism, reset, real position samples and finite expiry. See `validation.json` for executed results.

Reproduce:

```sh
QA_OUT_DIR=docs/dash-review/before LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/dash-player-review.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/dash-player-review.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/dash-elements-browser-qa.mjs
node --test test/dash-wake.test.js test/live-combat-presentation.test.js test/live-object-overhaul.test.js
```

The first command writes the currently checked-out renderer, not a historical baseline. Existing `before/` recordings were captured before the dash changes in this turn; rerunning that command now would overwrite them.
