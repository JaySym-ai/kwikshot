import { create } from 'zustand';
import { 
  StreamingState, 
  StreamingPlatform, 
  StreamSettings, 
  StreamMetrics, 
  RTMPConfig, 
  WebRTCConfig,
  DEFAULT_STREAM_SETTINGS,
  STREAMING_PLATFORMS,
  NetworkStats,
  HardwareCapabilities,
  RecordingConfig,
  Scene,
  AudioMixer,
  StreamOverlay
} from '../../shared/streaming-types';

interface EnhancedStreamingState extends StreamingState {
  // Enhanced state
  networkStats: NetworkStats | null;
  hardwareCapabilities: HardwareCapabilities | null;
  recordingConfig: RecordingConfig | null;
  isRecording: boolean;
  scenes: Scene[];
  activeSceneId: string | null;
  audioMixer: AudioMixer | null;
  overlays: StreamOverlay[];
  
  // Authentication state
  authenticatedPlatforms: string[];
  platformTokens: { [platform: string]: any };
}

interface EnhancedStreamingStore extends EnhancedStreamingState {
  // Basic actions
  setStreaming: (isStreaming: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setPlatform: (platform: StreamingPlatform | null) => void;
  setConfig: (config: RTMPConfig | WebRTCConfig | null) => void;
  setSettings: (settings: Partial<StreamSettings>) => void;
  setMetrics: (metrics: Partial<StreamMetrics>) => void;
  setError: (error: string | null) => void;
  
  // Enhanced actions
  setNetworkStats: (stats: NetworkStats | null) => void;
  setHardwareCapabilities: (capabilities: HardwareCapabilities | null) => void;
  setRecordingConfig: (config: RecordingConfig | null) => void;
  setRecording: (isRecording: boolean) => void;
  setScenes: (scenes: Scene[]) => void;
  setActiveScene: (sceneId: string | null) => void;
  setAudioMixer: (mixer: AudioMixer | null) => void;
  setOverlays: (overlays: StreamOverlay[]) => void;
  
  // Stream management
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  pauseStream: () => Promise<void>;
  resumeStream: () => Promise<void>;
  
  // Enhanced streaming
  authenticatePlatform: (platform: string, config: any) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Scene management
  createScene: (name: string) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  switchScene: (sceneId: string, transition?: any) => Promise<void>;
  renameScene: (sceneId: string, newName: string) => Promise<void>;
  duplicateScene: (sceneId: string) => Promise<void>;
  
  // Audio management
  updateAudioSource: (sourceId: string, updates: any) => Promise<void>;
  addAudioSource: (source: any) => Promise<void>;
  removeAudioSource: (sourceId: string) => Promise<void>;
  setMasterVolume: (volume: number) => Promise<void>;
  setMasterMute: (muted: boolean) => Promise<void>;
  
  // Overlay management
  createOverlay: (overlay: Omit<StreamOverlay, 'id'>) => void;
  updateOverlay: (overlayId: string, updates: Partial<StreamOverlay>) => void;
  deleteOverlay: (overlayId: string) => void;
  reorderOverlays: (overlayIds: string[]) => void;
  
  // Configuration
  updateStreamSettings: (settings: Partial<StreamSettings>) => void;
  selectPlatform: (platformId: string) => void;
  configureRTMP: (url: string, streamKey: string) => void;
  configureWebRTC: (config: WebRTCConfig) => void;
  
  // Utility
  reset: () => void;
  getPlatformById: (id: string) => StreamingPlatform | undefined;
  loadEnhancedData: () => Promise<void>;
}

const initialMetrics: StreamMetrics = {
  bitrate: 0,
  fps: 0,
  droppedFrames: 0,
  connectionQuality: 'excellent',
  uptime: 0,
  viewerCount: 0,
  networkLatency: 0,
  packetLoss: 0,
  bandwidth: 0,
  cpuUsage: 0,
  gpuUsage: 0,
  memoryUsage: 0,
  encodingTime: 0,
  keyframes: 0,
  reconnectCount: 0
};

const initialAudioMixer: AudioMixer = {
  sources: [],
  masterVolume: 1.0,
  masterMuted: false,
  monitoring: false
};

export const useEnhancedStreamingStore = create<EnhancedStreamingStore>((set, get) => ({
  // Initial state
  isStreaming: false,
  isPaused: false,
  isConnecting: false,
  platform: null,
  config: null,
  settings: DEFAULT_STREAM_SETTINGS,
  metrics: initialMetrics,
  error: null,
  
  // Enhanced initial state
  networkStats: null,
  hardwareCapabilities: null,
  recordingConfig: null,
  isRecording: false,
  scenes: [],
  activeSceneId: null,
  audioMixer: initialAudioMixer,
  overlays: [],
  authenticatedPlatforms: [],
  platformTokens: {},

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
  
  // Enhanced setters
  setNetworkStats: (networkStats) => set({ networkStats }),
  setHardwareCapabilities: (hardwareCapabilities) => set({ hardwareCapabilities }),
  setRecordingConfig: (recordingConfig) => set({ recordingConfig }),
  setRecording: (isRecording) => set({ isRecording }),
  setScenes: (scenes) => set({ scenes }),
  setActiveScene: (activeSceneId) => set({ activeSceneId }),
  setAudioMixer: (audioMixer) => set({ audioMixer }),
  setOverlays: (overlays) => set({ overlays }),

  // Stream management
  startStream: async () => {
    const state = get();
    if (!state.platform || !state.config) {
      set({ error: 'Platform and configuration required' });
      return;
    }

    try {
      set({ isConnecting: true, error: null });
      
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

  // Enhanced streaming
  authenticatePlatform: async (platform: string, config: any) => {
    try {
      await window.electronAPI?.authenticatePlatform?.(platform, config);
      set((state) => ({
        authenticatedPlatforms: [...state.authenticatedPlatforms, platform]
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to authenticate platform' 
      });
    }
  },

  startRecording: async () => {
    try {
      await window.electronAPI?.startRecording?.();
      set({ isRecording: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start recording' 
      });
    }
  },

  stopRecording: async () => {
    try {
      await window.electronAPI?.stopRecording?.();
      set({ isRecording: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop recording' 
      });
    }
  },

  // Scene management
  createScene: async (name: string) => {
    try {
      const newScene = await window.electronAPI?.createScene?.(name);
      if (newScene) {
        set((state) => ({ scenes: [...state.scenes, newScene] }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create scene' 
      });
    }
  },

  deleteScene: async (sceneId: string) => {
    try {
      const success = await window.electronAPI?.deleteScene?.(sceneId);
      if (success) {
        set((state) => ({ 
          scenes: state.scenes.filter(scene => scene.id !== sceneId) 
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete scene' 
      });
    }
  },

  switchScene: async (sceneId: string, transition?: any) => {
    try {
      await window.electronAPI?.switchScene?.(sceneId, transition);
      set((state) => ({
        scenes: state.scenes.map(scene => ({
          ...scene,
          isActive: scene.id === sceneId
        })),
        activeSceneId: sceneId
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to switch scene' 
      });
    }
  },

  renameScene: async (sceneId: string, newName: string) => {
    try {
      const success = await window.electronAPI?.renameScene?.(sceneId, newName);
      if (success) {
        set((state) => ({
          scenes: state.scenes.map(scene => 
            scene.id === sceneId ? { ...scene, name: newName } : scene
          )
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to rename scene' 
      });
    }
  },

  duplicateScene: async (sceneId: string) => {
    try {
      const newScene = await window.electronAPI?.duplicateScene?.(sceneId);
      if (newScene) {
        set((state) => ({ scenes: [...state.scenes, newScene] }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to duplicate scene' 
      });
    }
  },

  // Audio management
  updateAudioSource: async (sourceId: string, updates: any) => {
    try {
      const success = await window.electronAPI?.updateAudioSource?.(sourceId, updates);
      if (success) {
        set((state) => ({
          audioMixer: state.audioMixer ? {
            ...state.audioMixer,
            sources: state.audioMixer.sources.map(s => 
              s.id === sourceId ? { ...s, ...updates } : s
            )
          } : null
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update audio source' 
      });
    }
  },

  addAudioSource: async (source: any) => {
    try {
      const newSource = await window.electronAPI?.addAudioSource?.(source);
      if (newSource) {
        set((state) => ({
          audioMixer: state.audioMixer ? {
            ...state.audioMixer,
            sources: [...state.audioMixer.sources, newSource]
          } : null
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add audio source' 
      });
    }
  },

  removeAudioSource: async (sourceId: string) => {
    try {
      const success = await window.electronAPI?.removeAudioSource?.(sourceId);
      if (success) {
        set((state) => ({
          audioMixer: state.audioMixer ? {
            ...state.audioMixer,
            sources: state.audioMixer.sources.filter(s => s.id !== sourceId)
          } : null
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove audio source' 
      });
    }
  },

  setMasterVolume: async (volume: number) => {
    try {
      await window.electronAPI?.setMasterVolume?.(volume);
      set((state) => ({
        audioMixer: state.audioMixer ? {
          ...state.audioMixer,
          masterVolume: volume
        } : null
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set master volume' 
      });
    }
  },

  setMasterMute: async (muted: boolean) => {
    try {
      await window.electronAPI?.setMasterMute?.(muted);
      set((state) => ({
        audioMixer: state.audioMixer ? {
          ...state.audioMixer,
          masterMuted: muted
        } : null
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set master mute' 
      });
    }
  },

  // Overlay management
  createOverlay: (overlay: Omit<StreamOverlay, 'id'>) => {
    const newOverlay: StreamOverlay = {
      ...overlay,
      id: `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    set((state) => ({
      overlays: [...state.overlays, newOverlay]
    }));
  },

  updateOverlay: (overlayId: string, updates: Partial<StreamOverlay>) => {
    set((state) => ({
      overlays: state.overlays.map(overlay => 
        overlay.id === overlayId ? { ...overlay, ...updates } : overlay
      )
    }));
  },

  deleteOverlay: (overlayId: string) => {
    set((state) => ({
      overlays: state.overlays.filter(overlay => overlay.id !== overlayId)
    }));
  },

  reorderOverlays: (overlayIds: string[]) => {
    set((state) => {
      const reorderedOverlays: StreamOverlay[] = [];
      overlayIds.forEach((id, index) => {
        const overlay = state.overlays.find(o => o.id === id);
        if (overlay) {
          reorderedOverlays.push({ ...overlay, zIndex: overlayIds.length - index });
        }
      });
      return { overlays: reorderedOverlays };
    });
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
        config: null
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

  // Load enhanced data
  loadEnhancedData: async () => {
    try {
      const [scenes, mixer, networkStats, hwCapabilities] = await Promise.all([
        window.electronAPI?.getScenes?.(),
        window.electronAPI?.getMixerState?.(),
        window.electronAPI?.getNetworkStats?.(),
        window.electronAPI?.getHardwareCapabilities?.()
      ]);

      set({
        scenes: scenes || [],
        audioMixer: mixer || initialAudioMixer,
        networkStats: networkStats || null,
        hardwareCapabilities: hwCapabilities || null,
        activeSceneId: scenes?.find((s: Scene) => s.isActive)?.id || null
      });
    } catch (error) {
      console.error('Failed to load enhanced data:', error);
    }
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
      error: null,
      networkStats: null,
      hardwareCapabilities: null,
      recordingConfig: null,
      isRecording: false,
      scenes: [],
      activeSceneId: null,
      audioMixer: initialAudioMixer,
      overlays: [],
      authenticatedPlatforms: [],
      platformTokens: {}
    });
  },

  getPlatformById: (id) => {
    return STREAMING_PLATFORMS.find(p => p.id === id);
  }
}));
