import { useMemo } from 'react';
import { Hud, PerspectiveCamera, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAtlasStore } from '../stores/useAtlasStore';
import { atlasService } from '../services/AtlasService';
import type { AtlasNode } from '../types';

export const NeuralAtlas = () => {
  const isOpen = useAtlasStore((state) => state.isOpen);
  const nodes = useAtlasStore((state) => state.nodes);
  const toggleAtlas = useAtlasStore((state) => state.toggleAtlas);

  if (!isOpen) return null;

  return (
    <Hud renderPriority={2}>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <group>
        <MapVisualization nodes={nodes} onTeleport={(node) => {
            atlasService.teleport(node);
            toggleAtlas();
        }} />
      </group>

      <Html fullscreen style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '50px' }}>
          <div style={{ pointerEvents: 'auto', background: 'rgba(0, 0, 0, 0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.5rem', letterSpacing: '2px' }}>NEURAL ATLAS</h2>
              <div style={{ color: '#aaa', marginBottom: '15px' }}>
                  {nodes.length} Synaptic Nodes Discovered
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                  Click a node to travel | Blue = High Coherence | Red = High Stress
              </div>
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
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                  CLOSE ATLAS
              </button>
          </div>
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
