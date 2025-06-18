import { MediaDevice } from '../stores/recordingStore';

export class MediaDeviceService {
  private static instance: MediaDeviceService;
  private deviceChangeListeners: Set<() => void> = new Set();

  private constructor() {
    // Listen for device changes
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange.bind(this));
    }
  }

  static getInstance(): MediaDeviceService {
    if (!MediaDeviceService.instance) {
      MediaDeviceService.instance = new MediaDeviceService();
    }
    return MediaDeviceService.instance;
  }

  /**
   * Get all available media devices
   */
  async getAllDevices(): Promise<{
    cameras: MediaDevice[];
    microphones: MediaDevice[];
    speakers: MediaDevice[];
  }> {
    try {
      // Request permissions first
      await this.requestPermissions();

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cameras: MediaDevice[] = [];
      const microphones: MediaDevice[] = [];
      const speakers: MediaDevice[] = [];

      devices.forEach(device => {
        const mediaDevice: MediaDevice = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'videoinput' | 'audioinput' | 'audiooutput',
          groupId: device.groupId,
        };

        switch (device.kind) {
          case 'videoinput':
            cameras.push(mediaDevice);
            break;
          case 'audioinput':
            microphones.push(mediaDevice);
            break;
          case 'audiooutput':
            speakers.push(mediaDevice);
            break;
        }
      });

      return { cameras, microphones, speakers };
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return { cameras: [], microphones: [], speakers: [] };
    }
  }

  /**
   * Get camera stream with specified constraints
   */
  async getCameraStream(deviceId?: string, constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const defaultConstraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false, // Camera audio handled separately
    };

    const finalConstraints = constraints || defaultConstraints;
    
    try {
      return await navigator.mediaDevices.getUserMedia(finalConstraints);
    } catch (error) {
      throw new Error(`Failed to get camera stream: ${error}`);
    }
  }

  /**
   * Get microphone stream with specified constraints
   */
  async getMicrophoneStream(deviceId?: string, constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const defaultConstraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      },
      video: false,
    };

    const finalConstraints = constraints || defaultConstraints;
    
    try {
      return await navigator.mediaDevices.getUserMedia(finalConstraints);
    } catch (error) {
      throw new Error(`Failed to get microphone stream: ${error}`);
    }
  }

  /**
   * Test camera functionality
   */
  async testCamera(deviceId: string): Promise<boolean> {
    try {
      const stream = await this.getCameraStream(deviceId);
      const tracks = stream.getVideoTracks();
      
      if (tracks.length > 0) {
        // Stop the test stream
        tracks.forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Camera test failed:', error);
      return false;
    }
  }

  /**
   * Test microphone functionality
   */
  async testMicrophone(deviceId: string): Promise<boolean> {
    try {
      const stream = await this.getMicrophoneStream(deviceId);
      const tracks = stream.getAudioTracks();
      
      if (tracks.length > 0) {
        // Stop the test stream
        tracks.forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  /**
   * Get device capabilities
   */
  async getDeviceCapabilities(deviceId: string, kind: 'videoinput' | 'audioinput'): Promise<MediaTrackCapabilities | null> {
    try {
      const constraints = kind === 'videoinput' 
        ? { video: { deviceId: { exact: deviceId } } }
        : { audio: { deviceId: { exact: deviceId } } };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = kind === 'videoinput' 
        ? stream.getVideoTracks()[0] 
        : stream.getAudioTracks()[0];
      
      const capabilities = track.getCapabilities();
      
      // Clean up
      track.stop();
      
      return capabilities;
    } catch (error) {
      console.error('Failed to get device capabilities:', error);
      return null;
    }
  }

  /**
   * Request media permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      // Stop the permission request stream immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Media permissions not granted:', error);
      // Continue without permissions - some devices may still be available
    }
  }

  /**
   * Handle device change events
   */
  private handleDeviceChange(): void {
    this.deviceChangeListeners.forEach(listener => listener());
  }

  /**
   * Add device change listener
   */
  addDeviceChangeListener(listener: () => void): void {
    this.deviceChangeListeners.add(listener);
  }

  /**
   * Remove device change listener
   */
  removeDeviceChangeListener(listener: () => void): void {
    this.deviceChangeListeners.delete(listener);
  }

  /**
   * Check if media devices API is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
  }

  /**
   * Get supported constraints for the browser
   */
  static getSupportedConstraints(): MediaTrackSupportedConstraints {
    return navigator.mediaDevices?.getSupportedConstraints() || {};
  }
}
