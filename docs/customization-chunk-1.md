# Customization — chunk 1

Implemented the first of the four agreed chunks. Entry: **Customize / Shop** on the title menu. Uses the existing unified Vite server on port 3000; no additional server.

## Delivered

- Versioned equipment save (`riot.equipment`), seven validated slots, free defaults, three explicit save/load presets, owned-only Randomize.
- Fourteen catalog items plus an empty-head option: Halo/Ears, Ninja/Visor, Paper/Obsidian, Standard/Time, Ribbon/Wings, Razor/Katana, Twilight/Tokyo.
- Desktop 60/40 layout; narrow screens use SHOP / LIVE PREVIEW switches. Preview space shrinks before controls disappear. Separate inspect, buy, and equip actions. Owned/equipped/selected states, visible keyboard focus and modal Escape dismissal.
- Shared `cube()` renderer for cards, live preview, actual player, and BEST STROKE. Equipment snapshots are frozen at run start and attached to dash stroke records. Subsequent shop changes do not recolor an earlier stroke.
- Preview slice loop (90 animation ticks / approximately 1.5 seconds), aim/dash/bounce/hit demonstrations. Reduced motion freezes preview animation. Preview dummy is illustration only: it cannot earn kills, INK, or unlocks.
- Procedural halo, ears, visor, obsidian seams, hourglass core, faceted wings, ink-brush slash and drops, neon city/rain. Katana adds a quiet metallic audio accent to the existing coalesced hit cue.
- Halo reduces **player-only** falling aim gravity by 15%, without changing enemy/world gravity. Wings grant an additional EDGE on the first side-wall contact until floor recovery resets the allowance. Time Crystal grants 120 simulation ticks of twice-normal passive FOCUS recovery after a kill. Existing immediate kill refill is preserved, so this benefits subsequent spending, not a fictitious extra refill above full.
- Uses existing quest/Vault INK earnings, not a second currency or invented starter credit. Existing Halo/Wings prize unlocks are recognized as ownership; shop purchases mark those same prize items owned. Prize progress costs remain distinct from INK shop prices.

## Verification

- `npm test`: **315/315 passed**, 58.87 seconds.
- `npm run build`: **429.28 kB**, gzip **189.50 kB**, single-file verification passed.
- `scripts/customize-browser-qa.mjs`: real Chromium at 1280×720, 550×720, 860×440; seeded test wallet and existing Vault Halo ownership; buys Obsidian/Visor/Wings, equips, saves preset, verifies exact wallet balance and stored loadout, opens run, zero JS errors. Verifies no outer-dialog scrolling/horizontal clipping and presets inside dialog bounds. Browser fixture currency is test setup, not earned gameplay.
- `scripts/master-browser-qa.mjs`: existing three-size gameplay/menu/end-card/retry checks passed after integration.
- New unit tests: catalog, corrupt-save recovery, ownership validation, purchases, randomize, immutable run/stroke snapshot, rendering at 15/48-pixel radii without context leaks, player-only Halo gravity.
- QA captures: `.arena/customize/shop-{width}x{height}.png`, `run-{width}x{height}.png` (local, intentionally not committed).

## Scope and remaining work

This is the foundation collection, not all 49 items. No capsules, Run Shield, rerolls, hybrids, remaining catalog, or new world music; those remain in later chunks. The demo actions visually exercise attachments but are not a second full combat simulator. Initial drawing treatments are implemented; human review of art/audio feel and broader mix-and-match visual approval are still needed. The shop transaction uses the current local-save architecture; crash-atomic receipts and reload-during-purchase hardening remain chunk 4 work, not claimed here.
