// Keep the portal boundary narrow: no physics or renderer code depends on an
// SDK global. The normal build is offline-first; a Poki host can inject v2. The
// explicit `build:poki` mode enables the official remote SDK bootstrap only.
const SDK_V2 = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

function loadOfficialSDK() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_V2;
    script.async = true;
    script.onload = () => resolve(globalThis.PokiSDK);
    script.onerror = () => reject(new Error('Poki SDK unavailable'));
    document.head.appendChild(script);
  });
}

/** Reconcile desired state after asynchronous SDK init. A slow SDK must not
 * block the first frame, lose a loading event, or double-start gameplay. */
export function createPokiBridge({ getSDK = () => globalThis.PokiSDK, fetchSDK = false } = {}) {
  let sdk = null,
    initialization = null;
  let loaded = false,
    sentLoaded = false,
    wantsPlay = false,
    sentPlay = false;
  function notify(name) {
    // An optional/missing SDK method, an ad blocker, or a rejected telemetry
    // promise is never an excuse to interrupt offline gameplay.
    try {
      Promise.resolve(sdk?.[name]?.()).catch(() => {});
    } catch {
      /* host failure */
    }
  }
  function sync() {
    if (!sdk) return;
    if (loaded && !sentLoaded) {
      sentLoaded = true;
      notify('gameLoadingFinished');
    }
    if (!sentLoaded || wantsPlay === sentPlay) return;
    sentPlay = wantsPlay;
    notify(sentPlay ? 'gameplayStart' : 'gameplayStop');
  }
  return {
    init() {
      initialization ??= (async () => {
        try {
          const candidate = getSDK() || (fetchSDK ? await loadOfficialSDK() : null);
          if (!candidate) return false;
          await candidate.init();
          sdk = candidate;
          notify('gameLoadingStart');
          sync();
          return true;
        } catch {
          return false;
        }
      })();
      return initialization;
    },
    loadingFinished() {
      loaded = true;
      sync();
    },
    setPlaying(value) {
      wantsPlay = Boolean(value);
      sync();
    },
  };
}
