# Shape Lab — layout-first comic rebuild

## Acceptance gate: actual DOM and production screenshot evidence

`node scripts/comic-layout-gate.mjs` runs against both the dev page and the **built single-file HTML**, not an isolated renderer or a substitute mockup. At 1280×720:

| Requirement | Measured result |
|---|---|
| Seven tabs above the left grid | All seven are 38px tall; no horizontal overlaps; tab bottoms precede grid top |
| Live canvas | 447.20×279.50px, 16:10 |
| Two complete card rows | Both rows fit inside the grid viewport; first row begins below its top edge |
| Sidebar | Zero scroll overflow; Hybrid Recipes inside panel and viewport |
| Test modes | All five buttons share one horizontal row |
| Presets | 1, 2, 3, SVG save icon and Randomize share one horizontal row |
| Footer | Separate badge, bullet, title, five-word tag and core signature with measured gaps |
| Lower-row selection | Selecting Coil keeps it visible rather than jumping back to a cropped row |

The expanded gate also checks no sidebar/outer overflow and a non-thumbnail canvas at 1024×720, portrait 550×720, and compact landscape 860×440. Portrait uses explicit Shop/Live Preview panes. Compact landscape suppresses the duplicate hybrid title and note to preserve a large live canvas and keep the actual controls visible.

Two genuine layout defects were found by the new assertions and fixed: 12px of desktop sidebar overflow and 6px of portrait sidebar overflow. Earlier renderer/test totals did not guard these conditions.

## Layout implementation

- Lab stylesheet now enters Vite as its own module import; no reliance on a leading stylesheet `@import` for the dialog's structural rules.
- Scoped explicit grid/flex rules for nav, card grid, canvas, actions, presets and footer.
- 640×400 live canvas and matching letterbox pointer mapping; no aspect-ratio distortion.
- Card rows measured from the grid viewport; tab changes start at the first row. Same-tab selections preserve their scroll position.
- Save is an inline SVG disk, not a font-dependent glyph.
- Active category/mode/preset uses fixed chartreuse `#d8ff1e`, independent of cosmetic energy color.
- Readable 10px sub-tags, 2px panel borders and 8px clipped corners.
- Inspection text is split into real DOM elements. Broken Oni reads: `INSPECT • BROKEN ONI — LAST HULL. NO SECOND CHANCES.` Its detail copy no longer contains `(rounded down)`.

## Shared hero rebuild

The former `cube()` drawing implementation was replaced by `src/hero-art.js`. The exported `cube()` API remains the shared entry point used by cards, sandbox, combat and prints.

- True square shell at rest; roughly 68px card hero framing for head/material studies; minus-seven-degree action tilt in lab studies.
- Consistent heavy pure-black contour treatment, clipped corners, two-tone cel planes, bevels and halftone shadows.
- V-brow mask with slanted fierce light eyes.
- Recessed filled teal/cyan visor with a diagonal glass reflection and internal eye energy.
- Hypno sockets use thick concentric violet rings and light pinpoints, not spiral wire scribbles.
- Glitch eyes use stencil brackets with offset cyan/magenta ghosts.
- Viper has swept crimson/obsidian blade horns and white edge catches.
- Broken Oni has a curved crimson horn and a cracked ivory plate wrapping the upper-left brow.
- Coil is a twin-fin plasma rail. Beacon is an armored amber slot with a light cone. Crown is a bevel-shaded prism with a magenta gem.
- Non-World cards use obsidian/plum spotlights and diagonal halftone panels instead of city backgrounds.
- Attachment accents grade the backdrop, scarf and body catch-light together. World cards retain actual world panoramas.
- Live katana study has a larger curved ink/cream crescent with bisected Fang fragments.
- Tail study framing was adjusted after visual review so wing tips stay inside the artwork window.

The gameplay jelly/impact deformation channel and axis-aligned combat envelope were preserved. Two recording test doubles were extended to record Bezier curves/disks used by the new art; their deformation and one-attached-ribbon assertions remain in place.

## Direct inspection and supplementary regression checks

Opened and visually inspected production captures of **all seven tabs**, the lower headgear row, the **live mid-slash**, portrait and compact layouts. Reopened affected head/material/tail and mid-slash images after framing/contour/streak corrections. This visual review is separate from numeric assertions, not inferred from a render count.

Evidence: `.arena/comic-gate/build-{head,eyes,body,core,tail,slash,world}.png`, `build-head-lower.png`, `build-mid-slash.png`, responsive captures and `report.json`. Recreate using the gate script after `npm run build`.

Supplementary checks: full suite passes 361/361 (67.20s); build single-file validation passes; purchase/Vault ownership/presets, native reduced-motion pointer and keyboard launch, end-card/retry, and the mutation render matrix were also run. These are regression checks, **not proof of visual quality**. Final `git diff --check` is clean.

No combat multipliers, quest rewards or shop extras were added. One existing app server remains on port 3000.
