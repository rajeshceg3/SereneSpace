import React, { useEffect } from 'react';
import { useAetherStore } from '../../stores/useAetherStore';
import { TacticalDashboard } from './TacticalDashboard';
import { AudioMixer } from './AudioMixer';
import { ProtocolEditor } from './ProtocolEditor';

export const AethericCommandInterface: React.FC = () => {
  const isVisible = useAetherStore((state) => state.isVisible);
  const activeTab = useAetherStore((state) => state.activeTab);
  const toggleInterface = useAetherStore((state) => state.toggleInterface);
  const setActiveTab = useAetherStore((state) => state.setActiveTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + A to toggle
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        toggleInterface();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInterface]);

  if (!isVisible) return null;

  return (
    <div
      className="aetheric-command-interface"
      style={{
        position: 'fixed',
        top: '5%',
        left: '5%',
        width: '90%',
        height: '90%',
        backgroundColor: 'rgba(10, 10, 12, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #333',
        borderRadius: '8px',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
        zIndex: 9999, // Ensure it's on top
        display: 'flex',
        flexDirection: 'column',
        color: '#e0e0e0',
        fontFamily: 'monospace'
      }}
    >
      {/* Header */}
      <div
        className="aci-header"
        style={{
          padding: '1rem',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, #111, #000)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '12px', height: '12px', background: '#5af', borderRadius: '50%', boxShadow: '0 0 10px #5af' }}></div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px' }}>AETHERIC COMMAND // INTERFACE</h2>
        </div>

        <button
          onClick={toggleInterface}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          CLOSE [SHIFT+A]
        </button>
      </div>

      {/* Tabs */}
      <div
        className="aci-tabs"
        style={{
          display: 'flex',
          borderBottom: '1px solid #333',
          background: '#050505'
        }}
      >
        {(['DASHBOARD', 'MIXER', 'PROTOCOLS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === tab ? '#1a1a1a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #5af' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="aci-content"
        style={{
          flex: 1,
          padding: '1rem',
          overflow: 'hidden', // Individual components handle overflow
          position: 'relative'
        }}
      >
        {activeTab === 'DASHBOARD' && <TacticalDashboard />}
        {activeTab === 'MIXER' && <AudioMixer />}
        {activeTab === 'PROTOCOLS' && <ProtocolEditor />}
      </div>

      {/* Footer Status */}
      <div
        className="aci-footer"
        style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid #333',
            fontSize: '0.7rem',
            color: '#666',
            display: 'flex',
            justifyContent: 'space-between'
        }}
      >
        <span>SYSTEM: ONLINE</span>
        <span>VERSION: 2.0.0-ACI</span>
      </div>
    </div>
  );
};
