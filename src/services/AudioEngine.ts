import { AUDIO_CONFIG, SENTINEL_PROTOCOLS } from '../constants';

type SentinelProtocol = keyof typeof SENTINEL_PROTOCOLS;

interface PositionalSource {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: PannerNode;
}

class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  // Drone Layers
  private drones: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;

  // Binaural Layers
  private binauralLeft: OscillatorNode | null = null;
  private binauralRight: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;

  // Isochronic Layers
  private isochronicOscillator: OscillatorNode | null = null;
  private isochronicGain: GainNode | null = null;
  private isochronicModulator: OscillatorNode | null = null;
  private isochronicModGain: GainNode | null = null;

  // Noise Layers
  private pinkNoiseNode: AudioBufferSourceNode | null = null;
  private pinkNoiseGain: GainNode | null = null;
  private brownNoiseNode: AudioBufferSourceNode | null = null;
  private brownNoiseGain: GainNode | null = null;

  // Reverb
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Spatial Audio
  private positionalSources: Map<string, PositionalSource> = new Map();

  // State Tracking
  private isRunning = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init(): boolean {
    if (this.ctx) return true;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Chain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime); // Start silent

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(AUDIO_CONFIG.FILTER_MAX, this.ctx.currentTime);

      this.masterGain.connect(this.ctx.destination);
      this.filter.connect(this.masterGain);

      // Initialize Layers
      this.setupDroneLayer();
      this.setupBinauralLayer();
      this.setupIsochronicLayer();
      this.setupReverb(); // Must be before Noise so Noise can route to it if desired
      this.setupNoiseLayer();

      return true;
    } catch (e) {
      console.error('Web Audio API not supported:', e);
      return false;
    }
  }

  private setupDroneLayer() {
    if (!this.ctx || !this.filter) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.droneGain.connect(this.filter);

    // Create 3 oscillators for a thick drone
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle'; // Mix of textures
      osc.start();
      osc.connect(this.droneGain);
      this.drones.push(osc);
    }
  }

  private setupBinauralLayer() {
    if (!this.ctx || !this.masterGain) return; // Binaural bypasses filter for clarity

    this.binauralGain = this.ctx.createGain();
    this.binauralGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.binauralGain.connect(this.masterGain);

    // Left Channel
    const pannerL = this.ctx.createStereoPanner();
    pannerL.pan.value = -1;
    this.binauralLeft = this.ctx.createOscillator();
    this.binauralLeft.type = 'sine';
    this.binauralLeft.start();
    this.binauralLeft.connect(pannerL);
    pannerL.connect(this.binauralGain);

    // Right Channel
    const pannerR = this.ctx.createStereoPanner();
    pannerR.pan.value = 1;
    this.binauralRight = this.ctx.createOscillator();
    this.binauralRight.type = 'sine';
    this.binauralRight.start();
    this.binauralRight.connect(pannerR);
    pannerR.connect(this.binauralGain);
  }

  private setupIsochronicLayer() {
    if (!this.ctx || !this.masterGain) return;

    // Carrier Chain: IsoOsc -> IsoGain -> MasterGain
    this.isochronicGain = this.ctx.createGain();
    // Start with 0 volume, modulated up
    this.isochronicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.isochronicGain.connect(this.masterGain);

    this.isochronicOscillator = this.ctx.createOscillator();
    this.isochronicOscillator.type = 'sine';
    this.isochronicOscillator.frequency.setValueAtTime(AUDIO_CONFIG.BINAURAL_BASE_FREQ, this.ctx.currentTime);
    this.isochronicOscillator.start();
    this.isochronicOscillator.connect(this.isochronicGain);

    // Modulation Chain: Modulator -> ModGain -> IsoGain.gain
    // Math: gain = (sin(t) * 0.5) + 0.5 -> Ranges 0 to 1
    this.isochronicModGain = this.ctx.createGain();
    this.isochronicModGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // Connect ModGain to IsoGain.gain (AudioParam)
    this.isochronicModGain.connect(this.isochronicGain.gain);

    // Bias (Offset): ConstantSource -> IsoGain.gain
    const bias = this.ctx.createConstantSource();
    bias.offset.setValueAtTime(0.5, this.ctx.currentTime);
    bias.start();
    bias.connect(this.isochronicGain.gain);

    this.isochronicModulator = this.ctx.createOscillator();
    this.isochronicModulator.type = 'sine';
    this.isochronicModulator.frequency.setValueAtTime(10, this.ctx.currentTime); // Default Alpha
    this.isochronicModulator.start();
    this.isochronicModulator.connect(this.isochronicModGain);
  }

  private setupReverb() {
    if (!this.ctx || !this.masterGain) return;

    // Create Convolver
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(
        AUDIO_CONFIG.REVERB.DURATION,
        AUDIO_CONFIG.REVERB.DECAY
    );

    // Reverb Gain (Wet Mix)
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(AUDIO_CONFIG.REVERB.MIX, this.ctx.currentTime);

    // Route: Convolver -> ReverbGain -> Master
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  private setupNoiseLayer() {
    if (!this.ctx || !this.masterGain) return;

    // Pink Noise
    this.pinkNoiseGain = this.ctx.createGain();
    this.pinkNoiseGain.gain.setValueAtTime(AUDIO_CONFIG.NOISE.PINK_VOLUME_MIN, this.ctx.currentTime);

    // Connect to Master (Dry) and Reverb (Wet) if available
    this.pinkNoiseGain.connect(this.masterGain);
    if (this.convolver) {
        this.pinkNoiseGain.connect(this.convolver);
    }

    const pinkBuffer = this.createNoiseBuffer('pink');
    if (pinkBuffer) {
        this.pinkNoiseNode = this.ctx.createBufferSource();
        this.pinkNoiseNode.buffer = pinkBuffer;
        this.pinkNoiseNode.loop = true;
        this.pinkNoiseNode.start();
        this.pinkNoiseNode.connect(this.pinkNoiseGain);
    }

    // Brown Noise
    this.brownNoiseGain = this.ctx.createGain();
    this.brownNoiseGain.gain.setValueAtTime(AUDIO_CONFIG.NOISE.BROWN_VOLUME_MIN, this.ctx.currentTime);

    this.brownNoiseGain.connect(this.masterGain);
    if (this.convolver) {
        this.brownNoiseGain.connect(this.convolver);
    }

    const brownBuffer = this.createNoiseBuffer('brown');
    if (brownBuffer) {
        this.brownNoiseNode = this.ctx.createBufferSource();
        this.brownNoiseNode.buffer = brownBuffer;
        this.brownNoiseNode.loop = true;
        this.brownNoiseNode.start();
        this.brownNoiseNode.connect(this.brownNoiseGain);
    }
  }

  private createNoiseBuffer(type: 'pink' | 'brown'): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // State variables for noise generation
    let lastOut = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (type === 'pink') {
            // Paul Kellett's refined method for Pink Noise
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168981;

            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // Compensate gain
            b6 = white * 0.115926;
        } else {
            // Brown Noise (1/f^2) - Integrate White Noise
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut;
            data[i] *= 3.5; // Compensate gain
        }
    }
    return buffer;
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        const decayVal = Math.pow(n / length, decay);
        left[i] = (Math.random() * 2 - 1) * decayVal;
        right[i] = (Math.random() * 2 - 1) * decayVal;
    }
    return impulse;
  }

  public async start(initialVolume: number) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.isRunning) {
      this.isRunning = true;
      this.fadeIn(initialVolume);
    }
  }

  public stop() {
    if (!this.ctx) return;
    this.ctx.suspend();
    this.isRunning = false;
  }

  private fadeIn(targetVolume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.setTargetAtTime(targetVolume, now, AUDIO_CONFIG.RAMP_TIME);
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(volume, now, 0.1);
  }

  public update(stress: number, protocol: SentinelProtocol, entrainmentFreq: number) {
    if (!this.ctx || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const rampTime = 2.0; // Smooth transitions

    // 1. Update Filter based on Stress (More stress = Lower cutoff/Muffled or Higher Dissonance)
    // Let's implement: High Stress = Muffled (Closed in)
    if (this.filter) {
      const targetCutoff = AUDIO_CONFIG.FILTER_MAX - (stress * (AUDIO_CONFIG.FILTER_MAX - AUDIO_CONFIG.FILTER_MIN));
      this.filter.frequency.setTargetAtTime(targetCutoff, now, 0.5);
    }

    // 2. Update Drone Frequencies based on Protocol
    if (this.drones.length === 3) {
      const config = AUDIO_CONFIG.PROTOCOLS[protocol];

      // Root
      this.drones[0].frequency.setTargetAtTime(config.root, now, rampTime);
      // Harmonics
      this.drones[1].frequency.setTargetAtTime(config.root * config.harmonics[0], now, rampTime);
      this.drones[2].frequency.setTargetAtTime(config.root * config.harmonics[1], now, rampTime);
    }

    // 3. Update Binaural Beats
    if (this.binauralLeft && this.binauralRight) {
        const base = AUDIO_CONFIG.BINAURAL_BASE_FREQ;
        // Left = Base
        this.binauralLeft.frequency.setTargetAtTime(base, now, rampTime);
        // Right = Base + Entrainment Frequency (e.g. 200 + 10 = 210Hz)
        this.binauralRight.frequency.setTargetAtTime(base + entrainmentFreq, now, rampTime);
    }

    // 4. Update Isochronic Tones
    if (this.isochronicModulator) {
        this.isochronicModulator.frequency.setTargetAtTime(entrainmentFreq, now, rampTime);
    }

    // 5. Update Noise Levels based on Stress (Atmosphere Density)
    // Stress 0 -> Min Volume (Calm)
    // Stress 1 -> Max Volume (Windy/Stormy)
    if (this.pinkNoiseGain && this.brownNoiseGain) {
        const pinkTarget = AUDIO_CONFIG.NOISE.PINK_VOLUME_MIN +
            (stress * (AUDIO_CONFIG.NOISE.PINK_VOLUME_MAX - AUDIO_CONFIG.NOISE.PINK_VOLUME_MIN));

        const brownTarget = AUDIO_CONFIG.NOISE.BROWN_VOLUME_MIN +
            (stress * (AUDIO_CONFIG.NOISE.BROWN_VOLUME_MAX - AUDIO_CONFIG.NOISE.BROWN_VOLUME_MIN));

        this.pinkNoiseGain.gain.setTargetAtTime(pinkTarget, now, rampTime);
        this.brownNoiseGain.gain.setTargetAtTime(brownTarget, now, rampTime);
    }
  }

  // --- Spatial Audio Implementation ---

  public getCurrentTime(): number {
    return this.ctx?.currentTime || 0;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Updates the audio listener's position and orientation to match the camera.
   * Call this inside useFrame loop.
   */
  public setListenerPosition(
    px: number, py: number, pz: number,
    fx: number, fy: number, fz: number,
    ux: number, uy: number, uz: number
  ) {
    if (!this.ctx || !this.isRunning) return;

    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
        // Standard AudioParam automation
        listener.positionX.setTargetAtTime(px, now, 0.1);
        listener.positionY.setTargetAtTime(py, now, 0.1);
        listener.positionZ.setTargetAtTime(pz, now, 0.1);
        listener.forwardX.setTargetAtTime(fx, now, 0.1);
        listener.forwardY.setTargetAtTime(fy, now, 0.1);
        listener.forwardZ.setTargetAtTime(fz, now, 0.1);
        listener.upX.setTargetAtTime(ux, now, 0.1);
        listener.upY.setTargetAtTime(uy, now, 0.1);
        listener.upZ.setTargetAtTime(uz, now, 0.1);
    } else {
        // Legacy fallback
        listener.setPosition(px, py, pz);
        listener.setOrientation(fx, fy, fz, ux, uy, uz);
    }
  }

  /**
   * Creates a 3D spatial sound source for a destination.
   */
  public createPositionalSource(id: string, x: number, y: number, z: number) {
    if (!this.ctx || this.positionalSources.has(id) || !this.masterGain) return;

    // 1. Create Nodes
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createPanner();

    // 2. Configure Panner
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.positionX.setValueAtTime(x, this.ctx.currentTime);
    panner.positionY.setValueAtTime(y, this.ctx.currentTime);
    panner.positionZ.setValueAtTime(z, this.ctx.currentTime);

    // 3. Configure Sound
    oscillator.type = 'sine';
    // Use a harmonic frequency relative to the drone to avoid dissonance
    // E.g., 440Hz (A4) - a nice clear tone
    oscillator.frequency.setValueAtTime(440, this.ctx.currentTime);

    // 4. Connect
    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    // 5. Start
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 1); // Fade in softly
    oscillator.start();

    // 6. Store
    this.positionalSources.set(id, { oscillator, gain, panner });
  }

  /**
   * Removes a spatial sound source.
   */
  public removePositionalSource(id: string) {
    const source = this.positionalSources.get(id);
    if (source && this.ctx) {
        // Fade out
        const now = this.ctx.currentTime;
        source.gain.gain.cancelScheduledValues(now);
        source.gain.gain.setValueAtTime(source.gain.gain.value, now);
        source.gain.gain.linearRampToValueAtTime(0, now + 0.5);

        setTimeout(() => {
            source.oscillator.stop();
            source.oscillator.disconnect();
            source.gain.disconnect();
            source.panner.disconnect();
            this.positionalSources.delete(id);
        }, 600);
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
