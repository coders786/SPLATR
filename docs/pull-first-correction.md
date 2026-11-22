# Pull-back controls and play-first onboarding

This correction supersedes the earlier direct-drag contract. The user explicitly rejected it and asked for pull-back launching, distinguishable taps/drags, a wordless learning ground on first visit, and substantially less reading.

## Controls
- Pull away from the desired launch direction; release launches the opposite way. Keyboard aiming is unchanged.
- Tap below 14 CSS pixels (mouse) or 20 (touch) uses the original pressed target. Previously the scaled power calculation could turn small jitter into a weak drag before the old drag flag latched. Classification now happens before power calculation.
- Once a pull crosses the threshold it cannot silently become a tap. Returning inside the starting circle cancels it.
- A visible dead-zone ring, outgoing arrow and existing actual trajectory preview distinguish the gesture before release; no instructional sentence is drawn over the cube.
- Arena and control practice share createInput. Sword practice and Shop preview use the same gesture classifier. Shop preview fits long rays without bending their bearing.
- Capture loss, pointer cancellation, blur, menus and disposal still cancel held/buffered input.
- The wordless pull demonstration now shows the finger moving opposite the outgoing shot.

## First visit
Fresh storage opens the existing real Cutting Room immediately: no Start/menu click and no visible text/HUD. Targets, animated hands and pictograms demonstrate play. Clearing its racks queues a fresh wave-one run safely after the old simulation tick. Lesson score/kills/credits do not transfer. Returning players keep normal menu access; deliberately leaving the lesson does not trap them in repeated onboarding. Startup uses a small loading bar instead of the verbose loading panel (no-JavaScript fallback retained).

## Less reading
Encounter announcement paragraphs and quest toasts are hidden during play. Idle bank explanations are removed from the HUD. Upgrade cards show name/stat, not explanatory paragraphs, tactics or next-encounter essays; their receipt is kills/credits and their instruction is PICK ONE. Long receipts remain accessible via aria-label, not a required visual read. Wave-clear feedback is CLEAR, ready is READY and ward feedback is BLOCK. End-card coaching/rank prose is hidden; score, payout and replay lead. Optional Shop/Learn details remain available; unknown hybrid recipes stay secret.

## Verification
- Final full node suite: **475 passed, zero failed**. Single-file production build and bundle verification pass: **655.06 kB / 263.49 kB gzip**.
- `scripts/aim-direction-browser-qa.mjs`: sixteen native pointer directions (eight × mouse/touch), real run/physics, opposite-pull launch, preview equals release, exactly one shot. Also native mouse/touch jitter stays a tap and returned pulls cancel. Touch movement is allowed a rendering frame for Chromium's coalesced move delivery before preview assertions.
- `scripts/sword-direction-browser-qa.mjs`: 96 native gestures, six sword styles × eight directions × mouse/touch; actual physics follows the pull-back contract.
- `scripts/first-play-browser-qa.mjs`: four sizes, fresh storage goes directly to the wordless ground, zero menu clicks, visible targets, four native target taps per fixture, deterministic real simulation between taps, automatic clean wave-one transition, no lesson reward carryover, returning-player menu and zero page errors. Narrow fixtures use Chromium touch emulation. This is not a novice comprehension test or a native-device run.
- Reran master results/retry at three sizes; 15 rest-choice fixtures; eight breach-input journeys; eight control-practice journeys and two touch-emulation journeys; eight Shop trial journeys; four-size discovery Shop/secrecy/purchase-vs-equip gates.
- Inspected fresh mobile/desktop learning screenshots, a live pull preview, and the compact first-wave screen. New first-visit and pull screenshots/logs regenerate under ignored `.arena/pull-first`.

Still unverified: real-device ergonomics and unfamiliar-player understanding. No claim that automated tests establish fun, dopamine, retention or human usability.
