import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Pause, Settings, Radio, Loader } from 'lucide-react';
import { StreamingPlatform } from '../../../shared/streaming-types';

interface StreamControlsProps {
  isStreaming: boolean;
  isPaused: boolean;
  isConnecting: boolean;
  isConfigured: boolean;
  platform: StreamingPlatform | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onConfigure: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  isStreaming,
  isPaused,
  isConnecting,
  isConfigured,
  platform,
  onStart,
  onStop,
  onPause,
  onConfigure
}) => {
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isStreaming && isPaused) return 'Stream Paused';
    if (isStreaming) return 'Live';
    if (isConfigured) return 'Ready to Stream';
    return 'Not Configured';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-400';
    if (isStreaming && isPaused) return 'text-orange-400';
    if (isStreaming) return 'text-green-400';
    if (isConfigured) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isStreaming && !isPaused && (
            <div className="recording-indicator"></div>
          )}
          {isConnecting && (
            <Loader className="animate-spin text-yellow-400" size={16} />
          )}
          <span className={`text-lg font-mono ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {platform && (
            <span className="text-gray-400">
              → {platform.name}
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4">
        {!isStreaming ? (
          <>
            <motion.button
              onClick={onStart}
              disabled={!isConfigured || isConnecting}
              className={`flex items-center space-x-2 px-6 py-3 ${
                isConfigured && !isConnecting
                  ? 'btn-primary bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : 'btn-secondary opacity-50 cursor-not-allowed'
              }`}
              whileHover={isConfigured && !isConnecting ? { scale: 1.05 } : {}}
              whileTap={isConfigured && !isConnecting ? { scale: 0.95 } : {}}
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Radio size={20} />
                  <span>Go Live</span>
                </>
              )}
            </motion.button>

            {!isConfigured && (
              <motion.button
                onClick={onConfigure}
                className="btn-secondary flex items-center space-x-2 px-4 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={20} />
                <span>Configure Stream</span>
              </motion.button>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={onPause}
              className="btn-secondary flex items-center space-x-2 px-4 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Pause size={20} />
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </motion.button>
            
            <motion.button
              onClick={onStop}
              className="btn-danger flex items-center space-x-2 px-4 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Square size={20} />
              <span>Stop Stream</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Configuration Info */}
      {isConfigured && platform && (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Streaming to: {platform.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {platform.type === 'rtmp' ? 'RTMP Protocol' : 'WebRTC Protocol'}
              </div>
            </div>
            <button
              onClick={onConfigure}
              className="text-blue-400 hover:text-blue-300 text-sm"
              disabled={isStreaming}
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!isConfigured && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="text-sm text-blue-300">
            <strong>Getting Started:</strong>
          </div>
          <div className="text-xs text-blue-200 mt-1">
            1. Click "Configure Stream" to select your platform<br/>
            2. Enter your stream key or server details<br/>
            3. Click "Go Live" to start streaming
          </div>
        </div>
      )}
    </div>
  );
};
