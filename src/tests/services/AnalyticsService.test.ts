import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService, AnalyticsProvider } from '../../services/AnalyticsService';

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  let mockProvider: AnalyticsProvider;

  beforeEach(() => {
    mockProvider = {
      init: vi.fn(),
      track: vi.fn(),
    };
    analytics = new AnalyticsService(mockProvider);
  });

  it('should call provider init on initialization', () => {
    analytics.init();
    expect(mockProvider.init).toHaveBeenCalled();
  });

  it('should call provider track on track', () => {
    analytics.init();
    analytics.track('Test Event', { foo: 'bar' });
    expect(mockProvider.track).toHaveBeenCalledWith('Test Event', { foo: 'bar' });
  });

  it('should warn if tracking before initialization', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    analytics.track('Test Event');
    expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Tracking event before initialization:', 'Test Event');
    expect(mockProvider.track).toHaveBeenCalled(); // It still calls track, just warns
  });

  it('should not init twice', () => {
    analytics.init();
    analytics.init();
    expect(mockProvider.init).toHaveBeenCalledTimes(1);
  });
});
