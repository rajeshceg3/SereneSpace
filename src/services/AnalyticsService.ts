export interface AnalyticsProvider {
  init(): void;
  track(event: string, properties?: Record<string, any>): void;
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  init() {
    console.log('[Analytics] Initialized Console Provider');
  }

  track(event: string, properties?: Record<string, any>) {
    console.log(`[Analytics] Track: ${event}`, properties);
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

  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('[Analytics] Tracking event before initialization:', event);
    }
    this.provider.track(event, properties);
  }
}

// Default instance using Console Provider (can be swapped based on env)
export const analytics = new AnalyticsService(new ConsoleAnalyticsProvider());
