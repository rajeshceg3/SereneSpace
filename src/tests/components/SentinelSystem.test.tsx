import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SentinelSystem } from '../../components/SentinelSystem';
import { SENTINEL_PROTOCOLS } from '../../constants';

// Mocks
const setProtocolMock = vi.fn();
const setDecayRateMock = vi.fn();

let mockStress = 0;
let mockActiveProtocol = 'OBSERVER';

vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: {
    getState: () => ({
      currentStress: mockStress,
      setDecayRate: setDecayRateMock,
    }),
  },
}));

vi.mock('../../stores/useSentinelStore', () => ({
  useSentinelStore: Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: any) => selector({ setProtocol: setProtocolMock }), // Hook usage
    {
      getState: () => ({
        activeProtocol: mockActiveProtocol,
      }),
    }
  ),
}));

describe('SentinelSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStress = 0;
    mockActiveProtocol = 'OBSERVER';
  });

  it('switches to GUIDANCE when stress > 0.8 for 3 seconds', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    // Set high stress
    mockStress = 0.9;

    // Advance 2 seconds (should not switch yet)
    // 2s / 0.1s per frame = 20 frames
    await renderer.advanceFrames(20, 0.1);
    expect(setProtocolMock).not.toHaveBeenCalled();

    // Advance 2 more seconds (total 4s > 3s)
    await renderer.advanceFrames(20, 0.1);
    expect(setProtocolMock).toHaveBeenCalledWith('GUIDANCE');
    expect(setDecayRateMock).toHaveBeenCalledWith(SENTINEL_PROTOCOLS.GUIDANCE.decayRate);
  });

  it('switches to DEEP_DIVE when stress < 0.2 for 5 seconds', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    mockStress = 0.1;

    // Advance 4 seconds (should not switch yet)
    await renderer.advanceFrames(40, 0.1);
    expect(setProtocolMock).not.toHaveBeenCalled();

    // Advance 2 more seconds (total 6s > 5s)
    await renderer.advanceFrames(20, 0.1);
    expect(setProtocolMock).toHaveBeenCalledWith('DEEP_DIVE');
    expect(setDecayRateMock).toHaveBeenCalledWith(SENTINEL_PROTOCOLS.DEEP_DIVE.decayRate);
  });

  it('reverts from GUIDANCE to OBSERVER when stress drops', async () => {
    mockActiveProtocol = 'GUIDANCE';
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    // Stress drops below 0.6
    mockStress = 0.5;

    await renderer.advanceFrames(2, 0.1);
    expect(setProtocolMock).toHaveBeenCalledWith('OBSERVER');
    expect(setDecayRateMock).toHaveBeenCalledWith(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
  });
});
