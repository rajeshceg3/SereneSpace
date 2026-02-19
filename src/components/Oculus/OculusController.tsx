import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOculusStore } from '../../stores/useOculusStore';
import { useResonanceStore } from '../../stores/useResonanceStore';

export const OculusController = () => {
  const isReplaying = useOculusStore((state) => state.isReplaying);
  const sessionPath = useOculusStore((state) => state.sessionPath);
  const setStress = useResonanceStore((state) => state.setStress);
  const { camera } = useThree();

  const prevIndexRef = useRef(0);
  const qPrev = useRef(new THREE.Quaternion());
  const qNext = useRef(new THREE.Quaternion());
  const vPrev = useRef(new THREE.Vector3());
  const vNext = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Only run logic if replaying and we have data
    if (!isReplaying || !sessionPath || sessionPath.length < 2) {
        return;
    }

    // Advance time in store (side effect)
    useOculusStore.getState().tick(delta);

    const currentTime = useOculusStore.getState().currentTime;

    // Find interpolation frame
    // Optimization: start search from previous index to avoid full scan
    let idx = prevIndexRef.current;

    // If we scrubbed backwards (time < current index timestamp), reset search
    const sessionStartTime = sessionPath[0].timestamp;
    const currentAbsTime = sessionStartTime + currentTime;

    if (idx >= sessionPath.length || sessionPath[idx].timestamp > currentAbsTime) {
        idx = 0;
    }

    while (idx < sessionPath.length - 1 && sessionPath[idx + 1].timestamp <= currentAbsTime) {
        idx++;
    }

    prevIndexRef.current = idx;

    const nextIdx = Math.min(idx + 1, sessionPath.length - 1);
    const prevPoint = sessionPath[idx];
    const nextPoint = sessionPath[nextIdx];

    const segmentDuration = nextPoint.timestamp - prevPoint.timestamp;
    const elapsedInSegment = currentAbsTime - prevPoint.timestamp;
    const alpha = segmentDuration > 0 ? Math.min(Math.max(elapsedInSegment / segmentDuration, 0), 1) : 0;

    // Position Interpolation
    vPrev.current.set(prevPoint.x, prevPoint.y, prevPoint.z);
    vNext.current.set(nextPoint.x, nextPoint.y, nextPoint.z);
    camera.position.lerpVectors(vPrev.current, vNext.current, alpha);

    // Rotation Interpolation
    if (
        prevPoint.qx !== undefined && prevPoint.qy !== undefined && prevPoint.qz !== undefined && prevPoint.qw !== undefined &&
        nextPoint.qx !== undefined && nextPoint.qy !== undefined && nextPoint.qz !== undefined && nextPoint.qw !== undefined
    ) {
        qPrev.current.set(prevPoint.qx, prevPoint.qy, prevPoint.qz, prevPoint.qw);
        qNext.current.set(nextPoint.qx, nextPoint.qy, nextPoint.qz, nextPoint.qw);
        camera.quaternion.slerpQuaternions(qPrev.current, qNext.current, alpha);
    } else {
        // Fallback: if no rotation data exists (legacy sessions), look at origin
        camera.lookAt(0, 0, 0);
    }

    // Stress Interpolation
    const stress = THREE.MathUtils.lerp(prevPoint.stress, nextPoint.stress, alpha);
    setStress(stress);
  });

  return null;
};
