import posthog from 'posthog-js';

export interface AnalyticsProvider {
  init(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track(event: string, properties?: Record<string, any>): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  init() {
    console.log('[Analytics] Initialized Console Provider');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track(event: string, properties?: Record<string, any>) {
    console.log(`[Analytics] Track: ${event}`, properties);
  }
}

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  private apiKey: string;
  private host: string;

  constructor(apiKey: string, host: string) {
    this.apiKey = apiKey;
    this.host = host;
  }

  init() {
    posthog.init(this.apiKey, {
      api_host: this.host,
      autocapture: false,
      capture_pageview: false,
    });
    console.log('[Analytics] Initialized PostHog Provider');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track(event: string, properties?: Record<string, any>) {
    posthog.capture(event, properties);
  }
}

export class AnalyticsService {
  private provider: AnalyticsProvider;
  private initialized = false;

  constructor(provider: AnalyticsProvider) {
    this.provider = provider;
  }

  init() {
    if (this.initialized) return;
    this.provider.init();
    this.initialized = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('[Analytics] Tracking event before initialization:', event);
    }
    this.provider.track(event, properties);
  }
}

// Select provider based on env
const apiKey = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

const provider = apiKey
  ? new PostHogAnalyticsProvider(apiKey, host)
  : new ConsoleAnalyticsProvider();

export const analytics = new AnalyticsService(provider);
