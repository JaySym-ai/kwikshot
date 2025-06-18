import { create } from 'zustand';

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
  groupId?: string;
}

export interface RecordingQualitySettings {
  resolution: '720p' | '1080p' | '1440p' | '4k' | 'custom';
  customWidth?: number;
  customHeight?: number;
  frameRate: 15 | 30 | 60 | 120;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  audioSampleRate: 44100 | 48000;
}

export interface RecordingSettings {
  // Video settings
  quality: RecordingQualitySettings;

  // Source selection
  selectedSource?: Electron.DesktopCapturerSource;
  selectedCamera?: MediaDevice;
  cameraEnabled: boolean;
  cameraPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  cameraSize: 'small' | 'medium' | 'large';

  // Audio settings
  includeSystemAudio: boolean;
  includeMicrophone: boolean;
  selectedMicrophone?: MediaDevice;
  selectedSpeaker?: MediaDevice;
  microphoneGain: number; // 0-100
  systemAudioGain: number; // 0-100

  // Recording behavior
  showCursor: boolean;
  highlightClicks: boolean;
  recordFullscreen: boolean;
  autoStopAfter?: number; // minutes
}

export interface RecordingState {
  // Recording status
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  isPreviewActive: boolean;

  // Recording data
  duration: number;
  recordedBlob: Blob | null;
  mediaRecorder: MediaRecorder | null;
  mediaStream: MediaStream | null;
  cameraStream: MediaStream | null;
  previewStream: MediaStream | null;

  // Recording statistics
  recordingStats: {
    fileSize: number;
    framesRecorded: number;
    droppedFrames: number;
    averageFps: number;
    peakMemoryUsage: number;
  };

  // Settings
  settings: RecordingSettings;

  // Available sources and devices
  availableSources: Electron.DesktopCapturerSource[];
  availableCameras: MediaDevice[];
  availableMicrophones: MediaDevice[];
  availableSpeakers: MediaDevice[];

  // Error handling
  error: string | null;
  warnings: string[];
  
  // Actions
  setRecording: (isRecording: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setPreviewActive: (isActive: boolean) => void;
  setDuration: (duration: number) => void;
  incrementDuration: () => void;
  setRecordedBlob: (blob: Blob | null) => void;
  setMediaRecorder: (recorder: MediaRecorder | null) => void;
  setMediaStream: (stream: MediaStream | null) => void;
  setCameraStream: (stream: MediaStream | null) => void;
  setPreviewStream: (stream: MediaStream | null) => void;
  updateRecordingStats: (stats: Partial<RecordingState['recordingStats']>) => void;
  updateSettings: (settings: Partial<RecordingSettings>) => void;
  setAvailableSources: (sources: Electron.DesktopCapturerSource[]) => void;
  setAvailableCameras: (cameras: MediaDevice[]) => void;
  setAvailableMicrophones: (microphones: MediaDevice[]) => void;
  setAvailableSpeakers: (speakers: MediaDevice[]) => void;
  setError: (error: string | null) => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;
  reset: () => void;
}

const defaultQualitySettings: RecordingQualitySettings = {
  resolution: '1080p',
  frameRate: 30,
  videoBitrate: 5000, // 5 Mbps
  audioBitrate: 128, // 128 kbps
  audioSampleRate: 48000,
};

const defaultSettings: RecordingSettings = {
  quality: defaultQualitySettings,
  cameraEnabled: false,
  cameraPosition: 'bottom-right',
  cameraSize: 'medium',
  includeSystemAudio: true,
  includeMicrophone: false,
  microphoneGain: 75,
  systemAudioGain: 75,
  showCursor: true,
  highlightClicks: false,
  recordFullscreen: false,
};

export const useRecordingStore = create<RecordingState>((set) => ({
  // Initial state
  isRecording: false,
  isPaused: false,
  isProcessing: false,
  isPreviewActive: false,
  duration: 0,
  recordedBlob: null,
  mediaRecorder: null,
  mediaStream: null,
  cameraStream: null,
  previewStream: null,
  recordingStats: {
    fileSize: 0,
    framesRecorded: 0,
    droppedFrames: 0,
    averageFps: 0,
    peakMemoryUsage: 0,
  },
  settings: defaultSettings,
  availableSources: [],
  availableCameras: [],
  availableMicrophones: [],
  availableSpeakers: [],
  error: null,
  warnings: [],
  
  // Actions
  setRecording: (isRecording) => set({ isRecording }),
  setPaused: (isPaused) => set({ isPaused }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPreviewActive: (isPreviewActive) => set({ isPreviewActive }),
  setDuration: (duration) => set({ duration }),
  incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
  setRecordedBlob: (recordedBlob) => set({ recordedBlob }),
  setMediaRecorder: (mediaRecorder) => set({ mediaRecorder }),
  setMediaStream: (mediaStream) => set({ mediaStream }),
  setCameraStream: (cameraStream) => set({ cameraStream }),
  setPreviewStream: (previewStream) => set({ previewStream }),
  updateRecordingStats: (newStats) => set((state) => ({
    recordingStats: { ...state.recordingStats, ...newStats }
  })),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    })),
  setAvailableSources: (availableSources) => set({ availableSources }),
  setAvailableCameras: (availableCameras) => set({ availableCameras }),
  setAvailableMicrophones: (availableMicrophones) => set({ availableMicrophones }),
  setAvailableSpeakers: (availableSpeakers) => set({ availableSpeakers }),
  setError: (error) => set({ error }),
  addWarning: (warning) => set((state) => ({
    warnings: [...state.warnings, warning]
  })),
  clearWarnings: () => set({ warnings: [] }),
  reset: () => set({
    isRecording: false,
    isPaused: false,
    isProcessing: false,
    isPreviewActive: false,
    duration: 0,
    recordedBlob: null,
    mediaRecorder: null,
    mediaStream: null,
    cameraStream: null,
    previewStream: null,
    recordingStats: {
      fileSize: 0,
      framesRecorded: 0,
      droppedFrames: 0,
      averageFps: 0,
      peakMemoryUsage: 0,
    },
    error: null,
    warnings: [],
  }),
}));
