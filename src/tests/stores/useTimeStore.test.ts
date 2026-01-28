import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimeStore, getCurrentPhase } from '../../stores/useTimeStore';

describe('useTimeStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Reset store state logic is implicitly handled by re-evaluating in tests,
    // but in a real app the store is a singleton.
    // For unit testing the logic function `getCurrentPhase`, we are safe.
  });

  it('correctly identifies DAWN phase', () => {
    // 6 AM
    const date = new Date(2024, 1, 1, 6, 0, 0);
    expect(getCurrentPhase(date)).toBe('DAWN');
  });

  it('correctly identifies DAY phase', () => {
    // 12 PM
    const date = new Date(2024, 1, 1, 12, 0, 0);
    expect(getCurrentPhase(date)).toBe('DAY');
  });

  it('correctly identifies DUSK phase', () => {
    // 6 PM (18:00)
    const date = new Date(2024, 1, 1, 18, 0, 0);
    expect(getCurrentPhase(date)).toBe('DUSK');
  });

  it('correctly identifies NIGHT phase', () => {
    // 10 PM (22:00)
    const date1 = new Date(2024, 1, 1, 22, 0, 0);
    expect(getCurrentPhase(date1)).toBe('NIGHT');

    // 2 AM
    const date2 = new Date(2024, 1, 1, 2, 0, 0);
    expect(getCurrentPhase(date2)).toBe('NIGHT');
  });

  it('updates phase in store', () => {
     // Start at Day
     vi.setSystemTime(new Date(2024, 1, 1, 12, 0, 0));

     const { updatePhase } = useTimeStore.getState();
     updatePhase();
     expect(useTimeStore.getState().phase).toBe('DAY');

     // Move to Night
     vi.setSystemTime(new Date(2024, 1, 1, 23, 0, 0));
     updatePhase();
     expect(useTimeStore.getState().phase).toBe('NIGHT');
  });
});
