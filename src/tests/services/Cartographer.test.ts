import { describe, it, expect } from 'vitest';
import { Cartographer } from '../../services/Cartographer';
import type { Destination } from '../../types';
import { INFINITE_HORIZON_CONFIG } from '../../constants';

// Mock crypto.randomUUID if not available
if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
        value: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            randomUUID: () => '00000000-0000-0000-0000-000000000000' as any
        }
    });
} else if (!globalThis.crypto.randomUUID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.crypto.randomUUID = () => '00000000-0000-0000-0000-000000000000' as any;
}

describe('Cartographer', () => {
  const mockDestination = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Initial Point',
    coordinates: [0, 0, 0],
    ambientColor: '#ffffff',
    description: 'Start',
    shape: 'icosahedron'
  } as unknown as Destination;

  it('generates a valid next destination', () => {
    const next = Cartographer.generateNextDestination(mockDestination);

    expect(next).toBeDefined();
    expect(next.id).toBeDefined();
    expect(next.id).not.toBe(mockDestination.id);
    expect(next.name).toBeDefined();
    expect(next.description).toContain(next.name.toLowerCase());
  });

  it('moves forward in Z space (negative direction)', () => {
    const next = Cartographer.generateNextDestination(mockDestination);
    const zDiff = next.coordinates[2] - mockDestination.coordinates[2];

    // Should be around -DESTINATION_GAP (+/- jitter)
    const expectedGap = -INFINITE_HORIZON_CONFIG.DESTINATION_GAP;

    // Allow for jitter (e.g., +/- 10)
    expect(zDiff).toBeLessThan(0);
    expect(zDiff).toBeLessThan(expectedGap + 10);
    expect(zDiff).toBeGreaterThan(expectedGap - 10);
  });

  it('assigns a shape', () => {
    const next = Cartographer.generateNextDestination(mockDestination);
    const validShapes = ['icosahedron', 'octahedron', 'sphere', 'torus'];
    expect(validShapes).toContain(next.shape);
  });

  it('generates a color string', () => {
    const next = Cartographer.generateNextDestination(mockDestination);
    expect(next.ambientColor).toMatch(/^hsl\(\d+, \d+%?, \d+%?\)$/);
  });
});
