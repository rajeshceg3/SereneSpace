import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audioEngine } from '../services/AudioEngine';
import { SENTINEL_PROTOCOLS } from '../constants';
import { useSentinelStore } from './useSentinelStore';

// Interfaces
export interface AudioPreset {
  id: string;
  name: string;
  mix: {
    drone: number;
    binaural: number;
    pinkNoise: number;
    brownNoise: number;
    reverb: number;
  };
}

export interface Rule {
  id: string;
  enabled: boolean;
  condition: {
    metric: 'STRESS' | 'HRV' | 'COHERENCE';
    operator: '>' | '<';
    threshold: number;
    duration: number; // in seconds
  };
  action: {
    type: 'PROTOCOL_SWITCH' | 'INTERVENTION' | 'AUDIO_PRESET';
    target: string; // Protocol ID, Intervention Type, or Preset ID
  };
}

export interface DefenseProfile {
  id: string;
  name: string;
  rules: Rule[];
}

interface AetherState {
  // UI State
  isVisible: boolean;
  activeTab: 'DASHBOARD' | 'MIXER' | 'PROTOCOLS';

  // Logic State
  isCustomProfileActive: boolean;
  activeProfileId: string | null;
  profiles: DefenseProfile[];
  presets: AudioPreset[];

  // Runtime State (Transient, not persisted ideally, but okay here)
  ruleState: Record<string, number>; // RuleID -> TimeActive (ms)

  // Actions
  toggleInterface: () => void;
  setActiveTab: (tab: 'DASHBOARD' | 'MIXER' | 'PROTOCOLS') => void;
  setCustomProfileActive: (active: boolean) => void;
  setActiveProfile: (id: string) => void;
  addProfile: (profile: DefenseProfile) => void;
  updateProfile: (profile: DefenseProfile) => void;
  deleteProfile: (id: string) => void;
  savePreset: (preset: AudioPreset) => void;
  deletePreset: (id: string) => void;

  // Logic Engine
  evaluateRules: (metrics: { stress: number; hrv: number; coherence: number }, dt: number) => void;
}

export const useAetherStore = create<AetherState>()(
  persist(
    (set, get) => ({
      isVisible: false,
      activeTab: 'DASHBOARD',
      isCustomProfileActive: false,
      activeProfileId: 'default-alpha',
      profiles: [
        {
          id: 'default-alpha',
          name: 'Alpha Protocol',
          rules: [
            {
              id: 'rule-1',
              enabled: true,
              condition: { metric: 'STRESS', operator: '>', threshold: 0.8, duration: 3 },
              action: { type: 'INTERVENTION', target: 'GROUNDING' }
            }
          ]
        }
      ],
      presets: [],
      ruleState: {},

      toggleInterface: () => set((state) => ({ isVisible: !state.isVisible })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCustomProfileActive: (active) => set({ isCustomProfileActive: active }),
      setActiveProfile: (id) => set({ activeProfileId: id }),

      addProfile: (profile) => set((state) => ({ profiles: [...state.profiles, profile] })),
      updateProfile: (updated) => set((state) => ({
        profiles: state.profiles.map((p) => p.id === updated.id ? updated : p)
      })),
      deleteProfile: (id) => set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
        activeProfileId: state.activeProfileId === id ? null : state.activeProfileId
      })),

      savePreset: (preset) => set((state) => {
        const exists = state.presets.find(p => p.id === preset.id);
        if (exists) {
            return { presets: state.presets.map(p => p.id === preset.id ? preset : p) };
        }
        return { presets: [...state.presets, preset] };
      }),
      deletePreset: (id) => set((state) => ({ presets: state.presets.filter(p => p.id !== id) })),

      evaluateRules: (metrics, dt) => {
        const state = get();
        if (!state.isCustomProfileActive || !state.activeProfileId) return;

        const profile = state.profiles.find(p => p.id === state.activeProfileId);
        if (!profile) return;

        const newRuleState = { ...state.ruleState };

        profile.rules.forEach(rule => {
          if (!rule.enabled) return;

          let conditionMet = false;
          const val = rule.condition.metric === 'STRESS' ? metrics.stress :
                      rule.condition.metric === 'HRV' ? metrics.hrv : metrics.coherence;

          if (rule.condition.operator === '>') {
            conditionMet = val > rule.condition.threshold;
          } else {
            conditionMet = val < rule.condition.threshold;
          }

          if (conditionMet) {
            // Increment timer
            const current = newRuleState[rule.id] || 0;
            newRuleState[rule.id] = current + dt;

            // Check trigger
            if (newRuleState[rule.id] >= rule.condition.duration * 1000) {
               // FIRE ACTION
               console.log(`[AETHER] Rule ${rule.id} Triggered: ${rule.action.type} -> ${rule.action.target}`);

               if (rule.action.type === 'INTERVENTION') {
                 audioEngine.triggerIntervention(rule.action.target as 'GROUNDING' | 'PATTERN_INTERRUPT');
               } else if (rule.action.type === 'PROTOCOL_SWITCH') {
                 // We need to access Sentinel Store to switch protocol
                 // This is a side effect
                 useSentinelStore.getState().setProtocol(rule.action.target as keyof typeof SENTINEL_PROTOCOLS);
               } else if (rule.action.type === 'AUDIO_PRESET') {
                 const preset = state.presets.find(p => p.id === rule.action.target);
                 if (preset) {
                    audioEngine.setLayerVolume('drone', preset.mix.drone);
                    audioEngine.setLayerVolume('binaural', preset.mix.binaural);
                    audioEngine.setLayerVolume('reverb', preset.mix.reverb);
                    audioEngine.setLayerVolume('pinkNoise', preset.mix.pinkNoise);
                    audioEngine.setLayerVolume('brownNoise', preset.mix.brownNoise);
                 }
               }

               // Reset timer to prevent rapid firing? Or keep firing?
               // For interventions, we probably want to reset or debounce.
               newRuleState[rule.id] = -5000; // Debounce for 5s
            }
          } else {
            newRuleState[rule.id] = 0;
          }
        });

        // Optimize: only update store if something meaningful changed or periodically?
        // Updating store every frame is bad. We should keep ruleState in a Ref if possible,
        // but here we are in a store action.
        // We will just return the new state, but be careful about render cycles.
        // Actually, ruleState probably shouldn't trigger re-renders.
        set({ ruleState: newRuleState });
      }
    }),
    {
      name: 'aether-storage',
      partialize: (state) => ({
        profiles: state.profiles,
        presets: state.presets,
        activeProfileId: state.activeProfileId,
        isCustomProfileActive: state.isCustomProfileActive
      }), // Don't persist UI state or runtime timers
    }
  )
);
