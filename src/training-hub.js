/**
 * THE LEARNING GROUND — the one front door for practice.
 *
 * CHUNK 5 (THE LEARNING GROUND). Before this, "Learn the game" was three
 * half-doors: a menu Learn button that bypassed a menu of misleading buttons
 * (every Guide entry started the same room), a Quest board whose training
 * buttons were injected but never rendered because `createQuestUI` was
 * called without its callbacks, and two dialogs (LIVE ENEMY TRAINING and
 * CONTROL PRACTICE) that existed in source and nowhere else.
 *
 * This module owns the TRAINING HUB: one honest page, three doors. The
 * doors are data; the page is a factory. Tests assert the data — the wiring
 * lives in `main.js` and is exercised by the browser QA pass.
 *
 * No run state, storage or wallet crosses this boundary: doors only carry
 * callbacks handed in by the shell.
 */

export const TRAINING_DOORS = Object.freeze([
  Object.freeze({
    id: 'course',
    index: '01',
    name: 'THE COURSE',
    tag: 'THE JOURNEY · 10 MINUTES',
    body: 'Four rooms, in order. Paper racks teach the blade, a glass wall teaches the bank, the Rift teaches the red circle, and the Crown teaches the field.',
    detail: 'THE RACK → THE WALL → THE RIFT → THE CROWN',
    action: 'PLAY THE COURSE',
  }),
  Object.freeze({
    id: 'lessons',
    index: '02',
    name: 'ENEMY LESSONS',
    tag: 'LIVE COMBAT · ONE ROOM PER SHAPE',
    body: 'Real enemy AI, real blade, real rules — one small room per kind. Watch the warning, make the dodge, then cut it down. Eleven lessons, Fang to the Monolith.',
    detail: 'FANG · PULSE · PRISM · FORK · BASTION · RIFT · WELL · CROWN · MONOLITH',
    action: 'CHOOSE AN ENEMY',
  }),
  Object.freeze({
    id: 'drills',
    index: '03',
    name: 'CONTROL DRILLS',
    tag: 'THE MOVEMENT ECONOMY',
    body: 'Pace, Hyper, Sonic and the breach — the full speed game, end to end, in a safe arena. For when the field refuses to make sense.',
    detail: 'FULL ROUTE · BANK DRILL · BREACH DRILL',
    action: 'OPEN THE DRILLS',
  }),
]);

export function trainingDoors() {
  return TRAINING_DOORS;
}

/** Build the hub into `host`. All three doors must have callbacks that exist —
 * an unhooked door renders disabled with the reason on its face, never a
 * button that silently does nothing. */
export function createTrainingHub({ host, startCourse, openLessons, openDrills } = {}) {
  if (!host) throw new Error('createTrainingHub: a host element is required');
  const actions = { course: startCourse, lessons: openLessons, drills: openDrills };
  host.replaceChildren();

  const section = document.createElement('section');
  section.className = 'training-hub';
  section.setAttribute('aria-label', 'The Learning Ground — all the ways to learn the game');

  const head = document.createElement('header');
  head.className = 'training-head';
  head.innerHTML = `<small>THE LEARNING GROUND · SAFE PRACTICE / NO REWARDS</small>
    <h2>Learn the game.</h2>
    <p>Three doors. All of them tell the truth — nothing behind them scores, pays or saves anything.</p>`;
  section.append(head);

  const doors = document.createElement('div');
  doors.className = 'training-doors';
  for (const door of TRAINING_DOORS) {
    const action = actions[door.id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'training-door';
    button.dataset.door = door.id;
    button.disabled = typeof action !== 'function';
    button.innerHTML = `
      <b class="training-index">${door.index}</b>
      <span class="training-copy">
        <b>${door.name}</b>
        <em>${door.tag}</em>
        <small>${door.body}</small>
        <span class="training-detail">${door.detail}</span>
      </span>
      <span class="training-cta">${button.disabled ? 'NOT AVAILABLE' : `${door.action} →`}</span>`;
    button.addEventListener('click', () => { if (!button.disabled) action(); });
    doors.append(button);
  }
  section.append(doors);

  const foot = document.createElement('p');
  foot.className = 'training-foot';
  foot.textContent = 'Everything here is SAFE PRACTICE. No points. No credits. No quest damage. Just the game, at your pace.';
  section.append(foot);

  host.append(section);
  return { close: () => host.replaceChildren() };
}
