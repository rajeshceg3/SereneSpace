import { useState, useEffect } from 'react';
import { useAudioStore } from '../stores/useAudioStore';
import { audioEngine } from '../services/AudioEngine';

export const AudioControls = () => {
  const isMuted = useAudioStore((state) => state.isMuted);
  const isInitialized = useAudioStore((state) => state.isInitialized);
  const isSupported = useAudioStore((state) => state.isSupported);
  const volume = useAudioStore((state) => state.volume);
  const toggleMute = useAudioStore((state) => state.toggleMute);
  const initializeAudio = useAudioStore((state) => state.initializeAudio);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in after UI becomes visible (usually 2s)
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        if (!isInitialized) {
          audioEngine.init();
          await audioEngine.start(volume);
          initializeAudio();
        } else {
          toggleMute();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInitialized, toggleMute, initializeAudio, volume]);

  if (!isSupported) return null;

  const handleClick = async () => {
    if (!isInitialized) {
      audioEngine.init();
      await audioEngine.start(volume);
      initializeAudio();
    } else {
      toggleMute();
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1s ease-in-out',
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: "'Roboto Mono', monospace",
        fontSize: '12px',
        letterSpacing: '1px',
        cursor: 'pointer',
        userSelect: 'none',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(4px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
      }}
    >
      {!isInitialized ? 'INIT AUDIO [M]' : (isMuted ? 'UNMUTE [M]' : 'MUTE [M]')}
    </div>
  );
};
