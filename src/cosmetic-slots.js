/** Appearances are saved and rendered as chosen, but never enter combat rules.
 * Keep these slot names stable: older saves and presets use the same IDs. */
export const COSMETIC_SLOTS = Object.freeze(['eyes', 'dash', 'world']);
export const isCosmeticSlot = slot => COSMETIC_SLOTS.includes(slot);
