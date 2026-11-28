# Shop clarity — implementation pass 1

## Delivered

This implements the **hierarchy pass** from `docs/shop-clarity-review/findings.md`, rather than attempting all findings at once.

- Main categories now retain small functional names. The selected equipment slot has a visible label. The mobile view switch reads **Shop / Try**.
- The mobile header puts title, balance and Back on one row. The equipped starter's duplicate summary is hidden in mobile Browse; a different selected part reveals a slim, actionable selection row. Desktop selection summaries are shorter and no longer duplicate the full-character thumbnail.
- The preview has one labeled, native **Tools** disclosure containing Compare, Details, Practice and Build. Controls remain available to touch and keyboard users. Tool actions close the menu; Escape closes it without closing the shop; clicking outside closes it. Practice remains scrollable.
- Play/Pause is grouped with the three visual story steps. The duplicate painted dots are suppressed only when the shop owns the external accessible rail; standalone illustration callers retain them.
- Preview orientation includes the current category and **Trying / Owned / Equipped** state. The equipped transaction label now says Equipped rather than a bare tick.
- Empty search/filter results offer a direct **Show all** recovery action.
- Existing separate Buy → Equip transactions, optional details, full wordless product stories, build examples and manual practice are retained.

## Screenshot comparison

Genuine baseline screenshots were copied from the immediately preceding review, not reconstructed using new CSS.

| View | Before first product row | After first product row |
|---|---:|---:|
| 320×568 fresh entry | approximately 375px | 247px |
| 390×844 fresh entry | approximately 384px | 255px |
| 1440×900 fresh entry | approximately 369px | 330px |

Before positions are read from the captured review images; after positions are actual DOM bounds logged by the browser script. The gains apply to the **fresh, equipped-item entry state**, not every selection or mode. Selecting another part deliberately adds the slim action row. There is no measured comprehension or conversion claim.

The gallery contains **55 new native screenshots** plus four genuine review baselines. States include entry, selection, default preview, open tools, comparison, build inspector, practice and owned/equipped transactions.

## Validation

- Full regression suite: **1,422 passed / 0 failed**.
- Focused visual-story/transaction tests: **7 passed**. The new test proves suppressing the shop's duplicate rail changes only the rail region, not the illustration above it.
- Browser QA: seven layout/motion cases (1440×900, 960×540, 640×360, 390×844, 844×390, 320×568, and reduced-motion 390×844).
- All four menu actions are hit-testable and at least 44×44 CSS pixels in every tested layout. Native Enter/Escape disclosure behavior was exercised; Escape leaves the shop open.
- Manual and reduced-motion stories hold still. Compare return, details, build reference navigation, practice entry/exit and empty-filter recovery pass.
- Browsing/trying/build/practice do not mutate saved equipment or wallet.
- Three funded purchase sequences (desktop and both portrait mobile sizes) verify buying does not equip; explicitly equipping saves the Coil; balance ends at 1,100 from 1,500 after the 400-credit purchase.
- Zero browser page errors. No document horizontal overflow in the tested states.
- Production single-file build: **1,237.0 KiB**. Syntax checks and `git diff --check` pass.

QA caught legacy sandbox grid rules positioning Practice outside the new menu and a caption pseudo-element adding “Hover to replay.” Both were removed from the disclosure's scope. QA also caught the need to close the menu independently of a replaced icon/text click target; tool listeners now bind directly to the stable button.

## Scope / remaining work

Changed application files: `src/customize.js`, `src/lab.css`, and the optional rail flag in `src/art/splatr-art-engine.js`. A rendering regression test and `scripts/shop-clarity-update-qa.mjs` were added. Existing unrelated work was preserved.

Still for later passes:

- Category-specific, part-first thumbnail composition—especially enlarged core mechanisms.
- Comparison that demonstrates the difference in gameplay outcome, rather than just two outfits.
- Further optional-detail deduplication and a fuller ownership-badge system.
- Tall-preview composition/letterboxing and remaining secondary navigation icons.

No powers, damage, physics, prices, ownership rules, economy or cooldowns changed. No commit or push was made. Scripted browser checks are not a recruited-user usability study or a physical-device test.

## Reproduce

```sh
npm run dev -- --port 5192 --strictPort
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/shop-clarity-update-qa.mjs
node --test test/visual-story.test.js test/shop-decision.test.js
npm test
npm run build
```
