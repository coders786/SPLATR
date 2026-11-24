# Cutscene pacing pass

**Status:** shipped on `arena/875ca01c-splatr`  
**Reason:** the first cutscene pass held the player too long before giving them a meaningful handoff.

The pacing rule is now **hook → reveal → consequence → handoff**. Every sequence has one job per beat, no dead-air beat, and a release window in which the player gets control before the last image disappears.

| Sequence | Total | Input lock | Release window | Beat plan |
| --- | ---: | ---: | ---: | --- |
| Cold open | 2.4 s | 2.0 s | 0.4 s | eyes → Watcher → tear → Fangs → control |
| Sector crossing | 1.0 s | 0.83 s | 0.17 s | locks → seam/chip → rise → control |
| Mid-wave story pulse | 1.0 s | 0 s | 1.0 s | signal → live mechanic demonstration → return |
| Shatter | 2.5 s | 2.0 s | 0.5 s | freeze → core → crack → sky → borders → dolly → control |

## What changed

- The cold open no longer spends 0.8 seconds in near-black. The hook arrives in 0.2 seconds, and the first launch is available while the final image is still fading.
- Sector crossings were reduced from 1.5 seconds to 1 second. The story chip lands 20% into the seam beat instead of appearing at the exact frame the shot starts.
- The first ordinary wave arms one midpoint story pulse from actual enemy progress. It demonstrates the real Pulse mechanic—the expanding rim and the safe space behind it—without stealing input. A run-scoped guard prevents any later wave from replaying it.
- Shatter was reduced from 4.2 seconds to 2.5 seconds. Its dramatic lock ends at the dolly; the release beat is a live handoff, not an extra waiting room.
- The skip gate was reduced from 0.8 seconds to 0.5 seconds. A player can see the premise, then leave immediately.
- Reduced motion keeps the same beat order and scales the same timing contract.

The timing contract is exported as `CUTSCENE_PACING` from `src/cinematics.js` and covered by `test/chunk6a.test.js`. Gameplay state remains owned by the run; cutscenes only mirror time, paint, and input lock.
