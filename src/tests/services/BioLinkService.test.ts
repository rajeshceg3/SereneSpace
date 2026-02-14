import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bioLinkService } from '../../services/BioLinkService';
import { useBioLinkStore } from '../../stores/useBioLinkStore';

describe('BioLinkService', () => {
  const mockCharacteristic = {
    startNotifications: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as BluetoothRemoteGATTCharacteristic;

  const mockService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCharacteristic: vi.fn().mockResolvedValue(mockCharacteristic as any),
  } as unknown as BluetoothRemoteGATTService;

  const mockServer = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connect: vi.fn().mockImplementation(function(this: any) {
        this.connected = true;
        return Promise.resolve(this);
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPrimaryService: vi.fn().mockResolvedValue(mockService as any),
    connected: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    disconnect: vi.fn().mockImplementation(function(this: any) {
        this.connected = false;
    }),
  } as unknown as BluetoothRemoteGATTServer;

  const mockDevice = {
    gatt: mockServer,
    name: 'Test Sensor',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as BluetoothDevice;

  beforeEach(() => {
    useBioLinkStore.getState().reset();

    // Mock navigator.bluetooth
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        bluetooth: {
          requestDevice: vi.fn().mockResolvedValue(mockDevice),
        },
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to bluetooth device and update store', async () => {
    await bioLinkService.connect();

    expect(navigator.bluetooth.requestDevice).toHaveBeenCalledWith({
      filters: [{ services: [0x180D] }]
    });
    expect(mockServer.connect).toHaveBeenCalled();
    expect(mockServer.getPrimaryService).toHaveBeenCalledWith(0x180D);
    expect(mockService.getCharacteristic).toHaveBeenCalledWith(0x2A37);
    expect(mockCharacteristic.startNotifications).toHaveBeenCalled();

    const store = useBioLinkStore.getState();
    expect(store.isConnected).toBe(true);
    expect(store.deviceName).toBe('Test Sensor');
  });

  it('should handle heart rate data parsing (8-bit)', async () => {
    await bioLinkService.connect();

    // Simulate notification
    // Need to trigger the event listener passed to addEventListener
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = (mockCharacteristic.addEventListener as any).mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = calls.find((call: any) => call[0] === 'characteristicvaluechanged')?.[1];

    expect(callback).toBeDefined();

    // Create DataView for 8-bit HR: Flags=0 (8-bit, no RR), HR=75
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, 0x00); // Flags
    view.setUint8(1, 75);   // BPM

    const event = { target: { value: view } };
    callback(event);

    expect(useBioLinkStore.getState().heartRate).toBe(75);
  });

  it('should handle disconnection', async () => {
    await bioLinkService.connect();

    bioLinkService.disconnect();

    expect(mockServer.disconnect).toHaveBeenCalled();
    // In real life, 'gattserverdisconnected' event triggers the reset,
    // but here we might need to simulate it or check if disconnect calls it?
    // BioLinkService adds event listener for 'gattserverdisconnected'.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disconnectHandler = (mockDevice.addEventListener as any).mock.calls.find((call: any) => call[0] === 'gattserverdisconnected')?.[1];
    disconnectHandler(); // Simulate event

    expect(useBioLinkStore.getState().isConnected).toBe(false);
  });
});
