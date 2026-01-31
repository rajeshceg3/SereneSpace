import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioStore } from '../../stores/useAudioStore';
import { AUDIO_CONFIG } from '../../constants';

describe('useAudioStore', () => {
  beforeEach(() => {
    useAudioStore.setState({
      isMuted: true,
      volume: AUDIO_CONFIG.MASTER_VOLUME,
      isInitialized: false,
      isSupported: true,
    });
  });

  it('should initialize with default values', () => {
    const state = useAudioStore.getState();
    expect(state.isMuted).toBe(true);
    expect(state.volume).toBe(AUDIO_CONFIG.MASTER_VOLUME);
    expect(state.isInitialized).toBe(false);
  });

  it('should toggle mute', () => {
    useAudioStore.getState().toggleMute();
    expect(useAudioStore.getState().isMuted).toBe(false);

    useAudioStore.getState().toggleMute();
    expect(useAudioStore.getState().isMuted).toBe(true);
  });

  it('should set volume within bounds', () => {
    useAudioStore.getState().setVolume(1.5); // Should clamp to 1
    expect(useAudioStore.getState().volume).toBe(1);

    useAudioStore.getState().setVolume(-0.5); // Should clamp to 0
    expect(useAudioStore.getState().volume).toBe(0);

    useAudioStore.getState().setVolume(0.5);
    expect(useAudioStore.getState().volume).toBe(0.5);
  });

  it('should initialize audio', () => {
    useAudioStore.getState().initializeAudio();
    expect(useAudioStore.getState().isInitialized).toBe(true);
    expect(useAudioStore.getState().isMuted).toBe(false); // Should auto-unmute
  });
});
