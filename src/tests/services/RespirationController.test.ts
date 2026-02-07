import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RespirationController } from '../../services/RespirationController';
import { useRespirationStore, BreathPhase } from '../../stores/useRespirationStore';
import { audioEngine } from '../../services/AudioEngine';

// Mock AudioEngine
vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    getContext: vi.fn(),
  },
}));

// Mock Audio Context Parts
const mockAnalyser = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  frequencyBinCount: 128,
  getByteTimeDomainData: vi.fn((array) => {
    // Fill with some data
    for(let i=0; i<array.length; i++) array[i] = 128 + 10; // Slight offset
  }),
};

const mockMediaStreamSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockContext = {
  createMediaStreamSource: vi.fn(() => mockMediaStreamSource),
  createAnalyser: vi.fn(() => mockAnalyser),
};

// Mock Navigator MediaDevices
const mockStop = vi.fn();
const mockStream = {
  getTracks: vi.fn(() => [{ stop: mockStop }]),
};

const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
  configurable: true,
});

describe('RespirationController', () => {
  beforeEach(() => {
    useRespirationStore.setState({
      isActive: false,
      inputMode: 'PROCEDURAL',
      currentPhase: BreathPhase.INHALE,
      selectedPatternId: 'COHERENCE'
    });
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (audioEngine.getContext as any).mockReturnValue(mockContext);

    // Reset singleton state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).micStream = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).isInitializingMic = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).analyser = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).micSource = null;
  });

  it('should initialize with 0 value', () => {
    expect(RespirationController.getValue()).toBe(0);
  });

  it('should update procedurally when active', () => {
    useRespirationStore.getState().toggleActive(); // Active
    RespirationController.update(1.0); // 1 sec
    expect(RespirationController.getValue()).toBeGreaterThan(0);
  });

  it('should switch to microphone mode and init mic', async () => {
    useRespirationStore.getState().toggleActive();
    useRespirationStore.getState().setInputMode('MICROPHONE');

    // Trigger update to start init
    RespirationController.update(0.1);

    // Init is async, wait a tick
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockGetUserMedia).toHaveBeenCalled();
    expect(audioEngine.getContext).toHaveBeenCalled();
    expect(mockContext.createMediaStreamSource).toHaveBeenCalled();
    expect(mockContext.createAnalyser).toHaveBeenCalled();
  });

  it('should update value from microphone data', async () => {
    useRespirationStore.getState().toggleActive();
    useRespirationStore.getState().setInputMode('MICROPHONE');

    // Init
    RespirationController.update(0.1);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update again to read data
    RespirationController.update(0.1);

    expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    // With our mock data (138), rms should be > 0.
    // (138-128)/128 = 10/128 approx 0.078
    // RMS approx 0.078
    // Target 0.078 * 5 = 0.39
    // Value moves from 0 towards 0.39
    expect(RespirationController.getValue()).toBeGreaterThan(0);
  });

  it('should stop microphone when switching back to procedural', async () => {
    useRespirationStore.getState().toggleActive();
    useRespirationStore.getState().setInputMode('MICROPHONE');

    // Init
    RespirationController.update(0.1);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Switch back
    useRespirationStore.getState().setInputMode('PROCEDURAL');
    RespirationController.update(0.1);

    // Verify stream stopped
    expect(mockStop).toHaveBeenCalled();
    expect(mockMediaStreamSource.disconnect).toHaveBeenCalled();
  });

  it('should stop microphone when deactivated', async () => {
    useRespirationStore.getState().toggleActive();
    useRespirationStore.getState().setInputMode('MICROPHONE');

    // Init
    RespirationController.update(0.1);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Deactivate
    useRespirationStore.getState().toggleActive();
    RespirationController.update(0.1);

    expect(mockStop).toHaveBeenCalled();
  });
});
