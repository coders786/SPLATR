# Sword and Armory implementation

## Completion status

This implementation follows the wave-loop chunk. It adds functioning sword styles, character-connected vector swords, full-build tier rules, clearer Shop destinations and a real-combat sword test chamber. It is not a permanent sword-level/XP system or a completed human balance study.

| Area | Status |
| --- | --- |
| Six distinct blade silhouettes and attack families | Implemented and visually inspected in Chromium |
| All 17 full builds have distinct tuning signatures | Implemented; deterministic uniqueness test |
| Apex / Zenith classification | 11 Apex focused styles / 6 Zenith conditional styles |
| 18 two-part Sparks | Retained as visual fusions; no independent signature sword |
| Mixed/incomplete equipment | Standard blade, with existing individual part powers |
| Temporary wave upgrades | Integrated; replacement rather than permanent mutation/stacking |
| Real combat test chamber | Implemented; separate sandbox, no wallet/save/equip writes |
| Builds / Parts / Sword destinations | Implemented in the existing Shop; Parts remains its initial view |
| Build filters, ownership, missing parts, strengths/tradeoffs | Implemented |
| Full dedicated Builds-first Shop page replacement | Not implemented; existing modal library retained |
| Permanent sword XP or paid numerical sword levels | Deliberately not implemented |
| Comparative human balance / retention results | Not established |

## Authoritative rules

`src/swords.js` resolves the most-specific complete full-build recipe, using catalogue order for equal-size ties. It owns immutable family profiles, build-specific variants, effective temporary modifiers and bounded secondary-attack scheduling. Renderer code never resolves or grants powers.

Apex means focused primary specialization with an explicit cost. Zenith means a conditional second strike with reduced baseline coverage/duration. Neither is a universal damage tier.

The six families are:
- **Cleaver:** broad, clipped weighted wedge; more width in exchange for reach and duration.
- **Rapier:** narrow ridged needle; longer reach, narrower lane.
- **Breaker:** compact reinforced chisel; +1 direct armored damage with coverage/duration costs.
- **Reaper:** hooked cutaway blade; longer duration with narrower width.
- **Echo:** divided blade and separated twin; fixed original lane, delayed one-damage strike, capped targets.
- **Pulse:** segmented capacitor blade; direct contacts charge a one-damage forward lane on the next dash, capped targets.

Every family has a keyed collar and wrapped tang connecting it to the cube. Blades use ink outlines, two-step cel faces, a dark ridge and a restrained cutting accent. Idle, aim and active silhouettes differ. Zenith has a diamond collar key. Pulse has the correct number of visible charge segments for its build. Reduced motion keeps blade shape and secondary-lane information without requiring a flash or moving trail.

### Build table

All changes below are sword-style modifiers, before the existing individual equipment rules. Width and reach multiply the normal forward sensor; window values are simulation ticks. ARMOR +1 affects direct armored contact, not every target. Secondary lanes have fixed geometry and do not scale with the temporary reach/armor offer.

| Build | Tier | Sword / family | Signature rule |
| --- | --- | --- | --- |
| Laser Wyrm | Apex | Wire Lance / Rapier | Reach +30%, width -32%, window -1 |
| Ink Ronin | Apex | Paper Oath / Rapier | Reach +16%, width -12%, window -1 |
| Void King | Apex | Grav Chisel / Breaker | Armor +1, reach -8%, width -8%, window -4 |
| Cyber Phantom | Zenith | Phase Oath / Echo | 22-tick delay, 300px lane, 2 targets; width -22%, window -2 |
| Mecha Reaper | Apex | Mecha Hook / Reaper | Window +8, width -16% |
| Star Eater | Zenith | Star Capacitor / Pulse | 4 contacts, 300px lane, 3 targets; width -20%, window -2 |
| Apex Sun | Apex | Sun Splitter / Cleaver | Width +32%, reach -14%, window -3 |
| Glacier Crown | Apex | Chrono Hook / Reaper | Window +10, reach -5%, width -22% |
| Spectral Briar | Apex | Briar Hook / Reaper | Window +6, reach +8%, width -10% |
| Arc Sentinel | Apex | Rail Fault / Breaker | Armor +1, width +4%, reach -16% |
| Arcade Sovereign | Zenith | Pixel Reprise / Echo | 14-tick delay, 230px lane, 3 targets; reach -10%, width -14%, window -2 |
| Storm Conductor | Zenith | Arc Capacitor / Pulse | 3 contacts, 220px lane, 3 targets; reach -4%, width -15%, window -2 |
| Furnace Regent | Apex | Furnace Slab / Cleaver | Width +45%, reach -20%, window -4 |
| Chrono Wraith | Zenith | After Oath / Echo | 18-tick delay, 270px lane, 3 targets; reach -5%, width -18%, window -2 |
| Rescue Paladin | Apex | Rescue Edge / Breaker | Armor +1, reach -10%, width -8%, window -3 |
| Glass Shogun | Apex | Glass Needle / Rapier | Reach +32%, width -35% |
| Prism Oracle | Zenith | Orbit Engine / Pulse | 4 contacts, 250px lane, 4 targets; reach -4%, width -12%, window -2 |

Individual equipment powers still combine. For example, a crown part's existing armor rule and a Breaker style's +1 are separate, explicit layers. These are not hidden global multipliers. Cosmetics remain cosmetic as individual items; completing a supported full build is what activates its sword profile.

## Secondary attack contracts

