# Armory — product-first visual upgrade

## What changed

- New shop-only product renderer uses the production attachment geometry: isolated headwear, enlarged fitted core cartridges, eye plates, tail kits, and blade/launch references. Shells retain character context; arena and aiming-tool cards retain their actual previews. No replacement raster art.
- Midnight-blue display stages, mounting rails and restrained material swatches; pale paper captions separate the product from its information. Selected cards turn lime; ownership stays independent.
- Explicit **Equipped / Owned / Challenge / Trying** shelf labels replace ambiguous checkmarks. Coin prices remain readable on pale captions. Short existing player-facing headlines tell the power without adding another instruction panel.
- Shelf height is capped at 230px so tall mobile screens reveal more products. The first mobile row still starts before 300px on both 320px and 390px layouts.
- Compare now has **Wearing / Trying** names outside the illustration. **Look** shows the two fitted builds and magnified changed part; **Power** uses the existing rules-backed demonstrations, the same story clock and each build's actual sword profile. These are illustrated examples, not a controlled damage benchmark or live combat.
- Power comparison reuses pause/manual beat selection. Short landscape layouts show only Play/Pause beside Tools to keep controls off the art; the full three-step rail remains on desktop and portrait.
- Existing progressive Tools disclosure and separate Buy → Owned → Equip transaction path remain intact. Purchases, item rules, gameplay physics, storage schema and live FX were not changed by this pass.

## Boundaries and performance

The new renderer is local to the shop. It reuses production primitives without inventing live charge, extra damage, cooldowns or item ownership. Reduced-motion portraits have fixed pixels regardless of supplied clock. Existing 20-entry thumbnail cache and selected/hovered-only repaint limits remain. No new perpetual emitter, imported art asset, network request or timer.

The comparison's Power mode is two illustrative examples at a synchronized story phase, not guaranteed equal combat conditions. Full-size Try remains the better view for small effects, especially on 640×360. Human comprehension, conversion, physical-device performance and FPS have not been measured.

## Evidence and reproduction

- `index.html`: screenshot-led before/after gallery; all 91 new native browser screenshots linked.
- `results.json`: final browser results; seven layout/motion cases, three funded purchase/equip flows, all eleven shelves at desktop and mobile, zero browser errors.
- `scripts/shop-exhibit-qa.mjs`: reproducible Home → Shop walkthrough with controlled animation frames. Browser screenshots settle CSS transitions before capture. Assertions include 44px tool/comparison targets and actual hit-testing, keyboard disclosure, pause/manual holds, unchanged saves during preview, filter recovery and separate buying/equipping.
- `test/shop-exhibit.test.js`: all 73 product portraits, per-product pixel distinction, read-only equipment/context preservation, no canvas teaching words, reduced-motion stability, all-slot Look/Power rendering and independent ownership state.

```sh
npm test
npm run build
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/shop-exhibit-qa.mjs
```

The browser script expects the dev server at `http://127.0.0.1:5192` (override with `PREVIEW_URL`), Puppeteer Core and Chromium at `/tmp/chromium`. Native screenshots are scripted review evidence, not a recruited-player usability study. Before images link to the previous delivered hierarchy pass, preserved unchanged.

## Final validation

- Full final suite: **1427 passed / 0 failed**.
- Focused portrait/story/ownership tests: **12 passed**.
- Production build and single-file bundle check: **PASS**, 1248.9 KiB.
- Final browser walkthrough: **PASS**, seven layout/motion cases, three purchase/equip flows and twenty-two shelf views, zero page errors.
- Gallery: all screenshot references exist; no document overflow at 1280px or 390px.
- `git diff --check`: **PASS**.

See `validation.json` for the durable summary. No commit or push was made.
