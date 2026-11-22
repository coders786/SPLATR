/** Opt-in, local-only diagnostic ring. No renderer hooks, network, wall-clock
 * timestamps or user identifiers. Order is within a simulation tick, not a
 * claim about substep time-of-impact. Production runs allocate nothing here
 * unless their caller explicitly supplies this recorder.
 */
export function createCombatTrace(capacity = 256) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 4096)
    throw new RangeError('Trace capacity must be 1..4096');
  const buffer = new Array(capacity);
  let count = 0,
    sequence = 0;
  const entries = () =>
    Array.from(
      { length: Math.min(count, capacity) },
      (_, i) => buffer[(count - Math.min(count, capacity) + i) % capacity],
    );
  return {
    record(event) {
      buffer[count++ % capacity] = Object.freeze({
        ...event,
        sequence: sequence++,
      });
    },
    entries,
    json() {
      return JSON.stringify({ version: 1, events: entries() }, null, 2);
    },
    clear() {
      buffer.fill(undefined);
      count = sequence = 0;
    },
  };
}
