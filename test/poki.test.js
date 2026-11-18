import test from 'node:test';
import assert from 'node:assert/strict';
import { createPokiBridge } from '../src/poki.js';

test('delayed SDK init replays loading and the latest gameplay state exactly once', async () => {
  const events = [];
  let finish;
  const sdk = {
    init: () =>
      new Promise((resolve) => {
        events.push('init');
        finish = resolve;
      }),
  };
  for (const name of ['gameLoadingStart', 'gameLoadingFinished', 'gameplayStart', 'gameplayStop'])
    sdk[name] = () => events.push(name);
  const bridge = createPokiBridge({ getSDK: () => sdk });
  const init = bridge.init();
  assert.equal(bridge.init(), init);
  bridge.setPlaying(true);
  bridge.setPlaying(false);
  bridge.loadingFinished();
  bridge.setPlaying(true);
  assert.deepEqual(events, ['init']);
  finish();
  assert.equal(await init, true);
  bridge.loadingFinished();
  bridge.setPlaying(true);
  bridge.setPlaying(false);
  bridge.setPlaying(false);
  assert.deepEqual(events, [
    'init',
    'gameLoadingStart',
    'gameLoadingFinished',
    'gameplayStart',
    'gameplayStop',
  ]);
});

test('standalone, blocked SDKs and failed SDK initialization are harmless', async () => {
  for (const getSDK of [
    () => null,
    () => ({
      init: async () => {
        throw Error('blocked');
      },
    }),
  ]) {
    const bridge = createPokiBridge({ getSDK });
    bridge.loadingFinished();
    assert.equal(await bridge.init(), false);
    bridge.setPlaying(true);
    bridge.setPlaying(false);
  }
});

test('SDK failure inside an optional hook does not interrupt play', async () => {
  const bridge = createPokiBridge({
    getSDK: () => ({
      init: async () => {},
      gameLoadingFinished: () => {
        throw Error('host error');
      },
      gameplayStart: () => Promise.reject(Error('offline')),
    }),
  });
  await bridge.init();
  bridge.loadingFinished();
  bridge.setPlaying(true);
  bridge.setPlaying(false);
});
