import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostHogAnalyticsProvider } from '../../services/AnalyticsService';
import posthog from 'posthog-js';

// Mock posthog-js
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

describe('PostHogAnalyticsProvider', () => {
  let provider: PostHogAnalyticsProvider;
  const mockKey = 'test-key';
  const mockHost = 'https://test-host.com';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new PostHogAnalyticsProvider(mockKey, mockHost);
  });

  it('should initialize posthog with correct config', () => {
    provider.init();
    expect(posthog.init).toHaveBeenCalledWith(mockKey, {
      api_host: mockHost,
      autocapture: false,
      capture_pageview: false,
    });
  });

  it('should track events via posthog.capture', () => {
    provider.track('Test Event', { foo: 'bar' });
    expect(posthog.capture).toHaveBeenCalledWith('Test Event', { foo: 'bar' });
  });
});
