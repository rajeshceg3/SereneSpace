import { describe, it, expect, beforeEach } from 'vitest';
import { useEntrainmentStore } from '../../stores/useEntrainmentStore';
import { ENTRAINMENT_FREQUENCIES, ENTRAINMENT_CONFIG } from '../../constants';

describe('useEntrainmentStore', () => {
  beforeEach(() => {
    useEntrainmentStore.getState().reset();
  });

  it('initializes with default values', () => {
    const state = useEntrainmentStore.getState();
    expect(state.targetFreq).toBe(ENTRAINMENT_FREQUENCIES.ALPHA);
    expect(state.intensity).toBe(ENTRAINMENT_CONFIG.BASE_INTENSITY);
    expect(state.currentPulse).toBe(0);
    expect(state.isActive).toBe(true);
  });

  it('updates target frequency', () => {
    const { setTargetFreq } = useEntrainmentStore.getState();
    setTargetFreq(ENTRAINMENT_FREQUENCIES.THETA);
    expect(useEntrainmentStore.getState().targetFreq).toBe(ENTRAINMENT_FREQUENCIES.THETA);
  });

  it('updates intensity', () => {
    const { setIntensity } = useEntrainmentStore.getState();
    setIntensity(0.5);
    expect(useEntrainmentStore.getState().intensity).toBe(0.5);
  });

  it('updates pulse value', () => {
    const { updatePulse } = useEntrainmentStore.getState();
    updatePulse(0.8);
    expect(useEntrainmentStore.getState().currentPulse).toBe(0.8);
  });

  it('resets to defaults', () => {
    const state = useEntrainmentStore.getState();
    state.setTargetFreq(999);
    state.reset();
    expect(useEntrainmentStore.getState().targetFreq).toBe(ENTRAINMENT_FREQUENCIES.ALPHA);
  });
});
