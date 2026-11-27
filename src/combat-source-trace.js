import {createCombatTrace} from './combat-trace.js';

/** Opt-in S2a observer, NOT a damage/proc/admission authority.
 * IDs are local to this recorder, not player identifiers. Entries contain only
 * scalars; weak source/target keys never keep a retired actor alive. Nothing
 * from this recorder is attached to saves, gameplay objects or renderer events.
 */
export function createCombatSourceTrace(capacity = 256) {
  const ring = createCombatTrace(capacity);
  let nextRun = 0;
  return Object.freeze({
    entries: ring.entries,
    json: ring.json,
    // Clearing history must not reuse IDs of observers that are still alive.
    clear: ring.clear,
    startRun() {
      const runId = `run-${++nextRun}`;
      let nextSource = 0, nextTarget = 0, nextEvent = 0;
      let sources = new WeakMap(), targets = new WeakMap(), primary = null, current = null, closed = false;
      function create(kind, shotId, tick, worldClock, parentSourceId = null, originKnown = true) {
        if (closed) return null;
        const source = Object.freeze({runId, sourceId: `${runId}/source-${++nextSource}`, sourceKind: kind,
          sourceShotId: shotId, parentSourceId, originKnown});
        ring.record({type: 'source-created', ...source, tick, worldClock});
        return source;
      }
      const observer = {
        create,
        primary(shotId, tick, worldClock, originKnown = false) {
          if (closed) return null;
          if (!primary || primary.sourceShotId !== shotId) primary = create('primary-blade', shotId, tick, worldClock, null, originKnown);
          return primary;
        },
        tag(object, kind, shotId, tick, worldClock, parentSourceId = null) {
          if (!closed && !sources.has(object)) sources.set(object, create(kind, shotId, tick, worldClock, parentSourceId));
        },
        get(object, kind, shotId, tick, worldClock) {
          if (closed) return null;
          // Supports externally restored/test-injected sources without claiming
          // their original shot/birth was observed. Never rewrite their fields.
          if (!sources.has(object)) sources.set(object, create(kind, shotId, tick, worldClock, null, false));
          return sources.get(object);
        },
        begin(source, target, tick, worldClock, shotId, fromShear, secondary, swordSource) {
          if (closed) return null;
          if (!targets.has(target)) targets.set(target, `${runId}/target-${++nextTarget}`);
          const token = {source, eventId: `${runId}/contact-${++nextEvent}`, parentEventId: current?.eventId ?? null,
            targetKey: targets.get(target), targetId: target.id, targetKind: target.kind, targetHpBefore: target.hp,
            tick, worldClock, shotId, fromShear: !!fromShear, secondary: !!secondary, swordSource: !!swordSource,
            accepted: false, rejection: 'not-accepted', previous: current};
          current = token;
          return token;
        },
        finish(token, hpAfter, present, failed = false) {
          if (closed || !token) return;
          current = token.previous;
          token.previous = null;
          ring.record({type: 'cut-result', ...token.source, eventId: token.eventId, parentEventId: token.parentEventId,
            targetKey: token.targetKey, targetId: token.targetId, targetKind: token.targetKind,
            tick: token.tick, worldClock: token.worldClock, shotId: token.shotId,
            fromShear: token.fromShear, secondary: token.secondary, swordSource: token.swordSource,
            accepted: token.accepted,
            outcome: failed ? 'exception' : !token.accepted ? token.rejection : present ? 'armor' : 'kill',
            targetHpBefore: token.targetHpBefore, targetHpAfter: hpAfter,
            // Target-only outcome; no attribution of aggregate resource/score
            // changes that can include recursively resolved child contacts.
            scope: 'target-only'});
        },
        dispose() {
          if (closed) return;
          closed = true; sources = targets = primary = current = null;
          ring.record({type: 'source-trace-ended', runId});
        },
      };
      return Object.freeze(observer);
    },
  });
}
