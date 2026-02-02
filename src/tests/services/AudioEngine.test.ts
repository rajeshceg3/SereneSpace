import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define Mock Nodes
const mockGainNode = {
  gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn(), value: 0 },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockOscillatorNode = {
  frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), value: 440 },
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

const mockPannerNode = {
  panningModel: 'HRTF',
  distanceModel: 'exponential',
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  positionX: { value: 0, setTargetAtTime: vi.fn() },
  positionY: { value: 0, setTargetAtTime: vi.fn() },
  positionZ: { value: 0, setTargetAtTime: vi.fn() },
  connect: vi.fn(),
  disconnect: vi.fn(),
  setPosition: vi.fn(),
};

const mockListener = {
    positionX: { value: 0, setTargetAtTime: vi.fn() },
    positionY: { value: 0, setTargetAtTime: vi.fn() },
    positionZ: { value: 0, setTargetAtTime: vi.fn() },
    forwardX: { value: 0, setTargetAtTime: vi.fn() },
    forwardY: { value: 0, setTargetAtTime: vi.fn() },
    forwardZ: { value: 0, setTargetAtTime: vi.fn() },
    upX: { value: 0, setTargetAtTime: vi.fn() },
    upY: { value: 0, setTargetAtTime: vi.fn() },
    upZ: { value: 0, setTargetAtTime: vi.fn() },
    setPosition: vi.fn(),
    setOrientation: vi.fn(),
};

// Define Mock Context Class
class MockAudioContext {
  createGain = vi.fn(() => mockGainNode);
  createOscillator = vi.fn(() => mockOscillatorNode);
  createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
  createStereoPanner = vi.fn(() => mockStereoPannerNode);
  createPanner = vi.fn(() => mockPannerNode);
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
    (audioEngine as any).isRunning = false;
  });

  it('should initialize successfully', () => {
    const success = audioEngine.init();
    expect(success).toBe(true);
    // Since we use the class directly, we check if instance methods were called
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

  it('should create positional source', () => {
    audioEngine.init();
    const handle = audioEngine.createPositionalSource([1, 2, 3]);
    expect(handle).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;
    expect(ctx.createPanner).toHaveBeenCalled();
    expect(mockPannerNode.positionX.value).toBe(1);
    expect(mockPannerNode.positionY.value).toBe(2);
    expect(mockPannerNode.positionZ.value).toBe(3);

    // Test handle methods
    handle.setPosition(4, 5, 6);
    expect(mockPannerNode.positionX.setTargetAtTime).toHaveBeenCalledWith(4, expect.any(Number), expect.any(Number));

    handle.setVolume(0.5);
    expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.5, expect.any(Number), expect.any(Number));

    handle.stop();
    expect(mockOscillatorNode.stop).toHaveBeenCalled();
    expect(mockPannerNode.disconnect).toHaveBeenCalled();
  });

  it('should update listener position', () => {
    audioEngine.init();
    audioEngine.updateListener(1, 2, 3, 0, 0, -1, 0, 1, 0);

    expect(mockListener.positionX.setTargetAtTime).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
    expect(mockListener.forwardZ.setTargetAtTime).toHaveBeenCalledWith(-1, expect.any(Number), expect.any(Number));
    expect(mockListener.upY.setTargetAtTime).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
  });
});
