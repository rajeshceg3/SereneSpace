import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDestinationStore } from '../stores/useDestinationStore';
import type { Destination } from '../types';
import {
  CAMERA_LERP_FACTOR,
  FOCUS_THRESHOLD,
  GROUP_ROTATION_X_FACTOR,
  GROUP_ROTATION_Y_FACTOR,
  BREATHING_X_FACTOR,
  BREATHING_Y_FACTOR,
  PARALLAX_X_FACTOR,
  PARALLAX_Y_FACTOR,
  PROXIMITY_CHECK_THRESHOLD,
} from '../constants';
import { useRef } from 'react';

export const CameraManager = ({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) => {
  const {
    destinations,
    activeDestination,
    setActiveDestination,
    cameraTargetZ,
    reducedMotion,
  } = useDestinationStore();
  const lastCameraZRef = useRef<number | null>(null);

  useFrame((state) => {
    // Smooth camera Z movement
    if (reducedMotion) {
      state.camera.position.z = cameraTargetZ;
    } else {
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraTargetZ, CAMERA_LERP_FACTOR);
    }

    // --- Proximity check optimization ---
    // Only check for the closest destination if the camera has moved enough.
    if (lastCameraZRef.current === null || Math.abs(state.camera.position.z - lastCameraZRef.current) > PROXIMITY_CHECK_THRESHOLD) {
      lastCameraZRef.current = state.camera.position.z;

      let closestDist = Infinity;
      let closestDest: Destination | null = null;

      for (const dest of destinations) {
        const dist = state.camera.position.distanceTo(new THREE.Vector3(...dest.coordinates));
        if (dist < closestDist) {
          closestDist = dist;
          closestDest = dest;
        }
      }

      if (closestDest && closestDist < FOCUS_THRESHOLD) {
        // Avoids setting state on every frame if it's already active
        if (activeDestination !== closestDest.id) {
          setActiveDestination(closestDest.id);
        }
      } else {
        // If nothing is in focus, clear the active destination
        if (activeDestination !== null) {
          setActiveDestination(null);
        }
      }
    }

    // --- Ambient motion (if not reduced) ---
    if (reducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Slow object rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = t * GROUP_ROTATION_Y_FACTOR;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * GROUP_ROTATION_X_FACTOR;
    }

    // Camera breathing effect
    const breathingX = Math.sin(t * 0.2) * BREATHING_X_FACTOR;
    const breathingY = Math.cos(t * 0.2) * BREATHING_Y_FACTOR;

    // Mouse parallax
    const parallaxX = state.pointer.x * PARALLAX_X_FACTOR;
    const parallaxY = state.pointer.y * PARALLAX_Y_FACTOR;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, breathingX + parallaxX, CAMERA_LERP_FACTOR);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, breathingY + parallaxY, CAMERA_LERP_FACTOR);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};
