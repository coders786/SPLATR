# Shop clarity: screenshot-led player-perspective review

## Verdict

**The shop needs a clearer order of decisions, not less personality.**

The current screen asks me to browse, decode category icons, understand ownership, operate a small animation player and discover build tools at the same time. Meanwhile, the repeated full-cube art makes the actual difference between parts smaller than it should be.

The strongest direction is: **pick a part → see what changes → buy or equip**. Keep the near-wordless power story. Simplify the surrounding interface.

## What I actually reviewed

37 new native screenshots, reached through **Home → Shop**, not an item deep link:

- Desktop: 1440×900.
- Mobile: 390×844 and 320×568.
- Short landscape: 640×360.
- Eight states per layout: entry, selected item, watch, optional details, comparison, core browsing, unfamiliar core, affordability filter.
- Five additional desktop states: affordable purchase, owned-but-not-equipped, equipped, build inspector and practice tools.

The main fixture is a fresh **0-credit** save with the training-completed flag set. I did not replay training or measure real post-training earnings. A separate **1,500-credit** fixture is explicitly identified for the purchase walkthrough. Animation was advanced deterministically for comparable stills. Zero browser page errors were reported.

This is an **AI-led heuristic/cognitive walkthrough**, not interviews, eye tracking or a usability study with recruited players. Player questions below are walkthrough prompts, not quotes from participants. Screenshots establish what is visible; confusion, abandonment and conversion effects remain hypotheses to validate.

## Findings, in priority order

### 1. High — Navigation has been made wordless along with the teaching

**Evidence:** `1440x900-01-entry.jpg`, `320x568-01-entry.jpg`, `annotated-desktop.jpg` #1/#4.

I see a large diamond, sword, target and horizon; below them another row of crown, visor, cube, diamond and tail. A diamond appears at both navigation levels. On mobile, the bag/play switch introduces another icon row. There is no visible category name such as “Head” on the entry screen.

**Player question:** “Am I choosing a body part, changing how the demonstration plays, or switching shop sections?”

**Change:** retain icons, but show a tiny selected-category label and functional names for the major destinations. Use **Shop / Try** for the mobile view switch. Put less-common destinations behind one clearly identified tools entry. These are navigation labels, not explanatory paragraphs. Do not hide the current category just to save a few words.

