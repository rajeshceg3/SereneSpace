import React, { useMemo } from 'react';
import styles from './Aegis.module.css';
import type { AegisMetrics } from './types';

interface AegisDisplayProps {
  metrics: AegisMetrics;
}

export const AegisDisplay: React.FC<AegisDisplayProps> = ({ metrics }) => {
  const {
    protocol,
    protocolDuration,
    stressVelocity,
    projectedStress,
    confidence,
    currentStress,
    coherence,
    history,
  } = metrics;

  // Determine System Status
  const systemStatus = useMemo(() => {
    if (currentStress > 0.9 || projectedStress > 0.9) return 'CRITICAL';
    if (stressVelocity > 0.05 || currentStress > 0.7) return 'WARNING';
    return 'NOMINAL';
  }, [currentStress, projectedStress, stressVelocity]);

  const statusClass = useMemo(() => {
    if (systemStatus === 'CRITICAL') return styles.critical;
    if (systemStatus === 'WARNING') return styles.warning;
    return '';
  }, [systemStatus]);

  // Generate Sparkline Path
  const sparklinePath = useMemo(() => {
    if (history.length < 2) return '';
    const width = 200;
    const height = 50;
    const step = width / (history.length - 1);

    // Invert Y because SVG 0 is top
    const points = history.map((val, i) => {
      const x = i * step;
      const y = height - (val * height); // val is 0-1 (stress), so 1 is top (0y), 0 is bottom (50y)
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [history]);

  return (
    <div className={styles.container}>
      {/* Top Sector */}
      <div className={styles.topSector}>
        <div className={`${styles.panel} ${statusClass}`}>
          <span className={styles.label}>SENTINEL PROTOCOL</span>
          <div className={styles.value}>{protocol}</div>
          <span className={styles.label} style={{ marginTop: 10 }}>T-PLUS</span>
          <div className={styles.value}>
            {Math.floor(protocolDuration / 60).toString().padStart(2, '0')}:
            {(protocolDuration % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className={`${styles.panel} ${statusClass}`} style={{ textAlign: 'right' }}>
           <span className={styles.label}>SYSTEM STATUS</span>
           <div className={styles.value}>{systemStatus}</div>
        </div>
      </div>

      {/* Intervention Warning */}
      {systemStatus === 'CRITICAL' && (
        <div className={`${styles.interventionOverlay} ${styles.critical}`}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>STRESS SPIKE DETECTED</div>
          <div>INITIATE CALMING PROTOCOL</div>
        </div>
      )}

      {/* Bottom Sector */}
      <div className={styles.bottomSector}>
        {/* Predictive Analytics */}
        <div className={`${styles.panel} ${statusClass}`}>
          <span className={styles.label}>PREDICTIVE MODEL (CONF: {Math.round(confidence * 100)}%)</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <span className={styles.label}>VELOCITY</span>
              <div className={styles.value}>{stressVelocity.toFixed(4)} /s</div>
            </div>
            <div>
               <span className={styles.label}>PROJECTED</span>
               <div className={styles.value}>{projectedStress.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Telemetry Sparkline */}
        <div className={`${styles.panel} ${statusClass}`} style={{ minWidth: '220px' }}>
          <span className={styles.label}>COHERENCE TELEMETRY ({coherence})</span>
          <svg width="200" height="50" style={{ marginTop: '10px' }}>
            <path d={sparklinePath} className={styles.sparkline} />
          </svg>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '5px', opacity: 0.7 }}>
            <span>-2s</span>
            <span>NOW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
