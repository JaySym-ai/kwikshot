import { EventEmitter } from 'events';
import { RTMPStreamer } from './rtmp-streamer';
import { WebRTCStreamer } from './webrtc-streamer';
import { RTMPConfig, WebRTCConfig, StreamSettings, StreamMetrics, RecordingConfig, NetworkStats } from '../../shared/streaming-types';
import { AuthService } from '../services/auth-service';
import { NetworkMonitor } from '../services/network-monitor';
import { HardwareDetector } from '../services/hardware-detector';
import { SceneManager } from '../services/scene-manager';
import { AudioMixerService } from '../services/audio-mixer';
import { PlatformAPIService, YouTubeAPIService, TwitchAPIService, FacebookAPIService } from '../services/platform-api-service';

export class StreamManager extends EventEmitter {
  private rtmpStreamer: RTMPStreamer | null = null;
  private webrtcStreamer: WebRTCStreamer | null = null;
  private currentStreamer: RTMPStreamer | WebRTCStreamer | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  // Enhanced services
  private authService: AuthService;
  private networkMonitor: NetworkMonitor;
  private hardwareDetector: HardwareDetector;
  private sceneManager: SceneManager;
  private audioMixer: AudioMixerService;
  private platformServices: Map<string, PlatformAPIService> = new Map();

  // Recording and monitoring
  private recordingConfig: RecordingConfig | null = null;
  private isRecording = false;
  private adaptiveBitrateEnabled = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor() {
    super();

    // Initialize services
    this.authService = new AuthService();
    this.networkMonitor = new NetworkMonitor();
    this.hardwareDetector = HardwareDetector.getInstance();
    this.sceneManager = new SceneManager();
    this.audioMixer = new AudioMixerService();

    // Initialize platform services
    this.platformServices.set('youtube', new YouTubeAPIService());
    this.platformServices.set('twitch', new TwitchAPIService());
    this.platformServices.set('facebook', new FacebookAPIService());

    this.setupEventListeners();
  }

  async startRTMPStream(config: RTMPConfig, settings: StreamSettings): Promise<void> {
    try {
      if (this.currentStreamer) {
        await this.stopStream();
      }

      // Optimize settings based on hardware and network
      const optimizedSettings = await this.optimizeStreamSettings(settings);

      this.rtmpStreamer = new RTMPStreamer();
      this.currentStreamer = this.rtmpStreamer;

      // Set up event listeners
      this.rtmpStreamer.on('connected', () => {
        this.reconnectAttempts = 0;
        this.emit('status-change', 'connected');
      });

      this.rtmpStreamer.on('disconnected', () => {
        this.emit('status-change', 'disconnected');
        this.handleDisconnection();
      });

      this.rtmpStreamer.on('error', (error: Error) => {
        this.emit('error', error.message);
        this.handleStreamError(error);
      });

      await this.rtmpStreamer.start(config, optimizedSettings);

      // Start additional services
      this.startMetricsCollection();
      this.startNetworkMonitoring();
      this.startAdaptiveBitrate();

      // Start recording if configured
      if (this.recordingConfig?.enabled) {
        await this.startRecording();
      }

    } catch (error) {
      this.emit('error', error instanceof Error ? error.message : 'Failed to start RTMP stream');
      throw error;
    }
  }

  async startWebRTCStream(config: WebRTCConfig, settings: StreamSettings): Promise<void> {
    try {
      if (this.currentStreamer) {
        await this.stopStream();
      }

      this.webrtcStreamer = new WebRTCStreamer();
      this.currentStreamer = this.webrtcStreamer;

      // Set up event listeners
      this.webrtcStreamer.on('connected', () => {
        this.emit('status-change', 'connected');
      });

      this.webrtcStreamer.on('disconnected', () => {
        this.emit('status-change', 'disconnected');
      });

      this.webrtcStreamer.on('error', (error: Error) => {
        this.emit('error', error.message);
      });

      await this.webrtcStreamer.start(config, settings);
      this.startMetricsCollection();
      
    } catch (error) {
      this.emit('error', error instanceof Error ? error.message : 'Failed to start WebRTC stream');
      throw error;
    }
  }

  async stopStream(): Promise<void> {
    try {
      this.stopMetricsCollection();

      if (this.currentStreamer) {
        await this.currentStreamer.stop();
        this.currentStreamer = null;
      }

      this.rtmpStreamer = null;
      this.webrtcStreamer = null;
      
      this.emit('status-change', 'stopped');
    } catch (error) {
      this.emit('error', error instanceof Error ? error.message : 'Failed to stop stream');
      throw error;
    }
  }

  async pauseStream(): Promise<void> {
    if (this.currentStreamer) {
      await this.currentStreamer.pause();
      this.emit('status-change', 'paused');
    }
  }

  async resumeStream(): Promise<void> {
    if (this.currentStreamer) {
      await this.currentStreamer.resume();
      this.emit('status-change', 'resumed');
    }
  }

  getMetrics(): StreamMetrics {
    if (this.currentStreamer) {
      return this.currentStreamer.getMetrics();
    }

    return {
      bitrate: 0,
      fps: 0,
      droppedFrames: 0,
      connectionQuality: 'poor',
      uptime: 0
    };
  }

