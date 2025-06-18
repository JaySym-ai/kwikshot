import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, HardDrive, Cpu, Activity } from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';

export const RecordingTimer: React.FC = () => {
  const {
    isRecording,
    isPaused,
    duration,
    recordingStats,
    settings,
    incrementDuration,
    updateRecordingStats,
  } = useRecordingStore();

  const [memoryUsage, setMemoryUsage] = useState(0);
  const [estimatedFileSize, setEstimatedFileSize] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        incrementDuration();
        updateStats();
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused, incrementDuration]);

  const updateStats = () => {
    // Update memory usage (simulated)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMemoryUsage(memInfo.usedJSHeapSize / 1024 / 1024); // MB
      
      updateRecordingStats({
        peakMemoryUsage: Math.max(recordingStats.peakMemoryUsage, memInfo.usedJSHeapSize / 1024 / 1024)
      });
    }
    
    // Estimate file size based on bitrate and duration
    const videoBitrate = settings.quality.videoBitrate; // kbps
    const audioBitrate = settings.quality.audioBitrate; // kbps
    const totalBitrate = videoBitrate + (settings.includeSystemAudio || settings.includeMicrophone ? audioBitrate : 0);
    const estimatedSize = (totalBitrate * duration) / 8 / 1024; // MB
    
    setEstimatedFileSize(estimatedSize);
    updateRecordingStats({
      fileSize: estimatedSize,
      framesRecorded: duration * settings.quality.frameRate,
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    } else if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(1)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
  };

  const getStatusColor = () => {
    if (!isRecording) return 'text-gray-400';
    if (isPaused) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (!isRecording) return 'Ready';
    if (isPaused) return 'Paused';
    return 'Recording';
  };

  return (
    <div className="recording-card">
      {/* Main Timer Display */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <motion.div
            className={`recording-indicator-large ${
              isRecording && !isPaused ? 'bg-red-500' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'
            }`}
            animate={isRecording && !isPaused ? {
              scale: [1, 1.3, 1],
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0.7)',
                '0 0 0 15px rgba(239, 68, 68, 0)',
                '0 0 0 0 rgba(239, 68, 68, 0.7)'
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className={`status-indicator ${
            isRecording && !isPaused ? 'status-recording' :
            isPaused ? 'status-paused' :
            'status-ready'
          }`}>
            <span className="font-semibold">{getStatusText()}</span>
          </div>
        </div>

        <motion.div
          className="text-6xl font-mono font-bold text-white mb-3"
          animate={isRecording && !isPaused ? {
            scale: [1, 1.02, 1],
            textShadow: [
              '0 0 0 rgba(59, 130, 246, 0)',
              '0 0 40px rgba(59, 130, 246, 0.8)',
              '0 0 0 rgba(59, 130, 246, 0)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formatTime(duration)}
        </motion.div>

        {settings.autoStopAfter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-orange-400 font-medium"
          >
            Auto-stop in {formatTime((settings.autoStopAfter * 60) - duration)}
          </motion.div>
        )}
      </div>

      {/* Recording Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* File Size */}
        <motion.div
          className="card-glass p-4 hover:scale-105 transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <HardDrive size={16} className="text-blue-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">File Size</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {formatFileSize(estimatedFileSize)}
          </div>
          <div className="text-xs text-gray-500">
            ~{settings.quality.videoBitrate + settings.quality.audioBitrate} kbps
          </div>
        </motion.div>

        {/* Frame Rate */}
        <motion.div
          className="card-glass p-4 hover:scale-105 transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Activity size={16} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Frame Rate</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {recordingStats.averageFps || settings.quality.frameRate} fps
          </div>
          <div className="text-xs text-gray-500">
            {recordingStats.framesRecorded.toLocaleString()} frames
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          className="card-glass p-4 hover:scale-105 transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Cpu size={16} className="text-purple-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Memory</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {memoryUsage.toFixed(1)} MB
          </div>
          <div className="text-xs text-gray-500">
            Peak: {recordingStats.peakMemoryUsage.toFixed(1)} MB
          </div>
        </motion.div>

        {/* Duration */}
        <motion.div
          className="card-glass p-4 hover:scale-105 transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock size={16} className="text-orange-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Duration</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {formatTime(duration)}
          </div>
          <div className="text-xs text-gray-500">
            {duration > 0 ? `${(estimatedFileSize / duration * 60).toFixed(1)} MB/min` : '0 MB/min'}
          </div>
        </motion.div>
      </div>

      {/* Progress Bars */}
      {isRecording && (
        <div className="mt-4 space-y-3">
          {/* Auto-stop progress */}
          {settings.autoStopAfter && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Auto-stop Progress</span>
                <span>{Math.round((duration / (settings.autoStopAfter * 60)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (duration / (settings.autoStopAfter * 60)) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Memory usage indicator */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Memory Usage</span>
              <span>{memoryUsage.toFixed(1)} MB</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  memoryUsage > 500 ? 'bg-red-500' : memoryUsage > 200 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (memoryUsage / 1000) * 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recording Quality Summary */}
      <div className="mt-4 p-3 bg-gray-700/20 rounded-lg">
        <div className="text-xs text-gray-400 mb-2">Recording Settings</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Resolution:</span>
            <span className="ml-1 text-white">
              {settings.quality.resolution === 'custom' 
                ? `${settings.quality.customWidth}×${settings.quality.customHeight}`
                : settings.quality.resolution
              }
            </span>
          </div>
          <div>
            <span className="text-gray-500">Audio:</span>
            <span className="ml-1 text-white">
              {settings.includeSystemAudio && settings.includeMicrophone
                ? 'System + Mic'
                : settings.includeSystemAudio
                ? 'System'
                : settings.includeMicrophone
                ? 'Microphone'
                : 'None'
              }
            </span>
          </div>
          <div>
            <span className="text-gray-500">Camera:</span>
            <span className="ml-1 text-white">
              {settings.cameraEnabled ? `${settings.cameraSize} (${settings.cameraPosition})` : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Cursor:</span>
            <span className="ml-1 text-white">
              {settings.showCursor ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
