import { describe, it, expect } from 'vitest';
import { useSentinelStore } from './useSentinelStore';
import { SENTINEL_PROTOCOLS } from '../constants';

describe('useSentinelStore', () => {
  it('should initialize with OBSERVER protocol', () => {
    const { activeProtocol } = useSentinelStore.getState();
    expect(activeProtocol).toBe(SENTINEL_PROTOCOLS.OBSERVER);
  });

  it('should set active protocol', () => {
    const { setProtocol } = useSentinelStore.getState();

    setProtocol(SENTINEL_PROTOCOLS.GUIDANCE);
    expect(useSentinelStore.getState().activeProtocol).toBe(SENTINEL_PROTOCOLS.GUIDANCE);

    setProtocol(SENTINEL_PROTOCOLS.DEEP_DIVE);
    expect(useSentinelStore.getState().activeProtocol).toBe(SENTINEL_PROTOCOLS.DEEP_DIVE);
  });
});
