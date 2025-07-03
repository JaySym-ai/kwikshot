import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Pause, 
  Settings, 
  Users, 
  Eye, 
  Wifi, 
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Monitor,
  Mic,
  Camera
} from 'lucide-react';

interface ModernStreamDashboardProps {
  isStreaming: boolean;
  isPaused: boolean;
  isConnecting: boolean;
  metrics: any;
  networkStats: any;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onSettings: () => void;
}

export const ModernStreamDashboard: React.FC<ModernStreamDashboardProps> = ({
  isStreaming,
  isPaused,
  isConnecting,
  metrics,
  networkStats,
  onStart,
  onStop,
  onPause,
  onSettings
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    if (isStreaming && !isPaused) return 'text-green-500';
    if (isPaused) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'CONNECTING';
    if (isStreaming && !isPaused) return 'LIVE';
    if (isPaused) return 'PAUSED';
    return 'OFFLINE';
  };

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor().replace('text-', 'bg-')} ${isStreaming && !isPaused ? 'animate-pulse' : ''}`} />
            <div>
              <h2 className={`text-2xl font-bold ${getStatusColor()}`}>
                {getStatusText()}
              </h2>
              <p className="text-gray-400">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onSettings}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center space-x-4">
          {!isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              disabled={isConnecting}
              className="flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-semibold transition-all"
            >
              <Play className="w-6 h-6" />
              <span>{isConnecting ? 'Connecting...' : 'Go Live'}</span>
            </motion.button>
          ) : (
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPause}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <Pause className="w-5 h-5" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Stream Info */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-gray-700"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-2 mx-auto">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm text-gray-400">Uptime</p>
                <p className="text-lg font-semibold text-white">
                  {formatUptime(metrics?.uptime || 0)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-2 mx-auto">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-gray-400">Viewers</p>
                <p className="text-lg font-semibold text-white">
                  {metrics?.viewerCount || 0}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-sm text-gray-400">Bitrate</p>
                <p className="text-lg font-semibold text-white">
                  {metrics?.bitrate || 0} kbps
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-xl mb-2 mx-auto">
                  <Activity className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm text-gray-400">FPS</p>
                <p className="text-lg font-semibold text-white">
                  {metrics?.fps || 0}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Network</h3>
            <Wifi className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Upload Speed</span>
              <span className="text-white font-medium">
                {networkStats?.uploadSpeed?.toFixed(1) || '0.0'} Mbps
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Latency</span>
              <span className="text-white font-medium">
                {networkStats?.latency || 0} ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Quality</span>
              <div className="flex items-center space-x-2">
                {networkStats?.connectionQuality === 'excellent' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {networkStats?.connectionQuality === 'poor' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-white font-medium capitalize">
                  {networkStats?.connectionQuality || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Performance</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-white font-medium">{metrics?.cpuUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.cpuUsage || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">GPU Usage</span>
                <span className="text-white font-medium">{metrics?.gpuUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.gpuUsage || 0}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Dropped Frames</span>
              <span className={`font-medium ${(metrics?.droppedFrames || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics?.droppedFrames || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Sources Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Sources</h3>
            <Camera className="w-5 h-5 text-purple-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400">Screen Capture</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-green-500" />
                <span className="text-gray-400">Microphone</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-purple-500" />
                <span className="text-gray-400">Webcam</span>
              </div>
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {(metrics?.droppedFrames > 0 || (networkStats?.packetLoss > 1)) && (
          <motion.div
            key="performance-alert"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-yellow-900/20 to-red-900/20 border border-yellow-500/30 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-yellow-500">Performance Alert</h3>
            </div>
            <div className="space-y-2 text-sm">
              {metrics?.droppedFrames > 0 && (
                <p className="text-yellow-400">
                  • Dropped frames detected ({metrics.droppedFrames}). Consider lowering bitrate or resolution.
                </p>
              )}
              {networkStats?.packetLoss > 1 && (
                <p className="text-yellow-400">
                  • High packet loss detected ({networkStats.packetLoss}%). Check your network connection.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
