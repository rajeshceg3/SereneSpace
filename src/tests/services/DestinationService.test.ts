import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DestinationService } from '../../services/DestinationService';
import { Destination } from '../../types';

describe('DestinationService', () => {
  const mockDestinations: Destination[] = [
    {
      id: 'test',
      name: 'Test',
      coordinates: [0, 0, 0],
      ambientColor: '#000',
      description: 'Test Description',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch destinations successfully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockDestinations,
    });

    const result = await DestinationService.fetchDestinations();
    expect(result).toEqual(mockDestinations);
    expect(global.fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}destinations.json`);
  });

  it('should throw an error if response is not ok', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
    });

    await expect(DestinationService.fetchDestinations()).rejects.toThrow('Network response was not ok');
  });

  it('should throw an error if fetch fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Fetch failed'));

    await expect(DestinationService.fetchDestinations()).rejects.toThrow('Fetch failed');
  });
});
