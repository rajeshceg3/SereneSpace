import React, { useState } from 'react';
import { useAetherStore } from '../../stores/useAetherStore';
import type { DefenseProfile, Rule } from '../../stores/useAetherStore';
import { SENTINEL_PROTOCOLS } from '../../constants';

export const ProtocolEditor: React.FC = () => {
  const profiles = useAetherStore((state) => state.profiles);
  const activeProfileId = useAetherStore((state) => state.activeProfileId);
  const presets = useAetherStore((state) => state.presets);
  const setActiveProfile = useAetherStore((state) => state.setActiveProfile);
  const addProfile = useAetherStore((state) => state.addProfile);
  const updateProfile = useAetherStore((state) => state.updateProfile);
  const deleteProfile = useAetherStore((state) => state.deleteProfile);
  const isCustomProfileActive = useAetherStore((state) => state.isCustomProfileActive);
  const setCustomProfileActive = useAetherStore((state) => state.setCustomProfileActive);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');

  const handleCreateProfile = () => {
    if (!newProfileName) return;
    const newProfile: DefenseProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName,
      rules: []
    };
    addProfile(newProfile);
    setNewProfileName('');
    setEditingId(newProfile.id);
  };

  const handleAddRule = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      enabled: true,
      condition: { metric: 'STRESS', operator: '>', threshold: 0.8, duration: 3 },
      action: { type: 'INTERVENTION', target: 'GROUNDING' }
    };

    updateProfile({
      ...profile,
      rules: [...profile.rules, newRule]
    });
  };

  const handleUpdateRule = (profileId: string, ruleId: string, updates: Partial<Rule> | Partial<Rule['condition']> | Partial<Rule['action']>) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const updatedRules = profile.rules.map(r => {
      if (r.id !== ruleId) return r;
      // Deep merge logic simplified
      if ('metric' in updates || 'operator' in updates || 'threshold' in updates || 'duration' in updates) {
          return { ...r, condition: { ...r.condition, ...updates } };
      }
      if ('type' in updates || 'target' in updates) {
          return { ...r, action: { ...r.action, ...updates } };
      }
      return { ...r, ...updates };
    });

    updateProfile({ ...profile, rules: updatedRules });
  };

  const handleDeleteRule = (profileId: string, ruleId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    updateProfile({
        ...profile,
        rules: profile.rules.filter(r => r.id !== ruleId)
    });
  };

  const editingProfile = profiles.find(p => p.id === editingId);

  return (
    <div className="protocol-editor" style={{ padding: '1rem', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>DEFENSE PROTOCOLS</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <input
                type="checkbox"
                checked={isCustomProfileActive}
                onChange={(e) => setCustomProfileActive(e.target.checked)}
            />
            ACTIVATE CUSTOM LOGIC
        </label>
      </div>

      {!editingProfile ? (
        <div className="profile-list">
            <div className="create-new" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="New Profile Name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', background: '#222', border: '1px solid #444', color: '#fff' }}
                />
                <button onClick={handleCreateProfile} style={{ background: '#5af', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}>CREATE</button>
            </div>

            {profiles.map(p => (
                <div key={p.id} style={{
                    padding: '1rem',
                    background: activeProfileId === p.id ? 'rgba(85, 170, 255, 0.2)' : '#222',
                    border: activeProfileId === p.id ? '1px solid #5af' : '1px solid #444',
                    marginBottom: '0.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{p.rules.length} Rules</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setActiveProfile(p.id)}
                            disabled={activeProfileId === p.id}
                            style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: '1px solid #5af', color: '#5af', opacity: activeProfileId === p.id ? 0.5 : 1 }}
                        >
                            {activeProfileId === p.id ? 'ACTIVE' : 'ACTIVATE'}
                        </button>
                        <button onClick={() => setEditingId(p.id)} style={{ padding: '0.2rem 0.5rem' }}>EDIT</button>
                        <button onClick={() => deleteProfile(p.id)} style={{ padding: '0.2rem 0.5rem', color: '#f55' }}>DEL</button>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="edit-view" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setEditingId(null)} style={{ alignSelf: 'flex-start', marginBottom: '1rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                &larr; BACK TO LIST
            </button>
            <h4 style={{ marginBottom: '1rem' }}>EDITING: {editingProfile.name}</h4>

            <div className="rules-list" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                {editingProfile.rules.map((rule, idx) => (
                    <div key={rule.id} style={{ background: '#1a1a1a', padding: '0.5rem', marginBottom: '0.5rem', borderLeft: rule.enabled ? '3px solid #5af' : '3px solid #444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>RULE #{idx + 1}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={rule.enabled}
                                        onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { enabled: e.target.checked })}
                                    /> Enabled
                                </label>
                                <button onClick={() => handleDeleteRule(editingProfile.id, rule.id)} style={{ color: '#f55', background: 'transparent', border: 'none' }}>×</button>
                            </div>
                        </div>

                        {/* Condition Row */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#aaa' }}>IF</span>
                            <select
                                value={rule.condition.metric}
                                onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { metric: e.target.value as any })}
                                style={{ background: '#333', color: '#fff', border: 'none' }}
                            >
                                <option value="STRESS">STRESS</option>
                                <option value="HRV">HRV</option>
                                <option value="COHERENCE">COHERENCE</option>
                            </select>
                            <select
                                value={rule.condition.operator}
                                onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { operator: e.target.value as any })}
                                style={{ background: '#333', color: '#fff', border: 'none' }}
                            >
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                            </select>
                            <input
                                type="number"
                                value={rule.condition.threshold}
                                onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { threshold: parseFloat(e.target.value) })}
                                style={{ width: '60px', background: '#333', color: '#fff', border: 'none' }}
                            />
                            <span style={{ color: '#aaa' }}>FOR</span>
                            <input
                                type="number"
                                value={rule.condition.duration}
                                onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { duration: parseFloat(e.target.value) })}
                                style={{ width: '40px', background: '#333', color: '#fff', border: 'none' }}
                            />
                            <span style={{ color: '#aaa' }}>s</span>
                        </div>

                        {/* Action Row */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: '#aaa' }}>THEN</span>
                            <select
                                value={rule.action.type}
                                onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { type: e.target.value as any, target: '' })}
                                style={{ background: '#333', color: '#fff', border: 'none' }}
                            >
                                <option value="INTERVENTION">TRIGGER INTERVENTION</option>
                                <option value="PROTOCOL_SWITCH">SWITCH PROTOCOL</option>
                                <option value="AUDIO_PRESET">LOAD AUDIO PRESET</option>
                            </select>

                            {/* Dynamic Target Select */}
                            {rule.action.type === 'INTERVENTION' && (
                                <select
                                    value={rule.action.target}
                                    onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { target: e.target.value })}
                                    style={{ background: '#333', color: '#fff', border: 'none', flex: 1 }}
                                >
                                    <option value="">Select...</option>
                                    <option value="GROUNDING">GROUNDING</option>
                                    <option value="PATTERN_INTERRUPT">PATTERN INTERRUPT</option>
                                </select>
                            )}
                            {rule.action.type === 'PROTOCOL_SWITCH' && (
                                <select
                                    value={rule.action.target}
                                    onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { target: e.target.value })}
                                    style={{ background: '#333', color: '#fff', border: 'none', flex: 1 }}
                                >
                                    <option value="">Select...</option>
                                    {Object.keys(SENTINEL_PROTOCOLS).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            )}
                            {rule.action.type === 'AUDIO_PRESET' && (
                                <select
                                    value={rule.action.target}
                                    onChange={(e) => handleUpdateRule(editingProfile.id, rule.id, { target: e.target.value })}
                                    style={{ background: '#333', color: '#fff', border: 'none', flex: 1 }}
                                >
                                    <option value="">Select...</option>
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => handleAddRule(editingProfile.id)}
                style={{ width: '100%', padding: '0.5rem', background: '#333', border: '1px dashed #666', color: '#aaa', cursor: 'pointer' }}
            >
                + ADD RULE
            </button>
        </div>
      )}
    </div>
  );
};
