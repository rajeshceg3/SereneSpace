import type { Destination } from '../types';
import { INFINITE_HORIZON_CONFIG } from '../constants';

const ADJECTIVES = [
  'Silent', 'Ethereal', 'Whispering', 'Lucid', 'Velvet', 'Golden', 'Azure',
  'Timeless', 'Hollow', 'Radiant', 'Still', 'Deep', 'Ancient', 'Floating',
  'Crystal', 'Obsidian', 'Verdant', 'Lunar', 'Solar', 'Sacred'
];

const NOUNS = [
  'Void', 'Peak', 'Nexus', 'Grove', 'Prism', 'Horizon', 'Sanctuary',
  'Echo', 'Drift', 'Tide', 'Orbit', 'Sphere', 'Shard', 'Gateway',
  'Beacon', 'Oasis', 'Cloud', 'Mirror', 'Pulse', 'Veil'
];

const SHAPES: NonNullable<Destination['shape']>[] = ['icosahedron', 'octahedron', 'sphere', 'torus'];

export class Cartographer {
  private static generateName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj} ${noun}`;
  }

  private static generateColor(prevColor: string): string {
    // Convert hex to HSL, shift hue, convert back.
    // For simplicity, we'll pick a new random pastel color to ensure variety but calmness.
    // H: 0-360, S: 40-70%, L: 60-80%
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 30) + 40;
    const l = Math.floor(Math.random() * 20) + 60;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  private static generateShape(): NonNullable<Destination['shape']> {
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
  }

  public static generateNextDestination(lastDestination: Destination): Destination {
    const id = crypto.randomUUID();
    const name = this.generateName();

    // Z position: Move forward (negative Z is forward in Three.js usually, but let's check existing data)
    // Wait, the constants say CAMERA_INITIAL_Z = 5.
    // Let's assume negative Z is "forward" or "deeper".
    // In `Destination.tsx`: setCameraTargetZ(destination.coordinates[2] + OFFSET)
    // User guide: Scroll = forward.
    // Typically scroll moves camera -Z.
    // So new destinations should be at lastDestination.z - GAP.

    const zStep = -(INFINITE_HORIZON_CONFIG.DESTINATION_GAP + (Math.random() * 10 - 5)); // Add jitter
    const nextZ = lastDestination.coordinates[2] + zStep;

    // X/Y Jitter for organic placement
    // Stay within reasonable bounds so it doesn't fly off screen
    const x = (Math.random() * 10) - 5;
    const y = (Math.random() * 6) - 3;

    return {
      id,
      name,
      coordinates: [x, y, nextZ],
      ambientColor: this.generateColor(lastDestination.ambientColor),
      description: `A ${name.toLowerCase()} awaiting your arrival.`,
      shape: this.generateShape()
    };
  }
}
