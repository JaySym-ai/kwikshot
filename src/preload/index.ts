import { contextBridge, ipcRenderer } from 'electron';
import { RTMPConfig, WebRTCConfig, StreamSettings, StreamMetrics } from '../shared/streaming-types';

// Define the API interface
export interface ElectronAPI {
  // Screen capture
  getSources: () => Promise<Electron.DesktopCapturerSource[]>;
  getMediaDevices: () => Promise<{ success: boolean; error?: string }>;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  quitApp: () => Promise<void>;

  // File operations
  selectDirectory: () => Promise<string | null>;
  saveFile: (data: any, filename: string) => Promise<boolean>;
  openFolder: (path: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;

  // Streaming
  startRTMPStream?: (config: RTMPConfig, settings: StreamSettings) => Promise<void>;
  startWebRTCStream?: (config: WebRTCConfig, settings: StreamSettings) => Promise<void>;
  stopStream?: () => Promise<void>;
  pauseStream?: () => Promise<void>;
  resumeStream?: () => Promise<void>;
  getStreamMetrics?: () => Promise<StreamMetrics>;

  // Enhanced streaming
  authenticatePlatform?: (platform: string, config: any) => Promise<void>;
  getStreamKey?: (platform: string) => Promise<string>;
  setRecordingConfig?: (config: any) => Promise<void>;
  startRecording?: () => Promise<void>;
  stopRecording?: () => Promise<void>;
  getNetworkStats?: () => Promise<any>;
  getHardwareCapabilities?: () => Promise<any>;

  // Scene management
  getScenes?: () => Promise<any[]>;
  createScene?: (name: string) => Promise<any>;
  deleteScene?: (sceneId: string) => Promise<boolean>;
  switchScene?: (sceneId: string, transition?: any) => Promise<void>;
  renameScene?: (sceneId: string, newName: string) => Promise<boolean>;
  duplicateScene?: (sceneId: string) => Promise<any>;
  addSourceToScene?: (sceneId: string, source: any) => Promise<any>;
  removeSourceFromScene?: (sceneId: string, sourceId: string) => Promise<boolean>;
  updateSource?: (sceneId: string, sourceId: string, updates: any) => Promise<boolean>;

  // Audio mixer
  getMixerState?: () => Promise<any>;
  addAudioSource?: (source: any) => Promise<any>;
  removeAudioSource?: (sourceId: string) => Promise<boolean>;
  updateAudioSource?: (sourceId: string, updates: any) => Promise<boolean>;
  setMasterVolume?: (volume: number) => Promise<void>;
  setMasterMute?: (muted: boolean) => Promise<void>;
  setMonitoring?: (enabled: boolean) => Promise<void>;
  addAudioFilter?: (sourceId: string, filter: any) => Promise<any>;
  removeAudioFilter?: (sourceId: string, filterId: string) => Promise<boolean>;
  getAudioLevels?: () => Promise<any>;

  // Streaming events
  onStreamMetricsUpdate?: (callback: (metrics: StreamMetrics) => void) => void;
  onStreamError?: (callback: (error: string) => void) => void;
  onStreamStatusChange?: (callback: (status: string) => void) => void;
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  // Screen capture
  getSources: () => ipcRenderer.invoke('get-sources'),
  getMediaDevices: () => ipcRenderer.invoke('get-media-devices'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // File operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (data: any, filename: string) => ipcRenderer.invoke('save-file', data, filename),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),

  // Streaming
  startRTMPStream: (config: RTMPConfig, settings: StreamSettings) =>
    ipcRenderer.invoke('start-rtmp-stream', config, settings),
  startWebRTCStream: (config: WebRTCConfig, settings: StreamSettings) =>
    ipcRenderer.invoke('start-webrtc-stream', config, settings),
  stopStream: () => ipcRenderer.invoke('stop-stream'),
  pauseStream: () => ipcRenderer.invoke('pause-stream'),
  resumeStream: () => ipcRenderer.invoke('resume-stream'),
  getStreamMetrics: () => ipcRenderer.invoke('get-stream-metrics'),

  // Enhanced streaming
  authenticatePlatform: (platform: string, config: any) =>
    ipcRenderer.invoke('authenticate-platform', platform, config),
  getStreamKey: (platform: string) =>
    ipcRenderer.invoke('get-stream-key', platform),
  setRecordingConfig: (config: any) =>
    ipcRenderer.invoke('set-recording-config', config),
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  getNetworkStats: () => ipcRenderer.invoke('get-network-stats'),
  getHardwareCapabilities: () => ipcRenderer.invoke('get-hardware-capabilities'),

  // Scene management
  getScenes: () => ipcRenderer.invoke('get-scenes'),
  createScene: (name: string) => ipcRenderer.invoke('create-scene', name),
  deleteScene: (sceneId: string) => ipcRenderer.invoke('delete-scene', sceneId),
  switchScene: (sceneId: string, transition?: any) =>
    ipcRenderer.invoke('switch-scene', sceneId, transition),
  renameScene: (sceneId: string, newName: string) =>
    ipcRenderer.invoke('rename-scene', sceneId, newName),
  duplicateScene: (sceneId: string) => ipcRenderer.invoke('duplicate-scene', sceneId),
  addSourceToScene: (sceneId: string, source: any) =>
    ipcRenderer.invoke('add-source-to-scene', sceneId, source),
  removeSourceFromScene: (sceneId: string, sourceId: string) =>
    ipcRenderer.invoke('remove-source-from-scene', sceneId, sourceId),
  updateSource: (sceneId: string, sourceId: string, updates: any) =>
    ipcRenderer.invoke('update-source', sceneId, sourceId, updates),

  // Audio mixer
  getMixerState: () => ipcRenderer.invoke('get-mixer-state'),
  addAudioSource: (source: any) => ipcRenderer.invoke('add-audio-source', source),
  removeAudioSource: (sourceId: string) => ipcRenderer.invoke('remove-audio-source', sourceId),
  updateAudioSource: (sourceId: string, updates: any) =>
    ipcRenderer.invoke('update-audio-source', sourceId, updates),
  setMasterVolume: (volume: number) => ipcRenderer.invoke('set-master-volume', volume),
  setMasterMute: (muted: boolean) => ipcRenderer.invoke('set-master-mute', muted),
  setMonitoring: (enabled: boolean) => ipcRenderer.invoke('set-monitoring', enabled),
  addAudioFilter: (sourceId: string, filter: any) =>
    ipcRenderer.invoke('add-audio-filter', sourceId, filter),
  removeAudioFilter: (sourceId: string, filterId: string) =>
    ipcRenderer.invoke('remove-audio-filter', sourceId, filterId),
  getAudioLevels: () => ipcRenderer.invoke('get-audio-levels'),

  // Streaming events
  onStreamMetricsUpdate: (callback: (metrics: StreamMetrics) => void) => {
    ipcRenderer.on('stream-metrics-update', (_, metrics) => callback(metrics));
  },
  onStreamError: (callback: (error: string) => void) => {
    ipcRenderer.on('stream-error', (_, error) => callback(error));
  },
  onStreamStatusChange: (callback: (status: string) => void) => {
    ipcRenderer.on('stream-status-change', (_, status) => callback(status));
  }
};

// Expose the API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
