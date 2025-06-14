import { create } from 'zustand';
import { 
  StreamingState, 
  StreamingPlatform, 
  StreamSettings, 
  StreamMetrics, 
  RTMPConfig, 
  WebRTCConfig,
  DEFAULT_STREAM_SETTINGS,
  STREAMING_PLATFORMS 
} from '../../shared/streaming-types';

interface StreamingStore extends StreamingState {
  // Actions
  setStreaming: (isStreaming: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setPlatform: (platform: StreamingPlatform | null) => void;
  setConfig: (config: RTMPConfig | WebRTCConfig | null) => void;
  setSettings: (settings: Partial<StreamSettings>) => void;
  setMetrics: (metrics: Partial<StreamMetrics>) => void;
  setError: (error: string | null) => void;
  
  // Stream management
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  pauseStream: () => Promise<void>;
  resumeStream: () => Promise<void>;
  
  // Configuration
  updateStreamSettings: (settings: Partial<StreamSettings>) => void;
  selectPlatform: (platformId: string) => void;
  configureRTMP: (url: string, streamKey: string) => void;
  configureWebRTC: (config: WebRTCConfig) => void;
  
  // Utility
  reset: () => void;
  getPlatformById: (id: string) => StreamingPlatform | undefined;
}

const initialMetrics: StreamMetrics = {
  bitrate: 0,
  fps: 0,
  droppedFrames: 0,
  connectionQuality: 'excellent',
  uptime: 0,
  viewerCount: 0
};

export const useStreamingStore = create<StreamingStore>((set, get) => ({
  // Initial state
  isStreaming: false,
  isPaused: false,
  isConnecting: false,
  platform: null,
  config: null,
  settings: DEFAULT_STREAM_SETTINGS,
  metrics: initialMetrics,
  error: null,

  // Basic setters
  setStreaming: (isStreaming) => set({ isStreaming }),
  setPaused: (isPaused) => set({ isPaused }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setPlatform: (platform) => set({ platform }),
  setConfig: (config) => set({ config }),
  setSettings: (settings) => set((state) => ({ 
    settings: { ...state.settings, ...settings } 
  })),
  setMetrics: (metrics) => set((state) => ({ 
    metrics: { ...state.metrics, ...metrics } 
  })),
  setError: (error) => set({ error }),

  // Stream management
  startStream: async () => {
    const state = get();
    if (!state.platform || !state.config) {
      set({ error: 'Platform and configuration required' });
      return;
    }

    try {
      set({ isConnecting: true, error: null });
      
      // Call the appropriate streaming API based on platform type
      if (state.platform.type === 'rtmp') {
        await window.electronAPI?.startRTMPStream?.(
          state.config as RTMPConfig, 
          state.settings
        );
      } else {
        await window.electronAPI?.startWebRTCStream?.(
          state.config as WebRTCConfig, 
          state.settings
        );
      }
      
      set({ 
        isStreaming: true, 
        isConnecting: false, 
        isPaused: false 
      });
    } catch (error) {
      set({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to start stream' 
      });
    }
  },

  stopStream: async () => {
    try {
      await window.electronAPI?.stopStream?.();
      set({ 
        isStreaming: false, 
        isPaused: false, 
        isConnecting: false,
        metrics: initialMetrics 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop stream' 
      });
    }
  },

  pauseStream: async () => {
    try {
      await window.electronAPI?.pauseStream?.();
      set({ isPaused: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to pause stream' 
      });
    }
  },

  resumeStream: async () => {
    try {
      await window.electronAPI?.resumeStream?.();
      set({ isPaused: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to resume stream' 
      });
    }
  },

  // Configuration methods
  updateStreamSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  selectPlatform: (platformId) => {
    const platform = STREAMING_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      set({ 
        platform,
        settings: platform.defaultSettings,
        config: null // Reset config when platform changes
      });
    }
  },

  configureRTMP: (url, streamKey) => {
    const state = get();
    if (state.platform) {
      set({
        config: {
          url,
          streamKey,
          platform: state.platform.id
        } as RTMPConfig
      });
    }
  },

  configureWebRTC: (config) => {
    set({ config });
  },

  // Utility methods
  reset: () => {
    set({
      isStreaming: false,
      isPaused: false,
      isConnecting: false,
      platform: null,
      config: null,
      settings: DEFAULT_STREAM_SETTINGS,
      metrics: initialMetrics,
      error: null
    });
  },

  getPlatformById: (id) => {
    return STREAMING_PLATFORMS.find(p => p.id === id);
  }
}));
