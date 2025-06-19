import React from 'react';
import {
  Video,
  FolderOpen,
  Save,
  Download,
  Plus,
  Layers,
  Grid3X3,
  Mic
} from 'lucide-react';

interface EditorHeaderProps {
  currentProject: any;
  projectModified: boolean;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onSwitchToRecorder: () => void;
  editorMode?: 'standard' | 'multicam' | 'podcast';
  onEditorModeChange?: (mode: 'standard' | 'multicam' | 'podcast') => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  currentProject,
  projectModified,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExportProject,
  onSwitchToRecorder,
  editorMode = 'standard',
  onEditorModeChange
}) => {
  return (
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
          {/* Editor Mode Selector */}
          {currentProject && onEditorModeChange && (
            <div className="flex items-center space-x-1 mr-4">
              <button
                onClick={() => onEditorModeChange('standard')}
                className={`btn-ghost text-sm px-3 py-1 ${
                  editorMode === 'standard' ? 'bg-blue-600 text-white' : ''
                }`}
                title="Standard editing mode"
              >
                <Layers size={14} />
              </button>
              <button
                onClick={() => onEditorModeChange('multicam')}
                className={`btn-ghost text-sm px-3 py-1 ${
                  editorMode === 'multicam' ? 'bg-blue-600 text-white' : ''
                }`}
                title="Multicam editing mode"
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => onEditorModeChange('podcast')}
                className={`btn-ghost text-sm px-3 py-1 ${
                  editorMode === 'podcast' ? 'bg-blue-600 text-white' : ''
                }`}
                title="Podcast editing mode"
              >
                <Mic size={14} />
              </button>
            </div>
          )}

          {/* Project Actions */}
          <button
            onClick={onNewProject}
            className="btn-ghost flex items-center space-x-2"
            title="New Project (Ctrl+N)"
          >
            <Plus size={18} />
            <span>New</span>
          </button>

          <button
            onClick={onOpenProject}
            className="btn-ghost flex items-center space-x-2"
            title="Open Project (Ctrl+O)"
          >
            <FolderOpen size={18} />
            <span>Open</span>
          </button>

          <button
            onClick={onSaveProject}
            disabled={!currentProject || !projectModified}
            className="btn-ghost flex items-center space-x-2 disabled:opacity-50"
            title="Save Project (Ctrl+S)"
          >
            <Save size={18} />
            <span>Save</span>
          </button>

          <button
            onClick={onExportProject}
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
  );
};
