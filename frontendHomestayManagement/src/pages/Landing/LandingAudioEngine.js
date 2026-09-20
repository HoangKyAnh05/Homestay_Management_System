/* ==========================================================================
   LÁ ĐỎ HOMESTAY - ULTRA HIGH-FIDELITY PROCEDURAL ZEN AUDIO SYNTHESIZER
   Cinematic Zen Symphony, Bamboo Stream & Chimes, Warm Campfire, Misty Rain
   Features:
   - 432Hz Healing Base & Binaural Theta Relax Wave (4.5Hz)
   - Lush Minor Pentatonic Ambient Pad Symphony (Dm9, BbMaj7, Cadd9, FMaj9)
   - Generative Asian Harp / Kalimba / Tibetan Singing Bowl Arpeggios
   - Natural Organic Physics for Stream, Campfire Crackle & Rain Droplets
   - Multi-Channel Real-time Mixer with Independent Gain Routing
   - Web Audio Analyser for Real-time Reactive Equalizer UI
   ========================================================================== */

export class ZenAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.analyser = null;
    this.volume = 0.7;

    // Layer gain nodes and state
    this.layers = {
      cinematic: { active: true, volume: 0.65, gain: null, nodes: [], intervalIds: [] },
      breeze: { active: true, volume: 0.55, gain: null, nodes: [], intervalIds: [] },
      fire: { active: false, volume: 0.40, gain: null, nodes: [], intervalIds: [] },
      rain: { active: false, volume: 0.40, gain: null, nodes: [], intervalIds: [] }
    };

    this.reverbNode = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Realtime Analyser for UI Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Generate lush algorithmic mountain reverb impulse response
      this.createReverb();

      // Initialize layer gain nodes
      Object.keys(this.layers).forEach((key) => {
        const layer = this.layers[key];
        layer.gain = this.ctx.createGain();
        const initialGain = layer.active ? layer.volume : 0;
        layer.gain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
        layer.gain.connect(this.masterGain);
      });
    } catch (e) {
      console.warn('ZenAudioEngine initialization failed:', e);
    }
  }

  /* Create synthetic impulse response for cathedral / valley reverb */
  createReverb() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 3.5; // 3.5 seconds lush decay
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.95));
      left[i] = (Math.random() * 2 - 1) * decay * 0.4;
      right[i] = (Math.random() * 2 - 1) * decay * 0.4;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  playAllActive() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stop();
    this.isPlaying = true;

    // Start all configured layers
    if (this.layers.cinematic.active) this.startCinematicPad();
    if (this.layers.breeze.active) this.startForestStream();
    if (this.layers.fire.active) this.startFireHearth();
    if (this.layers.rain.active) this.startMistyRain();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.playAllActive();
      return true;
    }
  }

  stop() {
    Object.keys(this.layers).forEach((key) => {
      this.stopLayer(key);
    });
    this.isPlaying = false;
  }

  stopLayer(layerId) {
    const layer = this.layers[layerId];
    if (!layer) return;

    layer.intervalIds.forEach((id) => clearInterval(id));
    layer.intervalIds = [];

    layer.nodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    layer.nodes = [];
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
      } catch (e) {}
    }
  }

  setLayerActive(layerId, active) {
    const layer = this.layers[layerId];
    if (!layer) return;
    layer.active = Boolean(active);

    if (this.ctx && layer.gain) {
      const targetGain = layer.active ? layer.volume : 0.0001;
      try {
        layer.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.15);
      } catch (e) {}
    }

    if (this.isPlaying) {
      if (layer.active && layer.nodes.length === 0) {
        if (layerId === 'cinematic') this.startCinematicPad();
        else if (layerId === 'breeze') this.startForestStream();
        else if (layerId === 'fire') this.startFireHearth();
        else if (layerId === 'rain') this.startMistyRain();
      } else if (!layer.active && layer.nodes.length > 0) {
        // Smoothly stop after fade
        setTimeout(() => {
          if (!layer.active) this.stopLayer(layerId);
        }, 300);
      }
    }
  }

  setLayerVolume(layerId, vol) {
    const layer = this.layers[layerId];
    if (!layer) return;
    layer.volume = Math.max(0, Math.min(1, vol));

    if (this.ctx && layer.gain && layer.active) {
      try {
        layer.gain.gain.setTargetAtTime(layer.volume, this.ctx.currentTime, 0.05);
      } catch (e) {}
    }
  }

  /* =========================================================================
     1. LAYER 1: CINEMATIC ZEN SANCTUARY AMBIENT SYMPHONY
     - Healing 432Hz base drone
     - 4.5Hz Theta Binaural relaxation pulse
     - Lush Asian Pentatonic chord swells (Dm9 -> BbMaj7 -> Cadd9 -> FMaj9)
     - Generative Crystal Bell & Harp sparkles
     ========================================================================= */
  startCinematicPad() {
    if (!this.ctx) return;
    const layer = this.layers.cinematic;
    const now = this.ctx.currentTime;

    // A. 432Hz Deep Healing Drone + 4.5Hz Theta Wave Binaural Beat
    const baseFreq = 108.0; // Low warm A2 (432Hz subharmonic)
    const oscLeft = this.ctx.createOscillator();
    const oscRight = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, now);
    oscRight.frequency.setValueAtTime(baseFreq + 4.5, now); // 4.5Hz Theta wave

    const panLeft = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panRight = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panLeft) panLeft.pan.setValueAtTime(-0.8, now);
    if (panRight) panRight.pan.setValueAtTime(0.8, now);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.exponentialRampToValueAtTime(0.18, now + 3.0);

    if (panLeft && panRight) {
      oscLeft.connect(panLeft);
      panLeft.connect(droneGain);
      oscRight.connect(panRight);
      panRight.connect(droneGain);
    } else {
      oscLeft.connect(droneGain);
      oscRight.connect(droneGain);
    }

    droneGain.connect(layer.gain);
    if (this.reverbNode) droneGain.connect(this.reverbNode);

    oscLeft.start(now);
    oscRight.start(now);
    layer.nodes.push(oscLeft, oscRight, droneGain);

    // B. Lush Cinematic Chord Progression (Chords cycle gently every 8 seconds)
    // Scale: Sa Pa Mist Minor Pentatonic (D, F, G, A, C)
    const chordProgressions = [
      [146.83, 220.00, 261.63, 329.63], // Dm9 (D3, A3, C4, E4)
      [116.54, 233.08, 293.66, 349.23], // BbMaj7 (Bb2, Bb3, D4, F4)
      [130.81, 196.00, 261.63, 293.66], // Cadd9 (C3, G3, C4, D4)
      [174.61, 261.63, 329.63, 392.00], // FMaj9 (F3, C4, E4, G4)
    ];

    let chordIdx = 0;
    const playNextPadChord = () => {
      if (!this.isPlaying || !layer.active || !this.ctx) return;
      const chord = chordProgressions[chordIdx % chordProgressions.length];
      chordIdx++;

      const cNow = this.ctx.currentTime;
      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(320, cNow);
      padFilter.frequency.exponentialRampToValueAtTime(750, cNow + 3.5);
      padFilter.frequency.exponentialRampToValueAtTime(280, cNow + 7.8);

      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.0001, cNow);
      chordGain.gain.exponentialRampToValueAtTime(0.12, cNow + 2.8);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, cNow + 7.9);

      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        // Slight organic detune
        osc.frequency.setValueAtTime(freq + (Math.random() * 0.8 - 0.4), cNow);
        osc.connect(padFilter);
        osc.start(cNow);
        osc.stop(cNow + 8.0);
      });

      padFilter.connect(chordGain);
      chordGain.connect(layer.gain);
      if (this.reverbNode) chordGain.connect(this.reverbNode);
    };

    playNextPadChord();
    const chordInterval = setInterval(playNextPadChord, 7800);
    layer.intervalIds.push(chordInterval);

    // C. Generative Kalimba / Asian Crystal Harp Melody Sparkles
    const melodyNotes = [
      440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
    ]; // A4, C5, D5, E5, G5, A5, C6 (High shimmer)

    const playArpNote = () => {
      if (!this.isPlaying || !layer.active || !this.ctx || Math.random() > 0.65) return;
      const mNow = this.ctx.currentTime;
      const freq = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];

      const mOsc = this.ctx.createOscillator();
      const mOscHarmonic = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();

      mOsc.type = 'sine';
      mOscHarmonic.type = 'triangle';
      mOsc.frequency.setValueAtTime(freq, mNow);
      mOscHarmonic.frequency.setValueAtTime(freq * 2.01, mNow);

      mGain.gain.setValueAtTime(0.0001, mNow);
      mGain.gain.exponentialRampToValueAtTime(0.055, mNow + 0.04);
      mGain.gain.exponentialRampToValueAtTime(0.0001, mNow + 2.8);

      mOsc.connect(mGain);
      mOscHarmonic.connect(mGain);
      mGain.connect(layer.gain);
      if (this.reverbNode) mGain.connect(this.reverbNode);

      mOsc.start(mNow);
      mOscHarmonic.start(mNow);
      mOsc.stop(mNow + 3.0);
      mOscHarmonic.stop(mNow + 3.0);
    };

    const arpInterval = setInterval(playArpNote, 2400);
    layer.intervalIds.push(arpInterval);
  }

  /* =========================================================================
     2. LAYER 2: FOREST STREAM & BAMBOO CHIMES (Suối Rừng & Chuông Trúc)
     - Organic bubbling mountain brook with multi-band resonant filtration
     - Soft breeze sighing through pine needles
     - Physical resonant bamboo wind chime bells
     ========================================================================= */
  startForestStream() {
    if (!this.ctx) return;
    const layer = this.layers.breeze;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = noiseBuffer.getChannelData(0);
    const right = noiseBuffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      left[i] = Math.random() * 2 - 1;
      right[i] = Math.random() * 2 - 1;
    }

    const streamSource = this.ctx.createBufferSource();
    streamSource.buffer = noiseBuffer;
    streamSource.loop = true;

    // Resonant water filters
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter1.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(900, this.ctx.currentTime);

    const streamGain = this.ctx.createGain();
    streamGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

    // LFO for organic water bubbling motion
    const waterLfo = this.ctx.createOscillator();
    waterLfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    const waterLfoGain = this.ctx.createGain();
    waterLfoGain.gain.setValueAtTime(160, this.ctx.currentTime);

    waterLfo.connect(waterLfoGain);
    waterLfoGain.connect(filter1.frequency);

    streamSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(streamGain);
    streamGain.connect(layer.gain);

    streamSource.start();
    waterLfo.start();
    layer.nodes.push(streamSource, filter1, filter2, waterLfo, waterLfoGain, streamGain);

    // Bamboo Chimes with dual harmonic decay
    const chimeFrequencies = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99]; // E, G, B, D, E, G
    const chimeInterval = setInterval(() => {
      if (!this.isPlaying || !layer.active || !this.ctx || Math.random() > 0.45) return;
      const cNow = this.ctx.currentTime;
      const freq = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];

      const osc = this.ctx.createOscillator();
      const oscOver = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();

      osc.type = 'sine';
      oscOver.type = 'triangle';
      osc.frequency.setValueAtTime(freq, cNow);
      oscOver.frequency.setValueAtTime(freq * 2.76, cNow); // Natural bamboo non-harmonic overtone

      cGain.gain.setValueAtTime(0.0001, cNow);
      cGain.gain.exponentialRampToValueAtTime(0.06, cNow + 0.02);
      cGain.gain.exponentialRampToValueAtTime(0.0001, cNow + 3.8);

      osc.connect(cGain);
      oscOver.connect(cGain);
      cGain.connect(layer.gain);
      if (this.reverbNode) cGain.connect(this.reverbNode);

      osc.start(cNow);
      oscOver.start(cNow);
      osc.stop(cNow + 4.0);
      oscOver.stop(cNow + 4.0);
    }, 3800);

    layer.intervalIds.push(chimeInterval);
  }

  /* =========================================================================
     3. LAYER 3: PINE FIREPLACE CAMPFIRE HEARTH (Lửa Trại Đêm 15°C)
     - Warm low wood burning rumble (55Hz sub warmth)
     - Randomized pine resin snap, pop, and ember crackles
     ========================================================================= */
  startFireHearth() {
    if (!this.ctx) return;
    const layer = this.layers.fire;
    const now = this.ctx.currentTime;

    // Sub rumble
    const rumbleOsc = this.ctx.createOscillator();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(62, now);

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.22, now);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(layer.gain);

    rumbleOsc.start(now);
    layer.nodes.push(rumbleOsc, rumbleFilter, rumbleGain);

    // Pine resin crackle pops
    const fireInterval = setInterval(() => {
      if (!this.isPlaying || !layer.active || !this.ctx) return;
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const pNow = this.ctx.currentTime + Math.random() * 0.12;
        const popOsc = this.ctx.createOscillator();
        const popFilter = this.ctx.createBiquadFilter();
        const pGain = this.ctx.createGain();

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(Math.random() * 2400 + 900, pNow);
        popFilter.Q.setValueAtTime(12, pNow);

        const popVolume = Math.random() * 0.09 + 0.03;
        pGain.gain.setValueAtTime(popVolume, pNow);
        pGain.gain.exponentialRampToValueAtTime(0.0001, pNow + 0.032);

        popOsc.connect(popFilter);
        popFilter.connect(pGain);
        pGain.connect(layer.gain);

        popOsc.start(pNow);
        popOsc.stop(pNow + 0.035);
      }
    }, 220);

    layer.intervalIds.push(fireInterval);
  }

  /* =========================================================================
     4. LAYER 4: MISTY MOUNTAIN RAIN & ROOF DROPLETS (Mưa Sương Sa Pa)
     - Soft continuous mist rain atmosphere
     - Isolated water droplets pinging softly on wooden balcony eaves
     ========================================================================= */
  startMistyRain() {
    if (!this.ctx) return;
    const layer = this.layers.rain;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(820, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(layer.gain);

    rainSource.start();
    layer.nodes.push(rainSource, rainFilter, rainGain);

    // Individual water droplets on roof tiles
    const dropInterval = setInterval(() => {
      if (!this.isPlaying || !layer.active || !this.ctx || Math.random() > 0.5) return;
      const dNow = this.ctx.currentTime;
      const dropFreq = Math.random() * 600 + 1200;

      const dropOsc = this.ctx.createOscillator();
      const dGain = this.ctx.createGain();

      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(dropFreq, dNow);
      dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.4, dNow + 0.045);

      dGain.gain.setValueAtTime(0.035, dNow);
      dGain.gain.exponentialRampToValueAtTime(0.0001, dNow + 0.05);

      dropOsc.connect(dGain);
      dGain.connect(layer.gain);
      if (this.reverbNode) dGain.connect(this.reverbNode);

      dropOsc.start(dNow);
      dropOsc.stop(dNow + 0.055);
    }, 450);

    layer.intervalIds.push(dropInterval);
  }

  /* Realtime Analyser Data for UI frequency bars */
  getAnalyserData() {
    if (!this.analyser) return null;
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }

  /* Mechanical subtle UI click */
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
