import { useMemo } from 'react';
import styles from './Aegis.module.css';
import { useAegisData } from './useAegisData';
import { useSentinelStore } from '../../stores/useSentinelStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { THREAT_LEVELS } from '../../constants';

// Import Types
import type { ThreatLevel } from '../../constants';
import type { NarrativeArc } from '../../stores/useNarrativeStore';

export const AegisCommandCenter = () => {
  const metrics = useAegisData();
  const { setManualOverride, setThreatLevel, isManualOverride } = useSentinelStore();
  const { setManualMode, setManualFrequency, manualMode, layerVolumes, setLayerVolume } = useAudioStore();
  const { setArc } = useNarrativeStore();

  const {
    protocol,
    currentStress,
    coherence,
    stressVelocity,
    projectedStress,
    history,
    threatLevel
  } = metrics;

  // Derived Status Color
  const statusClass = useMemo(() => {
    if (threatLevel === 'CRITICAL') return styles.critical;
    if (threatLevel === 'WARNING') return styles.warning;
    return '';
  }, [threatLevel]);

  // Sparkline Logic (Reused)
  const sparklinePath = useMemo(() => {
    if (history.length < 2) return '';
    const width = 250;
    const height = 60;
    const step = width / (history.length - 1);
    const points = history.map((val, i) => {
      const x = i * step;
      const y = height - (val * height);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [history]);

  return (
    <div className={styles.container} style={{ pointerEvents: 'none' }}>
      {/* HEADER */}
      <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', borderBottom: '1px solid rgba(0,255,255,0.3)', paddingBottom: 10, width: '60%'
      }}>
        <div className={styles.label} style={{ fontSize: '1rem', letterSpacing: '5px' }}>SENTINEL COMMAND INTERFACE</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>MK.II TACTICAL OVERRIDE SYSTEM</div>
      </div>

      {/* LEFT COLUMN: TELEMETRY & STATUS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', pointerEvents: 'auto' }}>

        {/* SYSTEM STATUS */}
        <div className={`${styles.panel} ${statusClass}`}>
          <span className={styles.label}>OPERATIONAL STATUS</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
                <span className={styles.label}>PROTOCOL</span>
                <div className={styles.value}>{protocol}</div>
            </div>
            <div>
                <span className={styles.label}>THREAT</span>
                <div className={styles.value}>{threatLevel}</div>
            </div>
          </div>
        </div>

        {/* BIO-TELEMETRY */}
        <div className={`${styles.panel} ${statusClass}`} style={{ width: '300px' }}>
          <span className={styles.label}>BIO-TELEMETRY</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
             <div>
                 <span className={styles.label}>STRESS</span>
                 <div className={styles.value}>{currentStress.toFixed(2)}</div>
             </div>
             <div style={{ textAlign: 'right' }}>
                 <span className={styles.label}>COHERENCE</span>
                 <div className={styles.value}>{coherence}%</div>
             </div>
          </div>
          <svg width="250" height="60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <path d={sparklinePath} className={styles.sparkline} />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.6 }}>
            <span>VEL: {stressVelocity.toFixed(3)}/s</span>
            <span>PROJ: {projectedStress.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-end', pointerEvents: 'auto' }}>

        {/* DEFENSE OVERRIDE */}
        <div className={styles.panel}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <span className={styles.label}>DEFENSE OVERRIDE</span>
               <button
                  onClick={() => setManualOverride(!isManualOverride)}
                  style={{
                      background: isManualOverride ? 'cyan' : 'transparent',
                      color: isManualOverride ? '#000' : 'cyan',
                      border: '1px solid cyan',
                      cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px'
                  }}
               >
                   {isManualOverride ? 'ACTIVE' : 'STANDBY'}
               </button>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', opacity: isManualOverride ? 1 : 0.4 }}>
               {Object.keys(THREAT_LEVELS).map(level => (
                   <button
                       key={level}
                       onClick={() => isManualOverride && setThreatLevel(level as ThreatLevel)}
                       style={{
                           background: threatLevel === level ? 'rgba(0,255,255,0.3)' : 'transparent',
                           border: '1px solid rgba(0,255,255,0.3)',
                           color: 'inherit', fontSize: '0.6rem', padding: '5px', cursor: isManualOverride ? 'pointer' : 'default'
                       }}
                   >
                       {level}
                   </button>
               ))}
           </div>
        </div>

        {/* NARRATIVE FORCE */}
        <div className={styles.panel}>
            <span className={styles.label}>NARRATIVE INJECTION</span>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                {['ASCENSION', 'DESCENT', 'STASIS'].map(arc => (
                    <button
                        key={arc}
                        onClick={() => setArc(arc as NarrativeArc)}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(200,200,255,0.3)',
                            color: 'rgba(200,200,255,0.8)',
                            fontSize: '0.6rem', padding: '5px', flex: 1, cursor: 'pointer'
                        }}
                    >
                        {arc}
                    </button>
                ))}
            </div>
        </div>

        {/* ACOUSTIC SHAPING */}
        <div className={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <span className={styles.label}>SONIC MANIPULATION</span>
               <button
                  onClick={() => setManualMode(!manualMode)}
                  style={{
                      background: manualMode ? 'cyan' : 'transparent',
                      color: manualMode ? '#000' : 'cyan',
                      border: '1px solid cyan',
                      cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px'
                  }}
               >
                   {manualMode ? 'MANUAL' : 'AUTO'}
               </button>
           </div>

           <div style={{ opacity: manualMode ? 1 : 0.5, pointerEvents: manualMode ? 'auto' : 'none' }}>
               <div style={{ marginBottom: '10px' }}>
                   <span className={styles.label}>DRONE FREQ (Hz)</span>
                   <input
                      type="range" min="50" max="200" step="1"
                      defaultValue="110"
                      onChange={(e) => setManualFrequency('drone', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'cyan' }}
                   />
               </div>
               <div style={{ marginBottom: '10px' }}>
                   <span className={styles.label}>BINAURAL BEAT (Hz)</span>
                   <input
                      type="range" min="1" max="30" step="0.5"
                      defaultValue="10"
                      onChange={(e) => setManualFrequency('binaural', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'cyan' }}
                   />
               </div>
           </div>

           <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
               <span className={styles.label}>MASTER MIX</span>
               {['drone', 'binaural', 'noise'].map(layer => (
                   <div key={layer} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                       <span style={{ fontSize: '0.6rem', width: '60px' }}>{layer.toUpperCase()}</span>
                       <input
                           type="range" min="0" max="1" step="0.05"
                           value={layerVolumes[layer as keyof typeof layerVolumes]}
                           onChange={(e) => setLayerVolume(layer as keyof typeof layerVolumes, parseFloat(e.target.value))}
                           style={{ flex: 1, accentColor: 'cyan' }}
                       />
                   </div>
               ))}
           </div>
        </div>

      </div>
    </div>
  );
};
