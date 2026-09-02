/* ==========================================================================
   PROCEDURAL WEB AUDIO SYNTHESIZER
   Natural Soundscapes: Forest Breeze, Fireplace Crackle, Mountain Rain
   ========================================================================== */

export class ZenAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentTrack = 'breeze';
    this.masterGain = null;
    this.volume = 0.7;
    this.nodes = [];
    this.intervalIds = [];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext failed to initialize', e);
    }
  }

  toggle() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(this.currentTrack);
      return true;
    }
  }

  play(trackName = 'breeze') {
    this.init();
    if (!this.ctx) return;
    this.stop();
    this.currentTrack = trackName;
    this.isPlaying = true;

    if (trackName === 'breeze') {
      this.startBreeze();
    } else if (trackName === 'fire') {
      this.startFire();
    } else if (trackName === 'rain') {
      this.startRain();
    }
  }

  stop() {
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds = [];

    this.nodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
    this.isPlaying = false;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
      } catch (e) {}
    }
  }

  /* 1. Forest Breeze & Bamboo Bell Chimes */
  startBreeze() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.nodes.push(whiteNoise, filter, lfo, lfoGain, windGain);

    const notes = [369.99, 415.30, 493.88, 554.37, 622.25, 739.99];
    const chimeInterval = setInterval(() => {
      if (!this.isPlaying || Math.random() > 0.4 || !this.ctx) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.3);
    }, 4500);

    this.intervalIds.push(chimeInterval);
  }

  /* 2. Pine Fireplace Hearth Crackle */
  startFire() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(120, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    osc.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    osc.start();
    this.nodes.push(osc, lowpass, rumbleGain);

    const crackleInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const numPops = Math.floor(Math.random() * 4);
      for (let p = 0; p < numPops; p++) {
        const now = this.ctx.currentTime + Math.random() * 0.15;
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        const popFilter = this.ctx.createBiquadFilter();

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(Math.random() * 2000 + 800, now);
        popFilter.Q.setValueAtTime(8, now);

        popGain.gain.setValueAtTime(0.08, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain);

        popOsc.start(now);
        popOsc.stop(now + 0.04);
      }
    }, 280);

    this.intervalIds.push(crackleInterval);
  }

  /* 3. Mountain Night Rain */
  startRain() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.nodes.push(whiteNoise, filter, rainGain);
  }

  /* 4. Subtle Organic Mechanical Click */
  playClick(freq = 800) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.038);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}
