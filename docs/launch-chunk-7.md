# Chunk 7 — the hang, the auto-pause, and what to build with them

**Reported:** "the scene is hanging and auto pausing in main game."

**Finding:** those are not two bugs. They are one bug seen twice, plus a
pause screen that never said who paused it.

---

## 1. What was actually happening

`frame()` in `src/main.js` looked roughly like this:

```js
function frame(now) {
  if (document.hidden) return;
  waveUI?.update();
  …sixty lines of tick, paint, HUD, audio…
  raf = requestAnimationFrame(frame);   // ← the ONLY reschedule, on the last line
}
```

Nothing in that body was guarded. So:

1. **One throw ended the run's animation permanently.** A HUD update, a
   renderer flourish, an art helper, a `null` from `getContext('2d')` — any of
   them skipping the last line means no more rAF. No ticks, no paint. The
   canvas keeps whatever it last drew. From the outside: **the scene hangs.**
2. **The game still thought it was running.** The loop was dead but
   `run`, the input handlers and the menus were all alive. Press **P** and the
   pause screen opens normally. Press **Resume** and the shell repaints
   exactly once — `frame()`'s `else if (redraw)` branch — and then dies again
   on the next frame, because the exception is still there. From the outside:
   **it auto-pauses, and resuming doesn't work.**
3. **The auto-pause was real too.** `blur` and `visibilitychange` open the
   pause screen deliberately. Correct behaviour — but the screen printed
   `PAUSED` and nothing else, identical to pressing P yourself. So a tab
   switch, a notification, an alt-tab and a self-inflicted pause all looked
   the same: *the game took itself away from me for no reason.*

**The one concrete throw found** was real and reachable:

```
TypeError: Cannot read properties of null (reading 'save')
  at drawSwordWeapon (src/art/splatr-art-engine.js:9981)
  at Object.update  (src/wave-ui.js:256)
```

`wave-ui.js` built the wave-clear sword strip by calling
`art.getContext('2d')` twice with no check; `drawSwordWeapon` begins with
`c.save()`, *before* its own `try`. Any canvas that hands back a null context
(blocked canvas, a detached element, an aggressive privacy mode, a headless
frame) threw straight up through the HUD and into the loop.

---

## 2. What changed

| Area | Before | After |
| --- | --- | --- |
| Reschedule | last line of `frame()` | inside `finally`, always |
| rAF slot | cleared mid-body | cleared first, before anything can throw |
| UI update | outside the guard | guarded, named `waveUI.update` |
| Failures | invisible, or fatal | logged once per kind, counted, surfaced |
| Pause cause | never recorded | `pauseCause`, printed on screen |
| Sword strip | throws on a null context | skips the prop, keeps the panel |
| New run | inherited old state | resets counters, clears the fault flag |

The loop now looks like this:

```js
function frame(now) {
  raf = 0;
  try {
    if (document.hidden) return;
    safe(() => waveUI?.update(), 'waveUI.update');
    safeStep(now);
  } finally {
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
}
```

One bad frame costs one frame. The worst case is a stutter, not a corpse.

### Diagnostics, deliberately not silent

A silent `catch` would have converted a visible bug into a mystery — the
original failure mode with extra steps. So failures are **fail-visible**:

- `console.error('[SPLATR] frame error in <where>')` — **once per unique
  failure**, with the throw attached.
- Re-reported at the 20th occurrence of the same one, then silent again. A
  render bug throws ~60 times a second; nobody needs 60 stack traces.
- At 45 total failures: `say('Frame errors are repeating — see console')` and
  `#pause-page` grows a red `RECURRING FRAME ERROR — CHECK THE CONSOLE` line.
  The player gets the one thing that matters: *this is the game's fault, and
  it's reportable* — not "my game is janky".
- `window.__splatrFrameErrors` holds `[key, count]` pairs for a bug report.
- Starting a run resets everything and logs how many the last run had.

### The pause contract

A pause nobody asked for must explain itself. `suspend(why)` records the
reason, and the pause screen prints it:

| Cause | Screen says | Get-back-in line |
| --- | --- | --- |
| You pressed P / Esc / paused | `PAUSED` | hidden |
| Tab hidden | `PAUSED — THE TAB LOST FOCUS` | shown |
| Window lost focus | `PAUSED — THE WINDOW LOST FOCUS` | shown |

`Press ↵ or Resume to get back in.` only appears on an automatic pause, where
it is genuinely needed. Dim grey for the automatic pause header, amber for
automatic, red for a real fault — a colour that means *something is wrong* is
only allowed to mean that.

