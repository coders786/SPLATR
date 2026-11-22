# Rest-platform magnet

Added nearby landing assistance to the between-wave rest deck. Only active in return phase while playing; never combat, breach, choose, pause or death. User-held aim and fresh launch grace suspend the assist. Range is 440 world pixels from deck center/landing height; it is not a global teleport.

`src/platform-magnet.js` is a pure bounded velocity-steering function. Nearby overshoots brake, steer over the deck and settle through real collision. A cube below the deck first goes around the nearest reachable end, then rises beside it; arena-edge checks choose the opposite end when the nearest route would be outside the arena. No direct position writes or pull through the solid underside. Once physically landed, the existing 12-tick landing dwell opens the required three-offer chooser. No automatic upgrade selection, score, shots, resources or rewards are granted.

Added small pole shoes on the deck and restrained inward ticks while active. Reduced motion keeps a stationary cue. Drawing stays in the portable shared engine; steering stays outside it. The existing landing light and platform label remain.

## Validation

- 546/546 Node tests pass, including force bounds, held/launch/inactive/far/invalid suppression, below-deck routing, reachable arena-edge routes, actual overshoot/below captures, no duplicate rest event/reward/shot, context restoration and stationary reduced artwork.
- `scripts/platform-magnet-browser-qa.mjs`: 16 real-physics captures = overshoot, below deck, left arena edge, right arena edge at four sizes. Each reaches the required chooser with three offers, zero shots/score and no page errors. Phone capture inspected. Deterministic setup, not an earned live-user trace.
- Three-size required-choice regression passed (repeated Escape, outside click, unexpected-close restoration, valid selection).
- Eight production-renderer zero-cut platform mouse/touch release regressions pass.
- Production single-file build passes: 731.18 kB / gzip 287.11 kB.
- Logs: .arena/icons/platform-magnet-{focused,tests,build,choice,pull}.log. Captures: .arena/platform-magnet/.

Physical-device comfort/performance remains unverified. Assist is intentionally local and yields to deliberate aiming; it does not guarantee capture when a player continuously launches away or stays outside range.
