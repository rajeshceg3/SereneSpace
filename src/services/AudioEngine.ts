import { AUDIO_CONFIG, SENTINEL_PROTOCOLS } from '../constants';

type SentinelProtocol = keyof typeof SENTINEL_PROTOCOLS;

export interface PositionalSourceHandle {
  setPosition: (x: number, y: number, z: number) => void;
  setVolume: (volume: number) => void;
  stop: () => void;
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
  }

  public createPositionalSource(initialPosition: [number, number, number]): PositionalSourceHandle {
    if (!this.ctx || !this.masterGain) {
      return { setPosition: () => {}, setVolume: () => {}, stop: () => {} };
    }

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    // Use a random harmonic frequency
    const harmonics = [220, 275, 330, 440, 550, 660];
    osc.frequency.value = harmonics[Math.floor(Math.random() * harmonics.length)];

    const gain = this.ctx.createGain();
    gain.gain.value = 0.05; // Gentle

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'exponential';
    panner.refDistance = 2;
    panner.maxDistance = 20;
    panner.rolloffFactor = 1.0;

    // Set initial position
    if (panner.positionX) {
        panner.positionX.value = initialPosition[0];
        panner.positionY.value = initialPosition[1];
        panner.positionZ.value = initialPosition[2];
    } else {
        panner.setPosition(initialPosition[0], initialPosition[1], initialPosition[2]);
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start();

    return {
      setPosition: (x: number, y: number, z: number) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (panner.positionX) {
          panner.positionX.setTargetAtTime(x, now, 0.1);
          panner.positionY.setTargetAtTime(y, now, 0.1);
          panner.positionZ.setTargetAtTime(z, now, 0.1);
        } else {
          panner.setPosition(x, y, z);
        }
      },
      setVolume: (v: number) => {
        if (!this.ctx) return;
        gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
      },
      stop: () => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
        panner.disconnect();
      }
    };
  }

  public updateListener(
    x: number, y: number, z: number,
    fx: number, fy: number, fz: number,
    ux: number, uy: number, uz: number
  ) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setTargetAtTime(x, now, 0.1);
      listener.positionY.setTargetAtTime(y, now, 0.1);
      listener.positionZ.setTargetAtTime(z, now, 0.1);

      listener.forwardX.setTargetAtTime(fx, now, 0.1);
      listener.forwardY.setTargetAtTime(fy, now, 0.1);
      listener.forwardZ.setTargetAtTime(fz, now, 0.1);

      listener.upX.setTargetAtTime(ux, now, 0.1);
      listener.upY.setTargetAtTime(uy, now, 0.1);
      listener.upZ.setTargetAtTime(uz, now, 0.1);
    } else {
      listener.setPosition(x, y, z);
      listener.setOrientation(fx, fy, fz, ux, uy, uz);
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
