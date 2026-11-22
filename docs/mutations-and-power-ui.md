# Mutation expansion and glanceable powers

> Historical audit of the visual-mutation chunk. The later [sword and Armory upgrade](sword-armory-upgrade.md) adds authoritative full-build sword mechanics and classifies the 17 full builds as 11 Apex + 6 Zenith. Individual cosmetic parts and the 18 Sparks remain cosmetic; the visual-only statements below describe this earlier checkpoint.

## Delivered

Expanded the catalogue from **21 to 35 mutations**: **18 two-part Sparks** and **17 Apex recipes**. Kept all 53 equipment items, their prices, six worlds, existing recipe IDs, ownership rules, challenges and combat rules intact.

### New Apex builds

| Build | Recipe |
| --- | --- |
| Storm Conductor | Lightning Coil + Chamfer Frame + Echo Heart + Neon Laser |
| Furnace Regent | Cube Crown + Lava Cracked + Riot Reactor + Anchor Chain |
| Chrono Wraith | Cyber Ears + Hologram Wire + Time Crystal + Ghost Scarf |
| Rescue Paladin | Danger Beacon + Bastion Iron + Magnet Dynamo + Prism Wings |
| Glass Shogun | Samurai Crest + Notched Frame + Glass Cannon + Katana Ink |
| Prism Oracle | Gold Halo + Prism Shell + Grav Core + Neon Spectrum |

New Sparks: Storm Relay, Furnace Heart, Chrono Cat, Magnet Guard, Glass Edge, Rift Lens, Sky Signal, Night Signal.

These are **visual fusions**, not hidden combat multipliers. The actual equipped parts retain their existing, documented powers and costs. Glass Shogun still requires the Glass Cannon challenge; viewing a recipe never grants it.

## Harmony

- New Apex silhouettes use attached shoulder/root planes, material-colored panels and matching lower shell connections rather than floating badges or orbiting symbols.
- Six new contour profiles share the same CORE-owned trim, face exclusion and level-of-detail rules.
- New Sparks add small lower-body joints rather than covering the eyes or adding competing CORE decals.
- Arbitrary head/body/tail mixes now share restrained CORE-colored mount and tail-socket seams. World rim lighting remains separate from CORE color identity.
- Existing visual construction, character animation and tapered slash system remain authoritative. No drawing path mutates equipment, run state or physics.

## Fast power UI

New pure `src/power-readout.js` provides short, literal receipts for every item:

- A concise effect name and trigger, such as FASTER DASH / EVERY DASH.
- At most two key stat chips. Viper shows **SPEED +20%** and **CUT WIDTH −15%** together; Glass shows **SCORE ×2** and **MAX HULL 1**.
- Negative trade-offs have a contrasting treatment.
- Card captions now show the important number/action rather than requiring the player to parse a paragraph.
- Cosmetic items explicitly say **STYLE ONLY** / **NO COMBAT CHANGE**.
- The preview header shows a compact build receipt: speed percentage, EDGE and HULL.
- Optional **INFO** opens the original full explanation in a separate accessible dialog. It does not expand the shop layout or take space away from the first two rows of cards.

The sandbox remains a movement/art preview, not a simulation of every combat proc. The displayed numbers describe the run rules; the UI does not claim that a dummy cut demonstrates every equipment power.

## Faster recipe flow

- The codex exposes recipe names and ingredient names rather than forcing players to decipher question marks.
- Every recipe has **TRY BUILD**. This previews the full visual combination, including unowned ingredients, without saving it as equipped, spending currency, granting ownership, or marking a discovery.
- **EQUIP BUILD** appears only when all ingredients are owned and requires an explicit click.
- Otherwise **N PARTS NEEDED** routes to the first missing ingredient in its shop slot. Purchasing still uses the existing explicit BUY action; challenge items remain unbuyable.
- Equipping discovers the recipe normally. Presets and randomization clear temporary recipe previews; reopening the lab returns to the actual equipped build.

## Validation

- Full suite: **413/413 pass**, including the long renderer/refresh-rate suite, direct-aim regressions, movement contract, quests, ownership, combat and old recipe checks.
- New power-readout tests cover all 53 items, frozen receipts, literal cosmetic labeling, exact agreement with equipmentRules, all 35 recipe descriptors, discovery migration without free ownership, and new Apex state/color preservation across six worlds and three sizes.
- Chromium visual matrix expanded to **1,050 renders**: 35 recipes × six worlds × five animation modes; zero page errors or transform/alpha leaks.
- New `scripts/power-ui-browser-qa.mjs` passes at **1280×720, 960×640, 550×720 and 860×440**. Covers visible Viper benefits/trade-offs, optional INFO, all 35 recipe cards, preview-vs-save boundary, confirmed build equip, discovery, unchanged wallet, and routing to missing parts without free unlocks.
- Harmony browser checks pass desktop and compact sizes with the 35-entry codex.
- Comic layout gate passes development and built single-file production: seven tabs, minimum preview size, first two complete card rows, sidebar bounds, compact controls and spaced footer.
- Lab input/reduced-motion checks pass pointer cancellation, keyboard focus, manual dummy hit, explicit try-on and no silent equip.
- Art-engine browser fixture passes Manual specimens, live gameplay and Best Stroke adapter.
- Build passes: **538.69 kB / 229.38 kB gzip**, single-file verifier passes. `git diff --check` is clean.

Directly inspected desktop and compact power receipts, mobile Storm Conductor preview, and both new-Apex matrix crops. Corrected duplicated/unsupported INFO glyph rendering during visual iteration by using a plain text INFO control.

Local captures and reports: `.arena/mutation-upgrade/`, `.arena/mutation-matrix/`, `.arena/harmony/`. No new long-duration soak is claimed; the tests and browser renders are deterministic and short interaction checks.

## Reproduce

Use the existing united port-3000 server:

```sh
node --test test/power-readout.test.js test/art-direction.test.js test/harmony.test.js
npm test
npm run build
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/power-ui-browser-qa.mjs
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/mutation-matrix-browser-qa.mjs
```
