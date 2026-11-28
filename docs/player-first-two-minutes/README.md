# First-two-minute player-lens review

Open `index.html` through a static server for the review, original216 frames, all18 inspected contact sheets and a timed still-frame replay. `SPLATR-first-two-minutes-review.pdf` is the portable review plus evidence. `review.md` is the main written deliverable.

`session.json` preserves the actual inputs, visible UI text and capture timestamps; `difference.json` specifies and measures the20% condition, which was NOT met. The original JPEG files in frames/ match the capture hashes in session.json. `runtime-follow-up.json` records a separate fresh-session console reproduction, outside the first118.4seconds.

This is a scripted screen/ordinary-input walkthrough, not a blind human study. The targeting script sometimes confused HUD pink for an enemy. No conclusions about real-player success rate, difficulty or combat balance should be drawn from its low kill count. Audio and device performance were not assessed. No game source was edited for this review.

Reproduce with a production preview on5188 and a compatible Chromium binary:

```sh
node scripts/player-first-two-minutes.mjs
# runtime-follow-up.json is a separately recorded console follow-up.
node scripts/package-player-first-two-minutes.mjs
```

This sandbox requires `LD_LIBRARY_PATH=/tmp/al2023/lib` for Chromium. Review contents and findings describe the preserved capture, not an arbitrary future rerun.
