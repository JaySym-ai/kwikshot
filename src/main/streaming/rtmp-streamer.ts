import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { RTMPConfig, StreamSettings, StreamMetrics } from '../../shared/streaming-types';

export class RTMPStreamer extends EventEmitter {
  private ffmpegProcess: ChildProcess | null = null;
  private active: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private metrics: StreamMetrics = {
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    connectionQuality: 'excellent',
    uptime: 0
  };

  constructor() {
    super();
  }

  async start(config: RTMPConfig, settings: StreamSettings): Promise<void> {
    if (this.active) {
      throw new Error('Stream is already active');
    }

    try {
      this.startTime = Date.now();
      await this.startFFmpegStream(config, settings);
      this.active = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.isPaused = false;

    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }

    this.emit('disconnected');
  }

  async pause(): Promise<void> {
    if (!this.active || this.isPaused) {
      return;
    }

    this.isPaused = true;
    // For RTMP, we can't really pause the stream, so we'll just mark it as paused
    // In a real implementation, you might want to send a black frame or stop capturing
  }

  async resume(): Promise<void> {
    if (!this.active || !this.isPaused) {
      return;
    }

    this.isPaused = false;
  }

  getMetrics(): StreamMetrics {
    if (this.active) {
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    }
    return { ...this.metrics };
  }

  isActive(): boolean {
    return this.active;
  }

  private async startFFmpegStream(config: RTMPConfig, settings: StreamSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      // For demo purposes, we'll simulate a successful stream start
      // In a real implementation, you'd use FFmpeg to capture and stream
      
      console.log(`Starting RTMP stream to ${config.url} with key ${config.streamKey.substring(0, 8)}...`);
      
      // Simulate FFmpeg process
      setTimeout(() => {
        this.startMetricsSimulation(settings);
        resolve();
      }, 1000);
    });
  }

  private startMetricsSimulation(settings: StreamSettings): void {
    // Simulate realistic metrics for demo purposes
    const interval = setInterval(() => {
      if (this.active) {
        this.metrics.fps = settings.frameRate + Math.random() * 2 - 1; // ±1 fps variation
        this.metrics.bitrate = settings.videoBitrate + Math.random() * 200 - 100; // ±100 kbps variation
        this.metrics.droppedFrames += Math.random() < 0.05 ? 1 : 0; // Occasional dropped frame
        
        this.updateConnectionQuality();
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  private updateConnectionQuality(): void {
    const targetFps = 30; // This should come from settings
    const fpsRatio = this.metrics.fps / targetFps;
    
    if (this.metrics.droppedFrames > 100) {
      this.metrics.connectionQuality = 'poor';
    } else if (this.metrics.droppedFrames > 50 || fpsRatio < 0.8) {
      this.metrics.connectionQuality = 'fair';
    } else if (fpsRatio < 0.95) {
      this.metrics.connectionQuality = 'good';
    } else {
      this.metrics.connectionQuality = 'excellent';
    }
  }
}
