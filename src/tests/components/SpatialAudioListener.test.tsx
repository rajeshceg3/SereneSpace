import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SpatialAudioListener } from '../../components/SpatialAudioListener';
import { audioEngine } from '../../services/AudioEngine';

// Mock AudioEngine
vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    setListenerPosition: vi.fn(),
  },
}));

describe('SpatialAudioListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates listener position on frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SpatialAudioListener />);

    // Advance frames to trigger useFrame
    await renderer.advanceFrames(2, 0.016);

    expect(audioEngine.setListenerPosition).toHaveBeenCalled();
  });
});
