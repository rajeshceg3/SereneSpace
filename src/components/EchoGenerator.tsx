import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useEchoStore } from '../stores/useEchoStore';

const RESONANCE_THRESHOLD = 0.15;
const RESONANCE_DURATION_MS = 3000;
const MIN_DISTANCE = 50;
const ECHO_HEIGHT = -2;

export const EchoGenerator = () => {
  const { camera } = useThree();
  const addEcho = useEchoStore((state) => state.addEcho);
  const loadEchoes = useEchoStore((state) => state.loadEchoes);

  useEffect(() => {
    loadEchoes();
  }, [loadEchoes]);

  const resonanceTimer = useRef(0);

  useFrame((_, delta) => {
    const stress = useResonanceStore.getState().currentStress;

    if (stress < RESONANCE_THRESHOLD) {
      resonanceTimer.current += delta * 1000;
    } else {
      resonanceTimer.current = 0;
    }

    if (resonanceTimer.current > RESONANCE_DURATION_MS) {
      const echoes = useEchoStore.getState().echoes;
      const currentPos = camera.position;

      const lastEcho = echoes[echoes.length - 1];

      let canAdd = true;
      if (lastEcho) {
        const lastPos = new THREE.Vector3(...lastEcho.position);
        if (currentPos.distanceTo(lastPos) < MIN_DISTANCE) {
          canAdd = false;
        }
      }

      if (canAdd) {
        // Add echo at current camera X/Z, fixed Y at -2 (ground level)
        addEcho([currentPos.x, ECHO_HEIGHT, currentPos.z]);

        // Reset timer to prevent immediate re-triggering
        resonanceTimer.current = 0;
      }
    }
  });

  return null;
};
