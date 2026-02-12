export type BiomeType = 'SANCTUARY' | 'NEXUS' | 'VOID' | 'ZENITH';

export interface Destination {
  id: string;
  name: string;
  coordinates: [number, number, number];
  ambientColor: string;
  description: string;
  shape?: 'icosahedron' | 'octahedron' | 'sphere' | 'torus';
  biome?: BiomeType;
  intensity?: number; // 0-1
}

export interface TelemetryPoint {
  timestamp: number;
  value: number; // 0 to 1 (stress level)
  event?: string; // Optional label for specific events (e.g., "Destination Arrived")
}

export interface AtlasNode extends Destination {
  visitedAt: number;
  stressLevel: number;
  coherenceScore: number;
  notes?: string;
}

export interface AtlasState {
  nodes: AtlasNode[];
  isOpen: boolean;
  addNode: (node: AtlasNode) => void;
  toggleAtlas: () => void;
  setOpen: (isOpen: boolean) => void;
  jumpToNode: (nodeId: string) => void;
}
