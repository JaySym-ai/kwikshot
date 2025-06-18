// Enhanced Export Service - Optimized file exports with compression
// Built using AugmentCode tool - www.augmentcode.com

import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import React from 'react';
import CompressionService, { CompressionResult } from './CompressionService';

export interface ExportOptions {
  filename?: string;
  compress?: boolean;
  compressionLevel?: number;
  format?: 'csv' | 'json' | 'pdf' | 'txt' | 'zip';
  includeMetadata?: boolean;
  autoDownload?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  originalSize: number;
  finalSize: number;
  compressionRatio?: number;
  downloadUrl?: string;
  error?: string;
}

export interface CSVExportOptions extends ExportOptions {
  delimiter?: string;
  header?: boolean;
  quotes?: boolean;
  encoding?: string;
}

export interface PDFExportOptions extends ExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
  },
  metadata: {
    fontSize: 8,
    color: '#666666',
    marginTop: 20,
    borderTop: '1px solid #cccccc',
    paddingTop: 10,
  },
});

export class ExportService {
  private static instance: ExportService;
  private compressionService: CompressionService;

  private constructor() {
    this.compressionService = CompressionService.getInstance();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export data as CSV with optional compression
   */
  async exportCSV(
    data: any[],
    options: CSVExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const filename = options.filename || `export_${Date.now()}.csv`;
      
      // Generate CSV content
      const csvContent = Papa.unparse(data, {
        delimiter: options.delimiter || ',',
        header: options.header !== false,
        quotes: options.quotes !== false,
        encoding: options.encoding || 'utf-8',
      });

      const originalSize = new Blob([csvContent]).size;
      let finalData: string | Uint8Array = csvContent;
      let finalSize = originalSize;
      let compressionRatio: number | undefined;

      // Apply compression if requested
      if (options.compress) {
        const compressionLevel = options.compressionLevel || 
          this.compressionService.getOptimalCompressionLevel(originalSize, 'csv');
        
        const compressionResult = await this.compressionService.compressText(
          csvContent, 
          { level: compressionLevel }
        );
        
        finalData = compressionResult.compressedData;
        finalSize = compressionResult.compressedSize;
        compressionRatio = compressionResult.compressionRatio;
      }

      // Create and download file
      if (options.autoDownload !== false) {
        const blob = new Blob([finalData], { 
          type: options.compress ? 'application/gzip' : 'text/csv;charset=utf-8;' 
        });
        const finalFilename = options.compress ? `${filename}.gz` : filename;
        saveAs(blob, finalFilename);
      }

      return {
        success: true,
        filename: options.compress ? `${filename}.gz` : filename,
        originalSize,
        finalSize,
        compressionRatio,
      };
    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'export.csv',
        originalSize: 0,
        finalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export data as JSON with optional compression
   */
  async exportJSON(
    data: any,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const filename = options.filename || `export_${Date.now()}.json`;
      
      // Add metadata if requested
      const exportData = options.includeMetadata ? {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'KwikShot',
          version: '1.0.0',
        },
        data,
      } : data;

      const jsonContent = JSON.stringify(exportData, null, 2);
      const originalSize = new Blob([jsonContent]).size;
      let finalData: string | Uint8Array = jsonContent;
      let finalSize = originalSize;
      let compressionRatio: number | undefined;

      // Apply compression if requested
      if (options.compress) {
        const compressionLevel = options.compressionLevel || 
          this.compressionService.getOptimalCompressionLevel(originalSize, 'json');
        
        const compressionResult = await this.compressionService.compressText(
          jsonContent, 
          { level: compressionLevel }
        );
        
        finalData = compressionResult.compressedData;
        finalSize = compressionResult.compressedSize;
        compressionRatio = compressionResult.compressionRatio;
      }

      // Create and download file
      if (options.autoDownload !== false) {
        const blob = new Blob([finalData], { 
          type: options.compress ? 'application/gzip' : 'application/json' 
        });
        const finalFilename = options.compress ? `${filename}.gz` : filename;
        saveAs(blob, finalFilename);
      }

      return {
        success: true,
        filename: options.compress ? `${filename}.gz` : filename,
        originalSize,
        finalSize,
        compressionRatio,
      };
    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'export.json',
        originalSize: 0,
        finalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export data as PDF with compression
   */
  async exportPDF(
    data: any,
    options: PDFExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const filename = options.filename || `export_${Date.now()}.pdf`;
      
      // Create PDF document
      const PDFDocument = () => React.createElement(Document, {
        title: options.title || 'Export Report',
        author: options.author || 'KwikShot',
        subject: options.subject || 'Data Export',
        creator: options.creator || 'KwikShot Export Service',
      }, [
        React.createElement(Page, {
          key: 'page1',
          size: options.pageSize || 'A4',
          orientation: options.orientation || 'portrait',
          style: pdfStyles.page,
        }, [
          React.createElement(Text, { key: 'title', style: pdfStyles.title }, 
            options.title || 'Export Report'
          ),
          React.createElement(Text, { key: 'content', style: pdfStyles.text }, 
            typeof data === 'string' ? data : JSON.stringify(data, null, 2)
          ),
          options.includeMetadata && React.createElement(View, { key: 'metadata', style: pdfStyles.metadata }, [
            React.createElement(Text, { key: 'meta-title', style: pdfStyles.subtitle }, 'Export Metadata'),
            React.createElement(Text, { key: 'meta-date' }, `Exported: ${new Date().toLocaleString()}`),
            React.createElement(Text, { key: 'meta-app' }, 'Generated by KwikShot'),
          ]),
        ])
      ]);

      // Generate PDF blob
      const pdfBlob = await pdf(React.createElement(PDFDocument)).toBlob();
      const originalSize = pdfBlob.size;
      let finalSize = originalSize;
      let compressionRatio: number | undefined;

      // Note: PDFs are already compressed by react-pdf
      // Additional compression would require different approach

      // Create and download file
      if (options.autoDownload !== false) {
        saveAs(pdfBlob, filename);
      }

      return {
        success: true,
        filename,
        originalSize,
        finalSize,
        compressionRatio,
      };
    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'export.pdf',
        originalSize: 0,
        finalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create compressed archive with multiple files
   */
  async exportZip(
    files: Array<{ name: string; data: any; type?: string }>,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const filename = options.filename || `archive_${Date.now()}.zip`;
      
      // Prepare files for compression
      const zipFiles = files.map(file => ({
        name: file.name,
        data: typeof file.data === 'string' ? file.data : JSON.stringify(file.data, null, 2),
      }));

      // Calculate original size
      const originalSize = zipFiles.reduce((total, file) => 
        total + new Blob([file.data]).size, 0
      );

      // Create compressed archive
      const zipData = await this.compressionService.createZipArchive(
        zipFiles,
        { level: options.compressionLevel || 6 }
      );

      const finalSize = zipData.length;
      const compressionRatio = originalSize > 0 ? finalSize / originalSize : 0;

      // Create and download file
      if (options.autoDownload !== false) {
        const blob = new Blob([zipData], { type: 'application/zip' });
        saveAs(blob, filename);
      }

      return {
        success: true,
        filename,
        originalSize,
        finalSize,
        compressionRatio,
      };
    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'archive.zip',
        originalSize: 0,
        finalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-detect best export format and compression settings
   */
  async smartExport(
    data: any,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const dataSize = JSON.stringify(data).length;
    const format = options.format || this.detectOptimalFormat(data, dataSize);
    
    // Auto-enable compression for larger files
    const shouldCompress = options.compress !== false && dataSize > 1024 * 50; // > 50KB
    
    const exportOptions = {
      ...options,
      compress: shouldCompress,
      compressionLevel: options.compressionLevel || 
        this.compressionService.getOptimalCompressionLevel(dataSize, format),
    };

    switch (format) {
      case 'csv':
        return this.exportCSV(data, exportOptions);
      case 'pdf':
        return this.exportPDF(data, exportOptions);
      case 'zip':
        return this.exportZip([{ name: 'data.json', data }], exportOptions);
      default:
        return this.exportJSON(data, exportOptions);
    }
  }

  /**
   * Detect optimal export format based on data structure
   */
  private detectOptimalFormat(data: any, size: number): string {
    // For large datasets, prefer CSV if it's tabular
    if (size > 1024 * 1024 && Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        return 'csv';
      }
    }
    
    // For very large data, use ZIP
    if (size > 1024 * 1024 * 10) { // > 10MB
      return 'zip';
    }
    
    // Default to JSON for structured data
    return 'json';
  }

  /**
   * Get export statistics and recommendations
   */
  getExportRecommendations(data: any): {
    estimatedSize: number;
    recommendedFormat: string;
    shouldCompress: boolean;
    estimatedCompressionRatio: number;
  } {
    const jsonString = JSON.stringify(data);
    const estimatedSize = new Blob([jsonString]).size;
    const recommendedFormat = this.detectOptimalFormat(data, estimatedSize);
    const shouldCompress = estimatedSize > 1024 * 50;
    
    // Estimate compression ratio based on data type
    let estimatedCompressionRatio = 0.7; // Default 30% reduction
    
    if (typeof data === 'string' || (Array.isArray(data) && data.every(item => typeof item === 'string'))) {
      estimatedCompressionRatio = 0.4; // Text compresses well
    } else if (Array.isArray(data) && data.length > 100) {
      estimatedCompressionRatio = 0.6; // Repetitive data compresses well
    }

    return {
      estimatedSize,
      recommendedFormat,
      shouldCompress,
      estimatedCompressionRatio,
    };
  }
}

export default ExportService;
