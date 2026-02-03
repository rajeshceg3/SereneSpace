import { describe, it, expect, beforeEach } from 'vitest';
import { useEchoStore } from '../../stores/useEchoStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('useEchoStore', () => {
  beforeEach(() => {
    useEchoStore.getState().clearEchoes();
    localStorage.clear();
  });

  it('should initialize with empty echoes', () => {
    expect(useEchoStore.getState().echoes).toEqual([]);
  });

  it('should add an echo', () => {
    useEchoStore.getState().addEcho([1, 2, 3]);
    const echoes = useEchoStore.getState().echoes;
    expect(echoes).toHaveLength(1);
    expect(echoes[0].position).toEqual([1, 2, 3]);
    expect(echoes[0].type).toBe('calm');
  });

  it('should persist echoes to localStorage', () => {
    useEchoStore.getState().addEcho([10, 0, 10]);
    const stored = localStorage.getItem('echo_history');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].position).toEqual([10, 0, 10]);
  });

  it('should limit echoes to 100', () => {
    // Fill with 105 echoes
    for (let i = 0; i < 105; i++) {
      useEchoStore.getState().addEcho([i, 0, 0]);
    }
    const echoes = useEchoStore.getState().echoes;
    expect(echoes).toHaveLength(100);
    // Should have dropped the first 5 (0-4), so first one is index 5
    expect(echoes[0].position).toEqual([5, 0, 0]);
  });

  it('should load echoes from localStorage', () => {
      const mockData = [{ id: 'test', position: [9,9,9], timestamp: 123, type: 'calm' }];
      localStorage.setItem('echo_history', JSON.stringify(mockData));

      useEchoStore.getState().loadEchoes();
      const echoes = useEchoStore.getState().echoes;
      expect(echoes).toHaveLength(1);
      expect(echoes[0].position).toEqual([9, 9, 9]);
  });
});
