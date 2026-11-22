# Wave conversion — chunk 1

## Implemented
- The main Start/Retry path now opts into finite-wave combat, not endless streaming or the old staged opening.
- Compact 1800 × 1550 arena, 12 enemies initially, +3 per wave up to 30. Later waves introduce Prism, Bastion and Crown. Combat actors use the actual run arena for movement/spawn bounds.
- Last living enemy (including fragments) gates the clear. Endless stream, empty-field rescue and sector Crown producer are excluded in wave mode.
- Clear summons a real static Matter platform near the player. Land and settle for 12 ticks to open the upgrade selection. No automatic teleport or timer-only clear.
- Three seeded, unique options. Choose one; next wave begins. Buff is replaced at the following selection, not stacked or saved to equipment. No purchases or permanent unlocks involved.
- Six offers: +15% dash speed, +20% blade reach, +1 armored damage, +8 blade ticks, +25% cut score, or +8 post-cut grace ticks.
- The offer dialog freezes gameplay and quest tick progression, traps keyboard navigation, cannot Escape-dismiss without choosing, resets input before/after selection, and does not launch the cube on selection.
- Optional quests moved from the title card wall into a Quests destination in the primary menu. Live quest pips removed; Q and pause inspection retained. Completed wave-mode quest tickets grant their normal reward without the legacy portal/Vault flow interrupting the rest choice. Legacy/tutorial mode keeps its existing flow.
- Main button is exactly Shop, without the arrow. Full Shop information architecture is not part of this chunk.

## Validation
- Full suite: 415 passed, zero failed.
- Production build and single-file verifier pass: 547.55 kB / 231.83 kB gzip.
- Chromium/Puppeteer: menu, quest dialog, live wave, physical platform landing, three unique offers, and wave-two budget checked at 1280×720, 550×720 and 860×440. Offer dialog bounds fit all three.
- Visually inspected menu at 550px, live combat at 1280px and offer dialog at 860×440. Initial inspection found enemies spawning above the opening camera: corrected the spawn rows and re-inspected visible actors.
- New deterministic unit tests exercise finite budget/no endless respawn, last enemy gating, physical rest, frozen choose phase, invalid/double choices, next-wave budget and temporary-buff replacement.
- Existing floor-flash source assertion updated to accept the additional actual-arena renderer argument; flash behavior remains checked.

## Next chunks (not implemented here)
2. Authoritative sword upgrades, distinct Apex/Zenith sword styles, and explicit looks/power tier tradeoffs. Existing visual fusion recipes must not be presented as mechanical powers before these rules exist.
3. Shop navigation/information architecture, clearer ownership/equip/upgrade choices, and further multi-size visual and gameplay iteration.

This is a tested first playable wave loop, not an engagement claim or a completed balance pass. No fresh long soak is claimed. Scripts: `node --test test/waves.test.js`, `npm test`, `npm run build`, and `LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/waves-browser-qa.mjs`.
