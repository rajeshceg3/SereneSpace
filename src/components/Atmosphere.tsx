import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTimeStore } from '../stores/useTimeStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import {
  ATMOSPHERE_CONFIG,
  ATMOSPHERE_LERP_FACTOR,
  TIME_CHECK_INTERVAL,
  RESONANCE_FOG_MULTIPLIER,
  RESONANCE_LIGHT_DIMMER,
} from '../constants';

// Force-include
export const Atmosphere = () => {
  const { phase, updatePhase } = useTimeStore();
  const { scene } = useThree();

  // Refs for lights to update them in useFrame
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  // Timer for phase updates
  useEffect(() => {
    updatePhase(); // Check immediately on mount
    const interval = setInterval(updatePhase, TIME_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [updatePhase]);

  // Target config based on current phase
  const targetConfig = ATMOSPHERE_CONFIG[phase];

  // Helper vectors/colors for lerping to avoid GC
  // Note: We create new instances here per render, but since this is a low-frequency update (phase change),
  // it's acceptable. The lerping happens in useFrame using these as targets.
  const targetColor = new THREE.Color(targetConfig.color);
  const targetBgColor = new THREE.Color(targetConfig.backgroundColor);

  useFrame(() => {
    if (!ambientLightRef.current || !sunLightRef.current) return;

    const stress = useResonanceStore.getState().currentStress;

    // 1. Lerp Lights
    ambientLightRef.current.color.lerp(targetColor, ATMOSPHERE_LERP_FACTOR);
    ambientLightRef.current.intensity = THREE.MathUtils.lerp(
      ambientLightRef.current.intensity,
      targetConfig.intensity * (1 - stress * RESONANCE_LIGHT_DIMMER),
      ATMOSPHERE_LERP_FACTOR
    );

    sunLightRef.current.color.lerp(targetColor, ATMOSPHERE_LERP_FACTOR);
    sunLightRef.current.intensity = THREE.MathUtils.lerp(
      sunLightRef.current.intensity,
      targetConfig.intensity * (1 - stress * RESONANCE_LIGHT_DIMMER),
      ATMOSPHERE_LERP_FACTOR
    );

    // 2. Lerp Background
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBgColor, ATMOSPHERE_LERP_FACTOR);
    } else {
      // eslint-disable-next-line
      scene.background = targetBgColor.clone(); // Initialize if null
    }

    // 3. Lerp Fog
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(targetBgColor, ATMOSPHERE_LERP_FACTOR);
      // eslint-disable-next-line
      scene.fog.density = THREE.MathUtils.lerp(
        scene.fog.density,
        targetConfig.fogDensity * (1 + stress * RESONANCE_FOG_MULTIPLIER),
        ATMOSPHERE_LERP_FACTOR
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Direct mutation of scene fog is required for Three.js
      scene.fog = new THREE.FogExp2(
        targetConfig.backgroundColor,
        targetConfig.fogDensity * (1 + stress * RESONANCE_FOG_MULTIPLIER)
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
