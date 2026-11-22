# Upgrade-choice redesign: diagnosis, research and verification

## Why the previous version confused
Observed in the user's screenshot and confirmed in implementation:
1. A pose plus cosmetic parts did not demonstrate a mechanical benefit. The target/ward symbols were too abstract to establish causality.
2. There was no visible baseline. A longer blade and a faster dash cannot be judged from one isolated upgraded pose.
3. Fictional labels (COMET DRIVE, SAFE EDGE) forced players to decode names, icons and technical stats at once.
4. Ordinary temporary buffs gained detached plates/fins unrelated to the purchased equipment language. It was not obvious whether this was a skin, a weapon or a stat change.
5. A sword-tier strip and payout counters competed with the actual three-way choice.
6. Technical language (grace, ticks, armor versus armor damage) added reading/interpretation cost.
7. Programmatic initial focus could trigger a demo without intentional interaction.

These are design/code diagnoses, not measured results from a novice comprehension study. Earlier passing layout tests did not establish that the previews were meaningful.

## Research: relevant evidence, not a pile of generic tips
### Supersonic: hypercasual prototype clarity
https://supersonic.com/learn/blog/improve-the-clarity-of-your-hyper-casual-prototype-with-these-3-art-design-tips/
Publisher guidance emphasizes clarity of mechanic/goal, contrast, placement, cohesive UI and a small set of primary actions. Applied: retain three choices; make the benefit the largest text; simplify the reward screen; keep the recognizable equipped actor and danger colors. Its commercial case-study uplift is not projected onto SPLATR.

### Nielsen Norman Group: animation should explain change
https://www.nngroup.com/articles/guidelines-for-multimedia-on-the-web/
Longstanding interaction guidance describes animation as useful for tracking state change and demonstrating operations, while continuous peripheral motion distracts. Applied: matched NOW/BOOST states, one-shot replay, stationary result by default. This is general UX guidance, not modern hypercasual retention evidence.

### Nielsen Norman Group: icons need context/labels
https://www.nngroup.com/videos/icon-usability/
Icon interpretation depends on familiarity; unfamiliar operations benefit from labels. Applied: original icons remain supporting cues, not substitutes for plain action names. No claim that adding icons alone solves comprehension.

### W3C: interaction animation and motion sensitivity
https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
Avoid unnecessary motion, respect reduced-motion preferences and provide user control. Applied with existing saved/system preference handling and frozen comparative results; no looping three-card performance. This is not a complete WCAG-conformance claim.

## New visual hierarchy
- WAVE N CLEAR.
- CHOOSE ONE · NEXT WAVE ONLY.
- Three outcome-first cards: name → NOW/BOOST comparison → one numerical benefit → clearly marked COST when applicable → CHOOSE action.
- Removed visible payout/sword-tier strips from this decision screen. Settlement data and actual rewards remain unchanged.
- New `src/buff-presentation.js` is the player-facing copy catalogue for all eleven buffs. Examples: LONGER CUT, FASTER DASH, BLOCK A HIT, MORE SCORE, SAFER CUTS. Fractions in seconds replace exposed tick jargon where needed.

## Comparison scenes
Same character/loadout, start position and framing in both rows:
- Reach: baseline misses a target the boosted blade reaches.
- Speed: synchronized travel over the same elapsed time; actual buff multiplier determines distance.
- Shield: normal contact loses a hull pip; boosted contact fractures the shield and preserves hull.
- Armor: remaining armor pips reflect +1 or +2 extra plate damage. +1 does not falsely kill a three-plate target.
- Score: same cut with 100 versus the real multiplied value.
- Blade duration: late target survives after ordinary blade expiry but is cut by the lasting blade.
- Guard: a longer-lived post-cut protection arc, with a plain explanatory label.

Comparisons are illustrative and compressed, not hidden miniature combat simulations. They do not grant damage or rewards.

## Character/art correction
Removed detached costume-like plates/fins/brackets from most temporary modifiers. Existing Shop equipment remains intact. Temporary effects now read mainly through the shared weapon renderer (length, shape, split edge), action trails and fitted shield plates. A restrained colored rim is secondary feedback, not the explanation. Physical shields still disappear with real charge use; movement/collision geometry is unchanged.

## Motion behavior
No idle loop. Explicit hover or keyboard focus after the opening window replays once and holds the result at 1100ms. Initial automatic modal focus is ignored for replay. Reduced motion shows the full comparison result without travel. Touch selection remains one press; no new confirmation or extra tap is required.

## Validation
- Final full suite: 495 passing, zero failures, 139s.
- Two added tests cover all eleven copy entries/trade-offs and stable comparison endpoints/reduced-motion frames.
- New `scripts/boost-redesign-browser-qa.mjs`: all eleven buffs across 16 actual-rest layouts at four sizes. All cards/actions fit; idle canvas pixels stay unchanged; no dialog scrolling/page errors. Fixtures inject catalogue offers after actual physical rest.
- Existing rest QA: 15 fixtures/five sizes pass.
- Active-buff QA: 33 fixtures pass, live badges/spent ward/expiry remain intact.
- Wordless first-play QA: four sizes pass, automatic clean wave-one transition/reward isolation preserved.
- Inspected redesigned 1280px and 390px screenshots. Phone keeps text/actions beside compact comparisons; desktop shows larger aligned baseline/result scenes. Numeric/cost text is the primary explanation where phone art is small.
- Final build: one self-contained HTML, 702.04 kB / gzip 277.62 kB.

## Still needs human validation
Ask unfamiliar players to explain a card before choosing it, distinguish temporary versus Shop purchases, identify a cost, and predict the next action. Compare mistakes/time-to-choice before/after. Automated tests and research principles cannot establish that confusion is solved. No native-device frame-time or retention claim.
