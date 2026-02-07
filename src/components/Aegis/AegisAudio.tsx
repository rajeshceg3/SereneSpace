import React from 'react';
import { useAudioStore } from '../../stores/useAudioStore';
import styles from './Aegis.module.css';

export const AegisAudio: React.FC = () => {
  const {
    layerVolumes,
    setLayerVolume,
    bioLockEnabled,
    setBioLock
  } = useAudioStore();

  const layers = [
    { id: 'drone', label: 'DRONE SYNTH' },
    { id: 'binaural', label: 'NEURAL SYNC' },
    { id: 'noise', label: 'ATMOSPHERE' },
    { id: 'reverb', label: 'SPATIAL DEPTH' },
  ] as const;

  return (
    <div className={styles.panel} style={{
      position: 'absolute',
      top: '50%',
      right: '20px',
      transform: 'translateY(-50%)',
      width: '250px',
      pointerEvents: 'auto' // Re-enable pointer events since container has none
    }}>
      <div className={styles.label} style={{ borderBottom: '1px solid rgba(0,255,255,0.2)', paddingBottom: '5px', marginBottom: '15px' }}>
        ACOUSTIC SHAPING INTERFACE
      </div>

      {/* Bio-Lock Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span className={styles.label} style={{ margin: 0 }}>BIO-LOCK</span>
        <button
          onClick={() => setBioLock(!bioLockEnabled)}
          style={{
            background: bioLockEnabled ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
            border: '1px solid cyan',
            color: bioLockEnabled ? '#fff' : 'rgba(255,255,255,0.5)',
            padding: '2px 10px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          {bioLockEnabled ? 'ACTIVE' : 'STANDBY'}
        </button>
      </div>

      {/* Sliders */}
      {layers.map((layer) => (
        <div key={layer.id} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span className={styles.label}>{layer.label}</span>
            <span className={styles.label}>{(layerVolumes[layer.id] * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={layerVolumes[layer.id]}
            onChange={(e) => setLayerVolume(layer.id, parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'cyan',
              cursor: 'pointer'
            }}
          />
        </div>
      ))}
    </div>
  );
};
