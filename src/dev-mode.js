/** Sandbox mode is explicit in the URL and uses a completely separate profile. */
export function isDevMode(url) {
  return new URL(url).searchParams.get('dev') === '1';
}
export function modeURL(url, enabled) {
  const next = new URL(url);
  if (enabled) next.searchParams.set('dev', '1');
  else next.searchParams.delete('dev');
  return next.href;
}
export function createProfileStorage(backend, dev = false) {
  const prefix = dev ? 'riot.dev.' : 'riot.';
  // Preserve failed writes for this page session when storage is blocked.
  const volatile = new Map();
  return {
    get(key, fallback) {
      if (volatile.has(key)) return volatile.get(key);
      try { return backend().getItem(prefix + key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { backend().setItem(prefix + key, String(value)); volatile.delete(key); } catch { volatile.set(key, String(value)); }
    },
  };
}
export function refillForTesting(run) {
  if (!run || !['ready', 'playing'].includes(run.state.phase)) return false;
  const s = run.state;
  s.hp = s.hpMax;
  s.edge = s.edgeMax;
  s.recharge = 0;
  s.focus = 1;
  s.depleted = false;
  return true;
}
