import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Cpu, HardDrive, Monitor, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { StreamMetrics, NetworkStats, HardwareCapabilities } from '../../../shared/streaming-types';

interface StreamMonitoringDashboardProps {
  metrics: StreamMetrics;
  networkStats: NetworkStats | null;
  hardwareCapabilities: HardwareCapabilities | null;
  isStreaming: boolean;
}

export const StreamMonitoringDashboard: React.FC<StreamMonitoringDashboardProps> = ({
  metrics,
  networkStats,
  hardwareCapabilities,
  isStreaming
}) => {
  const [realtimeMetrics, setRealtimeMetrics] = useState<StreamMetrics>(metrics);

  useEffect(() => {
    setRealtimeMetrics(metrics);
  }, [metrics]);

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'poor': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Stream Monitoring</span>
        </h3>
        <div className="flex items-center space-x-2">
          {getConnectionQualityIcon(realtimeMetrics.connectionQuality)}
          <span className={`text-sm font-medium ${getConnectionQualityColor(realtimeMetrics.connectionQuality)}`}>
            {realtimeMetrics.connectionQuality.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stream Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`text-lg font-semibold ${isStreaming ? 'text-green-500' : 'text-red-500'}`}>
                {isStreaming ? 'LIVE' : 'OFFLINE'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Uptime</p>
              <p className="text-lg font-semibold text-white">
                {formatUptime(realtimeMetrics.uptime)}
              </p>
            </div>
            <Monitor className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Viewers</p>
              <p className="text-lg font-semibold text-white">
                {realtimeMetrics.viewerCount || 0}
              </p>
            </div>
            <Activity className="w-6 h-6 text-purple-500" />
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reconnects</p>
              <p className="text-lg font-semibold text-white">
                {realtimeMetrics.reconnectCount}
              </p>
            </div>
            <Wifi className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stream Quality */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Stream Quality</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bitrate</span>
              <span className="text-white font-medium">{realtimeMetrics.bitrate} kbps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">FPS</span>
              <span className="text-white font-medium">{realtimeMetrics.fps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Dropped Frames</span>
              <span className={`font-medium ${realtimeMetrics.droppedFrames > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {realtimeMetrics.droppedFrames}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Keyframes</span>
              <span className="text-white font-medium">{realtimeMetrics.keyframes}</span>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Network</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Upload Speed</span>
              <span className="text-white font-medium">
                {networkStats ? `${networkStats.uploadSpeed.toFixed(1)} Mbps` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Latency</span>
              <span className="text-white font-medium">
                {networkStats ? `${networkStats.latency} ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Packet Loss</span>
              <span className={`font-medium ${(networkStats?.packetLoss || 0) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                {networkStats ? `${networkStats.packetLoss}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Jitter</span>
              <span className="text-white font-medium">
                {networkStats ? `${networkStats.jitter.toFixed(1)} ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">CPU Usage</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${realtimeMetrics.cpuUsage}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">{realtimeMetrics.cpuUsage}%</span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">GPU Usage</span>
            <Monitor className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${realtimeMetrics.gpuUsage}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">{realtimeMetrics.gpuUsage}%</span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Memory</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${realtimeMetrics.memoryUsage}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">{realtimeMetrics.memoryUsage}%</span>
          </div>
        </div>
      </div>

      {/* Hardware Info */}
      {hardwareCapabilities && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Hardware Encoding</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${hardwareCapabilities.nvenc ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-xs">NVENC</span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${hardwareCapabilities.quicksync ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-xs">QuickSync</span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${hardwareCapabilities.vce ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-xs">VCE</span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${hardwareCapabilities.videotoolbox ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-xs">VideoToolbox</span>
            </div>
          </div>
          {hardwareCapabilities.gpuName && (
            <div className="mt-3 text-center">
              <span className="text-gray-400 text-sm">GPU: </span>
              <span className="text-white text-sm">{hardwareCapabilities.gpuName}</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {(realtimeMetrics.droppedFrames > 0 || (networkStats && networkStats.packetLoss > 1)) && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-500 font-medium">Performance Warnings</span>
          </div>
          <div className="space-y-1 text-sm">
            {realtimeMetrics.droppedFrames > 0 && (
              <p className="text-yellow-400">• Dropped frames detected - consider lowering bitrate or resolution</p>
            )}
            {networkStats && networkStats.packetLoss > 1 && (
              <p className="text-yellow-400">• High packet loss detected - check network connection</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
