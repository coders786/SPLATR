# Follow-up: consistency and settled-preview work

Executed after elemental dash pass:
- In-game active-buff HUD uses the same plain-language catalogue as the choice cards, not the previous invented name/technical stat vocabulary.
- Added visible active benefit name alongside the numerical effect. Shield charge/spent state remains live; costs remain in accessible descriptions/tooltips.
- Choice accessible names now match visible names and include benefit, cost and next-wave-only lifetime.
- Wave UI receives the authoritative motion preference from main rather than independently reading localStorage/system preferences. Runtime changes now affect both initial render and replay.
- Frozen previews cache their frame key; settled and reduced-motion previews perform no repeated canvas clears/draws. Intentional replay still updates and stops at 1100ms.
- Removed overwritten/dead technical description generation and unused sword-calculation import.

Validation:
- 499/499 full tests pass (140.1s).
- Expanded choice browser QA: all eleven offers across 16 real-rest fixtures/four sizes; no idle redraws, motion-disabled suppression, accessible/visible name agreement, idle pixel stability, no scrolling/page errors.
- Shop/manual QA passes at four sizes: still-first, bounded replay, visible primary action, nine lessons/no dialog scrolling.
- Active-buff browser QA: 33 fixtures pass; charges, spent state, expiry and viewport bounds preserved.
- Build passes: 705.36 kB, gzip 279.08 kB, self-contained HTML.

Pending external gates remain: unfamiliar-player observation, real-phone frame pacing/comfort, production-host smoke checks. No user-study/retention or native performance claim.
