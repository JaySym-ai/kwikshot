import { useState, useEffect } from 'react';
import { useVideoEditorStore } from '../stores/videoEditorStore';
import { ProjectManager } from '../services/ProjectManager';

export const useProjectManager = () => {
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

  return {
    showNewProjectDialog,
    setShowNewProjectDialog,
    currentProject,
    projectModified,
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleExportProject
  };
};
