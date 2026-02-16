import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SentinelDefenseSystem } from '../../components/SentinelDefenseSystem';
import { useSentinelStore } from '../../stores/useSentinelStore';
import { audioEngine } from '../../services/AudioEngine';

// Mock AudioEngine (which is imported as 'audioEngine' instance)
vi.mock('../../services/AudioEngine', () => {
  return {
    audioEngine: {
      triggerIntervention: vi.fn(),
      stabilize: vi.fn(),
    },
  };
});

describe('SentinelDefenseSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSentinelStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers PATTERN_INTERRUPT when threat level becomes WARNING', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelDefenseSystem />);

    // Simulate threat change
    const { setThreatLevel } = useSentinelStore.getState();
    setThreatLevel('WARNING');

    // Wait for useEffect
    await renderer.advanceFrames(1, 0.1);

    expect(audioEngine.triggerIntervention).toHaveBeenCalledWith('PATTERN_INTERRUPT', 3000);
  });

  it('triggers GROUNDING when threat level becomes CRITICAL', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelDefenseSystem />);

    const { setThreatLevel } = useSentinelStore.getState();
    setThreatLevel('CRITICAL');

    await renderer.advanceFrames(1, 0.1);

    expect(audioEngine.triggerIntervention).toHaveBeenCalledWith('GROUNDING', 5000);
  });

  it('stabilizes when returning to SAFE from elevated threat', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelDefenseSystem />);

    const { setThreatLevel } = useSentinelStore.getState();

    // Escalate first
    setThreatLevel('WARNING');
    await renderer.advanceFrames(1, 0.1);

    // Then De-escalate
    setThreatLevel('SAFE');
    await renderer.advanceFrames(1, 0.1);

    expect(audioEngine.stabilize).toHaveBeenCalled();
  });
});
