// Tiny procedural SFX bank. No audio files, decoding costs, autoplaying music,
// or sound requests before the visitor supplies a real user gesture.
export function createAudio() {
  let context,
    enabled = true;
  try {
    enabled = localStorage.getItem('splatr.muted') !== '1';
  } catch {
    /* private storage */
  }
  function unlock() {
    if (!enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      context ??= new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch {
      /* optional */
    }
  }
  function tone(from, to, duration, type, volume, delay = 0) {
    if (!enabled || context?.state !== 'running') return;
    const start = context.currentTime + delay,
      end = start + duration;
    const oscillator = context.createOscillator(),
      envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, end);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.009);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  // Filtered air noise gives a launch a short leading edge; pitched notes
  // distinguish a successful slash from propulsion even with the screen unseen.
  let noiseBuffer;
  function rush(duration, frequency, gain) {
    if (!enabled || context?.state !== 'running') return;
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * 0.28),
        context.sampleRate,
      );
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const src = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      env = context.createGain();
    const now = context.currentTime;
    src.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(frequency, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + duration);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(context.destination);
    src.start(now);
    src.stop(now + duration + 0.01);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      env.disconnect();
    };
  }
  // One contact voice per simulation beat. A Fork, its children, the shear
  // and a plated kill can all occur on the same tick: don't stack four copies
  // of the same chime. Hull loss takes precedence over a score reward.
  const rank = [
    'chip',
    'paper',
    'stock',
    'parry',
    'armor',
    'drive',
    'plate',
    'crown',
    'tear',
    'hurt',
    'break',
  ];
  let pending = null,
    heldTicks = 0;
  function strike(material, chain = 1) {
    if (!pending || rank.indexOf(material) >= rank.indexOf(pending.material))
      pending = { material, chain };
  }
  function flush() {
    if (!pending) return;
    const { material, chain } = pending;
    pending = null;
    const note = [523.25, 659.25, 783.99, 987.77, 1046.5][Math.min(4, Math.max(0, chain - 1))];
    switch (material) {
      case 'chip':
        tone(680, 510, 0.044, 'triangle', 0.031);
        break;
      case 'stock':
        // A dry rip followed by the low slap of the sheet folding over.
        rush(0.093, 4600, 0.18);
        tone(192, 55, 0.108, 'triangle', 0.125);
        tone(note * 1.5, note, 0.073, 'sine', 0.045, 0.021);
        break;
      case 'paper':
        rush(0.062, 4200, 0.12);
        tone(163, 62, 0.075, 'triangle', 0.085);
        tone(note * 1.08, note, 0.09, 'triangle', 0.042, 0.016);
        break;
      case 'armor':
        tone(705, 142, 0.085, 'square', 0.037);
        tone(177, 84, 0.09, 'triangle', 0.079);
        break;
      case 'plate':
      case 'crown':
        rush(0.12, 1510, 0.12);
        tone(material === 'crown' ? 128 : 176, 47, 0.18, 'triangle', 0.12);
        tone(336, 99, 0.1, 'square', 0.032, 0.035);
        break;
      case 'tear':
        rush(0.125, 5100, 0.16);
        tone(310, 930, 0.085, 'sawtooth', 0.037);
        tone(784, 786, 0.17, 'triangle', 0.081, 0.051);
        tone(1175, 1168, 0.21, 'sine', 0.066, 0.09);
        break;
      case 'parry':
        tone(880, 1450, 0.085, 'sine', 0.071);
        break;
      case 'drive':
        [392, 587, 784].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.057, i * 0.067));
        break;
      case 'hurt':
        rush(0.16, 1290, 0.18);
        tone(125, 34, 0.22, 'sawtooth', 0.09);
        break;
      case 'break':
        rush(0.23, 2300, 0.22);
        [160, 122, 83].forEach((f, i) => tone(f, f * 0.42, 0.25, 'triangle', 0.12, i * 0.075));
        break;
    }
  }
  return {
    get enabled() {
      return enabled;
    },
    unlock,
    toggle() {
      enabled = !enabled;
      try {
        localStorage.setItem('splatr.muted', enabled ? '0' : '1');
      } catch {
        /* optional */
      }
      if (enabled) {
        unlock();
        tone(430, 680, 0.1, 'sine', 0.04);
      } else if (context?.state === 'running') context.suspend().catch(() => {});
    },
    launch(power) {
      rush(0.09 + power * 0.045, 1850 + power * 1400, 0.105);
      tone(320 + power * 250, 65, 0.105, 'triangle', 0.034);
    },
    strike,
    flush,
    catchNet() {
      tone(138, 63, 0.19, 'triangle', 0.1);
      tone(92, 177, 0.15, 'sine', 0.048, 0.06);
    },
    /**
     * The floor's trampoline. A spring, not a bounce: a quick UP-sweep with a
     * soft body behind it, so the cube being thrown back into the air sounds
     * like something doing work rather than like a ball landing.
     *
     * `run.js` has emitted `floorKick` since the trampoline was built and
     * nothing ever listened, so the most frequent event in the game -- the thing
     * that keeps the player alive -- was silent.
     */
    spring(power = 1) {
      const p = Math.min(1, Math.max(0, power));
      // The sweep goes up in pitch: that rise is what reads as "lifted".
      tone(150 + p * 40, 420 + p * 130, 0.11, 'sine', 0.05);
      // A small thump under it so the kick has weight at low volume.
      tone(96, 58, 0.075, 'triangle', 0.062);
      // And a short bright tick at the top, which is the spring reaching its
      // stop. Quiet: this fires many times a run.
      tone(880 + p * 220, 660, 0.035, 'triangle', 0.019, 0.055);
    },
    zone() {
      [440, 660].forEach((f, i) => tone(f, f * 1.1, 0.18, 'triangle', 0.045, i * 0.1));
    },
    lock() {
      // A sharp, quiet two-step tick. It confirms a magnet catch without
      // pretending the target is already cut.
      tone(1560, 1560, 0.028, 'square', 0.019);
      tone(2340, 2340, 0.021, 'sine', 0.014, 0.031);
    },
    focus(active) {
      // Pointer-down alone is not a focus maneuver. Quick taps stay dry.
      if (!active) heldTicks = 0;
      else if (++heldTicks === 4) tone(450, 105, 0.19, 'sine', 0.065);
    },
    menu() {
      tone(345, 516, 0.07, 'triangle', 0.055);
    },
    beat(step, drive) {
      // Tick-scheduled, gesture-unlocked original eight-step battle loop. No
      // interval survives pause or hidden tabs. Music can be muted separately.
      const i = step % 8,
        bass = [55, 0, 65.4, 0, 55, 82.4, 0, 73.4][i];
      if (i % 2 === 0) tone(108, 39, 0.13, 'sine', 0.095);
      if (i === 2 || i === 6) rush(0.08, 2100, 0.08);
      if (bass) tone(bass, bass * 0.99, 0.16, 'triangle', 0.065);
      if (drive || i % 2) rush(0.04, 5800, 0.035);
    },
  };
}
