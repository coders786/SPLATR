# Quest removal — 2026-11-24

The shipped entry module no longer imports or starts the quest/deed system.
No board, Q drawer, claims, rerolls, quest HUD, prize track or Vault is created;
no quest event tracking or quest-reveal tick skipping remains in the game loop.
The old modules remain only for historical regression tests; Vite excludes them
from the release dependency graph.

`shop-wallet.js` now owns the economy. It migrates credits and valid owned parts
from the old save once, without destroying that save or the equipment save.
Run credits still come from cuts, score and sector depth. An ended active run is
paid once; practice cannot earn currency. Purchases validate catalogue prices,
funds and duplicates. Challenge parts remain earned through gameplay.

`round-reward-ui.js` displays live projected pay and an end-of-run receipt without
moving or duplicating Retry/Home. Practice/help buttons are wired independently.

Validation: 29 targeted wallet/pause/title tests passed. Full suite and release
build are rerun after the shop and impact chunks in this change set.
