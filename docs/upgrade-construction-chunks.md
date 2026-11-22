# Build-harmonized upgrade implementation — chunk ledger

## Chunk 1: structural reference treatments (implemented)
Scope: Longer Cut, Heavy Cut and Block a Hit; paper/furnace/spectral reference constructions. No new damage, windows or inventory rules.

### Shared construction descriptor
`resolveUpgradeConstruction(equipment,sword)` returns frozen material/colors from the actual body and relevant build identity. Hologram/echo/ghost signatures resolve spectral; lava/forge/sun resolve furnace; paper is the baseline. Metal/crystal fallback finishes are present but have not received a dedicated fidelity pass. Palette uses existing harmony light/energy, not three fixed buff colors.

### Longer Cut
Maintains original weapon family. Paper has unfolding diagonal joins; furnace has a heated tip seam; spectral has broken etched extension contours. Extra active length remains supplied by authoritative effective reach. No extra generic crescent or buff rim. Existing weapon shape, charge details and tier collar survive.

### Heavy Cut
Removed the forced replacement with a generic cleaver family. Existing rapier/cleaver/echo/pulse construction remains. Added an attached back-spine: folded paper ridge, furnace pressure seam, compressed spectral face. Blade inlay clipped to existing outline; back-spine is a small non-damaging construction detail. Does not imply wider attack sensor. Original attack reach/window rules unchanged.

### Block a Hit
A single sacrificial side panel fits the lower side of the equipped body. Paper overlaps/folds, furnace panel uses dark vents/heated seams, spectral panel is a broken contour. Initial inspection caught a front-covering/chin-like result; moved it to the side to preserve face/core. Remaining charge is authoritative; zero charges draws no ward. Removed duplicate generic ward arcs for this buff.

Blocked-hit presentation event now captures equipment/sword snapshots, so the fracture uses the consumed ward's construction. Paper tears, furnace chips and spectral contour fragments are different geometry, not merely different tint. These are presentation-only event fields.

### Integration
Live weapon and combat accent calls pass actual equipment/sword. Comparative preview uses the same weapon/ward functions. Existing temporal lifetime/one-shot replay preserved. No animation added to idle cards.

### Validation
- Nine reference treatments rendered and inspected in Chromium. Screenshot `.arena/upgrade-construction/reference-nine.png`.
- Added construction tests: frozen descriptors; nine deterministic distinct treatments; spent ward/context restoration/input immutability.
- Updated old accent test to compose weapon + overlay for structural upgrades. It originally failed because reach/heavy no longer paint redundant standalone accents; all eleven full presentations remain tested as distinct.
- Full final suite: 502/502 PASS, 161.0s.
- 33 live HUD/modifier browser fixtures PASS.
- 16 real-rest choice fixtures/four sizes PASS, including settled draw caching, motion-off, accessible names and idle stability.
- Build PASS: 709.77 kB, gzip 280.52 kB; one self-contained HTML.

## Chunk 2 (next, not implemented)
Function-specific action/contact timing for these reference treatments: material-aware real armor contacts, selective assembly/expiry, stronger actual-gameplay timing captures across weapon families. Remove any remaining preview shortcuts that can misrepresent a particular equipped weapon's reach. Do not add new damage events.

## Chunk 3 (planned)
Faster Dash and Short-Blade Rush: preserve elemental dash identity while conveying speed/shorter reach separately; rename duplicate card label; real matched travel previews.

## Chunk 4 (planned)
Longer Slash and Safer Cuts: use authoritative blade/protection state, not invented visual timers; prevent confusion with actual echo follow-up attacks.

## Chunk 5 (planned)
Score/Risky Score, Break Armor and Twin Ward; visible cost and charge transitions, no extra hit/currency implications.

## Final gates
Material/weapon stress matrix, phone previews, reduced motion, expiry/replacement, floor/bank/portal loops, real-device frame pacing and unfamiliar-player observation. No completion claim for these external or future steps.
