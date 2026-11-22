# Shape Lab / Harmony implementation

## Scope

Replaces the static customization dialog with a shared animated build renderer and an isolated playable lab. Capsule, reroll and Run Shield extras remain paused.

- Core-owned energy colors shared by the forehead vent, coil, fissures, eye accents, chamber and forge effects.
- Recessed rotating chest chamber, cel planes, halftone shadows and world-directed rims.
- Hologram attachment transmission/scanlines; Iron attachment brackets and rivets.
- Living preview pose, cursor gaze, blinking custom eyes, flexing wings, lagged chain and existing segmented ribbons/thrusters.
- 180ms attachment forge snap, expanding ring, sparks, and brief mutation-fusion wash.
- Animated, visibility-culled cards with different head/eye/material/chest/tail/motion/panorama framing.
- Tapered curved slash ribbons replace the straight layered slash bars.
- Slice/aim/dash/bounce/hit modes, plus native pointer drag/release dash tests against a respawning Fang dummy. Three-frame impact hold and split fragments. Space is a keyboard fire alternative.
- Six two-part Sparks and seven Apex recipes (including Mecha Reaper and Star Eater), persisted discoveries, circuit-linked slot pills and in-scene titles.
- Mutation Codex: animated discovered builds, obscured unknown builds, exact matched-part counts and one-piece-away hints.
- Three numbered preset chips. Click to load; Shift-click/right-click or the store arrow to replace the selected preset, with overwrite confirmation. Owned-parts-only randomize.
- Main-menu Customize icon/frame and Shape Lab headings use the game's embedded Riot/Body/Mono faces.
- Existing combat pose supplies chain and Overdrive to shared aura/core/wing intensity. Mutations add no gameplay multipliers.

## Verification

- `npm test`: **351/351 passing**, 58.24 seconds; eight new named Harmony/lab tests.
- `npm run build`: **484.21 kB**, gzip **209.87 kB**; single-file validation passes.
- `git diff --check`: clean after trailing whitespace correction.
- `scripts/harmony-browser-qa.mjs`: Chromium desktop main menu, all seven tabs, Arc Angel/Magma Flail/Void King/Laser Wyrm slice captures, 13 Codex entries, native pointer drag hits the dummy, unchanged wallet, Manga lab and live-run captures; no page errors.
- `scripts/customize-browser-qa.mjs`: purchases, Vault ownership, presets, no horizontal clipping at 1280×720, 550×720 and 860×440.
- `scripts/master-browser-qa.mjs`: end-card/buttons in bounds, no panel scroll, retry and zero page errors at those same three sizes.
- Only the existing Vite server on port 3000 was used.

## Direct visual review

Chromium captures are regenerated under `.arena/harmony/` by the Harmony script (not committed binary artifacts). Opened and inspected the menu, every tab, all four requested mutation slice views, Codex, Manga lab/run, native dummy cut, portrait preview and compact landscape images.

Initial review found generic fallback fonts and a crowded core aperture. Corrected font-family names to the actual embedded game faces; lowered/scaled the chamber, strengthened its bevel, and applied core color to the forehead vent. Regenerated captures and inspected the affected views and remaining requested views again. Manga retains a visible paper body, ink silhouette, enemies and HUD.

## Boundaries

This is a procedural vector animation system, not authored sprite animation. The lab is a toy simulation deliberately separate from run scoring, quests and powers. Automated pointer playback and actual Chromium screenshots were used; this is not a claim of exhaustive combination coverage, human frame-by-frame animation review, or a new full manual floor/portal playthrough. Existing deterministic floor/portal tests remain in the passing full suite. Compact landscape necessarily shows a smaller live study; portrait offers separate Shop/Live Preview panes.

## Sandbox follow-up polish

- Fixed manual dummy fragments: each fragment now renders one complementary half rather than rendering another pair of halves at each physics position.
- Manual slash/impact now persists for 24 simulation ticks after the three-frame hit stop, rather than disappearing immediately when the freeze ends.
- Reset clears pending drag, hit count, impact and local animation age.
- A dummy cut near the end of a manual test still respawns after manual motion times out.
- Added three named regression tests. Latest full suite: **354/354 passing** (59.56s). Latest build: **484.63 kB**, gzip **210.03 kB**, single-file check passes.
- Reran Harmony Chromium coverage successfully on desktop, portrait and compact landscape. Regenerated and directly inspected the post-hit manual screenshot, including the separating Fang half and lingering curved slash. Wallet remains unchanged.


## Latest endurance pass

See [Shape Lab endurance and improvement pass](shape-lab-endurance.md) for the measured 20-minute Chromium run, final-build follow-up, input/accessibility/rendering changes, and latest **361/361** test result.
