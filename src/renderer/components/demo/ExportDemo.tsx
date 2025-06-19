// Export Demo Component - Showcase new compression and export features
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Archive,
  Zap,
  BarChart3,
  Clock,
  HardDrive,
  CheckCircle,
  Info
} from 'lucide-react';
import ExportDialog from '../common/ExportDialog';
import ExportService, { ExportResult } from '../../services/ExportService';
import CompressionService from '../../services/CompressionService';
import FileUtils from '../../utils/fileUtils';

export const ExportDemo: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<'small' | 'medium' | 'large'>('medium');
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [compressionStats, setCompressionStats] = useState<any>(null);

  // Sample datasets for demonstration
  const datasets = {
    small: {
      name: 'Small Dataset',
      description: 'User preferences and settings',
      data: {
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
            autoSave: true,
          },
        },
        settings: {
          quality: 'high',
          format: 'mp4',
          resolution: '1080p',
        },
      },
      estimatedSize: '2.1 KB',
    },
    medium: {
      name: 'Medium Dataset',
      description: 'Project timeline and clips data',
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Clip ${i + 1}`,
        duration: Math.random() * 120 + 10,
        startTime: i * 15,
        endTime: (i + 1) * 15,
        type: ['video', 'audio', 'image'][Math.floor(Math.random() * 3)],
        metadata: {
          resolution: '1920x1080',
          frameRate: 30,
          bitrate: 5000 + Math.random() * 3000,
          codec: 'h264',
        },
      })),
      estimatedSize: '45.2 KB',
    },
    large: {
      name: 'Large Dataset',
      description: 'Complete project export with assets',
      data: {
        project: {
          name: 'My Video Project',
          duration: 3600,
          tracks: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Track ${i + 1}`,
            type: ['video', 'audio'][i % 2],
            clips: Array.from({ length: 50 }, (_, j) => ({
              id: j + 1,
              name: `Clip ${j + 1}`,
              startTime: j * 10,
              endTime: (j + 1) * 10,
              effects: Array.from({ length: 5 }, (_, k) => ({
                id: k + 1,
                type: 'filter',
                parameters: { intensity: Math.random() },
              })),
            })),
          })),
        },
        assets: Array.from({ length: 200 }, (_, i) => ({
          id: i + 1,
          name: `Asset ${i + 1}`,
          type: ['video', 'audio', 'image'][Math.floor(Math.random() * 3)],
          size: Math.random() * 100000000,
          metadata: {
            width: 1920,
            height: 1080,
            duration: Math.random() * 300,
            format: 'mp4',
          },
        })),
      },
      estimatedSize: '2.3 MB',
    },
  };

  const currentDataset = datasets[selectedDataset];

  const handleExportComplete = (result: ExportResult) => {
    setExportResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  const runCompressionBenchmark = async () => {
    const compressionService = CompressionService.getInstance();
    const testData = JSON.stringify(currentDataset.data, null, 2);
    
    try {
      const results = await compressionService.benchmarkCompression(testData, [1, 3, 6, 9]);
      setCompressionStats({
        originalSize: testData.length,
        results: results.map(r => ({
          level: r.level,
          compressedSize: r.compressedSize,
          ratio: r.compressionRatio,
          time: r.compressionTime,
          savings: Math.round((1 - r.compressionRatio) * 100),
        })),
      });
    } catch (error) {
      console.error('Compression benchmark failed:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Export & Compression Demo</h2>
        <p className="text-gray-400">
          Showcase of the new high-performance export system with advanced compression
        </p>
      </div>

      {/* Dataset Selection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Dataset</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(datasets).map(([key, dataset]) => (
            <button
              key={key}
              onClick={() => setSelectedDataset(key as any)}
              className={`p-4 rounded-lg border transition-all ${
                selectedDataset === key
                  ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-left space-y-2">
                <div className="font-medium">{dataset.name}</div>
                <div className="text-sm opacity-75">{dataset.description}</div>
                <div className="text-xs">Est. size: {dataset.estimatedSize}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowExportDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Export with Compression</span>
        </button>
        
        <button
          onClick={runCompressionBenchmark}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Run Compression Benchmark</span>
        </button>
      </div>

      {/* Compression Benchmark Results */}
      {compressionStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Compression Benchmark Results</span>
          </h3>
          
          <div className="mb-4 text-sm text-gray-400">
            Original size: {FileUtils.formatFileSize(compressionStats.originalSize).formatted}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {compressionStats.results.map((result: any) => (
              <div key={result.level} className="bg-gray-700 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold text-white">Level {result.level}</div>
                  <div className="text-sm text-gray-400">
                    {FileUtils.formatFileSize(result.compressedSize).formatted}
                  </div>
                  <div className="text-green-400 font-medium">{result.savings}% saved</div>
                  <div className="text-xs text-gray-500">{result.time.toFixed(2)}ms</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Export Results */}
      {exportResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Recent Export Results</span>
          </h3>
          
          <div className="space-y-3">
            {exportResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'border-green-500/30 bg-green-900/20'
                    : 'border-red-500/30 bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-white">{result.filename}</div>
                    <div className="text-sm text-gray-400">
                      {FileUtils.formatFileSize(result.finalSize).formatted}
                      {result.compressionRatio && (
                        <span className="ml-2 text-green-400">
                          ({Math.round((1 - result.compressionRatio) * 100)}% compressed)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                {result.error && (
                  <div className="mt-2 text-sm text-red-400">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Features Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>New Export Features</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-400">
              <Zap className="w-4 h-4" />
              <span className="font-medium">High-Performance Compression</span>
            </div>
            <div className="text-sm text-gray-400">
              Up to 70% file size reduction with fflate compression library
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-400">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Multiple Export Formats</span>
            </div>
            <div className="text-sm text-gray-400">
              JSON, CSV, PDF, and ZIP exports with automatic optimization
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-purple-400">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Smart Optimization</span>
            </div>
            <div className="text-sm text-gray-400">
              Automatic compression level selection based on file size and type
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        data={currentDataset.data}
        title={`Export ${currentDataset.name}`}
        defaultFilename={currentDataset.name.toLowerCase().replace(/\s+/g, '_')}
        onExportComplete={handleExportComplete}
      />
    </div>
  );
};

export default ExportDemo;
