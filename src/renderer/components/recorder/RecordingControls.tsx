import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Pause, AlertCircle, Loader2 } from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';

interface RecordingControlsProps {
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
}) => {
  const {
    isRecording,
    isPaused,
    isProcessing,
    duration,
    error,
    settings,
  } = useRecordingStore();

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    if (isProcessing) return 'Processing...';
    if (isRecording && isPaused) return 'Paused';
    if (isRecording) return 'Recording';
    return 'Ready';
  };

  const getStatusColor = (): string => {
    if (error) return 'text-red-400';
    if (isProcessing) return 'text-yellow-400';
    if (isRecording && isPaused) return 'text-yellow-400';
    if (isRecording) return 'text-green-400';
    return 'text-gray-400';
  };

  const handleStartClick = async () => {
    if (!settings.selectedSource) {
      return;
    }
    
    try {
      await onStartRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handlePauseClick = () => {
    if (isPaused) {
      onResumeRecording();
    } else {
      onPauseRecording();
    }
  };

  const canStartRecording = !isRecording && !isProcessing && settings.selectedSource;

  return (
    <div className="recording-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Recording Controls
        </h2>

        {/* Status Badge */}
        <div className={`status-indicator ${
          isRecording && !isPaused ? 'status-recording' :
          isPaused ? 'status-paused' :
          isProcessing ? 'status-processing' :
          'status-ready'
        }`}>
          {isRecording && !isPaused && <div className="recording-indicator mr-2" />}
          {isProcessing && <Loader2 size={14} className="animate-spin mr-2" />}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Main Status Display */}
      <div className="text-center mb-8">
        {/* Duration Display */}
        <motion.div
          className="text-5xl font-mono font-bold text-white mb-3"
          animate={isRecording && !isPaused ? {
            scale: [1, 1.02, 1],
            textShadow: [
              '0 0 0 rgba(59, 130, 246, 0)',
              '0 0 30px rgba(59, 130, 246, 0.6)',
              '0 0 0 rgba(59, 130, 246, 0)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formatDuration(duration)}
        </motion.div>

        {/* Recording Info */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-6 text-sm text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>{settings.quality.resolution} @ {settings.quality.frameRate}fps</span>
            </div>
            {settings.includeSystemAudio && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>System Audio</span>
              </div>
            )}
            {settings.includeMicrophone && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Microphone</span>
              </div>
            )}
            {settings.cameraEnabled && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Camera</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-200">{error}</span>
        </motion.div>
      )}

      {/* Control Buttons */}
      <div className="recording-controls">
        {!isRecording ? (
          <motion.button
            onClick={handleStartClick}
            disabled={!canStartRecording || isProcessing}
            className={`recording-button-start ${
              !canStartRecording || isProcessing
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            whileHover={canStartRecording && !isProcessing ? {
              scale: 1.1,
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)'
            } : {}}
            whileTap={canStartRecording && !isProcessing ? { scale: 0.95 } : {}}
          >
            {isProcessing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </motion.button>
        ) : (
          <div className="flex items-center space-x-6">
            <motion.button
              onClick={handlePauseClick}
              disabled={isProcessing}
              className="recording-button-pause"
              whileHover={{
                scale: 1.1,
                boxShadow: '0 0 40px rgba(234, 179, 8, 0.6)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              {isPaused ? (
                <Play size={24} fill="currentColor" />
              ) : (
                <Pause size={24} fill="currentColor" />
              )}
            </motion.button>

            <motion.button
              onClick={onStopRecording}
              disabled={isProcessing}
              className="recording-button-stop"
              whileHover={{
                scale: 1.1,
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Square size={24} fill="currentColor" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Action Labels */}
      <div className="text-center mt-4">
        {!isRecording ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-400"
          >
            {isProcessing ? 'Initializing recording...' : 'Click to start recording'}
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-8 text-sm text-gray-400"
          >
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
            <span>•</span>
            <span>Stop & Save</span>
          </motion.div>
        )}
      </div>

      {/* Recording Tips */}
      {!isRecording && !settings.selectedSource && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-200">
            💡 Select a screen or window source below to start recording
          </p>
        </div>
      )}

      {!isRecording && settings.selectedSource && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
          <p className="text-sm text-green-200">
            ✓ Ready to record "{settings.selectedSource.name}"
          </p>
        </div>
      )}
    </div>
  );
};
