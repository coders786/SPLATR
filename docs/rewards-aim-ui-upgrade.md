# Reward-first results, optional quests, safer aiming

## Player-facing changes

- Reorganized the existing two-column end screen around the round receipt. Score, form, stroke and combat recap remain left; a high-contrast CREDITS payout, total wallet, optional bonus disclosure and replay controls sit right.
- PLAY AGAIN is the dominant action. Quest progress is no longer presented as the purpose or requirement of a round. Expanded quest details preserve button bounds on compact landscape layouts.
- Persistent BONUS QUESTS ON/OFF control in the menu. OFF genuinely disables progress, quest-specific replenishment, quest HUD/peek and portals for that run, rather than merely hiding them. Regular play and currency pay remain available.
- CREDITS replaces the currency name INK in wallets, shop prices, purchase feedback and chest receipts. Existing `coins` fields remain unchanged for save compatibility. Artistic terms such as Ink Ronin and drawing-ink helpers are not currencies and retain their names.
- Wallet total is visible in the menu as well as the shop and round receipt.
- Default industrial district improvements from the preceding iteration remain intact.

## Every-round pay

Pure implementation: `src/round-rewards.js`. Every ended round receives:

| Component | CREDITS |
| --- | --- |
| Base | 10 |
| Cuts | 2 per kill, capped at 100 |
| Score | 1 per 250 points, capped at 150 |
| Sectors | 5 per sector after sector 1, capped at 60 |

Total range: 10–320 per round, in addition to existing Vault/chest rewards. This includes manually ended rounds; intentional early ending still receives the requested guaranteed base. It uses no wall time, so pausing cannot increase pay. Quest prize-track points remain a separate bonus progression measure, not a second spendable currency. The existing one-shot death receipt guard prevents repeated `over` events from paying again. Each genuinely new round gets its own receipt.

## Aim and release fixes

- Cancellation, blur, capture loss and pause now discard refused-shot buffers. New pointer/directional/Shift intent replaces old pending intent.
- A deliberate pull returned within 8 display pixels of its origin cancels instead of turning into an unrelated tap shot. Drag recognition is latched from pointer events, not only render frequency.
- Invalid and zero-power vectors never reach commit.
- Direction-key release recalculates remaining held directions rather than retaining a stale diagonal.
- Preserved the 140 ms refused-release buffer, primary-pointer capture, tap targeting, backward-pull controls and shared magnetized preview/release vector.
- Added a fixed-screen-size launch compass, power arc, launch arrow and release/lock/recovery/wall feedback in the authoritative art engine.
- Fixed preview rendering's target-stop condition: path samples were being compared for exact equality to the target center, so the guide could run past the predicted first impact. It now stops at the sampled contact distance. This is a drawing fix; collision and launch physics are unchanged.

## Validation and visual review

- `npm test`: **401/401 pass**, including the long real-renderer frame suite.
- Production build passes: **522.73 kB**, gzip **224.70 kB**; single-file verifier passes.
- New `scripts/rewards-aim-browser-qa.mjs`: real mouse hold/release, visible aim instructions, quest preference persistence, OFF-state hidden HUD and blocked peek, round/retry payouts, and expanded-details viewport/button bounds at **1280×720, 960×640, 550×720, 860×440**. Zero page errors.
- Master result/retry gate passes its three sizes, including forced stroke panel/six-digit-score layout stress.
- Comic layout gate passes development and built single-file output. Harmony desktop and compact layout gates pass with longer shop currency labels.
- Lab input gate passes reduced-motion, manual dash, keyboard, cancellation, secondary-button and try-on focus checks.
- Directly inspected Chromium aim, desktop results, compact portrait free-play results, and expanded 860×440 quest details. Captures and JSON measurements are under `.arena/rewards-aim/`; master stress captures are under `.arena/master-browser/`.

Browser aim captures demonstrate real event handling and visual feedback; deterministic unit tests additionally verify preview/release vector equality, one-shot firing, no fire after capture loss/blur, return-to-origin cancellation and new-intent buffer replacement. No new long-duration combat soak or native touch-device playthrough is claimed.

## Reproduce

Use the existing united server on port 3000; no second service is needed.

```sh
node --test test/input.test.js test/round-rewards.test.js test/quest-ui.test.js test/launch-agreement.test.js
npm test
npm run build
CHROME_BIN=/tmp/chromium LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib node scripts/rewards-aim-browser-qa.mjs
```
