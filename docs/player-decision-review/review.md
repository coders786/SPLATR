# Next player-view review: from seeing a part to choosing it

## What was reviewed
A focused follow-up to the five-pass visual upgrade. I inspected the upgraded handoff/shop evidence, then captured new comparison screens and exercised the Armory’s decision flow through native browser actions.

This is an informed, scripted player-task review—not feedback from recruited users. The handoff was not re-run in this follow-up; its earlier real-course evidence remains in the five-pass gallery. This implementation concentrates on the biggest remaining shop decision friction.

## Player questions used
1. Which part is equipped, and which one am I only trying?
2. What would the selected part actually do for me?
3. Can I buy it from the screen where I am watching/comparing it?
4. If I buy it, is it already active?
5. If I cannot afford it, why is the action unavailable?

## Findings and implemented response

### High: the comparison looked better than it read on phones
The fitted character pictures were visible, but names and benefits were baked into a scaled canvas. On narrow screens, the most important decision text was tiny. Source: `before-comparison-390x844.jpg` and `before-comparison-320x568.jpg`.

**Implemented:** a real-text **WHAT CHANGES** comparison with equipped/selected names and factual benefits, plus expandable **Trade-offs & limits**. It uses existing item descriptions, not invented power numbers. The selected benefit comes first on cramped screens; the equipped description remains available by scrolling. Very short phones put this readable text before the illustration, which remains below it.

### High: mobile preview hid the transaction action on another tab
The mobile Preview tab hid the selected-product shelf containing Buy/Equip. A player could understand an ability and still have to rediscover where to act.

**Implemented:** a persistent selected-part decision bar on mobile and short-landscape previews. It displays the item name, ownership state, clear next step and one action. It is not shown for read-only assembly examples, core mechanism inspection, manual practice or build-recipe previews. Desktop keeps the already-visible original product shelf rather than duplicating its action.

Both original and preview buttons use the existing purchase/equip transaction path. No new automatic equip, free ownership, new reward or purchase-on-preview behavior was introduced.

### Medium: buying and equipping needed a stronger distinction
The earlier success receipt explained the distinction, but on mobile the next action lived on the hidden Shop shelf.

**Implemented:** buying changes the decision bar to **OWNED · NOT EQUIPPED**, followed by **EQUIP FOR NEXT RUN**. Equipping is a separate action; it does not charge again. The bar then shows **EQUIPPED** and explains when the change takes effect. Keyboard focus remains on the visible next action after a purchase.

### Medium: a disabled price button did not fully answer “what now?”
A shortfall alone did not give enough context for a new player with no credits.

**Implemented:** the exact full cost, missing amount and plain-language explanation: earn credits by playing runs; trying the part remains free. Challenge-locked parts use a separate explanation and cannot be bought. Owned challenge parts can still equip normally.

### Small navigation improvement
While comparing, the Compare control becomes **SEE ABILITY**, returning to the selected part’s ability/world study without changing saved equipment or credits.

## Verification
- **Five new browser task cases passed:** 390×844 touch-emulated, 320×568 touch-emulated, 640×360, 1440×900 and reduced-motion 390×844.
- In each case: preview and comparison leave storage unchanged; buying Lightning Coil charges 400 once but leaves Bare Head equipped; the separate equip action changes the head without a second charge; presets remain unchanged; return-to-ability leaves storage unchanged; a zero-credit Halo preview explains the shortfall and cannot buy.
- The mobile decision action was checked to be inside viewport bounds immediately after opening comparison.
- **Seven existing assembly/shop layout cases passed**, including all 17 read-only examples, explicit buy/equip, actual run equipment and no page/frame errors.
- Focused pre-final presentation/shop tests: **47 passed**; three additional decision-copy tests passed, covering exact shortfalls, buy/own/equipped states and challenge locks.
- Production build / single-file bundle check and whitespace diff check passed.
- **Full suite: 1,408 passed, 0 failed.**
- **25 screenshots retained:** five before screens and four after states per layout/motion case. See `index.html`, `before-results.json` and `after-results.json`.

## Remaining issues / next priority
- On 320×568 and short landscape, comparison still scrolls. The selected benefit is prioritized, but not every limit, both full descriptions and the illustration fit at once. This is not presented as a scroll-free design.
- The first combat screen still introduces many HUD signals at once. A sensible next world-focused review would follow the first gate cut through the first three anchors, asking whether the player can find the next real objective without reading developer vocabulary.
- The captures use controlled animation time for consistent comparisons. They are not an FPS test or a measurement of human comprehension. Touch is browser emulation, not physical-device validation. No audio assessment.

## Reproduce
```sh
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/player-decision-review.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib PREVIEW_URL=http://127.0.0.1:5192 node scripts/assembly-browser-qa.mjs
node --test test/shop-decision.test.js
npm test
npm run build
```

Work stays on the current branch. Existing unrelated local item/gameplay changes and prior review artifacts were preserved. Nothing committed or pushed.
