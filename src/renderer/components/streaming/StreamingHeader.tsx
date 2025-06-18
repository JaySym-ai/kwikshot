import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Monitor, 
  Wifi,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { StreamingState } from '../../hooks/useStreamingManager';

interface StreamingHeaderProps {
  streamingState: StreamingState;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onShowHelp: () => void;
  onSwitchToRecorder: () => void;
}

export const StreamingHeader: React.FC<StreamingHeaderProps> = ({
  streamingState,
  isMinimized,
  onToggleMinimize,
  onShowHelp,
  onSwitchToRecorder
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Live Streaming Studio</h1>
              <p className="text-gray-400">Professional streaming made simple</p>
            </div>
          </div>

          {streamingState.isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 bg-red-600/20 border border-red-500/30 rounded-lg px-4 py-2"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium">LIVE</span>
              <span className="text-gray-400">•</span>
              <span className="text-white">{streamingState.metrics.viewerCount} viewers</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Network Status */}
          <div className="flex items-center space-x-2 text-sm">
            <Wifi className={`w-4 h-4 ${
              streamingState.networkStats.connectionQuality === 'excellent' ? 'text-green-500' :
              streamingState.networkStats.connectionQuality === 'good' ? 'text-blue-500' :
              streamingState.networkStats.connectionQuality === 'fair' ? 'text-yellow-500' : 'text-red-500'
            }`} />
            <span className="text-gray-400">
              {streamingState.networkStats.uploadSpeed.toFixed(1)} Mbps
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowHelp}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-300" />
            </button>
            
            <button
              onClick={onToggleMinimize}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-300" /> : <Minimize2 className="w-4 h-4 text-gray-300" />}
            </button>

            <button
              onClick={onSwitchToRecorder}
              className="btn-secondary flex items-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Recorder</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
