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
