import { create } from 'zustand';
import { AUDIO_CONFIG } from '../constants';

interface AudioState {
  isMuted: boolean;
  volume: number;
  isInitialized: boolean;
  isSupported: boolean;

  toggleMute: () => void;
  setVolume: (volume: number) => void;
  initializeAudio: () => void;
  setSupported: (supported: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isMuted: true, // Start muted until user interaction
  volume: AUDIO_CONFIG.MASTER_VOLUME,
  isInitialized: false,
  isSupported: true,

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  initializeAudio: () => set({ isInitialized: true, isMuted: false }), // Auto-unmute on init
  setSupported: (isSupported) => set({ isSupported }),
}));
