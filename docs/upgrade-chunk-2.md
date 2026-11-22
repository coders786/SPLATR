# Chunk 2 — contact, lifecycle and honest comparison geometry

Implemented for the Longer Cut / Heavy Cut / Block a Hit reference group.

## Real contact, not a decorative second attack
Run armor and cut events carry upgrade ID, equipment copy, sword profile, actual plates removed and secondary-hit flag. The renderer captures those values at the hit, so changing/expiring the buff cannot change a contact already in flight.

`drawUpgradeArmorContact` replaces the generic local burst for eligible direct upgraded armor hits. Paper tears, furnace chips and broken spectral contours differ in geometry. Heavy Cut adds a short pressure seam; Longer Cut uses a narrow piercing seam. Geometry is local, finite (16 ticks), speed-sensitive and limited to three fragments. Actual gameplay damage is untouched. Secondary/echo/shear contacts skip this upgrade-specific punctuation. Existing enemy shards/contact ink remain; this is not another damaging projectile or collision.

## Lifecycle
`upgradeVisualPhase` derives assembly from wave simulation age (18 ticks), expiry from restAge (12 ticks). No wall clock, timer that advances during pause, or gameplay delay. Reduced motion immediately shows active state/removes expired state. Existing weapon is not scaled down for these structural upgrades: only extension/inlay/back-spine/ward construction changes.

The wave director captures `expiredShield` before resetting charges for presentation of an unspent ward retracting. Zero charges remains zero throughout assembly and expiry; a spent ward never reconstructs. Buff rules and hit windows activate/expire instantly; retiring artwork has no gameplay power.

## Honest comparisons
`upgradeComparison` calculates the target position from the equipped weapon's base and boosted reach, rather than one hard-coded target for every sword. The target near edge lies between baseline and upgraded tips. Armor comparison includes existing sword armor damage plus Crown head contribution, using a fixed three-plate target: a build that already strips all three plates honestly shows both results cleared rather than inventing extra enemy HP to sell the upgrade.

Remaining illustrative limits: these are matched authored scenes, not embedded simulations; other unimplemented upgrade groups retain their current preview shortcuts. Special enemy armor caps or per-encounter rules are not simulated in the card.

## Validation
- Four added tests cover lifecycle/reduced-motion/spent ward, short/long reach comparisons, real armor totals, deterministic bounded material contacts and a real heavy hit removing exactly three plates once from a five-plate fixture.
- Full suite: 506 passing, zero failures (192.8s).
- Chromium nine-reference study plus 12 construction lifecycle snapshots; inspected `.arena/upgrade-construction/lifecycle-contact.png`. Snapshot sheet intentionally isolates/composes construction details, not a legal simultaneous buff loadout.
- All eleven choice offers across 16 rest layouts/four viewports pass: bounds, idle stability, zero idle draws, motion suppression, accessible labels, no scrolling/errors.
- 33 live HUD/spent-ward/expiry fixtures pass.
- Final build: 712.55 kB, gzip 281.45 kB, self-contained HTML.

Chunk 3 remains speed upgrades: Short-Blade Rush naming, stronger functional speed/shortened-reach distinction without overwriting elemental dash identity. Human comprehension and real-device pacing are still external gates.
