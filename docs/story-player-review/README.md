# Story and cutscene player-lens review

Open index.html using a static server, or read SPLATR-story-player-review.pdf. review.md is the main written deliverable.

319 main screenshots plus 28 separate normal-clock opening screenshots; all inspected across 29 sheets. Later scenes explicitly staged, not naturally reached. Main animation clock controlled; real-time DOM fades are not synchronized to it. Message previews are not a full ending. See review.md and both manifests for limitations and runtime errors. No game source changes.

Capture: scripts/story-player-review.mjs (production5188 + current-source5192), scripts/story-realtime-opening.mjs (current-source5192). Package: scripts/package-story-player-review.mjs. Chromium uses /tmp/chromium; this sandbox requires LD_LIBRARY_PATH=/tmp/al2023/lib.
