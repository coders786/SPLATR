# Connected combat visuals: plan and implementation

## Visual plan
The visual hierarchy is character/weapon silhouette first, contact/outcome second, interface third. Existing temporary transformations and animated choice previews remain. This pass connects speed/direction data to enemy armor reactions, enemy death, player shield, player damage and player death. No new buff catalogue or explanatory paragraphs are added.

1. Capture a presentation-only immutable contact snapshot before recoil/removal.
2. Distinguish light/committed/extreme contact using projected relative speed, not total velocity. Tangential speed identifies glancing scrapes.
3. Use local directional marks, not screen-filling bursts. Differentiate cut, armor, ward and health colors/shapes.
4. Preserve enemy contours in death halves; scale separation/spin/inherited motion with bounded impact strength. Heavy plates retain lower spin.
5. Keep surviving targets/player physically readable via shell deformation around the real body, without moving hitboxes.
6. Player death preserves face/loadout in full-size clipped halves, with weapon detachment and directional momentum. No floating target/X/cause label over the corpse.
7. Retain reduced-motion states, bounded effects, simulation-tick aging, reset/practice isolation and immediate existing control/retry lifecycle.

## Implemented
- `src/contact-visual.js`: pure snapshot helper, normal/tangential relative velocity, 0..64 speed cap, normalized strength and three named bands. Reads body velocities when available. Missing source data falls back to player velocity direction; this is an approximation, not a recorded collision manifold.
- `src/run.js`: actual armor, cut, ward, hurt and fatal events carry captured contact metadata. Death also carries a snapshot of equipped parts and sword. Damage/score/rewards/timing are unchanged.
- Pure art engine: bounded 12-contact local effect list, age-driven directional cut/scrape rays, distinct health/armor/ward palettes, strength-dependent corpse separation, drift, spin and capped flecks. Surviving armor reactions use exact enemy IDs; player hurt compresses the shell in impact direction.
- Player death: dedicated full-size clipped hero halves with readable face/loadout, short hold, speed-dependent opening/drift and final fade. Detached sword follows a bounded tumble. Removed old circle/X/cause overlay; subtle existing frame cue and small settling dim remain.
- Invulnerability alpha now stays in .86..1 rather than flashing between .61..1, preserving character visibility.
- Ward fractures inherit impact direction/strength. Existing physical plates/charge count remain authoritative.

## Verification
- Final full suite: 491 passing, zero failures, 185.2s. Five new tests cover relative/glancing contact, bounded immutable snapshots, real shield/health/fatal events, actual surviving armor/enemy death metadata, directional artwork and visible full-size player death.
- Final self-contained production build: 686.21 kB, gzip 272.79 kB.
- New `scripts/contact-impact-browser-qa.mjs`: 20 real-run outcome fixtures, phone/desktop × full/reduced motion × armor/cut/hurt/ward/death. Actual run APIs produce the events; not synthetic renderer event injection. No page errors. Canvas pixel check prevents reporting blank captures as valid.
- Screenshot inspection caught the initial fixture's ResizeObserver clearing the canvas after its synchronous draw. Added two animation-frame waits before final draw and reran all 20 cases.
- Inspected 390px armor/player death and 960px enemy-cut screenshots. Player-death inspection prompted replacing the old normalized half rendering with dedicated full-size hero halves; reran browser and unit tests afterward.
- Four-size wordless first-play passes. Eight control-practice browser journeys pass with isolation/lifecycle checks. 96 native sword-family/direction/mouse/touch gestures pass.

## Limits / next polish
This implements the connected combat-visual plan on top of previous character, weapon, buff and UI work; it is not a wholesale environment repaint. No new sound design, added hit-stop, real collision-manifold instrumentation, native-device profiling or retention playtest. Existing hit-stop and rewards are intentionally unchanged. Browser fixtures use controlled placements and damage calls; they do not establish novice readability or native-device performance. Contact speed bands are tested mathematically; the browser outcome fixtures are not a full three-speed matrix for every enemy species.

Artifacts: ignored `.arena/contact-impact/` screenshots and `.arena/icons/impact-*` logs. Pure art module remains import-free with no DOM/storage/physics writes.
