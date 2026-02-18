import { useMemo } from 'react';
import styles from './Aegis.module.css';
import { useAegisData } from './useAegisData';
import { useSentinelStore } from '../../stores/useSentinelStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { useBioLinkStore } from '../../stores/useBioLinkStore';
import { bioLinkService } from '../../services/BioLinkService';
import { THREAT_LEVELS, SENTINEL_PROTOCOLS } from '../../constants';

// Import Types
import type { ThreatLevel } from '../../constants';
import type { NarrativeArc } from '../../stores/useNarrativeStore';

type Protocol = keyof typeof SENTINEL_PROTOCOLS;

export const AegisCommandCenter = () => {
  const metrics = useAegisData();
  const {
    setManualOverride,
    setThreatLevel,
    isManualOverride,
    lockedProtocol,
    setLockedProtocol,
    isSimulationPaused,
    setSimulationPaused
  } = useSentinelStore();
  const { setManualMode, setManualFrequency, manualMode, layerVolumes, setLayerVolume } = useAudioStore();
  const { setArc } = useNarrativeStore();
  const { isConnected, isConnecting, heartRate, hrv, deviceName } = useBioLinkStore();

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
    <div className={`${styles.container} ${styles.scanline} ${styles.flicker}`} style={{ pointerEvents: 'none' }}>
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
                <div className={styles.value} style={{ color: lockedProtocol ? '#ffaa00' : 'inherit' }}>
                    {lockedProtocol ? `${lockedProtocol} [LOCKED]` : protocol}
                </div>
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

        {/* BIO-LINK NODE (NEW) */}
        <div className={styles.panel}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <span className={styles.label}>BIO-LINK NODE</span>
               <button
                  onClick={() => isConnected ? bioLinkService.disconnect() : bioLinkService.connect()}
                  disabled={isConnecting}
                  className={styles.tacticalButton}
                  style={{
                      color: isConnected ? '#00ff00' : (isConnecting ? '#ffff00' : 'cyan'),
                      borderColor: isConnected ? '#00ff00' : (isConnecting ? '#ffff00' : 'cyan')
                  }}
               >
                   {isConnecting ? 'SCANNING...' : (isConnected ? 'DISCONNECT' : 'LINK SENSOR')}
               </button>
           </div>

           {isConnected ? (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <div>
                       <span className={styles.label}>HEART RATE</span>
                       <div className={styles.value}>{heartRate} <span style={{fontSize: '0.6rem'}}>BPM</span></div>
                   </div>
                   <div>
                       <span className={styles.label}>HRV (RMSSD)</span>
                       <div className={styles.value}>{hrv} <span style={{fontSize: '0.6rem'}}>MS</span></div>
                   </div>
                   <div style={{ gridColumn: 'span 2', fontSize: '0.6rem', opacity: 0.7, marginTop: '5px' }}>
                       DEVICE: {deviceName}
                   </div>
               </div>
           ) : (
               <div style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                   NO BIOMETRIC FEED LINKED
               </div>
           )}
        </div>

      </div>

      {/* RIGHT COLUMN: CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-end', pointerEvents: 'auto' }}>

        {/* TACTICAL OVERRIDE (NEW) */}
        <div className={styles.panel}>
            <span className={styles.label}>TACTICAL OVERRIDE</span>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={() => setSimulationPaused(!isSimulationPaused)}
                    className={styles.tacticalButton}
                    style={{
                        width: '100%',
                        background: isSimulationPaused ? 'rgba(255, 50, 50, 0.2)' : 'transparent',
                        borderColor: isSimulationPaused ? '#ff3333' : 'cyan',
                        color: isSimulationPaused ? '#ff3333' : 'cyan'
                    }}
                >
                    {isSimulationPaused ? '⚠ SIMULATION FROZEN ⚠' : 'PAUSE SIMULATION'}
                </button>
            </div>

            <span className={styles.label}>PROTOCOL LOCK</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '5px' }}>
                 <button
                    onClick={() => setLockedProtocol(null)}
                    className={styles.tacticalButton}
                    style={{ opacity: !lockedProtocol ? 1 : 0.5, background: !lockedProtocol ? 'rgba(0,255,255,0.2)' : 'transparent' }}
                 >
                     AUTO
                 </button>
                 {Object.keys(SENTINEL_PROTOCOLS).map(p => (
                     <button
                        key={p}
                        onClick={() => setLockedProtocol(p as Protocol)}
                        className={styles.tacticalButton}
                        style={{
                            opacity: lockedProtocol === p ? 1 : 0.5,
                            background: lockedProtocol === p ? 'rgba(255, 170, 0, 0.2)' : 'transparent',
                            borderColor: lockedProtocol === p ? '#ffaa00' : 'rgba(0,255,255,0.3)',
                            color: lockedProtocol === p ? '#ffaa00' : 'rgba(0,255,255,0.8)'
                        }}
                     >
                         {p}
                     </button>
                 ))}
            </div>
        </div>

        {/* DEFENSE OVERRIDE */}
        <div className={styles.panel}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <span className={styles.label}>DEFENSE OVERRIDE</span>
               <button
                  onClick={() => setManualOverride(!isManualOverride)}
                  className={styles.tacticalButton}
                  style={{
                      background: isManualOverride ? 'cyan' : 'transparent',
                      color: isManualOverride ? '#000' : 'cyan',
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
                       className={styles.tacticalButton}
                       style={{
                           background: threatLevel === level ? 'rgba(0,255,255,0.3)' : 'transparent',
                           border: '1px solid rgba(0,255,255,0.3)',
                           cursor: isManualOverride ? 'pointer' : 'default'
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
                        className={styles.tacticalButton}
                        style={{ flex: 1 }}
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
                  className={styles.tacticalButton}
                  style={{
                      background: manualMode ? 'cyan' : 'transparent',
                      color: manualMode ? '#000' : 'cyan',
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
