# Upgrade harmony — implementation progress

The design source is [the unified blueprint](unified-upgrade-harmony-implementation-plan.md). This file records actual implementation and validation, not planned coverage.

## Current checkpoint

- **S0 — baseline captured:** current tests/builds, catalogue/save/rule/sword snapshots and browser observations.
- **S1 — shared family authority implemented:** one most-specific/catalogue-tied selector now drives art, hints and functional sword selection. Discovery entries remain independent.
- **S2a — shadow combat-source observation implemented:** opt-in, bounded source/result diagnostics around the unchanged legacy resolver, with pre-chunk and observation-on/off comparisons.
- **S2b, all current source compatibility routes migrated (chunk 6):** primary blade, Prism needle, core echo, Ghost Lash, Coil relay, Anchor floor, shear and sword echo/pulse now enter one explicit source-context boundary. Legacy unknown sword objects have a separate compatibility context. No live caller passes positional boolean flags. Admission/transaction policy is **not** complete.
- **S9b, independent shop interaction subset implemented (chunk 5):** all 73 item-specific icons, slot-local search, visible purchase/equip/signature-change receipts, bounded local interaction feedback and short-screen native-input fix. This is not completion of S9b's world/audio/full parity work.
- **C25 / chunk 7 — first visible replacement power implemented:** Notched Frame replaces its 8% aim-cost discount with +12% passive FOCUS recovery under the shared 40% cap. Actual recovery drives visible core-colored side vents and a cooling HUD state; the shop compares actual capped recovery rates.
- **C24/C26 / chunk8 — armor-contact shells implemented:** Chamfer sheds20% of primary armor recoil instead of granting a blade tick; Segmented stores real lost forward momentum for one bounded next launch instead of chain grace. Both have authority-driven shell cues and enlarged shop studies.
- **Previous — chunk18 / C61:** Ember is now contact ignition: two finite world-time fire units, bounded sight-checked spread, narrower direct cuts, dedicated resource-isolated secondary damage, real-status seams and a rule-driven shop damage sequence. Chunks9–17 below document additional completed shell/eye/tail/aim/Ink/shop work.
- **Previous — chunk19 / C63:** Frost replaces its old aim discount with actual Fang freeze/heavy locomotion slow, world-time thaw/immunity, state-driven collars/labels/radar and an isolated production-AI shop comparison. Volt/C62 is still pending; this coherent status/animation block is not a partial Volt implementation.
- **Previous — chunk20 / C65:** Void replaces armored-kill score with a fixed-origin, collision/leash-bounded pull field and one small real expiry hit. Outer/inner boundary layers, launch/target/collapse/readiness art and an enlarged actual-ledger shop cutaway are implemented together. Volt/Tide dash replacements remain pending; C66 follows below.
- **Previous — chunk21 / C66:** Echo Dash replaces extra combo time with a finite recorded-path Reprise Stroke. Actual physics samples own the stored outline and delayed cutting plane; one reserved pending slot survives rapid launches. New source art, hit/readiness feedback, icon, plain-language receipts and a large production-ledger shop lesson ship together.
- **Latest — chunk22 / C62:** Volt replaces speed-score with owned-vector launch burst,15% narrower primary geometry and first-contact sight-checked conduction. Coil pairing shares one distinct-target reservation; state-backed arc/readiness/lance/icon and a larger real-physics/ledger shop comparison are implemented together. Tide and the global stages remain pending.
- **Not implemented yet:** global S2b admission/transaction redesign, other planned replacements (including Void-world recoil sink), normalized global geometry, full Spark/Apex choreography and remaining blueprint stages. Ember introduces a local bounded status clock, not a general-purpose status framework.

## Chunk 1: one functional and visual Apex family

### Changes

- `src/art/splatr-art-engine.js`: select the complete recipe with the greatest ingredient count; keep catalogue order for ties. Reuse this selector for active family and completed-recipe hints. Art direction resolves the selected recipe once per call. Preserve the import-free standalone engine and legacy match-descriptor shape.
- `src/swords.js`: consume the same selected recipe instead of maintaining a second priority algorithm. All sword definitions/variants remain unchanged.
- `src/customize.js`: each discovery describes its own recipe's reference sword, rather than accidentally displaying a more-specific sword completed by unrelated current equipment. Both completed recipes remain discovered/listed.
- `test/family-selection.test.js`: 11 regression tests covering the four known mismatches, all compatible recipe subsets, catalogue-order ties, all 2,402 cross-slot pairs in defaults, recipe-breaking swaps, Sparks/partial hints, save/discovery/preset retention and deterministic state-safe drawing at four detail sizes.
- `test/support/sword-profile-baseline.json`: 18 complete sword profiles captured before implementation (standard plus 17 builds). Tests compare against this independent fixture, not values regenerated from the changed resolver.
- `scripts/family-selection-browser-qa.mjs`: repeatable shop/discovery/practice checks at four sizes; optional `QA_CAPTURE=1` screenshots and `QA_VIEWPORTS` subset selection. Explicitly reports programmatic versus native interaction coverage.

### Corrected overlaps

| Complete recipes | Selected visual and functional family |
| --- | --- |
| Phantom + Arcade | Arcade |
| Phantom + Wraith | Wraith |
| Reaper + Arcade | Arcade |
| Briar + Glass Shogun | Glass Shogun |

Equal-specificity examples Wyrm/Eater and Eater/Sun keep their existing functional catalogue-order result. Breaking Arcade with an Echo-core → Standard-core swap exposes the still-complete Phantom recipe without stale selection.

### Evidence

| Check actually executed | Result |
| --- | --- |
| Baseline `npm test` | 966 passed, 0 failed |
| Baseline standard and Poki builds | Both passed; single file 1,004.87 kB raw / 371.39 kB gzip |
| New regression suite before fix | 7 failed / 4 passed, exposing the existing selector disagreement |
| Targeted family/sword/hybrid/harmony/portable-art tests after selector change | 37 passed, 0 failed |
| Final `npm test`, including discovery-description fix | 977 passed, 0 failed |
| Final `npm run build` | Passed; single file 1,004.81 kB raw / 371.38 kB gzip |
| Final `npm run build:poki` | Passed; same reported size |
| Pre/post baseline comparison | All 25 default/compatible-recipe cases retain exact sword profiles, equipment rules and completed-discovery lists; four artistic selections corrected. Catalogue, sword build definitions and save roundtrip unchanged |
| Browser family checks | Passed, exit 0: 960×540, 640×360, 390×844, 844×390; four overlap fixtures each, correct individual discovery descriptions, practice family, Arcade→Phantom fallback, wallet/owned/presets retained |
| `git diff --check` | Passed |

Browser preset changes exercise actual handlers programmatically because advanced controls are intentionally hidden by default. Equip fallback uses native pointer input at three sizes; at 640×360 it exercises the handler because of the confirmed pre-existing layout issue below. These checks are not an FPS benchmark or full-device qualification.

Scratch evidence is under ignored `.arena/harmony-chunk1/`; generated captures/logs are not required shipped assets. Tests/fixture/browser script above are durable regression evidence. The initial general shop browser harness printed its assertion results but hung during browser teardown and hit the command timeout; it is not counted as a clean baseline browser pass. An early capture-enabled new-harness run also hit a software-GPU screenshot timeout. The final capture-disabled correctness run completed successfully with exit 0.

## Known issue found, not changed by this chunk

At **640×360**, the existing narrow/short stacked shop layout clips the item grid. Native clicks intended for a scrolled item can miss it. A separate comparison intercepted the three edited modules with their original Git versions: native Standard-core selection left Echo equipped in both baseline and patched versions. This is not a newly introduced family-selection regression. The QA script names its handler-only coverage at this size rather than claiming native input passed.

Track a separate responsive-shop chunk: reproduce the original geometry, give the grid usable space/scrolling, and require native pointer selection/equip at 640×360 plus the existing four-size shop/lifecycle suite. Do not weaken this warning or declare the broader release fully qualified until that fix is verified.

## Rollback boundary

This chunk changes only derived family selection and discovery descriptions, not save schema, ownership, wallet transactions, prices or sword tuning. Reverting these three production-file changes restores prior selection behavior without data migration; purchased parts/presets remain readable. Pre/post save fixtures verified compatibility; a production deployment rollback was not performed.

## Chunk 2: S2a — shadow combat-source observation

### Implemented

- `src/combat-source-trace.js`: `createCombatSourceTrace(capacity = 256)` reuses the local bounded diagnostic ring (valid capacity 1–4096). Each attached run gets a recorder-local namespace, source IDs, target-generation keys and contact IDs. Weak identity maps do not attach fields to actors/attacks or retain removed actors. Entries are frozen scalar records, with no storage/network/renderer/RNG dependency.
- `src/run.js`: optional `combatSourceTrace` argument; ordinary runs do not instantiate the observer/ring/weak maps. The existing damage resolver is retained as `resolveCut`, with a shadow wrapper that records its result and preserves exceptions. Existing boolean arguments, dedup, order, source-array eviction, damage, procs and rewards remain authoritative.
- Source creation/contact hooks distinguish primary blade, Coil relay, Prism needle, core echo, Ghost Lash upgrade echo, sword delayed echo, sword pulse, Anchor floor and legacy shear. Delayed sources retain their originating shot separately from the shot current at contact. Nested contacts retain parent contact/source IDs. Restored/test-injected sources are explicitly marked `originKnown: false` when birth was not observed.
- Results distinguish accepted armor/kill outcomes, existing shot-duplicate/protected/absent-target rejections and exceptions. They describe **target-only** outcomes: aggregate score/refill deltas can include recursively resolved children and are deliberately not misattributed to one source.
- `test/combat-source-trace.test.js` and `test/support/combat-source-scenarios.js`: controlled real-run fixtures for ten paths, plus observer lifecycle/identity/parentage/exception/determinism checks. Contact/floor/rail activations are controlled fixtures, not claims of complete native input/physics traversal coverage.
- `test/support/combat-source-baseline.json`: snapshot of the pre-S2a resolver's outcomes, scalar emitted-event projection and existing combat diagnostics. The original run source was saved before editing; the Prism fixture was refined and regenerated against that saved original resolver, not the instrumented implementation. The other nine snapshots were checked unchanged.
- `scripts/combat-source-browser-qa.mjs`: runs the same ten cases in Chromium, checks observation off/on equality and unchanged storage, then uses native shop open/close/start controls as a smoke test.

### Usage for local diagnostics

```js
import {createCombatSourceTrace} from './combat-source-trace.js';
const trace = createCombatSourceTrace(256);
const run = createRun(seed, emit, {equipment, combatSourceTrace: trace});
// After ordinary gameplay actions:
const entries = trace.entries();
const localJson = trace.json();
run.dispose();
```

This is not enabled in the normal UI and is **not a new gameplay event API**. `source-created` means a legacy source was observed at creation, not that new admission/proc rules were applied. Results are appended after a call resolves, so a nested child result can precede its parent's result. Recorder history may wrap while weak identity keeps an active delayed source's original metadata. Clearing history does not reuse active IDs; disposal is idempotent and releases observer identity maps.

### Verification actually executed

| Check | Result |
| --- | --- |
| Pre-change targeted combat-trace/equipment/sword tests | 22 passed |
| Post-change targeted source/combat-trace/equipment/sword tests | 41 passed |
| Full `npm test` | **997 passed, 0 failed** |
| Ten pinned pre-chunk scenarios, observer disabled | Exact Node snapshot equality |
| Same ten scenarios, observer enabled | Exact equality to pre-chunk Node snapshots, including scalar emitted events and existing combat diagnostics |
| Delayed source after a second legal launch | Originating shot remains 1 while current shot is 2 |
| Chromium source fixtures + shop/start smoke | Passed, exit 0; ten observation-on/off comparisons byte-for-byte equal, storage unchanged, no page errors |
| Standard build | Passed; 1,005.98 kB raw / 371.77 kB gzip |
| Poki build | Passed; 1,005.98 kB raw / 371.76 kB gzip |
| Syntax checks and `git diff --check` | Passed |

The browser initially exposed a Node/Chromium final-bit `Math.atan2` difference (5.6e-17 in one cut angle), not a source-observation difference. Cross-engine baseline comparison permits finite noninteger roundoff up to 1e-12 relative; discrete outcomes stay exact. Browser observer-on/off equality and all Node baseline comparisons remain exact. No screenshot/FPS/device-performance claim is made for this diagnostic chunk. Scratch logs/results are under ignored `.arena/harmony-chunk2/`.

### Deliberately unchanged / rollback

This chunk observes existing secondary reward/chain behavior; it does **not** enforce the blueprint's future primary-only policy. Existing delayed-source eviction, generic perks, clocks, geometry and status behavior are unchanged. No damage callback is added, no new `emit` event is sent to gameplay/UI, and nothing is written to saves or the wallet. Normal production runs do not import/construct the diagnostic recorder.

Rollback: remove the optional observer hooks/wrapper from `run.js` and the diagnostic helper; the legacy resolver has no new persisted fields to migrate. An actual production deployment rollback was not performed. The pre-chunk baseline and on/off tests are the behavioral checkpoint for the next adapter migration.

## Chunk 3: S2b, first subchunk — explicit Prism source context

### Implemented

- `src/equipment-source-context.js`: a small pure bridge returns one shared frozen descriptor for `prism-needle`: `fromShear: true`, `secondary: true`, `swordSource: null`. Unknown **or not-yet-migrated** kinds throw explicitly at this adapter boundary; there is no default-primary path or fuzzy alias. Other source types continue through their existing paths, not through this restricted adapter.
- `src/run.js`: the Prism hit loop calls `cutEquipmentSource(target, 'prism-needle', needle)`. That adapter resolves the explicit context and forwards the same flags/provenance into the existing observed `cut`/legacy resolver. No additional damage writer, source queue, per-hit policy object or field on projectiles was introduced.
- `test/prism-source-context.test.js`: 14 focused tests cover descriptor immutability/unsupported kinds, legacy secondary rewards, no Coil/core-echo/pulse-charge escalation, nearest living Fang selection/ID ties, endpoint radius, fractional dt, final-endpoint/expiry order, shared-shot dedup/consumption, no retry after rejected nearest target, exactly two wall needles, cooldown/contact classification and the existing eight-projectile cap.

### Evidence actually executed

| Check | Result |
| --- | --- |
| Pre-adapter source/equipment/sword tests | 39 passed |
| Prism tests before adding the adapter module | Expected module-not-found failure; this is an absent-feature check, not evidence of a pre-existing combat bug |
| Prism characterization tests run against the saved pre-adapter resolver | All 14 passed, confirming the integration expectations describe retained behavior |
| Post-adapter targeted Prism/source/equipment/sword tests | 53 passed |
| All ten pre-adapter scenarios with observation off/on | Exact gameplay snapshots retained; source diagnostic histories also byte-for-byte equal |
| Full `npm test` | **1,011 passed, 0 failed** |
| Chromium source QA + native shop open/close/start smoke | Passed, exit 0; ten baseline/on/off fixtures, unchanged storage, no page errors |
| Standard build | Passed; 1,006.28 kB raw / 371.81 kB gzip |
| Poki build | Passed; same reported size |
| Syntax checks and `git diff --check` | Passed |

Pre-adapter source and history snapshots were captured before this chunk under `.arena/harmony-chunk3/`; the durable pre-S2a fixture was not rewritten. The saved pre-adapter run was loaded only in an isolated Node characterization check; no working branch/files were switched for that check. The existing browser cross-engine float-roundoff rule from chunk 2 is unchanged; observation-on/off checks remain exact. No screenshot/FPS/device-performance claim is made.

### Intentionally not changed

This is a compatibility migration, **not** a Prism power redesign. Needles still use the existing endpoint query, radius28, living-Fang filter, nearest/ID tie ordering, velocities/lifetime and update ordering. Final-endpoint collision is still queried before retirement; a rejected shared-shot contact still consumes the needle; there is no new retry. Existing chain/EDGE/FOCUS/score rewards from accepted secondary kills remain intact, even where the future design intends a different proc policy.

The current eight-source truncation/admission policy, collision/solid behavior, fixed-step cooldown, provenance observer, other source paths, saves/credits/presets and all artwork remain unchanged. Improvements to swept/solid collision or admission must be explicit later mechanics chunks, not hidden in this adapter.

Rollback boundary: revert only the new context import, Prism call-site and `cutEquipmentSource` helper, plus the context module. Earlier S1/S2a work remains valid and needs no save migration. A deployment rollback was not performed; the original resolver characterization and ten-scenario differential checks provide the retained-behavior checkpoint.

## Chunk 4: S2b, echo compatibility migration with lifecycle characterization

### Audit decisions before editing production code

The shared echo loop is not just a pair of booleans. Its current contract includes:

1. `echo.sourceId` excludes a public enemy ID. It must not be replaced with the observer's attack/source identity.
2. Each echo adds a public enemy ID to `hits` **before** resolving the cut. Rejected contacts are therefore remembered; later shots and a replacement actor with the same public ID are not retried by that echo.
3. Separate echoes have independent hit sets but share the resolver's current-shot dedup. Neither originating shot IDs nor per-source contexts replace `lastSlash` authority.
4. The loop scans a snapshot of enemies in existing order and accepts any kind strictly inside radius75; this differs from Prism's nearest/living-Fang/radius28 query. Do not unify their targeting algorithms simply because the contact flags match.
5. Lifetime decrements before the contact loop, but final contacts resolve before expired echoes are filtered. Fractional dt and final-tick contact remain unchanged.
6. Core birth follows chain cadence; Ghost Lash birth additionally follows eligible-shot cadence and its once-per-shot guard. Combined insertion order is core then upgrade, sharing the existing three-echo oldest-first cap.
7. Accepted secondary kills still receive legacy chain/resource/score rewards; changing that to the future primary-only policy would be a gameplay change, not this adapter migration.

### Implemented

- `src/equipment-source-context.js`: added separate shared frozen `core-echo` and `upgrade-echo` descriptors, each forwarding the same legacy `fromShear: true`, `secondary: true`, `swordSource: null` flags. They are deliberately distinct objects/kinds despite matching flags. Unknown/unmigrated kinds still throw.
- `src/run.js`: changed only the echo loop's cut call to `cutEquipmentSource`, keeping the existing truthy `upgradeEcho` classification, source object, mark-before-resolution, targeting, iteration and filtering. No new damage writer, admission rule, queue, RNG, renderer event or persisted field.
- `test/support/echo-source-scenarios.js`: fourteen controlled real-run fixtures covering both kinds, actual combined births, provenance across launches, cadence, cap and wave cleanup. Contact/stop control isolates legacy callbacks; it is not a device/native physics traversal claim or a new freeze mechanic.
- `test/support/echo-source-baseline.json`: independent pre-adapter snapshots plus full source diagnostic histories. Captured before the production migration, then reverified against `.arena/harmony-chunk4/run-before.js` after migration using an isolated Node import. Previous ten-source baseline was not rewritten.
- `test/echo-source-context.test.js`: thirty focused tests, including fourteen differential cases and semantic assertions for descriptors, strict radius/exclusion, armor/kill outcomes, rejected-contact memory, overlapping sources, reused enemy IDs, fractional expiry, real parent/shot provenance, cadence, cap ordering and return/choose cleanup.
- Updated the Prism unsupported-kind assertion because core echoes are now intentionally supported; sword echoes and Coil remain explicitly unsupported at this adapter boundary.
- `scripts/combat-source-browser-qa.mjs`: now runs ten original source fixtures **plus fourteen echo lifecycle fixtures**, comparing original outcomes and observation on/off, plus exact echo diagnostic histories. `QA_OUT_DIR` selects an output folder without overwriting prior evidence.

### Verification actually executed

| Check | Result |
| --- | --- |
| Echo tests before migration | 28 behavior checks passed; exactly 2 expected descriptor-support failures |
| Targeted echo/Prism/source/equipment/sword tests after migration | **83 passed, 0 failed** |
| Saved pre-adapter resolver AND migrated resolver, 24 scenarios | Exact gameplay snapshots and full source diagnostic histories; observation off/on |
| Full `npm test` | **1,042 passed, 0 failed** (includes Node discovery of support modules; 30 new explicit tests) |
| Chromium source/echo QA + native shop open/close/start smoke | **24 fixtures passed**, echo histories exact, storage unchanged, no page errors |
| Standard build | Passed; 1,006.54 kB raw / 371.90 kB gzip |
| Poki build | Passed; same reported size |
| Syntax checks, `git diff --check`, production edit-boundary assertion | Passed; `run.js` differs from chunk 3 only at the echo contact call/comment |

Browser baseline comparison reports the same single Node/Chromium last-bit angle roundoff from chunk 2, with no new echo roundoff. Same-engine observation on/off and all echo diagnostic comparisons stay exact. The first delayed fixture accidentally allowed the new primary blade to hit first; before capturing the final baseline it was corrected to disable that blade explicitly and isolate delayed resolution. This proves an accepted core contact followed by Ghost's existing shot-duplicate rejection, both retaining shot3 origin at current shot4. It is not a claim that overlapping sources independently bypass dedup.

Logs and saved pre-adapter source are in ignored `.arena/harmony-chunk4/`. No FPS, screenshot, physical-device, Poki Inspector/ad, allocation-free or deployment-rollback claim is made.

### Boundaries / rollback

No new powers or particles shipped. Echo geometry, cooldown/age clocks, generic damage calculation, reward/proc policy, solid/swept collision, source cap/admission and rendering are unchanged. Existing ID-based hit memory and oldest-first truncation are characterized, **not endorsed as the future design**. Freeze/remount/run-boundary transaction redesign remains unimplemented; this chunk tests only existing return/choose cleanup.

