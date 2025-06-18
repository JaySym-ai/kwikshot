// Video Exporter Service - Multiple format and quality export options
// Built using AugmentCode tool - www.augmentcode.com

import { VideoProject, ExportSettings, RenderJob } from '../types/videoEditorTypes';

export interface ExportProgress {
  progress: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  timeRemaining: number; // seconds
  speed: number; // frames per second
}

export class VideoExporter {
  private activeJobs: Map<string, RenderJob> = new Map();
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> = new Map();

  /**
   * Start video export
   */
  async startExport(
    project: VideoProject,
    settings: ExportSettings,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    const jobId = crypto.randomUUID();
    
    const job: RenderJob = {
      id: jobId,
      type: 'export',
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      endTime: Date.now(),
      settings,
      outputPath: settings.outputPath
    };

    this.activeJobs.set(jobId, job);
    
    if (onProgress) {
      this.progressCallbacks.set(jobId, onProgress);
    }

    try {
      // Update job status
      job.status = 'processing';
      
      // Calculate total frames
      const totalFrames = Math.ceil(project.settings.duration * project.settings.frameRate);
      
      // Start export process
      const outputPath = await this.processExport(project, settings, jobId, totalFrames);
      
      // Update job completion
      job.status = 'completed';
      job.progress = 100;
      job.outputPath = outputPath;
      job.endTime = Date.now();
      
      return outputPath;
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      this.progressCallbacks.delete(jobId);
    }
  }

  /**
   * Cancel an active export
   */
  cancelExport(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== 'processing') {
      return false;
    }

    job.status = 'error';
    job.error = 'Cancelled by user';
    this.activeJobs.delete(jobId);
    this.progressCallbacks.delete(jobId);
    
    return true;
  }

  /**
   * Get export job status
   */
  getJobStatus(jobId: string): RenderJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): RenderJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Process the actual export
   */
  private async processExport(
    project: VideoProject,
    settings: ExportSettings,
    jobId: string,
    totalFrames: number
  ): Promise<string> {
    const job = this.activeJobs.get(jobId);
    if (!job) throw new Error('Job not found');

    // Simulate export process
    // In a real implementation, this would use FFmpeg or similar
    
    const startTime = Date.now();
    let currentFrame = 0;
    
    while (currentFrame < totalFrames && job.status === 'processing') {
      // Simulate frame processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      currentFrame++;
      const progress = (currentFrame / totalFrames) * 100;
      
      // Update job progress
      job.progress = progress;
      
      // Calculate metrics
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = currentFrame / elapsed;
      const timeRemaining = (totalFrames - currentFrame) / speed;
      
      // Notify progress callback
      const callback = this.progressCallbacks.get(jobId);
      if (callback) {
        callback({
          progress,
          currentFrame,
          totalFrames,
          timeRemaining,
          speed
        });
      }
    }

    // Generate output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = settings.outputPath || `${project.name}_${timestamp}.${settings.format}`;
    
    return outputPath;
  }

  /**
   * Get export presets
   */
  getExportPresets(): Record<string, ExportSettings> {
    return {
      'youtube-1080p': {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        width: 1920,
        height: 1080,
        frameRate: 30,
        bitrate: 8000,
        audioCodec: 'aac',
        audioBitrate: 128,
        outputPath: ''
      },
      'youtube-720p': {
        format: 'mp4',
        codec: 'h264',
        quality: 'medium',
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrate: 5000,
        audioCodec: 'aac',
        audioBitrate: 128,
        outputPath: ''
      },
      'instagram-square': {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        width: 1080,
        height: 1080,
        frameRate: 30,
        bitrate: 6000,
        audioCodec: 'aac',
        audioBitrate: 128,
        outputPath: ''
      },
      'tiktok-vertical': {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        width: 1080,
        height: 1920,
        frameRate: 30,
        bitrate: 6000,
        audioCodec: 'aac',
        audioBitrate: 128,
        outputPath: ''
      },
      'web-optimized': {
        format: 'webm',
        codec: 'vp9',
        quality: 'medium',
        width: 1920,
        height: 1080,
        frameRate: 30,
        bitrate: 4000,
        audioCodec: 'opus',
        audioBitrate: 128,
        outputPath: ''
      },
      'high-quality': {
        format: 'mov',
        codec: 'prores',
        quality: 'high',
        frameRate: 30,
        bitrate: 50000,
        audioCodec: 'pcm',
        audioBitrate: 1536,
        outputPath: ''
      }
    };
  }

  /**
   * Validate export settings
   */
  validateSettings(settings: ExportSettings): string[] {
    const errors: string[] = [];

    if (!settings.format) {
      errors.push('Export format is required');
    }

    if (!settings.codec) {
      errors.push('Video codec is required');
    }

    if (!settings.audioCodec) {
      errors.push('Audio codec is required');
    }

    if (settings.width && settings.width < 1) {
      errors.push('Width must be greater than 0');
    }

    if (settings.height && settings.height < 1) {
      errors.push('Height must be greater than 0');
    }

    if (settings.frameRate && settings.frameRate < 1) {
      errors.push('Frame rate must be greater than 0');
    }

    if (settings.bitrate && settings.bitrate < 1) {
      errors.push('Bitrate must be greater than 0');
    }

    if (settings.audioBitrate && settings.audioBitrate < 1) {
      errors.push('Audio bitrate must be greater than 0');
    }

    return errors;
  }

  /**
   * Estimate export file size
   */
  estimateFileSize(project: VideoProject, settings: ExportSettings): number {
    const duration = project.settings.duration; // seconds
    const videoBitrate = settings.bitrate || 5000; // kbps
    const audioBitrate = settings.audioBitrate || 128; // kbps
    
    // Calculate size in bytes
    const videoSize = (videoBitrate * 1000 * duration) / 8; // bits to bytes
    const audioSize = (audioBitrate * 1000 * duration) / 8; // bits to bytes
    
    return videoSize + audioSize;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): Array<{ value: string; label: string; extension: string }> {
    return [
      { value: 'mp4', label: 'MP4 (H.264)', extension: '.mp4' },
      { value: 'mov', label: 'QuickTime (MOV)', extension: '.mov' },
      { value: 'webm', label: 'WebM (VP9)', extension: '.webm' },
      { value: 'avi', label: 'AVI', extension: '.avi' }
    ];
  }

  /**
   * Get supported codecs for a format
   */
  getSupportedCodecs(format: string): Array<{ value: string; label: string }> {
    const codecMap: Record<string, Array<{ value: string; label: string }>> = {
      mp4: [
        { value: 'h264', label: 'H.264 (AVC)' },
        { value: 'h265', label: 'H.265 (HEVC)' }
      ],
      mov: [
        { value: 'h264', label: 'H.264 (AVC)' },
        { value: 'prores', label: 'Apple ProRes' }
      ],
      webm: [
        { value: 'vp8', label: 'VP8' },
        { value: 'vp9', label: 'VP9' }
      ],
      avi: [
        { value: 'h264', label: 'H.264 (AVC)' },
        { value: 'xvid', label: 'Xvid' }
      ]
    };

    return codecMap[format] || [];
  }

  /**
   * Clean up completed jobs
   */
  cleanup(): void {
    const completedJobs = Array.from(this.activeJobs.entries())
      .filter(([_, job]) => job.status === 'completed' || job.status === 'error');
    
    completedJobs.forEach(([jobId]) => {
      this.activeJobs.delete(jobId);
      this.progressCallbacks.delete(jobId);
    });
  }
}
