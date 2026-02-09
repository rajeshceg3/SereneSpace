import { Destination, BiomeType } from '../types';
import { INFINITE_HORIZON_CONFIG } from '../constants';

// Biome Configuration
const BIOME_CONFIG: Record<BiomeType, {
  adjectives: string[];
  nouns: string[];
  colors: string[];
  shapes: NonNullable<Destination['shape']>[];
  gapModifier: number;
}> = {
  SANCTUARY: {
    adjectives: ['Silent', 'Still', 'Crystal', 'Hollow', 'Velvet', 'Lunar', 'Sacred'],
    nouns: ['Grove', 'Oasis', 'Sphere', 'Mirror', 'Veil', 'Sanctuary', 'Echo'],
    colors: ['#e0f7fa', '#e1f5fe', '#f3e5f5', '#e8f5e9'], // Cool, light pastels
    shapes: ['sphere', 'icosahedron'],
    gapModifier: 1.5,
  },
  NEXUS: {
    adjectives: ['Radiant', 'Golden', 'Pulse', 'Prism', 'Solar', 'Vibrant', 'Lucid'],
    nouns: ['Nexus', 'Beacon', 'Gateway', 'Peak', 'Orbit', 'Core', 'Tide'],
    colors: ['#fff3e0', '#ffebee', '#fce4ec', '#fff8e1'], // Warm, energetic
    shapes: ['octahedron', 'torus'],
    gapModifier: 0.8,
  },
  VOID: {
    adjectives: ['Deep', 'Obsidian', 'Ancient', 'Shadow', 'Midnight', 'Ethereal', 'Timeless'],
    nouns: ['Void', 'Abyss', 'Drift', 'Cloud', 'Horizon', 'Shard', 'Depth'],
    colors: ['#263238', '#37474f', '#455a64', '#546e7a'], // Dark, monochrome
    shapes: ['icosahedron', 'sphere'],
    gapModifier: 2.0,
  },
  ZENITH: {
    adjectives: ['Ascendant', 'Azure', 'Celestial', 'Floating', 'Verdant', 'Majestic', 'Infinite'],
    nouns: ['Zenith', 'Summit', 'Spire', 'Arch', 'Realm', 'Crown', 'Vista'],
    colors: ['#e0f2f1', '#e8eaf6', '#f0f4c3', '#b2dfdb'], // Fresh, high-altitude
    shapes: ['octahedron', 'torus'],
    gapModifier: 1.0,
  }
};

export class SynapticCartographer {
  /**
   * Determines the appropriate Biome based on user state.
   */
  public static determineBiome(
    protocol: string,
    stress: number,
    prediction: number
  ): BiomeType {
    // 1. High Stress Intervention (Immediate Sanctuary)
    if (stress > 0.6 || prediction > 0.7) {
      return 'SANCTUARY';
    }

    // 2. Deep Relaxation State
    if (protocol === 'DEEP_DIVE') {
      // If very calm, go to Void; otherwise keep it gentle in Sanctuary
      return stress < 0.2 ? 'VOID' : 'SANCTUARY';
    }

    // 3. Active Engagement / Flow (Guidance)
    if (protocol === 'GUIDANCE') {
      // If predicting a drop in stress/engagement, add complexity (Nexus)
      if (prediction < 0.3) return 'NEXUS';
      return 'ZENITH';
    }

    // 4. Observer / Default
    // If very low stress in Observer mode, provide stimulation
    if (stress < 0.15) return 'NEXUS';

    return 'ZENITH';
  }

  /**
   * Generates the next destination using biome-specific parameters.
   */
  public static generateNextDestination(
    lastDestination: Destination,
    state: { protocol: string; stress: number; prediction: number }
  ): Destination {
    const biomeType = this.determineBiome(state.protocol, state.stress, state.prediction);
    const biome = BIOME_CONFIG[biomeType];

    const id = crypto.randomUUID();

    // Name Generation
    const adj = biome.adjectives[Math.floor(Math.random() * biome.adjectives.length)];
    const noun = biome.nouns[Math.floor(Math.random() * biome.nouns.length)];
    const name = `${adj} ${noun}`;

    // Shape Selection
    const shape = biome.shapes[Math.floor(Math.random() * biome.shapes.length)];

    // Color Selection
    const color = biome.colors[Math.floor(Math.random() * biome.colors.length)];

    // Position Calculation
    // Z: Apply biome-specific gap modifier
    // Add randomness to gap: +/- 20%
    const baseGap = INFINITE_HORIZON_CONFIG.DESTINATION_GAP * biome.gapModifier;
    const jitter = baseGap * 0.2 * (Math.random() * 2 - 1);
    const zStep = -(baseGap + jitter);
    const nextZ = lastDestination.coordinates[2] + zStep;

    // X/Y: Biome influence
    // Void/Sanctuary might be more centered (calm)
    // Nexus/Zenith might be wider (exploration)
    const spread = (biomeType === 'SANCTUARY' || biomeType === 'VOID') ? 4 : 8;
    const x = (Math.random() * spread * 2) - spread; // e.g. -4 to 4 or -8 to 8
    const y = (Math.random() * (spread * 0.6) * 2) - (spread * 0.6); // Slightly less vertical spread

    // Intensity Calculation (0-1)
    // Used for visual pulsing/effects
    // Sanctuary/Void = Low intensity (calm)
    // Nexus/Zenith = Higher intensity
    let intensity = 0.5;
    if (biomeType === 'SANCTUARY') intensity = 0.2;
    if (biomeType === 'VOID') intensity = 0.1;
    if (biomeType === 'NEXUS') intensity = 0.9;
    if (biomeType === 'ZENITH') intensity = 0.6;

    // Modulate intensity by current stress slightly
    intensity = Math.max(0, Math.min(1, intensity + (state.stress * 0.2)));

    return {
      id,
      name,
      coordinates: [x, y, nextZ],
      ambientColor: color,
      description: `A ${biomeType.toLowerCase()} realm: ${name.toLowerCase()}.`,
      shape,
      biome: biomeType,
      intensity
    };
  }
}
