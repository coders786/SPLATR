# SPLATR: a player's first-two-minute review

## Verdict: the poster sells a bigger, clearer fight than the opening delivers

**First-impression score: 5/10. Visual identity: 8/10. Action readability: 4/10.** These are subjective judgments of this recorded opening, not scores for the whole game.

I would click Start. I would probably give the movement one more attempt. I would not yet recommend the game on the strength of these first two minutes.

The strongest thing here is a confident identity: cream lettering, acid green, hot pink, sharp shapes, a little masked cube with attitude. The weakest thing is the distance between that promise and the actual view of play. The menu says **fast, loud, sharp**. Much of the captured action says **small character, dark room, important things somewhere else**.

My main complaint is not “there are no particles.” It is: **the game is not consistently making the important event the easiest thing to see.**

### What this review actually is

I inspected **216 actual browser frames**, covering **118.4 seconds** of a fresh desktop session at 1280×720, including menus and tutorial. All 18 contact sheets were opened and visually examined, with selected frames also inspected at full size. No game code, powers, inventory, saves or visuals were changed for this review.

This is a **player-lens walkthrough using scripted ordinary mouse inputs**, not a blind test with a recruited human. I cannot erase previous knowledge of the repository or claim human reflexes, feelings or hearing. The written reactions below are my player-facing judgments of what was on screen. The scripted targeting also mistook some pink HUD elements for enemies; that limits conclusions about difficulty, aim quality and combat pacing.

**Your 20% difference condition was not achieved.** Of 215 consecutive frame comparisons, 11 exceeded 20% changed pixels and 204 did not. Mean change was 6.13%. All frames were retained; no jump cuts, image edits or screen changes were manufactured to pass the threshold. The definition and per-frame results are included in `difference.json`. Pixel change is not a measure of fun, semantic novelty or animation quality. One near-full-screen flash easily exceeds the threshold; a useful small animation may not.

## The first two minutes, as they unfolded

| Time | What was visible | My player-facing judgment |
|---|---|---|
| 0–4.4s | Large SPLATR title, dramatic pink poster shapes, clear lime Start Run button | This looks like a real game with a point of view. Starting is obvious. |
| 5.1–8.3s | Three nearby pink shapes and a short-blade instruction; after the recorded click, the next objective appears | The first interaction has an immediate, visible consequence. Good opening. |
| 8.3–25.3s | Open gate, glowing wall, bounce and gate-cut objectives; the character travels around the room | The green highlights help, but I am reading small instructions far from the moving character. One subtitle still talks about cutting the three shapes after the headline changes to the gate. |
| 25.3–34.7s | Red-ring enemy lesson, changing between wait, next circle and missed | The danger shape is readable. The exact thing I must do to advance is less immediate: the headline says wait, while supporting text says moving closer wakes it. The walkthrough uses Skip at 34.7s under its pre-set tutorial time limit. This does not prove a human would fail the lesson. |
| 34.7–38s | Crown graphic, a very bright full-view flash, normal play, then score 100 / one kill | This is the loudest visual beat in the sequence. It gets attention, but the character almost vanishes during the flash. A frame-error warning also appears around this transition. |
| 38–118.3s | Movement continues through the dark room; the HUD remains at score 100 / one kill, with a remaining threat often indicated near an edge | This recording stops communicating a clear next payoff. However, the targeting script is also making mistakes, so I cannot honestly conclude the real game is inherently this sparse or slow. |

## 1. The title screen works

The big title is readable immediately. The angled lettering and poster-like composition suggest slicing before any instructions are read. The lime Start Run button stands apart from Practice, Options and Shop. That is the right order: let me play first.

The masked cube, blade streak and angular enemies belong to the same visual world. This is much more appealing than a collection of unrelated glowing effects.

What I would simplify is the extra early promise of a boss-charge system. Before I know how a normal cut works, a progress meter about a future boss adds another thing I might think I need to understand. It is not disastrous, but the title screen's biggest achievement is its simple invitation to start. Protect that simplicity.

**Player reaction:** “I know where to click, and I want to see that slicing picture become the actual game.”

## 2. The action is drawn too small for how much character detail it contains

