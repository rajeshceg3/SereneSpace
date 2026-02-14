import { useBioLinkStore } from '../stores/useBioLinkStore';

const HR_SERVICE_UUID = 0x180D;
const HR_CHARACTERISTIC_UUID = 0x2A37;

class BioLinkService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // HRV Calculation State
  private rrIntervals: number[] = [];
  private maxRRHistory = 20; // Keep last 20 intervals for rolling RMSSD

  public async connect(): Promise<void> {
    const store = useBioLinkStore.getState();

    if (store.isConnected) {
      console.warn('[BIOLINK] Already connected');
      return;
    }

    store.setConnectionStatus(false, true); // isConnecting = true

    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not available');
      }

      console.log('[BIOLINK] Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE_UUID] }]
      });

      if (!this.device) throw new Error('No device selected');

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
      store.setDeviceName(this.device.name || 'Unknown Sensor');

      console.log('[BIOLINK] Connecting to GATT Server...');
      this.server = await this.device.gatt!.connect();

      console.log('[BIOLINK] Getting Service...');
      const service = await this.server.getPrimaryService(HR_SERVICE_UUID);

      console.log('[BIOLINK] Getting Characteristic...');
      this.characteristic = await service.getCharacteristic(HR_CHARACTERISTIC_UUID);

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleNotifications.bind(this));

      store.setConnectionStatus(true, false);
      console.log('[BIOLINK] Connected & Streaming');

    } catch (error) {
      console.error('[BIOLINK] Connection failed:', error);
      store.setConnectionStatus(false, false);
      store.reset();
    }
  }

  public disconnect(): void {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    } else {
      // Force cleanup if already disconnected physically but not logically
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    console.log('[BIOLINK] Disconnected');
    const store = useBioLinkStore.getState();
    store.reset();

    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.rrIntervals = [];
  }

  private handleNotifications(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    this.parseHeartRate(value);
  }

  private parseHeartRate(data: DataView) {
    const store = useBioLinkStore.getState();
    const flags = data.getUint8(0);

    // Flag parsing
    const is16BitHR = (flags & 1) !== 0;
    const rrIntervalsPresent = (flags & 0x10) !== 0;
    const contactDetected = (flags & 0x06) === 0x06; // Bits 1 & 2 set means contact supported & detected

    let offset = 1;
    let bpm = 0;

    if (is16BitHR) {
      bpm = data.getUint16(offset, true); // Little Endian
      offset += 2;
    } else {
      bpm = data.getUint8(offset);
      offset += 1;
    }

    // Skip Energy Expended if present (Bit 3)
    if (flags & 0x08) {
      offset += 2;
    }

    // Process RR Intervals
    if (rrIntervalsPresent) {
      // There can be multiple RR values in one packet
      while (offset + 1 < data.byteLength) {
        const rr = data.getUint16(offset, true);
        offset += 2;
        this.addRRInterval(rr); // RR in 1/1024 seconds
      }
    }

    // Update Store
    store.setHeartRate(bpm);
    store.setSignalQuality(contactDetected ? 100 : 50); // Simple fallback
  }

  private addRRInterval(rrRaw: number) {
    // Convert 1/1024s to milliseconds
    const rrMs = (rrRaw / 1024) * 1000;

    this.rrIntervals.push(rrMs);
    if (this.rrIntervals.length > this.maxRRHistory) {
      this.rrIntervals.shift();
    }

    this.calculateHRV();
  }

  private calculateHRV() {
    if (this.rrIntervals.length < 2) return;

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSquaredDiff = 0;
    for (let i = 1; i < this.rrIntervals.length; i++) {
      const diff = this.rrIntervals[i] - this.rrIntervals[i - 1];
      sumSquaredDiff += diff * diff;
    }

    const meanSquaredDiff = sumSquaredDiff / (this.rrIntervals.length - 1);
    const rmssd = Math.sqrt(meanSquaredDiff);

    useBioLinkStore.getState().setHrv(Math.round(rmssd));
  }
}

export const bioLinkService = new BioLinkService();