  isStreaming(): boolean {
    return this.currentStreamer !== null && this.currentStreamer.isActive();
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      if (this.currentStreamer) {
        const metrics = this.currentStreamer.getMetrics();
        this.emit('metrics-update', metrics);
      }
    }, 1000); // Update metrics every second
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // Enhanced methods for new features

  /**
   * Authenticate with a platform
   */
  async authenticatePlatform(platform: string, config: any): Promise<void> {
    const token = await this.authService.authenticate(platform, config);
    const platformService = this.platformServices.get(platform);
    if (platformService) {
      platformService.setToken(token);
    }
    this.emit('platform-authenticated', platform);
  }

  /**
   * Get stream key from authenticated platform
   */
  async getStreamKey(platform: string): Promise<string> {
    const platformService = this.platformServices.get(platform);
    if (!platformService) {
      throw new Error(`Platform ${platform} not supported`);
    }
    return await platformService.getStreamKey();
  }

  /**
   * Configure recording
   */
  setRecordingConfig(config: RecordingConfig): void {
    this.recordingConfig = config;
    this.emit('recording-config-changed', config);
  }

  /**
   * Start local recording
   */
  async startRecording(): Promise<void> {
    if (!this.recordingConfig?.enabled) {
      throw new Error('Recording not configured');
    }

    this.isRecording = true;
    // TODO: Implement actual recording logic
    this.emit('recording-started');
  }

  /**
   * Stop local recording
   */
  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    this.isRecording = false;
    // TODO: Implement actual recording stop logic
    this.emit('recording-stopped');
  }

  /**
   * Get scene manager
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Get audio mixer
   */
  getAudioMixer(): AudioMixerService {
    return this.audioMixer;
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): NetworkStats | null {
    return this.networkMonitor.getLatestStats();
  }

  /**
   * Get hardware capabilities
   */
  async getHardwareCapabilities() {
    return await this.hardwareDetector.detectCapabilities();
  }

  private async optimizeStreamSettings(settings: StreamSettings): Promise<StreamSettings> {
    const optimized = { ...settings };

    // Hardware optimization
    if (settings.hardwareEncoding) {
      const bestEncoder = await this.hardwareDetector.getBestEncoder();
      const recommendedSettings = await this.hardwareDetector.getRecommendedSettings();

      optimized.encoder = recommendedSettings.encoder as any;
      optimized.preset = recommendedSettings.preset as any;
      optimized.profile = recommendedSettings.profile as any;
      optimized.level = recommendedSettings.level;
    }

    // Network optimization
    if (settings.adaptiveBitrate) {
      const recommendedBitrate = this.networkMonitor.getRecommendedBitrate();
      if (recommendedBitrate > 0) {
        optimized.videoBitrate = Math.min(optimized.videoBitrate, recommendedBitrate);
      }
    }

    return optimized;
  }

  private setupEventListeners(): void {
    // Network monitoring events
    this.networkMonitor.on('stats-updated', (stats: NetworkStats) => {
      this.emit('network-stats', stats);

      if (this.adaptiveBitrateEnabled) {
        this.adjustBitrateBasedOnNetwork(stats);
      }
    });

    this.networkMonitor.on('network-warning', (warning: string) => {
      this.emit('network-warning', warning);
    });

    // Scene manager events
    this.sceneManager.on('scene-switched', (scene) => {
      this.emit('scene-changed', scene);
    });

    // Audio mixer events
    this.audioMixer.on('source-added', (source) => {
      this.emit('audio-source-added', source);
    });
  }

  private startNetworkMonitoring(): void {
    this.networkMonitor.startMonitoring();
  }

  private startAdaptiveBitrate(): void {
    this.adaptiveBitrateEnabled = true;
  }

  private adjustBitrateBasedOnNetwork(stats: NetworkStats): void {
    if (!this.currentStreamer) return;

    const recommendedBitrate = this.networkMonitor.getRecommendedBitrate();
    const currentMetrics = this.getMetrics();

    if (Math.abs(currentMetrics.bitrate - recommendedBitrate) > 500) {
      // Significant difference, adjust bitrate
      this.emit('bitrate-adjustment', {
        from: currentMetrics.bitrate,
        to: recommendedBitrate,
        reason: 'network_conditions'
      });

      // TODO: Actually adjust the encoder bitrate
    }
  }

  private async handleDisconnection(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.emit('reconnect-attempt', this.reconnectAttempts);

      setTimeout(async () => {
        try {
          // TODO: Implement reconnection logic
          this.emit('reconnected');
        } catch (error) {
          this.emit('reconnect-failed', error);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.emit('max-reconnect-attempts-reached');
    }
  }

  private handleStreamError(error: Error): void {
    // Log error and attempt recovery
    console.error('Stream error:', error);

    if (error.message.includes('network')) {
      this.handleDisconnection();
    }
  }

  destroy(): void {
    this.stopStream();
    this.stopMetricsCollection();

    // Clean up services
    this.networkMonitor.destroy();
    this.sceneManager.destroy();
    this.audioMixer.destroy();
    this.authService.destroy();

    this.removeAllListeners();
  }
}
