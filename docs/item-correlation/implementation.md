# Item-correlation continuation — eight head systems

## Scope

This continues the unified plan's **recognizable shape → readable icon → real power → matching activation** work after the shop hierarchy/product-shelf passes. It is a substantial presentation block for C2–C9, with the C1 bare-head construction protected. It is **not** the deferred C64 Tide bank/pressure migration, a balance patch or a claim that every pending item power has shipped.

### Delivered hardware and correlation

| Item | Physical identity | What changes in actual play |
| --- | --- | --- |
| Halo | Segmented gold stabilizer ring, side shoes, three fixed vanes | Levels and extends its vanes while the actual lighter aimed-fall condition applies: held aim, not depleted, downward velocity. No idle bobbing/beam. |
| Cyber Ears | Hinged triangular receiver cups, inset pink membranes, short connecting trace | Ears perk and the trace opens when the real chain is positive. This is not a three-charge counter or a new combo reward. |
| Viper | Swept crimson aerodynamic fins with recessed channels | Leading edges and a small hardware deployment follow the accepted launch's blade/age window. No extra cutting geometry or forward horn projectile. |
| Oni | One long broken horn, opposite stump, asymmetric fractured lining | Warmer high-contrast fracture inlay only at exactly one health. No invulnerability or new damage bonus. |
| Crown | Broad gold bridge and two exposed armor jaws | Jaws indicate the current blade opportunity; they never pretend to count confirmed plates removed. Existing two-plate lesson remains intact. |
| Samurai | Wide paired crest, horizontal cutting edges, central lock | Edge accents engage on a real active blade within the existing ±25° horizontal window. No wider body collider. |
| Coil | Twin wound inductors, terminal caps, central relay bridge | The bridge closes only for an existing accepted Coil spark receipt or actual Coil-role Volt conduction link. No idle electrical sine and no fake zap on an empty cut. |
| Beacon | Guarded amber lamp, physical side chevrons | Lamp/chevrons indicate the same real Fang `tell` condition used by its existing enemy warning brackets. The old decorative light cone is removed. No new targeting or shield. |

All eight SVG item icons now match those constructions. The hero, product shelves, head close-ups, old optional ability sheets and sword practice reuse the same production head renderer. Shop Look now pairs a large actual attachment with its installed build; Action/Result uses explicit illustrative head receipts. Examples stay wordless and do not grant game effects.

## Read-only boundaries

Only `src/art/splatr-art-engine.js` and `src/shop-item-icons.js` production files changed in this continuation. `headMechanismPose` reads existing run state/accepted visual receipts/enemy tells; it performs no combat admission, target choice, timer update, physics write, resource grant or storage operation. It returns a frozen state view. The live renderer and sword practice pass actual data. Opening/teaching/non-playing states cannot retain an active attachment receipt.

Shell material owns the mounting socket. Each attachment retains its gold/crimson/pink/cyan identity. Core color is a small mounting inlay, not a recolor of the whole item. Detail is scale-gated; no new particles, textures, offscreen surfaces, retained emitters, timers or network assets. Reduced motion uses a steady truthful state instead of motion, crackle or a fake light cone.

## Final checks

- **1,433 / 1,433 full-suite tests passed**, zero failed (240474ms).
- **6 new focused head-system tests**: actual-state gating, off-run/teaching suppression, frozen/read-only views, nine distinct head silhouettes on ten shells at gameplay/inspection sizes, eight visible active receipts at both scales, clock-independent idle/reduced art, all story beats, and real Coil relay vs empty primary contact.
- Initial integration set: **30 passed** across portrait, story, core mechanism and action-harmony checks.
- Genuine pre-edit art audit: **1,120 deliberately changed head/body/core/scale render cells**; **140 bare-head constructions, 392 attack cells and 192 non-head default story beats pixel-identical**. Same current profiles and study inputs, genuine old/new renderer. No simulation fixture regeneration.
- Native Home → Shop review: **8 heads × 3 beats × 3 layout/motion settings** (1440×900, 390×844, 390×844 reduced motion), stable manual holds, no preview-save mutation, zero page errors.
- Native production-renderer checks: **16 controlled real-run cases**, eight heads at desktop and mobile, idle/active plus reduced-state checks. Coil uses a genuine admitted primary/relay; other conditions deliberately isolate aim, chain, health, launch, angle and threat. Draws do not alter the checked health/chain/blade/velocity state.
- Previous shop regression: **7 layout/motion cases, 3 funded Buy → Owned → Equip flows, all 11 shelves at 2 sizes**, tool/comparison hit-testing, keyboard disclosure, no browser errors.
- Production build / single-file verification: **PASS**, 1252.1 KiB. `git diff --check`: **PASS**.

### Evidence

`index.html` is the screenshot-led review. There are **101 native JPG screenshots**, plus **32 explicitly labeled production-art PNG illustrations** (genuine before/after part portraits and enlarged idle/active details). The illustrations are not claimed as native gameplay screenshots. Machine-readable results: `art-audit.json`, `shop-results.json`, `live-results.json`, `shop-regression.json`, `validation.json`.

```sh
npm test
npm run build
node scripts/head-hardware-visual-audit.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/head-hardware-browser-qa.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node scripts/head-hardware-live-qa.mjs
```

Browser scripts expect Chromium at `/tmp/chromium` and the app at `http://127.0.0.1:5192` (override `PREVIEW_URL`). The genuine pre-edit art module was captured before source edits at `.arena/item-correlation/art-before.js`; for a later audit supply that original module with `QA_BEFORE_ART`. Do not regenerate it from the new renderer. Screenshot and audit summaries under `docs/item-correlation` persist independently of scratch files.

These checks establish implementation/state consistency, not measured player recognition, comprehension, conversion or actual-device FPS. Small in-game hardware remains small at native scale; the shop deliberately supplies a larger view. No commit, push, deployment or saved-data migration was made.
