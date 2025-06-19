// Podcast Mode Component - Specialized interface for podcast editing
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { PodcastSpeaker } from '../../../types/videoEditorTypes';
import { 
  Mic, 
  Users, 
  Zap, 
  Volume2, 
  VolumeX,
  User,
  UserPlus,
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Scissors,
  Eye,
  EyeOff
} from 'lucide-react';

interface PodcastModeProps {
  className?: string;
}

export const PodcastMode: React.FC<PodcastModeProps> = ({ className = '' }) => {
  const [showSpeakerSetup, setShowSpeakerSetup] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);

  const {
    podcastMode,
    isPodcastModeActive,
    multicamGroups,
    playback,
    currentProject,
    enablePodcastMode,
    disablePodcastMode,
    addPodcastSpeaker,
    removePodcastSpeaker,
    switchToSpeaker,
    setQuickSwitchKey,
    play,
    pause,
    seek
  } = useVideoEditorStore();

  const handleEnablePodcastMode = useCallback(() => {
    enablePodcastMode({
      enabled: true,
      speakers: [],
      autoSwitchOnSpeaker: false,
      switchTransitionDuration: 0.5,
      showSpeakerLabels: true,
      quickSwitchKeys: {}
    });
  }, [enablePodcastMode]);

  const handleAddSpeaker = useCallback((name: string, trackId: string, color: string) => {
    addPodcastSpeaker({
      name,
      trackId,
      color,
      avatar: undefined,
      voiceProfile: undefined
    });
  }, [addPodcastSpeaker]);

  const handleSpeakerSwitch = useCallback((speakerId: string) => {
    setActiveSpeaker(speakerId);
    switchToSpeaker(speakerId);
  }, [switchToSpeaker]);

  const handleQuickSwitch = useCallback((event: KeyboardEvent) => {
    if (!isPodcastModeActive) return;

    const key = event.key.toLowerCase();
    const trackId = podcastMode.quickSwitchKeys[key];
    
    if (trackId) {
      const speaker = podcastMode.speakers.find(s => s.trackId === trackId);
      if (speaker) {
        event.preventDefault();
        handleSpeakerSwitch(speaker.id);
      }
    }
  }, [isPodcastModeActive, podcastMode.quickSwitchKeys, podcastMode.speakers, handleSpeakerSwitch]);

  useEffect(() => {
    window.addEventListener('keydown', handleQuickSwitch);
    return () => window.removeEventListener('keydown', handleQuickSwitch);
  }, [handleQuickSwitch]);

  const getAvailableTracks = () => {
    if (!currentProject) return [];
    return currentProject.tracks.filter(track => 
      track.type === 'video' && !podcastMode.speakers.some(s => s.trackId === track.id)
    );
  };

  const getSpeakerActivity = (speakerId: string): number => {
    // TODO: Implement real-time audio level detection
    return Math.random() * 0.8 + 0.2; // Placeholder
  };

  if (!isPodcastModeActive) {
    return (
      <div className={`podcast-mode-setup ${className} p-6`}>
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <Mic size={48} className="mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-semibold mb-2">Podcast Mode</h3>
            <p className="text-gray-400">
              Enable podcast mode for easy speaker switching and streamlined multicam editing
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Quick speaker switching with keyboard shortcuts</li>
                <li>• Automatic camera switching based on audio activity</li>
                <li>• Speaker-focused timeline view</li>
                <li>• Easy cut management for conversations</li>
              </ul>
            </div>

            <button
              onClick={handleEnablePodcastMode}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Mic size={18} />
              <span>Enable Podcast Mode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`podcast-mode ${className} flex flex-col h-full`}>
      {/* Header */}
      <div className="podcast-header flex items-center justify-between p-4 bg-purple-900/20 border-b border-purple-500/30">
        <div className="flex items-center space-x-3">
          <Mic size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold">Podcast Mode</h3>
          <span className="text-sm text-gray-400">
            {podcastMode.speakers.length} speakers
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto Switch Toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoSwitchEnabled}
              onChange={(e) => setAutoSwitchEnabled(e.target.checked)}
              className="rounded"
            />
            <span>Auto Switch</span>
          </label>

          {/* Speaker Setup */}
          <button
            onClick={() => setShowSpeakerSetup(!showSpeakerSetup)}
            className="btn-ghost p-2"
            title="Speaker setup"
          >
            <Settings size={18} />
          </button>

          {/* Exit Podcast Mode */}
          <button
            onClick={disablePodcastMode}
            className="btn-ghost p-2 text-red-400"
            title="Exit podcast mode"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Speaker Setup Panel */}
      <AnimatePresence>
        {showSpeakerSetup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 bg-gray-850 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Speaker Setup</h4>
              <button
                onClick={() => setShowSpeakerSetup(false)}
                className="btn-ghost p-1"
              >
                <EyeOff size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add Speaker */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300">Add Speaker</h5>
                {getAvailableTracks().map((track) => (
                  <div key={track.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-sm">{track.name}</span>
                    <button
                      onClick={() => handleAddSpeaker(
                        track.name,
                        track.id,
                        track.color
                      )}
                      className="btn-primary text-xs px-2 py-1"
                    >
                      <UserPlus size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Switch Keys */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300">Quick Switch Keys</h5>
                {podcastMode.speakers.map((speaker, index) => (
                  <div key={speaker.id} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: speaker.color }}
                    />
                    <span className="text-sm flex-1">{speaker.name}</span>
                    <input
                      type="text"
                      maxLength={1}
                      className="w-8 h-8 text-center bg-gray-700 border border-gray-600 rounded text-sm"
                      placeholder={String(index + 1)}
                      onChange={(e) => setQuickSwitchKey(e.target.value, speaker.trackId)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaker Controls */}
      <div className="speaker-controls p-4 bg-gray-800 border-b border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {podcastMode.speakers.map((speaker, index) => {
            const isActive = activeSpeaker === speaker.id;
            const activity = getSpeakerActivity(speaker.id);

            return (
              <motion.div
                key={speaker.id}
                className={`speaker-card relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleSpeakerSwitch(speaker.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Speaker Avatar */}
                <div className="flex items-center justify-center mb-2">
                  {speaker.avatar ? (
                    <img 
                      src={speaker.avatar} 
                      alt={speaker.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: speaker.color }}
                    >
                      {speaker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Speaker Name */}
                <div className="text-center mb-2">
                  <h5 className="text-sm font-medium truncate">{speaker.name}</h5>
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center justify-center space-x-1">
                  <Volume2 size={12} className="text-gray-400" />
                  <div className="w-16 h-1 bg-gray-600 rounded overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-100"
                      style={{ width: `${activity * 100}%` }}
                    />
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePodcastSpeaker(speaker.id);
                  }}
                  className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity"
                  title="Remove speaker"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions flex items-center justify-center space-x-4 p-3 bg-gray-850">
        <button
          onClick={() => playback.isPlaying ? pause() : play()}
          className="btn-primary p-2 rounded-full"
        >
          {playback.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          onClick={() => seek(Math.max(0, playback.currentTime - 10))}
          className="btn-ghost p-2"
          title="Skip back 10s"
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={() => seek(playback.currentTime + 10)}
          className="btn-ghost p-2"
          title="Skip forward 10s"
        >
          <SkipForward size={18} />
        </button>

        <button
          className="btn-ghost p-2"
          title="Add cut at current time"
        >
          <Scissors size={18} />
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
        Press speaker numbers to switch cameras
      </div>
    </div>
  );
};
