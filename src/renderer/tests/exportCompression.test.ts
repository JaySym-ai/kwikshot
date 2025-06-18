// Export and Compression Tests
// Built using AugmentCode tool - www.augmentcode.com

import CompressionService from '../services/CompressionService';
import ExportService from '../services/ExportService';
import FileUtils from '../utils/fileUtils';

// Mock file-saver for testing
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Mock @react-pdf/renderer for testing
jest.mock('@react-pdf/renderer', () => ({
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  pdf: () => ({
    toBlob: () => Promise.resolve(new Blob(['mock pdf'], { type: 'application/pdf' })),
  }),
}));

describe('CompressionService', () => {
  let compressionService: CompressionService;

  beforeEach(() => {
    compressionService = CompressionService.getInstance();
  });

  describe('Text Compression', () => {
    test('should compress text data successfully', async () => {
      const testText = 'This is a test string that should compress well when repeated. '.repeat(100);
      
      const result = await compressionService.compressText(testText, { level: 6 });
      
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeLessThan(1);
      expect(result.compressionTime).toBeGreaterThan(0);
    });

    test('should decompress text data correctly', async () => {
      const testText = 'Hello, World!';
      
      const compressed = await compressionService.compressText(testText);
      const decompressed = await compressionService.decompressText(compressed.compressedData);
      
      expect(decompressed).toBe(testText);
    });
  });

  describe('Binary Compression', () => {
    test('should compress binary data successfully', async () => {
      const testData = new Uint8Array(1000).fill(42); // Repetitive data compresses well
      
      const result = await compressionService.compressBinary(testData, { level: 6 });
      
      expect(result.originalSize).toBe(1000);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeLessThan(1);
    });

    test('should decompress binary data correctly', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      
      const compressed = await compressionService.compressBinary(testData);
      const decompressed = await compressionService.decompressBinary(compressed.compressedData);
      
      expect(Array.from(decompressed)).toEqual(Array.from(testData));
    });
  });

  describe('ZIP Archive Creation', () => {
    test('should create ZIP archive with multiple files', async () => {
      const files = [
        { name: 'file1.txt', data: 'Content of file 1' },
        { name: 'file2.txt', data: 'Content of file 2' },
        { name: 'subfolder/file3.txt', data: 'Content of file 3', folder: 'subfolder' },
      ];
      
      const zipData = await compressionService.createZipArchive(files, { level: 6 });
      
      expect(zipData).toBeInstanceOf(Uint8Array);
      expect(zipData.length).toBeGreaterThan(0);
    });
  });

  describe('Compression Level Optimization', () => {
    test('should return appropriate compression level for different file sizes', () => {
      expect(compressionService.getOptimalCompressionLevel(1024 * 50, 'json')).toBe(9); // Small file
      expect(compressionService.getOptimalCompressionLevel(1024 * 1024 * 5, 'json')).toBe(6); // Medium file
      expect(compressionService.getOptimalCompressionLevel(1024 * 1024 * 50, 'json')).toBe(3); // Large file
      expect(compressionService.getOptimalCompressionLevel(1024 * 1024 * 200, 'json')).toBe(1); // Very large file
    });
  });

  describe('Compression Statistics', () => {
    test('should format compression statistics correctly', async () => {
      const testText = 'Test data for compression statistics';
      const result = await compressionService.compressText(testText);
      
      const stats = compressionService.formatCompressionStats(result);
      
      expect(stats).toContain('Compressed');
      expect(stats).toContain('to');
      expect(stats).toContain('saved');
      expect(stats).toContain('ms');
    });
  });
});

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = ExportService.getInstance();
  });

  describe('JSON Export', () => {
    test('should export JSON data successfully', async () => {
      const testData = { name: 'Test', value: 123, items: [1, 2, 3] };
      
      const result = await exportService.exportJSON(testData, {
        filename: 'test.json',
        autoDownload: false,
      });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.json');
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.finalSize).toBeGreaterThan(0);
    });

    test('should export JSON with compression', async () => {
      const testData = { data: 'x'.repeat(1000) }; // Large repetitive data
      
      const result = await exportService.exportJSON(testData, {
        filename: 'test.json',
        compress: true,
        compressionLevel: 6,
        autoDownload: false,
      });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.json.gz');
      expect(result.compressionRatio).toBeLessThan(1);
    });
  });

  describe('CSV Export', () => {
    test('should export CSV data successfully', async () => {
      const testData = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
        { name: 'Bob', age: 35, city: 'Chicago' },
      ];
      
      const result = await exportService.exportCSV(testData, {
        filename: 'test.csv',
        autoDownload: false,
      });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.csv');
      expect(result.originalSize).toBeGreaterThan(0);
    });
  });

  describe('ZIP Export', () => {
    test('should create ZIP export successfully', async () => {
      const files = [
        { name: 'data.json', data: { test: 'data' } },
        { name: 'info.txt', data: 'Information file' },
      ];
      
      const result = await exportService.exportZip(files, {
        filename: 'archive.zip',
        autoDownload: false,
      });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('archive.zip');
      expect(result.compressionRatio).toBeLessThan(1);
    });
  });

  describe('Smart Export', () => {
    test('should automatically select appropriate format', async () => {
      const smallData = { test: 'small data' };
      
      const result = await exportService.smartExport(smallData, {
        filename: 'auto_export',
        autoDownload: false,
      });
      
      expect(result.success).toBe(true);
      expect(result.filename).toContain('auto_export');
    });
  });

  describe('Export Recommendations', () => {
    test('should provide appropriate recommendations', () => {
      const testData = [{ id: 1, name: 'Test' }];
      
      const recommendations = exportService.getExportRecommendations(testData);
      
      expect(recommendations.estimatedSize).toBeGreaterThan(0);
      expect(recommendations.recommendedFormat).toBeDefined();
      expect(typeof recommendations.shouldCompress).toBe('boolean');
      expect(recommendations.estimatedCompressionRatio).toBeGreaterThan(0);
    });
  });
});

