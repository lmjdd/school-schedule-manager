/**
 * Ambient Sound Engine using Web Audio API
 * All sounds are generated programmatically — no external audio files needed.
 */

export type SoundType = 'rain' | 'ocean' | 'coffee' | 'fireplace' | 'white_noise';

export interface SoundOption {
  id: SoundType;
  label: string;
  emoji: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'rain', label: '雨声', emoji: '🌧️' },
  { id: 'ocean', label: '海浪', emoji: '🌊' },
  { id: 'coffee', label: '咖啡厅', emoji: '☕' },
  { id: 'fireplace', label: '壁炉', emoji: '🔥' },
  { id: 'white_noise', label: '白噪音', emoji: '🎵' },
];

/** Creates a noise buffer of a given type */
function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'brown' | 'pink', duration = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      // Clamp
      data[i] = Math.max(-1, Math.min(1, data[i] * 3.5));
    }
  } else {
    // Pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

export interface ActiveSound {
  ctx: AudioContext;
  nodes: AudioNode[];
  gainNode: GainNode;
  sources: AudioBufferSourceNode[];
  oscillators: OscillatorNode[];
  intervals: ReturnType<typeof setInterval>[];
}

/**
 * Start playing an ambient sound.
 * Returns an ActiveSound object that can be used to stop or change volume.
 */
export function startSound(type: SoundType, volume: number = 0.5): ActiveSound {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);

  const nodes: AudioNode[] = [masterGain];
  const sources: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  switch (type) {
    case 'rain':
      createRain(ctx, masterGain, sources, nodes);
      break;
    case 'ocean':
      createOcean(ctx, masterGain, sources, nodes, intervals);
      break;
    case 'coffee':
      createCoffee(ctx, masterGain, sources, nodes);
      break;
    case 'fireplace':
      createFireplace(ctx, masterGain, sources, nodes, intervals);
      break;
    case 'white_noise':
      createWhiteNoise(ctx, masterGain, sources, nodes);
      break;
  }

  return { ctx, nodes, gainNode: masterGain, sources, oscillators, intervals };
}

/** Set volume on an active sound */
export function setSoundVolume(sound: ActiveSound, volume: number) {
  sound.gainNode.gain.setValueAtTime(volume, sound.ctx.currentTime);
}

/** Stop all nodes and close the context */
export function stopSound(sound: ActiveSound) {
  // Clear intervals
  for (const interval of sound.intervals) {
    clearInterval(interval);
  }
  // Stop sources
  for (const src of sound.sources) {
    try { src.stop(); } catch { /* already stopped */ }
  }
  // Stop oscillators
  for (const osc of sound.oscillators) {
    try { osc.stop(); } catch { /* already stopped */ }
  }
  // Close context
  try { sound.ctx.close(); } catch { /* already closed */ }
}

// ============ Sound Generators ============

