# New-player UI and procedural teaching quests

The live quest board now uses `learningOffers`, a seeded lesson grammar, instead of the old nine-cell money/difficulty picker. The historical quest catalogue/API remains for compatibility, but is not the live menu's offer source.

## Player experience

- Start run remains immediate. A plain-language home cue explains direct aim/release and the clear → platform → upgrade loop. The Learn button opens optional guidance; no quest picker blocks starting or retrying.
- Three automatically active lessons cover Aim & Targets, Cut Technique, and Wave Rhythm. Each includes an explicit numeric goal and an actionable explanation. Phones stack them vertically; rewards are collapsed by default.
- Initial skills: cut a few enemies, land committed-power cuts, and clear one wave. Later lessons introduce Prism link cancellation, lining up two enemies, and using the physical rest platform. Subsequent practice reinforces lane planning, controlled power and wave rhythm.
- Seeded goal variants change practice quantity, not just decorative text. Vary Practice cannot skip an unlearned technique. The generator uses demonstrated category mastery rather than coins, purchases, number of deaths or time spent.
- Each completed lesson advances its category for the next run. Mastery is saved immediately; this is distinct from retaining completed quest progress. New lessons start from their own stable-ID progress. Existing bounded Head Start rules remain for incomplete goals.
- Lesson rewards are modest (3 points each); no escalating difficulty multiplier is applied to teaching lessons. Normal round credits, existing optional Vault/reward machinery, and quest opt-out remain intact. Completed lessons say SKILL LEARNED rather than advertise a payout.
- No tutorial, non-live event, fragment or empty launch can satisfy a cut lesson. Clear/rest lessons listen to actual wave lifecycle events; rest-phase transitions are explicitly permitted while ordinary menu/rest actions cannot advance combat goals.

## Verification

- Full Node suite: 432 passed, zero failures (81.7 seconds), including new lesson determinism/variation, gated mastery, low rewards, live-event restrictions, persistence and rest-event tests.
- Updated DOM integration exercises teaching lessons through the real portal/Vault grant path and verifies the nine-point lesson reward. Existing free-play payout/opt-out regression remains passing.
- `scripts/learning-ui-browser-qa.mjs`: Chromium at 1280×720, 550×720, 390×680 and 860×440; three preselected lessons, collapsed rewards, bounded dialog, immediate start with no modal, zero JavaScript errors.
- Screenshots inspected for phone board, desktop board and landscape home. Found and fixed narrow three-column instructions and a flex-layout collision caused by the new home cue. Final phone board stacks readable instructions; final landscape home keeps the cue with Start rather than between logo and navigation.
- Production build passes self-contained single-file verification. Latest measured before final CSS-only active-state wording: 603.00 kB / gzip 249.00 kB / 588.9 KiB.

Browser scratch evidence is under `.arena/learning/` (excluded from persisted artifacts); QA scripts and this document are durable. No human learnability study or native-device playtest is claimed. The procedural system is a bounded, deterministic lesson grammar, not arbitrary generated prose or adaptive AI coaching.