Recognition benefits from visible context; obscure icons can instead demand recall. [2](https://www.nngroup.com/articles/recognition-and-recall/)

### 2. High — Mobile spends too much of the first screen preparing me to browse

**Evidence:** `annotated-small-mobile.jpg` #1–#5; `390x844-01-entry.jpg`; `640x360-01-entry.jpg`.

At 320×568, the first product cards begin around **y=375**—roughly two-thirds down the screenshot. At 390×844, they begin around **y=384**. The stack includes branding/wallet, view switching, two navigation levels, a large selected-part summary, search and a filter. The selected default item then appears again as the first card. In short landscape, the selected-item summary becomes a large right-hand block while only a shallow card viewport remains.

**Change:** keep a compact header, category control and grid in Browse. Move the large selected-item summary to the item view; retain only a slim current-selection row if needed. Collapse search/filter controls into one discoverable control for short categories. Give results more room by removing repeated blocks—not by making every button or thumbnail smaller. Retain reachable touch targets.

### 3. High — The cards repeat the cube more loudly than they show the part

**Evidence:** `annotated-core-grid.jpg` #1/#2; `1440x900-06-cores.jpg`.

The head cards can be distinguished by their large hats/horns. The core cards are harder to scan: almost every card shows the same face, shell and tail, while the meaningful mechanism is a small chamber on its chest. The hero illustration, inset frame, angled backdrop, status circle and outer border all surround that small difference.

**Player question:** “What changed between these six options?”

**Change:** use category-specific framing. For cores, make the chamber/mechanism the main thumbnail. For eyes, crop the face; for tails, frame the tail; for dash/slash, show the distinctive action silhouette. Keep the full equipped cube in the selected-item preview so the part-to-build relationship is not lost. Reduce the thumbnail’s decorative inset frames and repeated backdrop shapes.

Do not replace these with abstract stat cards or remove the art.

### 4. High — The preview is visually sparse but operationally crowded

**Evidence:** `1440x900-01-entry.jpg`, `320x568-03-watch.jpg`, `390x844-03-watch.jpg`.

The preview has five equally styled top tools, three bottom story controls, and another three-dot indicator inside the artwork. On desktop, the selected-item summary also has play/info controls. Similar-looking play/monitor symbols appear at different levels. Mobile hides the browsing context when I enter this view. The selected item name is retained in the footer, but the current category and equipped-versus-trying state are not similarly explicit.

**Change:** default to the three visual story beats plus one compact secondary-tools entry. Surface play/pause in the same story-control group. Put Compare, Build, Practice and Details behind that entry or a deliberately secondary row; keep them discoverable. Remove the artwork’s redundant progress dots if the outer three-step control already shows the same progression. Keep the selected part/category attached to the preview.

Layering uncommon customization features rather than presenting them all at once is a research-backed simplification pattern. [4](https://www.nngroup.com/articles/customization/)

### 5. High — Compare adds a mode without making the decision sufficiently explicit

**Evidence:** `annotated-comparison.jpg`; `390x844-05-compare.jpg`.

The mobile comparison shows two cubes in outlined boxes. The visible picture does not identify them with “Wearing” and “Trying,” and it does not visibly isolate the extra Coil effect. The two figures occupy a central band, with large unused space above/below and the same five-tool row above them.

**Change:** compare the **changed part and its outcome**, not just two outfits. Use a fixed same-scale/same-camera A/B, a small Wearing/Trying label, one clear highlighted difference and a synchronized action/result. For the Coil, make the extra nearby-enemy zap the decisive difference. Put the single important limit behind the existing optional details control. Keep comparison in place instead of adding more permanently visible controls.

Preserve whitespace that separates the comparison; reduce letterboxing that makes the useful content small.

### 6. Medium–high — Selection, ownership, wearing and affordability need more distinct visual states

**Evidence:** `funded-01-buy.jpg`, `funded-02-owned.jpg`, `funded-03-equipped.jpg`, `390x844-08-affordable.jpg`.

The affordable path already has useful **BUY 400 → EQUIP** labels. Keep that separation. However, the cube wears the Coil while merely previewing it, and it still wears it after buying; the decisive purchase/equip difference is mostly a small button/badge change. A tick and bag are used for related but different states. In the fresh-save case, the disabled **0 / 400** control explains less clearly than the affordable BUY label. “Can afford” can produce an empty grid while the previous selected part remains above it.

**Change:** keep one transaction location per active view. Use minimal explicit states: **Trying / Owned / Equipped**; keep selected as an outline rather than another ownership symbol. For insufficient funds, show the price and a compact “Need 400” state. In the empty affordability result, provide a direct **Show all** action. Do not default a new zero-credit player into an empty affordability filter or disable free previews.

Do not combine buying and equipping without an intentional product decision and validation.

### 7. Medium — Optional detail content repeats itself

**Evidence:** `390x844-04-details.jpg`.

The Coil sheet states its one-short-arc / 160px / no-more-zaps limitation in “What it does” and repeats it under “Watch for this.” A generic slow-motion timing note adds another line of qualification. The large BACK action is clear, and the sheet is already optional—both are good.

**Change:** keep one effect, one trigger, one limit; remove the repeated sentence. Prefer player language such as “nearby” in the first layer, with exact measurements only where they are useful in advanced details. Keep this secondary to the visual story rather than restoring a prose-heavy default shop.

## What should stay

- The large selected-item illustration and the existing art style.
- The three-beat part → action → result story.
- Optional detailed rules, not mandatory paragraphs.
- Separate Buy and Equip actions with immediate button feedback.
- A visible price/wallet and free inspection of unaffordable parts.
- The responsive split between desktop browse/preview and mobile focused views.
- Build and practice tools: **relocate or subordinate**, do not delete them.

## Recommended implementation order

1. **Hierarchy pass:** compress the mobile Browse header, add minimal orientation labels, remove the repeated selected summary, consolidate preview tools/progress. No new art or mechanics needed.
2. **Card clarity pass:** crop each category around its actual part; quiet decorative layers; make selection, owned and equipped states unambiguous without using color alone.
3. **Decision pass:** make comparison explain the changed outcome, anchor the transaction state, repair empty-result recovery and deduplicate optional details.

I would not start with smaller fonts, smaller touch targets, more animations, more badges, a new color scheme, or another permanent toolbar.

## How to validate the redesign

Use the same screenshot states as a baseline, then test a prototype with unprimed new players. Ask them to:

1. Find a core and explain what category they are in.
2. Try an unfamiliar item without buying it.
3. Explain what changes versus their current part after watching the action.
4. Say what they currently own and what they currently wear.
5. Buy an affordable item, equip it, then return to browsing.
6. Recover from a filter with no results.

Record first-click errors, backtracking, unwanted purchases, category recognition, effect explanation and ownership/equip mistakes. Check at 320×568 and 390×844, not only desktop. These are proposed validation measures, **not outcomes measured in this review**. A quieter screenshot alone is not proof of better comprehension.

## Deliverables / boundaries

`index.html` is the illustrated review with annotated screenshots and all 37 originals. `manifest.json` records tasks, viewports, observed UI state and canvas/control bounds. `scripts/shop-clarity-review.mjs` reproduces the native captures.

**No application UI, game source, layout styles, economy or interaction behavior was changed.** Only a review script and review artifacts were added. No commit or push was made.
