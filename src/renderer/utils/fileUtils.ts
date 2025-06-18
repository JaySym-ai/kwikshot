// File Utilities - Helper functions for file operations and optimization
// Built using AugmentCode tool - www.augmentcode.com

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified?: number;
}

export interface FileSizeInfo {
  bytes: number;
  formatted: string;
  unit: string;
  value: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: FileInfo;
}

export class FileUtils {
  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number, decimals: number = 2): FileSizeInfo {
    if (bytes === 0) {
      return { bytes: 0, formatted: '0 B', unit: 'B', value: 0 };
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return {
      bytes,
      formatted: `${value} ${sizes[i]}`,
      unit: sizes[i],
      value,
    };
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Get file name without extension
   */
  static getFileNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  }

  /**
   * Generate unique filename with timestamp
   */
  static generateUniqueFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nameWithoutExt = this.getFileNameWithoutExtension(baseName);
    return `${nameWithoutExt}_${timestamp}.${extension}`;
  }

  /**
   * Validate file based on type and size constraints
   */
  static validateFile(
    file: File,
    options: {
      allowedTypes?: string[];
      maxSize?: number; // in bytes
      minSize?: number; // in bytes
      allowedExtensions?: string[];
    } = {}
  ): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const fileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: this.getFileExtension(file.name),
      lastModified: file.lastModified,
    };

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size).formatted}) exceeds maximum allowed size (${this.formatFileSize(options.maxSize).formatted})`);
    }

    if (options.minSize && file.size < options.minSize) {
      errors.push(`File size (${this.formatFileSize(file.size).formatted}) is below minimum required size (${this.formatFileSize(options.minSize).formatted})`);
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.includes(file.type)) {
        errors.push(`File type "${file.type}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }

    // Check file extension
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const extension = this.getFileExtension(file.name);
      if (!options.allowedExtensions.includes(extension)) {
        errors.push(`File extension ".${extension}" is not allowed. Allowed extensions: ${options.allowedExtensions.map(ext => `.${ext}`).join(', ')}`);
      }
    }

    // Add warnings for large files
    if (file.size > 100 * 1024 * 1024) { // > 100MB
      warnings.push('Large file detected. Processing may take longer than usual.');
    }

    // Add warnings for empty files
    if (file.size === 0) {
      warnings.push('File appears to be empty.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo,
    };
  }

  /**
   * Convert file to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert file to array buffer
   */
  static async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert file to text
   */
  static async fileToText(file: File, encoding: string = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to text'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file, encoding);
    });
  }

  /**
   * Create a download link for data
   */
  static createDownloadLink(
    data: string | Uint8Array | Blob,
    filename: string,
    mimeType?: string
  ): string {
    let blob: Blob;
    
    if (data instanceof Blob) {
      blob = data;
    } else if (data instanceof Uint8Array) {
      blob = new Blob([data], { type: mimeType || 'application/octet-stream' });
    } else {
      blob = new Blob([data], { type: mimeType || 'text/plain' });
    }

    return URL.createObjectURL(blob);
  }

  /**
   * Download data as file
   */
  static downloadFile(
    data: string | Uint8Array | Blob,
    filename: string,
    mimeType?: string
  ): void {
    const url = this.createDownloadLink(data, filename, mimeType);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get MIME type from file extension
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Text
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if file is text-based
   */
  static isTextFile(filename: string): boolean {
    const textExtensions = [
      'txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx',
      'md', 'yml', 'yaml', 'ini', 'cfg', 'conf', 'log', 'sql', 'py', 'java',
      'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'
    ];
    
    const extension = this.getFileExtension(filename);
    return textExtensions.includes(extension);
  }

  /**
   * Check if file is an image
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const extension = this.getFileExtension(filename);
    return imageExtensions.includes(extension);
  }

  /**
   * Check if file is a video
   */
  static isVideoFile(filename: string): boolean {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'ogv'];
    const extension = this.getFileExtension(filename);
    return videoExtensions.includes(extension);
  }

  /**
   * Check if file is an audio file
   */
  static isAudioFile(filename: string): boolean {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
    const extension = this.getFileExtension(filename);
    return audioExtensions.includes(extension);
  }

  /**
   * Sanitize filename for safe file system usage
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length to 255 characters
  }

  /**
   * Calculate compression potential for a file
   */
  static estimateCompressionRatio(filename: string, size: number): number {
    const extension = this.getFileExtension(filename);
    
    // Text files compress very well
    if (this.isTextFile(filename)) {
      return 0.3; // 70% reduction
    }
    
    // Already compressed formats
    const compressedFormats = ['jpg', 'jpeg', 'png', 'mp3', 'mp4', 'zip', 'rar', '7z', 'gz'];
    if (compressedFormats.includes(extension)) {
      return 0.95; // 5% reduction
    }
    
    // Raw formats compress moderately
    const rawFormats = ['bmp', 'wav', 'avi'];
    if (rawFormats.includes(extension)) {
      return 0.6; // 40% reduction
    }
    
    // Default estimation
    return 0.7; // 30% reduction
  }
}

export default FileUtils;
