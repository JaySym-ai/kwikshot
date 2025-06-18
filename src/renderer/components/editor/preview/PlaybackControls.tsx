// Playback Controls Component - Transport controls for video preview
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Monitor,
  Settings
} from 'lucide-react';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

export const PlaybackControls: React.FC = () => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const {
    currentProject,
    playback,
    previewQuality,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    toggleLoop,
    setPreviewQuality
  } = useVideoEditorStore();

  // Playback control handlers
  const handlePlayPause = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playback.isPlaying, play, pause]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleStepBackward = useCallback(() => {
    const newTime = Math.max(0, playback.currentTime - (1 / 30)); // Step back one frame
    seek(newTime);
  }, [playback.currentTime, seek]);

  const handleStepForward = useCallback(() => {
    const maxTime = currentProject?.settings.duration || 0;
    const newTime = Math.min(maxTime, playback.currentTime + (1 / 30)); // Step forward one frame
    seek(newTime);
  }, [playback.currentTime, currentProject, seek]);

  const handleJumpBackward = useCallback(() => {
    const newTime = Math.max(0, playback.currentTime - 10); // Jump back 10 seconds
    seek(newTime);
  }, [playback.currentTime, seek]);

  const handleJumpForward = useCallback(() => {
    const maxTime = currentProject?.settings.duration || 0;
    const newTime = Math.min(maxTime, playback.currentTime + 10); // Jump forward 10 seconds
    seek(newTime);
  }, [playback.currentTime, currentProject, seek]);

  // Speed control
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
  }, [setPlaybackRate]);

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Quality control
  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high') => {
    setPreviewQuality(quality);
  }, [setPreviewQuality]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.25, 0.5, 1, 1.5, 2, 4];
  const qualityOptions = [
    { value: 'low', label: 'Low (640p)' },
    { value: 'medium', label: 'Medium (1280p)' },
    { value: 'high', label: 'High (1920p)' }
  ] as const;

  return (
    <div className="playback-controls bg-gray-800 border-t border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* Transport Controls */}
        <div className="flex items-center space-x-2">
          {/* Jump Backward */}
          <button
            onClick={handleJumpBackward}
            className="btn-ghost p-2"
            title="Jump backward 10s"
          >
            <Rewind size={20} />
          </button>

          {/* Step Backward */}
          <button
            onClick={handleStepBackward}
            className="btn-ghost p-2"
            title="Step backward (1 frame)"
          >
            <SkipBack size={20} />
          </button>

          {/* Play/Pause */}
          <motion.button
            onClick={handlePlayPause}
            className="btn-primary p-3 rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </motion.button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="btn-ghost p-2"
            title="Stop"
          >
            <Square size={20} />
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            className="btn-ghost p-2"
            title="Step forward (1 frame)"
          >
            <SkipForward size={20} />
          </button>

          {/* Jump Forward */}
          <button
            onClick={handleJumpForward}
            className="btn-ghost p-2"
            title="Jump forward 10s"
          >
            <FastForward size={20} />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-mono text-white">
            {formatTime(playback.currentTime)}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-sm font-mono text-gray-400">
            {formatTime(currentProject?.settings.duration || 0)}
          </span>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center space-x-2">
          {/* Speed Control */}
          <div className="relative">
            <select
              value={playback.playbackRate}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1"
              title="Playback speed"
            >
              {speedOptions.map(speed => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>

          {/* Loop Control */}
          <button
            onClick={toggleLoop}
            className={`btn-ghost p-2 ${playback.loop ? 'text-blue-400' : ''}`}
            title={playback.loop ? 'Disable loop' : 'Enable loop'}
          >
            {playback.loopStart !== undefined && playback.loopEnd !== undefined ? (
              <Repeat1 size={20} />
            ) : (
              <Repeat size={20} />
            )}
          </button>

          {/* Volume Control */}
          <div className="relative">
            <button
              onClick={handleMuteToggle}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="btn-ghost p-2"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Volume Slider */}
            {showVolumeSlider && (
              <motion.div
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-center mt-1 text-gray-400">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </div>
              </motion.div>
            )}
          </div>

          {/* Quality Control */}
          <div className="relative">
            <select
              value={previewQuality}
              onChange={(e) => handleQualityChange(e.target.value as 'low' | 'medium' | 'high')}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1"
              title="Preview quality"
            >
              {qualityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fullscreen Toggle */}
          <button
            className="btn-ghost p-2"
            title="Fullscreen preview"
          >
            <Monitor size={20} />
          </button>

          {/* Settings */}
          <button
            className="btn-ghost p-2"
            title="Preview settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="relative">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{
                width: `${((playback.currentTime / (currentProject?.settings.duration || 1)) * 100)}%`
              }}
            />
          </div>
          
          {/* Loop region indicators */}
          {playback.loopStart !== undefined && playback.loopEnd !== undefined && (
            <>
              <div
                className="absolute top-0 bottom-0 w-1 bg-yellow-500"
                style={{
                  left: `${(playback.loopStart / (currentProject?.settings.duration || 1)) * 100}%`
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-yellow-500"
                style={{
                  left: `${(playback.loopEnd / (currentProject?.settings.duration || 1)) * 100}%`
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
