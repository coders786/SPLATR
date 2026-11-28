/** Complete compatibility boundary for current damage routes.
 * This table describes EXISTING flags, not the future primary-only proc policy.
 * In particular shear stays secondary=false, and sword contacts must pass the
 * actual attack object so the legacy sword-specific dedup exception survives.
 * Shared frozen descriptors allocate no policy object per contact.
 */
const descriptor = (kind, fromShear, secondary, swordSource = null) =>
  Object.freeze({kind, fromShear, secondary, swordSource});
export const COMBAT_SOURCE_CONTEXTS = Object.freeze(Object.fromEntries([
  descriptor('primary-blade', false, false),
  descriptor('prism-needle', true, true),
  descriptor('core-echo', true, true),
  descriptor('upgrade-echo', true, true),
  descriptor('coil-relay', true, true),
  descriptor('anchor-floor', true, true),
  descriptor('legacy-shear', true, false),
  descriptor('sword-echo', true, true, 'attack'),
  descriptor('sword-pulse', true, true, 'attack'),
  // Restored/test-injected legacy sword objects previously reached the same
  // resolver. Keep their behavior explicit, never reinterpret them as primary.
  descriptor('unknown-sword', true, true, 'attack'),
  descriptor('ember-burn', true, true),
  descriptor('void-collapse', true, true),
  descriptor('dash-reprise', true, true),
  descriptor('volt-conduction', true, true),
].map(context => [context.kind, context])));

export function combatSourceContext(kind) {
  if (typeof kind !== 'string' || !Object.hasOwn(COMBAT_SOURCE_CONTEXTS, kind)) {
    throw new RangeError('Unsupported combat source context');
  }
  return COMBAT_SOURCE_CONTEXTS[kind];
}

export function swordContactKind(attack) {
  if (!attack || typeof attack !== 'object') throw new TypeError('Sword contact requires its attack object');
  return attack.kind === 'echo' ? 'sword-echo' : attack.kind === 'pulse' ? 'sword-pulse' : 'unknown-sword';
}