Rollback this subchunk by restoring the echo cut call, removing the two context descriptors/branches and restoring Prism's unsupported-kind assertion. Keep S1/S2a/Prism work. There are no save migrations. The stored independent fixture and old-resolver checks form the next migration's behavior checkpoint.

## Chunk 5: player-facing shop interaction and item identity pass

### Scope correction

The user explicitly asked for larger, meaningful chunks rather than another one-call compatibility refactor. This checkpoint delivers the independently safe **shop/UI subset of S9b**: visible changes across the entire 73-item catalogue. It does not skip the combat prerequisites to enable untested powers, nor claim S2b/S9b complete. Future delivery chunks should group prerequisite migrations internally rather than presenting each tiny adapter as substantial feature progress.

### Shipped

- **73 original item icons** in `src/shop-item-icons.js`: one explicit 32px silhouette per current catalogue ID, derived from the part/effect's visual language. The same icon appears on its card, selected-item shelf and power sheet. Existing readable labels, portraits and role descriptions remain. All 73 paths rasterize nonempty and distinctly at both 16px and 32px; this is identity coverage, not a user-recognition study or proof of future powers.
- **Browse/search**: slot-local literal name/current-short-benefit search, combined with existing ownership/availability filters, plus clear empty-state recovery. Search and free preview do not buy or equip. Slot changes clear the query. Existing group/slot catalogue order remains.
- **Visible action receipts**: a persistent polite live region now reports free try-on, actual purchase cost, purchased-but-not-equipped state, saved swaps and failed purchase adapters. Previously these statuses were written into a footer hidden by the existing stylesheet. Receipt updates are not overwritten by pointer hover.
- **Signature warnings**: the selected-item shelf and preview receipt distinguish breaking a build from switching to a different build, including different variants in the same sword family. Equip receipts retain the before→after item names and signature change. Stat readouts still describe current implemented benefits.
- **Interaction feedback** in `src/shop-feedback.js`: short local press/reveal transforms; at most three explicit Web Animations handles, replacement/cancellation, settled-handle release and close/dispose cleanup. No timers, particles, global flash, camera shake, audio or gameplay hooks. Reduced motion suppresses these animations; CSS color transitions also respect the system preference.
- **Short-screen layout**: at landscape widths560+ and height540 or less, the selected-item decision shelf sits beside the catalogue, and the demo is a reachable Preview tab. At narrower short sizes the dialog can scroll instead of collapsing the grid. Native scrolling/click/touch is retained, not replaced with direct handler activation.
- **640×360 defect resolved for tested shop flows**: the original zero/clipped-grid regression is no longer open. The compact layout keeps a usable catalogue (113px measured grid in this fixture), while purchase controls and receipt remain visible. The selected card is scrolled into view on reopen. Original baseline evidence in chunk1 remains historical, not a claim it was always fixed.

Production edits: `customize.js`, `lab.css`, `shop-catalog.js`, plus the two new UI modules. No `run.js`, damage, equipment rule, wallet calculation, item ID/price, save schema or recipe change in this chunk.

### Verification actually executed

| Check | Result |
| --- | --- |
| Full `npm test` | **1,053 passed, 0 failed**; 11 new explicit shop-interaction tests |
| New unit coverage | Exact 73-ID/icon coverage; distinct 16/32px rasters; decorative semantics; literal search/filter composition; build identity warnings; animation bounds/replacement/close-race/reduced-motion/disposal |
| New `scripts/shop-interaction-browser-qa.mjs` | Six viewports:1280×720,960×540,640×360,390×844,844×390,320×568; native pointer or touch plus keyboard; preview tabs; free try-on; buy→equip separation; exact spend; challenge locks; search; presets retained; close/reopen |
| Same browser QA additional fixtures | Native browsing of **all73 items**, matching selected-detail icons, power-sheet icon; reduced motion with no animations; rejected purchase adapter grants nothing; customizer disposal removes UI |
| Updated family browser QA | Four viewports × four overlap fixtures; **native equip at all four sizes**, no640×360 handler bypass; visible signature warning/receipt; wallet/ownership/presets retained. Advanced preset setup still uses handlers and is reported as such. |
| Existing combat browser QA | All24 pre-migration source/echo fixtures pass, including exact on/off gameplay and echo diagnostic histories; original single cross-engine angle roundoff rule unchanged |
| Standard/Poki builds | Both pass; 1,022.19kB raw,377.77/377.76kB gzip (about15.65kB raw increase from chunk4) |
| Syntax checks and `git diff --check` | Passed |

A640×360 screenshot was reviewed under `.arena/harmony-chunk5/browser/`; logs and all three QA reports are in the same ignored chunk folder. An initial scroll-only layout passed clicks but left the catalogue below the first view; visual review led to the compact side-shelf layout before final validation. A close-click animation restart race was also caught and fixed, with a dedicated unit regression. The family browser initially timed out creating a Chromium target during concurrent software-GPU work; its unnecessary forced SwiftShader flags were removed and it passed sequentially. These are not device FPS, accessibility certification or Poki Inspector/ad qualification claims.

Rollback boundary: revert chunk5 UI modules/styles/customizer/catalogue additions only; keep S1 family fixes and all prior source work. No save or credit migration is necessary. Deployment rollback was not executed.

## Chunk 6: complete current combat-source compatibility boundary

### Delivered as one block

- `src/combat-source-context.js` is the shared frozen table for all **nine current routes**: primary blade, Prism needle, core echo, upgrade echo, Coil relay, Anchor floor, legacy shear, sword echo and sword pulse. A tenth, explicit `unknown-sword` compatibility context preserves the previous behavior of restored/test-injected unrecognized sword objects; it is not a new power or generic unknown-kind fallback.
- `src/run.js`: all seven live damage call sites (some handle multiple kinds) now name their route and enter the same `cut` adapter. The adapter alone translates context to the original resolver's flags and forwards the actual sword attack object where required. No positional-boolean call or implicit-primary default remains at a live call site. The resolver remains the only HP/kill/reward writer.
- `src/equipment-source-context.js` is a backward-compatible re-export, not a competing policy table. Earlier Prism/echo imports still return the same shared descriptors. Updated the Prism invalid-kind test because sword and Coil contexts are now deliberately supported.
- Preserved **shear's `secondary=false`** and two-damage branch, including its existing ability to produce a Coil child. Preserved secondary damage1 for relay/floor/sword paths, shot dedup for non-sword sources and the **actual sword-object exception** for separate delayed attacks.
- Preserved source creation placement, shared per-wave identity, parent event/source links, recursive child-before-parent completion, target ordering, original emitted events and exception propagation. Neither trace identities nor colors/appearance grant proc eligibility.

### Characterization and regression coverage

- `test/support/source-boundary-scenarios.js` and its independent pre-change JSON baseline:15 real-run cases for Coil kill/armor/rejected nearest/exact radius/ties/consumer exception; Anchor exact radius/type filter/shared source/repeated callback; multi-target shear and shear→Coil recursion; sword echoes/pulses/unknown restored kind/due-event aging. Fixtures explicitly control selected callbacks; these are not native input/physics traversal claims.
- `test/combat-source-boundary.test.js`:29 explicit tests, including exact original snapshots/history on/off, immutable full context matrix, unknown-key rejection and a structural gate requiring all live calls to name their source. The structural gate also checks the original resolver is invoked only by the observed/unobserved branches of the adapter.
- `test/support/combat-source-simulation.js`, `combat-source-simulation-baseline.json` and `test/combat-source-simulation.test.js`:41 tests cover40 actual-physics simulations—**all17 full builds**, standard and two mixed loadouts, seeds19/77,360 ticks each. Normal suggestion/dash/stream/source scheduling is used with invulnerability supplied to keep the fixture alive; this is correctness coverage, not balance/device-input/FPS qualification. Independent gameplay/source SHA-256 baselines were generated against the saved **pre-chunk6** run import, not against the completed adapter.
- Expanded browser source QA from24 to39 cases, retaining the old original and echo fixtures and adding all15 boundary cases. Gameplay observation-on/off and echo/boundary source histories remain exact in Chromium.

### Verification actually executed

| Check | Result |
| --- | --- |
| Focused boundary/source/echo/Prism/sword/equipment tests | **112 passed, 0 failed** |
| All39 focused scenarios against both saved pre-change and migrated run | Exact gameplay and diagnostic history, observation off/on |
|40 simulation baselines against saved pre-change run | Original observation off/on equal; migrated output exactly equal to original |
| Full `npm test` | **1,125 passed, 0 failed** (70 new explicit tests plus2 discovered support modules) |
| Combat Chromium QA | **39 cases passed**, storage unchanged, native shop open/close/start smoke, no page errors |
| Shop Chromium QA | Six viewport transaction/search/input checks, all73 native item browsing, reduced motion, rejected purchase and cleanup passed |
| Family Chromium QA | Four viewports × four overlaps; native equip, swap receipt, wallet/ownership/preset retention passed |
| Standard/Poki builds | Both passed;1,022.39kB raw /377.93kB gzip |
| Syntax checks and `git diff --check` | Passed |

Scratch source snapshot, differential evidence, simulation-generation log, tests/build logs and three browser reports are under ignored `.arena/harmony-chunk6/`. Browser cross-engine comparison reports two last-bit angle differences: the previously recorded sword cut angle (5.6e-17), plus the new Coil-tie fixture's emitted angle (2.8e-17). Both use the existing narrow roundoff rule; every tolerated path/value/delta is now recorded in the report. Same-engine on/off and all echo/boundary diagnostic histories remain exact. A test initially assumed assigning engine timeScale would force a half-dt sword delay, but the real physics step resets that scale. The assertion was corrected to the actual due tick and fractional pace-scaled aftermath; no damage/timing code or baseline was changed to force the assumption.

### Explicit limits and rollback

This completes **source-kind forwarding for current routes**, not all S2b. Existing reward policy, oldest-first source eviction, caps/lifetimes, collision geometry and clocks remain unchanged. No new powers, renderer particles, save fields, wallet changes or policy flags were added. No additional per-contact policy object is allocated, but the shared context lookup/type checks have ordinary function-call overhead; this is not an allocation-free or zero-overhead claim.

Rollback only the chunk6 context table/compatibility re-export and `run.js` route/wrapper changes; retain work from implementation chunks1–5. No save migration is needed. An actual deployment rollback was not executed.

## Chunk 7: Notched Frame — visible vent cooling (C25)

The user correctly called out that compatibility work had produced no visible difference. This chunk deliberately delivers the first appearance-led power replacement, not another source adapter.

### What changes for the player

- Notched Frame now gives **+12 percentage points of passive FOCUS recovery bonus**, under the existing shared **+40% cap**. Its old 8% aim-drain discount is removed. Other aim-cost perks still apply normally. Ordinary recovery from empty takes about 3.73s instead of 4.17s at60Hz, without other bonuses.
- Its recessed side vents open in the equipped core palette only while the run actually grants passive recovery, with FOCUS missing and aim released. A single pair of graphic lines marks entry for up to6 simulation steps; there are **zero routine vent particles**, no independent effect clock and no propulsion/physics changes.
- Aim/repress, full FOCUS, launch, death, retirement, ready-return and disposal close/clear the relevant recovery view. Reduced motion keeps the truthful static open gates and suppresses entry lines. Existing generic aim-efficiency feedback may still reflect other equipped aim-cost perks; Notched's old release burst is suppressed so it does not stack extra recovery emitters.
- The HUD says **Vent cooling** while recovery is active. The shop's **PART IN ACTION** loop shows equal aim drain, then **WITHOUT NOTCHED / WITH NOTCHED** bars using the exact same passive step as the run. Contextual receipts and the comparison report actual marginal contribution:12points alone,3points when the other parts already supply37,0points at the40 cap. No claim of an extra12points through the cap.
- The item-specific icon now depicts recessed vents and a recovery arrow. Catalog copy and `shop-item-audit.md` remove the old discount claim.
- `?shopItem=notched` directly opens the **free preview** (preview pane on narrow screens), without buying, equipping or granting the item. Other valid catalogue IDs also work; invalid IDs do not open a dialog. Normal Shop → Cube → Shell → Notched Frame remains available.

### Implementation / compatibility

`src/focus-recovery.js` owns the pure passive step and deterministic study. `run.js` owns the actual eligibility/grant/entry view; the import-free art engine only reads it. Shop/detail/info receipts receive the current build context. No item IDs, prices (320credits), ownership, wallet, save schema or presets change. No new renderer pass, source pool, damage rule or save migration.

### Verification

- `npm test`: **1,137 pass,0 fail**, including12 focused new Notched tests. The final targeted rerun also exercises real lethal `hurt()` cleanup in the death/retire/launch case.
- Standard and Poki builds pass: **1,026.92kB raw /379.56kB gzip**, one self-contained HTML file. This is build validation, not Poki Inspector/submission certification.
- `scripts/notched-cooling-browser-qa.mjs`: desktop1280×720, short640×360, mobile390×844 and mobile reduced motion pass. Free direct preview, buy-versus-equip separation, actual authority recovery amounts, native Shift hold/release/repress, cooling HUD, and invalid-item rejection are checked. The live fixture uses the existing debug run to isolate recovery from kill/full-refill and damage after native launch, and waits out story locks; it is **not** an uncontrolled playthrough or device-performance benchmark. Shop screenshots pin only the demonstration time, not recovery authority.
- Native shop regression: six viewports, browsing all73items, transactions/search, reduced motion, icons and cleanup pass. Family regression: four viewports pass, retaining that script's documented preset-handler limitation. Combat-source browser regression:39fixtures match pre-migration baselines with observation on/off; diagnostics/storage unchanged.
- New tests caught stale active cooling after retirement; `retire()` now clears it explicitly. Browser fixture initially intersected legitimate kill/full-refill and story-input locks; fixture preparation was corrected, not the gameplay to force the result.
- Evidence: ignored `.arena/harmony-chunk7/` (full/focused test logs, both builds, browser screenshots/results, shop/family/combat regression logs).

### Limits / rollback

This completes **C25 only**, not the entire harmony redesign or source-admission work. Existing active sword recipes still retain their old mechanics and choreography. Vents remain small at gameplay scale; the enlarged shop comparison is the clearest inspectable proof. No actual-device FPS/accessibility certification is claimed. Roll back only the Notched perk/recovery-view/render/HUD/study/readout/deep-link/icon edits plus this chunk's module/tests/script; preserve chunks1–6 and all saves. No deployment rollback was performed.

## Chunk 8: armor-contact shells — Chamfer and Segmented (C24/C26)

A two-item mechanics/visual chunk, continuing the user's request for visible progress rather than another compatibility adapter. These primary-contact policies do not allocate delayed damage sources or alter source admission.

### Player-visible changes

- **Chamfer / Glancing Recoil:** removes the old +1 blade tick. The existing primary armor-shove component is scaled to80%, then bounded by the unshoved incoming speed and legal ceiling. Example30 incoming,7 shove: ordinary23 outgoing, Chamfer24.4. Zero/reverse/diagonal/Hyper cases are bounded. No damage, health, hit-grace, square collider or wall restitution bonus. A core-colored leading-bevel line follows the actual shove quadrant with a brief slide, then clears in7 simulation steps; reduced motion holds a static cue during the actual short contact state.
- **Segmented / Compression Spring:** removes the old +12 chain-grace ticks. First eligible primary armor shove of a shot stores20% of measured forward momentum loss, capped at4 speed. No loss means no reserve; kills, secondaries and legacy shear cannot trigger it. One reserve expires at45 simulation steps; additional armor does not stack/refresh it. Cancel, held aim, rejected/locked/invalid input and queued EDGE input cannot spend the reserve. The next actually accepted launch consumes it once, after ordinary launch solving, adding only available headroom below recorded pre-impact speed/current ceiling. An already-faster launch is never slowed. No free pips/FOCUS/damage.
- Segmented's side plates and head/tail attachment seats follow a small authority-driven compression offset; one ratchet seam holds while charged. A positive paid return settles panels in9 simulation steps (150ms at60Hz), beginning from the returned amount rather than jumping to full compression. Reduced motion retains only the static charged state. No routine particles, new whole-body squash, smoke or thrust.
- A small **SPRING +n.n / NEXT CUT** reserve receipt appears under FOCUS only while charged, and clears after spend/expiry/death/return/disposal. The existing armor tap handles contact sound; one bounded ratchet-like sound joins the existing single-voice audio arbiter on positive return, not every frame.
- Both shop **PART IN ACTION** studies use the same pure recoil/store/return policy as the real run, explicitly labelled illustrations. Chamfer shows23→24.4 outgoing; Segmented shows7 real loss→1.4 stored→24 to25.4 on the next legal launch36ticks later, within the45tick deadline. Reduced motion pins a static contact/reserve state. Unique icons, short chips, detailed info, catalog and audit remove the old perks atomically.
- Free inspect links remain `?shopItem=chamfer` / `?shopItem=segmented`; normal route is Shop → Cube → Shell. No item is granted/equipped by opening the link. IDs,280/380credit prices, ownership, wallet, presets and save schema are unchanged.

### Implementation and regression evidence

- `src/armor-shell.js`: shared pure recoil, actual forward-loss measurement, reserve eligibility/expiry, bounded accepted-launch return and deterministic study. `run.js` owns contacts, first-shot bookkeeping, lifecycle and clocks. Import-free art reads a small view; no renderer/input grant. `equipment.js` declares the two shell capabilities; the old generic `PART_PERKS` contributions are replaced.
- `test/armor-shell.test.js`:14 focused cases covering real contacts and damage parity, removed perks/ownership, zero/reverse/diagonal/Hyper, first-shot storage/no refresh/kill exclusion, max4/pre-impact/legal caps, cancel/refusal/expiry, actual buffered acceptance, actual secondary echo and legacy-shear exclusion, actual wall reflection without teleporting, death/retire/ready/dispose, bounded contact state, direction-sensitive Canvas drawing and stable no-motion studies.
- **Full suite:1,152 pass /0 fail.** Standard and Poki single-file builds pass. Final size:1,034.42kB raw /382.02kB gzip (`.arena/harmony-chunk8/build*.log`); this is not Poki Inspector/submission certification.
- `scripts/armor-shell-browser-qa.mjs`: both items × desktop1280×720, short640×360, mobile390×844 and mobile reduced motion =8cases. Native free-preview/buy/equip, no buy-to-equip shortcut, actual debug-run armor/recoil/store-return, live shell/HUD, and no frame/page errors. It explicitly prepares controlled contacts and resolves story locks; not an uncontrolled playthrough or real-device FPS claim. Screenshot demo time alone is pinned for legibility.
- Existing native shop regression passes all6viewports/all73items/transactions/search/cleanup; family regression passes4viewports with its documented preset-handler limitation; combat regression passes39fixtures (38original +1explicit Chamfer replacement). Detailed logs/results remain under ignored `.arena/harmony-chunk8/`. The new live preview is labelled **SPLATR — Armor Shell upgrades**, port5182; older Vite previews also read the current source.

### Intentional baselines, not silent compatibility rebaselining

The old40simulation and10source fixtures remain intact. C24/C26 intentionally change6seeded simulations: Glacier, Sentinel, Storm at seeds19/77. Their explicit new expectations are isolated in `armor-shell-simulation-baseline.json`, retaining original hashes and exact coverage assertions. The other34 simulations must still match the original gameplay hashes, and **all40 original source-history hashes remain exact**, with observation on/off gameplay equality.

The source scenario `sword-pulse` equips Storm/Chamfer, so removing its blade tick and reducing real primary armor recoil intentionally changes that one gameplay snapshot/legacy trace. `armor-shell-source-baseline.json` declares only this override; the other9source,14echo and15boundary cases retain original expectations. Browser QA reports38original +1intentional replacement explicitly, retaining its narrow documented cross-engine floating-point tolerance. No source/damage authority is weakened to satisfy a new shell perk.

Old assertions that Chamfer adds a blade tick or that every profile describes FOCUS/timers were updated to the explicit replacement contracts. The short-receipt limit and HUD-markup parity checks were kept: new concise labels and actual `index.html` markup fixed their failures. An early test missed a shear victim because only its display coordinates, not sensor placement, had been moved; the fixture now creates actors at the intended positions and proves actual shear damage. Browser capture initially included the cold-open overlay and another legitimate armor hit after return; it now waits/skips the cinematic and isolates the second launch, without changing gameplay for the test.

### Limits / rollback

C24/C26 are complete within this scope, not the remaining upgrade redesign. Void-world C58 (30% boss recoil sink / strongest-not-additive composition) is still future work; its current score perk is not secretly replaced here. This chunk adds no competing recoil reducer. Existing sword-family recipes retain their other mechanics/choreography. Primary armor still uses the existing collision/shove path; no new collider or source-pool policy is introduced. No actual-device performance/accessibility certification or deployment rollback was performed.

Rollback only chunk8's shell-policy module, new run state/hooks, art/shop/HUD/audio/receipt/icon changes, explicit intentional-expectation fixtures and focused/browser tests; preserve C25 and chunks1–6, all old source baselines and saves.

## Continuation context — preserve for the next chunk

