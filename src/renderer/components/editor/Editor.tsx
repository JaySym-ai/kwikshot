// Enhanced Video Editor Component - Complete video editing interface
// Built using AugmentCode tool - www.augmentcode.com

import React from 'react';
import { VideoPreview } from './preview/VideoPreview';
import { Timeline } from './timeline/Timeline';
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
  const {
    showNewProjectDialog,
    setShowNewProjectDialog,
    currentProject,
    projectModified,
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleExportProject
  } = useProjectManager();

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <EditorHeader
        currentProject={currentProject}
        projectModified={projectModified}
        onNewProject={() => setShowNewProjectDialog(true)}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onSwitchToRecorder={onSwitchToRecorder}
      />

      {/* Editing Tools */}
      <EditingTools />

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
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

          {/* Timeline */}
          <div className="h-64 border-t border-gray-700">
            <Timeline />
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 border-l border-gray-700">
          <PropertiesPanel />
        </div>
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
