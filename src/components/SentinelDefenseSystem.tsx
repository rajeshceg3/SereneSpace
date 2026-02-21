import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';
import { usePredictionStore } from '../stores/usePredictionStore';
import { useAetherStore } from '../stores/useAetherStore';
import { useBioLinkStore } from '../stores/useBioLinkStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { PredictiveModel } from '../services/PredictiveModel';
import { ThreatAnalyzer } from '../services/ThreatAnalyzer';
import {
  SENTINEL_HYSTERESIS_MS,
  SENTINEL_DEEP_DIVE_DELAY_MS,
  SENTINEL_PROTOCOLS,
  SENTINEL_ENTRAINMENT_MAP
} from '../constants';
import { analytics } from '../services/AnalyticsService';
import { audioEngine } from '../services/AudioEngine';

export const SentinelDefenseSystem = () => {
  const setProtocol = useSentinelStore((state) => state.setProtocol);
  const setThreatLevel = useSentinelStore((state) => state.setThreatLevel);
  const activateCounterMeasure = useSentinelStore((state) => state.activateCounterMeasure);
  const deactivateCounterMeasure = useSentinelStore((state) => state.deactivateCounterMeasure);

  const predictiveModel = useMemo(() => new PredictiveModel(), []);
  const threatAnalyzer = useMemo(() => new ThreatAnalyzer(), []);

  const highStressTimer = useRef(0);
  const lowStressTimer = useRef(0);
  const lastUIUpdate = useRef(0);
  const lastThreatCheck = useRef(0);

  // Monitor Threat Level Changes for Audio Intervention
  useEffect(() => {
    const unsubscribe = useSentinelStore.subscribe((state, prevState) => {
        if (state.threatLevel !== prevState.threatLevel) {
            // Logic for Audio Intervention
            const level = state.threatLevel;

            if (level === 'CRITICAL') {
                audioEngine.triggerIntervention('GROUNDING', 5000);
                activateCounterMeasure('AUDIO_GROUNDING');
            } else if (level === 'WARNING') {
                audioEngine.triggerIntervention('PATTERN_INTERRUPT', 3000);
                activateCounterMeasure('AUDIO_INTERRUPT');
            } else if (level === 'SAFE' || level === 'CAUTION') {
                // If dropping from a higher state, stabilize
                if (prevState.threatLevel === 'CRITICAL' || prevState.threatLevel === 'WARNING') {
                     audioEngine.stabilize();
                     deactivateCounterMeasure('AUDIO_GROUNDING');
                     deactivateCounterMeasure('AUDIO_INTERRUPT');
                }
            }

            // Visual Dampeners Logic
            if (level !== 'SAFE') {
                activateCounterMeasure('VISUAL_DAMPENERS');
            } else {
                deactivateCounterMeasure('VISUAL_DAMPENERS');
            }

            analytics.track('Sentinel Threat Level Changed', { level, prevLevel: prevState.threatLevel });
        }
    });
    return () => unsubscribe();
  }, [activateCounterMeasure, deactivateCounterMeasure]);

  useFrame((_, delta) => {
    // TACTICAL OVERRIDE CHECK
    const isSimulationPaused = useSentinelStore.getState().isSimulationPaused;
    if (isSimulationPaused) return;

    const stress = useResonanceStore.getState().currentStress;
    const activeProtocol = useSentinelStore.getState().activeProtocol;
    const setDecayRate = useResonanceStore.getState().setDecayRate;
    const setEntrainmentFreq = useEntrainmentStore.getState().setTargetFreq;
    const now = Date.now();

    // 1. Predictive Analysis (Legacy + UI)
    predictiveModel.addSample(stress, now);
    const { velocity, projected, confidence } = predictiveModel.analyze(5);

    if (now - lastUIUpdate.current > 100) {
      usePredictionStore.getState().setPrediction(velocity, projected, confidence);
      lastUIUpdate.current = now;
    }

    // 2. Threat Analysis (New Defense Grid)
    threatAnalyzer.addSample(stress, now);
    // Throttle threat checks to avoid thrashing (every 500ms)
    // SKIP IF MANUAL OVERRIDE IS ACTIVE
    const isManualOverride = useSentinelStore.getState().isManualOverride;

    if (now - lastThreatCheck.current > 500 && !isManualOverride) {
        const signature = threatAnalyzer.detectSignature();
        const threat = threatAnalyzer.assessThreat(signature, stress);
        setThreatLevel(threat);
        lastThreatCheck.current = now;
    }

    // 3. Protocol Switching Logic

    // AETHERIC COMMAND OVERRIDE
    const isCustomProfileActive = useAetherStore.getState().isCustomProfileActive;
    if (isCustomProfileActive) {
        const hrv = useBioLinkStore.getState().hrv;
        const coherence = useRespirationStore.getState().coherence;
        useAetherStore.getState().evaluateRules({ stress, hrv, coherence }, delta * 1000);
        return; // Bypass hardcoded switching logic
    }

    // TACTICAL LOCK CHECK
    const lockedProtocol = useSentinelStore.getState().lockedProtocol;
    if (lockedProtocol) {
        if (activeProtocol !== lockedProtocol) {
            setProtocol(lockedProtocol);
            analytics.track('Sentinel Protocol Locked', { protocol: lockedProtocol });
            // Apply protocol settings immediately
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS[lockedProtocol].decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP[lockedProtocol]);
        }
        return; // Bypass all automated switching
    }

    // SKIP AUTOMATION IF MANUAL OVERRIDE IS ACTIVE (Fixes Legacy Logic Gap)
    if (isManualOverride) return;

    const isProjectedHigh = projected > 0.8 && confidence > 0.7;

    if (stress > 0.8 || isProjectedHigh) {
      highStressTimer.current += delta * 1000;
    } else {
      highStressTimer.current = 0;
    }

    if (stress < 0.2) {
      lowStressTimer.current += delta * 1000;
    } else {
      lowStressTimer.current = 0;
    }

    if (activeProtocol === 'OBSERVER') {
        if (highStressTimer.current > SENTINEL_HYSTERESIS_MS) {
            setProtocol('GUIDANCE');
            const cause = isProjectedHigh && stress <= 0.8 ? 'Preemptive High Stress' : 'High Stress Hysteresis';
            analytics.track('Sentinel Protocol Changed', { protocol: 'GUIDANCE', cause });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.GUIDANCE.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.GUIDANCE);
        } else if (lowStressTimer.current > SENTINEL_DEEP_DIVE_DELAY_MS) {
            setProtocol('DEEP_DIVE');
            analytics.track('Sentinel Protocol Changed', { protocol: 'DEEP_DIVE', cause: 'Low Stress Hysteresis' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.DEEP_DIVE.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.DEEP_DIVE);
        }
    } else if (activeProtocol === 'GUIDANCE') {
        if (stress < 0.6) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Normalized' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.OBSERVER);
        }
    } else if (activeProtocol === 'DEEP_DIVE') {
        if (stress > 0.3) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Increased' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.OBSERVER);
        }
    }
  });

  return null;
};
