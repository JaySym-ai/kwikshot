import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Settings, Monitor, Camera, Mic, Play, Square, Pause } from 'lucide-react';
import { useStreamingStore } from '../../stores/streaming-store';
import { StreamSetup } from './StreamSetup';
import { StreamControls } from './StreamControls';
import { StreamStatus } from './StreamStatus';

interface StreamingViewProps {
  onSwitchToRecorder: () => void;
}

export const StreamingView: React.FC<StreamingViewProps> = ({ onSwitchToRecorder }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [sources, setSources] = useState<Electron.DesktopCapturerSource[]>([]);
  
  const {
    isStreaming,
    isPaused,
    isConnecting,
    platform,
    config,
    error,
    metrics,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    reset
  } = useStreamingStore();

  useEffect(() => {
    loadSources();
    
    // Set up streaming event listeners
    if (window.electronAPI?.onStreamMetricsUpdate) {
      window.electronAPI.onStreamMetricsUpdate((newMetrics) => {
        useStreamingStore.getState().setMetrics(newMetrics);
      });
    }
    
    if (window.electronAPI?.onStreamError) {
      window.electronAPI.onStreamError((errorMessage) => {
        useStreamingStore.getState().setError(errorMessage);
      });
    }
  }, []);

  const loadSources = async () => {
    try {
      const availableSources = await window.electronAPI?.getSources();
      setSources(availableSources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const handleStartStream = async () => {
    if (!platform || !config) {
      setShowSetup(true);
      return;
    }
    await startStream();
  };

  const handleStopStream = async () => {
    await stopStream();
  };

  const handlePauseStream = async () => {
    if (isPaused) {
      await resumeStream();
    } else {
      await pauseStream();
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  const isConfigured = platform && config;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
              <Radio className="text-red-500" size={28} />
              <span>Live Streaming</span>
            </h1>
            <p className="text-gray-400">Stream live to your audience on multiple platforms</p>
          </div>
          <button
            onClick={onSwitchToRecorder}
            className="btn-secondary flex items-center space-x-2"
          >
            <Monitor size={20} />
            <span>Back to Recorder</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Stream Status */}
          {isStreaming && (
            <StreamStatus metrics={metrics} platform={platform} />
          )}
          
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 bg-red-900/50 border-red-500/50"
            >
              <div className="flex items-center space-x-2 text-red-400">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Stream Controls */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Stream Controls</h2>
              {!isStreaming && (
                <button
                  onClick={() => setShowSetup(true)}
                  className="btn-ghost flex items-center space-x-2"
                >
                  <Settings size={16} />
                  <span>Configure Stream</span>
                </button>
              )}
            </div>
            
            <StreamControls
              isStreaming={isStreaming}
              isPaused={isPaused}
              isConnecting={isConnecting}
              isConfigured={isConfigured}
              platform={platform}
              onStart={handleStartStream}
              onStop={handleStopStream}
              onPause={handlePauseStream}
              onConfigure={() => setShowSetup(true)}
            />
          </div>

          {/* Source Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Streaming Sources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Screen */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Monitor size={20} className="text-blue-500" />
                  <span className="font-medium">Screen</span>
                </div>
                <div className="space-y-2">
                  {sources.filter(s => s.id.startsWith('screen')).map((source) => (
                    <div key={source.id} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                      <div className="text-sm font-medium">{source.name}</div>
                      <div className="text-xs text-gray-400">Screen capture</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webcam */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Camera size={20} className="text-green-500" />
                  <span className="font-medium">Webcam</span>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">No webcam detected</div>
                </div>
              </div>

              {/* Microphone */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mic size={20} className="text-red-500" />
                  <span className="font-medium">Microphone</span>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">System default</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Settings */}
          {isConfigured && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Stream Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <div className="input bg-gray-700 cursor-not-allowed">
                    {platform?.name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <select className="input">
                    <option value="1080p30">1080p @ 30fps</option>
                    <option value="1080p60">1080p @ 60fps</option>
                    <option value="720p30">720p @ 30fps</option>
                    <option value="720p60">720p @ 60fps</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Setup Modal */}
      {showSetup && (
        <StreamSetup
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
        />
      )}
    </div>
  );
};
