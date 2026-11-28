import { STEP_MS } from './physics.js';

/** One accumulator owns simulation time. RAF only supplies a wall timestamp.
 * Cap debt after a stalled frame; simulating minutes of missed ticks on tab
 * restore would freeze the page. Dropped debt slows the game, not collisions. */
export function createClock() {
  let previous = null,
    debt = 0;
  const MAX_STEPS = 6;
  return {
    reset() {
      previous = null;
      debt = 0;
    },
    frame(now, update, scale = 1) {
      if (previous === null) previous = now;
      debt += Math.min(Math.max(0, now - previous), MAX_STEPS * STEP_MS) * Math.max(0, Math.min(1, scale));
      previous = now;
      let steps = 0;
      while (debt + 1e-8 >= STEP_MS && steps < MAX_STEPS) {
        debt = Math.max(0, debt - STEP_MS);
        steps++;
        update();
      }
      return Math.min(debt / STEP_MS, 1);
    },
  };
}
