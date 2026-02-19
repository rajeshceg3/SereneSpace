import React from 'react';
import { useOculusStore } from '../../stores/useOculusStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import './OculusHUD.css';

export const OculusHUD = () => {
  const isReplaying = useOculusStore((state) => state.isReplaying);
  const currentTime = useOculusStore((state) => state.currentTime);
  const duration = useOculusStore((state) => state.duration);
  const playbackSpeed = useOculusStore((state) => state.playbackSpeed);
  const stopReplay = useOculusStore((state) => state.stopReplay);
  const seek = useOculusStore((state) => state.seek);
  const setSpeed = useOculusStore((state) => state.setSpeed);

  const currentStress = useResonanceStore((state) => state.currentStress);

  if (!isReplaying) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  return (
    <div className="oculus-hud-overlay">
      <div className="oculus-hud-container">
        <div className="oculus-hud-header">
          <h2>OCULUS // TEMPORAL INSIGHT</h2>
          <button className="oculus-close-btn" onClick={stopReplay}>EXIT REPLAY</button>
        </div>

        <div className="oculus-hud-main">

          <div className="oculus-metrics">
            <div className="oculus-metric-item">
                <label>STRESS INTENSITY</label>
                <div
                  className="oculus-metric-value"
                  style={{ color: `hsl(${120 * (1 - currentStress)}, 100%, 50%)` }}
                >
                    {(currentStress * 100).toFixed(0)}%
                </div>
            </div>

            <div className="oculus-metric-item">
                <label>PLAYBACK SPEED</label>
                <div className="oculus-speed-controls">
                    {[0.5, 1, 2, 4].map((speed) => (
                        <button
                            key={speed}
                            className={`oculus-speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                            onClick={() => setSpeed(speed)}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="oculus-timeline">
            <span className="oculus-time">{formatTime(currentTime)}</span>
            <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="oculus-scrubber"
            />
            <span className="oculus-time">{formatTime(duration)}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
