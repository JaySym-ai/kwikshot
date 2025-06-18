// Compression Service - High-performance file compression and optimization
// Built using AugmentCode tool - www.augmentcode.com

import { gzip, gunzip, deflate, inflate, strToU8, strFromU8, AsyncGzipOptions } from 'fflate';
import JSZip from 'jszip';

export interface CompressionOptions {
  level?: number; // 0-9, higher = better compression but slower
  strategy?: number; // Compression strategy
  windowBits?: number; // Window size for deflate
  memLevel?: number; // Memory usage level
}

export interface CompressionResult {
  compressedData: Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
}

export interface FileCompressionOptions extends CompressionOptions {
  format?: 'gzip' | 'deflate' | 'zip';
  filename?: string;
}

export class CompressionService {
  private static instance: CompressionService;

  private constructor() {}

  static getInstance(): CompressionService {
    if (!CompressionService.instance) {
      CompressionService.instance = new CompressionService();
    }
    return CompressionService.instance;
  }

  /**
   * Compress text data using gzip
   */
  async compressText(
    text: string, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    const originalData = strToU8(text);
    const originalSize = originalData.length;

    const gzipOptions: AsyncGzipOptions = {
      level: options.level || 6,
      mem: options.memLevel || 8,
    };

    return new Promise((resolve, reject) => {
      gzip(originalData, gzipOptions, (err, compressed) => {
        if (err) {
          reject(new Error(`Compression failed: ${err.message}`));
          return;
        }

        const compressionTime = performance.now() - startTime;
        const compressedSize = compressed.length;
        const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 0;

        resolve({
          compressedData: compressed,
          originalSize,
          compressedSize,
          compressionRatio,
          compressionTime,
        });
      });
    });
  }

  /**
   * Decompress gzip data back to text
   */
  async decompressText(compressedData: Uint8Array): Promise<string> {
    return new Promise((resolve, reject) => {
      gunzip(compressedData, (err, decompressed) => {
        if (err) {
          reject(new Error(`Decompression failed: ${err.message}`));
          return;
        }

        try {
          const text = strFromU8(decompressed);
          resolve(text);
        } catch (error) {
          reject(new Error(`Failed to convert decompressed data to text: ${error}`));
        }
      });
    });
  }

  /**
   * Compress binary data using deflate
   */
  async compressBinary(
    data: Uint8Array, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    const originalSize = data.length;

    return new Promise((resolve, reject) => {
      deflate(data, { level: options.level || 6 }, (err, compressed) => {
        if (err) {
          reject(new Error(`Binary compression failed: ${err.message}`));
          return;
        }

        const compressionTime = performance.now() - startTime;
        const compressedSize = compressed.length;
        const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 0;

        resolve({
          compressedData: compressed,
          originalSize,
          compressedSize,
          compressionRatio,
          compressionTime,
        });
      });
    });
  }

  /**
   * Decompress binary data
   */
  async decompressBinary(compressedData: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      inflate(compressedData, (err, decompressed) => {
        if (err) {
          reject(new Error(`Binary decompression failed: ${err.message}`));
          return;
        }
        resolve(decompressed);
      });
    });
  }

  /**
   * Create a compressed ZIP archive with multiple files
   */
  async createZipArchive(
    files: Array<{ name: string; data: string | Uint8Array; folder?: string }>,
    options: CompressionOptions = {}
  ): Promise<Uint8Array> {
    const zip = new JSZip();
    const compressionLevel = options.level || 6;

    // Add files to zip
    for (const file of files) {
      const folder = file.folder ? zip.folder(file.folder) : zip;
      if (!folder) {
        throw new Error(`Failed to create folder: ${file.folder}`);
      }
      
      folder.file(file.name, file.data, {
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel },
      });
    }

    // Generate zip file
    try {
      const zipData = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel },
      });

      return zipData;
    } catch (error) {
      throw new Error(`Failed to create ZIP archive: ${error}`);
    }
  }

  /**
   * Compress a file with automatic format detection
   */
  async compressFile(
    data: string | Uint8Array,
    options: FileCompressionOptions = {}
  ): Promise<CompressionResult> {
    const format = options.format || 'gzip';

    switch (format) {
      case 'gzip':
        if (typeof data === 'string') {
          return this.compressText(data, options);
        } else {
          // For binary data, convert to gzip
          const startTime = performance.now();
          const originalSize = data.length;

          return new Promise((resolve, reject) => {
            gzip(data, { level: options.level || 6 }, (err, compressed) => {
              if (err) {
                reject(new Error(`File compression failed: ${err.message}`));
                return;
              }

              const compressionTime = performance.now() - startTime;
              const compressedSize = compressed.length;
              const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 0;

              resolve({
                compressedData: compressed,
                originalSize,
                compressedSize,
                compressionRatio,
                compressionTime,
              });
            });
          });
        }

      case 'deflate':
        const binaryData = typeof data === 'string' ? strToU8(data) : data;
        return this.compressBinary(binaryData, options);

      case 'zip':
        const filename = options.filename || 'file.txt';
        const zipData = await this.createZipArchive([{ name: filename, data }], options);
        const originalSize = typeof data === 'string' ? strToU8(data).length : data.length;
        
        return {
          compressedData: zipData,
          originalSize,
          compressedSize: zipData.length,
          compressionRatio: originalSize > 0 ? zipData.length / originalSize : 0,
          compressionTime: 0, // Time is included in createZipArchive
        };

      default:
        throw new Error(`Unsupported compression format: ${format}`);
    }
  }

  /**
   * Get optimal compression level based on file size and type
   */
  getOptimalCompressionLevel(fileSize: number, fileType: string): number {
    // For small files, use higher compression
    if (fileSize < 1024 * 100) { // < 100KB
      return 9;
    }
    
    // For medium files, balance speed and compression
    if (fileSize < 1024 * 1024 * 10) { // < 10MB
      return 6;
    }
    
    // For large files, prioritize speed
    if (fileSize < 1024 * 1024 * 100) { // < 100MB
      return 3;
    }
    
    // For very large files, use minimal compression
    return 1;
  }

  /**
   * Format compression statistics for display
   */
  formatCompressionStats(result: CompressionResult): string {
    const ratio = (result.compressionRatio * 100).toFixed(1);
    const savedBytes = result.originalSize - result.compressedSize;
    const savedPercentage = ((savedBytes / result.originalSize) * 100).toFixed(1);
    
    return `Compressed ${this.formatBytes(result.originalSize)} to ${this.formatBytes(result.compressedSize)} ` +
           `(${ratio}% of original, ${savedPercentage}% saved) in ${result.compressionTime.toFixed(2)}ms`;
  }

  /**
   * Format bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
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
   * Test compression performance with different levels
   */
  async benchmarkCompression(
    data: string | Uint8Array,
    levels: number[] = [1, 3, 6, 9]
  ): Promise<Array<CompressionResult & { level: number }>> {
    const results = [];
    
    for (const level of levels) {
      const result = await this.compressFile(data, { level });
      results.push({ ...result, level });
    }
    
    return results;
  }
}

export default CompressionService;
