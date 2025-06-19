// Multicam Timeline Component - Timeline with multicam support
// Built using AugmentCode tool - www.augmentcode.com

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { Timeline } from './Timeline';
import { MulticamPreview } from '../preview/MulticamPreview';
import { CameraSwitcher } from '../multicam/CameraSwitcher';
import { SyncControls } from '../multicam/SyncControls';
import { 
  Video, 
  Grid3X3, 
  Layers, 
  Sync, 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface MulticamTimelineProps {
  className?: string;
}

export const MulticamTimeline: React.FC<MulticamTimelineProps> = ({ className = '' }) => {
  const [showSyncControls, setShowSyncControls] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const {
    currentProject,
    multicamGroups,
    activeMulticamGroup,
    showMulticamPreview,
    multicamPreviewLayout,
    cameraSwitchEvents,
    playback,
    toggleMulticamPreview,
    setMulticamPreviewLayout,
    switchMulticamAngle,
    addCameraSwitchEvent,
    autoSyncMulticam
  } = useVideoEditorStore();

  const activeGroup = multicamGroups.find(g => g.id === activeMulticamGroup);

  const handleAngleSwitch = useCallback((angle: number) => {
    if (!activeGroup) return;
    
    switchMulticamAngle(activeGroup.id, angle, playback.currentTime);
  }, [activeGroup, switchMulticamAngle, playback.currentTime]);

  const handleAutoSync = useCallback(async () => {
    if (!activeGroup) return;
    
    setIsAutoSyncing(true);
    try {
      await autoSyncMulticam(activeGroup.id);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      setIsAutoSyncing(false);
    }
  }, [activeGroup, autoSyncMulticam]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!activeGroup) return;
    
    // Number keys 1-9 for quick angle switching
    const key = event.key;
    if (key >= '1' && key <= '9') {
      const angle = parseInt(key) - 1;
      if (angle < activeGroup.angles.length) {
        event.preventDefault();
        handleAngleSwitch(angle);
      }
    }
  }, [activeGroup, handleAngleSwitch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!currentProject || multicamGroups.length === 0) {
    return (
      <div className={`multicam-timeline ${className}`}>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Video size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Multicam Groups</p>
            <p className="text-sm">Create a multicam group to enable multicam editing</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`multicam-timeline ${className} flex flex-col h-full`}>
      {/* Multicam Header */}
      <div className="multicam-header flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Layers size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold">Multicam Timeline</h3>
            {activeGroup && (
              <span className="text-sm text-gray-400">
                ({activeGroup.name} - {activeGroup.angles.length} angles)
              </span>
            )}
          </div>
          
          {activeGroup && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">Active:</span>
              <span 
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: activeGroup.angles[activeGroup.activeAngle]?.color + '20',
                  color: activeGroup.angles[activeGroup.activeAngle]?.color 
                }}
              >
                {activeGroup.angles[activeGroup.activeAngle]?.name || 'Angle 1'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          <button
            onClick={toggleMulticamPreview}
            className={`btn-ghost p-2 ${showMulticamPreview ? 'text-blue-400' : ''}`}
            title={showMulticamPreview ? 'Hide multicam preview' : 'Show multicam preview'}
          >
            {showMulticamPreview ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {/* Preview Layout */}
          {showMulticamPreview && (
            <div className="flex items-center space-x-1 border border-gray-600 rounded">
              {(['grid', 'sidebar', 'overlay'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => setMulticamPreviewLayout(layout)}
                  className={`p-1 text-xs ${
                    multicamPreviewLayout === layout 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={`${layout} layout`}
                >
                  <Grid3X3 size={14} />
                </button>
              ))}
            </div>
          )}

          {/* Sync Controls */}
          <button
            onClick={() => setShowSyncControls(!showSyncControls)}
            className={`btn-ghost p-2 ${showSyncControls ? 'text-blue-400' : ''}`}
            title="Sync controls"
          >
            <Sync size={18} />
          </button>

          {/* Auto Sync */}
          <button
            onClick={handleAutoSync}
            disabled={isAutoSyncing || !activeGroup}
            className="btn-primary text-sm px-3 py-1 flex items-center space-x-1"
            title="Auto-sync cameras"
          >
            {isAutoSyncing ? (
              <RotateCcw size={14} className="animate-spin" />
            ) : (
              <Sync size={14} />
            )}
            <span>{isAutoSyncing ? 'Syncing...' : 'Auto Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Controls Panel */}
      <AnimatePresence>
        {showSyncControls && activeGroup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 bg-gray-850"
          >
            <SyncControls 
              multicamGroup={activeGroup}
              onClose={() => setShowSyncControls(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Timeline */}
        <div className={`flex-1 ${showMulticamPreview && multicamPreviewLayout === 'sidebar' ? 'w-2/3' : ''}`}>
          <Timeline className="h-full" />
        </div>

        {/* Multicam Preview Sidebar */}
        {showMulticamPreview && multicamPreviewLayout === 'sidebar' && activeGroup && (
          <div className="w-1/3 border-l border-gray-700">
            <MulticamPreview 
              multicamGroup={activeGroup}
              layout="sidebar"
              onAngleSwitch={handleAngleSwitch}
            />
          </div>
        )}
      </div>

      {/* Camera Switcher */}
      {activeGroup && (
        <div className="border-t border-gray-700 bg-gray-800">
          <CameraSwitcher 
            multicamGroup={activeGroup}
            currentTime={playback.currentTime}
            onAngleSwitch={handleAngleSwitch}
            switchEvents={cameraSwitchEvents.filter(event => 
              // Filter events for the current multicam group
              true // TODO: Add proper filtering based on group
            )}
          />
        </div>
      )}

      {/* Multicam Preview Overlay */}
      {showMulticamPreview && multicamPreviewLayout === 'overlay' && activeGroup && (
        <div className="absolute top-20 right-4 z-10">
          <MulticamPreview 
            multicamGroup={activeGroup}
            layout="overlay"
            onAngleSwitch={handleAngleSwitch}
          />
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
        Press 1-{activeGroup?.angles.length || 0} to switch cameras
      </div>
    </div>
  );
};
