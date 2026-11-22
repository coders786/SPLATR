# Unified redesign — Chunk 3: hybrid integration, surface hierarchy and visual iteration

## Scope

Completed the third chunk on top of the construction and performance work. No catalogue items, prices, recipes, discovery IDs, save fields, collision shapes, gameplay timing or combat rules changed. All artwork remains in the import-free standalone engine.

## Art changes

### Existing Apex forms, rebuilt around their ingredients

Rear structural geometry and front shell integration now have separate drawing layers. This lets roots disappear behind the shell while selected facets, seams and plates remain visible in front. The front integration is clipped to the actual cosmetic BODY outline; the Glacier head crest is intentionally drawn outside that clip.

- **Glacier Crown:** three large crest struts physically overlap the Halo mount; clipped-corner shell facets and planted shoulder planes replace floating lenses and a wire crown.
- **Spectral Briar:** an asymmetric vine follows the side/root with a few thorns and a notched shell seam, rather than a circular leaf cage.
- **Arc Sentinel:** two shield sections share a planted spine; shell plates carry the same geometry. Removed six orbiting shields and their dotted ring.
- **Arcade Sovereign:** stepped side construction and a consistent pixel unit replace satellites and an orbital ellipse.
- **Mecha Reaper:** shoulder-mounted blades replace hovering scythes on thin stalks.
- **Laser Wyrm:** a rooted tail spine and a few tapered ridges replace floating zig-zags.
- **Star Eater:** a carved wing-root support replaces the star cloud/orbit.
- **Ink Ronin:** a folded scarf root and a restrained wrap replace orbiting scraps.
- **Void King:** weight and trim move into the chain root and shell band instead of surrounding the body with rotating badges.
- **Apex Sun:** three rays grow from the Halo support rather than adding another luminous ring.
- **Cyber Phantom:** a faceted shell edge carries its identity; a restrained release-only trace replaces continuously offset rectangular ghosts.

All ten Sparks now modify local ingredient details: Halo supports, horn channels, wing-root seams, chain weight, shell steps, crown inset, Chamfer caps, tail leaf, segmented conduit or pixel seam. No new recipes were added.

### Shared scale and color hierarchy

Added pure, frozen `resolveArtDirection(equipment, radius, pose)`, used by the shared hero renderer. It reports recipe family, three detail levels, CORE energy, restrained recipe accent, material shadow and selected rim color.

- Gameplay-size bodies retain primary shapes and omit tertiary ornament.
- Larger studies retain meaningful internal detail.
- Hybrid accents blend toward the CORE instead of introducing unrelated competing energy colors.
- The eyes remain above the added detail in the visual hierarchy. Tests compare their exact pixels with a corresponding incomplete recipe.
- Obsidian on Void receives a narrow material edge on the losing side/bottom contour, not a full glow outline.

### Cards and worlds

- Replaced the card's colored haze, dotted diagonal wallpaper and stripe with one neutral broad plane.
- Head-card framing now fits the complete tallest headgear while retaining a useful inspection scale.
- Recentered the CORE crop for the existing offset CORE construction.
- Removed preview scanning bars and colored spotlight wash.
- Reduced rain, streaks, stars and skyline window density/contrast.
- Lowered Manga building contour contrast so background architecture is lighter than the character contour.
- Moved and reduced Synth's sun to avoid competing with the specimen at the center.

All named consumers still use the same authoritative engine: gameplay, cards, live preview, Codex, Manual, Best Stroke and Vault.

## Visual iteration — what changed after looking

1. **Baseline:** captured the existing Apex matrix before editing. It showed detached rings/satellites, fine detail that disappeared at gameplay size and background texture competing with the face.
2. **First pass:** rebuilt all 11 Apex treatments and 10 Sparks, neutralized cards and reduced world noise. Directly inspected the matrix and mixed-build comparisons.
3. **Corrections from that review:** Reaper had a disconnected-looking tip; replaced it with seated shoulder blades. Obsidian lost its lower edge in Void; added a restrained material edge. Synth's sun dominated the composition; moved/shrank it. Manga/window contrast remained too high; lowered it. Head cards were initially too zoomed out after fitting; tightened framing without clipping the horns.
4. **Further close-up:** Glacier's rear crest was too hidden by the Halo; added physical overlapping front struts. Directly inspected the final Glacier and Reaper close-ups.
5. **Final reviews:** inspected the mixed-build sheet, actual production HEAD-tab screenshot and animated-study release frame. The mixed study includes dark-on-dark, pale-on-bright, warm CORE/cool BODY, large head/large tail, and reflective/colorful combinations.

Same-build studies use matching equipment, pose, animation clock and logical size. Each panel includes a larger study, a **46-pixel body diameter** and the real shared shop-card renderer. Card framing is intentionally changed by this work; the main specimens remain identical in framing.

## Validation

- Final `npm test`: **389 passed, 0 failed**, 70.62 seconds.
- Production single-file build: **516.69 kB**, gzip **223.00 kB**; bundle verification passed.
- Engine data comparison against the pre-chunk copy: `ITEMS`, `SLOTS`, `HYBRIDS`, `SPARKS`, `MUTATIONS` exactly equal; all previous public exports retained.
- Chromium recipe matrix: **21 × 6 worlds × 5 actions = 630 renders**, zero page errors/Canvas state leaks.
- Same-build review: **32 panels** covering all 11 Apex forms plus 5 deliberately mixed builds, before/after, with three surface views per panel.
- Hybrid motion study: **40 frames × 6 hybrids**, covering idle, aim, release and recovery, with contrasting world assignments. Six assignments include Void twice; the exhaustive matrix separately covers all six catalogue worlds. The motion study is a deterministic art fixture, not a live-game recording or a hit assertion.
- Development and single-file production layout gates passed, including compact sizes.
- Reduced motion, native dummy cuts, Space, pointer cancellation, focus and explicit try-on checks passed.
- Harmony/Codex/main menu/Manga lab-run/wallet checks passed.
- Eight Manual specimens, live-game capture and Best-Stroke adapter fixture passed.
- Real-browser end-card/retry gates passed at 1280×720, 550×720 and 860×440.
- Vault controller/canvas capture passed: 3/3 → portal → Vault → Halo +30 Ink → BANK & END. This is a controller/canvas fixture, not a Chromium layout capture.
- `git diff --check` passed.

Focused tests: `test/art-direction.test.js` covers frozen scale hierarchy, all recipes at gameplay/card/study sizes, all seven card slots, Canvas state restoration, exact eye-region preservation, catalogue counts and world availability.

## Reproduce visual studies

Against the single port-3000 server:

```
CHROME_BIN=/path/to/chromium node scripts/art-direction-browser-qa.mjs
CHROME_BIN=/path/to/chromium node scripts/hybrid-performance-browser-qa.mjs
```

An optional `ART_BASELINE=/path/to/pre-chunk-engine.js` adds the before column without replacing production source. Ignored screenshots/frames are under `.arena/art-direction/`.

Optional animation assembly:

```
convert -delay 7 -loop 0 .arena/art-direction/motion/frames/*.png .arena/art-direction/hybrid-performance.gif
```

Authoritative complete source: `src/art/splatr-art-engine.js`.
