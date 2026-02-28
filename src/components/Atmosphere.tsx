import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTimeStore } from '../stores/useTimeStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { RespirationController } from '../services/RespirationController';
import {
  ATMOSPHERE_CONFIG,
  ATMOSPHERE_LERP_FACTOR,
  TIME_CHECK_INTERVAL,
  RESONANCE_FOG_MULTIPLIER,
  RESONANCE_LIGHT_DIMMER,
  SENTINEL_PROTOCOLS,
} from '../constants';

// Force-include
export const Atmosphere = () => {
  const { phase, updatePhase } = useTimeStore();
  const { scene } = useThree();

  // Refs for lights to update them in useFrame
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  // Store base intensity to separate slow atmospheric changes from fast breathing pulses
  const baseIntensityRef = useRef(1.0);

  // Timer for phase updates
  useEffect(() => {
    updatePhase(); // Check immediately on mount
    const interval = setInterval(updatePhase, TIME_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [updatePhase]);

  // Target config based on current phase
  const targetConfig = ATMOSPHERE_CONFIG[phase];

  // Helper vectors/colors for lerping to avoid GC
  const targetColor = useMemo(() => new THREE.Color(), []);
  const targetBgColor = useMemo(() => new THREE.Color(), []);

  targetColor.set(targetConfig.color);
  targetBgColor.set(targetConfig.backgroundColor);

  useFrame(() => {
    if (!ambientLightRef.current || !sunLightRef.current) return;

    const stress = useResonanceStore.getState().currentStress;
    const activeProtocol = useSentinelStore.getState().activeProtocol;
    const protocolConfig = SENTINEL_PROTOCOLS[activeProtocol];

    // 1. Lerp Lights
    // Calculate target intensity based on Time Phase AND Sentinel Protocol AND Stress
    const targetBaseIntensity = Math.max(
      0,
      targetConfig.intensity *
      protocolConfig.lightIntensityMultiplier *
      (1 - stress * RESONANCE_LIGHT_DIMMER)
    );

    // Lerp the base intensity smoothly
    baseIntensityRef.current = THREE.MathUtils.lerp(
      baseIntensityRef.current,
      targetBaseIntensity,
      ATMOSPHERE_LERP_FACTOR
    );

    // Apply Breath Modulation (Immediate, no lerp)
    const breathValue = RespirationController.getValue();
    const isBreathActive = useRespirationStore.getState().isActive;
    // Pulse: 0.8x to 1.2x based on breath
    const breathMod = isBreathActive ? (0.8 + breathValue * 0.4) : 1.0;

    ambientLightRef.current.color.lerp(targetColor, ATMOSPHERE_LERP_FACTOR);
    ambientLightRef.current.intensity = baseIntensityRef.current * breathMod;

    sunLightRef.current.color.lerp(targetColor, ATMOSPHERE_LERP_FACTOR);
    sunLightRef.current.intensity = baseIntensityRef.current * breathMod;

    // 2. Lerp Background
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBgColor, ATMOSPHERE_LERP_FACTOR);
    } else {
      // eslint-disable-next-line
      scene.background = targetBgColor.clone(); // Initialize if null
    }

    // 3. Lerp Fog
    const baseFog = Math.max(0, targetConfig.fogDensity + protocolConfig.fogDensityOffset);
    const targetFogDensity = baseFog * (1 + stress * RESONANCE_FOG_MULTIPLIER);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(targetBgColor, ATMOSPHERE_LERP_FACTOR);
      // eslint-disable-next-line
      scene.fog.density = THREE.MathUtils.lerp(
        scene.fog.density,
        targetFogDensity,
        ATMOSPHERE_LERP_FACTOR
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Direct mutation of scene fog is required for Three.js
      scene.fog = new THREE.FogExp2(
        targetConfig.backgroundColor,
        targetFogDensity
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} />
      <directionalLight
        ref={sunLightRef}
        position={[10, 10, 10]}
      />
    </>
  );
};
