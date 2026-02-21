import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAetherStore } from '../../stores/useAetherStore';
import type { DefenseProfile } from '../../stores/useAetherStore';
import { audioEngine } from '../../services/AudioEngine';

// Mocks
vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    triggerIntervention: vi.fn(),
    setLayerVolume: vi.fn(),
  }
}));

const { mockSetProtocol } = vi.hoisted(() => ({
  mockSetProtocol: vi.fn(),
}));

vi.mock('../../stores/useSentinelStore', () => ({
  useSentinelStore: {
    getState: () => ({
      setProtocol: mockSetProtocol,
    }),
  }
}));

describe('useAetherStore', () => {
  beforeEach(() => {
    useAetherStore.setState({
      profiles: [],
      activeProfileId: null,
      isCustomProfileActive: false,
      presets: [],
      ruleState: {}
    });
    vi.clearAllMocks();
  });

  it('should manage profiles correctly', () => {
    const profile: DefenseProfile = {
      id: 'p1',
      name: 'Test Profile',
      rules: []
    };

    const store = useAetherStore.getState();
    store.addProfile(profile);

    expect(useAetherStore.getState().profiles).toHaveLength(1);
    expect(useAetherStore.getState().profiles[0].id).toBe('p1');

    store.setActiveProfile('p1');
    expect(useAetherStore.getState().activeProfileId).toBe('p1');
  });

  it('should trigger intervention rule when condition is met', () => {
    const store = useAetherStore.getState();
    const profile: DefenseProfile = {
      id: 'p1',
      name: 'Test',
      rules: [{
        id: 'r1',
        enabled: true,
        condition: { metric: 'STRESS', operator: '>', threshold: 0.5, duration: 2 },
        action: { type: 'INTERVENTION', target: 'GROUNDING' }
      }]
    };

    store.addProfile(profile);
    store.setActiveProfile('p1');
    store.setCustomProfileActive(true);

    // Frame 1: Stress 0.6 (> 0.5) for 1000ms. Total 1000ms. Threshold 2000ms.
    store.evaluateRules({ stress: 0.6, hrv: 50, coherence: 50 }, 1000);
    expect(audioEngine.triggerIntervention).not.toHaveBeenCalled();

    // Frame 2: Stress 0.6 for 1500ms. Total 2500ms. Trigger!
    store.evaluateRules({ stress: 0.6, hrv: 50, coherence: 50 }, 1500);
    expect(audioEngine.triggerIntervention).toHaveBeenCalledWith('GROUNDING');
  });

  it('should reset timer if condition is not met', () => {
    const store = useAetherStore.getState();
    const profile: DefenseProfile = {
      id: 'p1',
      name: 'Test',
      rules: [{
        id: 'r1',
        enabled: true,
        condition: { metric: 'STRESS', operator: '>', threshold: 0.5, duration: 2 },
        action: { type: 'INTERVENTION', target: 'GROUNDING' }
      }]
    };

    store.addProfile(profile);
    store.setActiveProfile('p1');
    store.setCustomProfileActive(true);

    // Frame 1: Stress 0.6. Timer -> 1000
    store.evaluateRules({ stress: 0.6, hrv: 50, coherence: 50 }, 1000);

    // Frame 2: Stress 0.4. Timer -> 0
    store.evaluateRules({ stress: 0.4, hrv: 50, coherence: 50 }, 1000);

    // Frame 3: Stress 0.6. Timer -> 1000. Total < 2000. No Trigger.
    store.evaluateRules({ stress: 0.6, hrv: 50, coherence: 50 }, 1000);

    expect(audioEngine.triggerIntervention).not.toHaveBeenCalled();
  });
});
