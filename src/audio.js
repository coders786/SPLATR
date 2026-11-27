// C-major pentatonic: C5 D5 E5 G5 A5. Long chains hold the top note.
export function chainNote(chain = 1) {
  return [523.25, 587.33, 659.25, 783.99, 880][
    Math.min(4, Math.max(0, Math.floor(Number(chain) || 1) - 1))
  ];
}

// Tiny procedural SFX bank. No audio files, decoding costs, autoplaying music,
// or sound requests before the visitor supplies a real user gesture.
export function createAudio({ muteKey = 'splatr.muted' } = {}) {
  const suspended=new Set();let disposed=false;
  let context,
    enabled = true;
  try {
    enabled = localStorage.getItem(muteKey) !== '1';
  } catch {
    /* private storage */
  }
  function unlock() {
    if (!enabled || suspended.size || disposed) return;
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
    if (!enabled || suspended.size || disposed || context?.state !== 'running') return;
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
    if (!enabled || suspended.size || disposed || context?.state !== 'running') return;
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * 0.28),
        context.sampleRate,
      );
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
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
    'spring',
    'drive',
    'plate',
    'crown',
    'tear',
    'hurt',
    'break',
  ];
  let pending = null,
    heldTicks = 0;
  function strike(material, chain = 1, style = 'razor') {
    if(disposed||suspended.size)return;
    if (!pending || rank.indexOf(material) >= rank.indexOf(pending.material))
      pending = { material, chain, style };
  }
  function flush() {
    if (!pending) return;
    const { material, chain, style } = pending;
    pending = null;
    if(style === 'glitch-fx') {tone(360,80,.07,'square',.018);rush(.035,1800,.025);}
    if(style === 'confetti') {tone(1046,1046,.09,'sine',.025);tone(1568,1568,.1,'sine',.015,.025);}
    if(style === 'comic') tone(160,60,.09,'triangle',.03);
    if(style === 'pixel') tone(880,220,.055,'square',.015);
    if(style === 'laser') tone(1450,260,.1,'sine',.025);
    if(style === 'katana') { tone(2700,900,.12,'triangle',.018); rush(.045,6500,.025); }
    const note = chainNote(chain);
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
      case 'spring':
        tone(330, 650, 0.055, 'triangle', 0.045);
        tone(180, 120, 0.045, 'square', 0.025, 0.035);
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
        [392, 587, 784].forEach((f, i) =>
          tone(f, f, 0.16, 'triangle', 0.057, i * 0.067),
        );
        break;
      case 'hurt':
        rush(0.16, 1290, 0.18);
        tone(125, 34, 0.22, 'sawtooth', 0.09);
        break;
      case 'break':
        rush(0.23, 2300, 0.22);
        [160, 122, 83].forEach((f, i) =>
          tone(f, f * 0.42, 0.25, 'triangle', 0.12, i * 0.075),
        );
        break;
    }
  }
  return {
    get enabled() {
      return enabled;
    },
    unlock,
    setSuspended(reason,on){
      if(on){suspended.add(reason);pending=null;}else suspended.delete(reason);
      if(!context||disposed)return;
      if(suspended.size)context.suspend().catch(()=>{});
      else if(enabled)context.resume().catch(()=>{});
    },
    dispose(){if(disposed)return;disposed=true;pending=null;Promise.resolve(context?.close?.()).catch(()=>{});},
    toggle() {
      enabled = !enabled;
      try {
        localStorage.setItem(muteKey, enabled ? '0' : '1');
      } catch {
        /* optional */
      }
      if (enabled) {
        unlock();
        tone(430, 680, 0.1, 'sine', 0.04);
      } else if (context?.state === 'running')
        context.suspend().catch(() => {});
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
    seamHit() {
      tone(360, 180, .07, 'triangle', .025);
    },
    shatter() {
      rush(.12, 2700, .065);
      [1100, 740, 420].forEach((f,i)=>tone(f, f*.55, .13, 'triangle', .035, i*.035));
    },
    zone() {
      [440, 660].forEach((f, i) =>
        tone(f, f * 1.1, 0.18, 'triangle', 0.045, i * 0.1),
      );
    },
    /**
     * CHUNK 1: the wave-clear chime. A rising three-note triad (C5 -> E5 -> G5),
     * brighter and more resolved than `zone`'s two-note step, so clearing a wave
     * reads as an accomplishment rather than a UI tick.
     */
    waveClear() {
      [523.25, 659.25, 783.99].forEach((f, i) =>
        tone(f, f, 0.22, 'triangle', 0.05, i * 0.085),
      );
      tone(1046.5, 1046.5, 0.34, 'sine', 0.028, 0.255);
    },
    /** CHUNK 6A §8.4: large fracture gains get a legible chime; ordinary
     * per-cut dust stays silent so the meter does not become a metronome. */
    fractureGain(amount = 0) {
      if (Number(amount) < 2.5) return;
      tone(392, 523.25, 0.12, 'triangle', 0.035);
      tone(659.25, 783.99, 0.16, 'sine', 0.028, 0.055);
    },
    /** Tier motifs descend into the seam instead of reusing the generic tremor. */
    fractureTier(tier = 1) {
      const t = Math.max(1, Math.min(3, Math.floor(tier) || 1));
      [220, 277.18, 329.63].slice(0, t).forEach((f, i) => tone(f, f * .92, .18, 'triangle', .025, i * .06));
      if (t >= 3) tone(110, 55, .42, 'sine', .045, .18);
    },
    /** The meter only calls this at the armed 100% edge, once per fill. */
    fractureHeartbeat() {
      tone(92, 68, .16, 'sine', .042);
      tone(92, 68, .16, 'sine', .032, .22);
    },
    /**
     * CHUNK 2: a TREMOR under the floor. One cue per fracture tier, played by
     * the shell on the run's own clock while the tier holds — never on a
     * wall-clock timer that survives pause. Tier 1 knocks somewhere far away,
     * tier 2 settles rubble on top of it, tier 3 is the collapse: a sub-bass
     * drop with one high wire still singing.
     */
    tremor(tier = 1) {
      const t = Math.max(1, Math.min(3, Math.floor(tier) || 1));
      tone(58 - t * 7, 36, 0.8 + t * 0.3, 'sine', 0.03 + t * 0.014);
      rush(0.16 + t * 0.07, 180 + t * 140, 0.012 + t * 0.012);
      if (t >= 2) tone(96, 49, 0.34, 'triangle', 0.028, 0.06);
      if (t >= 3) tone(1730, 1640, 0.09, 'triangle', 0.011, 0.16);
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
    beat(step, drive, world = 'twilight') {
      // Tick-scheduled, gesture-unlocked original eight-step battle loop. No
      // interval survives pause or hidden tabs. Music can be muted separately.
      if(world==='void'){if(step%8===0)tone(55,54,.12,'sine',.025);return;}
      if(world==='manga'){if(step%4===0)rush(.035,1100,.025);return;}
      if(world==='synth' && step%2===0)tone([220,277.18,329.63,440][Math.floor(step/2)%4],220,.13,'triangle',.025);
      const i = step % 8,
        bass = [55, 0, 65.4, 0, 55, 82.4, 0, 73.4][i];
      if (i % 2 === 0) tone(108, 39, 0.13, 'sine', 0.095);
      if (i === 2 || i === 6) rush(0.08, 2100, 0.08);
      if (bass) tone(bass*(world==='foundry'?.5:1), bass*(world==='foundry'?.495:.99), world==='foundry'?.22:.16, 'triangle', 0.065);
      if (drive || i % 2) rush(0.04, 5800, 0.035);
    },
  };
}
