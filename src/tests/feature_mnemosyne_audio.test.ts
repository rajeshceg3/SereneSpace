import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define Mock Nodes (Simplified for this test)
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
  Q: { ...mockAudioParam },
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

// Define Mock Context Class
class MockAudioContext {
  createGain = vi.fn(() => ({ ...mockGainNode, gain: { ...mockAudioParam } }));
  createOscillator = vi.fn(() => ({ ...mockOscillatorNode, frequency: { ...mockAudioParam } }));
  createBiquadFilter = vi.fn(() => ({ ...mockBiquadFilterNode, frequency: { ...mockAudioParam }, Q: { ...mockAudioParam } }));
  createStereoPanner = vi.fn(() => ({ connect: vi.fn(), pan: { value: 0 } }));
  createPanner = vi.fn(() => ({ connect: vi.fn(), positionX: {...mockAudioParam}, positionY: {...mockAudioParam}, positionZ: {...mockAudioParam} }));
  createBufferSource = vi.fn(() => ({ ...mockBufferSourceNode }));
  createConvolver = vi.fn(() => ({ ...mockConvolverNode }));
  createBuffer = vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(100)) }));
  createConstantSource = vi.fn(() => ({ offset: { ...mockAudioParam }, start: vi.fn(), connect: vi.fn() }));
  sampleRate = 44100;
  listener = { positionX: {...mockAudioParam}, positionY: {...mockAudioParam}, positionZ: {...mockAudioParam}, forwardX: {...mockAudioParam}, forwardY: {...mockAudioParam}, forwardZ: {...mockAudioParam}, upX: {...mockAudioParam}, upY: {...mockAudioParam}, upZ: {...mockAudioParam} };
  destination = {};
  currentTime = 100;
  state = 'suspended';
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

import { audioEngine } from '../services/AudioEngine';

describe('AudioEngine - Mnemosyne Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).ctx = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).mnemosyneGain = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine as any).isRunning = false;
  });

  it('should initialize the Mnemosyne layer', () => {
    audioEngine.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (audioEngine as any).ctx;

    // Check if layer components exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mnGain = (audioEngine as any).mnemosyneGain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mnFilter = (audioEngine as any).mnemosyneFilter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mnSource = (audioEngine as any).mnemosyneSource;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mnLFO = (audioEngine as any).mnemosyneLFO;

    expect(mnGain).toBeDefined();
    expect(mnFilter).toBeDefined();
    expect(mnSource).toBeDefined();
    expect(mnLFO).toBeDefined();

    // Verify connections
    // Gain -> Master
    expect(mnGain.connect).toHaveBeenCalled();
    // Filter -> Gain
    expect(mnFilter.connect).toHaveBeenCalledWith(mnGain);
    // Source -> Filter
    expect(mnSource.connect).toHaveBeenCalledWith(mnFilter);
    // LFO -> Filter Frequency (via Gain usually, let's check general connection)
    expect(mnLFO.connect).toHaveBeenCalled();

    // Verify Bandpass config
    expect(mnFilter.type).toBe('bandpass');
    expect(mnFilter.Q.value).toBe(10);
  });

  it('should control Mnemosyne volume', () => {
    audioEngine.init();
    audioEngine.setMnemosyneVolume(0.7);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mnGain = (audioEngine as any).mnemosyneGain;
    expect(mnGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.7, expect.any(Number), 0.5);
  });
});
