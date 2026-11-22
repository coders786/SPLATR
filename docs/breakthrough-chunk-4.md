# Five-wave breakthrough and kill receipts

Implemented on arena/ba6cdf01-splatr.

## Player contract
Ordinary waves never require pace. Every fifth combat clear opens a safe practice finish: hold pace, launch Hyper, clean-bank within its window for Sonic, then make a fresh launch through the breach. Readiness alone cannot shatter. A swept crossing prevents tunneling. REST WITHOUT SHATTER keeps ordinary rewards and proceeds to the same physical platform and three temporary choices. The next five-wave cycle resets breakthrough state. Missed Hyper can recharge through moving target-speed practice; waiting/holding does not recharge.

Hyper lasts 90 simulation ticks, recharge takes 90 moving ticks; factors 1.18/1.08, ceiling 58. Existing sword Hyper does not receive additional multiplication. These are tuning defaults, not human-tested balance.

Enemy kills, points and credits have a separate ledger. Fang 2; Prism/Fork/Pulse 3; Bastion/Rift/Well 4; Crown 10 credits. Fragments yield zero credits; paper/unknown excluded. Credits settle once on defeat, not on every hit. End results disclose enemy rows plus control records. Optional teaching quests cover pace and shattering without exposing hybrid recipes.

## Validation
- Full node suite: 458 passing, zero failures (96.6 seconds).
- Production single-file build passes, including bundle verification; rebuilt after compact results fixes.
- New scripts/breakthrough-browser-qa.mjs: eight Chromium journeys at 1280×720, 550×720, 390×680, 860×440, full/reduced effects. Uses production run/physics/art/UI modules. Checks fifth-wave safe clear, actual pace/Hyper/bank, no automatic completion, deliberate shatter, physical platform landing, choice and wave-six reset, HUD bounds and zero page errors.
- This fixture removes enemies to reach milestones and positions a clear practice lane. It is not a full human combat run or an input-device test.
- Inspected ready mobile, ready short-landscape reduced-effects, mobile rest and short-landscape result screenshots. New receipt initially caused short results scrolling; compressed short-layout spacing, then reran the master gate successfully.
- Master browser: three sizes, end-card/buttons in bounds, zero panel scrolling, retry and zero JS errors.
- Rest layouts: 15 fixtures/five sizes, all choices visible without dialog scroll.
- Speed regression: five sizes, Space start, retry and inactive pace.
- Bank regression: eight real-physics scenes/four sizes.
- Protected encounter audit: 150/150 combat clears; milestone breaches explicitly skipped. This validates combat containment, not shatter skill or human balance.
- Focused node tests cover skip safety/reward preservation, repeated skip rejection, real default-kit post-clear skill path, recharge, immutable state, placement, swept crossing and credit exploit prevention.

Screenshots/logs are generated in ignored .arena/breakthrough and related QA folders. Reproduce with CHROME_BIN=/tmp/chromium and LD_LIBRARY_PATH=/tmp/splatr-chrome-libs/lib where required. Browser fixture code is durable; generated captures are not committed.

## Limits
No fresh extended soak, native touch-device testing, human comprehension/retention study or frame-time benchmark. Full-app skip-pointer safety remains primarily implementation and node coverage, not an end-to-end physical pointer journey. Future balance should measure real player completion/error rates, not infer success from these fixtures.
