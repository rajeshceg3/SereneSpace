import React, { useEffect, useState } from 'react';
import { audioEngine } from '../../services/AudioEngine';
import { useAetherStore } from '../../stores/useAetherStore';

export const AudioMixer: React.FC = () => {
  const [mix, setMix] = useState({
    drone: 0.5,
    binaural: 0.3,
    pinkNoise: 0.5,
    brownNoise: 0.5,
    reverb: 0.3
  });

  const [presetName, setPresetName] = useState('');
  const savePreset = useAetherStore((state) => state.savePreset);
  const presets = useAetherStore((state) => state.presets);

  useEffect(() => {
    // Initialize from engine
    const current = audioEngine.getMixState();
    setMix(current);
  }, []);

  const handleVolumeChange = (layer: keyof typeof mix, val: number) => {
    setMix(prev => ({ ...prev, [layer]: val }));
    audioEngine.setLayerVolume(layer as any, val);
  };

  const handleSave = () => {
    if (!presetName) return;
    const id = `preset-${Date.now()}`;
    savePreset({
      id,
      name: presetName,
      mix
    });
    setPresetName('');
  };

  const loadPreset = (preset: typeof presets[0]) => {
    setMix(preset.mix);
    audioEngine.setLayerVolume('drone', preset.mix.drone);
    audioEngine.setLayerVolume('binaural', preset.mix.binaural);
    audioEngine.setLayerVolume('reverb', preset.mix.reverb);
    audioEngine.setLayerVolume('pinkNoise', preset.mix.pinkNoise);
    audioEngine.setLayerVolume('brownNoise', preset.mix.brownNoise);
  };

  return (
    <div className="audio-mixer" style={{ padding: '1rem', color: '#fff' }}>
      <h3>AETHERIC MIXER</h3>

      <div className="faders" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(mix).map(([key, val]) => (
          <div key={key} className="fader-group">
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={val}
              onChange={(e) => handleVolumeChange(key as keyof typeof mix, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#5af' }}
            />
            <span style={{ fontSize: '0.8rem', float: 'right' }}>{(val * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="presets" style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
        <h4>PRESETS</h4>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="New Preset Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '0.5rem', flex: 1 }}
          />
          <button
            onClick={handleSave}
            disabled={!presetName}
            style={{ background: '#5af', border: 'none', color: '#000', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            SAVE
          </button>
        </div>

        <div className="preset-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {presets.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#222', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span>{p.name}</span>
                    <button
                        onClick={() => loadPreset(p)}
                        style={{ background: 'transparent', border: '1px solid #5af', color: '#5af', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        LOAD
                    </button>
                </div>
            ))}
            {presets.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No saved presets</div>}
        </div>
      </div>
    </div>
  );
};