At full size, the cube has readable eyes, a face plate, a scarf and a blade. In the room, it occupies a small part of the screen. In many frames, its individual details become something I can appreciate only after stopping and looking closely.

The scenery receives a lot of screen area: fans, ducts, panels, cables and dark architectural shapes. Those are coherent and atmospheric. But they are sometimes more visually substantial than the move I just made.

That reverses the promise of the menu. I do not need the room to be busier. I need the character, the next threat and the result of a successful cut to win my attention.

A closer first encounter, a clearer local contrast behind the action, or a larger readable silhouette would help more than adding another layer of decoration. This is a recommendation, not a claim that a particular camera change is already proven best.

**Player reaction:** “The character looks cool when I find it. Why am I working to find the cool part?”

## 3. The background has style, but its shapes compete with the rules of the room

The industrial background is not ugly. Its restrained palette is a strength. It gives the sharp cream-and-lime character a consistent setting.

The problem is that long background seams, real-looking ledges, thin outlined barriers and highlighted gates share the screen. I have to learn which lines are scenery and which lines determine where I can go or what I can bounce from.

The glowing green gate and right wall are the strongest answers: they clearly look more important than the surrounding architecture. Use that level of distinction for the next required interaction. Do not ask me to infer an actionable edge from another grey rectangle while moving.

**Player reaction:** “Show me the surface that matters now, not every surface equally.”

## 4. The tutorial has useful ingredients, but its guidance is split

The opening wisely lets me do something instead of presenting a long manual. Cutting a nearby group before introducing a wall interaction is a sensible visible progression. The ring around the red threat is also much clearer than explaining an invisible danger radius.

But the instructions sit in a narrow panel high above the action. My character and the immediate threat are often in the lower half of the room. Reading, locating the target and controlling movement become three separate attention tasks.

There is also an observable copy mismatch in frame 16, around 8.25s: the headline says **GO THROUGH THE OPEN GATE**, but the line beneath still says to let the shapes come to me and cut all three. As a player, I should not have to decide which instruction is current.

In the red-circle lesson, “wait for the circle” and “step closer to wake it” are different steps. I want a clear indication of the step I am on: approach, danger appearing, leave the danger, success. A short prompt near the relevant enemy would be easier to follow than another change at the top of the screen.

The scripted walkthrough skipped this lesson. That is evidence of the route taken, not proof that the teaching is impossible. A real beginner test should specifically check this point.

**Player reaction:** “Don't just tell me what the lesson is about. Show me the one thing you want me to do next.”

## 5. Successful action needs a clearer cause and result

I can see that moving and attacking change the scene. The first set of shapes disappears and the objective advances. Later the score becomes 100 and the kill count becomes one. Those are concrete results.

What I do not consistently get is a single, unmistakable visual sentence: **I aimed there → my cut crossed that enemy → that enemy broke → that was my reward.**

The relevant actor is small, the enemy can be near the edge, and the reward count lives in a large panel elsewhere. These are pieces of feedback, but they are not always joined together at the place I am watching.

I would prioritize a readable enemy breakup and a short local confirmation over a larger global effect. The move should remain understandable if I ignore the score panel.

This capture does not establish input latency, hit accuracy or real-device smoothness. Screenshots and a mouse script are not enough to grade those fairly.

**Player reaction:** “I want to know that I did something sharp and intentional, not discover it by reading a number afterward.”

## 6. The screen is loudest in places that are not always the fight

The score is bold and easily read. The health display is also identifiable. That is good.

But the six-digit score and large crown graphic can command more attention than the little enemy or character. Other information is much less clear: tiny status labels, short wave notation, small squares below the character, a minimap, Focus and boss charge.

The small squares under the character can visually resemble another health indicator, while health is also displayed at the upper left. From this opening alone, I would not confidently know what a dimmed square means. I am not assuming its underlying purpose; the point is that the screen does not teach that purpose clearly enough here.

The color sentence **GREEN CUTS / RED HURTS / GOLD PAYS** is a good memory aid. It is short and visual. More of the opening should communicate with that clarity.

**Player reaction:** “I can read my score faster than I can explain the last thing that happened to my character.”