- Repository: `/home/user/SPLATR`, current working branch `arena/e465ea1b-splatr`. Work is saved in the working tree; no implementation commit/push was made in these chunks.
- Authoritative design: `docs/unified-upgrade-harmony-implementation-plan.md`. Older V1–V5 documents are historical inputs, not separate simultaneous feature specifications.
- Completed: S0 baseline, S1 shared family selection, S2a opt-in source observation, all current source-kind compatibility paths of S2b (chunk6), and chunk5's independent shop/UI subset of S9b. C25 Notched vent cooling is complete (chunk7); C24 Chamfer recoil/C26 Segmented compression are complete (chunk8). Current full suite after chunk11:1,189 passing tests. This is **not** completion of S2b admission/transaction policy, S9b or the full upgrade redesign. User wants larger feature-sized chunks, not one tiny adapter per delivered turn.
- Production files changed cumulatively so far: standalone art engine, `swords.js`, `customize.js` (chunk1), `run.js` and `combat-source-trace.js` (chunk2), `equipment-source-context.js` and Prism adapter (chunk3), two echo contexts/shared adapter call (chunk4), then `customize.js`, `lab.css`, `shop-catalog.js`, `shop-item-icons.js` and `shop-feedback.js` (chunk5); finally `combat-source-context.js`, the equipment-context compatibility re-export and all remaining route/wrapper calls in `run.js` (chunk6). Preserve earlier planning documents and unrelated working-tree changes.
- Previously open640×360 clipped-grid bug is **fixed in chunk5 for the tested native shop flows**. Preserve the old baseline evidence, but do not report that defect as still open. Narrow short dialogs scroll; short landscape uses a decision shelf beside the catalogue. Other untested device/layout cases are not certified.
- Keep purchases/credits/IDs/saves/presets, current sword variants and continuous chooser-free flow intact. No quests, engine migration, skipped-physics slowdown or unrelated camera/result-system edits.
- Latest browser source QA defaults to the existing Vite server at port 5180; check it is running before use. Sandbox Chromium runs used `LD_LIBRARY_PATH=/tmp/al2023/lib` and `/tmp/chromium`. Generated logs/captures stay under ignored `.arena/`.

## Next planned implementation

The complete compatibility boundary and C24/C25/C26 shell replacements are now delivered; do **not** spend another chunk renaming individual source calls. The user prioritizes visible, meaningful feature chunks; continue with a coherent appearance-led block rather than claiming the whole redesign is done. The next source-infrastructure block, when taken, remains: implement B6 reserve-before-spend source admission, starting with the existing sword delayed-source pool as one coherent feature (capacity/readiness, retain accepted sources, preserve earned pulse charge when saturated, no payout queue, cleanup and truthful readout together). Audit the blueprint's activation/readout gates before enabling this intentional change. Do not silently rebaseline the current oldest-first policy or call it a visual cleanup. Separate core/Ghost/Prism pools must follow with their own declared trigger/admission contracts, not a global array replacement by assumption.

Retain the original ten-source, fourteen-echo and fifteen-boundary baselines plus the40-build/seed simulation hashes. For intentionally changed saturation cases, record explicit before/after expectations; unaffected cases still require exact equality. Ordinary unknown/misspelled context names throw. `unknown-sword` is an explicit narrow compatibility path, not permission for arbitrary primary fallback.

Admission-policy changes, silent-eviction fixes, swept/solid collision improvements and primary-only proc restrictions remain separate intentional mechanics changes with their own tests/gates; do not bundle them into a compatibility cleanup.

The responsive-shop checkpoint is now delivered as chunk5, separate from source-provenance changes. Retain its six-viewport transaction/search QA and the family QA's native-input requirement in future work.

## Chunk9 — assembled-character construction and free inspection (complete)

This is the requested larger **visible** block, not another source adapter or a new combat perk. The same portable character renderer now supplies the constructed shells in play, cards, practice and the enlarged shop view. Prior C24/C25/C26 authority is retained.

### What visibly changed

- **All10 shell lower chassis were rebuilt**, replacing the generic shadow panel: folded-paper triangles, inset obsidian key, projected hologram mesh, cut crystal facets, bolted iron plate, fractured basalt channels, folded gold foil, machined Chamfer bevel, recessed Notched frame and interlocked Segmented plates. The existing shell outer contour still owns the silhouette; these are visual surfaces, not colliders.
- Head and tail roots now seat through material-specific tabs, keys, vertex brackets, collars, bolts, thermal seats, creases, bevels, recesses or interlocks. The primary weapon has a matching keyed root; distal blade polygons/finish are untouched.
- All17 authoritative completed families replace the old generic integration stripe with fitted structural plates. Phantom's rear root is now inspectable at idle, rather than only briefly during release. Family selection remains the same most-specific selector as the sword; no second family aura is stacked. Front pieces clip to the shell and exclude eyes/core. **Actual cooling/contact/spring bindings draw afterward**, so construction cannot cover C24/C25/C26 state cues.
- **Shop → ASSEMBLY** and **ASSEMBLY VIEW** expose a large labelled inspection. Cube slots default to this mode; direct item links still default to their Part in action study, and attack/aim modes retain their existing demonstrations. `?assembly=1` opens the inspection directly without buying or equipping anything.
- Previous/next controls browse all17 **free reference builds**. They are explicitly marked “EXAMPLE / NOT EQUIPPED”; the middle button returns to your preview. This is a read-only gallery, not an ownership/discovery grant, equip flow, saved preset or hidden gameplay loadout. Switching parts or demo modes leaves the example and returns to the selected-part preview. Powers remain inspectable through Part in action; practice is explicitly enabled rather than interpreting clicks on the static inspection as attacks.
- Short landscape uses a full-figure/controls split; narrow portrait retains the full canvas and gallery. Native QA caught a CSS-specificity regression making the hidden assembly panel consume the shop grid; the grid display is now restricted to the Preview pane. The existing >=100px shop-grid regression assertion was retained, not weakened.

### Restraint / implementation

`resolveAssemblyConstruction()` caches deeply frozen static construction descriptors, not actors/canvas/time/ownership. FIFO capacity128; disposal clears it. The import-free art module does not import game authority. Large cel planes survive at gameplay size; secondary geometry is radius-gated (shell/socket detail at38px), with no new per-character particle pool, postprocessing pass, bloom, ambient pulse or idle charge animation. Core energy remains local. Explicit dash/slash geometry, attack sources, damage/recoil/timing, physics, camera, prices, IDs and save schema are unchanged in this chunk. The only `main.js` addition since chunk8 is the opt-in inspection URL.

### Validation (final source tree)

- **1,162 tests pass /0 fail**, including10 new construction tests: all10 immutable material descriptors/cache limits, authoritative family parity, all10shell/all17family rendering at23px and larger sizes, reduced-motion stability, balanced Canvas state, truthful idle vs actual cooling/contact/reserve, scanner/dash/slash non-repaint, distal blade parity and save migration/ownership stability.
- `scripts/assembly-visual-audit.mjs` compares against the genuine pre-chunk standalone renderer snapshot, not a current-tree rebaseline. All27 shell/family cases change at both23px and58px. At23px, minimum changed fraction of character footprint is **22.1% for shells /17.2% for complete families** (medians26.3%/29.9%); at58px minima23.8%/18.6%. These are pixel-change evidence, **not** an aesthetic score or performance result. All10 distal blade comparisons against the original snapshot are exact. The before snapshot and generated captures stay ignored; rerunning requires that snapshot or `QA_BEFORE_ART` pointing at a separately captured original renderer.
- `scripts/assembly-browser-qa.mjs`: **7 cases**,1280×720,960×540,640×360,390×844 touch,844×390 touch,320×568 touch and390×844 reduced motion. Native navigation visits all17 examples in each case; previous/wrap/return, full-figure bounds, saved ownership/wallet/discoveries/presets, free try-on then explicit buy/equip, study/practice switches, actual-run equipped shell and no frame/page errors pass. Controlled RAF/debug fixtures test correctness, not FPS or uncontrolled playthrough quality.
- Existing shell8cases, shop6viewports/all73items, family4viewports and combat39fixtures pass. Family script retains its documented preset-handler limitation. Original source/simulation expectations are untouched by chunk9; chunk8's explicit mechanics overrides remain explicit.
- Standard and Poki one-file builds pass: **1,050.25kB raw /387.45kB gzip** (final logs in `.arena/harmony-chunk9/build*.log`). Build success is not Poki Inspector/submission certification. Screenshots, genuine before snapshots, pixel reports and logs remain in ignored `.arena/harmony-chunk9/`; the17-family overview was visually inspected as well as individual desktop/portrait/short-landscape captures.

### Boundaries / continuation

This completes the promised ten-shell/fitted-joint/seventeen-family/enlarged-inspection visual block, **not** every blueprint item. It adds no invented powers for still-cosmetic items and does not implement source admission, Void C58 or a combat-physics redesign. Actual-device FPS/accessibility certification remains unperformed. Keep the existing game-authoritative semantic views, most-specific family selector, wallet/save behavior and original baseline fixtures for future work. New live preview: **SPLATR — Full Assembly Visual Update**, port5183; open Shop → ASSEMBLY or append `?assembly=1`.

Rollback only chunk9's art construction/descriptor/inspection additions, shop gallery/mode/CSS, inspection URL and new focused/browser/pixel-audit tests, preserving chunks1–8. Pre-chunk art/customize/main copies are in ignored `.arena/harmony-chunk9/` for local comparison; no commit, push or deployment was requested.

## Chunk10 — seven fitted core mechanisms and truthful live cues (complete)

The next visual block replaces small lower-right core symbols with **seven readable fitted mechanisms** in the shared character renderer. This is a presentation implementation of the existing core powers, not seven new abilities or the49 Core×Dash treatments.

### Visible result / access

- **Standard Heart:** sealed crossed cover and dry central keeper, rather than a missing core or an unexplained empty gap.
- **Time Crystal:** opposed calibrated forks, faceted crystal and local moving index. A small FOCUS return mark uses actual passive return and actual FOCUS, not an invented120-tick bonus countdown.
- **Riot Reactor:** physical opposed piston shoes and reactor slug. Shoes open only while the real Drive timer is positive; generic attack/aim animation cannot pretend Drive is active.
- **Glass Cannon:** suspended split-cradle crystal, visibly fractured construction rather than a starburst. It has no renewable shield/armor meter. A dead-hull fracture is permitted only by a real live-view zero hull; normally death immediately suppresses live state.
- **Grav Core:** broad three-jaw inward iris with negative center. The iris closes while the actual playing-state aim/pull field is enabled. It draws no new field radius, attracted particles or fake target tether.
- **Magnet Dynamo:** opposed pink/cyan poles with an open contact gap. No fake enemy pull or unverified close-hit flash is claimed; close-cut geometry remains owned by combat.
- **Echo Heart:** three outlined chain-register cells; actual chain remainder lights0/1/2 cells. An independent bottom line means a real surviving stationary core blade exists. It is **not** a fourth cell, next-dash pulse, sword-family charge or upgrade Ghost Lash source. Chain cells are deliberately not labelled “ready”: the existing source-eligibility conditions still own the next actual birth.
- The enlarged casing occupies more of the lower face, leaving eyes, shell side cues and outer silhouette intact. All10 shells retain distinct cartridge contours/material fasteners: folded tabs on Paper/Gold, facet keys on Obsidian/Prism, vertex brackets on Hologram, iron plates and the notched/beveled/interlocked/basalt variants. Opaque shells use an opaque capped module, not a transparent cut through the cube.
- **Shop → Cube → Core** defaults to **CORE MECHANISM**: the installed character and an enlarged rendering of the *same* cartridge. `?coreView=echo` (or any validated core ID) opens it directly for free. Existing `?shopItem=<id>` still opens Part in action. Switch to Part in action for the existing power study or explicitly show practice controls for the real sandbox. No preview charge is invented. Hiding practice clears any active manual preview so a stale shot cannot keep drawing under the inspection label; native QA fires Space and verifies this return path. Assembly view and its17 reference builds are retained.

### Authority / restraint

`CORE_MECHANISMS` and the ten carrier outlines are fixed deeply frozen geometry descriptors. `coreMechanismPose()` is a pure read-only adapter from existing phase/opening, chain, Drive, held aim, actual passive recovery/FOCUS, hull and surviving non-upgrade core echoes. It owns no timers, allocations of sources, counters, grants or save state. The live game and real sword chamber both pass this view into the same character renderer. Generic combo, weapon charge, attack pose and mere elapsed animation time cannot light a charge cell or activate a core power.

Time's private after-kill bonus timer is intentionally **not exposed or guessed** in this visual chunk. Its passive-return mark does not claim “bonus active” or2×; the existing item receipt explains the rule. Echo source cadence, shared pool admission/eviction and the baseline behavior of secondaries are unchanged. No hidden fixes or completion claims for those mechanics.

Family front plates now exclude the larger supported chamber. Spark connectors may terminate on its casing but clip out of the protected mechanism interior; Pixel/Echo's old ornamental squares are replaced by one casing terminal so they cannot be mistaken for actual chain cells. C24/C25/C26 shell cues remain drawn above construction. Large primary mechanical forms survive small scales; detail is radius-gated. Reduced motion holds ambient indexes/shutters still but preserves static true-state marks. No new emitters, particles, postprocessing passes or whole-character deformation.

### Validation / original comparisons

- **Full suite:1,173 tests pass /0 fail**. Eleven new focused cases cover all7 core names/grammars, frozen descriptors, read-only/phase/invalid-number behavior, all70 material/core pairs at23px and64px with emission on/off, distinct carriers, no invented activity from generic poses, separated Echo cells/source mark, ownership of live cues, reduced-motion stability, balanced Canvas state and save/rule/sword invariance. A real-run test earns Echo/Drive through actual primary kills, toggles actual Grav aim and Time passive return, then checks death suppression; no new core counter simulator is substituted for the run.
- `scripts/core-mechanism-visual-audit.mjs` compares the genuine pre-chunk portable renderer (`QA_BEFORE_ART` can point to another independently captured original). **All70 combinations visibly change at both23px and58px**, with minimum/median changed character-footprint fractions13.2%/15.2% at23px and14.1%/16.1% at58px. Upper-face pixels remain exact. These deltas establish visibility, not aesthetics/FPS.
- All **392 explicit Dash×Slash×Core presentation cells** compare pixel-exact against the original snapshot for the rendered dash, slash and primary weapon. The snapshot is ignored local evidence, not a production dependency or a silently updated gameplay baseline.
- New native browser QA: **7 layouts/motion cases×7 cores** (1280×720,960×540,640×360,390×844 touch,844×390 touch,320×568 touch and390×844 reduced). Checks free try-on/save preservation, locked-core non-grant, full-canvas bounds, inspection non-interactivity, mechanism/assembly/power/practice role switches, explicit Time buy/equip, actual-run Time return view, invalid/non-core URL rejection and no page/frame errors. Reduced-motion canvas stability is checked for every core. Controlled RAF/debug fixtures are correctness checks, not uncontrolled-playthrough/device benchmarks.
- Existing assembly7cases/all17 references, shop6viewports/all73items, shell8cases, family4viewports and combat39fixtures pass. The family script's documented preset-handler limitation remains. Original combat/source/simulation fixtures are unchanged; chunk8's narrow explicit mechanics overrides remain explicit.
- Standard and Poki one-file builds pass: **1,057.79kB raw /390.00kB gzip**. No Poki Inspector, actual-device FPS or accessibility certification is claimed.
- Evidence stays in ignored `.arena/harmony-chunk10/`: pre-chunk art/shop/main/CSS snapshots, focused/full logs, original pixel report, before/after overview, native screenshots/results and both build logs. Visually inspected the before/after overview plus desktop, portrait, short-landscape inspection and real-run capture.

### Scope / rollback

Live preview: **SPLATR — Core Mechanisms**, port5184.

Only art, the shop inspection mode/CSS, validated inspection URL, tests and documentation changed in chunk10. No run/physics/rules/perks/purchase/save/source-admission edits. This is not completion of S8a/D8, all18 Spark recipes or every Part C core contract. Roll back chunk10's seven-mechanism renderer/view/inspection and related shop/URL/tests only, preserving chunks1–9 and all original authority baselines. No commit/push/deployment requested.

## Chunk11 — reactive shell toolkit: precision phase, spent guard and needle hardpoints (complete)

A coherent **feature + upgrade + visual** block for Hologram, Iron and Prism. C19 gets its actual replacement power, while C20/C21 retain current mechanics and gain authoritative physical readiness/consumption cues. This does not claim the entire harmony redesign or every C20/C21 future collision/admission gate is complete.

### Actual new upgrade: Hologram Wire precision phase

- Replaces the generic12% aim-cost reduction. **A legal accepted launch opens a4-world-tick gate** while ready. One hostile Prism/Crown needle may pass through; accepted interception starts **120 world ticks of recharge**. Empty launches do not spend it; rejected/buffered/canceled requests do not rearm it. Repeated legal launches during recharge cannot refresh or bypass the deadline.
- Suppression is **one exact hazard/player pair until clear**, not invulnerability, hazard destruction or a volley filter. The needle keeps its velocity, age, life and normal rendering. A second simultaneous needle follows normal damage/parry resolution. A passed needle can hurt again after clearing and reentering. Boss debris, contact attacks, links/beams, zones/rings/shock, protected/tutorial hazards and teaching/tutorial contexts are excluded. Existing invulnerability does not waste an interception. Player wall/body collisions are untouched.
- Entry time is computed on the same relative-circle swept envelope as hostile needles, so a frame crossing the4-tick endpoint accepts a collision that actually entered before4 and rejects one entering after it. The deadline is half-open [launch,launch+4). Recharge begins at actual entry time. World time, not RAF/animation or a new private countdown, owns both deadlines. Existing hazard traversal order deterministically selects the one accepted pair.
- Hologram stays visible: one fitted calibration cell and side aperture open briefly, then a dark cell denotes actual recharge. Exactly two short vertex marks may acknowledge an accepted pass; reduced motion suppresses the flash but retains true static readiness. No fake block on a missed launch, wall phase, teleport, hitbox resize, particles pool, new shader or screen blackout.
- ID and **500-credit price**, purchases, presets and save schema are unchanged. Existing owners automatically receive the replacement ability. Other aim-efficiency perks and their shared cap are retained; Hologram no longer contributes its old discount.

### Other visible upgrades / feature access

- **Iron:** one bolted structural latch stays intact while the existing Fang-rush guard is available. Actual block opens it into a persistent dent; health repairs do not repair the latch. Second rush/needle/beam/ring behavior and push-clear policy are unchanged.
- **Prism:** exactly two fitted solid needle hardpoints light only when the existing side-wall proc is ready. Both empty on the actual two-projectile emission and relight after its actual45 simulation-tick cooldown. No floor proc, new needles, ghost missiles or per-ornament damage is added. Existing projectile sweep/solid/admission limitations are not silently fixed or claimed complete here.
- The shared hero supplies hardware in gameplay, cards, assembly and real combat practice. Live state is published as a small `shellAbility` view from private existing guard/cooldown authority and the phase gate; no renderer computes grants. Shell cues draw after family/Spark decoration and do not cover eyes/core.
- A compact HUD receipt reports **PHASE READY / OPEN / RECHARGE**, **GUARD READY / SPENT**, or **NEEDLES READY / RELOAD** only for the actual equipped reactive shell. It clears with inactive state/cleanup. One existing bounded parry sound acknowledges accepted phase, not every frame or empty launch.
- **Shop → Cube → Shell → Part in action** has enlarged, explicitly labelled ability illustrations for all three. Hologram's illustration uses the same phase gate policy, explains the4-tick/one-needle/120-tick rule and visible exclusions before purchase, and labels its slowed presentation. Direct free links: `?shopItem=hologram`, `?shopItem=iron`, `?shopItem=prism`. Unique icons show an open needle-pass cell, one guard latch, or two hardpoints rather than generic gems.
- Reactive studies are read-only until practice controls are explicitly shown. Short landscape uses the proven full-figure/controls split; native bounds checking caught the previous scrolling study clipping at640×360, which is fixed rather than relaxing the assertion. Inspection roles/labels match their actual interactivity.

### Implementation / validation

- `src/needle-phase.js`: narrow eligible-needle policy, relative sweep entry fraction, bounded deadlines, weak identity pair suppression/reset, policy study and short HUD copy. It never owns/mutates world/player/hazards; WeakSet suppression does not retain removed hazards. `slasher.attacks()` gains an optional hit-admission hook **before** spending/deleting a hazard; absent hook preserves all old routes. The run arms only at accepted launch and clears gate/view on death/ready/retire/dispose.
- **Full suite:1,189 passing tests /0 failures**, including16 focused reactive-shell tests. Coverage: old perk removal/live FOCUS parity/save retention, unarmed/exact deadline/fractional entry, recharge/empty/rejected launch, identity/clear/reentry, type/protected/tutorial exclusions, real hazard survival/movement/life/no invulnerability or resources, deterministic double needle, actual wall collision, real Iron block/repair/second hit, actual Prism two needles/cooldown, lifecycle/HUD clearing, Canvas state/owning-body/reduced-motion and labelled shared study stability.
- New native browser QA: **3 shells×4 layout/motion cases =12** (1280×720,640×360,390×844 touch and390×844 reduced motion). Free direct preview, saved ownership/wallet/preset/discovery preservation, native buy-versus-equip separation, full study bounds, actual live phase/needle survival/second damage, actual spent guard, exactly2 live wall needles, live HUD and no page/frame errors pass. The script captures clean first-pass state separately from the intentionally damaging second needle. These are controlled debug/RAF correctness fixtures, not an uncontrolled playthrough or device FPS claim.
- Existing shop6viewports/all73items, family4viewports (with its documented preset-handler limitation), combat39fixtures, armor8cases, core7layouts/all7cores and assembly7layouts/all17examples pass. Original source/simulation expectations are unchanged; chunk8's explicit Chamfer mechanics overrides remain separate. Removing Hologram's aim discount does not require a silent baseline regeneration.
- Genuine pre-chunk pixel audit:252 core/world/scale comparisons (3 shells×7 cores×6 worlds×2 sizes) all change. At23px minimum character-footprint deltas are Hologram9.8%,Iron7.3%,Prism5.6%. All392 explicit Dash×Slash×Core attack render cells stay pixel-exact against the original snapshot. These are visibility/compatibility evidence, not aesthetics/FPS certification. Prior chunk audits describe their own original snapshots, not forever-frozen future art.
- Initial full suite caught a comment matching the portable-art browser-global guard and an overlong short receipt. The comment/receipt were corrected; portability and<=20-character quick-receipt assertions were **not weakened**. Native QA caught the short-screen clipping mentioned above. The catalogue-audit heading contract was retained as well after its structure check caught a renamed Works heading. Evidence and genuine pre-chunk copies stay under ignored `.arena/harmony-chunk11/`.
- Standard and Poki one-file builds pass: **1,068.10kB raw /393.61kB gzip**. Build success is not platform certification. Live preview: **SPLATR — Reactive Shell Upgrades**, port5185.

