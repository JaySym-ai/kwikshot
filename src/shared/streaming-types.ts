export interface StreamingPlatform {
  id: string;
  name: string;
  type: 'rtmp' | 'webrtc';
  icon: string;
  requiresAuth: boolean;
  supportsChat: boolean;
  defaultSettings: StreamSettings;
}

export interface StreamSettings {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  audioSampleRate: number;
  keyFrameInterval: number;
}

export interface RTMPConfig {
  url: string;
  streamKey: string;
  platform: string;
}

export interface WebRTCConfig {
  signalingServer: string;
  stunServers: string[];
  turnServers?: {
    urls: string;
    username: string;
    credential: string;
  }[];
}

export interface StreamingState {
  isStreaming: boolean;
  isPaused: boolean;
  isConnecting: boolean;
  platform: StreamingPlatform | null;
  config: RTMPConfig | WebRTCConfig | null;
  settings: StreamSettings;
  metrics: StreamMetrics;
  error: string | null;
}

export interface StreamMetrics {
  bitrate: number;
  fps: number;
  droppedFrames: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  uptime: number;
  viewerCount?: number;
}

export interface StreamSource {
  id: string;
  type: 'screen' | 'webcam' | 'audio';
  name: string;
  enabled: boolean;
  settings?: any;
}

// Predefined streaming platforms
export const STREAMING_PLATFORMS: StreamingPlatform[] = [
  {
    id: 'youtube',
    name: 'YouTube Live',
    type: 'rtmp',
    icon: 'youtube',
    requiresAuth: true,
    supportsChat: true,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 4500,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2
    }
  },
  {
    id: 'twitch',
    name: 'Twitch',
    type: 'rtmp',
    icon: 'twitch',
    requiresAuth: true,
    supportsChat: true,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 6000,
      audioBitrate: 160,
      audioSampleRate: 48000,
      keyFrameInterval: 2
    }
  },
  {
    id: 'facebook',
    name: 'Facebook Live',
    type: 'rtmp',
    icon: 'facebook',
    requiresAuth: true,
    supportsChat: true,
    defaultSettings: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2
    }
  },
  {
    id: 'custom-rtmp',
    name: 'Custom RTMP',
    type: 'rtmp',
    icon: 'server',
    requiresAuth: false,
    supportsChat: false,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 5000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2
    }
  },
  {
    id: 'webrtc-direct',
    name: 'Direct WebRTC',
    type: 'webrtc',
    icon: 'globe',
    requiresAuth: false,
    supportsChat: false,
    defaultSettings: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 2500,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2
    }
  }
];

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  videoBitrate: 4500,
  audioBitrate: 128,
  audioSampleRate: 44100,
  keyFrameInterval: 2
};