/** 🌧️ Rain: white noise → low-pass filter (cutoff 400Hz) */
function createRain(
  ctx: AudioContext,
  master: GainNode,
  sources: AudioBufferSourceNode[],
  nodes: AudioNode[],
) {
  // White noise → low-pass filter (400Hz) → gain → master
  const buffer = createNoiseBuffer(ctx, 'white', 4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 1;
  const gain = ctx.createGain();
  gain.gain.value = 0.8;

  filter.connect(gain);
  gain.connect(master);
  nodes.push(filter, gain);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(filter);
  src.start();
  sources.push(src);

  // Additional high-frequency layer for raindrop texture
  const buffer2 = createNoiseBuffer(ctx, 'white', 3);
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 3000;
  const gain2 = ctx.createGain();
  gain2.gain.value = 0.15;
  hpf.connect(gain2);
  gain2.connect(master);
  nodes.push(hpf, gain2);

  const src2 = ctx.createBufferSource();
  src2.buffer = buffer2;
  src2.loop = true;
  src2.connect(hpf);
  src2.start();
  sources.push(src2);
}

/** 🌊 Ocean: brown noise → LFO modulated gain */
function createOcean(
  ctx: AudioContext,
  master: GainNode,
  sources: AudioBufferSourceNode[],
  nodes: AudioNode[],
  intervals: ReturnType<typeof setInterval>[],
) {
  // Brown noise → low-pass → gain modulated by LFO → master
  const buffer = createNoiseBuffer(ctx, 'brown', 4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  const waveGain = ctx.createGain();
  waveGain.gain.value = 0.6;

  filter.connect(waveGain);
  waveGain.connect(master);
  nodes.push(filter, waveGain);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(filter);
  src.start();
  sources.push(src);

  // LFO to modulate gain for wave-like effect
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Very slow
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.3;
  lfo.connect(lfoGain);
  lfoGain.connect(waveGain.gain);
  lfo.start();
  nodes.push(lfo, lfoGain);

  // Periodic "whoosh" using gain modulation
  const whooshInterval = setInterval(() => {
    if (ctx.state === 'closed') return;
    const now = ctx.currentTime;
    waveGain.gain.setValueAtTime(0.3, now);
    waveGain.gain.linearRampToValueAtTime(0.8, now + 2);
    waveGain.gain.linearRampToValueAtTime(0.2, now + 4);
    waveGain.gain.linearRampToValueAtTime(0.6, now + 6);
  }, 6000);
  intervals.push(whooshInterval);
}

/** ☕ Coffee shop: brown noise → bandpass filter (200-2000Hz) */
function createCoffee(
  ctx: AudioContext,
  master: GainNode,
  sources: AudioBufferSourceNode[],
  nodes: AudioNode[],
) {
  // Brown noise → bandpass filter (center ~600Hz, covering 200-2000Hz range) → master
  const buffer = createNoiseBuffer(ctx, 'brown', 4);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.3;
  const gain1 = ctx.createGain();
  gain1.gain.value = 0.5;

  bp.connect(gain1);
  gain1.connect(master);
  nodes.push(bp, gain1);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(bp);
  src.start();
  sources.push(src);

  // Mid-range chatter layer (higher-pitched filtered noise for murmur effect)
  const buffer2 = createNoiseBuffer(ctx, 'pink', 3);
  const bp2 = ctx.createBiquadFilter();
  bp2.type = 'bandpass';
  bp2.frequency.value = 1200;
  bp2.Q.value = 0.8;
  const gain2 = ctx.createGain();
  gain2.gain.value = 0.15;

  bp2.connect(gain2);
  gain2.connect(master);
  nodes.push(bp2, gain2);

  const src2 = ctx.createBufferSource();
  src2.buffer = buffer2;
  src2.loop = true;
  src2.connect(bp2);
  src2.start();
  sources.push(src2);

  // Murmur-like amplitude modulation
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 3;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(gain2.gain);
  lfo.start();
  nodes.push(lfo, lfoGain);
}

/** 🔥 Fireplace: amplitude-modulated noise */
function createFireplace(
  ctx: AudioContext,
  master: GainNode,
  sources: AudioBufferSourceNode[],
  nodes: AudioNode[],
  intervals: ReturnType<typeof setInterval>[],
) {
  // Crackling noise: filtered noise with random gain modulation
  const buffer = createNoiseBuffer(ctx, 'brown', 4);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 400;
  bp.Q.value = 1;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.6;

  bp.connect(crackleGain);
  crackleGain.connect(master);
  nodes.push(bp, crackleGain);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(bp);
  src.start();
  sources.push(src);

  // Simulate crackling with random gain spikes (amplitude modulation)
  const crackleInterval = setInterval(() => {
    if (ctx.state === 'closed') return;
    const now = ctx.currentTime;
    const spikes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < spikes; i++) {
      const t = now + i * (0.05 + Math.random() * 0.15);
      const intensity = 0.3 + Math.random() * 0.7;
      crackleGain.gain.setValueAtTime(crackleGain.gain.value, t);
      crackleGain.gain.linearRampToValueAtTime(intensity, t + 0.01);
      crackleGain.gain.exponentialRampToValueAtTime(0.3, t + 0.05 + Math.random() * 0.1);
    }
  }, 300);
  intervals.push(crackleInterval);

  // Low rumble layer
  const rumbleBuffer = createNoiseBuffer(ctx, 'brown', 6);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 150;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.25;

  lp.connect(rumbleGain);
  rumbleGain.connect(master);
  nodes.push(lp, rumbleGain);

  const rumbleSrc = ctx.createBufferSource();
  rumbleSrc.buffer = rumbleBuffer;
  rumbleSrc.loop = true;
  rumbleSrc.connect(lp);
  rumbleSrc.start();
  sources.push(rumbleSrc);
}

/** 🎵 White noise: plain white noise */
function createWhiteNoise(
  ctx: AudioContext,
  master: GainNode,
  sources: AudioBufferSourceNode[],
  nodes: AudioNode[],
) {
  const buffer = createNoiseBuffer(ctx, 'white', 2);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(master);
  src.start();
  sources.push(src);
}
