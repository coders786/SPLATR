# Visual Theatre — shop upgrade

## Request
A substantial visual/animation upgrade with almost no reading needed: visual story rather than instruction paragraphs.

## Implemented
- Reframed the Armory around a large, quiet illustration stage rather than a canvas followed by a teaching worksheet.
- Default part previews use a slow **part → action → consequence** loop, with pictorial controls for each beat. Pausing, replaying and manually holding a beat are supported.
- New staged head/core sequences show contact, neighboring arcs, armor plates, fall comparison, combo/grace arcs, focus return, pulled Fangs, Overdrive and a stationary Core Echo blade. Their displayed rule values come from the existing studies.
- Five elemental sequences use the existing immutable Ember, Frost, Void, Reprise and Volt study samples. Removed text-heavy receipt panels and replaced them with targets, plate cells, damage crosses, collars, paths, field boundaries and timing pictograms. These are illustrations of the existing authorities, not new combat logic.
- New external-effect scenes for Hypno, Wings and Radar: an aimed idle Fang hesitates; a wall contact returns a resource cell; radar reach and hazard information expand visually.
- Tools/trails show their actual pointer, sensor, dash or slash artwork in the introduction instead of an unrelated idle cube. Remaining part families keep their existing item-specific animation/study in an enlarged, text-free presentation.
- Enlarged catalogue art; pared captions back to item names, prices and ownership marks. Category/slot/destination controls are pictorial, with accessible names and optional hover titles.
- Removed default instruction paragraphs, benefit chips, district prose, comparison essays, setup captions, looping-status copy and non-error text receipts from the visual path. Status receipts remain available to assistive technology.
- Visible transaction language is intentionally retained: **BUY**, **EQUIP**, numeric prices/shortfalls and an equipped check. Product names remain. This is near-zero instructional text, not a claim of zero visible letters everywhere.
- Full factual rules remain behind the explicit **info** control. Accessibility descriptions retain the effect and limits. Manual practice and assembly inspection remain available; optional inspection/reference modes can still have labels.
- Mobile keeps the selected-part action within reach. Short landscape puts beat controls beside the stage; the toolbar overlap found during screenshot QA was fixed.

## Behavior preserved
No changes to damage, item rules, prices, rewards, collision geometry or save formats in this upgrade. Previewing and stepping a story do not buy, equip or grant parts. Buying and equipping remain separate and share the existing transaction handler. Existing unrelated local work was preserved; no commit/push was made.

## Checks and evidence
- Automated painter coverage: **all 73 catalogue entries × three beats**, with no painted teaching text, no equipment mutation, a nonempty image and restored canvas transforms.
- Timeline tests cover setup/action/result holds, loop reset, finite inputs, manual stepping, reduced-motion stability and per-study clocks. The clocks matter: Reprise's delayed replay and Void's collapse must actually reach their result state.
- **53 focused tests passed** after the main implementation; the all-item visual tests passed again after the final tool/scene polish.
- **Seven existing assembly/shop layout cases passed**, including all 17 examples, explicit buy/equip, actual run equipment and no page/frame errors.
- **Four new small-layout/motion task cases passed:** 390×844 touch emulation, 320×568 touch emulation, 640×360 and reduced-motion 390×844. Optional details can be opened and closed; a purchase charges 400 without equipping; the separate equip changes the head without charging twice. Manual/reduced poses remain still.
- **48 native-browser story frames** from 16 items, **three desktop shop screens**, **12 small-layout shop/ownership/browse screens**, and **two prior-version baseline screens** are retained here.
- Two approximately 5.5-second WebM recordings capture the actual running shop canvas on the normal browser clock: Coil and Ember. They are not synthesized animations or edited illustrations.
- Production build and single-file bundle checks passed. `git diff --check` passed.
- **Final full suite: 1,411 passed, 0 failed**, after the last scene refinements.

Open `index.html` for the clips, before/after views and all three-beat sequences. See `manifest.json` for the native stage capture list. Main implementation: `src/visual-story.js`, the Visual Theatre section of `src/lab.css`, `src/customize.js`, and `drawVisualShopStory` / `visualOnlyContext` in the standalone art engine.

## Honest limits
- This is scripted browser QA and visual inspection, not a human comprehension study. Removing words does not itself prove that every power is understood.
- Some subtler remaining toolkit/shell benefits still use their earlier graphical studies rather than newly authored combat vignettes. Optional details retain exact exceptions, timing and caps that a silent picture cannot reliably communicate alone.
- These are slowed illustrative examples, not replays of a live run. World panoramas show appearance, not a new playable environment or a complete silent explanation of world score perks.
- Touch checks use browser emulation, not physical phones. No audio assessment or FPS claim.

## Reproduce
```sh
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/wordless-shop-review.mjs
node --test test/visual-story.test.js
npm test
npm run build
```
