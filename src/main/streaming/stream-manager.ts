import { EventEmitter } from 'events';
import { RTMPStreamer } from './rtmp-streamer';
import { WebRTCStreamer } from './webrtc-streamer';
import { RTMPConfig, WebRTCConfig, StreamSettings, StreamMetrics } from '../../shared/streaming-types';

export class StreamManager extends EventEmitter {
  private rtmpStreamer: RTMPStreamer | null = null;
  private webrtcStreamer: WebRTCStreamer | null = null;
  private currentStreamer: RTMPStreamer | WebRTCStreamer | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async startRTMPStream(config: RTMPConfig, settings: StreamSettings): Promise<void> {
    try {
      if (this.currentStreamer) {
        await this.stopStream();
      }

      this.rtmpStreamer = new RTMPStreamer();
      this.currentStreamer = this.rtmpStreamer;

      // Set up event listeners
      this.rtmpStreamer.on('connected', () => {
        this.emit('status-change', 'connected');
      });

      this.rtmpStreamer.on('disconnected', () => {
        this.emit('status-change', 'disconnected');
      });

      this.rtmpStreamer.on('error', (error: Error) => {
        this.emit('error', error.message);
      });

      await this.rtmpStreamer.start(config, settings);
      this.startMetricsCollection();
      
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

  destroy(): void {
    this.stopStream();
    this.removeAllListeners();
  }
}
