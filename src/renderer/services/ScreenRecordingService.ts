import { RecordingSettings, RecordingQualitySettings } from '../stores/recordingStore';
import { MediaDeviceService } from './MediaDeviceService';

export interface RecordingCapabilities {
  supportsDisplayMedia: boolean;
  supportsMediaRecorder: boolean;
  supportedMimeTypes: string[];
}

export interface MultiSourceStreams {
  displayStream: MediaStream;
  cameraStream?: MediaStream;
  microphoneStream?: MediaStream;
  combinedStream: MediaStream;
}

export class ScreenRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private microphoneStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private onDataAvailable?: (blob: Blob) => void;
  private onStop?: (blob: Blob) => void;
  private onError?: (error: Error) => void;
  private mediaDeviceService: MediaDeviceService;

  constructor() {
    this.mediaDeviceService = MediaDeviceService.getInstance();
  }

  /**
   * Get the preferred MIME type for recording (prioritizes MP4)
   */
  static getPreferredMimeType(): string | null {
    const capabilities = ScreenRecordingService.getCapabilities();

    // Prioritize MP4 formats
    const mp4Types = capabilities.supportedMimeTypes.filter(type => type.includes('mp4'));
    if (mp4Types.length > 0) {
      return mp4Types[0];
    }

    // Fallback to any supported format
    return capabilities.supportedMimeTypes[0] || null;
  }

  /**
   * Check if screen recording is supported in the current environment
   */
  static getCapabilities(): RecordingCapabilities {
    const supportsDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    const supportsMediaRecorder = !!(window.MediaRecorder);
    
    const supportedMimeTypes: string[] = [];
    if (supportsMediaRecorder) {
      const mimeTypes = [
        'video/mp4;codecs=h264',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      
      mimeTypes.forEach(mimeType => {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedMimeTypes.push(mimeType);
        }
      });
    }

    return {
      supportsDisplayMedia,
      supportsMediaRecorder,
      supportedMimeTypes,
    };
  }

  /**
   * Get multi-source media streams (display + camera + microphone)
   */
  async getMultiSourceStreams(settings: RecordingSettings): Promise<MultiSourceStreams> {
    const displayStream = await this.getDisplayMedia(settings);
    let cameraStream: MediaStream | undefined;
    let microphoneStream: MediaStream | undefined;

    // Get camera stream if enabled
    if (settings.cameraEnabled && settings.selectedCamera) {
      try {
        cameraStream = await this.mediaDeviceService.getCameraStream(
          settings.selectedCamera.deviceId,
          {
            video: {
              deviceId: { exact: settings.selectedCamera.deviceId },
              width: this.getCameraConstraints(settings.cameraSize).width,
              height: this.getCameraConstraints(settings.cameraSize).height,
              frameRate: { ideal: settings.quality.frameRate },
            }
          }
        );
      } catch (error) {
        console.warn('Failed to get camera stream:', error);
      }
    }

    // Get microphone stream if enabled
    if (settings.includeMicrophone && settings.selectedMicrophone) {
      try {
        microphoneStream = await this.mediaDeviceService.getMicrophoneStream(
          settings.selectedMicrophone.deviceId,
          {
            audio: {
              deviceId: { exact: settings.selectedMicrophone.deviceId },
              sampleRate: settings.quality.audioSampleRate,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          }
        );
      } catch (error) {
        console.warn('Failed to get microphone stream:', error);
      }
    }

    // Combine all streams
    const combinedTracks: MediaStreamTrack[] = [
      ...displayStream.getVideoTracks(),
    ];

    // Add system audio if available
    if (settings.includeSystemAudio) {
      combinedTracks.push(...displayStream.getAudioTracks());
    }

    // Add microphone audio if available
    if (microphoneStream) {
      combinedTracks.push(...microphoneStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(combinedTracks);

    return {
      displayStream,
      cameraStream,
      microphoneStream,
      combinedStream,
    };
  }

  /**
   * Get display media stream with specified settings
   */
  async getDisplayMedia(settings: RecordingSettings): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen recording is not supported in this browser');
    }

    const videoConstraints = this.getVideoConstraints(settings.quality.resolution);
    const constraints: MediaStreamConstraints & { video: any } = {
      video: {
        width: settings.quality.resolution === 'custom' && settings.quality.customWidth
          ? settings.quality.customWidth
          : videoConstraints.width,
        height: settings.quality.resolution === 'custom' && settings.quality.customHeight
          ? settings.quality.customHeight
          : videoConstraints.height,
        frameRate: settings.quality.frameRate,
        cursor: settings.showCursor ? 'always' : 'never',
      },
      audio: settings.includeSystemAudio,
    };

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // If microphone is requested, get user media and combine streams
      if (settings.includeMicrophone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true 
          });
          
          // Combine display and microphone audio
          const combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...displayStream.getAudioTracks(),
            ...audioStream.getAudioTracks(),
          ]);
          
          return combinedStream;
        } catch (audioError) {
          console.warn('Failed to get microphone access:', audioError);
          // Continue with just display stream
        }
      }
      
      return displayStream;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Screen recording permission was denied');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No screen sources available');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Screen recording is not supported');
        }
      }
      throw new Error(`Failed to get display media: ${error}`);
    }
  }

  /**
   * Start recording with the given media stream
   */
  async startRecording(
    mediaStream: MediaStream,
    settings: RecordingSettings,
    callbacks: {
      onDataAvailable?: (blob: Blob) => void;
      onStop?: (blob: Blob) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recording is already in progress');
    }

    this.onDataAvailable = callbacks.onDataAvailable;
    this.onStop = callbacks.onStop;
    this.onError = callbacks.onError;

    const capabilities = ScreenRecordingService.getCapabilities();
    if (capabilities.supportedMimeTypes.length === 0) {
      throw new Error('No supported video formats available');
    }

    // Use preferred MIME type (prioritizes MP4)
    const mimeType = ScreenRecordingService.getPreferredMimeType() || capabilities.supportedMimeTypes[0];
    const options: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: settings.quality.videoBitrate * 1000, // Convert kbps to bps
      audioBitsPerSecond: settings.quality.audioBitrate * 1000, // Convert kbps to bps
    };

    try {
      this.mediaStream = mediaStream;
      this.mediaRecorder = new MediaRecorder(mediaStream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.onStop?.(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        this.onError?.(error);
      };

      // Handle stream ending (user stops sharing)
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
        }
      });

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Pause the current recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('No active recording to pause');
    }

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume the paused recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('No active recording to resume');
    }

    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop the current recording
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop all streams
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
  }

  /**
   * Get the current recording state
   */
  getRecordingState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopRecording();
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.onDataAvailable = undefined;
    this.onStop = undefined;
    this.onError = undefined;
  }

  /**
   * Get camera constraints based on size setting
   */
  private getCameraConstraints(size: 'small' | 'medium' | 'large') {
    switch (size) {
      case 'small':
        return { width: 320, height: 240 };
      case 'medium':
        return { width: 640, height: 480 };
      case 'large':
        return { width: 1280, height: 720 };
      default:
        return { width: 640, height: 480 };
    }
  }

  private getVideoConstraints(quality: string) {
    switch (quality) {
      case '720p':
        return { width: 1280, height: 720 };
      case '1080p':
        return { width: 1920, height: 1080 };
      case '1440p':
        return { width: 2560, height: 1440 };
      case '4k':
        return { width: 3840, height: 2160 };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  private getVideoBitrate(quality: string): number {
    switch (quality) {
      case '720p':
        return 2500000; // 2.5 Mbps
      case '1080p':
        return 5000000; // 5 Mbps
      case '1440p':
        return 8000000; // 8 Mbps
      case '4k':
        return 15000000; // 15 Mbps
      default:
        return 5000000;
    }
  }
}

export type RecordingState = 'inactive' | 'recording' | 'paused';
