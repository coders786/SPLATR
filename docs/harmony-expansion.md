# Harmony + shape expansion — two chunks

## Chunk 1: shared harmony and cosmetic profiles

The standalone engine now exports frozen `SHAPE_MODIFIERS` and the pure `resolveVisualHarmony(equipment, time, pose)` descriptor. CORE supplies primary/secondary/light hues; BODY contributes trim, WORLD contributes rim light. Attachment accents blend their identity with CORE rather than using unrelated colors. Small repeated chevrons, fasteners and socket marks visually link parts.

Three purchasable BODY profiles were added to the existing scrollable BODY tab:

| Profile | Ink | Treatment |
| --- | ---: | --- |
| Chamfer Frame | 280 | clipped corners, inset corner plates |
| Notched Frame | 320 | side notches and inset seams |
| Segmented Frame | 380 | layered side plates |

These are cosmetic. Collision shapes, movement, combat modifiers and default equipment are unchanged. Profile artwork is clipped to its outline. Ownership and migration use the existing catalogue validation.

## Chunk 2: four evolution families

| Spark | Parts | Apex | Additional parts |
| --- | --- | --- | --- |
| Cryo Lens | Chamfer + Time | Glacier Crown | Halo + Laser |
| Razor Leaf | Notched + Spectrum | Spectral Briar | Hypno |
| Arc Relay | Segmented + Magnet | Arc Sentinel | Coil |
| Pixel Echo | Echo + Pixel | Arcade Sovereign | Visor + Synth |

Distinct presentation geometry includes crystal crown facets, spectral thorn/leaf arcs, orbiting segmented shields, and pixel satellites. Sparks retain their smaller detail when the matching Apex is active. Existing matching priority is preserved. Recipes confer visuals, not undocumented gameplay powers.

The catalogue now has 53 entries (including the empty head), 10 Sparks and 11 Apex recipes. The Codex header derives its count from recipe data; saves keep using existing discovery IDs and ownership storage.

## Verification

- Final `npm test`: **371 passed, 0 failed**, 78.31 seconds.
- `npm run build`: passed; single-file HTML **514.41 kB**, gzip **221.04 kB**.
- Chromium mutation matrix: **21 × 6 worlds × 5 actions = 630 renders**, no page errors or Canvas transform/alpha leaks.
- Development and single-file production layout gates passed: seven horizontal tabs, two complete card rows, live preview dimensions, compact controls, sidebar/footer bounds; compact viewport checks included.
- Harmony/browser checks passed: 21-entry Codex, native pointer cuts, Manga lab/run, unchanged wallet.
- Input checks passed: reduced motion, Space, pointer cancellation, focus retention, explicit try-on, clean reopen.
- Art surface checks passed: eight Manual specimens, live game, Best Stroke adapter fixture.
- End-card/retry checks passed at 1280×720, 550×720, 860×440.
- Directly inspected Chromium Apex matrix and production BODY-tab screenshot. These show the distinct new forms and intact layout; numerical render counts are not the sole visual gate.

New focused tests cover immutable profiles, deterministic harmony, world/CORE color separation, unchanged equipment rules, purchase/migration, pixel distinction, Spark-to-Apex progression, missing-ingredient rejection and Canvas state restoration. Count guards were updated only for intentional additions.

Authoritative complete source: `src/art/splatr-art-engine.js`. No imports, DOM dependencies or physics/store writes were added to the engine.
