import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useDestinationStore } from '../stores/useDestinationStore';
import { Cartographer } from '../services/Cartographer';
import { INFINITE_HORIZON_CONFIG } from '../constants';

export const InfiniteHorizon = () => {
  const { camera } = useThree();
  const timeSinceLastCheck = useRef(0);
  const isGenerating = useRef(false);

  useFrame((_, delta) => {
    // Throttle checks to twice per second
    timeSinceLastCheck.current += delta;
    if (timeSinceLastCheck.current < 0.5) return;
    timeSinceLastCheck.current = 0;

    const { destinations, addDestinations, removeDestinations } = useDestinationStore.getState();

    if (destinations.length === 0) return;

    // --- GENERATION LOGIC ---
    const lastDest = destinations[destinations.length - 1];

    // Calculate distance from camera to the last destination
    // Camera moves in negative Z. Last destination is at a large negative Z.
    // Example: Camera at -10, Last at -100. Diff is 90.
    // Example: Camera at -80, Last at -100. Diff is 20. (Trigger generation)
    const distanceToEnd = camera.position.z - lastDest.coordinates[2];

    if (distanceToEnd < INFINITE_HORIZON_CONFIG.GENERATION_THRESHOLD && !isGenerating.current) {
      isGenerating.current = true;

      const newBatch = [];
      let currentLast = lastDest;

      // Generate a batch of new destinations
      for (let i = 0; i < INFINITE_HORIZON_CONFIG.BATCH_SIZE; i++) {
        const next = Cartographer.generateNextDestination(currentLast);
        newBatch.push(next);
        currentLast = next;
      }

      addDestinations(newBatch);

      // Reset flag immediately as the store update is synchronous
      isGenerating.current = false;
    }

    // --- CULLING LOGIC ---
    // Remove destinations that are far behind the camera
    // "Behind" means positive Z relative to camera (since we move negative)
    const cullZ = camera.position.z + INFINITE_HORIZON_CONFIG.CULL_THRESHOLD;

    // Find IDs to remove
    const toCull = destinations
      .filter((d) => d.coordinates[2] > cullZ)
      .map((d) => d.id);

    if (toCull.length > 0) {
      removeDestinations(toCull);
    }
  });

  return null;
};
