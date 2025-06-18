export interface StreamingPlatform {
  id: string;
  name: string;
  type: 'rtmp' | 'webrtc';
  icon: string;
  requiresAuth: boolean;
  supportsChat: boolean;
  supportsRecording: boolean;
  supportsScenes: boolean;
  supportsOverlays: boolean;
  maxBitrate: number;
  defaultSettings: StreamSettings;
  authConfig?: PlatformAuthConfig;
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
  adaptiveBitrate: boolean;
  hardwareEncoding: boolean;
  encoder: 'x264' | 'nvenc' | 'quicksync' | 'vce' | 'auto';
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  profile: 'baseline' | 'main' | 'high';
  level: string;
  bFrames: number;
  lookAhead: boolean;
  psychoVisual: boolean;
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
  networkLatency: number;
  packetLoss: number;
  bandwidth: number;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  encodingTime: number;
  keyframes: number;
  reconnectCount: number;
  lastReconnect?: Date;
}

export interface StreamSource {
  id: string;
  type: 'screen' | 'webcam' | 'audio' | 'image' | 'text' | 'browser';
  name: string;
  enabled: boolean;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  settings?: any;
}

// Authentication Types
export interface PlatformAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string[];
  platform: string;
}

// Scene Management Types
export interface Scene {
  id: string;
  name: string;
  sources: StreamSource[];
  isActive: boolean;
  preview?: string; // base64 thumbnail
  transitions?: SceneTransition[];
}

export interface SceneTransition {
  type: 'cut' | 'fade' | 'slide' | 'wipe';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Audio Mixing Types
export interface AudioSource {
  id: string;
  name: string;
  type: 'microphone' | 'desktop' | 'application' | 'file';
  deviceId?: string;
  volume: number;
  muted: boolean;
  monitoring: boolean;
  filters: AudioFilter[];
}

export interface AudioFilter {
  id: string;
  type: 'noise_gate' | 'compressor' | 'equalizer' | 'reverb' | 'echo';
  enabled: boolean;
  settings: Record<string, any>;
}

export interface AudioMixer {
  sources: AudioSource[];
  masterVolume: number;
  masterMuted: boolean;
  monitoring: boolean;
}

// Overlay Types
export interface StreamOverlay {
  id: string;
  name: string;
  type: 'text' | 'image' | 'webcam' | 'chat' | 'alerts' | 'timer' | 'custom';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  opacity: number;
  zIndex: number;
  settings: Record<string, any>;
}

// Recording Types
export interface RecordingConfig {
  enabled: boolean;
  format: 'mp4' | 'mkv' | 'flv';
  quality: 'same_as_stream' | 'high' | 'medium' | 'low';
  path: string;
  filename: string;
  splitTime?: number; // minutes
}

// Network Monitoring Types
export interface NetworkStats {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  timestamp: Date;
}

// Hardware Encoding Types
export interface HardwareCapabilities {
  nvenc: boolean;
  quicksync: boolean;
  vce: boolean;
  vaapi: boolean;
  videotoolbox: boolean;
  gpuName?: string;
  gpuMemory?: number;
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
    supportsRecording: true,
    supportsScenes: true,
    supportsOverlays: true,
    maxBitrate: 51000,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 4500,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2,
      adaptiveBitrate: true,
      hardwareEncoding: true,
      encoder: 'auto',
      preset: 'fast',
      profile: 'high',
      level: '4.1',
      bFrames: 2,
      lookAhead: true,
      psychoVisual: true
    },
    authConfig: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: 'http://localhost:3000/auth/youtube/callback',
      scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token'
    }
  },
  {
    id: 'twitch',
    name: 'Twitch',
    type: 'rtmp',
    icon: 'twitch',
    requiresAuth: true,
    supportsChat: true,
    supportsRecording: true,
    supportsScenes: true,
    supportsOverlays: true,
    maxBitrate: 8500,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 6000,
      audioBitrate: 160,
      audioSampleRate: 48000,
      keyFrameInterval: 2,
      adaptiveBitrate: true,
      hardwareEncoding: true,
      encoder: 'auto',
      preset: 'fast',
      profile: 'high',
      level: '4.1',
      bFrames: 2,
      lookAhead: true,
      psychoVisual: true
    },
    authConfig: {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      redirectUri: 'http://localhost:3000/auth/twitch/callback',
      scopes: ['channel:manage:broadcast', 'chat:read', 'chat:edit'],
      authUrl: 'https://id.twitch.tv/oauth2/authorize',
      tokenUrl: 'https://id.twitch.tv/oauth2/token'
    }
  },
  {
    id: 'facebook',
    name: 'Facebook Live',
    type: 'rtmp',
    icon: 'facebook',
    requiresAuth: true,
    supportsChat: true,
    supportsRecording: true,
    supportsScenes: true,
    supportsOverlays: true,
    maxBitrate: 4000,
    defaultSettings: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2,
      adaptiveBitrate: true,
      hardwareEncoding: true,
      encoder: 'auto',
      preset: 'fast',
      profile: 'main',
      level: '3.1',
      bFrames: 2,
      lookAhead: false,
      psychoVisual: true
    },
    authConfig: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirectUri: 'http://localhost:3000/auth/facebook/callback',
      scopes: ['publish_video', 'pages_manage_posts'],
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token'
    }
  },
  {
    id: 'custom-rtmp',
    name: 'Custom RTMP',
    type: 'rtmp',
    icon: 'server',
    requiresAuth: false,
    supportsChat: false,
    supportsRecording: true,
    supportsScenes: true,
    supportsOverlays: true,
    maxBitrate: 50000,
    defaultSettings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 5000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2,
      adaptiveBitrate: true,
      hardwareEncoding: true,
      encoder: 'auto',
      preset: 'fast',
      profile: 'high',
      level: '4.1',
      bFrames: 2,
      lookAhead: true,
      psychoVisual: true
    }
  },
  {
    id: 'webrtc-direct',
    name: 'Direct WebRTC',
    type: 'webrtc',
    icon: 'globe',
    requiresAuth: false,
    supportsChat: false,
    supportsRecording: true,
    supportsScenes: true,
    supportsOverlays: true,
    maxBitrate: 10000,
    defaultSettings: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 2500,
      audioBitrate: 128,
      audioSampleRate: 44100,
      keyFrameInterval: 2,
      adaptiveBitrate: true,
      hardwareEncoding: false,
      encoder: 'x264',
      preset: 'fast',
      profile: 'main',
      level: '3.1',
      bFrames: 0,
      lookAhead: false,
      psychoVisual: false
    }
  }
];

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  videoBitrate: 4500,
  audioBitrate: 128,
  audioSampleRate: 44100,
  keyFrameInterval: 2,
  adaptiveBitrate: true,
  hardwareEncoding: true,
  encoder: 'auto',
  preset: 'fast',
  profile: 'high',
  level: '4.1',
  bFrames: 2,
  lookAhead: true,
  psychoVisual: true
};
