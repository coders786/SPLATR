# Custom SPLATR pictograms

Implemented an original 24px inline-SVG family in `src/ui-icons.js`: familiar action silhouettes, clipped geometry, rounded joins and a restrained acid accent. No external icon library, font glyphs, emoji or remote image requests. SVGs are decorative and unfocusable; existing button text, keyboard hints and input handlers remain intact.

## Coverage
- Main/pause/results navigation: play, pause, retry, back, Shop, settings, guide, learning and practice; existing sound/mute/fullscreen sprite IDs preserved.
- Shop: seven equipment-slot pictograms, parts/discoveries/practice destinations, back and currency.
- Practice: current-stage cue, back/restart and tap/pull/release gesture strip.
- Wave play: pace/bank/recharge/breach/landing cues, physical-rest action and distinct temporary-buff pictograms.
- Sword desk and results: familiar action icons and credits.

Credits use a coin; score uses a star. Bank is a reflected path against a wall; landing is a downward arrow onto a platform. Unfamiliar game mechanics retain short labels. Unknown mutations remain secret. The pure art engine remains independent of these DOM helpers. First-time learning remains wordless with no menu.

## Verification
- `npm test`: 478 passing, zero failures (120.3s), including three new icon tests covering immutable paths, safe markup, readable names/click behavior, distinct semantic mappings and sprite compatibility.
- `npm run build`: self-contained single HTML, 663.41 kB / gzip 266.20 kB.
- Discovery Shop browser QA: four viewport sizes, actual purchases/equipping/discovery, no JavaScript errors.
- Control-practice browser QA: eight real-input journeys across four sizes and full/reduced motion; reward/save isolation and live-run lifecycle preserved.
- Rest-choice browser QA: 15 fixtures across five sizes, all three choices visible without dialog scrolling.
- First-play browser QA: four sizes, wordless boot, automatic clean wave-one transition, no lesson rewards and returning-player behavior.
- Inspected Chromium screenshots: 390px Shop, 390px upgrade choices and 390px practice. Slot icons/labels fit; buff icons and stats remain separate; practice gesture strip stays within bounds.

These checks establish rendering and regression behavior, not measured human icon comprehension or native-device usability. Screenshot/log artifacts are under ignored `.arena/` directories.

## Icon-first follow-up
Added target, information, mix, dice, save and lock pictograms. Shop has icon-led preview tabs, sandbox actions, information, purchases/equip and presets; introductory and footer prose is reduced to short states. Buying still does not equip. Practice now shows a stage-specific visual sequence (pull/release/speed, launch/bank/launch, landing/check) instead of visible instruction paragraphs, with brief stage names and full accessible instructions/tooltips retained. Its canvas gains the reclaimed space. Wave clear receipts use target/coin counters, and repeated pace/bank statuses are shorter.

Follow-up validation: 478 tests pass; eight practice browser journeys, four Shop sizes and 15 rest layouts pass. Fixed the practice grid's row allocation after removing its visible setup paragraph, then reran all eight practice journeys successfully. Inspected new 390px practice and Shop screenshots: large playable canvas, unobstructed visual cues and two full Shop rows. Production single-file build passes. No native-device or human-comprehension claim.