describe('FileUtils', () => {
  describe('File Size Formatting', () => {
    test('should format file sizes correctly', () => {
      expect(FileUtils.formatFileSize(0).formatted).toBe('0 B');
      expect(FileUtils.formatFileSize(1024).formatted).toBe('1.0 KB');
      expect(FileUtils.formatFileSize(1024 * 1024).formatted).toBe('1.0 MB');
      expect(FileUtils.formatFileSize(1024 * 1024 * 1024).formatted).toBe('1.0 GB');
    });

    test('should return correct size info object', () => {
      const sizeInfo = FileUtils.formatFileSize(1536); // 1.5 KB
      
      expect(sizeInfo.bytes).toBe(1536);
      expect(sizeInfo.value).toBe(1.5);
      expect(sizeInfo.unit).toBe('KB');
      expect(sizeInfo.formatted).toBe('1.5 KB');
    });
  });

  describe('File Extension Handling', () => {
    test('should extract file extensions correctly', () => {
      expect(FileUtils.getFileExtension('test.json')).toBe('json');
      expect(FileUtils.getFileExtension('archive.tar.gz')).toBe('gz');
      expect(FileUtils.getFileExtension('noextension')).toBe('');
      expect(FileUtils.getFileExtension('.hidden')).toBe('');
    });

    test('should get filename without extension', () => {
      expect(FileUtils.getFileNameWithoutExtension('test.json')).toBe('test');
      expect(FileUtils.getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
      expect(FileUtils.getFileNameWithoutExtension('noextension')).toBe('noextension');
    });
  });

  describe('MIME Type Detection', () => {
    test('should return correct MIME types', () => {
      expect(FileUtils.getMimeTypeFromExtension('json')).toBe('application/json');
      expect(FileUtils.getMimeTypeFromExtension('csv')).toBe('text/csv');
      expect(FileUtils.getMimeTypeFromExtension('pdf')).toBe('application/pdf');
      expect(FileUtils.getMimeTypeFromExtension('zip')).toBe('application/zip');
      expect(FileUtils.getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
    });
  });

  describe('File Type Detection', () => {
    test('should detect text files correctly', () => {
      expect(FileUtils.isTextFile('document.txt')).toBe(true);
      expect(FileUtils.isTextFile('data.json')).toBe(true);
      expect(FileUtils.isTextFile('script.js')).toBe(true);
      expect(FileUtils.isTextFile('image.jpg')).toBe(false);
    });

    test('should detect image files correctly', () => {
      expect(FileUtils.isImageFile('photo.jpg')).toBe(true);
      expect(FileUtils.isImageFile('icon.png')).toBe(true);
      expect(FileUtils.isImageFile('document.pdf')).toBe(false);
    });

    test('should detect video files correctly', () => {
      expect(FileUtils.isVideoFile('movie.mp4')).toBe(true);
      expect(FileUtils.isVideoFile('clip.avi')).toBe(true);
      expect(FileUtils.isVideoFile('audio.mp3')).toBe(false);
    });
  });

  describe('Filename Sanitization', () => {
    test('should sanitize filenames correctly', () => {
      expect(FileUtils.sanitizeFilename('test<>file')).toBe('test__file');
      expect(FileUtils.sanitizeFilename('file with spaces')).toBe('file_with_spaces');
      expect(FileUtils.sanitizeFilename('___multiple___underscores___')).toBe('multiple_underscores');
    });
  });

  describe('Compression Estimation', () => {
    test('should estimate compression ratios correctly', () => {
      expect(FileUtils.estimateCompressionRatio('document.txt', 1000)).toBe(0.3); // Text compresses well
      expect(FileUtils.estimateCompressionRatio('image.jpg', 1000)).toBe(0.95); // Already compressed
      expect(FileUtils.estimateCompressionRatio('audio.wav', 1000)).toBe(0.6); // Raw format
    });
  });
});

// Integration test
describe('Export and Compression Integration', () => {
  test('should work together seamlessly', async () => {
    const exportService = ExportService.getInstance();
    const testData = {
      project: 'Test Project',
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      })),
    };

    const result = await exportService.smartExport(testData, {
      filename: 'integration_test',
      autoDownload: false,
    });

    expect(result.success).toBe(true);
    expect(result.originalSize).toBeGreaterThan(0);
    expect(result.finalSize).toBeGreaterThan(0);
    
    if (result.compressionRatio) {
      expect(result.compressionRatio).toBeLessThan(1);
    }
  });
});
