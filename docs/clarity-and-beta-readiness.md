# Screenshot-driven clarity and motion-comfort correction

## Honest readiness estimate
Judgment estimate: 75–80% toward a public web beta, not a validated polished-release percentage. Existing core play, persistence and builds are substantial; automated checks do not establish comprehension, retention or native-device performance. The remaining 20–25% is not a countable code backlog.

Release gates, in priority order:
1. First-time comprehension: 5–8 unfamiliar players can launch, clear a wave, identify their active upgrade, buy/equip a part and retry without verbal coaching. Observe rather than explaining.
2. Motion/performance comfort: real low/mid-range Android and desktop tests; check frame pacing during chains, background/resume and reduced-motion operation. No unsolicited preview loops.
3. Release regression: full and embedded viewport, save reload, touch input, wave/rest/settlement, long-run memory and actual production-host smoke checks.
4. Web packaging: production hosting/cache behavior, loading/error state, privacy/credits/license review, audio activation and distribution-specific requirements.
5. Balance/retention: measure whether players voluntarily retry and understand trade-offs. More icons/buffs do not prove this.

## Research applied
- Nielsen Norman Group, *10 Usability Heuristics*: recognition rather than recall, familiar terminology, visible status, minimalist design. Applied by moving the primary action next to selection and removing duplicate state prose. https://www.nngroup.com/articles/ten-usability-heuristics/
- W3C WCAG 2.3.3 understanding: unnecessary movement may cause nausea; support motion preferences and user control. Applied as static keyframes by default, one-shot intentional previews, and existing reduced-motion support. This is not a claim of complete WCAG conformance. https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

## Fixes
- Found real manual width selector bug: panel is a sibling of #game, so earlier descendant rule could not size it. New selectors target the visible manual inside #panel directly. Explicit three-column controls/desktop enemies, two-column phone enemies, compact heading and fixed-height visual tiles.
- Shop selection/action shelf moved from below catalogue to directly below slot navigation. Strong contrasting panel and persistent visible selected name / effect / buy-or-equip action. Removed repetitive intro/footer; unaffordable/owned state is readable rather than near-invisible.
- Shop cards freeze at a clear 1100ms result keyframe. Hover/focus/selection triggers a single short playback, then stops. Inactive cards are no longer updated at quarter-rate. Draw caching stops unchanged card/manual redraws. LIVE BUILD holds a keyframe unless an item interaction or manual practice owns it.
- Field Manual defaults to frozen outcome frames. Hover/focus/tap replays one demonstration and stops; keyboard Enter/Space supported. Added small replay affordance.
- Wave upgrade previews likewise default to still frames and replay once on focus/hover.
- Separate quest screen from first screenshot now uses icon-led short skill cards; removed repetitive visible instruction paragraphs/intro/footer. Full instructions remain in accessible names/tooltips. Goal numbers remain visible.

## Validation
- Full suite: 493 passing, zero failures, 157.8s.
- Browser QA enhanced with pixel equality checks: manual idle stays still, hover changes frames, replay stops; Shop idle stays still, action shelf precedes grid. Passed four viewport sizes after waiting for any incidental opening-hover replay to finish.
- Four-size story/manual layout checks: nine tiles present, no carousel/dialog scroll, every Shop card role-badged, no page errors.
- Four-size discovery/purchase checks pass: buy != equip and unknown recipes remain secret.
- Inspected new 390px Shop and manual screenshots: prominent top action shelf, two complete Shop rows, all nine manual lessons visible without scrolling.
- Final self-contained build: 698.80 kB, gzip 276.71 kB.

No native-device frame-rate measurement or novice playtest was performed. The attached screenshots demonstrate failures missed by the earlier automated presence checks; the new checks test actual idle pixels and action hierarchy rather than relying only on element counts. Art engine/gameplay balance unchanged in this correction.
