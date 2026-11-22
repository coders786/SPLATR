# Pull remake: actual platform softlock

## Reproduced failure

Prior threshold tests covered valid-resourced launches, not the user's reported gameplay state. A production wave-mode run placed in playing state with zero cuts stayed grounded on its launch pad at zero cuts for 300 ticks. `dash({x:0,y:-35,power:.8})` returned false. The ordinary recharge intentionally excludes grounded bodies; the launch pad is not a bottom-rail bounce, so neither route restores an escape cut. This is consistent with the user's aim-then-still-on-pad screenshots, though screenshots alone cannot prove the exact saved resource state.

## Changes

- New pure `pull-control.js`: explicit immutable press/move/resolve sessions, screen-pixel travel, event-owned latching independent of whether an overlay or aim was drawn. One smooth bounded power curve from 28% to full launch speed replaces the combination of world drag easing and a downstream minimum-speed patch. Direction is pull-back/release-forward. Acquisition/cancellation hysteresis remains; taps remain target-based.
- Owned pointer move/release listeners run in capture phase so bubbling HUD handlers cannot swallow an in-progress release. Pointer ID, primary ownership, native capture, pointercancel/capture loss, blur and fresh arena press rules remain. No synthetic launches on cancellation.
- Grounded wave combat on a solid deck at zero cuts restores exactly one cut after 24 settled simulation ticks, not a full rack. An earlier valid upward escape release can launch immediately without waiting for that timer; its single escape cut is consumed on that launch. Invalid vectors, downward attempts and airborne zero-cut releases cannot mint this exception. No score, reward, healing or wave advancement is granted.
- A resource-refused release now also shows a short visible NO CUTS / RECHARGING message instead of only a screen-reader announcement. Existing 140ms general refusal buffering is unchanged.

## Research used

MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events (read primary pointer/button state, pointer capture/automatic release, cancellation, and touch-action sections). Applied the single active primary pointer contract, retained explicit capture and cancellation, and retained canvas touch-action:none. No mouse-event duplicate firing or forced launch after native cancellation. These references inform event ownership; they do not establish game balance or prove a fix on physical devices.

## Validation

- 532/532 full Node tests pass.
- New `scripts/pull-deck-browser-qa.mjs`: eight actual-run/production-renderer cases, four sizes × mouse/browser-native touch. One living enemy remains, cube rests on actual launch deck, zero-cut recovery tested, then resources reset to zero immediately before drag/release to verify the quick escape path. Actual shot count and upward physical displacement asserted; ready/aim/released captures saved under .arena/pull-deck. Desktop released capture inspected: hero visibly above and away from platform.
- Twelve browser-native touch cases pass: relaxed pull, intentional inner-ring return, native touchCancel, and second-finger ownership, three sizes.
- Three-size required upgrade-choice regression passes (Escape/outside/unexpected-close recovery/selection).
- Pure curve tests cover multiple directions/travel ranges, speed bounds, monotonicity, direction invariance and no-render latching. Production tests verify stationary zero-cut recovery cannot fill the rack, immediate escape consumes its cut, and invalid/downward attempts cannot mint cuts.
- Production single-file build passes; see .arena/icons/pull-remake-build.log. Full tests: .arena/icons/pull-remake-tests.log.

No physical-phone or all-browser release claim. The browser scenes use deterministic setups, not a captured replay of the user's session.
