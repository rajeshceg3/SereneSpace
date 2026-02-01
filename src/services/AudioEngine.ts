import * as THREE from 'three';
import { AUDIO_CONFIG, SENTINEL_PROTOCOLS } from '../constants';

type SentinelProtocol = keyof typeof SENTINEL_PROTOCOLS;

interface SpatialSource {
  source: OscillatorNode;
  panner: PannerNode;
  gain: GainNode;
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

  // Spatial Audio
  private spatialSources: Map<string, SpatialSource> = new Map();

  // State Tracking
  private currentProtocol: SentinelProtocol = 'OBSERVER';
  private currentStress = 0;
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

  // --- Spatial Audio Implementation ---

  public updateListener(position: THREE.Vector3, quaternion: THREE.Quaternion) {
    if (!this.ctx || !this.isRunning) return;

    const listener = this.ctx.listener;
    const time = this.ctx.currentTime;
    const ramp = 0.1;

    // Position
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(position.x, time, ramp);
      listener.positionY.setTargetAtTime(position.y, time, ramp);
      listener.positionZ.setTargetAtTime(position.z, time, ramp);
    } else {
      listener.setPosition(position.x, position.y, position.z);
    }

    // Orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    if (listener.forwardX) {
      listener.forwardX.setTargetAtTime(forward.x, time, ramp);
      listener.forwardY.setTargetAtTime(forward.y, time, ramp);
      listener.forwardZ.setTargetAtTime(forward.z, time, ramp);
      listener.upX.setTargetAtTime(up.x, time, ramp);
      listener.upY.setTargetAtTime(up.y, time, ramp);
      listener.upZ.setTargetAtTime(up.z, time, ramp);
    } else {
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  public createPositionalSource(id: string, position: [number, number, number]) {
    if (!this.ctx || !this.masterGain || this.spatialSources.has(id)) return;

    const source = this.ctx.createOscillator();
    // A high harmonic (A5 = 880Hz) creates a "beacon" feel
    source.type = 'sine';
    source.frequency.value = 880;
    source.start();

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = AUDIO_CONFIG.REF_DISTANCE;
    panner.maxDistance = AUDIO_CONFIG.MAX_DISTANCE;
    panner.rolloffFactor = AUDIO_CONFIG.ROLLOFF_FACTOR;
    panner.positionX.value = position[0];
    panner.positionY.value = position[1];
    panner.positionZ.value = position[2];

    const gain = this.ctx.createGain();
    gain.gain.value = AUDIO_CONFIG.SPATIAL_SOURCE_VOLUME;

    // Graph: Source -> Gain -> Panner -> Master
    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    this.spatialSources.set(id, { source, panner, gain });
  }

  public updateSourcePosition(id: string, position: [number, number, number]) {
    if (!this.ctx) return;
    const entry = this.spatialSources.get(id);
    if (!entry) return;

    const { panner } = entry;
    const time = this.ctx.currentTime;
    panner.positionX.setTargetAtTime(position[0], time, 0.1);
    panner.positionY.setTargetAtTime(position[1], time, 0.1);
    panner.positionZ.setTargetAtTime(position[2], time, 0.1);
  }

  public removeSource(id: string) {
    const entry = this.spatialSources.get(id);
    if (!entry) return;

    const { source, panner, gain } = entry;
    source.stop();
    source.disconnect();
    gain.disconnect();
    panner.disconnect();

    this.spatialSources.delete(id);
  }
}

export const audioEngine = AudioEngine.getInstance();
