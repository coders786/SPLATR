# Discovery-first Shop — supersedes the Builds-first entry

## Direction

The user explicitly corrected the earlier task-first proposal: make mixing clear but do **not** explain the recipe for an undiscovered hybrid. Mutant Fighting Cup was given as the interaction reference. This implementation does not claim to reproduce that game's mechanics or assets.

The distinction: **clarity of operation, mystery of outcome**. No guided complete-build shopping funnel, no required-parts shopping list for unknown hybrids, no automatic combination purchases.

## Delivered

- Shop opens on individual parts, with a concise Pick slot → Try → Equip explanation and live creature preview. The old Builds-first catalogue is no longer mounted or linked in the Shop.
- Main destinations: Mix Parts, Discoveries, Practice. Header simply says Shop. Preview testing controls are collapsed by default; full practice remains accessible. Part-slot navigation, prices, powers, owned/equipped states and explicit Buy/Equip remain.
- Discoveries is a journal, not a recipe catalogue. Unknown combinations show a generic locked preview, UNKNOWN MUTATION and a neutral invitation to experiment. No title, ingredient list, near-match count, signature behavior or one-click recipe try-on is rendered for unknown entries.
- Owning all ingredients alone does not reveal a combination. Equipping a matching combination discovers it and saves the result. Previewing alone does not write discovery progress. Already equipped combinations migrate naturally on save/sync.
- A discovered result gets a visible DISCOVERED notice beside the live creature. The journal then records its identity, behavior/tradeoff and found combination so the discovery can be remembered.
- Journal offers All and Discovered, not unexplained Apex/Zenith/Sparks tabs. Empty discovered view explains how to begin without naming ingredients.
- Footer always describes the selected part, not whichever card the pointer happens to cross. Purchase and equip remain separate and clearly described. Existing sword combat, temporary wave upgrades and teaching quests are preserved.

## Research applied

1. Nielsen Norman Group, *Usability Metrics*: https://www.nngroup.com/articles/usability-metrics/ — task success, task time, errors, subjective satisfaction, plus wrong paths/backtracking. These are evaluation methods, not evidence that SPLATR's redesign improves retention.
2. Game Developer, Yevgen Grishenko, *Selling packs: Evaluating and improving store through UI/UX methods* (July 7, 2017): https://www.gamedeveloper.com/business/selling-packs-evaluating-and-improving-store-through-ui-ux-methods — game-store heuristic evaluation, visible benefits and clear actions. The author explicitly cautions that heuristic review is not a substitute for independent playtesting. This is a practitioner case study, not a controlled conversion benchmark.
3. Game Accessibility Guidelines, Basic / Full list: https://gameaccessibilityguidelines.com/basic/ and https://gameaccessibilityguidelines.com/full-list/ — clear language, readable formatting, spaced interactive controls, not relying solely on colour, and avoiding unnecessary menu depth. Guidance, not a quantified performance guarantee.

The earlier 'choose build → get parts → equip' proposal was rejected and is NOT the final product flow. Any prior Builds-first ledger describes historical work, not the current Shop entry.

## Metrics to use in a new-player playtest

Give tasks without naming controls or explaining recipes. Observe silently and ask for explanations afterwards.

| Task | Record | Error to watch |
| --- | --- | --- |
| Try a different head without spending | Unaided success, time, wrong clicks | Player believes preview spent credits |
| Buy one chosen part, then use it | Success, time, backtracks | Player thinks buying automatically equips |
| Test current creature's attack | Success, time, first destination | Player starts a real run by mistake |
| Find a mutation by experimenting | Number of distinct equipped combinations, explanation of result | Player thinks any mixed set is an upgrade or journal contains shopping requirements |
| Return to a discovered combination | Success, time, recall accuracy | Player cannot recognize previous discovery |
| Leave Shop and start playing | Success, time | Player thinks purchases are required to play |

After each task, collect perceived ease on a consistent 1–7 scale and ask what is equipped, owned, and merely previewed. Record abandonment and accidental spend/equip separately. Do not optimize purchase conversion or time spent in Shop as a proxy for comprehension. Shorter discovery time alone is not a success metric: experimentation is intentional; failure to understand the controls is not.

Suggested internal gates (design targets, NOT published benchmarks or measured results): all participants distinguish preview/buy/equip after the first task; zero accidental purchases in the test; no forced help for leaving/testing; no unknown-recipe spoilers. Use a small qualitative round first, revise, then use a larger sample for quantitative comparisons. Do not report automated path success as a human success rate, or infer D1 retention from it.

## Verification

- `scripts/discovery-shop-browser-qa.mjs` passes at 1280×720, 550×720, 390×680 and 860×440. Checks parts-first entry, no mounted build catalogue, unknown journal contents, no ingredient/try-on controls for unknowns, independent part purchase/equip, actual Wraith discovery via equipped parts, persistence, found journal ingredients, viewport bounds and zero JavaScript errors.
- Visually inspected desktop and narrow-phone Shop, mobile journal and landscape discovered creature screenshots. Two complete rows of parts remain visible in inspected Shop layouts. Unknown collection cards deliberately use the same generic locked illustration, not hidden-but-identifiable hybrid art.
- Full Node suite: 432 passed, zero failures, 82.8 seconds. Production single-file build verified at 602.95 kB / gzip 247.24 kB / 588.8 KiB before final journal-filter/empty-state polish. Rebuild output is authoritative for final size.
- Scratch screenshots/logs: `.arena/discovery-shop/`, excluded from durable snapshots. Browser script and this document are durable.

No human usability rate, retention gain, native-device playtest or fresh long soak is claimed. Automated checks demonstrate the implemented rules and layout bounds, not that the interface is intuitively understood by unfamiliar players.