### Limits / rollback

This completes C19's declared precision-phase replacement and the three-shell reactive presentation block. It does not implement Ember/Frost/Volt/Tide/Void/Echo-dash mechanics, source-admission transaction redesign, new Prism solid collision, or broad combat/invulnerability changes. Iron and Prism keep their existing perk rules. No camera, wave-goal wiring, forced chooser, quest UI or saved transaction schema was added. Actual-device performance/accessibility/Poki Inspector qualification remains unperformed. Revert only chunk11's gate, narrow admission hook, replacement perk/receipts and related art/HUD/shop/tests to roll back; preserve chunks1–10 and original baselines. No commit/push/deployment requested.

## Chunk12 — screen-wide world architecture + free World Panorama (complete)

The next large visual block replaces the five paid worlds' flat rectangular skyline/simple backdrop adapters with distinct, large-scale architecture. It is a **presentation and inspection feature**, not a silent rollout of the future world powers in C54–C58.

### What visibly changes

- **Cyber Tokyo:** faceted service towers with inset window strips, an external sign spine, observation needle, cable spans, trussed skybridge and quiet crescent. The camera now moves separate architecture depth planes instead of the city being glued to the screen. Only eight dim rain strokes remain; no extra drones, electric curtain or powered bank stripe.
- **Blood Foundry:** large shuttered furnace throat, pressure vessel and collars, bent service pipe, heavy hoist, inset maintenance recess and catwalk. Only the existing-looking local furnace slit gently breathes; no lava floor, smoke curtain or spark emitter. It does not show a Forge charge because that replacement mechanic is not implemented.
- **Manga Paper:** slanted printed facades, inset ink windows, large editorial panel boundaries, batched sparse halftone and broken hatching. Muted warm paper reduces the old empty white field without tinting/repainting live enemies or the player. No fake time stop or chain-continuation meter.
- **Synthwave Grid:** eclipsed striped sun, sharp mountain ridges, hollow obelisks, recessed vertical light strips, a suspended architectural ring and terraced perspective deck. No moving full-screen tunnel, refund marker or pulsing hazard-like grid.
- **Pro Void:** large broken orbital gate with inset ribs, faceted wreckage, distant lensed eclipse and sparse quiet stars. No attraction force, recoil arrow, teleport or changing collision bounds. This does **not** implement C58.
- **Twilight Undercut:** retains the finished industrial district, palettes, seeded machinery, rules and neutral reference role. One distant, continuous culled freight crane gives the skyline a landmark; it can legitimately be occluded at particular camera/phone crops. It is not claimed as a sixth screen-wide rebuild. No additional ambient/affinity particles.
- Same adapter reaches the live arena, public backdrops, thumbnails, assembly/reference scenery and shop studies. Existing threat/rail/gameplay layer order is retained. No attacks or foreground characters were restyled by this chunk.

### New shop feature / access

**Shop → World → select any world → WORLD PANORAMA**, or open `?shopItem=tokyo` (all six existing world IDs work). A labelled read-only tour pans through the actual scenery adapter with standard player/Fang/Prism silhouettes for contrast. Pause holds the image; reduced motion freezes both travel and atmosphere. Space/tap on the inspection does not silently fire the sandbox. Explicitly show practice controls for manual testing; Part in action, core inspection, assembly examples and existing purchase controls remain available.

This is scenery, not an encounter replay, power-charge demonstration or grant. Browsing leaves ownership, credits, presets, discoveries and equipped world unchanged. Prices/IDs and save schema are unchanged; paid-world purchase and equip remain two separate explicit actions. The existing receipts still describe existing world perks. No proposed world power was invented to justify the architecture.

### Render and compatibility boundary

The portable renderer stays import-free. Static architecture is world-tiled on two camera-relative planes (.055/.19) with deterministic variants, culling before painting and no origin/tile-boundary resets. Far landmarks are spaced vertically farther apart than near architecture to avoid dense repeated sky stamps on tall phones. Both zoom and positive/negative deep camera offsets work. There are no world entities, collider writes, new physics forces, source timers or particle pools. The original camera lead is untouched.

The live renderer reuses its existing explicitly disposed 24-entry/2,000,000-pixel raster bake; panorama uses its own 8-entry/1,200,000-pixel bake, cleared on shop disposal. Geometry is baked at half resolution with finite world/plane/variant keys, not one surface per frame/camera position. Direct no-surface rendering remains supported. Tests travel 180 mixed-world/deep-camera frames, enforce cache/pixel ceilings, verify surface reuse and verify every retained surface is released to1×1 on disposal. Manga halftone dots were batched into one fill after the initial uncached primitive-budget test caught excess draw work; the assertion was retained. No additional shader or postprocessing pass.


### Validation / genuine evidence

- **Full suite: 1,210 tests pass /0 fail**, including21 new architecture/panorama cases. Determinism, both camera axes, deep offsets/zoom, origin and positive/negative plane boundaries, half-resolution/public visual tolerance, caller state restoration, frozen input, reduced-motion stills, bounded no-surface primitives, cache reuse/release and read-only tour are covered. Existing industrial/default-public parity and industrial culling tests stay unchanged.
- New native browser QA: **six worlds×four layout/motion cases =24** (1280×720,640×360,390×844 touch,390×844 touch reduced). Full inspection bounds, native pause/still behavior, read-only Space, free browsing, unchanged save/presets/discoveries, exact existing purchase prices, separate buy/equip, actual-run selected-world rendering and no page/frame errors pass. Story-chip size is asserted on actual live captures.
- Existing shop six viewports/all73 items; reactive shells12cases; core seven layouts/all7 cores; assembly seven layouts/all17 examples; armor8cases; family4viewports; combat39fixtures pass. The existing family preset-handler fallback limitation is not resolved or recharacterized by this art chunk.
- Genuine pre-chunk portable-renderer comparison: **36 world/camera/size pairs**. At an RGB-sum difference threshold>12, minimum changed screen area across the six sampled views of each paid world is Tokyo93.5%, Foundry89.9%, Manga96.7%, Synth94.5%, Void94.3%. Twilight's small crane changes2.3% at the desktop origin and may be fully occluded elsewhere; it is intentionally the protected baseline. These numbers establish screen-wide visibility, not aesthetic/device certification.
- **392 Dash×Slash×Core attack cells and70 Body×Core assemblies remain pixel-identical** against the genuine pre-chunk renderer. No original combat/source baseline or fixture was regenerated. The audit accepts `QA_BEFORE_ART` for an independently captured original; its default snapshot is ignored evidence, not a production dependency.
- Standard and Poki single-file builds pass: **1,073.12kB raw /395.33kB gzip**. No new network asset dependency. Build success does not certify Poki Inspector or actual-device performance/accessibility.
- Evidence: ignored `.arena/harmony-chunk12/` contains the genuine pre-edit art copy, full/focused/build logs, all24 native results and screenshots, old-feature regression results, per-world captures and before/after overview. Durable scripts: `scripts/world-architecture-browser-qa.mjs`, `scripts/world-architecture-visual-audit.mjs`; focused tests: `test/world-architecture.test.js`. Visually inspected the overview, desktop Tokyo/Foundry, phone Void and short-landscape Manga panorama; the mobile lime-panel fix was inspected on the rerun.

### Limits / rollback

Live preview: **SPLATR — World Architecture Upgrade**, port5186. Uncontrolled playthroughs, actual phone/GPU FPS, all accessibility/contrast matrices and Poki Inspector remain release gates. Controlled RAF/debug fixtures are correctness evidence, not those qualifications. Proposed world benefit replacements, C58 recoil and source-admission redesign remain unimplemented. Roll back only chunk12's world architecture, small neutral crane, panorama mode/bake/CSS and related tests/docs; keep chunks1–11, all existing saved purchases and foreground attacks. No commit, push or deployment requested.

## Chunk13 — seven-tail toolkit + Viper retention / Spectrum primary-sequence powers (complete)

A **seven-shop-item visual/inspection upgrade plus two actual power replacements**, implementing the C34–C40 appearance block and C37/C40 mechanics. This is not another world repaint, a new collectible tier or a price/save migration.

### Seven visibly distinct items

- **Ninja Ribbon:** one broad folded cloth strip, a pale hem and a shell-specific seated knot. Bounded release/travel bend; no independent idle flutter or gameplay drag. The free cloth remains one long thin outline, not two green spikes.
- **Prism Wings:** paired upper/lower rigid feather banks, inset facet veins, braced roots and a recharge cartridge. Actual first-sidewall readiness lights the cartridge; spent diagonal latch persists until the real floor event rearms it. No flight/hover or extra EDGE beyond the existing once-per-airborne-streak policy. A full-EDGE first wall still spends that existing latch; no fictitious refill flash.
- **Ghost Scarf:** two unequal translucent cloth folds rather than one recolored baseline strip. A small root/hem follows the actual blade-active state, including reduced-motion static activity. Existing+6 launch blade ticks remain; the scarf is never another hitbox, echo or repeated target hit.
- **Viper Tails:** broad taut twin streamers, folded pale tension seams and a material-fitted stabilizer clamp. Only a measured marginal accepted-launch retention gain can acknowledge the tension stitch. No new homing/steering, perpetual glow, venom or flame.
- **Anchor Chain:** large alternating interlocked links and a blunt split-face weight with a recessed seat. Compression/seam cue consumes only the actual qualified floor event. Existing+15% floor rebound, radius170 Fang clear and cooldown remain unchanged; no new slam input, tail collider or radial rubble emitter.
- **Mini Thrusters:** paired faceted nozzle cans, inset bores, dry idle shutters and physical shell mounts. The old always-on flame is gone. A short paired exhaust only follows the existing earned rebound boost **when its marginal multiplier actually exceeds1**; ordinary lift/release/idle time, unearned contact and already capped output cannot ignite it. Reduced motion omits the exhaust.
- **Neon Spectrum:** three separated fixed-color cloth bands and a three-cell root register. Cells reflect actual eligible primary count; cooldown uses quiet crossed cells. No hue cycling, rainbow attack repaint, elemental damage or per-count emitter. It is visually distinct from Echo Core's stationary memory mechanism.

All seven constructions use the same character renderer in play, the real practice chamber, thumbnails and enlarged labelled shop illustrations. Existing ten-material collars and core chambers are preserved. Detail is scale-gated; no new texture/shader pass, particle pool or body deformation is introduced. Tail geometry is not a collision source. The velocity-following bend yields during a committed dash so the launch snapshot remains the sole motion owner.

### Actual power replacements

**Viper Tails —250 credits, same ID/ownership.** `viperRetention()` recovers **15% of ordinary redirection LOSS**, not15% speed. Ordinary85% retention becomes87.25%; actual80-speed reversal changes **80→68** into **80→69.8** under the same input direction/cost. From rest, gentle continuation, requested-dash-speed floor, Hyper and already stronger retention produce no fabricated gain. Retained incoming speed still passes through the existing launch clamp/ceiling machinery; camera lead and post-release steering are untouched. Only accepted launches produce a view cue, and only if solved speed actually exceeds the ordinary result. The old+10% speed-score perk is removed from policy/catalogue/readouts/audit together.

**Neon Spectrum —600 credits, same ID/ownership.** Three unique qualifying primary kills in one chain complete a sequence. It returns at most **one EXTRA EDGE after the ordinary kill refund**, capped at actual capacity, then begins **120 world ticks** of source cooldown. Secondary relay/echo/needle/shear/floor kills do not count; tutorial/teaching contexts do not count. Replayed target identity cannot count twice. Incomplete bands clear on chain expiry, damage or an actual chain break, but a break does not refund a completed cooldown. Kills during recharge cannot store a payout. Completing with full EDGE still consumes the sequence/cooldown without refund flash or a queued grant on the next shot. At one starting EDGE, three accepted launches and primary kills yield ordinary EDGE results1,1,1 versus Spectrum1,1,2. The old+12 chain ticks are removed. No new attack/source birth is emitted by the ribbon.

State is read-only to art. `tailAbility` is cleared on death/retire/practice exit/disposal; a new run owns its own sequence/latch. Existing wall/floor/jet mechanics remain their existing authority. One compact factual HUD line is shown for actual Wings/Spectrum state or brief measured Viper retention, not a second meter for every tail.

### Shop access / preservation

**Shop → Cube → Tail → select any of seven items → Part in action** (also `?shopItem=spectrum`, `?shopItem=viper-tails`, etc.). Tail selection now defaults to its enlarged ability study rather than hiding the upgraded item in the general assembly inspection. The study contains the same installed hardware at large and23px scales, explicit slowed-illustration text, readiness/trigger/result explanation and pause/reduced-motion stills. It is read-only until the user explicitly shows practice controls. Assembly/core/world inspection modes are retained. Short-landscape layouts reuse the established readonly grid and remain fully in bounds.

Viper and Spectrum icons now depict the two-direction tension path and three-count-to-reserve route. All existing items retain distinct item-specific icons. Catalogue titles/receipts, perk policy, detail/search chips and `docs/shop-item-audit.md` agree with the replacements. Free try-on does not buy/equip/grant/discover anything. Explicit purchase/equip still costs the existing price, preserves presets/discoveries and applies the selection next run; no new save field, currency or grant path.

### Regression/migration evidence

