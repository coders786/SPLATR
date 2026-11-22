# Chunk 3 complete — full catalog and hybrid art pass

Supersedes the staged `customization-chunk-3-progress.md` report. Entry remains **Customize / Shop**, on the one unified port 3000 server.

## Delivered scope

The full original **49-item catalog** is implemented, plus a free empty-head option: 9 head choices including empty, 7 eyes, 7 shells, 7 cores, 7 tails, 7 slash treatments, 6 worlds. Challenge-only Oni and Glass remain non-purchasable. Crown/Vault ownership remains compatible with the existing prize track.

All five hybrid recipes are now achievable from real catalog items:

- **LASER WYRM**: electric spine/zigzag sparks.
- **INK RONIN**: drifting, outlined ink petals; four-part recipe.
- **VOID KING**: tilted royal orbit rings and gold orbit marks.
- **CYBER PHANTOM**: restrained cyan outline echoes.
- **APEX SUN**: gold corona, orbiting star glints.

Hybrid selection is deterministic, visual-only, and cannot stack hidden combat buffs. Discoveries persist after equipping a completed recipe. Accessible expandable recipe lists replace reliance on a tooltip; partial hints use each recipe's actual denominator. Collection badges require every item in the slot, including challenge pieces.

## Art and presentation

`equipment-details-art.js` provides authored vector geometry for the new attachments: metallic crown/crest, electric coil, warning beacon, four expressive faces, crystal facets, bolted steel, glowing magma seams, multi-stop gold foil, vortex/magnet/echo cores, linked anchor chain, nozzle flames, forked streamers and segmented rainbow ribbon. Parts share the existing Cube transform and render in cards, live preview, actual gameplay and prints.

`equipment-art.js` adds all seven slash/impact styles, including stepped RGB fracture, foil fragments, comic starbursts and gravity-falling pixel debris (cosmetic floor reflection when near the physical floor). Simulation-owned burst/needle/echo lists are capped; drawing does not emit or age them. Reduced motion suppresses nonessential burst motion.

World art now includes layered city planes, rain, window/sign accents, industrial pipe collars, moon glow, paper grain/hatching, a striped synth sun, mountain silhouettes, perspective grid and a restrained black Void. Procedural audio voices vary by world and hit style; no externally sourced music or textures. Manga uses monochrome enemy artwork while preserving warning/hazard colors and equipped-part identity. It is not a global desaturation filter that hides danger lasers. Manga HUD labels and bars received a separate contrast pass.

BEST STROKE now includes a **constant-size equipped Cube stamp**, in addition to the actual contact diagram. Long world-space strokes can no longer reduce the only view of the build to one pixel. The saved run/stroke loadout remains authoritative, not later shop selections.

Full catalog layout: tabs and selected-item actions stay fixed; only the card grid scrolls. Selected rows are brought into view. Compact-height cards use a measured mini layout with picture/name/tag/ownership still visible. SHOP/PREVIEW switching remains for narrow screens.

## Gameplay rules added this pass

| Equipment | Exact implementation |
|---|---|
| Crown | Two armor plates on direct Crown/Bastion hits; ordinary launch speed ×0.92. Existing Overdrive damage and Hyper steering retained. |
| Samurai | Blade width ×1.2 within 25° of horizontal; no extra forward reach. |
| Coil | One nearest target within 160 px, one plate per direct slice. Secondary attacks cannot recursively trigger Coil/Echo/Throughcut waves. |
| Beacon | Amber marker during Fang `tell`/windup, clamped into current view for distant threats. Does not delay or weaken enemies. |
| Prism Shell | Two upward needles per eligible side-wall contact, 45-tick cooldown; each can damage one Fang. |
| Iron | One Bastion body-bump block per run, with separation and outward velocity. No global invulnerability; projectiles are not blocked. Arena walls were already harmless and are not falsely advertised as a new shield source. |
| Grav | Only small forward Fangs within 220 px move toward the live aim line; at most 0.35 px per simulation tick. No renderer-owned movement. |
| Magnet | Extra ×1.2 width only for targets within 100 px. Still requires real contacts; no quest or Throughcut-completion shortcut. |
| Echo | Every third direct chain kill leaves a 30-tick stationary blade, one hit per Fang per blade. |
| Anchor | Eligible floor rebound ×1.15 and Fang-only wave within 170 px; existing floor recovery cooldown remains. |
| Thrusters | Earned rail rebound ×1.08 without raising the existing ceiling. No passive-bounce engine. |

Cosmetic Eyes, Slash styles and Worlds are tested stat-neutral. Existing Halo, Viper, Wings, Riot, Time, Ghost, Oni and Glass rules remain covered. A bank-only kill ledger crash path exposed by secondary effects was fixed with a real fallback stroke carrying the loadout snapshot.

Bounds: at most **8 needles, 3 echo blades, 12 visual bursts**. Target ties use stable IDs. No new network services, dependencies, image assets, luck quests or starter credit.

## Verification

- Full `npm test`: **343/343 PASS**, 74.82 seconds.
- Production build: **461.16 kB**, gzip **202.21 kB**, single-file verification passed (450.3 KiB).
- `git diff --check`: clean.
- `catalog-complete.test.js`: exact slot counts, all real recipe parts, bounded aim pull, independent horizontal/close width, Crown plates, non-recursive Coil, one-use Iron, Echo trigger, Prism cooldown, Fang-only floor wave/bank ledger, stable targets, Canvas state, saved discoveries, actual Thruster/Anchor ratios, stat-neutral cosmetic slots.
- `scripts/catalog-complete-browser-qa.mjs`: real Chromium at **1280×720, 550×720, 860×440**; equips all five recipes, verifies discoveries survive reload, preview/run titles, bounds and zero JS errors. Ownership is seeded test setup, not claimed as earned play.
- `scripts/catalog-art-browser-qa.mjs`: isolated real Chromium gallery of **all 50 choices**. Verifies every item in each slot has distinct rendered pixels, draws all worlds/styles, and produces five BEST STROKE prints from actual deterministic seeded combat—not fabricated stroke records. Zero JS errors. Distinct pixels are a placeholder/regression check, not a claim of human art approval.
- Existing master input/end-card/retry and chunk-1 purchases/wallet/presets browser checks pass at all three sizes.
- Reviewed full-size/compact hybrid screenshots, shell/world galleries, and all five seeded prints. The stronger screenshots caught shrinking/clipped catalog labels and poor paper-world HUD contrast; both fixed before final verification.

Local QA evidence is generated under `.arena/catalog-complete/`: `full-catalog.png`, `art-{slot}.png`, `best-strokes.png`, and each hybrid's shop/run frames at three sizes. These are intentionally excluded from Git; scripts recreate them.

## Remaining work is chunk 4, not unfinished catalog

Mystery Capsules, paid quest rerolls, Run Shield, crash-atomic purchase receipts and release-hardening remain chunk 4. Human visual/audio/feel approval, exhaustive combinatorial performance balancing and native-pointer portal playthrough remain separate acceptance work. The implementation is complete for chunk 3; this report does not represent those human checks as performed.
