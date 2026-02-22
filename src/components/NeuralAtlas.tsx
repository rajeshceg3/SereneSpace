import { useMemo, useState } from 'react';
import { Hud, PerspectiveCamera, Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAtlasStore } from '../stores/useAtlasStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { atlasService } from '../services/AtlasService';
import type { AtlasNode } from '../types';
import { LoomVisualization } from './LoomVisualization';
import { LoomControls } from './LoomControls';

// Main Component: Handles mounting/unmounting based on store state
export const NeuralAtlas = () => {
  const isOpen = useAtlasStore((state) => state.isOpen);

  if (!isOpen) return null;

  return <NeuralAtlasContent />;
};

// Content Component: Holds local state, reset when unmounted
const NeuralAtlasContent = () => {
  const nodes = useAtlasStore((state) => state.nodes);
  const toggleAtlas = useAtlasStore((state) => state.toggleAtlas);
  const sessionPath = useTelemetryStore((state) => state.sessionPath);

  // Local State for Loom Mode
  const [viewMode, setViewMode] = useState<'MAP' | 'LOOM'>('MAP');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback Loop
  useFrame((_state, delta) => {
    if (isPlaying && viewMode === 'LOOM') {
      // Advance progress. Let's say full path takes 30 seconds by default
      const duration = 30;
      const step = delta / duration;
      setPlaybackProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
    }
  });

  // Normalize Session Path for Loom
  const normalizedPath = useMemo(() => {
      if (sessionPath.length === 0) return [];

      const points = sessionPath.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const min = new THREE.Vector3(Infinity, Infinity, Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      points.forEach(p => {
          min.min(p);
          max.max(p);
      });

      const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
      const size = new THREE.Vector3().subVectors(max, min);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 12 / maxDim : 1; // Fit to 12 unit box

      return sessionPath.map(p => {
          const vec = new THREE.Vector3(p.x, p.y, p.z).sub(center).multiplyScalar(scale);
          return {
              ...p,
              x: vec.x,
              y: vec.y,
              z: vec.z
          };
      });
  }, [sessionPath]);

  return (
    <Hud renderPriority={2}>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <group>
        {viewMode === 'MAP' && (
            <MapVisualization nodes={nodes} onTeleport={(node) => {
                atlasService.teleport(node);
                toggleAtlas();
            }} />
        )}

        {viewMode === 'LOOM' && (
            <LoomVisualization
                pathData={normalizedPath}
                progress={playbackProgress}
            />
        )}
      </group>

      <Html fullscreen style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '30px' }}>

          {/* Main Overlay Container */}
          {viewMode === 'MAP' ? (
              <div style={{ pointerEvents: 'auto', background: 'rgba(0, 0, 0, 0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'center', backdropFilter: 'blur(10px)', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.5rem', letterSpacing: '2px' }}>NEURAL ATLAS</h2>
                  <div style={{ color: '#aaa', marginBottom: '15px' }}>
                      {nodes.length} Synaptic Nodes Discovered
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                      Click a node to travel | Blue = High Coherence | Red = High Stress
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                          onClick={() => setViewMode('LOOM')}
                          style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              color: '#fff',
                              padding: '8px 24px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s ease'
                          }}
                      >
                          OPEN LOOM
                      </button>
                      <button
                          onClick={toggleAtlas}
                          style={{
                              background: 'transparent',
                              border: '1px solid #fff',
                              color: '#fff',
                              padding: '8px 24px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s ease'
                          }}
                      >
                          CLOSE
                      </button>
                  </div>
              </div>
          ) : (
              /* Loom Controls Container */
              <LoomControls
                  progress={playbackProgress}
                  isPlaying={isPlaying}
                  onProgressChange={setPlaybackProgress}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onClose={() => setViewMode('MAP')}
              />
          )}
      </Html>
    </Hud>
  );
};

const MapVisualization = ({ nodes, onTeleport }: { nodes: AtlasNode[], onTeleport: (node: AtlasNode) => void }) => {
    // Calculate bounds and normalization
    const { normalizedNodes, linePoints } = useMemo(() => {
        if (nodes.length === 0) return { normalizedNodes: [], linePoints: [] };

        const min = new THREE.Vector3(Infinity, Infinity, Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        nodes.forEach(n => {
            min.min(new THREE.Vector3(...n.coordinates));
            max.max(new THREE.Vector3(...n.coordinates));
        });

        const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
        const size = new THREE.Vector3().subVectors(max, min);
        // Normalize to fit in a 10-unit box
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 12 / maxDim : 1;

        const normalized = nodes.map(n => {
            const vec = new THREE.Vector3(...n.coordinates);
            vec.sub(center).multiplyScalar(scale);

            // Color based on coherence (0-100) -> Hue 0 (Red) to 0.6 (Blue)
            const color = new THREE.Color().setHSL(0.6 * (n.coherenceScore / 100), 1, 0.5);

            return {
                ...n,
                pos: [vec.x, vec.y, vec.z] as [number, number, number],
                color
            };
        });

        const points = normalized.map(n => new THREE.Vector3(...n.pos));

        return { normalizedNodes: normalized, linePoints: points };
    }, [nodes]);

    return (
        <group>
            {linePoints.length > 1 && (
                <Line
                    points={linePoints}
                    color="white"
                    opacity={0.3}
                    transparent
                    lineWidth={1}
                />
            )}

            {normalizedNodes.map((node) => (
                <mesh
                    key={node.id}
                    position={node.pos}
                    onClick={(e) => {
                        e.stopPropagation();
                        onTeleport(node);
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = 'auto';
                    }}
                >
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.5} />
                </mesh>
            ))}
        </group>
    );
};
