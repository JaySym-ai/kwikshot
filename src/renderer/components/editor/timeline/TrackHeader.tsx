// Track Header Component - Track controls and information
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Settings
} from 'lucide-react';
import { Track } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

interface TrackHeaderProps {
  track: Track;
  height: number;
  className?: string;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  height,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);

  const {
    updateTrack,
    removeTrack,
    selection,
    selectTracks
  } = useVideoEditorStore();

  const isSelected = selection.tracks.includes(track.id);

  // Handle track property updates
  const handleToggleMute = () => {
    updateTrack(track.id, { muted: !track.muted });
  };

  const handleToggleVisible = () => {
    updateTrack(track.id, { visible: !track.visible });
  };

  const handleToggleLock = () => {
    updateTrack(track.id, { locked: !track.locked });
  };

  const handleToggleSolo = () => {
    updateTrack(track.id, { solo: !track.solo });
  };

  // Handle track selection
  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      const newSelection = isSelected 
        ? selection.tracks.filter(id => id !== track.id)
        : [...selection.tracks, track.id];
      selectTracks(newSelection);
    } else {
      // Single select
      selectTracks([track.id]);
    }
  };

  // Handle name editing
  const handleNameEdit = () => {
    setIsEditing(true);
    setEditName(track.name);
  };

  const handleNameSave = () => {
    if (editName.trim() && editName !== track.name) {
      updateTrack(track.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setEditName(track.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Handle track deletion
  const handleDelete = () => {
    removeTrack(track.id);
    setShowMenu(false);
  };

  // Handle track duplication
  const handleDuplicate = () => {
    // TODO: Implement track duplication
    setShowMenu(false);
  };

  return (
    <div
      className={`track-header relative flex flex-col bg-gray-800 border-b border-gray-700 ${
        isSelected ? 'bg-blue-900/30 border-blue-500/50' : ''
      } ${className}`}
      style={{ height }}
      onClick={handleTrackClick}
    >
      {/* Track Info Section */}
      <div className="flex-1 flex items-center px-3 py-2">
        {/* Track Color Indicator */}
        <div
          className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />

        {/* Track Name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <div
              className="text-sm font-medium text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
              onDoubleClick={handleNameEdit}
              title={track.name}
            >
              {track.name}
            </div>
          )}
          
          {/* Track Type Badge */}
          <div className="text-xs text-gray-400 mt-0.5">
            {track.type.charAt(0).toUpperCase() + track.type.slice(1)} • {track.clips.length} clips
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Track Controls */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-850/50">
        <div className="flex items-center space-x-1">
          {/* Mute Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute();
            }}
            className={`p-1 rounded transition-colors ${
              track.muted 
                ? 'text-red-400 bg-red-900/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={track.muted ? 'Unmute' : 'Mute'}
          >
            {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Solo Button (Audio tracks only) */}
          {track.type === 'audio' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSolo();
              }}
              className={`p-1 rounded transition-colors text-xs font-bold ${
                track.solo 
                  ? 'text-yellow-400 bg-yellow-900/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={track.solo ? 'Unsolo' : 'Solo'}
            >
              S
            </button>
          )}

          {/* Visibility Button (Video tracks only) */}
          {track.type === 'video' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisible();
              }}
              className={`p-1 rounded transition-colors ${
                !track.visible 
                  ? 'text-gray-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={track.visible ? 'Hide' : 'Show'}
            >
              {track.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          )}
        </div>

        {/* Lock Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleLock();
          }}
          className={`p-1 rounded transition-colors ${
            track.locked 
              ? 'text-orange-400 bg-orange-900/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={track.locked ? 'Unlock' : 'Lock'}
        >
          {track.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <motion.div
          className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          <div className="py-1">
            <button
              onClick={handleNameEdit}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit3 size={14} />
              <span>Rename Track</span>
            </button>
            
            <button
              onClick={handleDuplicate}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
            >
              <Copy size={14} />
              <span>Duplicate Track</span>
            </button>
            
            <button
              onClick={() => setShowMenu(false)}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
            >
              <Settings size={14} />
              <span>Track Settings</span>
            </button>
            
            <div className="border-t border-gray-600 my-1" />
            
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 flex items-center space-x-2"
            >
              <Trash2 size={14} />
              <span>Delete Track</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
