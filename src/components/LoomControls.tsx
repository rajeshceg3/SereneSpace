import React from 'react';

interface LoomControlsProps {
  progress: number;
  isPlaying: boolean;
  onProgressChange: (value: number) => void;
  onTogglePlay: () => void;
  onClose: () => void;
}

export const LoomControls: React.FC<LoomControlsProps> = ({
  progress,
  isPlaying,
  onProgressChange,
  onTogglePlay,
  onClose,
}) => {
  return (
    <div style={{
      pointerEvents: 'auto',
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '600px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Chrono-Synaptic Loom
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: '4px 8px'
          }}
          aria-label="Close Loom"
        >
          ×
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.8rem', width: '40px', textAlign: 'right', opacity: 0.7 }}>
          {Math.round(progress * 100)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={(e) => onProgressChange(parseFloat(e.target.value))}
          style={{
            flex: 1,
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            appearance: 'none',
            cursor: 'pointer',
            accentColor: '#fff' // Modern browsers support this
          }}
        />
        <span style={{ fontSize: '0.8rem', width: '40px', opacity: 0.7 }}>
          END
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button
          onClick={onTogglePlay}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', marginTop: '-8px' }}>
        Review your journey's coherence flow
      </div>
    </div>
  );
};
