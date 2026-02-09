import { describe, it, expect } from 'vitest';
import { SynapticCartographer } from '../../services/SynapticCartographer';
import { Destination } from '../../types';

describe('SynapticCartographer', () => {
  const mockLastDest: Destination = {
    id: 'test-1',
    name: 'Origin',
    coordinates: [0, 0, 0],
    ambientColor: '#ffffff',
    description: 'Start',
    shape: 'sphere'
  };

  describe('determineBiome', () => {
    it('should return SANCTUARY for high stress', () => {
      const biome = SynapticCartographer.determineBiome('OBSERVER', 0.8, 0.5);
      expect(biome).toBe('SANCTUARY');
    });

    it('should return SANCTUARY for high prediction of stress', () => {
      const biome = SynapticCartographer.determineBiome('OBSERVER', 0.3, 0.9);
      expect(biome).toBe('SANCTUARY');
    });

    it('should return VOID for deep dive with low stress', () => {
      const biome = SynapticCartographer.determineBiome('DEEP_DIVE', 0.1, 0.2);
      expect(biome).toBe('VOID');
    });

    it('should return NEXUS for GUIDANCE with low engagement prediction', () => {
      const biome = SynapticCartographer.determineBiome('GUIDANCE', 0.3, 0.1);
      expect(biome).toBe('NEXUS');
    });

    it('should return ZENITH for GUIDANCE normal state', () => {
      const biome = SynapticCartographer.determineBiome('GUIDANCE', 0.3, 0.5);
      expect(biome).toBe('ZENITH');
    });
  });

  describe('generateNextDestination', () => {
    it('should generate a destination with correct biome properties', () => {
      const state = { protocol: 'OBSERVER', stress: 0.8, prediction: 0.5 }; // High stress -> SANCTUARY
      const dest = SynapticCartographer.generateNextDestination(mockLastDest, state);

      expect(dest.biome).toBe('SANCTUARY');
      // SANCTUARY uses sphere or icosahedron
      expect(['sphere', 'icosahedron']).toContain(dest.shape);
      expect(dest.coordinates[2]).toBeLessThan(mockLastDest.coordinates[2]); // Z should decrease (move forward)
    });

    it('should generate NEXUS destinations with higher intensity', () => {
      const state = { protocol: 'GUIDANCE', stress: 0.3, prediction: 0.1 }; // NEXUS
      const dest = SynapticCartographer.generateNextDestination(mockLastDest, state);

      expect(dest.biome).toBe('NEXUS');
      expect(dest.intensity).toBeGreaterThan(0.5);
    });
  });
});
