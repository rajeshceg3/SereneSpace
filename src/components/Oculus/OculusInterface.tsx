import React from 'react';
import { useEchoStore } from '../../stores/useEchoStore';
import { echoChamber } from '../../services/EchoChamber';
import './Oculus.css';

interface OculusInterfaceProps {
  visible: boolean;
}

export const OculusInterface: React.FC<OculusInterfaceProps> = ({ visible }) => {
  const {
    mode,
    currentStress,
    currentCoherence,
    resonanceScore,
    activeDroneFreq,
    snapshots,
    setMode
  } = useEchoStore();

  if (!visible) return null;

  return (
    <div className="oculus-overlay">
      <div className="oculus-header">
        <span className="oculus-title">Cognitive Echo // v0.9</span>
        <div className="oculus-status">
          STATUS: {mode}
        </div>
      </div>

      <div className="oculus-section">
        <span className="section-title">Resonance Metrics</span>
        <div className="metric-row">
          <span>Coherence</span>
          <span className="metric-value">{Math.round(currentCoherence)}%</span>
        </div>
        <div className="metric-row">
          <span>Stress Index</span>
          <span className="metric-value">{(currentStress * 100).toFixed(1)}</span>
        </div>
        <div className="metric-row">
          <span>Resonance Lock</span>
          <span className="metric-value">{Math.round(resonanceScore)}/100</span>
        </div>
        <div className="resonance-ring">
          <div className="resonance-fill" style={{ width: `${resonanceScore}%` }} />
        </div>
      </div>

      <div className="oculus-section">
        <span className="section-title">Acoustic Telemetry</span>
        <div className="metric-row">
          <span>Drone Frequency</span>
          <span className="metric-value">{activeDroneFreq.toFixed(2)} Hz</span>
        </div>
        <div className="graph-container">
          {snapshots.slice(-30).map((s, i) => (
            <div
              key={i}
              className="graph-bar"
              style={{
                height: `${s.resonanceScore}%`,
                opacity: (i + 1) / 30
              }}
            />
          ))}
        </div>
      </div>

      <div className="oculus-section">
        <span className="section-title">Tactical Override</span>
        <div className="control-row">
          <button
            className={`oculus-btn ${mode === 'ADAPT' ? 'active' : ''}`}
            onClick={() => setMode('ADAPT')}
          >
            AUTO-ADAPT
          </button>
          <button
             className={`oculus-btn ${mode === 'LOCKED' ? 'active' : ''}`}
             onClick={() => setMode('LOCKED')}
          >
            LOCK STATE
          </button>
          <button
             className={`oculus-btn ${mode === 'MANUAL' ? 'active' : ''}`}
             onClick={() => setMode('MANUAL')}
          >
            MANUAL
          </button>
        </div>
        <div className="control-row" style={{ fontSize: 10, color: '#8892b0' }}>
          <span>AGGRESSION: </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="0.5"
            onChange={(e) => echoChamber.setAggression(parseFloat(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
      </div>
    </div>
  );
};
