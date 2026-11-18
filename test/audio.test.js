import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';

// Log oscillator starts; this checks the cue budget, not how nice it sounds.
test('simultaneous contacts voice only the strongest cue; quick taps never play the focus swell', (t) => {
  const notes = [],
    param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {} }),
    node = () => ({ connect() {}, disconnect() {}, start() {}, stop() {} });
  class StubAudio {
    state = 'running';
    sampleRate = 8000;
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        ...node(),
        frequency: {
          ...param(),
          setValueAtTime(f) {
            notes.push(f);
          },
        },
      };
    }
    createGain() {
      return { ...node(), gain: param() };
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(32) };
    }
    createBufferSource() {
      return node();
    }
    createBiquadFilter() {
      return { ...node(), frequency: param(), Q: {} };
    }
  }
  const before = globalThis.window;
  globalThis.window = { AudioContext: StubAudio };
  t.after(() => {
    if (before === undefined) delete globalThis.window;
    else globalThis.window = before;
  });
  const a = createAudio();
  a.unlock();
  a.strike('chip');
  a.strike('tear');
  a.strike('plate');
  a.flush();
  a.flush();
  assert.deepEqual(notes.splice(0), [310, 784, 1175]);
  a.strike('stock');
  a.flush();
  assert.deepEqual(notes.splice(0), [192, 523.25 * 1.5]);
  a.strike('armor');
  a.flush();
  assert.deepEqual(notes.splice(0), [705, 177]);
  // On the sixth kill you hear the plate you broke, not the unlock jingle.
  a.strike('plate');
  a.strike('drive');
  a.flush();
  assert.deepEqual(notes.splice(0), [176, 336]);
  a.strike('hurt');
  a.strike('tear');
  a.flush();
  assert.deepEqual(notes.splice(0), [125]);
  a.focus(true);
  a.focus(false);
  a.focus(true);
  a.focus(false);
  assert.deepEqual(notes, []);
  for (let i = 0; i < 20; i++) a.focus(true);
  assert.deepEqual(notes, [450]);
});
