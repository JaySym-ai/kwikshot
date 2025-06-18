import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, Mic, MicOff, VolumeX } from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';

export const RecordingSettings: React.FC = () => {
  const { settings, updateSettings, isRecording } = useRecordingStore();

  const handleQualityChange = (resolution: '720p' | '1080p' | '1440p' | '4k' | 'custom') => {
    if (isRecording) return;
    updateSettings({
      quality: {
        ...settings.quality,
        resolution
      }
    });
  };

  const handleFrameRateChange = (frameRate: 15 | 30 | 60 | 120) => {
    if (isRecording) return;
    updateSettings({
      quality: {
        ...settings.quality,
        frameRate
      }
    });
  };

  const handleBitrateChange = (type: 'video' | 'audio', bitrate: number) => {
    if (isRecording) return;
    updateSettings({
      quality: {
        ...settings.quality,
        [type === 'video' ? 'videoBitrate' : 'audioBitrate']: bitrate,
      }
    });
  };

  const handleCustomResolutionChange = (width: number, height: number) => {
    if (isRecording) return;
    updateSettings({
      quality: {
        ...settings.quality,
        customWidth: width,
        customHeight: height,
      }
    });
  };

  const handleCursorToggle = () => {
    if (isRecording) return;
    updateSettings({ showCursor: !settings.showCursor });
  };

  const handleClickHighlightToggle = () => {
    if (isRecording) return;
    updateSettings({ highlightClicks: !settings.highlightClicks });
  };

  const handleAutoStopChange = (minutes: number | undefined) => {
    if (isRecording) return;
    updateSettings({ autoStopAfter: minutes });
  };

  const qualityOptions = [
    { value: '720p', label: '720p HD', description: 'Good quality, smaller file' },
    { value: '1080p', label: '1080p Full HD', description: 'Recommended' },
    { value: '1440p', label: '1440p QHD', description: 'High quality' },
    { value: '4k', label: '4K Ultra HD', description: 'Best quality, large file' },
    { value: 'custom', label: 'Custom', description: 'Set custom resolution' },
  ] as const;

  const frameRateOptions = [
    { value: 15, label: '15 fps', description: 'Low frame rate' },
    { value: 30, label: '30 fps', description: 'Standard' },
    { value: 60, label: '60 fps', description: 'Smooth motion' },
    { value: 120, label: '120 fps', description: 'High frame rate' },
  ] as const;

  const frameRateOptions = [
    { value: 30, label: '30 FPS', description: 'Standard' },
    { value: 60, label: '60 FPS', description: 'Smooth motion' },
  ] as const;

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-gray-400" />
        <h2 className="text-lg font-semibold">Recording Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Video Quality */}
        <div>
          <label className="block text-sm font-medium mb-3">Video Quality</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qualityOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleQualityChange(option.value)}
                disabled={isRecording}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${settings.quality.resolution === option.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }
                  ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                whileHover={!isRecording ? { scale: 1.02 } : {}}
                whileTap={!isRecording ? { scale: 0.98 } : {}}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-400">{option.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="block text-sm font-medium mb-3">Frame Rate</label>
          <div className="grid grid-cols-2 gap-3">
            {frameRateOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleFrameRateChange(option.value)}
                disabled={isRecording}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${settings.quality.frameRate === option.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }
                  ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                whileHover={!isRecording ? { scale: 1.02 } : {}}
                whileTap={!isRecording ? { scale: 0.98 } : {}}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-400">{option.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Resolution */}
        {settings.quality.resolution === 'custom' && (
          <div>
            <label className="block text-sm font-medium mb-3">Custom Resolution</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Width</label>
                <input
                  type="number"
                  min="640"
                  max="7680"
                  value={settings.quality.customWidth || 1920}
                  onChange={(e) => handleCustomResolutionChange(
                    Number(e.target.value),
                    settings.quality.customHeight || 1080
                  )}
                  disabled={isRecording}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Height</label>
                <input
                  type="number"
                  min="480"
                  max="4320"
                  value={settings.quality.customHeight || 1080}
                  onChange={(e) => handleCustomResolutionChange(
                    settings.quality.customWidth || 1920,
                    Number(e.target.value)
                  )}
                  disabled={isRecording}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bitrate Settings */}
        <div>
          <label className="block text-sm font-medium mb-3">Bitrate Settings</label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Video Bitrate: {settings.quality.videoBitrate} kbps
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={settings.quality.videoBitrate}
                onChange={(e) => handleBitrateChange('video', Number(e.target.value))}
                disabled={isRecording}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Audio Bitrate: {settings.quality.audioBitrate} kbps
              </label>
              <input
                type="range"
                min="64"
                max="320"
                step="32"
                value={settings.quality.audioBitrate}
                onChange={(e) => handleBitrateChange('audio', Number(e.target.value))}
                disabled={isRecording}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Recording Behavior */}
        <div>
          <label className="block text-sm font-medium mb-3">Recording Behavior</label>
          <div className="space-y-3">
            {/* Show Cursor */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Cursor</div>
                <div className="text-xs text-gray-400">Include mouse cursor in recording</div>
              </div>
              <motion.button
                onClick={handleCursorToggle}
                disabled={isRecording}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.showCursor ? 'bg-blue-600' : 'bg-gray-600'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  animate={{ x: settings.showCursor ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Highlight Clicks */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Highlight Clicks</div>
                <div className="text-xs text-gray-400">Show visual feedback for mouse clicks</div>
              </div>
              <motion.button
                onClick={handleClickHighlightToggle}
                disabled={isRecording}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.highlightClicks ? 'bg-blue-600' : 'bg-gray-600'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  animate={{ x: settings.highlightClicks ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Auto Stop */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Auto-stop after (minutes)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.autoStopAfter || ''}
                  onChange={(e) => handleAutoStopChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isRecording}
                  placeholder="Never"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
                <motion.button
                  onClick={() => handleAutoStopChange(undefined)}
                  disabled={isRecording}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
          <div className="text-sm font-medium mb-2">Current Settings</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Quality: {settings.quality.resolution === 'custom'
                ? `${settings.quality.customWidth}×${settings.quality.customHeight}`
                : settings.quality.resolution
              } @ {settings.quality.frameRate}fps
            </div>
            <div>Video Bitrate: {settings.quality.videoBitrate} kbps</div>
            <div>Audio Bitrate: {settings.quality.audioBitrate} kbps</div>
            <div>
              Audio: {
                settings.includeSystemAudio && settings.includeMicrophone
                  ? 'System + Microphone'
                  : settings.includeSystemAudio
                  ? 'System only'
                  : settings.includeMicrophone
                  ? 'Microphone only'
                  : 'No audio'
              }
            </div>
            <div>Camera: {settings.cameraEnabled ? 'Enabled' : 'Disabled'}</div>
            <div>Cursor: {settings.showCursor ? 'Visible' : 'Hidden'}</div>
            {settings.autoStopAfter && (
              <div>Auto-stop: {settings.autoStopAfter} minutes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
