import { create } from 'zustand';
import { AUDIO_CONFIG } from '../constants';
import { audioEngine } from '../services/AudioEngine';

interface LayerVolumes {
  drone: number;
  binaural: number;
  noise: number;
  reverb: number;
}

interface AudioState {
  isMuted: boolean;
  volume: number;
  isInitialized: boolean;
  isSupported: boolean;

  // New State
  layerVolumes: LayerVolumes;
  bioLockEnabled: boolean;
  manualMode: boolean;

  toggleMute: () => void;
  setVolume: (volume: number) => void;
  initializeAudio: () => void;
  setSupported: (supported: boolean) => void;

  // New Actions
  setLayerVolume: (layer: keyof LayerVolumes, volume: number) => void;
  setBioLock: (enabled: boolean) => void;
  setManualMode: (enabled: boolean) => void;
  setManualFrequency: (layer: 'drone' | 'binaural', frequency: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isMuted: true, // Start muted until user interaction
  volume: AUDIO_CONFIG.MASTER_VOLUME,
  isInitialized: false,
  isSupported: true,

  layerVolumes: {
    drone: 0.5,
    binaural: 0.3,
    noise: 1.0,
    reverb: AUDIO_CONFIG.REVERB.MIX,
  },
  bioLockEnabled: false,
  manualMode: false,

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  initializeAudio: () => set({ isInitialized: true, isMuted: false }), // Auto-unmute on init
  setSupported: (isSupported) => set({ isSupported }),

  setLayerVolume: (layer, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set((state) => ({
      layerVolumes: { ...state.layerVolumes, [layer]: clamped }
    }));
    audioEngine.setLayerVolume(layer, clamped);
  },

  setBioLock: (enabled) => {
    set({ bioLockEnabled: enabled });
    audioEngine.setBioLock(enabled);
  },

  setManualMode: (enabled) => {
    set({ manualMode: enabled });
    audioEngine.setManualMode(enabled);
  },

  setManualFrequency: (layer, frequency) => {
    audioEngine.setManualFrequency(layer, frequency);
  },
}));
