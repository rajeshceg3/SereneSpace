import { useEffect, useRef } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';
import { useAudioStore } from '../stores/useAudioStore';
import { audioEngine } from '../services/AudioEngine';

export const AcousticField = () => {
  const { isInitialized, isMuted, volume, setSupported } = useAudioStore();
  const requestRef = useRef<number>();

  // 1. Initialize Engine
  useEffect(() => {
    const success = audioEngine.init();
    setSupported(success);

    // Cleanup on unmount
    return () => {
      audioEngine.stop();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [setSupported]);

  // 2. Handle State Changes (Mute/Volume)
  useEffect(() => {
    if (isInitialized) {
      if (!isMuted) {
        audioEngine.setVolume(volume);
      } else {
        // Fade out if muted, don't just stop abrupt
        audioEngine.setVolume(0);
      }
    }
  }, [isInitialized, isMuted, volume]);

  // 3. Animation Loop (Independent of 3D Canvas)
  useEffect(() => {
    const animate = () => {
      // Only update if running to save CPU
      const store = useAudioStore.getState();
      if (store.isInitialized && !store.isMuted) {
         const stress = useResonanceStore.getState().currentStress;
         const protocol = useSentinelStore.getState().activeProtocol;
         const entrainmentFreq = useEntrainmentStore.getState().targetFreq;

         audioEngine.update(stress, protocol, entrainmentFreq);
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return null;
};
