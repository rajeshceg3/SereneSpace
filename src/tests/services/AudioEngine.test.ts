import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// Define Mock Nodes
const mockGainNode = {
  gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn(), value: 0 },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockOscillatorNode = {
  frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), value: 0 },
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  type: 'sine',
};

const mockBiquadFilterNode = {
  frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
  connect: vi.fn(),
  type: 'lowpass',
};

const mockStereoPannerNode = {
  pan: { value: 0 },
  connect: vi.fn(),
};

const mockAudioParam = {
    value: 0,
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
};

const mockPannerNode = {
  panningModel: 'equalpower',
  distanceModel: 'linear',
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  positionX: { ...mockAudioParam },
  positionY: { ...mockAudioParam },
  positionZ: { ...mockAudioParam },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockListener = {
    positionX: { ...mockAudioParam },
    positionY: { ...mockAudioParam },
    positionZ: { ...mockAudioParam },
    forwardX: { ...mockAudioParam },
    forwardY: { ...mockAudioParam },
    forwardZ: { ...mockAudioParam },
    upX: { ...mockAudioParam },
    upY: { ...mockAudioParam },
    upZ: { ...mockAudioParam },
    setPosition: vi.fn(),
    setOrientation: vi.fn(),
};

// Define Mock Context Class
class MockAudioContext {
  createGain = vi.fn(() => ({ ...mockGainNode, gain: { ...mockGainNode.gain } })); // Return new instance for unique checks if needed
  createOscillator = vi.fn(() => ({ ...mockOscillatorNode, frequency: { ...mockOscillatorNode.frequency } }));
  createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
  createStereoPanner = vi.fn(() => mockStereoPannerNode);
  createPanner = vi.fn(() => ({
      ...mockPannerNode,
      positionX: { ...mockAudioParam },
      positionY: { ...mockAudioParam },
      positionZ: { ...mockAudioParam },
  }));
  destination = {};
  currentTime = 100;
  state = 'suspended';
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  listener = mockListener;
}

// Assign to global window
vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

import { audioEngine } from '../../services/AudioEngine';

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset internal state of the singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).ctx = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).masterGain = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).filter = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).drones = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).spatialSources = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).isRunning = false;
  });

  it('should initialize successfully', () => {
    const success = audioEngine.init();
    expect(success).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;
    expect(ctx).toBeDefined();
    expect(ctx.createGain).toHaveBeenCalled();
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
  });

  it('should create oscillators for drone layer', () => {
    audioEngine.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;
    // 3 drones + 2 binaural = 5 oscillators
    expect(ctx.createOscillator).toHaveBeenCalledTimes(5);
  });

  it('should resume context on start', async () => {
    audioEngine.init();
    await audioEngine.start(0.5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('should update parameters based on stress', async () => {
    audioEngine.init();
    await audioEngine.start(0.5);

    // Test update with stress 0.5
    audioEngine.update(0.5, 'OBSERVER', 10);

    // Verify filter cutoff update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter = (audioEngine as any).filter;
    expect(filter.frequency.setTargetAtTime).toHaveBeenCalled();

    // Verify drone update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drones = (audioEngine as any).drones;
    expect(drones[0].frequency.setTargetAtTime).toHaveBeenCalled();
  });

  it('should update volume', () => {
    audioEngine.init();
    audioEngine.setVolume(0.8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const masterGain = (audioEngine as any).masterGain;
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, expect.any(Number), expect.any(Number));
  });

  describe('Spatial Audio', () => {
    it('should create a positional source', async () => {
      audioEngine.init();
      await audioEngine.start(0.5);

      const id = 'test-source';
      const pos: [number, number, number] = [1, 2, 3];

      audioEngine.createPositionalSource(id, pos);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (audioEngine as any).ctx;
      expect(ctx.createPanner).toHaveBeenCalled();

      // Check internal map
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sources = (audioEngine as any).spatialSources;
      expect(sources.has(id)).toBe(true);

      const entry = sources.get(id);
      expect(entry.panner.positionX.value).toBe(1);
    });

    it('should update listener position and orientation', async () => {
        audioEngine.init();
        await audioEngine.start(0.5);

        const pos = new THREE.Vector3(10, 0, 5);
        const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // 180 deg turn

        audioEngine.updateListener(pos, quat);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (audioEngine as any).ctx;
        expect(ctx.listener.positionX.setTargetAtTime).toHaveBeenCalledWith(10, expect.any(Number), expect.any(Number));
        expect(ctx.listener.forwardZ.setTargetAtTime).toHaveBeenCalled();
    });

    it('should remove a source', async () => {
        audioEngine.init();
        const id = 'test-remove';
        audioEngine.createPositionalSource(id, [0,0,0]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sources = (audioEngine as any).spatialSources;
        expect(sources.has(id)).toBe(true);
        const entry = sources.get(id);

        audioEngine.removeSource(id);

        expect(entry.source.stop).toHaveBeenCalled();
        expect(entry.source.disconnect).toHaveBeenCalled();
        expect(sources.has(id)).toBe(false);
    });
  });
});
