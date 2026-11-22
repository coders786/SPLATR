# Silent equipment stories and one-screen Field Manual

## Implemented
- Added pure import-free `drawEquipmentStory` to the art engine. Each story uses a normalized 1500ms cycle, equipped character, simple arena props and cause/action/result phases. Reduced motion renders a deterministic explanatory result frame.
- Shop visible cards animate these scenes instead of only displaying a posed character. Hover restarts a card; focus selects its LIVE BUILD demonstration. LIVE BUILD shows the selected/hovered item's story until manual input or practice controls take ownership; real sandbox input/rewards remain unchanged.
- Equipment examples include halo focus ring/slower fall; two-plate crown damage; Viper narrow crimson lane; two-target horizontal cut; chain lightning; low-hull score; early warning; wall needles; bump protection; gravity pull; close-cut width; focus recovery meter; four-kill Riot/two-edge indicator; echo; floor shockwave; wall refill; jet rebound; lingering cut. Cosmetic equipment retains its authored living artwork; slash scenes use actual equipment slash effects; world scenes use the authored animated backdrop.
- Crown enemy lesson includes repair orb/health pips. Prism breaks a visible link, Fork reveals small targets, Bastion shows armor pips/blocked cue, Rift shows a danger zone and escape. Targets split with real contour-based cut halves rather than duplicate whole enemies.
- Every Shop card gets an original top-right SVG role badge; cosmetics use sparkle/STYLE semantics. Added magnet/clock/sparkle/crescent glyphs and revised seven tab silhouettes toward crown, visor, isometric cube, reactor, wing, crescent and horizon.
- Replaced Field Manual paragraphs and eight-page carousel with three control stories and six enemy stories on one page. Mobile uses two enemy columns to keep every tile visible; desktop uses three. No next/previous controls remain. Back/focus/keyboard lifecycle preserved.
- Increased story artwork space in cards after inspecting the first phone capture; no additional rows, clipping or recipe exposure introduced.

## Honest mechanics, not exaggerated advertising
Viper is +20% speed, not 2×. Magnet widens nearby blade contacts, not homing/snapping movement. Riot takes four chain kills, not two. Time improves passive recovery during its existing window, not an instant refill. Halo reduces falling gravity while aiming, not permanent levitation. Gold/eyes/world/slash appearances remain STYLE, not extra powers. Manual says OVERDRIVE to match current game terminology. No gameplay balance changes were made to imitate the requested illustrative numbers.

## Validation
- Full suite: 493 passing, zero failures (208.7s), before final artwork-size adjustment. Focused all-catalogue story tests rerun after adjustment: pass. Tests cover 1500ms repeatability, animation across phases, frozen input, reduced-motion static frames, every role icon and cosmetic/risk labeling.
- New browser QA: four sizes, all nine manual tiles present, no carousel or dialog scrolling, every Shop card badged, no page errors. Rerun after final sizing change.
- Discovery Shop QA: four sizes, buy != equip and hidden recipes remain intact.
- Wordless first-play QA: four sizes, automatic clean wave-one transition and reward isolation intact.
- Master browser QA: desktop/half-preview/landscape results fit, retry and zero errors. Initial invocation lacked CHROME_BIN; rerun with /tmp/chromium passed.
- Final self-contained build: 694.18 kB, gzip 275.75 kB.
- Inspected phone manual and Shop screenshots. Fixed cropped top-row manual canvases and undersized Shop actor artwork based on those captures.

## Scope limits
These are authored silent illustrations, not miniature physics simulations, and are not proof of user comprehension. Cosmetic parts share a baseline action stage while their actual artwork animates; not every cosmetic has a bespoke storyboard. Enemy lessons are compressed action cues, not exhaustive AI behavior tutorials. No native-device profiling or human playtest performed. Detailed optional power info remains available. Logs/screenshots are ignored under `.arena/visual-stories/` and `.arena/icons/stories-*`.
