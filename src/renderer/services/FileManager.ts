import { RecordingSettings } from '../stores/recordingStore';

export interface RecordingFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  duration: number;
  createdAt: Date;
  settings: RecordingSettings;
  thumbnail?: string;
  metadata: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    hasAudio: boolean;
    hasCamera: boolean;
  };
}

export interface SaveOptions {
  filename?: string;
  folder?: string;
  generateThumbnail?: boolean;
  autoOpen?: boolean;
}

export class FileManager {
  private static instance: FileManager;
  private recordings: RecordingFile[] = [];

  private constructor() {
    this.loadRecordingHistory();
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  /**
   * Save a recording blob to file
   */
  async saveRecording(
    blob: Blob,
    settings: RecordingSettings,
    duration: number,
    options: SaveOptions = {}
  ): Promise<RecordingFile> {
    try {
      const timestamp = new Date();
      const filename = options.filename || this.generateFilename(timestamp, settings);
      const folder = options.folder || await this.getDefaultRecordingFolder();
      
      // Create the recording file object
      const recordingFile: RecordingFile = {
        id: this.generateId(),
        filename,
        path: `${folder}/${filename}`,
        size: blob.size,
        duration,
        createdAt: timestamp,
        settings,
        metadata: {
          resolution: settings.quality.resolution === 'custom' 
            ? `${settings.quality.customWidth}×${settings.quality.customHeight}`
            : settings.quality.resolution,
          frameRate: settings.quality.frameRate,
          bitrate: settings.quality.videoBitrate + settings.quality.audioBitrate,
          hasAudio: settings.includeSystemAudio || settings.includeMicrophone,
          hasCamera: settings.cameraEnabled,
        },
      };

      // Save the file using Electron's file system
      const success = await this.saveBlob(blob, recordingFile.path);
      
      if (!success) {
        throw new Error('Failed to save recording file');
      }

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        recordingFile.thumbnail = await this.generateThumbnail(blob);
      }

      // Add to recording history
      this.recordings.unshift(recordingFile);
      await this.saveRecordingHistory();

      // Open folder if requested
      if (options.autoOpen) {
        await this.openFolder(folder);
      }

      return recordingFile;
    } catch (error) {
      throw new Error(`Failed to save recording: ${error}`);
    }
  }

  /**
   * Get all recordings
   */
  getRecordings(): RecordingFile[] {
    return [...this.recordings];
  }

  /**
   * Get recording by ID
   */
  getRecording(id: string): RecordingFile | undefined {
    return this.recordings.find(recording => recording.id === id);
  }

  /**
   * Delete a recording
   */
  async deleteRecording(id: string): Promise<boolean> {
    const recording = this.getRecording(id);
    if (!recording) {
      return false;
    }

    try {
      // Delete the file
      await this.deleteFile(recording.path);
      
      // Remove from history
      this.recordings = this.recordings.filter(r => r.id !== id);
      await this.saveRecordingHistory();
      
      return true;
    } catch (error) {
      console.error('Failed to delete recording:', error);
      return false;
    }
  }

  /**
   * Open recording in default application
   */
  async openRecording(id: string): Promise<boolean> {
    const recording = this.getRecording(id);
    if (!recording) {
      return false;
    }

    try {
      return await this.openFile(recording.path);
    } catch (error) {
      console.error('Failed to open recording:', error);
      return false;
    }
  }

  /**
   * Open recording folder
   */
  async openRecordingFolder(id: string): Promise<boolean> {
    const recording = this.getRecording(id);
    if (!recording) {
      return false;
    }

    try {
      const folder = recording.path.substring(0, recording.path.lastIndexOf('/'));
      return await this.openFolder(folder);
    } catch (error) {
      console.error('Failed to open recording folder:', error);
      return false;
    }
  }

  /**
   * Get recording statistics
   */
  getStatistics() {
    const totalRecordings = this.recordings.length;
    const totalSize = this.recordings.reduce((sum, recording) => sum + recording.size, 0);
    const totalDuration = this.recordings.reduce((sum, recording) => sum + recording.duration, 0);
    const averageSize = totalRecordings > 0 ? totalSize / totalRecordings : 0;
    const averageDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;

    return {
      totalRecordings,
      totalSize,
      totalDuration,
      averageSize,
      averageDuration,
      oldestRecording: this.recordings[this.recordings.length - 1]?.createdAt,
      newestRecording: this.recordings[0]?.createdAt,
    };
  }

  /**
   * Clean up old recordings
   */
  async cleanupOldRecordings(maxAge: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    const oldRecordings = this.recordings.filter(
      recording => recording.createdAt < cutoffDate
    );

    let deletedCount = 0;
    for (const recording of oldRecordings) {
      const success = await this.deleteRecording(recording.id);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Generate a unique filename for the recording
   */
  private generateFilename(timestamp: Date, settings: RecordingSettings): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    const resolution = settings.quality.resolution === 'custom' 
      ? `${settings.quality.customWidth}x${settings.quality.customHeight}`
      : settings.quality.resolution;
    
    return `KwikShot_${dateStr}_${timeStr}_${resolution}.mp4`;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default recording folder from settings
   */
  private async getDefaultRecordingFolder(): Promise<string> {
    try {
      const settings = await window.electronAPI?.getSettings();
      return settings?.folders?.recordings || '~/Documents/KwikShot/Recordings';
    } catch (error) {
      return '~/Documents/KwikShot/Recordings';
    }
  }

  /**
   * Save blob to file using Electron API
   */
  private async saveBlob(blob: Blob, path: string): Promise<boolean> {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Save using Electron API
      return await window.electronAPI?.saveFile(uint8Array, path) || false;
    } catch (error) {
      console.error('Failed to save blob:', error);
      return false;
    }
  }

  /**
   * Generate thumbnail from video blob
   */
  private async generateThumbnail(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        
        video.currentTime = Math.min(5, video.duration / 2); // Seek to 5 seconds or middle
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Load recording history from storage
   */
  private async loadRecordingHistory(): Promise<void> {
    try {
      const settings = await window.electronAPI?.getSettings();
      this.recordings = settings?.recordingHistory || [];
    } catch (error) {
      console.error('Failed to load recording history:', error);
      this.recordings = [];
    }
  }

  /**
   * Save recording history to storage
   */
  private async saveRecordingHistory(): Promise<void> {
    try {
      const settings = await window.electronAPI?.getSettings() || {};
      settings.recordingHistory = this.recordings;
      await window.electronAPI?.saveSettings(settings);
    } catch (error) {
      console.error('Failed to save recording history:', error);
    }
  }

  /**
   * Delete file using Electron API
   */
  private async deleteFile(path: string): Promise<void> {
    // This would be implemented in the main process
    // For now, we'll just remove from history
    console.log('Would delete file:', path);
  }

  /**
   * Open file using Electron API
   */
  private async openFile(path: string): Promise<boolean> {
    try {
      return await window.electronAPI?.openFolder(path) || false;
    } catch (error) {
      console.error('Failed to open file:', error);
      return false;
    }
  }

  /**
   * Open folder using Electron API
   */
  private async openFolder(path: string): Promise<boolean> {
    try {
      return await window.electronAPI?.openFolder(path) || false;
    } catch (error) {
      console.error('Failed to open folder:', error);
      return false;
    }
  }
}