### Regression tests — `test/chunk7-frame.test.js`

8 tests. `src/main.js` is a browser shell (canvas, audio, a real rAF), so the
loop's **shape** is pinned by reading the source — that a reschedule inside
`finally` exists and nothing follows it, that `raf = 0` precedes the guard,
that the UI update is inside it, that no `catch {}` hides a fault, that the
counters reset on a new run — and the one findable throw is reproduced
against the real `wave-ui.js` + `createRun` on a happy-dom document with no
2D context. That test **failed against the unpatched art engine and passes
against the patched one** — it is a bug, caught.

---

## 3. The plan: use the pause as a game beat

The fix makes a crash survivable. This is what should be built on top of it —
in order, each one shippable alone.

### 3.1 The pause already knows enough to be useful *(small)*

The pause screen currently shows points and the wave/sector line. It now also
knows *why* it opened. Next: give it the same three-slot language as the
Contracts board — the live run's three most relevant facts, e.g. `SEALED 2` /
`NEXT: FANG WORK 12/30` / `BEST SECTOR 4`. A pause is the moment a player
wants a read on the run, and right now it is the thinnest panel in the game.

### 3.2 A deliberate pause is a beat, an accidental one is not

Split the two states in code, not just in copy:

- **Deliberate** (`pauseCause === 'paused'`): full pause panel, offers
  contracts, manual, options, end run. This is the player's rest beat.
- **Interruption** (`tab hidden`, `window lost focus`): a stripped panel —
  `Resume`, `End run`, nothing else. No shop, no contracts, no way to spend
  credits while the player is in another window. It exists to be dismissed.

That's also a real exploit fix: today, alt-tabbing into the pause screen is a
free shopping trip mid-wave.

### 3.3 Freeze the match, not just the clock

The frame loop honours `document.hidden`, so a backgrounded tab genuinely
stops — no ticks, no audio queue, no clock drift. What it does not do is
*resume cleanly*: the first frame after a long hidden period has a large
`now` delta. Clamp the first delta after a resume to one frame's worth. (This
is the classic "came back and the cube had teleported" artefact; it is
one line and it is invisible when it works.)

### 3.4 The frame-fault line becomes a receipt

`RECURRING FRAME ERROR` tells the player something is wrong but gives them
nothing to do. Add one action: **Copy report** — the seed, the run state, the
`__splatrFrameErrors` table, the last five `[SPLATR]` console lines. The
diagnostics that make the bug visible should also make it fixable, and the
first crash report that arrives with a seed in it pays for the whole chunk.

### 3.5 Don't pause on a loss of focus you can survive

Right now any `blur` pauses, including a click on a second monitor, a devtools
window, or a native fullscreen prompt. Two-step it: on `blur`, wait ~400 ms;
if focus returns, resume silently — the player never saw a pause. If it
doesn't, pause with the cause. Alt-tabbing away stays covered; glancing at
Discord no longer costs a run's rhythm. This is the change that most directly
answers "auto-pausing in main game" as the player feels it.

### 3.6 What NOT to do

- **Don't pause on a frame error.** That is what the old code effectively did,
  and it is the behaviour the report complained about. A masked error is worse
  than a shown one. Keep rendering.
- **Don't retry the throw.** Swallowing and re-running the same code path
  produces the same throw, 60 times a second, forever. Report and move on.
- **Don't remove the automatic pause.** It is doing its job; it just wasn't
  introducing itself.

---

## 4. Files

| File | Change |
| --- | --- |
| `src/main.js` | `frame`/`safeStep`/`safe`/`reportFrameError`; `pauseCause` + `suspend(why)`; cause text, fault line, back-in line; counter reset on `start` |
| `src/wave-ui.js` | sword strip skips a canvas with no 2D context; guarded `firstCard.focus()` |
| `src/art/splatr-art-engine.js` | `drawSwordWeapon` returns on a null/unusable context before `c.save()` |
| `index.html` | `#pause-why`, `#pause-back`, `#pause-fault` |
| `src/style.css` | `.pause-why` (+ auto variant), `.pause-fault`, `.pause-back` |
| `test/chunk7-frame.test.js` | 8 tests: loop shape, rate limit, pause cause, real sword-strip throw |

**Verified:** 888/888 tests; `npm run build` → 997.39 kB / 369.72 kB gzip,
one-file vector-art check passed; live preview on 5173 returns 200 with the
new markup.

**Not verified:** no real browser here, so the visual read of the pause panel
and the actual rAF behaviour under a real `blur` remain unconfirmed. Section
3 is a plan, not shipped work.
