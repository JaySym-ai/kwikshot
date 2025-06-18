// Enhanced Video Editor Component - Complete video editing interface
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  FolderOpen,
  Save,
  Download,
  Settings,
  Plus,
  FileVideo,
  Music,
  Image,
  Layers
} from 'lucide-react';
import { useVideoEditorStore } from '../../stores/videoEditorStore';
import { VideoPreview } from './preview/VideoPreview';
import { Timeline } from './timeline/Timeline';
import { EditingTools } from './tools/EditingTools';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { AIPanel } from './ai/AIPanel';
import { ProjectManager } from '../../services/ProjectManager';

interface EditorProps {
  onSwitchToRecorder: () => void;
}

export const Editor: React.FC<EditorProps> = ({ onSwitchToRecorder }) => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [projectManager] = useState(() => new ProjectManager());

  const {
    currentProject,
    projectModified,
    createNewProject,
    loadProject,
    saveProject,
    addTrack,
    playback,
    play,
    pause
  } = useVideoEditorStore();

  // Handle keyboard shortcuts
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
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSaveProject();
          }
          break;
        case 'o':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleOpenProject();
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowNewProjectDialog(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playback.isPlaying, play, pause]);

  // Project management handlers
  const handleNewProject = () => {
    const project = projectManager.createNewProject('Untitled Project');
    createNewProject(project.settings);
    setShowNewProjectDialog(false);
  };

  const handleOpenProject = async () => {
    try {
      // In a real implementation, this would open a file dialog
      console.log('Open project dialog would appear here');
    } catch (error) {
      console.error('Error opening project:', error);
    }
  };

  const handleSaveProject = async () => {
    if (!currentProject) return;

    try {
      await saveProject();
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleExportProject = () => {
    // TODO: Implement export functionality
    console.log('Export project');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-white">
                {currentProject ? currentProject.name : 'Video Editor'}
                {projectModified && <span className="text-yellow-400 ml-1">*</span>}
              </h1>
              <p className="text-sm text-gray-400">
                {currentProject
                  ? `${currentProject.settings.width}x${currentProject.settings.height} • ${currentProject.settings.frameRate}fps`
                  : 'Professional video editing suite'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Project Actions */}
            <button
              onClick={() => setShowNewProjectDialog(true)}
              className="btn-ghost flex items-center space-x-2"
              title="New Project (Ctrl+N)"
            >
              <Plus size={18} />
              <span>New</span>
            </button>

            <button
              onClick={handleOpenProject}
              className="btn-ghost flex items-center space-x-2"
              title="Open Project (Ctrl+O)"
            >
              <FolderOpen size={18} />
              <span>Open</span>
            </button>

            <button
              onClick={handleSaveProject}
              disabled={!currentProject || !projectModified}
              className="btn-ghost flex items-center space-x-2 disabled:opacity-50"
              title="Save Project (Ctrl+S)"
            >
              <Save size={18} />
              <span>Save</span>
            </button>

            <button
              onClick={handleExportProject}
              disabled={!currentProject}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              title="Export Video"
            >
              <Download size={18} />
              <span>Export</span>
            </button>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            <button
              onClick={onSwitchToRecorder}
              className="btn-secondary flex items-center space-x-2"
              title="New Recording"
            >
              <Video size={18} />
              <span>Record</span>
            </button>
          </div>
        </div>
      </div>

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
      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 rounded-xl p-6 w-96 border border-gray-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My Video Project"
                  defaultValue="Untitled Project"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Resolution</label>
                  <select className="input text-sm">
                    <option value="1920x1080">1920x1080 (Full HD)</option>
                    <option value="1280x720">1280x720 (HD)</option>
                    <option value="2560x1440">2560x1440 (2K)</option>
                    <option value="3840x2160">3840x2160 (4K)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Frame Rate</label>
                  <select className="input text-sm">
                    <option value="24">24 FPS</option>
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewProjectDialog(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleNewProject}
                className="btn-primary"
              >
                Create Project
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {!currentProject && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center">
            <Video size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Welcome to KwikShot Editor</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Create a new project or open an existing one to start editing your videos
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowNewProjectDialog(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>New Project</span>
              </button>
              <button
                onClick={handleOpenProject}
                className="btn-secondary flex items-center space-x-2"
              >
                <FolderOpen size={20} />
                <span>Open Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
