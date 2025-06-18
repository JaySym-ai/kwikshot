// Enhanced Export Dialog - Optimized export with compression options
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Archive,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Zap,
  HardDrive,
  Clock
} from 'lucide-react';
import ExportService, { ExportOptions, ExportResult } from '../../services/ExportService';
import CompressionService from '../../services/CompressionService';
import FileUtils from '../../utils/fileUtils';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title?: string;
  defaultFilename?: string;
  allowedFormats?: Array<'csv' | 'json' | 'pdf' | 'txt' | 'zip'>;
  onExportComplete?: (result: ExportResult) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  title = 'Export Data',
  defaultFilename,
  allowedFormats = ['csv', 'json', 'pdf', 'zip'],
  onExportComplete,
}) => {
  const [filename, setFilename] = useState(defaultFilename || 'export');
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf' | 'txt' | 'zip'>(allowedFormats[0]);
  const [enableCompression, setEnableCompression] = useState(true);
  const [compressionLevel, setCompressionLevel] = useState(6);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);

  const exportService = ExportService.getInstance();
  const compressionService = CompressionService.getInstance();

  useEffect(() => {
    if (isOpen && data) {
      // Get export recommendations
      const recs = exportService.getExportRecommendations(data);
      setRecommendations(recs);
      
      // Auto-set optimal format if available
      if (allowedFormats.includes(recs.recommendedFormat as any)) {
        setFormat(recs.recommendedFormat as any);
      }
      
      // Auto-enable compression for large files
      setEnableCompression(recs.shouldCompress);
      
      // Set optimal compression level
      if (recs.estimatedSize > 0) {
        const optimalLevel = compressionService.getOptimalCompressionLevel(
          recs.estimatedSize, 
          format
        );
        setCompressionLevel(optimalLevel);
      }
    }
  }, [isOpen, data, format, allowedFormats]);

  const handleExport = async () => {
    if (!data) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      const options: ExportOptions = {
        filename: `${filename}.${format}`,
        compress: enableCompression,
        compressionLevel,
        format,
        includeMetadata,
        autoDownload: true,
      };

      let result: ExportResult;

      switch (format) {
        case 'csv':
          result = await exportService.exportCSV(data, options);
          break;
        case 'pdf':
          result = await exportService.exportPDF(data, options);
          break;
        case 'zip':
          result = await exportService.exportZip([
            { name: 'data.json', data, type: 'application/json' }
          ], options);
          break;
        default:
          result = await exportService.exportJSON(data, options);
      }

      setExportResult(result);
      
      if (onExportComplete) {
        onExportComplete(result);
      }

      if (result.success) {
        // Auto-close after successful export
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setExportResult({
        success: false,
        filename: `${filename}.${format}`,
        originalSize: 0,
        finalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileText, description: 'Structured data format' },
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Spreadsheet compatible' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Portable document' },
    { value: 'zip', label: 'ZIP', icon: Archive, description: 'Compressed archive' },
  ].filter(option => allowedFormats.includes(option.value as any));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Recommendations */}
            {recommendations && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Recommendations</span>
                </div>
                <div className="text-xs text-blue-300 space-y-1">
                  <div>Estimated size: {FileUtils.formatFileSize(recommendations.estimatedSize).formatted}</div>
                  <div>Recommended format: {recommendations.recommendedFormat.toUpperCase()}</div>
                  {recommendations.shouldCompress && (
                    <div>Compression recommended (estimated {Math.round((1 - recommendations.estimatedCompressionRatio) * 100)}% reduction)</div>
                  )}
                </div>
              </div>
            )}

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter filename"
              />
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value as any)}
                      className={`p-3 rounded-lg border transition-colors ${
                        format === option.value
                          ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <div className="text-left">
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs opacity-75">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compression Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Enable Compression
                </label>
                <button
                  onClick={() => setEnableCompression(!enableCompression)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableCompression ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableCompression ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enableCompression && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Compression Level: {compressionLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={compressionLevel}
                    onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Fast</span>
                    <span>Balanced</span>
                    <span>Best</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Include Metadata
                </label>
                <button
                  onClick={() => setIncludeMetadata(!includeMetadata)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    includeMetadata ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      includeMetadata ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Export Result */}
            {exportResult && (
              <div className={`rounded-lg p-4 ${
                exportResult.success 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {exportResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    exportResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {exportResult.success ? 'Export Successful' : 'Export Failed'}
                  </span>
                </div>
                
                {exportResult.success ? (
                  <div className="text-xs space-y-1 text-green-300">
                    <div>File: {exportResult.filename}</div>
                    <div>Size: {FileUtils.formatFileSize(exportResult.finalSize).formatted}</div>
                    {exportResult.compressionRatio && (
                      <div>
                        Compression: {Math.round((1 - exportResult.compressionRatio) * 100)}% reduction
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-red-300">
                    {exportResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !filename.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportDialog;