## 7. The bright transition is memorable, but not automatically better feedback

Frame 66, around 35.75s, is almost entirely pale cream with orange cracks. Compared with the dark arena immediately before and after it, this is a very strong visual interruption.

That is not the same thing as a satisfying hit. In that frame, the character and enemies are barely readable. It makes the screen change dramatically, which helps explain why a raw 20% pixel-difference rule is a poor visual-quality target.

I would prefer the spectacle to preserve the focal point: a bright local event with enough of the character and threat still visible to understand why it happened. Whether this transition should be softened needs a real-time viewing and accessibility check; these screenshots do not establish a photosensitivity threshold or diagnosis.

**Player reaction:** “You got my attention. Now keep it on the thing I am doing.”

## 8. By the end of this recording, the next goal is not compelling enough on screen

The score and kill count remain at 100 and one from about 38s to the end. A threat indicator appears near the edge, but much of the visible room contains movement rather than a new successful interaction.

That makes the recording feel visually repetitive. It does **not** prove the game's intended pace is repetitive: the automated controls sometimes aimed at the HUD, and a repeated interface error was also observed. I would be inventing certainty if I blamed all of this on enemy design or balance.

The safe player-facing criticism is narrower: when a session is in this state, the screen should make recovery clearer. Where is the remaining target? Is the immediate goal to approach, wait, bounce or attack? What should I try differently? A struggling player needs an obvious route back to the exciting part.

I would give the game another short attempt because the movement concept and visual identity are promising. The opening has not yet earned a confident “one more run” recommendation from me.

## A problem that should not be disguised as taste

Around 36.3s the visible page text included **“Frame errors are repeating — see console.”** A separate fresh-session follow-up reproduced a repeated interface-update error during ordinary Start → Skip → mouse-drag play.

To a player, the meaning is simple: something in the presentation is not behaving reliably. It deserves attention before collecting reassuring visual scores.

The diagnostic detail is kept in `runtime-follow-up.json`. I have **not** established that this error caused the long low-progress section, and I did not fix it during this review. A review of an unreliable session should not masquerade as a clean test of the game's full combat design.

## What I would want changed, in player-priority order

1. **Make the normal play view reliable.** Investigate the repeated interface warning before asking players to judge polish.
2. **Make the first fight the focal point.** Give the character, nearest threat and attack result more presence than the background and score furniture.
3. **Keep the current instruction current.** Remove stale supporting text and show one next action where I am looking.
4. **Teach the red-ring encounter as visible steps.** Clearly distinguish approaching, the danger appearing, leaving it and succeeding.
5. **Make a successful cut tell its own story.** Readable contact, enemy breakup and a short nearby reward should agree.
6. **Help a stuck player find the remaining objective.** Make the edge threat and the useful next action unmistakable.
7. **Keep the style; reduce the competition.** The art direction does not need replacing. Its best parts need room and attention.

## What I am deliberately not claiming

- I did not evaluate every item, later waves or the shop in this new two-minute recording. The earlier shop review is separate evidence.
- I did not hear and assess audio, test a real phone, or measure control latency.
- I did not establish that the game is too hard, that enemies are badly balanced, or that a human would remain at one kill.
- I did not meet the requirement that every captured frame differ by at least 20%.
- I am not quoting recruited players. The reaction lines are my illustrative player-lens summaries, not interview transcripts.

## Research behind the lens, not a substitute for the evidence

The useful questions were: can I discover the action, understand a mistake, recover, see myself improving and want to continue? Game UX guidance discusses those concerns through learnability, error recovery, efficiency and satisfaction. It also recommends observing behavior rather than relying on polite statements of enjoyment. [3](https://www.offerzen.com/blog/how-games-benefit-from-ux-testing)

NN/G's usability-testing guidance describes observing realistic participants carrying out realistic tasks, without leading them. That is why this walkthrough is explicitly not presented as a blind human playtest. [Usability Testing 101](https://www.nngroup.com/articles/usability-testing-101/)

My final player-facing verdict stays simple: **SPLATR already knows how it wants to look. Its opening still needs to make me see, understand and own the exciting moment.**