- Launch direction is never changed by the sword system.
- Echo snapshots origin and angle at dash time; it does not home or track the player afterward.
- Pulse counts valid direct contacts, once per primary attack/target through the existing contact ledger. Equipment secondaries, forward shears and sword secondaries cannot charge it.
- Reaching full charge provides HUD/readiness feedback. The next eligible combat dash spends it.
- Every secondary lane executes once, damages an enemy at most once and enforces its target cap, including compound sensor intersections.
- Sword secondary contacts may damage an armored survivor already hit by the primary, without rewriting the primary's last-hit ledger.
- Remote secondary armor hits do not shove the player backward.
- Secondary hits use one damage, cannot recursively trigger coil/echo/shear chains and cannot generate further sword attacks. Normal kill accounting still applies.
- Pending lanes are bounded to three per run. Visual remnants expire.
- Death, disposal and wave rest clear the appropriate pending sword state. Rest also clears charge, equipment projectiles/echoes and overdrive.

## Wave/rest presentation

The live wave HUD includes tier/family and Pulse charge. The rest dialog shows the equipped blade, the next wave's actual budget/threat category, modifier lifetime and replacement/expiry information. Reach, duration and armor offers display their style-adjusted result.

The platform now has a layered beveled deck, restrained assembly scaling, landing light, under-deck keys and a landing label. Visual inspection found a real obstruction: the original launch pad could keep the player above the newly summoned platform. On the first clear, that pad is now retired from both physics and artwork. The rest deck is inserted into predictor geometry and removed with its Matter body on selection.

## Shop changes

- Main menu remains exactly **Shop**, without an arrow.
- Header destinations are **Builds**, **Parts**, and **Sword**.
- Build library filters: All, Owned, Apex, Zenith, Sparks.
- Full build cards show the sword on the character, tier, style, strength, tradeoff and ownership/missing-part count.
- Owned builds are visually revealed even if discovery history is absent.
- Try-on does not save or equip. Equipping a complete recipe requires ownership and explicit confirmation through its action button.
- Missing-part actions navigate to the needed item rather than buying or unlocking it.
- Unaffordable purchase buttons show the precise shortfall and are disabled.
- Equipped items say Equipped. A part preview warns when it breaks the equipped signature build.
- The clickable live-build strip opens sword inspection.

The existing animated lab remains a cosmetic/manual toy preview with the sword artwork overlaid. It is not represented as the authoritative sword-combat simulator. The separate Sword destination uses `createRun`, actual enemy sensors, primary contacts, armor and secondary-attack rules. Its protected, refillable test scene is explicitly labeled no rewards. Auto controls issue test launches; drag/release and Space are also supported. No real run currency or progress is earned.

## Architecture

- `src/swords.js`: authoritative rules and bounded secondary scheduler.
- `src/run.js`: combat integration, charge and attack lifecycle.
- `src/art/splatr-art-engine.js`: all sword, chamber and platform drawing. Remains one import-free ES module, without DOM, store or physics writes. New drawing exports are additive.
- `src/sword-desk.js`: DOM/input and real-run test-scene lifecycle, no direct canvas artwork.
- `src/customize.js` / `src/lab.css`: Shop navigation, recipe receipts, filters and responsive layouts.
- `src/wave-ui.js` / `src/waves.js`: temporary modifier receipts, next-wave brief and platform lifecycle.

Existing equipment prices, catalogue IDs, purchases and saves are preserved. The legacy 17-entry `HYBRIDS` API and its historical art-layer label remain compatible; runtime gameplay classification is now `SWORD_BUILDS` (11 Apex, 6 Zenith). Earlier mutation audits describe the pre-sword visual-only state, not current full-build combat behavior.

## Verification performed

- Final full suite: **423 passed, zero failed**.
- Production build and single-file verifier: **577.66 kB / 240.96 kB gzip**.
- Focused tests cover all 17 mappings and distinct signatures, immutable/effective values, fixed lanes, delayed execution, caps, no recursive execution, live Echo armor follow-up, direct-contact Pulse charging/spending, Breaker damage, rest cleanup and canvas state balance.
- Chromium Shop flow at 1280×720, 960×640, 550×720 and 860×440: filters, ownership, try-on/equip separation, real sword desk, live equipped build, dialog bounds and no wallet changes/page errors.
- Chromium wave flow at three sizes: physical landing, three offers, next-wave budget and no selection-click launch.
- Dev and single-file production layout gate: seven tabs, two full rows, 16:10 live preview, sidebar/footer bounds and responsive layouts.
- Native browser input: **96 gestures**, six sword families × eight directions × mouse/touch. Preview, released vector and actual Matter launch velocity agree.
- Existing lab-input browser checks: reduced-motion hold/dash, keyboard, cancellation, focus and no silent equip.
- Existing four-size power UI checks: literal part receipts, recipe ownership and missing-part navigation. The expected insufficient-funds action was updated from BUY to NEED n MORE.
- Real-combat audit: 17 builds × 3 seeds = 51 bounded protected-bot fixtures; every fixture cleared the first wave. This checks operability/bounds, not human balance, difficulty or engagement.
- Chromium pure-engine world captures for six styles and the actual summoned platform; visually inspected live Wraith/Storm, the deck, family silhouette matrix, build library, mobile Shop, sword desk and short-window upgrade dialog.
- `git diff --check` clean.

During iteration the layout gate caught mobile header/wallet overlap and preview-control overflow; both were corrected and the dev/production gates rerun. The first full test run also caught artwork outside the pure engine; chamber drawing was moved into the engine, preserving the architecture check.

No fresh 20-minute soak, native-device test, long-term progression balance or retention result is claimed.

### Reproduce

```sh
npm test
npm run build
node scripts/sword-combat-audit.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/swords-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/sword-world-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/sword-direction-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/waves-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/comic-layout-gate.mjs
```

Browser captures/reports are generated under `.arena/swords`, `.arena/sword-direction`, and the existing gate-specific scratch directories. They are intentionally not checked in as a large generated dataset.
