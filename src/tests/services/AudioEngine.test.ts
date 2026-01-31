import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AUDIO_CONFIG } from '../../constants';

// Define Mock Nodes
const mockGainNode = {
  gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
  connect: vi.fn(),
};

const mockOscillatorNode = {
  frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
  start: vi.fn(),
  connect: vi.fn(),
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

// Define Mock Context Class
class MockAudioContext {
  createGain = vi.fn(() => mockGainNode);
  createOscillator = vi.fn(() => mockOscillatorNode);
  createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
  createStereoPanner = vi.fn(() => mockStereoPannerNode);
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
    (audioEngine as any).ctx = null;
    (audioEngine as any).masterGain = null;
    (audioEngine as any).filter = null;
    (audioEngine as any).drones = [];
    (audioEngine as any).isRunning = false;
  });

  it('should initialize successfully', () => {
    const success = audioEngine.init();
    expect(success).toBe(true);
    // Since we use the class directly, we check if instance methods were called
    const ctx = (audioEngine as any).ctx;
    expect(ctx).toBeDefined();
    expect(ctx.createGain).toHaveBeenCalled();
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
  });

  it('should create oscillators for drone layer', () => {
    audioEngine.init();
    const ctx = (audioEngine as any).ctx;
    // 3 drones + 2 binaural = 5 oscillators
    expect(ctx.createOscillator).toHaveBeenCalledTimes(5);
  });

  it('should resume context on start', async () => {
    audioEngine.init();
    await audioEngine.start(0.5);
    const ctx = (audioEngine as any).ctx;
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('should update parameters based on stress', async () => {
    audioEngine.init();
    await audioEngine.start(0.5);

    // Test update with stress 0.5
    audioEngine.update(0.5, 'OBSERVER', 10);

    // Verify filter cutoff update
    const filter = (audioEngine as any).filter;
    expect(filter.frequency.setTargetAtTime).toHaveBeenCalled();

    // Verify drone update
    const drones = (audioEngine as any).drones;
    expect(drones[0].frequency.setTargetAtTime).toHaveBeenCalled();
  });

  it('should update volume', () => {
    audioEngine.init();
    audioEngine.setVolume(0.8);
    const masterGain = (audioEngine as any).masterGain;
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.8, expect.any(Number), expect.any(Number));
  });
});