- **Full suite:1,228 tests pass /0 fail**, including17 focused tail cases plus one narrow simulation-migration contract case. Tests cover exact Viper math and real accepted/rejected/rest/forward/Hyper launches; unique primary sequence, cooldown boundary/no overflow, cap ordering, real third-primary extra EDGE, full-cap consumption, chain/damage break, real echo/tutorial exclusions, first/second wall/floor rearm, lifecycle cleanup, frozen input/Canvas state, seven distinct rigs, idle/capped/unearned jet suppression and a real marginal jet boost, and labelled reduced-motion-stable studies.
- Initial broad checks caught velocity-following cloth changing the committed dash and the free-cloth outline losing its observable one-ribbon color contract. The render bend now yields to the dash and the original single-cloth outline contract is retained. Existing assertions were not weakened.
- New native browser QA: **seven tails×four layout/motion cases =28** (1280×720,640×360,390×844 touch,390×844 touch reduced). Free readonly try-on, full canvas bounds, native pause/stills, Space non-firing, buy/equip separation, unchanged wallet except exact purchase, unchanged presets/discoveries, actual-run selected equipment, measured Viper80→69.8, real Spectrum counts1/2/0 and EDGE1/1/2, actual spent Wings/floor Anchor/active Ghost/dry idle jets and accepted jet boost pass. No page/frame errors. The marginal-jet fixture clears any old floor receipt before testing an airborne bank. Controlled RAF/debug fixtures are correctness evidence, not an uncontrolled playthrough/device benchmark.
- Genuine pre-chunk art audit: **980 Tail×Body×Core×size comparisons** (7×10×7×2), all visibly changed. Minimum changed23px character-footprint areas across70 material/core pairs: Ribbon17.4%, Wings41.9%, Ghost22.8%, Viper26.7%, Anchor21.0%, Thrusters15.6%, Spectrum27.4%. These are visibility evidence, not aesthetic/FPS certification. **All392 explicit Dash×Slash×Core attack-render cells remain pixel-identical** against the genuine original.
- **Original40-case simulation baseline remains untouched.** `scripts/tail-toolkit-migration-audit.mjs` first replays all six affected build/seed contracts from the genuine pre-chunk run with the two old tail receipts restored at its test-only rules boundary; all six original gameplay/source hashes reproduce exactly. Only then are current results accepted as explicit `tail-toolkit-simulation-baseline.json` receipts for Reaper/Briar/Orbit at seeds19/77. Five gameplay hashes change; Briar19 stays exact. The other original builds keep their original expectations (and chunk8's six separately declared shell replacements).
- Source diagnostics remain exact for five of the six migrated tail-build cases. **Briar77 is explicitly different:** removal of its old12 chain ticks lets the chain expire between shots. The first source difference is contact15 against Crown3 on shot6, still the same primary source/target/accepted kill, with a changed worldClock; subsequent chain/pace/combat naturally diverges. The narrow fixture records that causal exception rather than claiming unchanged diagnostics or replacing all source baselines. Observation on/off gameplay parity still holds. No source-admission table or recursive proc policy changed.
- Existing native shop6viewports/all73items, combat39source/echo/boundary fixtures, reactive12cases, core7layouts/all7cores, assembly7layouts/all17examples, world24cases, armor8cases and family4viewports pass. The documented family preset-handler fallback limitation remains.
- Standard and Poki one-file builds pass: **1,083.13kB raw /399.47kB gzip** (single-file1,057.7KiB). Final build logs are under `.arena/harmony-chunk13/`. No new external assets/runtime dependencies. Actual-device FPS/accessibility and Poki Inspector qualification remain unperformed.
- Evidence: ignored `.arena/harmony-chunk13/` contains the genuine pre-edit renderer/run copies, original replay/migration proof, unit/full/build logs, native screenshots/results and original-vs-current tail overview. Durable scripts: `tail-toolkit-browser-qa.mjs`, `tail-toolkit-visual-audit.mjs`, `tail-toolkit-migration-audit.mjs`; tests: `test/tail-toolkit.test.js` and the narrowly extended simulation contract. Inspected desktop Spectrum, short-landscape jet study, portrait live Spectrum refund and actual spent Wings; the latter capture restores the fixture player to the visible field after its real wall contact without rearming the latch.

### Limits / rollback

Live preview: **SPLATR — Tail Toolkit Upgrade**, port5187. Existing Ghost/Laser timing composition and remaining elemental/world mechanics/source-admission redesign are not declared complete. No additional particles, ambient emitters, postprocessing, camera-lead edit, physics-step skipping, collision geometry changes, forced chooser or quest UI. Actual-device and broader uncontrolled balance/readability qualification remain release work. Roll back only chunk13's two replacement policies/hooks, fitted tail renderer/state/studies/HUD/icons and related tests/docs/migration expectations; retain chunks1–12, original fixtures and all saved item ownership. No commit, push or deployment requested.

## Chunk14 — Seven fitted eye systems, real ignition reserve and local Hypno admission

**Delivered scope:** the next appearance→function block across all seven eyes. Genuine pre-edit `art-before.js`, `run-before.js`, `slasher-before.js` and `customize-before.js` were captured under `.arena/harmony-chunk14/` before implementation. No prices, item IDs, family recipes, save fields, ownership, wallet, presets or credits were changed. No commit/push/deploy requested.

### Construction and actual state

- **Ninja:** hand-cut pale apertures with folded ink rims. Free baseline remains fully expressive without a hidden stat advantage.
- **Visor:** fitted glass and mounts, quiet at rest, actual usable-aim calibration bars. Existing10% aim-cost contribution/shared30% cap retained. No continuous scanning, lock or extra slowdown.
- **Blaze:** flame-cut sockets with pale cores, steady hot material during actual Drive, brief bright eye opening only after an actual marginal grant. No ambient flicker, target burning or added particle emitter.
- **Glitch:** deliberately mismatched X/ring optics, split cyan/pink conductors whose broken bridge closes only during actual passive focus recovery. Existing12% recovery/shared40% cap retained.
- **Smug:** true half lids, live-chain notch and real gold/open Drive state. Existing12 chain ticks/shared36 cap retained; expression cannot extend a chain.
- **Hypno:** actual continuous spirals, convergence from authoritative hold progress, one short accepted-target link and local daze notch. Reduced motion omits the link but preserves factual static status. No full-screen overlay or perpetual beam.
- **Sniper:** off-center mounted crimson lens and four converging ticks reading actual input power; eligibility dot at≥.9. Existing10% full-power primary-kill score retained/shared25 cap; **no puncture, narrow corridor, homing or extra plate damage**.

All seven share the installed hero path across live play, practice, cards and enlarged shop studies. Ordinary gaze, blink, fall-eye closure and attack squint remain; a tense expression is not ability eligibility. The first full regression caught missing baseline closure/attack expression; the implementation was repaired without weakening the existing animation assertions. No new texture, shader, body deformation, audio loop or particle pool. Explicit Dash/Slash/weapon geometry is unchanged.

### Mechanics / ownership

`src/eye-toolkit.js` owns deterministic helper policies, not a new damage route. Run/combat own grants and AI. `eyeAbility` is a read-only presentation view; art never grants EDGE, chooses a target or changes a timer. Lifecycle cleanup clears private hold/immunity/flash state at run boundaries.

**Blaze C12:** real fresh `drive<=0`→Overdrive entry is consumed once, after the ordinary kill refund. At one starting EDGE, a legal launch/entry kill gives ordinary1 vs Blaze2. Riot's actual2-EDGE capacity is respected. Full-cap entry consumes without flash/queue; later spending cannot claim it. Refreshing active Drive neither refunds again nor extends Drive beyond its normal refresh behavior. Arbitrary assignment of a positive visual Drive value cannot pay. Teaching contexts excluded. Old8% Drive score removed from rule/perk/catalogue/readout/audit together; existing shared EDGE return cue reused.

**Hypno C15:**18 continuous **fixed usable-aim updates**, at60Hz and frozen during hitstop, admit one nearest eligible **idle Fang within140** with closed-segment static-AABB line of sight (grazing/endpoint obstruction blocks). Ties resolve by stable ID. Only NEW attack initiation is gated for12 **world ticks**. Movement and cooldown continue; existing tell/rush/projectiles are not retroactively canceled. Boss, other kinds, pinned/training/paper/dead/already-attacking targets do not admit. One admitted target per hold,90-world-tick per-target-object immunity **from acceptance**, no reused-ID immunity leak into a new object/generation. Release resets hold but not immunity. Threshold reached with no target can wait for a legal target while still held; no fake admission/cue is emitted for blocked attempts. Input lock, stun, depletion, tutorial/teaching states cannot charge/admit. Hold uses the fixed input clock intentionally: counting18 slowed world ticks can exceed the ordinary focus tank. Daze/immunity share the actual world clock with Time/focus, with no extra slow factor. Old15% aim discount removed atomically. Frost still has its pre-existing generic discount, not a freeze; future status-overlap policy is not claimed complete.

### Free shop studies / transactions

Shop → Cube → Eyes → Part in action (or `?shopItem=hypno`, `?shopItem=blaze`, etc.) defaults to a large quiet labelled eye illustration with the **same fitted hero** at enlarged and23px sizes. Three deliberately illustrative condition states, pause and reduced-motion still are distinct from real combat. Canvas is read-only and cannot fire with Space until practice controls are explicitly enabled. Assembly/core/world studies remain available. Seven icons now depict their actual apertures/hardware, not a shared generic eye badge. Native purchase and equip remain separate operations; a try-on grants nothing.

### Evidence

- `node --test test/eye-toolkit.test.js`: **15/15 PASS**. Covers atomic power replacement, actual Blaze entry/refund ordering/current cap/Riot/refresh/full-cap/no-queue/teaching negatives, static LOS boundaries, hold threshold/release/tap/target loss/range/kind/boss/current-attack immunity/generation, actual Time/focus clock behavior, actual AI motion/tell/rush behavior, lock/stun/depletion/hitstop/teaching suppression,7 distinct rigs and condition pixels, reduced-motion stills/render-state safety, prices/save loading.
- Full `npm test`: **1243/1243 PASS**,380.8s under concurrent browser QA. Original40 simulation cases and prior explicit shell/tail migration fixtures remain unchanged. **No simulation rebaseline or new migration fixture** was needed. The outdated old-Hypno aim-cap assertion was changed to the new correct16% remaining Frost/Pointer reduction; independent synthetic stacking still proves the30% cap. Sniper conditional-score assertions are retained.
- `scripts/eye-toolkit-browser-qa.mjs`: **28/28 PASS** (7 eyes×1280×720,640×360,390×844 touch, reduced-motion touch). Native free preview/read-only Space, pause/still pixels, full in-bounds study, separate buy/equip, unchanged presets/discoveries/wallet except exact purchase, correct next-run equipment and zero page/frame errors. Controlled actual run proof: Blaze entry→2 EDGE; Hypno17th-update no admission/18th-update one real idle target with~11.9 world ticks remaining; actual Visor.9/165 drain; actual Glitch passive return. Screenshots in `.arena/harmony-chunk14/browser/`.
- `scripts/eye-toolkit-visual-audit.mjs`: **980/980 genuine before/after hero combinations visibly changed**, all10 body materials×7 cores×7 eyes×2 sizes. Minimum23px total-character footprint change: Ninja6.8%,Visor12.9%,Blaze7.0%,Glitch10.3%,Smug7.7%,Hypno10.1%,Sniper11.4%. **392/392 original Dash/Slash/weapon render cells pixel-identical.** Board: `.arena/harmony-chunk14/visual-audit/eyes-before-after.png`.
- Native regression reruns: assembly7 layouts×17 examples **PASS**; armor8 cases **PASS**; family overlap4 viewports **PASS**; world24 cases **PASS**; tail28 cases **PASS**. All original authority/source/portable-art tests pass in the full suite.
- Visually inspected genuine comparison board, desktop Blaze shop, phone Hypno shop and live desktop Hypno target notch. No clipped study canvas, fake scanner or excessive overlay observed in those captures.

### Limits / rollback

This chunk is **not** completion of C16's first-puncture replacement, future Visor one-shot calibration choreography, all eye sound design, elemental/world power replacements, Ghost/Laser shared-window redesign, source-admission transaction work, global device/performance qualification or Poki Inspector. Browser gameplay checks use controlled debug state, not an uncontrolled playthrough or device FPS measurement. Family preset fallback native-input limitations remain documented by that suite.

Rollback this chunk's eye helper/rule/run/AI/renderer/studies/icons/readouts plus corresponding docs/tests together. Preserve prior chunks, original simulation fixtures, IDs, owned items, credits and save schema. No new persistent fields require save migration.

Final packaging: normal and Poki builds both **PASS**, **1090.95kB raw /402.59kB gzip**, verified single-file1065.4KiB. `git diff --check` clean. Live dev preview remains on port5187. No deployment performed.

## Chunk15 — Ability-first shop, sixteen new explanations, plain-language catalogue

**User request:** extend appearance→ability to more items, make the next chunk a big shop upgrade, and replace technical wording such as “ticks.” This chunk changes shop presentation/copy, **not combat balance**. Existing item IDs, prices, unlock conditions, saved ownership, wallet, presets, discoveries and actual mechanics remain unchanged.

### Delivered

- A rebuilt slate/cream/lime shop presentation: calmer surfaces, clearly selected cards, warm currency accents, stronger decision shelf and a large explanatory stage. Existing categories, slots, search, filters, separate buy/equip, discoveries, practice and free inspection remain usable.
- **16 dedicated cause→action→payoff showcases:** all9 heads (Bare, Halo, Cyber Ears, Viper, Oni, Crown, Samurai, Coil, Beacon) and all7 cores (Standard, Time, Riot, Glass, Grav, Magnet, Echo). They replace generic gauges with readable situations: comparative falling, faster/narrower cutting lane, two lost armor plates, one neighbor zap, pre-rush warning, combo breathing room, last-heart reward, genuine recovery-rate comparison, four-kill reactor buildup, fragile double score, gentle aim-line pull, close-cut width and a stationary memory blade. Every showcase uses the **same fitted character** as play. Baselines explicitly have no extra power.
- `ability-showcase.js` reads resolved equipment rules instead of introducing a second balance table. Grav's diagram uses the actual `aimPull()` helper; Time's comparison uses `recoverFocus()`. Figures are slowed, labelled explanatory diagrams, **not a live simulation or claim that a synthetic example has earned a real ability**. Read-only canvas cannot buy/equip or fire; practice is explicit. Pause and reduced-motion result stills remain available.
- Normal head/core browsing opens **See the ability**, rather than hiding the benefit behind assembly/cartridge inspection. Explicit Assembly and `?coreView=` inspection remain unchanged options. Other eye/tail/reactive-shell/world/sensor/attack previews are preserved.
- **All73 items** now have a unique plain-language headline plus **What it does / How to use it / Watch for this** explanation. This text lives in accessible HTML, independent of small canvas labels. The full-details dialog uses the same copy. A replacing-item line identifies the equipped item versus the free try-on. In compact landscape, the stage/controls remain in view and full prose is available through the details button in the Shop pane; taller layouts scroll the explanation normally.
- Player-facing item receipts, shop canvas labels, discovery descriptions and practice paragraphs convert timing to seconds or short phrases. Exact rule units remain internal. Approximate short durations are labelled as such; some game-time windows stretch in slow motion. Numeric practice timing data is **not** changed. The Time core still describes its actual fixed2s recovery bonus; Hypno's hold is0.3s, while its brief effect follows game time.
- `playerCanvas()` is a cached shop-only context adapter: it changes displayed words, never the real context's methods or the live renderer. No global monkey patch in production. Existing shell/tail HUD countdowns now show seconds rather than unexplained integer counters. Notched's wording retains the actual marginal build bonus, including+0% at the shared cap.
- Appearance is explained honestly: Ember's trail does **not** burn, Frost's shards do **not** freeze, Echo Dash's afterimages do **not** repeat hits, and Sniper's current sight does **not** add homing/armor puncture. All existing disadvantages remain explicit (Viper's narrower lane, Crown's8% slower launch, Riot's2 EDGE, Glass's1 health, one-use Iron, no queued full-EDGE payouts).

### Preservation and regression fixes

Genuine pre-edit art/customize/power/CSS snapshots were captured in `.arena/harmony-chunk15/` before any edits. No gameplay source/rule changes or simulation rebaseline were needed. The original40-case combat simulation, previous shell/tail migration expectations and original source diagnostics are retained.

Native core regression surfaced an actual UI bug: pressing Space on a newly read-only, scrollable ability stage could still trigger browser scrolling, making a subsequent touch miss the Assembly button. Read-only Space now prevents default without firing. This is not relaxed input eligibility or a test click bypass. The new suite checks stable scroll position as well as zero sandbox hits. Core-story role expectations were intentionally updated from application→image; explicit practice still must become application and fire normally. Family description expectations now compare the same profiles through the player-language boundary, rather than requiring visible technical units. One Hologram copy assertion now requires the equivalent plain-language list of hazards that still hit normally; all mechanics assertions remain intact.

### Evidence

- `test/shop-ability.test.js`: **11 new tests**: all73 frozen, unique, no-orphan copy records; no technical time units in player readouts; legacy timing translation; exact16-item coverage; resolved-rule parity including capped Cyber Ears; shared Grav/Time helper parity; all73 actual canvas text recordings;16 distinct/progressing/reduced-motion-still scenes; explicit unreleased-power exclusions/tradeoffs; ordinary-word ability search; Notched cap wording; save immutability.
- `scripts/shop-ability-browser-qa.mjs`: **64 native cases PASS** (16 items×desktop1280×720, short640×360, touch390×844, reduced-motion touch). Read-only semantics and Space, pause/still images, canvas bounds, readable HTML/full-details/canvas text, separate buy/equip, Oni/Glass challenge locks, exact purchase debit and unchanged presets/discoveries, no page/frame errors. Additional scroll-stability assertion added with the Space fix.
- Full-suite checkpoint: **1254/1254 PASS**,258.4s during concurrent browser QA. Final rerun/build measurements are recorded below when complete.
- Existing native regressions: shop6 layouts with browsing all73 and transaction/search/input checks **PASS**; assembly7 layouts×17 references **PASS**; core7 layouts×7 try-ons plus practice/real recovery/invalid IDs **PASS** after the readonly-Space fix; eyes28 live/shop cases **PASS**; armor8 cases **PASS**; world24 cases **PASS**; family-overlap4 viewports **PASS** with the existing preset-fallback limitation unchanged.
- `scripts/shop-ability-visual-audit.mjs`: all16 study renders visibly replaced; **1260 live hero head/body/core/size cells pixel-identical** to the genuine pre-edit renderer, plus **392 attack-render cells pixel-identical**. The study board intentionally compares old/new renderer with identical current copy/profile input; it is not represented as an old copy snapshot.
- `scripts/shop-ability-ui-audit.mjs`: genuine full-UI/copy comparison from the four captured snapshots, identical initial storage, no purchases or page errors. `.arena/harmony-chunk15/ui-audit/shop-before-after.png` shows the real previous shop beside the new one. Native item screenshots in `.arena/harmony-chunk15/browser/` include every showcase/layout. Visually inspected desktop, portrait-touch and short-landscape Coil, plus the genuine full-shop comparison.

### Remaining scope / rollback

This is a substantial **shop teaching/presentation upgrade**, not16 new powers. C16 puncture, remaining elemental/world mechanics, source-admission transactions and global device/FPS/Poki Inspector qualification are still separate work. No art is allowed to imply those deferred powers exist. Controlled RAF/native browser checks establish correctness/layout, not real-device performance or an uncontrolled playthrough.

Rollback the showcase/copy/adapters/shop CSS/UI/readout changes and matching tests/docs as one chunk. Keep existing powers, source ledgers, IDs, owned items and save schema. No saved-data migration is required. No commit, push or deployment requested.

**Final chunk15 gate:** final `npm test` **1254/1254 PASS**,248.7s; final native ability suite **64/64 PASS**, including the readonly-Space scroll-stability assertion. Standard and Poki builds **PASS**, **1118.36kB raw /413.20kB gzip**, verified one file1092.1KiB. Final genuine UI audit and16-study/1260-hero/392-attack render audit rerun **PASS**. `git diff --check` clean. Dev preview remains on5187; no deployment performed.

## Chunk16 — Sniper precision puncture + thirteen aiming-tool shop lessons

### Delivered mechanics and ownership

- **C16 atomic replacement:** Sniper no longer participates in equipment score perks. An accepted launch snapshots `stroke.power` (the existing authoritative released-vector magnitude), and ≥90% power gives a10% narrower shot plus one extra plate on its first committed direct Crown/Bastion contact. Only that first eligible armor spends it; ordinary victims, protected boss contacts, duplicate contacts and all secondary/source routes leave it alone. No homing or launch-velocity change. A refused launch does not rearm it, and later speed changes cannot create/remove eligibility.
- The extra plate is an additive contribution **after** the original damage result: Drive3→4; ordinary1→2; Crown2→3; banked ordinary2→3, not4. Existing Crown/legacy sword/temporary armor base order, shear/secondary ownership, boss/Monolith rules and once-per-shot target dedup stay unchanged. The new +2 extra-equipment receipt helper records stable requested/applied/cap-limited contributions and consumes eligibility even at no remaining room. At present Sniper is the only new primary-plate contributor routed into that helper; this is not a claim that deferred Foundry/Oni/Glass perks exist.
- `src/primary-contact.js` centralizes the **existing** full geometry order, appending independent shot narrowing. Numerical family/head/core/angle/reach/temporary-width tests prove baseline parity. A tiny off-axis convex sensor is hit by the normal query and missed by the actual narrowed Matter query. No radius-only blast or player-collider change. `run.primaryGeometry()` fixes the previously incomplete/stale first-frame marker fallback; active weapon art receives the same explicit width scale. The run's precision state/receipt/old sweep are cleared on restart.
- This does **not** enable the full B8 positive-width cap/new reach-normalization migration. Existing family reach-width coupling, close-range tolerance and square body-contact behavior remain baseline-owned. Reach/width migration for Katana/Laser/Ink/Comic and the Prism Pointer corridor-envelope replacement are still deferred.

### Delivered shop upgrade

- **13 new cause→use→difference lessons:** Sniper; Field/Prism/Orbit/Crosshair aim marks; four radar tiers; four flight-path tiers. Large current-build sight/mark plus cream comparative panels make the actual effect and tradeoff visible. No new item IDs/prices or balance changes to pointers/sensors.
- Pointer marks use the actual native mark paths. Orbit uses the real recovery helper and shows the marginal gain at the shared cap; Crosshair compares resolved focus cost; Prism retains its current extra cutting time and clearly denies projectile damage. This does not silently ship C42's future envelope power.
- Radar uses the existing `localRadar` projection and a shared `radarRange` helper also consumed by the live minimap:1/1.35/1.7/2.2. Hazard/warning/heading illustrations appear only at their existing tiers. No radar, camera, attack-range or danger-blocking buff.
- Flight paths use the real `arcPath`/solid clipping and existing24/36/55/95 sample horizons, rather than a hand-drawn arbitrary curve. Time marks/first-wall marker and Oracle speed/angle/travel time are derived from that same example. Gray reference is clearly illustrative and does not extend the usable paid forecast, predict bounces or guarantee a moving-enemy hit.
- Aim-mark browsing now defaults to **See the ability**, matching the other explanatory stories. **Drag Arrow** is still selectable, and Show Practice Controls still explicitly switches to the interactive sandbox. Read-only pointer/keyboard/Space handling and accurate image semantics now include all aiming tools; browsing, pause and still examples cannot grant hits or buy/equip anything. The plain-language73-item guide/detail/search/power receipts and Sniper catalogue/eye study all migrated together.

### Evidence and preservation

- Genuine pre-edit run/art/perk/customize/readout/catalog snapshots captured under `.arena/harmony-chunk16/` before edits. Existing source/shell/tail simulation fixture files are untouched. No blind rebaseline.
- `test/precision-aim.test.js`:13 focused tests for atomic score removal/readouts/search; .899/.9/1 thresholds; full legacy geometry and damage parity matrices; first eligibility/boss/secondary/cap-limited receipts; real-run shot/duplicate/relaunch/Drive/bank behavior;13 frozen helper-derived studies; reduced-motion/state/context/plain-language render contracts; real off-axis convex query; actual core/upgrade echo exclusion; refused launch/later-speed ownership; explicit active weapon width rendering only.
- `scripts/precision-aim-migration-audit.mjs`: **24 genuine before/after controlled cases PASS**, crossing base/Sniper×three powers×normal/Crown×ordinary/Drive. Same launch vectors, boss/second-victim damage; only declared first eligible armor+1, width×.9 and removed full-power score differ. Requires a genuine pre-edit run/art/perk tree; never regenerates expectations from the new implementation. These are controlled contacts, not uncontrolled physics traversal or device performance evidence.
- `scripts/precision-aim-visual-audit.mjs`: **13 changed study renders**, **1260 unchanged live hero cells** and **392 unchanged default attack-render cells**, compared to genuine pre-edit art with identical current profile/copy inputs. Separate active width-scale test covers the intentionally narrower new Sniper weapon. This renderer comparison is not misrepresented as a full historical copy/UI snapshot.
- First full-suite checkpoint: **1266/1266 PASS,176.2s** before the final active-weapon test/reset declaration. First new native suite: **52/52 PASS** (13×desktop1280×720/short640×360/touch390×844/reduced-touch), including free read-only scenes, pause/stills, no technical time words, canvas bounds, stable Space scroll, exact separate buy/equip debit, unchanged presets/discoveries and no page/frame errors. A final rerun also exercises explicit practice and the retained Drag Arrow mode.
- Existing native regressions: shop **6 layouts/all73 items PASS**; eyes **28 cases PASS** with the real Blaze/Hypno/Visor/Glitch integrations unchanged. Full suite retains the original40 simulation baselines and declared previous shell/tail migration expectations. No data/save/ownership/wallet schema change.
- Visually inspected actual desktop Sniper/Oracle Radar, portrait Oracle/Prism Pointer and short-landscape Orbit screenshots. Both build modes pass; final measurements below after final gates.

### Remaining work / rollback

C42 information envelope, the full B8 redesigned geometry solver, Oni/Glass/Ink/elemental/world replacements and remaining primary source-admission work are not claimed complete. No new sound/particle system, paid predictive ricochet, global balance qualification, device FPS test or Poki Inspector certification. Controlled RAF browser checks establish native UI/layout correctness, not real device speed.

Rollback the precision helper/run/first-frame/weapon-scale changes with the Sniper perk, catalogue, language/readout and associated expectation migrations as a single unit. The13 study payloads/renderer/customize defaults can be rolled back together without touching purchases or saves. No commit/push/deployment requested; preview remains on5187.

**Final chunk16 gate:** final `npm test` **1267/1267 PASS**,250.3s; final native aiming suite **52/52 PASS**, now also exercising explicit sandbox practice, reset back to read-only, preserved storage, and retained static Drag Arrow for all aim marks across the four layouts. Final genuine renderer audit **13 replaced studies /1260 unchanged live hero cells /392 unchanged default attack cells PASS**; genuine24-case mechanics migration audit **PASS**. Standard and Poki single-file builds **PASS**, **1128.01kB raw /416.61kB gzip**, verified1101.6KiB. `git diff --check` clean. No commit, push or deployment performed.

## Chunk17 — Ink Brush Cutter and eight dash-ability lessons

### Mechanics delivered / deliberate migration

- **C60 power replacement:** Ink Dash loses its old+1 perk blade step and gains **up to12% primary corridor width**. The authoritative perk/catalogue/rules/readout/search/guide change together. No extra launch speed, reach, gravity, player collider, persistent ink hazard or same-shot repeat hit. The existing shot/target and source ledgers still own damage. Ink's actual wake now uses a broad nib/three dry bristle gaps; active weapon width receives the earned far-band gain, alongside Sniper's independent narrowing.
- `src/primary-width.js` resolves **positive width before negatives**, separately for far and near bands, with stable head→core→Dash→Slash requested/applied/cap-limited receipts. Positive width caps at1.35; Viper.85 and eligible Sniper.9 apply afterwards; family width/reach and temporary width retain their existing categories and apply once. Current migrated positive contributors are eligible Samurai, near-band Magnet and Ink; no unshipped Comic/Katana/Laser powers are invented.
- **Explicit legacy exception changed:** near-horizontal **Samurai+Magnet** used to multiply1.2×1.2=1.44. It now caps at1.35, even without Ink. This prevents equipping Ink from paradoxically reducing an otherwise uncapped old combination. Without Ink, this is the **only** changed width combination. With both parts, Ink adds12% farther out (1.2→1.344) and **0%** in the already capped near band (1.35→1.35). The prior chunk16 legacy-geometry test now explicitly asserts this one declared migration; it does not rebaseline other families or the original simulation fixtures.
- Close width gain and close distance are now separate optional sweep inputs. The legacy near-band radius (100×original `rules.closeWidth`, including120 for Magnet) stays unchanged even when the width ratio is limited. The real sweep, published geometry and first-frame fallback use the same resolved inputs. Default `sweepBlade`/`sweepGeometry` signatures remain compatible. No global new-reach normalization, radial blast, wall clipping policy change or body-contact rewrite.
- Ink power details and its lesson show the current build's actual far/near marginal gain. Magnet's existing showcase now uses the resolved close multiplier; Samurai/Magnet labels mention the shared limit rather than promising an uncapped+20% in every combination. Ordinary narrowing cannot be canceled by the cap.

### Shop delivered

- **Eight new dash lessons** use the production dash sample on the left and readable, rule-derived comparative diagrams on the right: Adaptive's complete free baseline; Ink lane width; Ember's existing cutting time; Volt's conditional speed score; Frost aim cost; Tide passive recovery; Void armored-kill score; Echo combo grace. Shared resource/score/time caps show actual marginal values, including zero. Tide uses `recoverFocus`, and score examples use `perkScoreMultiplier`; this is presentation, not a second combat simulator.
- **See the ability** is now the normal Dash FX entry point, with image/read-only semantics, paused/reduced-motion stills and no hidden Space/touch fire. The separate Elemental Dash study and explicit **Show Practice Controls** remain available. All73-item plain-language guides/power sheets/search, purchases, prices, equipped ownership, save version, discoveries and presets remain intact.
- Fire does **not** burn; ice does **not** freeze; Volt does **not** relay; Void does **not** pull or remove extra plates; Echo afterimages do **not** repeat attacks. Their planned replacements remain deferred. Adaptive still uses its prior build-selected visual material and gains no elemental power; C59's neutral-only visual redesign is not claimed complete.
- Real portrait screenshots exposed a squeezed duplicate title above the already titled study canvas. Read-only ability views now hide that redundant heading, rather than showing a clipped white sliver. Practice and non-ability views keep their own headings. Final portrait/short/desktop screenshots visually inspected.

### Evidence

- Genuine pre-edit source tree/art/perk/rules/readout/UI/helper snapshots captured in `.arena/harmony-chunk17/` before changes; no newly generated expected simulation baselines. Audit tools require the genuine source/art snapshots rather than synthesizing a before from the completed code.
- `test/dash-brush.test.js`: **11 new tests PASS**: atomic duration→width replacement; plain/readout/search/marginal receipts; cap/order/narrowing/family/reach/temporary-width matrix; left/right/25°/steep and no-negative-equipping coverage; actual convex off-axis queries at horizontal/diagonal/vertical; actual launch/collider/window/width/no persistent damage; a real near/far cap sliver while preserving120 distance;8 helper-derived studies and resource/score caps;8 distinct/progressing/reduced-motion-still/context-safe renders; saved prices/version/presets; honest capped Magnet illustration; actual42/120/180-speed rail traversal with identical body collision/rebound.
- `scripts/dash-brush-migration-audit.mjs`: **48 genuine before/after controlled cases PASS**: Auto/Ink×none/Samurai/Viper×standard/Magnet×horizontal/vertical×Ninja/Sniper. Only declared Ink width/removal of its old blade time and Samurai+Magnet near cap differ. Launch vectors, physical vertices, first-frame/actual reach, existing direct armor damage and near distance match. These are controlled launch/query/contact cases, not an uncontrolled playthrough.
- `scripts/dash-brush-visual-audit.mjs`: **8 visibly replaced studies**, **1260 unchanged hero cells**, **343 unchanged non-Ink attack cells** and **49 intentionally changed Ink cells**, compared to the genuine pre-edit renderer with identical current copy/profile inputs. This is not represented as an old HTML/copy screenshot. Broader legacy render tests remain in the full suite.
- `scripts/dash-brush-browser-qa.mjs`: final **32/32 native cases PASS** (8×1280×720 desktop,640×360 short,390×844 touch and reduced-touch). Plain HTML/full-details/canvas words, visible canvas bounds, pause/still pixels, read-only Space/scroll and zero hits, explicit practice/reset, separate exact purchase/equip debit, preserved presets/discoveries and no page/frame errors.
- Existing native shop regression **6 layouts/all73 items PASS**; targeted core regression **390×844 touch + reduced touch,7 cores each PASS**. The core script's generic console message says7 layouts, but this run intentionally used `QA_WIDTH=390`; its results contain exactly2 layout records. It still checks mechanism/assembly/story/practice roles, real Time recovery and invalid-ID rejection.
- Final **1278/1278 tests PASS,210.3s**. Original40 combat simulation cases plus existing explicit shell/tail migrations/source diagnostics remain intact. Both normal and Poki single-file builds **PASS**, **1135.51kB raw /418.88kB gzip**, verified1108.9KiB. `git diff --check` clean. Preview HTTP200 on5187.

### Remaining / rollback

This ships C60's width mechanic, positive-width composition and explanatory shop block, not the entire B8 redesign: new part reach, Laser/Katana/Comic profiles, narrow near-contact/body policy, Prism Pointer's future envelope, true elemental/world/status/secondary admission work, new sounds and C60's full traveled-stroke/contact/taper choreography remain separate. Existing static collision/query policy is preserved, not newly certified as occlusion-aware. No device FPS benchmark, uncontrolled gameplay balance approval or Poki Inspector certification is claimed.

Rollback Ink perk/rules/catalogue/copy, positive width resolver and sweep close-distance adapter, run/weapon width, affected cap explanations and explicit legacy exception test as one mechanics unit. The8 lessons/read-only Dash default and redundant-title fix can be rolled back independently with their matching tests. No save migration, commit, push or deployment requested.

## Chunk18 — C61 Ember: contact ignition, not a longer blade

### Correlating change

- Replaced Ember's old+2 blade duration with **first direct contact → a surviving victim and up to two nearby targets burn**. Each living eligible target loses exactly one armor/health unit after0.3s and0.6s of world game time. Distance56 is inclusive; closed/grazing static walls block spread through the shared `eyeSight` helper. Bosses, paper and protected tutorial actors are excluded.
- **Tradeoff:** primary width×.90 after the positive1.35 cap, composing independently with Viper and Sniper narrowing. Reach, close-distance threshold, player collider, launch velocity and attack ownership remain unchanged. No extra propulsion or implicit power from a flame-colored core.
- `ember-burn.js` owns a finite target-object ledger: two absolute deadlines, per-launch first-contact admission, nearest-two deterministic selection, local capacity24, no application before a launch. Active burns **neither stack nor refresh**. This is the conservative allowed reapplication policy, stricter than optional bounded refresh. Death/recycled ID/run retirement/dispose/teaching/wave exit clear status. Fractional and skipped world deadlines are paid once, never accelerated by repeated hitstop calls.
- Added an explicit `ember-burn` diagnostic source descriptor and a **dedicated secondary damage authority**, rather than reusing the legacy resolver whose secondary kills still grant primary resources. Origin shot/parent and target object are retained across later launches. One unit stays one unit regardless of current Drive, kinetic, armor/execution upgrades or direct-hit dedup state.
- Burn deaths share ordinary removal/stream/kill bookkeeping, score/credit ledger, Fork child creation and Crown repair. They do **not** gain chain/time, EDGE, FOCUS, blade, Drive, momentum/fracture/breath, blade ledger release, Echo/Pulse charge, Coil or recursive ignition. Legacy sources' behavior is unchanged. New `emberIgnite`/`emberHit` events describe actual status/damage; ordinary secondary death carries the existing cut/death presentation payload.

### Appearance and shop proof

- Ember alone replaces the old broad flame ribbons with a brief leading ignition cone and **three** detached launch embers inheriting a fraction of actual launch velocity; at most **two** contact embers. No replenishment or continuous emitter. A tiny steady target seam persists only while the actual burn ledger is active; actual damage contracts it briefly. Reduced motion removes movement but retains the steady status mark. No full-body flame, screen flash or ambient status noise.
- Replaced the generic flame icon with an ignition cone beside a target-attached seam. Catalogue/perk/rules/readouts/search/guide/weapon-width receipts migrate together. Player-facing timing uses seconds and ordinary words, not internal clock units.
- The free Ember lesson now shows **direct armor damage → bounded neighbor spread → real delayed units → death/expiry**, with seconds and the narrower-shot cost. Its local Crown/Fang actors execute the same selection/deadline ledger as play; it is not a parallel damage timer. Blocked/outside/boss actors remain excluded in the lesson data, and the blocker is shown. Explicit practice remains separate; ownership, purchases, presets and save schema are unchanged. Other seven dash lessons remain pixel-identical under identical inputs.

### Evidence and compatibility

- Genuine pre-edit source/art captured at `.arena/harmony-chunk18/{before-src,art-before.js}` before implementation. `.arena` is temporary QA evidence, not a tracked asset or regenerated baseline.
- **11 new focused tests** in `test/ember-burn.test.js`: deadlines/fractions/large jumps/hitstop, nearest-two/sight/range/dead victim, cap/reapplication/recycled target ID, boss/teaching/secondary exclusions, actual direct+delayed damage, resource-isolated kills/credits, source-parent/shot observation parity, reduced-motion/render state and local lesson behavior. Existing replaced-duration/no-burn expectations migrated narrowly; original simulation fixtures untouched.
- `scripts/ember-burn-migration-audit.mjs`: **72 genuine before/after cases**, three dashes × three heads × two cores × two bearings × two eyes. Only Ember loses the old2 blade units and narrows10%; same direct damage, reach, close distance, body vertices and launch velocity. No blind baseline update.
- `scripts/ember-burn-visual-audit.mjs`: Ember lesson replaced; **7 other dash lessons,1260 hero cells and343 unrelated attack cells pixel-identical;49 Ember attack cells intentionally changed**. Same current copy/profile inputs against the genuine old renderer; not a claim of unchanged whole-game pixels.
- **32 native dash/layout cases**, ordinary and reduced-motion portrait/landscape/desktop, practice/reset, pause/stills, read-only input, plain-language canvas/guide, purchases and save boundaries. Screenshot `.arena/harmony-chunk18/browser/dash-fire-390x844.png` inspected for readable portrait layout.
- `scripts/ember-burn-live-browser-qa.mjs`: **4 native real-run/render sequences**, two viewport sizes × motion settings. Crown takes its direct hit then two real delayed units; eligible neighbor dies once; boss health does not change from fire; status expires. Controlled contacts/time advancement, not an uncontrolled traversal or FPS benchmark. Stage screenshots/results in `.arena/harmony-chunk18/live-browser`.
- Existing shop regression: **6 layouts/all73 items**; targeted core regression: **2 portrait/motion layouts×7 cores** (generic runner console says7 layouts; filtered result is2). No page/frame errors.

### Scope / rollback

C61 only; Frost/Volt/Tide/Void/Echo-dash migrations, global source transaction policy, B8 geometry, general status framework, broad material choreography and actual-device performance/Poki Inspector qualification remain deferred. Revert only chunk18's Ember rules/status/secondary path/art/icon/lesson/receipt/targeted tests to restore the previous behavior; preserve chunks1–17 and original baseline fixtures. No commit, push or deployment requested.

### Final chunk18 gate

**1289/1289 tests PASS** (171754ms), **32/32 native shop cases PASS**, **4/4 native live-render sequences PASS**, **72/72 genuine mechanics comparisons PASS**, visual matrices PASS, existing shop6/all73 and core2×7 PASS. Normal and Poki builds PASS:1144.23kB raw,421.76/421.75kB gzip; single-file check1117.4KiB. Final logs: `.arena/harmony-chunk18/{full-tests-final,browser-final,build-final,build-poki-final,migration-final,visual-final}.log`. Portrait final lesson and unobscured native live-status stage screenshots inspected. The first post-documentation full run caught audit-label formatting (`Works`/`Harmony`), not a gameplay failure; headings were corrected and the entire suite rerun green. `git diff --check` clean; preview5187 responds HTTP200. No original fixture overwrite, commit, push or deployment.

## Chunk19 — C63 Frost: real motion control, matched animation, an AI-backed shop lesson

### One complete status/visual/lesson chunk

**Appearance → power:** Frost's forward facets now mean an actual opening in enemy movement. On the first eligible direct contact per accepted launch, chill the surviving victim plus **at most one** nearest eligible nonboss neighbor within60 and closed-segment static sight. A killed primary victim may still supply the spread origin. **Fangs** (including small fragments) stop locomotion, own attack countdown/initiation/rush/recovery/cooldown and pose progression for18 world-time units. **Other ordinary nonboss bodies** move at70% for24; attack countdowns, emissions, rotation and non-locomotion attacks remain active. Bosses and pinned/paper/protected teaching actors resist. No damage is added.

**Replacement/cost:** the old8% aim-cost discount is gone atomically from rules, perks, catalogue, guides, search, power readouts and the obsolete lesson. Aiming now uses the otherwise-resolved normal cost. Visor/Pointer discounts remain additive and capped as before; no stealth speed, width, blade duration, health, collider, score or armor-damage change. Player physics and attack ownership remain unchanged. Other7 dash powers/lessons, including Ember's finite burns, are protected.

### Authority and safety

- New `frost-control.js` owns admission, target-object/generation identity, finite active/recovery state and absolute deadlines. One launch cannot chill two groups; secondaries cannot chill. Active cold never refreshes/stacks, and a new launch cannot bypass immunity. Actual thaw starts90 world-time units of resistance, not90 from acceptance. A late clock observation does not extend the immunity deadline.
- **32 local tracked targets maximum, including immunity**; dead/removed/recycled/ineligible actors release their state. Death/end/reset/retire/dispose/teaching/wave transitions clear without a fake thaw or delayed payout. Capacity is a safety bound, not a promise of32 simultaneous targets.
- `coldTiming` integrates the active portion of the **actual world interval**. A fractional step crossing thaw resumes only the unfrozen fraction. Local locomotion constraints compose by strongest choice, not multiplying slow factors. `combat.move(0)` and invalid/nonpositive intervals are true no-ops, not NaN velocity producers.
- Physics still publishes the same world interval once. Frozen Fang AI holds while hazards update on their existing independent path: already-fired needles, expanding rings, active zones and Prism links are not retroactively frozen/deleted by cold. Frozen **rushing-body collision still hurts**; this is motion control, not invulnerability. Ordinary kill/removal behavior is unchanged, including the existing rule that hazards leave with their source on death.
- Grav's external aim displacement obeys the same zero-motion cold constraint for a frozen small Fang; it cannot visually slide a frozen body. Hypno remains initiation-only and resumes its own rule after thaw. Time is **currently focus recovery, not a local enemy slow**; tests protect its existing rule and common world clock rather than claiming an unimplemented Time power. Cold math exposes a strongest-choice movement limit for overlap without inventing another live status source.
- New `frostContact` and `frostThaw` events describe actual admissions/thaws and source shot. No new damage route, recursive proc, Echo/Pulse charge or primary-resource award. Optional combat observation is passive and produces the same gameplay/events with or without diagnostics. Legacy damage routes/flags are unchanged.

### Animation follows the real power

- **Launch:** a compact leading facet and two finite trailing shell facets, using actual launch bearing and the bounded launch age. No six-diamond spray, ice projectile, permanent emitter or conversion of a warm core into an ice gun.
- **Contact:** three bounded chips only on actual admission. Frozen Fangs retain a closed, shape-coded stop-collar and a stable real pose; slowed heavy bodies use open drag brackets and keep their attack mechanisms/warnings running. Tiny **FROZEN / SLOWED** labels are attached to active status, not an invented renderer timer. Label placement avoids the common Fang-above-armor overlap.
- **Thaw:** the rim breaks only on real expiry into two short pieces; the quiet broken notch then denotes the remaining cold-resistance window. Reduced motion retains static active/recovery geometry without launch/contact movement. No hue-only safety claim or heavy-attack suppression.
- Radar blips carry real cold state and gain distinct stop-box/drag-notch shapes without recoloring enemies safe. Frozen wind-up intent reads **FROZEN** and holds the same progress; heavy windups remain windups; hazard/edge warnings remain separate. The existing general intent helper is not a new global HUD mode—the live cold labels/radar integration are local to affected targets.
- New icon: leading facet beside a stop-collar, not a Time clock. No other item icon changed.

### Shop: real with/without enemy behavior

`frost-study.js` builds **two isolated production `createCombat.move/attacks` tracks once**, then caches immutable half-step samples. It uses the actual admission/deadline ledger on local armor/Fang actors, with blocked/far/boss exclusions and an already-fired needle. It never steps a live run, consumes live RNG, equips anything, earns credits or writes saves. It is a controlled illustration of real AI, not an uncontrolled mini-game or performance benchmark.

The enlarged **See the ability** sequence shows:
1. Direct contact into a group.
2. A Fang's real countdown held at0.50s while the baseline continues; heavy travel compared against its unchilled counterpart.
3. Real thaw, resumed countdown/movement and the separate1.5s cold-resistance window.
4. An already-fired shot continuing; explicit wall/boss/heavy-attack/rushing-body limits and the removed aim discount.

Actual seconds are used throughout player-facing text. Arrow/dash/practice choices, default read-only semantics, purchase/equip separation, catalogue IDs/prices, ownership, discoveries, presets and version1 saves remain intact. Portrait guidance remains scrollable; short landscape uses the existing compact/full-details layout.

### Proof / explicit migration

- Genuine pre-edit source/art snapshots at `.arena/harmony-chunk19/{before-src,art-before.js}` and byte-for-byte copies of all3 original simulation baseline files captured **before any C63 edits**. Original fixtures remain byte-identical; no baseline regeneration.
- **29 new tests** in `test/frost-control.test.js`: first-contact/secondary/sight/range/boss protections, dead primary spread, deterministic nearest choice, finite active+immune capacity, no refresh, exact/fractional/skipped deadlines, recycled ID/death/cleanup, all Fang AI phases, all7 non-Fang locomotion/tell behaviors, emitted needle/ring/zone progression, Hypno/Grav/Time composition, real resource/damage/source-observation parity, actual frozen-rush collision damage, radar/intent truth, bounded/restored-context rendering and cached read-only lesson/save/reduced-motion guarantees.
- Intentional old expectations migrated narrowly: Frost's8% aim discount and “does not freeze” language/search exclusion. Global part caps and all other perks are unchanged.
- `scripts/frost-control-migration-audit.mjs`: **144 genuine pre/post launch/width/collider/direct-damage/focus cases** including Time/Grav, Pointer, Ember and three head profiles across two bearings; only the declared Frost discount removal changes those measurements. Plus **28 actual admitted-contact/AI comparisons** (all7 cores×4 bearings): first heavy displacement70%, Fang countdown paused18 then resumes, same direct damage. These are controlled comparisons, not replacement simulation baselines.
- `scripts/frost-control-visual-audit.mjs`: Frost lesson replaced; **7 other dash lessons,1260 hero cells and343 non-Frost attack cells pixel-identical;49 Frost attack cells intentionally changed**. Identical current copy/profile inputs against genuine pre-edit artwork, not a claim of unchanged whole-game screenshots.
- **32 native dash/shop cases** across desktop/short-landscape/portrait/reduced motion, practice/reset, pause/stills, plain-language canvas/guide, read-only input and transaction/save boundaries. Portrait and desktop Frost screenshots inspected.
- `scripts/frost-control-live-browser-qa.mjs`: **16 native real-run/AI/render sequences**, Standard/Time/Grav/Riot×two sizes×two motion settings, with true admission, real AI movement/countdowns, independent dangerous shot, immune boss, heavy/frozen/resistant state expiry and no extra health damage. Controlled contact/world progression; not an actual-device FPS/tunneling qualification. Stage screenshots inspected; a first audit scene placed its neighbor inside a differently oriented primary sweep, so the scenario coordinates were corrected—not the gameplay expectations or original fixtures.
- Existing shop regression: **6 layouts/all73 items**; targeted core: **2 portrait/motion layouts×7 cores** (the generic runner still prints7 layouts; filtered JSON is2). No page/frame errors.

### Boundary / rollback

C63 only. C62 Volt burst/conduction, Tide bank pressure, Void fields, Echo replay, global transaction/status infrastructure, normalized B8 geometry and full Spark/Apex choreography remain planned. No new sound asset, forced quest/chooser/tutorial wiring, camera behavior or saved-data field. Actual-device performance, accessibility hardware and Poki Inspector remain unqualified. Revert the C63 cold ledger/AI hooks/Grav constraint/art/status/icon/lesson/receipts/tests as one unit to roll back; preserve chunks1–18 and original fixtures. No commit/push/deployment requested.

### Final chunk19 gate

**1318/1318 tests PASS** (233632ms), **32/32 native dash/shop cases PASS**, **16/16 native real-run/AI/render sequences PASS**, **144+28=172 genuine pre/post mechanics comparisons PASS**, and declared visual matrices PASS. Existing shop6/all73 and core2×7 regressions PASS. Both single-file build modes PASS:1156.05kB raw/426.47kB gzip, verified1129.0KiB. Logs: `.arena/harmony-chunk19/{full-tests-final,browser-final,live-browser-final,build-final,build-poki-final,migration-final,visual-final}.log`. Final portrait lesson and Riot live frozen/slowed labels inspected; no label-over-armor overlap. All3 original simulation fixture files compare byte-identically with the genuine pre19 copies. `git diff --check` clean; preview5187 HTTP200. No commit, push, deployment or saved-data migration.

## Chunk20 — C65 Void: a visible force field with a smaller real strike core

### Complete item replacement

Void now means **first eligible direct hit → one stationary Collapse Well**, not an armored-kill score tint. A killed primary victim can still supply the real hit origin. Up to3 nearest **movable, living nonboss** targets within110 and closed-segment static sight are selected once, with deterministic distance/ID ordering. Pinned/paper/protected teaching actors and bosses are excluded. New arrivals or replacement objects reusing an ID cannot inherit admission. An empty field is valid but invents no victims.

The field lasts18 world-time units. Each selected target receives at most32 total displacement from this source, spread across the live interval, not an instantaneous teleport. Existing AI movement/tells/emissions continue, so targets can escape. At expiry, only selected survivors actually inside the **28-unit core** with static sight take exactly **one secondary armor/health unit**. The outer110 ring **never deals damage**. No boss shortcut, homing player attack, projectile absorption or protection.

**One live field**: later contacts cannot evict, refresh or move an accepted field. Source cooldown36 begins at admission; the first eligible contact of a new launch during busy/cooldown consumes that launch's attempt without queuing a surprise field later. Clear/cancel/death/retire/dispose/teaching/wave transitions never cash out a pending attack. Aftermath is eight world units of bounded visual decay, not a second hit window.

### Movement, composition and secondary authority

- New `void-well.js`: explicit finite admission, immutable view snapshots, target-object identity, fixed source origin/shot, unspent interval tracking, per-target **actual** displacement accounting, one reentrancy-safe pulse and bounded aftermath/cooldown state.
- Conservative swept body-expanded AABB clipping prevents static-wall tunneling even with a large interval. Arena bounds and ordinary110 post leash apply; an already-rushing body is not snapped back to its post or allowed extra outward leash. A newly introduced blocker stops later pulls; blocked force is not counted as successful movement. Bodies overlapping an expanded solid conservatively refuse force rather than teleporting out.
- Physics invokes force using its real world interval, after ordinary enemy motion. Both entity coordinates and Matter sensor bodies commit the same accepted position. Duplicate/repeated intervals cannot spend twice; fractional/large/zero/invalid intervals and the32 cap are covered. Hitstop cannot advance field life or force.
- Grav's weaker aim pull yields for currently selected/in-range/sight-clear field targets with remaining force budget, preventing an unadvertised second pull. It is not a global Grav balance change. If a cold movement constraint exists on a target, the field honors its resolved scale; Time retains its actual current focus-recovery/world-clock rules.
- Added explicit `void-collapse` secondary context. Ember's established exact-one-unit, resource-isolated path is now named `resolveScheduledUnit` and shared **without changing Ember's contract**. Original damage routes retain their resolver/flags. Source parent and admitted launch survive later shots; target-generation checks happen before effects. Optional tracing remains passive.
- Collapse kills share ordinary removal/stream/kill score/credit bookkeeping, Fork children and Crown repair, **not** primary chain/EDGE/FOCUS/blade/Drive/breath/momentum/fracture/weapon charge/release/Coil/Echo/burn/cold/field procs. No current kinetic/Drive/execution/armor multiplier inflates the scheduled unit.
- Removed Void's old12% armored-kill score perk atomically from rules/perks/catalogue/readouts/search/guide/lesson. Shared score cap and other parts' rewards remain unchanged; no hidden speed/width/reach/health/collider/aim-cost/duration change. IDs, price350, save version1, ownership, presets and transaction boundaries remain intact.

### Visual construction follows actual mechanics

1. **Launch:** compact dark/pale keylined crescent and short finite trailing seams. No black hole following the player or three decorative orbital rings.
2. **Pull:** the transparent broken outer boundary stays at the real110 radius and fixed hit position. At most3 inward flecks appear only for actually moved admitted targets. The much smaller solid28 core and its countdown seam show the impending strike, not another large-area hazard.
3. **Layering:** outer boundary and force cues sit behind enemy artwork; the core is keylined over large silhouettes so armor cannot hide its extent. Actual hostile projectiles/zones still paint above both. Field boundaries never replace ordinary enemy warnings or make a rushed body safe.
4. **Collapse:** one compact pulse entirely within the small core, while the outer boundary fades without sweeping inward as fake damage. No opaque screen fill, tunnel, fog, camera shake addition, particle emitter or lingering damaging seam. Reduced motion keeps static meaningful geometry and suppresses launch motion.
5. **Readiness:** three small aim-only source-terminal bars reflect the real36-unit recharge; they are not a surrounding shield. A new large-open-ring/small-core icon carries the same distinction. Other item icons and generic family Void art are unchanged.

### Enlarged shop proof

The free **See the ability** scene now has a large fixed-origin cutaway and a result/timing receipt instead of the old armor-score diagram. `void-study.js` samples the **production field selection, clipped pull and pulse ledger**, caching immutable local frames rather than running a parallel decorative damage timer. It shows armor surviving, a neighbor moving into the core then dying, an outer neighbor moving but keeping health, a static blocker, an out-of-range target and a resistant boss. The field origin does not follow the shop hero. Real0.3s/0.6s timings and ordinary player-language limits are shown. No live run/ownership/save state is used. Explicit practice remains separate.

### Genuine proof and protected behavior

- Pre-edit source/art and all3 original simulation baseline copies captured at `.arena/harmony-chunk20/{before-src,art-before.js,*simulation-baseline.json}` before C65 changes. Original fixture bytes remain identical; no baseline regeneration.
- **28 new tests** in `test/void-well.test.js`: atomic perk replacement, first-contact/no-launch/secondary/protected cases, nearest-three/inclusive range/sight/dead-primary/empty-field cases, one-live-field/no refresh/cooldown/reentrancy, fractional/skipped/zero intervals, exact expiry/core-only hit, moved-out/late/recycled targets, swept solids/arena/post leash/force accounting, actual run/bodies/Grav/Time composition, source observation/launch identity, resource-isolated kills/Fork/Crown aftermath, hitstop/cancel/cleanup, shop save/stillness, finite directional launch, core paint radius and state-safe readiness/field drawing.
- Existing targeted Ember/Frost/source/dash/perk tests stay green; only declared Void score expectations and the exact source-context/caller table are migrated. No original simulation expectations are replaced.
- `scripts/void-well-migration-audit.mjs`: **192 genuine pre/post launch/collider/direct-damage/width/reach/focus cases** across Adaptive/Ember/Frost/Void, three heads, four cores, two bearings, two eyes; **28 real-contact/physics field comparisons** across all7 cores×4 bearings; **48 explicit capped armored-score migrations**. Total268 controlled before/after cases, not an uncontrolled playthrough or baseline replacement.
- `scripts/void-well-visual-audit.mjs`: Void lesson replaced; **7 other dash lessons,1260 hero cells and343 non-Void attack cells pixel-identical;49 Void attack cells intentionally changed**. Comparison uses identical current copy/profile inputs against the genuine old renderer, not a whole-game pixel-invariance claim.
- **32 native dash/shop cases** cover desktop/short-landscape/portrait/reduced motion, practice/reset, plain-language text, paused/still read-only examples, purchase/equip separation and saved boundaries.
- `scripts/void-well-live-browser-qa.mjs`: **16 native real-run/physics/render sequences** (Standard/Time/Grav/Riot×two sizes×two motion settings). Planted telling actors isolate field force from ordinary walking; actual run physics advances world time, commits the force, kills only the inner neighbor, leaves outer/boss HP unchanged, advances an emitted needle, collapses once and reaches source readiness. Controlled test scene, not device FPS/tunneling certification.
- Existing shop6 layouts/all73 items and filtered core2 portrait/motion layouts×7 cores pass. The generic core runner still prints7 layouts; filtered JSON is2. No page/frame errors. Portrait/desktop shop and live field screenshots inspected; the first live inspection exposed a core hidden by large armor and led to the explicit two-layer fix.

### Scope and rollback

C65 only. Volt burst/conduction, Tide bank pressure, Echo replay, global admission/status framework, B8 geometry, Void-world recoil sink and full Spark/Apex choreography remain deferred. No new sound asset, forced chooser/quest/tutorial/camera wiring or saved fields. Actual-device FPS/accessibility hardware and Poki Inspector remain unqualified. Roll back C65's field/rule/context/shared-secondary dispatch/art/icon/lesson/receipt/targeted tests as a unit, restoring only the tiny scheduled-authority rename/dispatch extension while preserving Ember/Frost and chunks1–19. No commit/push/deployment requested.

### Final chunk20 gate

**1346/1346 tests PASS** (233874ms); **32/32 native dash/shop cases PASS**; **16/16 native real-run/physics/render sequences PASS**; **192+28+48=268 genuine pre/post mechanics cases PASS**; declared visual matrices PASS. Existing shop6/all73 and core2×7 regressions PASS. Normal/Poki single-file builds PASS:1168.94kB raw,430.89/430.88kB gzip; verified1141.5KiB. Logs: `.arena/harmony-chunk20/{full-tests-final,browser-final,live-browser-final,build-final,build-poki-final,migration-final,visual-final}.log`. Final portrait lesson and native large-armor core-overlay screenshots inspected. All3 original simulation fixtures compare byte-identically to pre20 copies. `git diff --check` clean; preview5187 HTTP200. No commit, push, deployment or saved-data migration.


## Chunk21 — C66 Echo Dash: leave a real cut behind

### One complete item, not a decorative afterimage

**Echo Dash / Reprise Stroke** now records a short path the player actually travels and cuts that old location once after12 world-time units (shown as **0.2s**). The old12-unit combo-grace perk is removed atomically. IDs, price350, ownership, wallet, presets/discoveries and version1 saves are unchanged; other items retain their bonuses and shared caps.

- `reprise-stroke.js` owns one pending reservation, at most140 traveled units and6 path samples, a12-unit-wide convex-body query lane, deterministic path-order selection and at most2 eligible targets taking exactly1 secondary unit each.
- `stepPhysics` offers an opt-in measured-subsegment callback after actual integration/collision/rail resolution. It changes no integration or existing observer behavior. Recording clips at closed, width-expanded static solids and seals at a bank, relaunch or first discontinuous position. Sharp measured bends consume actual vertices; exhausting the six-sample budget seals instead of inventing a shortcut. Ordinary curved flight is sampled, not a precision continuous spline.
- Replay checks the stored segments against current solids again. It never joins to the current player or follows a victim. An empty/missed lane remains a miss. Targets are queried at replay time: a late arrival can be hit; a target beside the relocated player but outside the stored lane is safe. A surviving primary victim can take one additional hit under the distinct `dash-reprise` source.
- **B6 admission is explicit: one pending slot.** Reservation occurs only after a legal launch, before source allocation. Two/three rapid legal launches do not evict or overwrite the admitted attack, allocate another source, or enqueue automatic future attacks. A relaunch seals recording of the original path, but its promised replay finishes. Another launch can admit once the pending source has fired. Visual expiration cannot delete promised gameplay.
- Bosses take exactly one chip only during their active fight; breach/entry/return do not pay out. Current lens/Drive/kinetic/execution/equipment damage cannot inflate it. Boss defeat reuses ordinary boss rewards once. Nonboss paper, pinned and protected teaching actors are excluded.
- Replay shares the established exact-unit secondary resolver with Ember/Void, not the legacy primary resolver. Ordinary removal, score/credits, Fork children and Crown repair still happen; chain, EDGE/FOCUS/blade/Drive, weapon charge, Coil, burn/cold/well and replay recursion do not. Optional tracing preserves the original source/launch parent across later shots without changing outcomes.
- Hitstop freezes recording and the deadline. Death, clear, retire, dispose, teaching/practice and wave exit cancel without an early payout. Active Monolith combat specifically preserves the pending reservation; a live test caught the old all-noncombat cleanup and that boundary was corrected without enabling unrelated Ember/Void/sword behavior in boss phases.

### Substantial matching visual rebuild

1. A compact pale source-offset bracket replaces the geometric clone wake. No opaque hero duplicates, rewind pose or extra fake blade.
2. The actual old-world polyline becomes one thin outlined pending lane. A source delay notch fills from the actual deadline. It stays where the player traveled, including after the hero moves elsewhere.
3. One bright keylined cutting plane uses those same stored endpoints and width. Actual-victim cross seams supply hit feedback, including on surviving armor. The replay renders above bodies but below hostile hazard artwork.
4. Three world units of replay are followed by at most two harmless fading notches for three more units. These fragments have no hit authority. Reduced motion removes launch movement but keeps truthful static pending/replay boundaries.
5. An aim-only open/occupied terminal reports the real pending slot. The new item icon separates a solid stroke, an outlined stored stroke and a delay notch.
6. Stationary Core Echo and independently owned sword echo artwork/attacks are not repurposed or recolored into this source. No new global palette, hero construction, audio asset or camera change.

### A much larger free shop demonstration

`reprise-study.js` caches isolated immutable samples from the **production reservation/recording/convex-query/replay ledger**. It never runs a second decorative damage formula, accesses a live run or changes saves. The enlarged path panel and separate health/result receipt cycle through:

- travel → old-path waiting outline → one bright replay;
- a surviving victim hit again and an enemy arriving after recording taking its one actual hit;
- an off-path enemy near the current hero keeping its health;
- a genuine late-target miss and a wall-clipped path leaving the far enemy safe;
- a second legal launch being rejected by the busy slot without losing the original cut or creating a queue.

Timeline, health receipts, safe space and a dash/core/sword source comparison accompany the picture. Plain player language uses seconds, not internal clock terminology. Read-only/pause/still semantics, explicit practice and purchase/equip separation remain intact. A final visual pass separated the safe enemy from the hero so their silhouettes do not hide the evidence.

### Proof and final gate

- Genuine pre-edit source/art and copies of all3 original simulation baselines were captured at `.arena/harmony-chunk21/{before-src,art-before.js,*simulation-baseline.json}` before production edits. No original fixture is regenerated or overwritten.
- **26 new focused tests** cover the atomic perk/rule replacement,140/6 limits, measured corners and bank stopping, exact/fractional/skipped deadlines, misses/late arrivals/current-player safety, convex width and path-order/dedup/cap, static/new blockers, discontinuities, two/three-launch saturation, copied immutable buffers, target identity, explicit boss phases/exact damage/normal defeat reward, actual run physics/hitstop/cleanup/resource isolation, observational parity and state-safe/reduced-motion art/lesson behavior.
- `scripts/reprise-stroke-migration-audit.mjs`: **384 genuine pre/post protected launch/collider/direct-damage/width/reach/focus cases** across all8 dashes,3 heads,4 cores,2 bearings,2 eye profiles; **27 capped grace migrations**; **28 actual-physics replay comparisons** across all7 cores/four bearings. Only declared grace/replay behavior changes: **439 comparisons PASS**.
- `scripts/reprise-stroke-visual-audit.mjs`: Echo lesson replaced; **7 other dash lessons,1260 hero cells and343 unrelated attack cells pixel-identical;49 Echo attack cells deliberately changed**. Uses the genuine pre-edit art module with identical current copy/profile inputs, not a claim of whole-game screenshot invariance.
- **32 native dash/shop cases PASS**, plus4 final Echo cases after the silhouette polish: desktop, short landscape, portrait and reduced motion; readonly keyboard input, pause/stills, explicit practice/reset, buy/equip and saved transaction boundaries. Final portrait lesson inspected.
- `scripts/reprise-stroke-live-browser-qa.mjs`: **16 native real-run/physics/render sequences PASS**, Standard/Time/Echo/Grav × two sizes × two motion modes. Real traveled path, two busy launches, delayed arrival, surviving armor chip, off-path safety, advancing hostile shot, one replay and bounded dissolve. Native portrait replay/desktop pending screenshots inspected. Actor positions are controlled; this is not actual-device FPS or uncontrolled-playthrough certification.
- Existing shop **6 layouts/all73 items PASS**; filtered core regression **2 portrait/motion layouts×7 cores PASS** (the generic runner still prints7 layouts; results contain2). No page/frame errors.
- Normal/Poki single-file builds PASS:1182.63kB raw,436.21kB gzip in both modes; verified1154.9KiB. Final full-suite result is recorded below.

### Scope / rollback

C66 only. Volt/C62 conduction, Tide bank pressure, global S2b admission/status redesign, B8 geometry, Void-world recoil sink and full Spark/Apex choreography remain planned. The new observer is opt-in and the new reservation is local, not completion of those global systems. Roll back C66's ledger/physics observer/run dispatch+boss-cleanup boundary/perk/copy/art/icon/lesson/tests as one coherent unit; preserve chunks1–20, the established boss reward behavior and all original fixtures. No commit, push, deployment or save migration requested for this chunk.


### Final chunk21 gate

**1372/1372 full-suite tests PASS** (241225ms), with **48/48 targeted tests PASS** after the final translucent-plane/surviving-body readability polish. **32/32 native dash/shop cases PASS** plus **4/4 final Echo cases PASS**; **16/16 final native real-run/physics/render sequences PASS**; **439 genuine pre/post mechanics comparisons PASS**; final protected visual matrices PASS. Shop6/all73/core2×7 regressions PASS. Both final single-file builds PASS:1182.63kB raw/436.21kB gzip/1154.9KiB verified. Logs: `.arena/harmony-chunk21/{full-tests-final,polish-tests,browser,echo-final,live-browser-final,migration-final,visual-final,shop-regression,core-regression,build-final,build-poki-final}.log`. Portrait pending/replay shop and desktop/portrait live screenshots inspected; the final plane uses translucent fill and keylined edges so surviving armor remains visible. All3 original simulation baselines compare byte-identically to genuine pre21 copies. `git diff --check` clean; preview5187 HTTP200. No commit, push, deployment or saved-data migration.


## Chunk22 — C62 Volt Dash / Arc Lance

### Execution plan — completed

1. Replace the old speed-score perk with a brief ordinary-launch burst and a real narrower cutting lane; retain saved identities and unrelated loadout modifiers.
2. Give the first eligible direct contact one finite sight-checked arc; combine Coil through one distinct-target reservation rather than adding duplicate relay calls.
3. Rebuild launch, actual-hit arc, readiness, icon and enlarged shop demonstrations as one visual/power language, with plain player wording.
4. Prove ordinary time-to-position, relaunch/refusal safety, fast bank/Hyper ownership, static-wall sweep, damage/resource isolation, shop transactions and protected art before calling the item complete.

### Movement ownership, not blanket speed scaling

`volt-lance.js` supplies a local burst contribution. After a legal ordinary launch is solved with existing head/tail/shell rules, it adds12% for4 world-time units and removes its **own velocity vector** over the next6. The published ordinary limit uses the loadout's existing ordinary dash-speed multiplier. Zero/invalid launches, Hyper and already-faster-than-ordinary launches do not gain another burst. A legal relaunch subtracts only still-owned excess before solving its next launch, preventing compounding; refused/buffered/invalid releases do not spend it.

The physics ceiling receives a separate finite allowance instead of overwriting stored bank ceiling. The existing integration, gravity, rail solver and high-speed substep/sweep guard remain authoritative. Actual proportional cap reductions scale the owned contribution by the same factor. Gravity stays independent of the original vector. A bank or active static SAT contact transfers ownership immediately, including a thin-wall stop that never reaches the continuous guard's struck event. Hyper entry and unrelated recoil/boost/envelope writers also cancel the removal claim instead of blindly trimming their result later. This deliberately favors preserving externally owned momentum over clawing back an uncertain remainder. No saved velocity/debt field exists.

One measured failure exposed Matter's sensitivity to rewriting an unchanged velocity: doing so each step changed fast trajectories. The implementation now calls the velocity setter only for an actual burst change. A separate thin-solid test exposed SAT contact without a struck event; the opt-in observer now reports that real discontinuity too. This improves Echo's existing stop-at-static-contact observation without changing its power, buffers, artwork or lesson. Nonobserving physics calls are unchanged.

### Finite conduction and exact secondary damage

- First eligible primary contact per launch reserves the attempt before child callbacks; a dead primary victim can still supply its real fixed contact origin. No later-contact retry after a blocked/empty first attempt.
- Volt chooses the nearest living eligible nonboss neighbor within120 and closed-segment static sight, distance/ID tie order. Paper, pinned and protected teaching actors are excluded. Bosses resist this arc.
- With Coil, Volt's choice is reserved first, then Coil may choose one **different** eligible neighbor within160 and sight. There are at most2 relay victims and no double hit on one neighbor. Coil can still reach a160-range victim when Volt has no120-range candidate. Standalone non-Volt Coil keeps its existing resolver and behavior.
- The full source/target set is reserved before callbacks. Target-object identity is rechecked; a recycled ID or target removed by an earlier callback cannot inherit a hit. Immediate conduction has no pending queue or evicted promised attack.
- Explicit `volt-conduction` context shares the established exact-one-unit secondary resolver. Kinetic/Drive/armor/execution do not amplify it. No chain/EDGE/FOCUS/blade/weapon charge/Coil/burn/well/replay recursion; ordinary score/credits/removal and Fork/Crown aftermath remain. Optional tracing retains the admitted primary source parent and changes no outcomes.
- The old10% fast-kill score perk is removed atomically. Primary width multiplies by.85 once after the existing positive-width policy and alongside independent narrowing; reach, collider, blade duration, health and passive resource rules are unchanged.

### Substantial visual / shop delivery

A compact split terminal releases a sharp angular lance. Actual traveled distance reveals at most two separated rear rails; there is no continuous electric curtain or homing bolt. Only accepted conduction paints a short fixed-endpoint network, at most two pins, for6 world units. Its actual victims and source are the ledger's committed receipt, not nearest-target guesses at render time. It sits above enemy bodies and below hostile hazards. Reduced motion keeps a steady truthful hit reference instead of crackle. Aim-only split terminal shows the first-contact opportunity, and the new icon combines terminal/lance/neighbor node.

`volt-study.js` caches immutable isolated samples of the production burst + actual physics solver and production conduction ledger. The enlarged free scene compares measured travel, shows the narrower lane, and cycles through an accepted solo link, a genuine blocked/no-link outcome and a two-distinct-victim Coil pairing. Nearby, blocked, farther Coil-range and out-of-range actors retain actual health receipts. The Coil comparison visibly wears Coil without mutating the equipped profile. No live run, ownership, purchase, discoveries, wallet, presets, RNG or saves are touched. Shop text uses seconds and direct instructions, not internal clock language.

### Evidence / boundaries

- Genuine pre22 source/art snapshots and copies of all3 original simulation fixtures captured before production edits at `.arena/harmony-chunk22/{before-src,art-before.js,*simulation-baseline.json}`. Original fixtures are not regenerated.
- **28 new focused tests**: atomic perk/width replacement; exact hold/removal/fractional/skipped/duplicate intervals; vector/gravity/cap ownership; zero/fast/Hyper/contact/external motion; relaunch/refusal; nearest/inclusive range/sight/ID order; empty attempts; Coil distinct-target cap and longer reach; protected/dead/recycled actors; immutable bounded arc receipts; real run time-to-position, width/collider/reach/window composition, resource/source isolation, normal kill rewards, hitstop/banks/Hyper/lifecycle; production shop/stillness/pure drawing; real thin-wall sweep and killed-primary origin.
- `scripts/volt-lance-migration-audit.mjs`: **384 genuine pre/post launch/collider/direct-damage/width/reach/focus comparisons** across all8 dashes,3 heads,4 cores,2 bearings,2 eye profiles. Only Volt's declared12% launch/15% width costs change. Plus **24 capped speed-score removals** and **56 exact faster-momentum/Hyper trajectory comparisons** (all7 cores/four bearings/two Hyper states): **464 controlled comparisons PASS**.
- `scripts/volt-lance-visual-audit.mjs`: **7 other dash lessons,1260 hero construction cells and343 non-Volt attack cells pixel-identical;49 Volt cells deliberately changed**. Genuine old renderer with identical current profile/copy input, not whole-game pixel invariance.
- **32 native dash/shop cases PASS** across desktop/short-landscape/portrait/reduced motion: actual native controls, readonly input, pause/stills, explicit practice/reset, purchase/equip and save boundaries.
- `scripts/volt-lance-live-browser-qa.mjs`: **16 native real-run/physics/render cases PASS**, solo/Coil × Standard/Time × two sizes × two motion modes: real burst, exact distinct relay hits, safe off-range/boss actors, advancing hostile shot and finite arc. Controlled contact placements isolate the source; browser safe-spawn and incidental primary sweeps were corrected in the test fixture, not by weakening gameplay. These are not actual-device FPS, uncontrolled playthrough or Poki Inspector qualification.
- Portrait reduced-motion Coil lesson, desktop wall/no-link lesson and native portrait conduction screenshots inspected. The shop diagram's health and links remain legible and the actual hero/source are not confused.

**Scope:** C62 complete local item block, not global S2b/B8 completion. Tide bank pressure, normalized global geometry/admission/status work, Void-world recoil sink and full Spark/Apex choreography remain deferred. IDs/price300/version1 saves and all prior chunks remain intact. Roll back the Volt ledger/local allowance/observer metadata/rule/context/conditional Coil branch/art/icon/lesson/receipts/tests together; preserve Echo's accepted-source promise and original fixtures. No commit, push, deployment or saved-data migration requested.

### Final chunk22 gate

**1400/1400 tests PASS** (315641ms), including28 new Volt tests and all prior Echo/Ember/Frost/Void/source/simulation regressions. **32/32 native dash/shop cases PASS** plus **4/4 final Volt cases PASS**; **16/16 final native real-run/physics/render cases PASS**; **464 genuine pre/post mechanics comparisons PASS**; final protected art matrices PASS. Existing shop **6 layouts/all73 items PASS** and filtered core **2 portrait/motion layouts×7 cores PASS** (generic runner prints7; actual filtered result count is2). Both final single-file builds PASS:1195.61kB raw,440.74kB normal/440.73kB Poki gzip; verified1167.6KiB. Logs: `.arena/harmony-chunk22/{full-tests-final,browser,volt-final,live-browser-final,migration-final,visual-final,shop-regression,core-regression,build-final,build-poki-final}.log`. Final portrait Coil lesson and native conduction stages inspected. All3 original simulation fixtures compare byte-identically with genuine pre22 copies; no regeneration. `git diff --check` clean; preview5187 HTTP200. No commit, push, deployment or saved-data migration.

## Presentation continuation — eight head systems and real activation correlation

After the product-first shop pass, C2–C9 now have rebuilt production hardware shared by live play, the shop, detail studies and practice: segmented Halo stabilizers, hinged Cyber Ears, swept Viper fins, asymmetric broken Oni hardware, two Crown armor jaws, a wide Samurai crest, twin wound Coil inductors and a guarded Beacon lamp. Their eight SVG item icons match. Shell-owned sockets and restrained core inlays compose the build without erasing attachment identity.

A frozen read-only head-state view connects existing conditions to local hardware: actual aimed fall, positive chain, accepted launch blade/age, exactly one health, blade opportunity, the existing horizontal-cut window, accepted relay receipts and actual Fang tells. Idle Coil crackle and Beacon's decorative beam are removed. No new damage, armor, secondary source, aim assist, cooldown, collision shape, price, save field or balance change. **C64 Tide bank/pressure replacement and broader pending mechanics remain deferred.** This is an appearance/activation continuation, not completion of those migrations.

**Final checks:** 1433/1433 full tests PASS; 6 new head-system tests; 1120 deliberate head/body/core/scale visual changes, 140 bare-head constructions +392 attack cells +192 non-head default story beats pixel-identical to a genuine pre-edit renderer. Native shop8×3 beats×3 layout/motion settings PASS;16 controlled native real-run renderer cases PASS, including a real Coil relay and truthful reduced-state readout. Prior shop7 layouts/motion +3 Buy/Equip flows +22 shelf views PASS. Build/single-file check1252.1KiB and `git diff --check` PASS. **101 native screenshots and32 explicitly labeled production-art illustrations**, with review and limits in `docs/item-correlation/`. These are scripted checks, not a player-recognition or device-FPS claim. No commit/push or data migration.


## Presentation continuation — airy assembly and item correlation

The next broad visual block simplifies the shared shop/live assembly rather than adding more hardware: all ten shell materials use one contour, broad material planes and a single characteristic gesture. Removed redundant chassis plates, the generic eye mask, extra attachment collars, ornamental family shoulder rigs and decorative routing. Seven real core mechanisms keep their protected internals and real activation receipts inside a flatter material-owned carrier. Eight existing head silhouettes and actual-state cues remain; family weapon identities remain in their weapons. Vent, spring, phase and armor state receipts stay state-owned.

The shop now has warm-paper stages, larger two-column portraits, quieter stock labels, restrained contact shadows and flatter synchronized comparisons. Isolated head/core/eye/tail views show the part next to its fitted character. Near-wordless story beats and free read-only previews remain. Screenshot feedback enlarged phone objects and comparison scenes, restored luminous FX contrast with flat dark display fields, and corrected broad planes erasing shaped-shell contours.

**Final gate:** 1437/1437 full tests PASS (271146.326973ms), four new airy-art tests, final focused51 PASS; single-file build1249.2KiB PASS; 207 native screenshots plus80 explicitly labeled offline art references; genuine saved-source native before/after; two intermediate screenshot rounds plus final contrast/contour refinement; seven shop layout/motion cases,22 shelves and3 separate Buy/Equip flows PASS;16 controlled native live-renderer conditions PASS, including actual Coil relay, read-only draws and truthful reduced state.140 material/core/scale cells deliberately changed;392 slash/dash cells exactly preserved. Gallery1280/390 and diff check PASS. Review, source hashes, compressed genuine baselines, implementation and limits: `docs/airy-review/`.

No damage, balance, source ownership, collision, price, save or attack-art migration. **C64 Tide bank/pressure and other pending mechanical work remain pending.** This is presentation continuation, not completion of those migrations. Scripted screenshot/renderer checks are not recruited-player comprehension or physical-device performance evidence. No commit/push or data migration.


## Presentation continuation — signature particles, core motion and material character

User-requested juice follow-up: all7 catalogue slash styles now have style-owned finite debris and layered edge engraving, including a signature on the actual active sword; all8 dash choices have distinct bounded launch debris alongside the smaller core-owned binding marks. All7 core mechanisms have name-related internal motion while keeping real charge/Drive/pull/recovery/hull/echo authority unchanged. All10 bodies receive material-specific edge detail/planes and selected material animation; the default cloth band gains a pinned-knot, delayed-tip, damped analytical response. No generic eye-mask/chassis cage or unbounded particle system is reintroduced.

Scope is7 slashes +8 dashes +7 cores +10 bodies +default cloth, not a redesign of every sensor/world/wave upgrade. Cosmetics do not change damage, attack-source ownership, collision, targets, charge, timing, price, saves or presets. Actual head/eye/tail cues remain truthful; reduced motion freezes ambient core/cloth motion and disables new debris. **C64 Tide’s mechanical bank/pressure migration remains pending.**

**Final checks:**1442/1442 full tests PASS (266020.465785ms),5 new tests and36 focused PASS;64 native upgrade previews (32 selections×desktop/portrait),16 controlled native live renderer conditions including an admitted Coil relay, and prior7-layout/motion +22-shelf +3 Buy/Equip-flow regression PASS.138 retained JPGs:64 native UI,38 controlled live,32 clearly labeled production-art study captures,4 layout regression frames; a20.8-second production-art WebM and interactive per-item motion review. Build/single-file1255.5KiB and diff check PASS. Review/implementation/validation/genuine compressed before-source: `docs/upgrade-juice/`. Scripted checks, not recruited-player comprehension, normal-play footage or device-FPS certification. No commit/push or data migration.


## Presentation continuation — seventeen-build event harmony

All17 completed recipes now have a frozen build-specific motif and coordinated summon/dash/attack/power/kill choreography layered over the preceding per-item FX. Shared recipe priority matches combat; incomplete/mixed kits get no named-build overlay. Build colors lead and a small core-colored inlay connects the composition. Explicit per-recipe paths distinguish brush paper, segmented wyrm fins, inward crown/star gravity, phase brackets, reaper hooks, sun rays, glacier facets, briar forks, rail channels, pixel crowns, storm forks, falling slag, rewinding traces, paladin plates, glass needles and orbit crescents.

Production triggers use committed dash age/bearing, actual active blade, already-fired secondary powers and existing confirmed-cut snapshots. A renderer-only36-tick arrival clock waits through ready/opening/tutorial, advances only in play and resets per run/changed completed build. It does not modify simulation or expire before play. No unbounded emitters, fake hits, charge, shields or damage. Motion off disables the new transient layers while established truthful cues remain.

**Final gate:**1448/1448 full tests PASS (372368.769686ms),6 new build tests,26 focused PASS; all17×5 event stages geometrically distinct in monochrome;34 controlled native run cases (17×desktop/portrait), accepted dashes, actual admitted kills, matching event snapshots and read-only draws PASS.110 native JPGs +85 labeled production-art study captures and24-second six-build/five-event WebM. Initial canvas-resize blank captures corrected in the harness and paint-checked before final capture; screenshot feedback strengthened scale and all17 material trajectories. Existing shop7 layout/motion cases,22 shelves,3 separate Buy/Equip flows PASS. Build/single-file1261.8KiB and diff check PASS. Review, immutable baseline, implementation and validation: `docs/build-harmony/`.

No gameplay/run module, source ownership, damage, collider, resource, recipe, price, save or preset migration for this continuation. **C64 Tide and deferred mechanics remain pending.** Controlled native cases and art-study footage are not normal-play video, recruited-player comprehension or device-FPS qualification. No commit/push.

## Presentation correction — actual store, all 73 items

The preceding separate studies did not address the user's rejection of the actual Armory. This pass replaces the real shelf and default selected-item rendering path: all 73 catalogue items across 11 slots now have appearance/action/payoff scores, distinct immutable particle silhouettes, matching silhouette-derived FX, and fitted production artwork with slot-specific motion. All visible cards animate without hover/selection, with viewport culling, a 30fps cap, global pause and reduced-motion stills. The selected default is one enlarged dark-field stage rather than the small split story; optional Compare/Practice retain their existing jobs. Shared motion families are deliberately reused; this is not a claim of 219 separately coded animation engines.

**Final gate:** 1453/1453 tests PASS, 0 failures (395837.762558ms); 5 focused tests PASS covering all 219 moving item beats, immutable unique geometry, reduced/manual freeze, seeking and state restoration. Actual Armory UI QA: 219 native selected-canvas crops, 4 mobile layout/motion cases, all visible unhovered cards moving, offscreen culling, all-card pause and no save changes PASS. Existing 7-layout/motion, 22-shelf, 3 Buy→Equip-flow regression PASS with no page errors. Native screenshot inspection includes enlarged phone preview, Oni, core, thrusters with held exhaust, elemental dash, slash, body, radar and world views. Actual store selected-canvas recording: 16.8 seconds, Volt/Halo/Grav. Production/single-file build 1281.7KiB and diff check PASS.

Evidence, per-item score, native captures, validation and genuine compressed pre-pass baseline: `docs/store-performances/`. Tests: `test/store-performances.test.js`; reproducible actual-store QA: `scripts/store-performances-qa.mjs`. Illustrations only; no combat/price/ownership/save migration, no commit/push. **C64 Tide mechanical work remains pending.** Automated coverage is not recruited-player approval or physical-device FPS certification.

## Presentation follow-up — material and elemental polish

Additional actual-store visual upgrades: eight distinct enlarged elemental dash wakes replace the shared green-core-laminated item illustration; moving specular shell finishes, hologram scan lines, warm lava fissures, metal fasteners, core glass highlights and beveled eye mounts add material detail. Soft local lighting and floor glow connect shelves and selected stage; short open trails replace the large surrounding wireframe outlines. Dark mobile purchase styling and subtle selected-card depth keep the scene cohesive. All 73-item three-beat scores and unique particle paths remain; combat effects/authorities are unchanged.

Final evidence: `docs/store-polish/` (actual Armory screenshots, 219 selected-canvas crops, 16.8-second Ember/Tide/Gold-Foil selected-canvas recording, genuine compressed before-renderer, implementation/validation). 28 focused tests PASS; full-suite and final native UI results recorded in `validation.json`. Existing 7-layout/motion, 22-shelf and 3 Buy→Equip-flow regression PASS, no page errors/save changes. Production single-file build 1286.2KiB and diff check PASS. No commit/push. C64 Tide mechanical migration remains pending; illustrations are not gameplay video or physical-device FPS certification.

## Course correction — actual live combat, starter equipment

User rejected further customization-only work. This pass changes the **production arena renderer**: all live player blades, including free Razor/default equipment, now receive a tapered cutting crescent driven by actual swing start and remaining blade life; committed dashes get a stronger directional wake; confirmed kills, armor contacts and player damage have distinct local punctuation; telling/rushing enemies get body-local charging accents. Effects use the real blade/dash clocks and bounded contact receipt list. No purchased item/completed build is required. No new shop work, damage/hitbox/range/cooldown changes, gameplay hit-stop, resources, AI, ownership or save migrations.

Evidence is now **normal main.js Start Run gameplay**: real Puppeteer pointer/Space inputs on desktop and phone, free starter kit, five real kills and twenty accepted launches on each; no phase/health/position/enemy/renderer injection. Tutorial completion is seeded only to reach ordinary play. No page/frame errors or equipment-save changes. Recordings include real arena/HUD, not an alternate canvas or art-study page. Durable clips/screenshots/baseline/method/results: `docs/combat-impact/`. A fresh preview on port 5201 avoids returning to an older preview tab; origin-scoped old preview saves are not deleted.

53 focused tests PASS including 4 new default-kit/expiration/reduced/state-restoration/real-receipt integration tests; full suite and exact results in `docs/combat-impact/validation.json`. Production single-file build1290.2KiB and diff check PASS. No commit/push. C64 Tide mechanics remain pending. Scripted gameplay is not human playtesting or physical-device FPS qualification.

## Live object presentation expansion

Added production arena presentation coverage for the audited 122 records: 73 equipment, 40 owned run cards and 9 enemy species (11 legacy wave buffs overlap the card IDs). Uses individual silhouettes with shared motion families, equipped action fragments, actual-launch world-space echoes, bounded dash wakes, real card-acquisition echoes, confirmed species-shaped contact remains, and six low-opacity world climates. No new damage/ownership/save rules and no claim that an ownership accent is a conditional proc.

Evidence and limitations: `docs/object-overhaul/implementation.md`, `coverage.md`, `validation.json`; ordinary main.js Start Run desktop/portrait WebMs are separate from 122 controlled native run/render catalog fixtures. Full regression 1465/1465 passed; final focused 49/49 passed; single-file build 1302.2 KiB and diff whitespace check passed. Reduced motion clears lingering particles; reset/field transition clears residue. Draws are read-only and capped. Human at-speed recognition and mobile hardware FPS are not certified. No commit/push; C64 Tide mechanical migration remains separate.

## Dash player-perspective visual review and second revision

Reviewed ordinary Start Run canvas recordings and timed launch/recovery/dissipation frames on desktop and portrait; blunt critique and remaining weaknesses in `docs/dash-review/review.md`. Rejected the first new continuous-path version as too wire-like, then added gaps/tapered brush shapes and stronger elemental dissipation morphology. New `createDashWake` follows real accepted launches and measured position samples, splits banks/teleports, caps three strokes × 18 points, never emits on ambient drift, and expires/reduces/resets safely. Production replaces generic dash stamps and lowers duplicate launch-cloud intensity; core/sword/element mechanics stay intact. Short anchored recovery flick is cosmetic, not an assertion of stopped physics or damage.

Final verification: 1472/1472 full tests; 17/17 focused presentation tests; 32 controlled native elemental dash scenarios (8 choices × 2 viewport sizes × 2 motion modes); before/after ordinary Start Run recordings at both sizes with no browser/frame errors. Single-file build 1306.8 KiB; whitespace check passed. Videos, timing receipts and limits under `docs/dash-review/`. Bot play plus visual frame inspection, not human playtesting or mobile FPS certification. No commit/push.

## Elemental dash response stage expansion

Added 530 runtime lines (six replaced), 177 test lines / 17 tests, and extended existing native browser QA. Production renderer now owns a 96-slot deterministic particle pool, seven material motion profiles, launch/contact compositions, normal-aligned bank reactions with contact-plane clipping, confirmed-proc endpoint accents, short measured exhaust admission, portrait/dense budgets, priority/recency selection and read-only display interpolation. No imports/dependencies or gameplay/save/store authority changes.

Truthful-proc rules reject empty Volt links, missed Void collapse and empty Echo hit receipts. Thaw is quiet. Main danger shapes and existing elemental mechanics remain authoritative; new marks are below actors and warnings. Normal Start Run recordings at desktop/portrait remain separate from 32 native fixture scenarios. Details/evidence/limitations: `docs/dash-stage/implementation.md`, `validation.json`, `ordinary/`, `elements/`.

Final: 1489/1489 full tests, 39/39 focused portability/presentation tests, 32 browser fixture scenarios, normal play at both sizes without browser/frame errors, build 1319.8 KiB, diff check passed. Initial full-run portability failure was a comment triggering the existing DOM-global regex; wording corrected without weakening the guard, full suite rerun passed. No commit/push. Human readability and real-device performance remain unverified; C64 Tide mechanical migration is still separate.

## Contrast / chromatic / focus and streak post-processing

Extended the existing three-read, single-pass WebGL pipeline: higher baseline contrast, pixel-bounded peripheral chromatic aberration, slight shared-sample softening, controlled bloom/saturation, focus/release envelopes and live kill-chain grading with finite milestones. Added sharp local focus brackets and true-chain movement accents in the art engine, and reduced the old held-focus dark wash. Actor/aim spatial masks and danger/bright-pixel heuristics protect clarity. DOM HUD remains outside the pass; canvas minimap remains scene-graded.

Existing Auto/On/Off, low-memory fallback, context-failure fallback, reset/field cleanup and legacy impact gates preserved. Reduced motion removes new fringe/blur/grain/pulses. Lens reads/draws do not age state; no mechanics or saves changed. `docs/combat-lens/` holds implementation, full-resolution GPU matrix, ordinary main.js focus inputs/screenshots/postfx-canvas recordings and validation.

Verified 1498/1498 full tests, 22/22 focused portability/performance/lens tests, 20 actual WebGL stage checks (two viewport sizes × both motion modes × Off/idle/focus/release/native-earned-streak), plus normal desktop/portrait Start Run with real focus inputs and visible postfx output, no page/frame errors or equipment-save mutation. Build 1326.3 KiB and whitespace check passed. Software GPU is not a hardware-FPS certification; masks are readability heuristics, not perfect semantic segmentation. No commit/push.

## Power-specific animation and real-outcome correlation

Expanded the five migrated elemental dash powers in actual combat: deadline-driven Ember flame curls/two wick cells; Frost entry assembly, stop-versus-drag teeth, remaining control seam and quiet real-immunity marks; traveling accepted Volt arc kinks/beads; Void core shutter and latest-actual-displacement inward folds; ordered measured Reprise path stitches. A capped eight-entry, 24-presentation-tick queue adds distinct combustion, electrical, inward-collapse and paired-tear reactions only on the real scheduled/secondary damage callbacks. Functional shape cues remain with reduced motion; moving flourishes do not. Drawing is read-only and under hazards, reset/dispose clear state, gameplay/store/save authority and Tide migration are untouched.

Screenshot review corrected crowded Frost words and pale receipts lost against armor. `docs/power-correlation/` separates 20 controlled native timelines from normal free-equipment desktop/portrait play and seeded-owned Ember/Reprise normal-input recordings. Ordinary Ember did not sample a live burn; native real damage callbacks establish that outcome. Reprise ordinary recording observed real pending/replay frames without forging hits. Final 1510/1510 full tests, 157/157 focused tests, all 20 native scenarios, four main.js recordings with visible WebGL/no errors/unchanged equipment save, build 1333.8 KiB, diff check passed. See implementation and validation for precise observations, visual critique and software-GPU limits. No commit/push.
