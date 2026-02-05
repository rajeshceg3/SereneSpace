import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define Mock Nodes
const mockAudioParam = {
  value: 0,
  setValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
};

const mockGainNode = {
  gain: { ...mockAudioParam },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockOscillatorNode = {
  frequency: { ...mockAudioParam },
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  type: 'sine',
};

const mockBiquadFilterNode = {
  frequency: { ...mockAudioParam },
  connect: vi.fn(),
  type: 'lowpass',
};

const mockBufferSourceNode = {
  buffer: null,
  loop: false,
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockConvolverNode = {
  buffer: null,
  connect: vi.fn(),
};

const mockBuffer = {
  getChannelData: vi.fn(() => new Float32Array(100)),
};

const mockConstantSourceNode = {
  offset: { ...mockAudioParam },
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockStereoPannerNode = {
  pan: { value: 0 },
  connect: vi.fn(),
};

const mockPannerNode = {
  positionX: { ...mockAudioParam },
  positionY: { ...mockAudioParam },
  positionZ: { ...mockAudioParam },
  connect: vi.fn(),
  disconnect: vi.fn(),
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
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
  createGain = vi.fn(() => ({ ...mockGainNode, gain: { ...mockAudioParam } })); // Return fresh objects
  createOscillator = vi.fn(() => ({ ...mockOscillatorNode, frequency: { ...mockAudioParam } }));
  createBiquadFilter = vi.fn(() => ({ ...mockBiquadFilterNode, frequency: { ...mockAudioParam } }));
  createStereoPanner = vi.fn(() => mockStereoPannerNode);
  createPanner = vi.fn(() => ({ ...mockPannerNode, positionX: { ...mockAudioParam }, positionY: { ...mockAudioParam }, positionZ: { ...mockAudioParam } }));
  createBufferSource = vi.fn(() => ({ ...mockBufferSourceNode }));
  createConvolver = vi.fn(() => ({ ...mockConvolverNode }));
  createBuffer = vi.fn(() => mockBuffer);
  createConstantSource = vi.fn(() => ({ ...mockConstantSourceNode }));
  sampleRate = 44100;
  listener = mockListener;
  destination = {};
  currentTime = 100;
  state = 'suspended';
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
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
    (audioEngine as any).positionalSources = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).pinkNoiseNode = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).brownNoiseNode = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).convolver = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).isochronicOscillator = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).isochronicModulator = null;
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
    // 3 drones + 2 binaural + 1 isoCarrier + 1 isoModulator = 7 oscillators
    expect(ctx.createOscillator).toHaveBeenCalledTimes(7);
    expect(ctx.createConstantSource).toHaveBeenCalled();
  });

  it('should initialize noise and reverb layers', () => {
    audioEngine.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;

    // Reverb
    expect(ctx.createConvolver).toHaveBeenCalled();
    // Noise (Pink + Brown)
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2);
    expect(ctx.createBuffer).toHaveBeenCalled();
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

    // Verify Isochronic update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isoMod = (audioEngine as any).isochronicModulator;
    expect(isoMod.frequency.setTargetAtTime).toHaveBeenCalledWith(10, expect.any(Number), expect.any(Number));

    // Verify Noise update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pinkGain = (audioEngine as any).pinkNoiseGain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brownGain = (audioEngine as any).brownNoiseGain;

    expect(pinkGain.gain.setTargetAtTime).toHaveBeenCalled();
    expect(brownGain.gain.setTargetAtTime).toHaveBeenCalled();
  });

  it('should update volume', () => {
    audioEngine.init();
    audioEngine.setVolume(0.8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const masterGain = (audioEngine as any).masterGain;
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, expect.any(Number), expect.any(Number));
  });

  it('should update listener position', async () => {
      audioEngine.init();
      await audioEngine.start(0.5);

      audioEngine.setListenerPosition(1, 2, 3, 0, 0, -1, 0, 1, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (audioEngine as any).ctx;
      expect(ctx.listener.positionX.setTargetAtTime).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
      expect(ctx.listener.forwardZ.setTargetAtTime).toHaveBeenCalledWith(-1, expect.any(Number), expect.any(Number));
  });

  it('should create and remove positional sources', async () => {
      audioEngine.init();
      await audioEngine.start(0.5);

      audioEngine.createPositionalSource('dest-1', 10, 0, 5);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sources = (audioEngine as any).positionalSources;
      expect(sources.size).toBe(1);
      expect(sources.get('dest-1')).toBeDefined();

      // Check Panner creation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (audioEngine as any).ctx;
      expect(ctx.createPanner).toHaveBeenCalled();

      // Remove
      audioEngine.removePositionalSource('dest-1');

      // Removal is async (fade out), so verify scheduled values
      const source = sources.get('dest-1');
      expect(source.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
  });
});
