# Live-combat correction — starter kit first

The user correctly pointed out that the previous passes primarily changed customization. This correction changes the production `createRenderer` battle draw path, not `drawStoreItem` or an isolated preview.

## What changes in Start Run
- A layered, tapered cutting crescent now accompanies every active player blade, including the default free Razor. No purchased slash, special core or completed build is needed.
- The crescent's progress uses the real swing start and remaining blade life, rather than assuming every attack lasts 12 frames. It follows the live cutting angle.
- A bounded launch wake adds bright directional slip planes and short speed flecks to committed dashes. Its bearing is the original launch bearing, not a later bounce direction. Element colors follow the actual loadout.
- Confirmed cut receipts get an ivory cutting cross, directional sparks and a short broken contact halo. Armor receipts get plate chips and a blocking notch instead. Player damage uses rose punctuation. Misses do not produce hit effects.
- Telling/rushing enemies receive body-local charge teeth and a closing leading notch. Existing authoritative warning lanes/zones are retained, not replaced by invented hit areas.

## Production hooks and safety
The new drawing helpers are called by the real arena renderer. Event effects reuse the existing bounded contact receipt list (maximum 12); the helpers have finite ages and no retained emitters. `effectState().liveCombat` exposes release version 2 and active receipt count for regression inspection. Reset clears the receipts.

No attack damage, hitbox, range, target admission, cooldown, hit-stop duration, resource, enemy AI, ownership or save balance was changed. These are live-combat visual/readability improvements, not a claim of a mechanical rebalance. Reduced motion removes the dash wake/particles and retains a stationary slash/contact equivalent. No full-screen flash or camera-shake increase was added.

## Verification that this is the actual game
`gameplay-results.json` and the two WebM recordings come from the normal `main.js` **Start Run** path with the free starter loadout. Puppeteer selects visible targets from the renderer's trace and sends actual mouse clicks or Space. The debug run is read only: there is no health, enemy, position, phase, equipment or renderer injection. Tutorial completion is seeded only to enter ordinary play.

Both desktop (1280×720) and portrait phone (390×844) admitted real launches and five kills. No page/frame errors or equipment/save changes occurred. The footage includes the real HUD and arena, not a second canvas, shop preview, generated study or forced combat-event illustration. It is scripted bot gameplay, not human usability testing or device-FPS certification.

- `actual-gameplay-1280.webm`: desktop Start Run recording.
- `actual-gameplay-390.webm`: portrait Start Run recording.
- `play-*.jpg`: screenshots from those real runs.
- `baseline/art-before.js.gz`: genuine pre-correction renderer.
- Reproduce: `LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/live-combat-play-qa.mjs` (defaults to port 5201).
- Tests: `test/live-combat-presentation.test.js`, plus existing build/action/equipment suites.

A fresh live preview is served on port 5201 to make it easy to load the updated game instead of returning to an older preview tab. Browser saves are origin-scoped; this does not delete the old preview's saves. C64 Tide mechanical migration remains separate and pending. See `validation.json` for final gates.
