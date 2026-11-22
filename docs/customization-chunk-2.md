# Customization — chunk 2

Implemented on the existing unified port 3000 server. Chunk 1 is historical context in `customization-chunk-1.md`.

## Collection

Added seven items, bringing the catalog to **21 designed items plus the free empty-head option**:

| Slot | Item | INK | Implemented treatment |
|---|---|---:|---|
| Head | Viper Horns | 300 | Faceted crimson horns; launch speed ×1.2, cut width ×0.85 |
| Eyes | SSJ Blaze | 150 | Pale gold-white eyes, aiming light streaks |
| Body | Hologram Wire | 500 | Transparent cyan shell, inset wire facets, rotating default core |
| Core | Riot Reactor | 500 | Lime battery/lightning heart; Overdrive every four consecutive kills instead of six, two EDGE maximum |
| Tail | Ghost Double-Scarf (card: Ghost Scarf) | 350 | Two translucent cyan ribbons; six extra launch-blade simulation ticks |
| Slash | Neon Laser | 250 | Cyan/pink beam, one bounded 30-tick cosmetic scar, quiet electric hit accent |
| World | Blood Moon Foundry (card: Blood Foundry) | 300 | Crimson sky/moon, orange industrial pipes, drifting embers, lower procedural bass voice |

All drawing is procedural and uses the shared Cube/slash/world renderers in the shop and game. BEST STROKE preserves the run's equipment snapshot and draws the new slash style. No downloaded textures/audio or new dependencies.

## Rules and integration

`equipmentRules()` resolves immutable modifiers once per run. Previous Halo, Time Crystal, and Wings powers now also come from this rules layer. No power lives in render code.

- Viper scales the launch **after** the normal input clamp, raises its permitted normal speed, and shortens its initial blade lifetime by the same factor. This preserves the straight-line speed×active-time budget; it does **not** claim identical ballistic landing distance or identical gravity-affected range. Item details explicitly disclose this.
- Thin blade width is passed separately into the combat sweep, without reducing forward reach. Existing physical body-contact rules still apply.
- Viper aim solutions account for the actual launch speed. Arc prediction and release samples accept the matching speed ceiling.
- Hyper steering retains its existing preserve-speed behavior rather than stacking another Viper boost.
- Riot uses per-run `edgeMax` for initial state, recharge, kill refunds, rail/floor refunds, sectors, and Vault entry/return. Existing dynamic HUD code renders exactly two bars. Standard remains three.
- Riot's 1.5× faster Overdrive means four consecutive kills instead of six. Quest requirements, Hyper thresholds, and score rules are unchanged.
- Ghost extends the active blade, not the list of hittable enemies. Existing per-shot `lastSlash` protection remains authoritative, including plated enemies.
- The neon scar is one replaceable simulation-owned record, capped at 30 ticks. It has no collision or damage authority. Drawing it cannot prolong it.
- Foundry changes only background/art/music voice, not hazard colors or simulation. Reduced-motion gates stop its embers.

## Verification

- `npm test`: **320/320 PASS**, 57.30 seconds.
- `npm run build`: **433.70 kB**, gzip **191.07 kB**; single-file check passed (423.5 KiB).
- New tests cover modifier composition/immutability, exact Viper launch ratio and initial speed×blade-time budget, Ghost extension, Riot cap through Vault return/recovery/new run, laser scar aging, actual seeded Riot activation at chain four versus standard chain six.
- Catalog render test exercises all 22 entries at combat and preview radii with Canvas state-leak checks.
- `scripts/equipment-wave2-browser-qa.mjs`: real Chromium at **1280×720, 550×720, 860×440**, purchases/equips all seven new items, verifies exact wallet deduction (10,000→7,650), saved build, dialog bounds, actual full-field start, two-bar Riot HUD, zero JS errors. The initial wallet is seeded test data, not earned gameplay.
- Existing chunk-1 customization and master end-card/input/retry browser checks also pass at all three sizes.
- Reviewed rendered shop and full-field Foundry images. Local QA captures: `.arena/equipment-wave2/build-{width}x{height}.png` and `run-{width}x{height}.png`.
- `git diff --check` clean; unified server returns HTTP 200.

## Remaining scope

This is not the full 49-item collection. Remaining catalog, challenge rewards and hybrids are chunk 3; capsules, rerolls, shields and crash-atomic purchase receipts are chunk 4. The Foundry audio is a procedural variation, not a separately composed/licensed soundtrack. Human audio/feel approval, exhaustive visual-combination review, and native-pointer portal playthrough remain separate acceptance work; automated checks are not represented as human approval.
