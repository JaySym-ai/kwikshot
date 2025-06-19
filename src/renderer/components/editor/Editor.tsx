// Enhanced Video Editor Component - Complete video editing interface
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Grid3X3,
  Mic
} from 'lucide-react';
import { useVideoEditorStore } from '../../stores/videoEditorStore';
import { VideoPreview } from './preview/VideoPreview';
import { Timeline } from './timeline/Timeline';
import { MulticamTimeline } from './timeline/MulticamTimeline';
import { PodcastMode } from './podcast/PodcastMode';
import { EditingTools } from './tools/EditingTools';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { AIPanel } from './ai/AIPanel';
import { EditorHeader } from './EditorHeader';
import { NewProjectDialog } from './NewProjectDialog';
import { EditorEmptyState } from './EditorEmptyState';
import { useProjectManager } from '../../hooks/useProjectManager';

interface EditorProps {
  onSwitchToRecorder: () => void;
}

export const Editor: React.FC<EditorProps> = ({ onSwitchToRecorder }) => {
  const [editorMode, setEditorMode] = useState<'standard' | 'multicam' | 'podcast'>('standard');

  const {
    showNewProjectDialog,
    setShowNewProjectDialog,
    currentProject,
    projectModified,
    multicamGroups,
    isPodcastModeActive,
    playback,
    play,
    pause
  } = useVideoEditorStore();

  const {
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleExportProject
  } = useProjectManager();

  // Determine editor mode based on project state
  useEffect(() => {
    if (isPodcastModeActive) {
      setEditorMode('podcast');
    } else if (multicamGroups.length > 0) {
      setEditorMode('multicam');
    } else {
      setEditorMode('standard');
    }
  }, [isPodcastModeActive, multicamGroups.length]);

  // Handle keyboard shortcuts for multicam mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (playback.isPlaying) {
            pause();
          } else {
            play();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playback.isPlaying, play, pause]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with Editor Mode Selector */}
      <EditorHeader
        currentProject={currentProject}
        projectModified={projectModified}
        onNewProject={() => setShowNewProjectDialog(true)}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onSwitchToRecorder={onSwitchToRecorder}
        editorMode={editorMode}
        onEditorModeChange={setEditorMode}
      />

      {/* Editing Tools */}
      <EditingTools />

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conditional Layout based on Editor Mode */}
        {editorMode === 'podcast' ? (
          /* Podcast Mode Layout */
          <div className="flex-1">
            <PodcastMode />
          </div>
        ) : (
          <>
            {/* Left Panel - AI Assistant */}
            <div className="w-80 bg-gray-800 border-r border-gray-700">
              <AIPanel />
            </div>

            {/* Center Panel - Preview & Timeline */}
            <div className="flex-1 flex flex-col">
              {/* Video Preview */}
              <div className="flex-1">
                <VideoPreview />
              </div>

              {/* Timeline - Switch between standard and multicam */}
              <div className="h-64 border-t border-gray-700">
                {editorMode === 'multicam' ? (
                  <MulticamTimeline />
                ) : (
                  <Timeline />
                )}
              </div>
            </div>

            {/* Right Panel - Properties */}
            <div className="w-80 border-l border-gray-700">
              <PropertiesPanel />
            </div>
          </>
        )}
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreateProject={handleNewProject}
      />

      {/* Empty State */}
      {!currentProject && (
        <EditorEmptyState
          onNewProject={() => setShowNewProjectDialog(true)}
          onOpenProject={handleOpenProject}
        />
      )}
    </div>
  );
};
