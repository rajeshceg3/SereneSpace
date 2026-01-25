import { describe, it, expect, beforeEach } from 'vitest';
import { useBloomStore } from '../../stores/useBloomStore';

describe('useBloomStore', () => {
  beforeEach(() => {
    useBloomStore.getState().resetBloom();
  });

  it('should initialize with empty bloomedDestinations', () => {
    const { bloomedDestinations } = useBloomStore.getState();
    expect(bloomedDestinations).toEqual({});
  });

  it('should mark a destination as bloomed', () => {
    useBloomStore.getState().setBloomed('dest-1');
    const { bloomedDestinations } = useBloomStore.getState();
    expect(bloomedDestinations['dest-1']).toBe(true);
  });

  it('should preserve other bloomed destinations', () => {
    useBloomStore.getState().setBloomed('dest-1');
    useBloomStore.getState().setBloomed('dest-2');
    const { bloomedDestinations } = useBloomStore.getState();
    expect(bloomedDestinations['dest-1']).toBe(true);
    expect(bloomedDestinations['dest-2']).toBe(true);
  });

  it('should reset bloomed destinations', () => {
    useBloomStore.getState().setBloomed('dest-1');
    useBloomStore.getState().resetBloom();
    const { bloomedDestinations } = useBloomStore.getState();
    expect(bloomedDestinations).toEqual({});
  });
});
