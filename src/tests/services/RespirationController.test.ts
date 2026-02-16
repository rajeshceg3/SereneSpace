import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    // Default silence
    for(let i=0; i<array.length; i++) array[i] = 128;
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
  let currentTime = 0;

  beforeEach(() => {
    useRespirationStore.setState({
      isActive: false,
      inputMode: 'PROCEDURAL',
      currentPhase: BreathPhase.INHALE,
      selectedPatternId: 'COHERENCE',
      coherence: 0,
      breathRate: 0
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).breathIntervals = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).lastBreathTime = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).isBreathing = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RespirationController as any).currentValue = 0;

    currentTime = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('should calculate high coherence for consistent breath', async () => {
    // Setup
    useRespirationStore.getState().toggleActive();
    useRespirationStore.getState().setInputMode('MICROPHONE');

    // Trigger Init
    RespirationController.update(0.1);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Helper to simulate frames with specific amplitude
    // Runs multiple frames to ensure smoothed value settles
    const simulateFrames = (amplitude: number, count = 50) => {
        mockAnalyser.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
           for(let j=0; j<array.length; j++) array[j] = 128 + amplitude;
        });
        for(let i=0; i<count; i++) {
            currentTime += 16; // Advance 16ms per frame
            RespirationController.update(0.016);
        }
    };

    // 1. First Breath ON (Start Baseline)
    simulateFrames(30); // High amp -> Trigger Breath ON. CurrentTime increases by ~800ms.

    // Advance 5 seconds (Silence)
    currentTime += 5000;

    // Turn OFF (Silence) to allow re-trigger
    // Value must drop below threshold
    simulateFrames(0);

    // 2. Second Breath ON
    // Interval = Now (~6.6s) - Last (~1s). Interval ~5.6s
    simulateFrames(30);

    // Advance 5 seconds
    currentTime += 5000;

    // Turn OFF
    simulateFrames(0);

    // 3. Third Breath ON
    // Interval ~5.6s
    simulateFrames(30);

    // Check Coherence
    const state = useRespirationStore.getState();
    // Two intervals: ~5.6s and ~5.6s. Variance ~0. Coherence ~100.
    expect(state.coherence).toBeGreaterThan(90);
    // Rate: 30 / 5.6 ~= 5.3
    expect(state.breathRate).toBeGreaterThan(4);
    expect(state.breathRate).toBeLessThan(7);
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
