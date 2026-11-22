# Lucky-upgrade clarity chunk

Polished the seeded lucky offers without changing roll odds, seed mapping, applied values, categories, tradeoffs, rewards or duration.

- Replaced appended `/ LUCKY` upgrade names with compact bordered LUCKY stamps. Names remain short, active HUD uses the same stamp, and full accessible labels announce the lucky roll.
- Shared pure `buffPresentation` derives lucky stat text from actual numeric modifier fields, not a separately authored luckyStat string. Chooser, accessible copy and active HUD use that projection. Normal copy remains unchanged. Tooltip supplies the usual unboosted stat.
- Lucky cards have a restrained warm material edge. No autoplay, flashing, confetti or added animation.
- Guard comparison preview uses the supplied guard-tick bonus rather than always illustrating +8 ticks; lucky +12 thus gets its actual longer window.

## Validation

- 551/551 Node tests passed. Two new tests cover all five variant projections from numbers (including an intentionally incorrect authored string), normal copy stability, actual seeded offer agreement and unknown-ID handling.
- scripts/lucky-presentation-browser-qa.mjs: 20 real seeded choices (all five variants × four sizes). Finds actual seeds, clears/lands the real run, chooses the rolled lucky offer, verifies applied modifier and matching HUD/stat/stamp, all cards fit without dialog scroll or horizontal overflow, no page errors. Phone longer-slash chooser capture inspected. Captures .arena/lucky-presentation/.
- 15 existing rest-layout stress fixtures passed across five sizes; three-size required-choice Escape/outside/unexpected-close recovery regression passed.
- Production single-file build passed: 733.52 kB / gzip 287.80 kB.
- Logs .arena/icons/lucky-presentation-{focused,tests,build,layout,escape}.log.

Physical-device comfort/performance and human recognition remain unverified. Browser scenes use deterministic setups, not naturally played user sessions.
