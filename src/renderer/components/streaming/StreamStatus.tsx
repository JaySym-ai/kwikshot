import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Clock, Wifi, AlertTriangle } from 'lucide-react';
import { StreamMetrics, StreamingPlatform } from '../../../shared/streaming-types';

interface StreamStatusProps {
  metrics: StreamMetrics;
  platform: StreamingPlatform | null;
}

export const StreamStatus: React.FC<StreamStatusProps> = ({ metrics, platform }) => {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBitrate = (bitrate: number) => {
    if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(1)} Mbps`;
    }
    return `${bitrate} kbps`;
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return '●●●●';
      case 'good': return '●●●○';
      case 'fair': return '●●○○';
      case 'poor': return '●○○○';
      default: return '○○○○';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="recording-indicator"></div>
          <h2 className="text-lg font-semibold text-red-400">LIVE</h2>
          {platform && (
            <span className="text-gray-300">on {platform.name}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>{formatUptime(uptime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Bitrate */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Activity size={20} className="text-blue-400" />
            <span className="text-sm font-medium">Bitrate</span>
          </div>
          <div className="text-xl font-mono text-white">
            {formatBitrate(metrics.bitrate)}
          </div>
        </div>

        {/* FPS */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Activity size={20} className="text-green-400" />
            <span className="text-sm font-medium">FPS</span>
          </div>
          <div className="text-xl font-mono text-white">
            {metrics.fps}
          </div>
        </div>

        {/* Connection Quality */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Wifi size={20} className={getConnectionQualityColor(metrics.connectionQuality)} />
            <span className="text-sm font-medium">Quality</span>
          </div>
          <div className={`text-lg font-mono ${getConnectionQualityColor(metrics.connectionQuality)}`}>
            {getConnectionQualityIcon(metrics.connectionQuality)}
          </div>
          <div className="text-xs text-gray-400 capitalize">
            {metrics.connectionQuality}
          </div>
        </div>

        {/* Viewers (if available) */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users size={20} className="text-purple-400" />
            <span className="text-sm font-medium">Viewers</span>
          </div>
          <div className="text-xl font-mono text-white">
            {metrics.viewerCount !== undefined ? metrics.viewerCount : '—'}
          </div>
        </div>
      </div>

      {/* Dropped Frames Warning */}
      {metrics.droppedFrames > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              {metrics.droppedFrames} frames dropped
            </span>
          </div>
          <div className="text-xs text-yellow-300 mt-1">
            Consider reducing stream quality if this continues
          </div>
        </motion.div>
      )}

      {/* Poor Connection Warning */}
      {metrics.connectionQuality === 'poor' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              Poor connection quality detected
            </span>
          </div>
          <div className="text-xs text-red-300 mt-1">
            Your stream may be unstable. Check your internet connection.
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
