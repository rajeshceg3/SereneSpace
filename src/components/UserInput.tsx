import { useCallback, useEffect, useRef } from 'react';
import { useDestinationStore } from '../stores/useDestinationStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import {
  SCROLL_SENSITIVITY,
  CAMERA_TARGET_Z_MIN,
  CAMERA_TARGET_Z_MAX,
  CAMERA_POSITION_Z_OFFSET,
  RESONANCE_SCROLL_IMPACT,
  RESONANCE_KEY_IMPACT,
} from '../constants';

// Force-include
export const UserInput = () => {
  const {
    destinations,
    activeDestination,
    setActiveDestination,
    cameraTargetZ,
    setCameraTargetZ,
  } = useDestinationStore();

  const addStress = useResonanceStore((state) => state.addStress);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const newTargetZ = cameraTargetZ - event.deltaY * SCROLL_SENSITIVITY;
      setCameraTargetZ(Math.max(CAMERA_TARGET_Z_MIN, Math.min(CAMERA_TARGET_Z_MAX, newTargetZ)));

      // Add stress based on scroll intensity (clamped to avoid massive spikes)
      const intensity = Math.min(Math.abs(event.deltaY) * 0.01, 1);
      addStress(intensity * RESONANCE_SCROLL_IMPACT);
    },
    [cameraTargetZ, setCameraTargetZ, addStress],
  );

  const cycleDestination = useCallback(
    (direction: 1 | -1) => {
      if (destinations.length === 0) return;

      const currentIndex = destinations.findIndex((d) => d.id === activeDestination);
      const nextIndex =
        direction === 1
          ? currentIndex >= 0
            ? (currentIndex + 1) % destinations.length
            : 0
          : currentIndex >= 0
            ? (currentIndex - 1 + destinations.length) % destinations.length
            : destinations.length - 1;

      const nextDestination = destinations[nextIndex];
      setActiveDestination(nextDestination.id);
      setCameraTargetZ(nextDestination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);

      // Add stress on navigation
      addStress(RESONANCE_KEY_IMPACT);
    },
    [destinations, activeDestination, setActiveDestination, setCameraTargetZ, addStress],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        // Prevent default browser action for Arrow keys to avoid page scroll (though canvas captures it usually)
        event.preventDefault();
        cycleDestination(event.key === 'ArrowRight' ? 1 : -1);
      }
    },
    [cycleDestination],
  );

  // Horizontal swipe mirrors ArrowLeft/Right destination cycling on touch devices.
  // Thresholds: 50px horizontal travel, max 40px vertical deviation, horizontal-dominant only,
  // so taps on destination markers and vertical scrolling are unaffected.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || event.changedTouches.length !== 1) return;

      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < 50 || Math.abs(dy) > 40 || Math.abs(dy) >= Math.abs(dx)) return;

      cycleDestination(dx < 0 ? 1 : -1);
    },
    [cycleDestination],
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchEnd]);

  return null; // This component does not render anything
};
